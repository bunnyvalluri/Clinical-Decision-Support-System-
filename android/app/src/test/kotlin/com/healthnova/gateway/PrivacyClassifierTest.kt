package com.healthnova.gateway

import com.healthnova.gateway.domain.model.DataClassification
import com.healthnova.gateway.privacy.PrivacyClassifier
import org.junit.Assert.*
import org.junit.Test

class PrivacyClassifierTest {

    @Test
    fun testOtpDetectionAndBlocking() {
        val otpMessage = "Your verification code is 849201. Do not share this OTP."
        val result = PrivacyClassifier.classifyAndSanitize(otpMessage)

        assertEquals(DataClassification.OTP, result.classification)
        assertTrue("OTP message must be blocked by default", result.isBlocked)
        assertTrue("Content must be redacted", result.sanitizedContent.contains("[REDACTED_OTP]"))
        assertFalse("Raw OTP digits must not remain in output", result.sanitizedContent.contains("849201"))
    }

    @Test
    fun testSecretDetectionAndBlocking() {
        val secretMessage = "Server alert with api_key: 9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c"
        val result = PrivacyClassifier.classifyAndSanitize(secretMessage)

        assertEquals(DataClassification.AUTHENTICATION_SECRET, result.classification)
        assertTrue("Secret message must be strictly blocked", result.isBlocked)
        assertTrue("Secret must be redacted", result.sanitizedContent.contains("[REDACTED_SECRET]"))
    }

    @Test
    fun testPhiRedaction() {
        val phiMessage = "Patient MRN-98412 admitted for chemotherapy with blood pressure 140/90"
        val result = PrivacyClassifier.classifyAndSanitize(phiMessage)

        assertEquals(DataClassification.PHI, result.classification)
        assertFalse("PHI message is classified as PHI", result.isBlocked)
        assertTrue("Medical records and clinical terms must be redacted", result.sanitizedContent.contains("[REDACTED_PHI]"))
    }

    @Test
    fun testDefaultDenyOnUnknown() {
        val unknownMessage = "Just a random non-operational non-whitelisted text payload."
        val result = PrivacyClassifier.classifyAndSanitize(unknownMessage)

        assertEquals(DataClassification.UNKNOWN, result.classification)
        assertTrue("Unknown messages must default to blocked", result.isBlocked)
    }

    @Test
    fun testLowSensitivityAllowed() {
        val statusMessage = "Device battery status is normal, wifi connected, heartbeat sync ok."
        val result = PrivacyClassifier.classifyAndSanitize(statusMessage)

        assertEquals(DataClassification.LOW_SENSITIVITY, result.classification)
        assertFalse("Low sensitivity operational status can be forwarded", result.isBlocked)
    }
}
