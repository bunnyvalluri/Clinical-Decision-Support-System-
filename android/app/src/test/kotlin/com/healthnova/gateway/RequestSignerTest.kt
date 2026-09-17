package com.healthnova.gateway

import com.healthnova.gateway.security.RequestSigner
import org.junit.Assert.*
import org.junit.Test

class RequestSignerTest {

    @Test
    fun testSignPayloadDeterminismAndNonce() {
        val secret = "test-secret-key-12345"
        val payload = "{\"test\": \"data\"}".toByteArray(Charsets.UTF_8)
        val fixedTs = 1700000000L
        val fixedNonce = "abcdef0123456789"

        val signed1 = RequestSigner.signPayload(
            secret = secret,
            bodyBytes = payload,
            timestamp = fixedTs,
            nonce = fixedNonce
        )

        val signed2 = RequestSigner.signPayload(
            secret = secret,
            bodyBytes = payload,
            timestamp = fixedTs,
            nonce = fixedNonce
        )

        assertEquals("Signatures with identical inputs must match", signed1.signature, signed2.signature)
        assertEquals("64-character hex SHA-256 HMAC", 64, signed1.signature.length)

        // Changing nonce must change signature
        val signedDifferentNonce = RequestSigner.signPayload(
            secret = secret,
            bodyBytes = payload,
            timestamp = fixedTs,
            nonce = "differentnonce12"
        )
        assertNotEquals(signed1.signature, signedDifferentNonce.signature)
    }
}
