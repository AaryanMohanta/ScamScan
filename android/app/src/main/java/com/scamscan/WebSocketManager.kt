package com.scamscan

import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.*
import okio.ByteString.Companion.toByteString
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume

data class ScanResult(
    val chunk: Int,
    val transcript: String,
    val riskLevel: String,
    val scamScore: Float,
    val advice: String,
)

/**
 * Manages the OkHttp WebSocket connection to the FastAPI backend.
 * Sends binary WAV chunks and delivers parsed [ScanResult]s via [onResult].
 */
class WebSocketManager(
    private val url: String,
    private val onResult: (ScanResult) -> Unit,
) {
    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)   // no timeout for streaming
        .build()

    private var webSocket: WebSocket? = null

    suspend fun connect() = suspendCancellableCoroutine { cont ->
        val request = Request.Builder().url(url).build()

        val listener = object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                webSocket = ws
                if (cont.isActive) cont.resume(Unit)
            }

            override fun onMessage(ws: WebSocket, text: String) {
                parseAndDeliver(text)
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                if (cont.isActive) cont.resume(Unit)   // don't crash — degrade gracefully
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                webSocket = null
            }
        }

        client.newWebSocket(request, listener)

        cont.invokeOnCancellation { webSocket?.close(1000, "Cancelled") }
    }

    fun sendChunk(wav: ByteArray) {
        webSocket?.send(wav.toByteString())
    }

    fun disconnect() {
        webSocket?.close(1000, "Call ended")
        webSocket = null
    }

    private fun parseAndDeliver(json: String) {
        runCatching {
            val obj = JSONObject(json)
            ScanResult(
                chunk      = obj.optInt("chunk", 0),
                transcript = obj.optString("transcript", ""),
                riskLevel  = obj.optString("risk_level", "Low"),
                scamScore  = obj.optDouble("scam_score", 0.0).toFloat(),
                advice     = obj.optString("advice", ""),
            )
        }.onSuccess { onResult(it) }
    }
}
