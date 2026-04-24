package com.scamscan

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.content.ContextCompat

/**
 * Listens for PHONE_STATE broadcasts and starts/stops CallMonitorService.
 * Registered in the Manifest so it works even when the app is in background.
 */
class CallReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return

        val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE) ?: return
        val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER) ?: ""

        val serviceIntent = Intent(context, CallMonitorService::class.java)

        when (state) {
            TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                // Guard: RECORD_AUDIO must be granted before we can start a microphone FGS
                val hasAudio = ContextCompat.checkSelfPermission(
                    context, Manifest.permission.RECORD_AUDIO
                ) == PackageManager.PERMISSION_GRANTED
                if (!hasAudio) {
                    Log.w("CallReceiver", "RECORD_AUDIO not granted — skipping call monitor")
                    return
                }
                // Call answered — start monitoring
                serviceIntent.putExtra(CallMonitorService.EXTRA_PHONE_NUMBER, incomingNumber)
                ContextCompat.startForegroundService(context, serviceIntent)
            }
            TelephonyManager.EXTRA_STATE_IDLE -> {
                // Call ended — stop monitoring
                Log.d("CallReceiver", "Call ended — stopping CallMonitorService")
                context.stopService(serviceIntent)
            }
        }
    }
}
