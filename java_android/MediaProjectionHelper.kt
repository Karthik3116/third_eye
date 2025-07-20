package com.example.backgroundserviceapp

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Handler
import android.os.HandlerThread
import android.util.Base64
import java.io.ByteArrayOutputStream

class MediaProjectionHelper(private val ctx: Context) {
    private var projection: MediaProjection? = null
    private var reader: ImageReader? = null
    private var display: VirtualDisplay? = null
    private val handler: Handler

    init {
        val thread = HandlerThread("mp-thread").also { it.start() }
        handler = Handler(thread.looper)
    }

    fun setProjection(resultCode: Int, data: Intent) {
        val mgr = ctx.getSystemService(Context.MEDIA_PROJECTION_SERVICE)
                as MediaProjectionManager
        projection = mgr.getMediaProjection(resultCode, data)
    }

    fun captureOnce(width: Int, height: Int, callback: (String) -> Unit) {
        val mp = projection ?: run {
            callback("")
            return
        }

        display?.release()
        reader?.close()

        val density = ctx.resources.displayMetrics.densityDpi
        reader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)

        display = mp.createVirtualDisplay(
            "capture",
            width, height, density,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            reader!!.surface, null, handler
        )

        reader!!.setOnImageAvailableListener({ r ->
            val img = r.acquireLatestImage() ?: run {
                callback("")
                return@setOnImageAvailableListener
            }

            val plane = img.planes[0]
            val buf   = plane.buffer
            val px    = plane.pixelStride
            val rs    = plane.rowStride
            val pad   = rs - px * width

            val bmp = Bitmap.createBitmap(
                width + pad / px,
                height,
                Bitmap.Config.ARGB_8888
            )
            bmp.copyPixelsFromBuffer(buf)
            img.close()

            val crop = Bitmap.createBitmap(bmp, 0, 0, width, height)

            // ✅ Scale down (e.g., 1080×2254 → 540×1127)
            val scaled = Bitmap.createScaledBitmap(crop, width / 2, height / 2, true)

            // ✅ Compress to JPEG at low quality (e.g., 10%)
            val baos = ByteArrayOutputStream()
            scaled.compress(Bitmap.CompressFormat.JPEG, 10, baos)

            val b64 = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP)

            callback(b64)
            display?.release()
            reader?.close()
        }, handler)
    }
}









version 2 


package com.example.backgroundserviceapp

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjection.Callback
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.util.Base64
import java.io.ByteArrayOutputStream

class MediaProjectionHelper(private val ctx: Context) {
    private var projection: MediaProjection? = null
    private var reader: ImageReader? = null
    private var display: VirtualDisplay? = null
    private val handler: Handler

    init {
        val thread = HandlerThread("mp-thread").also { it.start() }
        handler = Handler(thread.looper)
    }

    /**
     * Call once, from your Service *after* startForeground().
     * Sets up the projection + single VirtualDisplay + ImageReader.
     */
    fun setProjection(resultCode: Int, data: Intent, width: Int, height: Int) {
        // 1) get the projection
        val mgr = ctx.getSystemService(Context.MEDIA_PROJECTION_SERVICE)
                as MediaProjectionManager

        projection = mgr.getMediaProjection(resultCode, data).apply {
            // Android 14+: register a callback so resources get released on stop()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                registerCallback(object : Callback() {
                    override fun onStop() {
                        cleanup()
                    }
                }, handler)
            }
        }

        // 2) single-shot ImageReader & VirtualDisplay
        reader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)
        display = projection!!.createVirtualDisplay(
            "bg-capture",
            width, height, ctx.resources.displayMetrics.densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            reader!!.surface, null, handler
        )
    }

    /**
     * Grab whatever the latest frame is, compress & call you back.
     * Never re-creates the VirtualDisplay.
     */
    fun captureOnce(callback: (String) -> Unit) {
        val r = reader ?: run {
            callback("")
            return
        }

        r.setOnImageAvailableListener({ info ->
            val img = info.acquireLatestImage() ?: run {
                callback("")
                return@setOnImageAvailableListener
            }
            // copy + crop + scale + JPEG @<10% + base64
            val plane = img.planes[0]
            val buf   = plane.buffer
            val px    = plane.pixelStride
            val rs    = plane.rowStride
            val pad   = rs - px * r.width

            val bmp = Bitmap.createBitmap(r.width + pad/px, r.height, Bitmap.Config.ARGB_8888)
            bmp.copyPixelsFromBuffer(buf)
            img.close()

            val crop   = Bitmap.createBitmap(bmp, 0, 0, r.width, r.height)
            val scaled = Bitmap.createScaledBitmap(crop, r.width/2, r.height/2, true)

            val baos = ByteArrayOutputStream()
            scaled.compress(Bitmap.CompressFormat.JPEG, 10, baos)
            val b64 = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP)

            callback(b64)
            // NB: we do NOT release() reader or display here—so the projection token stays valid.
        }, handler)
    }

    /** Tear everything down. */
    fun cleanup() {
        display?.release()
        reader?.close()
        projection?.stop()
        display = null
        reader = null
        projection = null
    }
}
