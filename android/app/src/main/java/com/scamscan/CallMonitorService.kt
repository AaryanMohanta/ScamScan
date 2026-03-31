package com.scamscan

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.graphics.PixelFormat
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.WindowManager
import android.widget.TextView
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleService
import kotlinx.coroutines.*

/**
 * Foreground service that lives for the duration of a phone call.
 * Manages AudioStreamManager (records + chunks audio),
 * WebSocketManager (streams chunks to backend, receives results),
 * and the floating overlay — all in one service to avoid foreground
 * service timing issues with a separate OverlayService.
 */
class CallMonitorService : LifecycleService() {

    companion object {
        const val EXTRA_PHONE_NUMBER = "phone_number"
        private const val CHANNEL_ID = "scamscan_monitor"
        private const val NOTIF_ID   = 1001
    }

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val mainHandler   = Handler(Looper.getMainLooper())

    private lateinit var audioManager: AudioStreamManager
    private lateinit var wsManager: WebSocketManager
    private var wakeLock: PowerManager.WakeLock? = null

    // ── Overlay ──────────────────────────────────────────────────────────────
    private var overlayView: android.view.View? = null
    private lateinit var wm: WindowManager

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        wm = getSystemService(WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)

        // Guard: without RECORD_AUDIO we cannot use a microphone foreground service
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            Log.w("CallMonitorService", "RECORD_AUDIO not granted — stopping self")
            stopSelf()
            return START_NOT_STICKY
        }

        val phoneNumber = intent?.getStringExtra(EXTRA_PHONE_NUMBER) ?: ""
        val prefs     = getSharedPreferences("scamscan", Context.MODE_PRIVATE)
        val serverUrl = prefs.getString("server_url", "ws://10.0.2.2:8000") ?: "ws://10.0.2.2:8000"
        val wsUrl     = "$serverUrl/ws/live-call?phone_number=${phoneNumber.ifEmpty { "" }}"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIF_ID,
                buildNotification("Monitoring call…"),
                ServiceInfo.FOREGROUND_SERVICE_TYPE_REMOTE_MESSAGING
            )
        } else {
            startForeground(NOTIF_ID, buildNotification("Monitoring call…"))
        }

        acquireWakeLock()
        showOrUpdateOverlay("Analysing call…", "SCANNING", 0f)

        wsManager = WebSocketManager(wsUrl) { result ->
            mainHandler.post {
                updateNotification("Risk: ${result.riskLevel}")
                showOrUpdateOverlay(result.advice, result.riskLevel, result.scamScore)
            }
        }

        audioManager = AudioStreamManager { wavChunk ->
            wsManager.sendChunk(wavChunk)
        }

        serviceScope.launch {
            wsManager.connect()
            audioManager.start()
        }

        return START_NOT_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.launch {
            audioManager.stop()
            wsManager.disconnect()
        }
        serviceScope.cancel()
        wakeLock?.release()
        removeOverlay()
    }

    override fun onBind(intent: Intent): IBinder? {
        super.onBind(intent)
        return null
    }

    // ── Overlay management ───────────────────────────────────────────────────

    private fun showOrUpdateOverlay(advice: String, riskLevel: String, score: Float) {
        if (overlayView == null) showOverlay(advice, riskLevel, score)
        else bindOverlayData(overlayView!!, riskLevel, advice, score)
    }

    private fun showOverlay(advice: String, riskLevel: String, score: Float) {
        if (overlayView != null) return

        val view = LayoutInflater.from(this).inflate(R.layout.overlay_alert, null)

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.END
            x = 16
            y = 120
        }

        try {
            wm.addView(view, params)
            overlayView = view
            bindOverlayData(view, riskLevel, advice, score)
        } catch (e: WindowManager.BadTokenException) {
            Log.w("CallMonitorService", "Overlay permission not granted: ${e.message}")
        }
    }

    private fun removeOverlay() {
        overlayView?.let {
            try { wm.removeView(it) } catch (_: Exception) {}
        }
        overlayView = null
    }

    private fun bindOverlayData(
        view: android.view.View,
        riskLevel: String,
        advice: String,
        score: Float,
    ) {
        val tvRisk    = view.findViewById<TextView>(R.id.tvRiskLevel)
        val tvScore   = view.findViewById<TextView>(R.id.tvScore)
        val tvAdvice  = view.findViewById<TextView>(R.id.tvAdvice)
        val container = view.findViewById<android.view.View>(R.id.overlayContainer)

        val (label, bgColor, textColor) = when (riskLevel.uppercase()) {
            "HIGH"   -> Triple("⚠️ CRITICAL THREAT", Color.parseColor("#FF4D6A"), Color.WHITE)
            "MEDIUM" -> Triple("👁 SUSPICIOUS",      Color.parseColor("#FFB020"), Color.parseColor("#1A0A00"))
            "LOW"    -> Triple("🛡 SAFE",             Color.parseColor("#34D399"), Color.parseColor("#00180D"))
            else     -> Triple("⏳ SCANNING…",        Color.parseColor("#8B5CF6"), Color.WHITE)
        }

        tvRisk.text   = label
        tvRisk.setTextColor(textColor)
        tvScore.text  = "${(score * 100).toInt()}%"
        tvScore.setTextColor(textColor)
        tvAdvice.text = advice.take(80)
        tvAdvice.setTextColor(textColor)

        // Keep rounded corners, just swap the fill colour
        val bg = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 40f
            setColor(bgColor)
            alpha = 220   // ~86% opacity
        }
        container.background = bg
    }

    // ── Notification ─────────────────────────────────────────────────────────

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID, "ScamScan Monitor", NotificationManager.IMPORTANCE_LOW
        ).apply { description = "Active while monitoring a phone call" }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun buildNotification(text: String): Notification {
        val tapIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ScamScan")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentIntent(tapIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(text: String) {
        getSystemService(NotificationManager::class.java).notify(NOTIF_ID, buildNotification(text))
    }

    // ── Wake lock ────────────────────────────────────────────────────────────

    private fun acquireWakeLock() {
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "ScamScan:CallMonitor")
        wakeLock?.acquire(30 * 60 * 1000L)
    }
}
