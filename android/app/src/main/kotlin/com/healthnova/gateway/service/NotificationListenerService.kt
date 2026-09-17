package com.healthnova.gateway.service

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.healthnova.gateway.normalization.EventNormalizer
import com.healthnova.gateway.queue.EncryptedEventQueue

class NotificationListenerService : NotificationListenerService() {

    companion object {
        var sharedQueue: EncryptedEventQueue? = null
        var currentDeviceId: String = "local-android-device"

        // Approved application package allowlist
        val APPROVED_PACKAGES = setOf(
            "com.healthnova.patient",
            "com.google.android.apps.messaging",
            "org.thoughtcrime.securesms"
        )
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null) return

        val packageName = sbn.packageName ?: return

        // Package Allowlist Enforcement: Ignore unauthorized third party applications
        if (packageName !in APPROVED_PACKAGES) {
            return
        }

        val extras = sbn.notification?.extras ?: return
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""

        val event = EventNormalizer.normalizeNotification(
            deviceId = currentDeviceId,
            packageName = packageName,
            title = title,
            body = text,
            timestamp = sbn.postTime
        )

        sharedQueue?.enqueue(event)
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        // No action needed on dismiss
    }
}
