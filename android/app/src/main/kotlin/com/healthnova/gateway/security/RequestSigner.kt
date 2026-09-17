package com.healthnova.gateway.security

import java.security.SecureRandom
import java.util.UUID
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

data class SignedRequest(
    val timestamp: String,
    val nonce: String,
    val idempotencyKey: String,
    val signature: String
)

object RequestSigner {

    private val secureRandom = SecureRandom()

    fun generateNonce(): String {
        val bytes = ByteArray(16)
        secureRandom.nextBytes(bytes)
        return bytes.joinToString("") { "%02x".format(it) }
    }

    fun signPayload(
        secret: String,
        bodyBytes: ByteArray,
        timestamp: Long = System.currentTimeMillis() / 1000,
        nonce: String = generateNonce(),
        idempotencyKey: String = UUID.randomUUID().toString()
    ): SignedRequest {
        val tsStr = timestamp.toString()
        val prefix = "$tsStr:$nonce:".toByteArray(Charsets.UTF_8)
        val dataToSign = prefix + bodyBytes

        val mac = Mac.getInstance("HmacSHA256")
        val keySpec = SecretKeySpec(secret.toByteArray(Charsets.UTF_8), "HmacSHA256")
        mac.init(keySpec)
        val signatureBytes = mac.doFinal(dataToSign)
        val signatureHex = signatureBytes.joinToString("") { "%02x".format(it) }

        return SignedRequest(
            timestamp = tsStr,
            nonce = nonce,
            idempotencyKey = idempotencyKey,
            signature = signatureHex
        )
    }
}
