package com.healthnova.gateway.privacy

import com.healthnova.gateway.domain.model.DataClassification
import java.util.regex.Pattern

data class ClassificationResult(
    val classification: DataClassification,
    val sanitizedContent: String,
    val isBlocked: Boolean
)

object PrivacyClassifier {

    private val OTP_PATTERN = Pattern.compile(
        "\\b(?:verification\\s*code|one-time\\s*password|security\\s*code|auth\\s*code|pin|otp)\\b[\\s:=#-]*([a-zA-Z0-9]{4,8})\\b|" +
        "\\b([0-9]{4,8})\\b\\s*(?:is\\s+your\\s+(?:verification|security|login|otp|code))|" +
        "\\b(?:your\\s+code\\s+is\\s+)([0-9]{4,8})\\b",
        Pattern.CASE_INSENSITIVE
    )

    private val SECRET_PATTERNS = listOf(
        Pattern.compile("-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP)?\\s*PRIVATE KEY-----"),
        Pattern.compile("\\b(?:api[_-]?key|secret[_-]?key|access[_-]?token|bearer\\s+[a-zA-Z0-9\\-_\\.=]+|jwt|auth[_-]?token)\\b[\\s:=]+([a-zA-Z0-9\\-_\\.]{16,})", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\beyJ[A-Za-z0-9-_=]{10,}\\.[A-Za-z0-9-_=]{10,}\\.[A-Za-z0-9-_=]{10,}\\b"),
        Pattern.compile("\\bpassword[\\s:=]+([^\\s,;]{6,})", Pattern.CASE_INSENSITIVE)
    )

    private val FINANCIAL_PATTERNS = listOf(
        Pattern.compile("\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\\b"),
        Pattern.compile("\\b(?:cvv|cvc|security\\s*code)[\\s:=]+([0-9]{3,4})\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}\\b")
    )

    private val PHI_PATTERNS = listOf(
        Pattern.compile("\\b\\d{3}-\\d{2}-\\d{4}\\b"), // SSN
        Pattern.compile("\\b(?:mrn|medical\\s*record\\s*(?:number|#)|patient\\s*id)[\\s:=#-]*([a-zA-Z0-9\\-]{5,15})\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(?:diagnos(?:is|ed)|prescription|prescribed|dosage|biopsy|chemotherapy|hiv|oncology|psychiatric)\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(?:blood\\s*pressure|glucose|heart\\s*rate|spo2|vital\\s*signs|icu\\s*admission)\\b", Pattern.CASE_INSENSITIVE)
    )

    fun classifyAndSanitize(content: String): ClassificationResult {
        if (content.isBlank()) {
            return ClassificationResult(DataClassification.UNKNOWN, "", isBlocked = true)
        }

        var text = content
        var isOtp = false
        var isSecret = false
        var isFinancial = false
        var isPhi = false

        // 1. Check OTP
        val otpMatcher = OTP_PATTERN.matcher(text)
        if (otpMatcher.find()) {
            isOtp = true
            text = otpMatcher.replaceAll("[REDACTED_OTP]")
        }

        // 2. Check Secrets
        for (pattern in SECRET_PATTERNS) {
            val matcher = pattern.matcher(text)
            if (matcher.find()) {
                isSecret = true
                text = matcher.replaceAll("[REDACTED_SECRET]")
            }
        }

        // 3. Check Financial
        for (pattern in FINANCIAL_PATTERNS) {
            val matcher = pattern.matcher(text)
            if (matcher.find()) {
                isFinancial = true
                text = matcher.replaceAll("[REDACTED_FINANCIAL]")
            }
        }

        // 4. Check PHI
        for (pattern in PHI_PATTERNS) {
            val matcher = pattern.matcher(text)
            if (matcher.find()) {
                isPhi = true
                text = matcher.replaceAll("[REDACTED_PHI]")
            }
        }

        // Classification Priority
        return when {
            isSecret -> ClassificationResult(DataClassification.AUTHENTICATION_SECRET, text, isBlocked = true)
            isOtp -> ClassificationResult(DataClassification.OTP, text, isBlocked = true) // Default OTP = BLOCK
            isFinancial -> ClassificationResult(DataClassification.FINANCIAL, text, isBlocked = true)
            isPhi -> ClassificationResult(DataClassification.PHI, text, isBlocked = false)
            text.contains(Regex("(?i)\\b(?:battery|charging|wifi|network|status|sync|heartbeat|online|offline)\\b")) ->
                ClassificationResult(DataClassification.LOW_SENSITIVITY, text, isBlocked = false)
            text.contains(Regex("(?i)\\b(?:update|alert|notification|reminder|meeting|calendar)\\b")) ->
                ClassificationResult(DataClassification.SENSITIVE, text, isBlocked = false)
            else ->
                ClassificationResult(DataClassification.UNKNOWN, text, isBlocked = true) // Default-deny
        }
    }
}
