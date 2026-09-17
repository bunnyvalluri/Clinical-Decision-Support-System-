package com.healthnova.gateway.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.healthnova.gateway.normalization.EventNormalizer
import com.healthnova.gateway.queue.EncryptedEventQueue

class SmsReceiver(
    private val deviceId: String = "local-android-device",
    private val eventQueue: EncryptedEventQueue? = null
) : BroadcastReceiver() {

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) return

        for (sms in messages) {
            val sender = sms.displayOriginatingAddress ?: "UNKNOWN"
            val body = sms.displayMessageBody ?: ""
            val timestamp = sms.timestampMillis

            val normalizedEvent = EventNormalizer.normalizeSms(
                deviceId = deviceId,
                sender = sender,
                body = body,
                timestamp = timestamp
            )

            // Buffers in bounded encrypted queue if provided
            eventQueue?.enqueue(normalizedEvent)
        }
    }
}
