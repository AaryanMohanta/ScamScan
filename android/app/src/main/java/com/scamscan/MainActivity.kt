package com.scamscan

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.scamscan.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    private val prefs by lazy { getSharedPreferences("scamscan", Context.MODE_PRIVATE) }

    // Permissions we need upfront
    private val requiredPermissions = arrayOf(
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.READ_PHONE_STATE,
        Manifest.permission.READ_CALL_LOG,
    )

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val denied = results.filter { !it.value }.keys
        if (denied.isEmpty()) {
            checkOverlayPermission()
        } else {
            Toast.makeText(this, "Permissions required: ${denied.joinToString()}", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Restore saved server URL
        binding.etServerUrl.setText(
            prefs.getString("server_url", "ws://10.0.2.2:8000")
        )

        binding.btnSave.setOnClickListener { saveSettings() }
        binding.btnRequestPermissions.setOnClickListener { requestAllPermissions() }
        binding.btnOverlayPermission.setOnClickListener { checkOverlayPermission() }

        updatePermissionStatus()
    }

    override fun onResume() {
        super.onResume()
        updatePermissionStatus()
    }

    private fun saveSettings() {
        val url = binding.etServerUrl.text.toString().trim()
        if (url.isEmpty()) {
            binding.etServerUrl.error = "Enter the backend WebSocket URL"
            return
        }
        prefs.edit().putString("server_url", url).apply()
        Toast.makeText(this, "Settings saved", Toast.LENGTH_SHORT).show()
    }

    private fun requestAllPermissions() {
        val missing = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isEmpty()) {
            checkOverlayPermission()
        } else {
            permissionLauncher.launch(missing.toTypedArray())
        }
    }

    private fun checkOverlayPermission() {
        if (!Settings.canDrawOverlays(this)) {
            AlertDialog.Builder(this)
                .setTitle("Overlay Permission Required")
                .setMessage(
                    "ScamScan needs to display a floating alert during calls. " +
                    "Please enable \"Display over other apps\" on the next screen."
                )
                .setPositiveButton("Open Settings") { _, _ ->
                    startActivity(
                        Intent(
                            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            Uri.parse("package:$packageName")
                        )
                    )
                }
                .setNegativeButton("Cancel", null)
                .show()
        } else {
            updatePermissionStatus()
        }
    }

    private fun updatePermissionStatus() {
        val allGranted = requiredPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
        val overlayGranted = Settings.canDrawOverlays(this)

        binding.tvPermissionStatus.text = buildString {
            append(if (allGranted) "✓" else "✗")
            append("  Audio & Phone permissions\n")
            append(if (overlayGranted) "✓" else "✗")
            append("  Overlay (display over calls)")
        }

        val ready = allGranted && overlayGranted
        binding.tvStatus.text = if (ready)
            "Ready — ScamScan will auto-activate when a call starts"
        else
            "Complete the setup above to enable live call detection"

        binding.statusIndicator.setBackgroundResource(
            if (ready) R.drawable.dot_green else R.drawable.dot_red
        )
    }
}
