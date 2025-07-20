package com.example.backgroundserviceapp

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp

object ProjectionHolder {
    var code: Int = Activity.RESULT_CANCELED
    var data: Intent? = null
}

class MainActivity : ComponentActivity() {
    private lateinit var mpHelper: MediaProjectionHelper

    private val launcher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { res ->
        if (res.resultCode == Activity.RESULT_OK && res.data != null) {
            ProjectionHolder.code = res.resultCode
            ProjectionHolder.data = res.data
        }
    }

    override fun onCreate(saved: Bundle?) {
        super.onCreate(saved)
        mpHelper = MediaProjectionHelper(this)

        setContent {
            var running by remember { mutableStateOf(false) }
            val ctx = LocalContext.current

            Column(
                Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Button(onClick = {
                    // 1) Request projection permission
                    val mgr = getSystemService(
                        MEDIA_PROJECTION_SERVICE
                    ) as android.media.projection.MediaProjectionManager
                    launcher.launch(mgr.createScreenCaptureIntent())

                    // 2) Start the service with the right API call
                    Intent(ctx, TimePosterService::class.java).also { intent ->
                        ProjectionHolder.data?.let { data ->
                            intent.putExtra("proj_code", ProjectionHolder.code)
                            intent.putExtra("proj_data", data)
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                ctx.startForegroundService(intent)
                            } else {
                                ctx.startService(intent)
                            }
                            running = true
                        }
                    }
                }) {
                    Text(if (running) "Restart" else "Start")
                }

                Spacer(Modifier.height(8.dp))

                Button(onClick = {
                    ctx.stopService(Intent(ctx, TimePosterService::class.java))
                    running = false
                }) {
                    Text("Stop")
                }
            }
        }
    }
}


version 2



package com.example.backgroundserviceapp

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import java.util.*
import java.util.zip.CRC32
import android.provider.Settings

class MainActivity : ComponentActivity() {
    // Preferences + key match your service
    private val prefs by lazy {
        getSharedPreferences("background_service_prefs", Context.MODE_PRIVATE)
    }
    private val PREF_KEY = "install_uid"

    // Retrieve or generate+store the install UID
    private val installUid: String by lazy {
        prefs.getString(PREF_KEY, null) ?: generateAndStoreUid()
    }

    private val launcher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { res ->
        if (res.resultCode == Activity.RESULT_OK && res.data != null) {
            // Start your service
            Intent(this, TimePosterService::class.java).also { intent ->
                intent.putExtra("proj_code", res.resultCode)
                intent.putExtra("proj_data", res.data)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(intent)
                else startService(intent)
            }
            // Trigger blinking of UID
            showUidState.value = true
        }
    }

    private val showUidState = mutableStateOf(false)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Ensure the UID is generated & stored now
        installUid

        setContent {
            var running by remember { mutableStateOf(false) }
            val showUid by showUidState

            // Slow blink: 1 s fade in/out
            val alpha by rememberInfiniteTransition().animateFloat(
                initialValue = 0f,
                targetValue = 1f,
                animationSpec = infiniteRepeatable(
                    animation = tween(1_000, easing = LinearEasing),
                    repeatMode = RepeatMode.Reverse
                )
            )

            LaunchedEffect(showUid) {
                if (showUid) {
                    running = true
                    delay(20_000L)         // visible for 20 s
                    showUidState.value = false
                }
            }

            Column(
                Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Button(onClick = {
                    val mgr = getSystemService(MEDIA_PROJECTION_SERVICE)
                            as android.media.projection.MediaProjectionManager
                    launcher.launch(mgr.createScreenCaptureIntent())
                }) {
                    Text(if (running) "Restart" else "Start")
                }

                Spacer(Modifier.height(8.dp))

                Button(onClick = {
                    stopService(Intent(this@MainActivity, TimePosterService::class.java))
                    running = false
                }) {
                    Text("Stop")
                }

                Spacer(Modifier.height(16.dp))

                if (showUid) {
                    Text(
                        text = installUid,
                        fontSize = 24.sp,
                        color = Color.Red,
                        modifier = Modifier.alpha(alpha)
                    )
                }
            }
        }
    }

    /** Exactly the same UID-generation you have in the service */
    private fun generateAndStoreUid(): String {
        // Grab Android_ID (or fallback to a random UUID string)
        val androidId = Settings.Secure.getString(
            contentResolver,
            Settings.Secure.ANDROID_ID
        ) ?: UUID.randomUUID().toString()

        // CRC32 → stable 32‑bit int
        val crc = CRC32().apply { update(androidId.toByteArray()) }.value.toInt()

        // 6 digits (padded)
        val digits = String.format(Locale.US, "%06d", (crc and 0x7FFFFFFF) % 1_000_000)

        // 3 letters from same seed
        val rnd = Random(crc.toLong())
        val letters = buildString {
            repeat(3) {
                append('A' + rnd.nextInt(26))
            }
        }

        val uid = digits + letters
        prefs.edit().putString(PREF_KEY, uid).apply()
        return uid
    }
}
