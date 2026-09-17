package com.healthnova.gateway.domain.model

enum class ProcessingStatus {
    RECEIVED,
    CLASSIFIED,
    BLOCKED,
    REDACTED,
    APPROVED,
    QUEUED,
    SENDING,
    DELIVERED,
    FAILED,
    RETRYING,
    DEAD_LETTER,
    EXPIRED,
    CANCELLED
}
