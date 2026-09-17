package com.healthnova.gateway.domain.model

import java.util.UUID

data class MobileEvent(
    val id: String = UUID.randomUUID().toString(),
    val deviceId: String,
    val eventType: String, // SMS_RECEIVED, CALL_RECEIVED, APP_NOTIFICATION, SYSTEM_EVENT
    val source: String, // Phone number or package name
    val timestamp: Long = System.currentTimeMillis(),
    val content: String,
    val metadata: Map<String, String> = emptyMap(),
    val classification: DataClassification = DataClassification.UNKNOWN,
    val processingStatus: ProcessingStatus = ProcessingStatus.RECEIVED,
    val idempotencyKey: String = UUID.randomUUID().toString(),
    val createdAt: Long = System.currentTimeMillis()
)
