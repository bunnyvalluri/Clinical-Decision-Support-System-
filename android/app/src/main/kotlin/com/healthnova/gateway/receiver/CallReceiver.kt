package com.healthnova.gateway.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import com.healthnova.gateway.normalization.EventNormalizer
import com.healthnova.gateway.queue.EncryptedEventQueue

class CallReceiver(
    private val deviceId: String = "local-android-device",
    private val eventQueue: EncryptedEventQueue? = null
) : BroadcastReceiver() {

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return

        val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
        if (state == TelephonyManager.EXTRA_STATE_RINGING) {
            val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER) ?: "UNKNOWN"
            val normalizedEvent = EventNormalizer.normalizeCall(
                deviceId = deviceId,
                incomingNumber = incomingNumber,
                timestamp = System.currentTimeMillis()
            )
            eventQueue?.enqueue(normalizedEvent)
        }
    }
}
