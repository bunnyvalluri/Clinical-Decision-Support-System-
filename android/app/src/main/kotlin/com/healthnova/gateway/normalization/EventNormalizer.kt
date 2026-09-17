package com.healthnova.gateway.normalization

import com.healthnova.gateway.domain.model.MobileEvent
import com.healthnova.gateway.domain.model.ProcessingStatus
import com.healthnova.gateway.privacy.PrivacyClassifier
import java.util.UUID

object EventNormalizer {

    fun normalizeSms(
        deviceId: String,
        sender: String,
        body: String,
        timestamp: Long = System.currentTimeMillis()
    ): MobileEvent {
        val sanitizedSender = sender.trim().take(32)
        val classificationResult = PrivacyClassifier.classifyAndSanitize(body)

        val status = if (classificationResult.isBlocked) {
            ProcessingStatus.BLOCKED
        } else if (classificationResult.sanitizedContent != body) {
            ProcessingStatus.REDACTED
        } else {
            ProcessingStatus.RECEIVED
        }

        return MobileEvent(
            id = UUID.randomUUID().toString(),
            deviceId = deviceId,
            eventType = "SMS_RECEIVED",
            source = sanitizedSender,
            timestamp = timestamp,
            content = classificationResult.sanitizedContent,
            classification = classificationResult.classification,
            processingStatus = status,
            idempotencyKey = "sms_${deviceId}_${timestamp}_${sanitizedSender.hashCode()}"
        )
    }

    fun normalizeCall(
        deviceId: String,
        incomingNumber: String,
        timestamp: Long = System.currentTimeMillis()
    ): MobileEvent {
        // Minimal necessary metadata only: NO audio recording
        val sanitizedNumber = incomingNumber.trim().take(32)
        val classificationResult = PrivacyClassifier.classifyAndSanitize("Call metadata from $sanitizedNumber")

        return MobileEvent(
            id = UUID.randomUUID().toString(),
            deviceId = deviceId,
            eventType = "CALL_RECEIVED",
            source = sanitizedNumber,
            timestamp = timestamp,
            content = "Call event logged. No voice data captured.",
            classification = classificationResult.classification,
            processingStatus = ProcessingStatus.RECEIVED,
            idempotencyKey = "call_${deviceId}_${timestamp}_${sanitizedNumber.hashCode()}"
        )
    }

    fun normalizeNotification(
        deviceId: String,
        packageName: String,
        title: String,
        body: String,
        timestamp: Long = System.currentTimeMillis()
    ): MobileEvent {
        val combinedText = "$title: $body"
        val classificationResult = PrivacyClassifier.classifyAndSanitize(combinedText)

        val status = if (classificationResult.isBlocked) {
            ProcessingStatus.BLOCKED
        } else if (classificationResult.sanitizedContent != combinedText) {
            ProcessingStatus.REDACTED
        } else {
            ProcessingStatus.RECEIVED
        }

        return MobileEvent(
            id = UUID.randomUUID().toString(),
            deviceId = deviceId,
            eventType = "APP_NOTIFICATION",
            source = packageName.trim().take(128),
            timestamp = timestamp,
            content = classificationResult.sanitizedContent,
            classification = classificationResult.classification,
            processingStatus = status,
            idempotencyKey = "notif_${deviceId}_${timestamp}_${packageName.hashCode()}"
        )
    }
}
