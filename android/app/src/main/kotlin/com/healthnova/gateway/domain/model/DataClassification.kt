package com.healthnova.gateway.domain.model

enum class DataClassification {
    PUBLIC,
    LOW_SENSITIVITY,
    SENSITIVE,
    PHI,
    OTP,
    AUTHENTICATION_SECRET,
    FINANCIAL,
    UNKNOWN;

    val isPermittedForTransmission: Boolean
        get() = this != UNKNOWN && this != OTP && this != AUTHENTICATION_SECRET
}
