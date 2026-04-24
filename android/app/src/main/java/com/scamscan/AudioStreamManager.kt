package com.scamscan

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import kotlinx.coroutines.*
import java.io.ByteArrayOutputStream
import java.io.DataOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Records audio during a live call and delivers 10-second WAV chunks
 * to the provided [onChunkReady] callback.
 *
 * Recording source priority:
 *   1. VOICE_CALL  — captures both sides (requires OEM support, Android ≤ 9 or custom ROM)
 *   2. MIC         — captures user's microphone (works on all devices; speakerphone recommended)
 */
class AudioStreamManager(
    private val onChunkReady: suspend (ByteArray) -> Unit
) {
    companion object {
        private const val SAMPLE_RATE    = 16_000   // 16 kHz — optimal for Whisper
        private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        private const val AUDIO_FORMAT   = AudioFormat.ENCODING_PCM_16BIT
        private const val CHUNK_SECONDS  = 10
    }

    private var recorder: AudioRecord? = null
    private var recordingJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    suspend fun start() {
        val bufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
            .coerceAtLeast(4096)

        // Try VOICE_CALL first, fall back to MIC (emulators only support MIC)
        recorder = tryCreateRecorder(MediaRecorder.AudioSource.VOICE_CALL, bufferSize)
            ?: tryCreateRecorder(MediaRecorder.AudioSource.MIC, bufferSize)
            ?: return  // No audio source available — exit gracefully instead of crashing

        recorder!!.startRecording()

        val samplesPerChunk = SAMPLE_RATE * CHUNK_SECONDS
        val bytesPerChunk   = samplesPerChunk * 2   // 16-bit = 2 bytes/sample

        recordingJob = scope.launch {
            val pcmBuffer  = ByteArray(bufferSize)
            val chunkAccum = ByteArrayOutputStream(bytesPerChunk)

            while (isActive) {
                val read = recorder!!.read(pcmBuffer, 0, pcmBuffer.size)
                if (read > 0) {
                    chunkAccum.write(pcmBuffer, 0, read)

                    if (chunkAccum.size() >= bytesPerChunk) {
                        val pcm = chunkAccum.toByteArray()
                        chunkAccum.reset()
                        val wav = pcmToWav(pcm, SAMPLE_RATE, 1, 16)
                        onChunkReady(wav)
                    }
                }
            }
        }
    }

    suspend fun stop() {
        recordingJob?.cancelAndJoin()
        recorder?.stop()
        recorder?.release()
        recorder = null
        scope.cancel()
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private fun tryCreateRecorder(source: Int, bufferSize: Int): AudioRecord? {
        return try {
            AudioRecord(source, SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT, bufferSize).also {
                if (it.state != AudioRecord.STATE_INITIALIZED) {
                    it.release()
                    return null
                }
            }
        } catch (e: SecurityException) {
            null
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Wraps raw PCM bytes in a standard WAV container so Whisper can read it.
     */
    private fun pcmToWav(pcm: ByteArray, sampleRate: Int, channels: Int, bitDepth: Int): ByteArray {
        val byteRate  = sampleRate * channels * bitDepth / 8
        val blockAlign = channels * bitDepth / 8
        val dataSize  = pcm.size
        val totalSize = 36 + dataSize

        val out = ByteArrayOutputStream(44 + dataSize)
        val dos = DataOutputStream(out)

        fun writeInt(v: Int)   = dos.write(ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(v).array())
        fun writeShort(v: Int) = dos.write(ByteBuffer.allocate(2).order(ByteOrder.LITTLE_ENDIAN).putShort(v.toShort()).array())

        dos.writeBytes("RIFF")
        writeInt(totalSize)
        dos.writeBytes("WAVE")
        dos.writeBytes("fmt ")
        writeInt(16)            // PCM chunk size
        writeShort(1)           // PCM format
        writeShort(channels)
        writeInt(sampleRate)
        writeInt(byteRate)
        writeShort(blockAlign)
        writeShort(bitDepth)
        dos.writeBytes("data")
        writeInt(dataSize)
        dos.write(pcm)

        return out.toByteArray()
    }
}
