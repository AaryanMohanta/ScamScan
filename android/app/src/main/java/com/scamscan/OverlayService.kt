package com.scamscan

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.IBinder
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.WindowManager
import android.widget.TextView
import androidx.core.app.NotificationCompat

/**
 * Displays a small floating overlay on top of the call screen showing
 * the current scam risk level. Updates in real-time as chunks are analysed.
 */
class OverlayService : Service() {

    companion object {
        const val EXTRA_RISK_LEVEL = "risk_level"
        const val EXTRA_ADVICE     = "advice"
        const val EXTRA_SCORE      = "score"
        private const val CHANNEL_ID = "scamscan_overlay"
        private const val NOTIF_ID   = 1002
    }

    private var overlayView: android.view.View? = null
    private lateinit var wm: WindowManager

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        wm = getSystemService(WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Must be called on every startForegroundService() invocation
        startForeground(NOTIF_ID, buildNotification())

        val riskLevel = intent?.getStringExtra(EXTRA_RISK_LEVEL) ?: "SCANNING"
        val advice    = intent?.getStringExtra(EXTRA_ADVICE)     ?: "Analysing call…"
        val score     = intent?.getFloatExtra(EXTRA_SCORE, 0f)   ?: 0f

        if (overlayView == null) showOverlay(advice, riskLevel, score)
        else updateOverlay(riskLevel, advice, score)

        return START_NOT_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        removeOverlay()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ── Notification (required for foreground service) ────────────────────────

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID, "ScamScan Overlay", NotificationManager.IMPORTANCE_MIN
        ).apply { description = "ScamScan overlay active during call" }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun buildNotification(): Notification =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ScamScan")
            .setContentText("Overlay active")
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build()

    // ── Overlay management ───────────────────────────────────────────────────

    private fun showOverlay(advice: String, riskLevel: String, score: Float) {
        if (overlayView != null) return

        val inflater = LayoutInflater.from(this)
        val view = inflater.inflate(R.layout.overlay_alert, null)

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
            // SYSTEM_ALERT_WINDOW not granted — overlay silently unavailable
            Log.w("OverlayService", "Overlay permission not granted: ${e.message}")
        }
    }

    private fun updateOverlay(riskLevel: String, advice: String, score: Float) {
        overlayView?.let { bindOverlayData(it, riskLevel, advice, score) }
            ?: showOverlay(advice, riskLevel, score)
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
        container.setBackgroundColor(bgColor)
    }
}
