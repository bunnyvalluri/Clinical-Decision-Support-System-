package com.healthnova.gateway.network

import com.healthnova.gateway.domain.model.MobileEvent
import com.healthnova.gateway.security.RequestSigner
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import javax.net.ssl.HttpsURLConnection

data class IngestionResponse(
    val statusCode: Int,
    val success: Boolean,
    val responseBody: String
)

class GatewayApiClient(
    private val baseUrl: String,
    private val deviceIdentifier: String,
    private val deviceSecret: String
) {
    fun transmitEvent(event: MobileEvent): IngestionResponse {
        val endpointUrl = "$baseUrl/api/v1/mobile/events/ingest/"
        val jsonPayload = """
            {
                "device_identifier": "$deviceIdentifier",
                "event_type": "${event.eventType}",
                "source": "${event.source}",
                "timestamp": "${java.time.Instant.ofEpochMilli(event.timestamp)}",
                "content": "${escapeJson(event.content)}",
                "idempotency_key": "${event.idempotencyKey}"
            }
        """.trimIndent()

        val payloadBytes = jsonPayload.toByteArray(Charsets.UTF_8)
        val signedRequest = RequestSigner.signPayload(
            secret = deviceSecret,
            bodyBytes = payloadBytes,
            idempotencyKey = event.idempotencyKey
        )

        val url = URL(endpointUrl)
        val connection = url.openConnection() as HttpURLConnection

        try {
            connection.requestMethod = "POST"
            connection.doOutput = true
            connection.connectTimeout = 5000
            connection.readTimeout = 5000
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("User-Agent", "HealthNova-Android/3.42")
            connection.setRequestProperty("X-Signature", signedRequest.signature)
            connection.setRequestProperty("X-Timestamp", signedRequest.timestamp)
            connection.setRequestProperty("X-Nonce", signedRequest.nonce)
            connection.setRequestProperty("X-Idempotency-Key", signedRequest.idempotencyKey)

            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(jsonPayload)
                writer.flush()
            }

            val statusCode = connection.responseCode
            val responseStream = if (statusCode in 200..299) {
                connection.inputStream
            } else {
                connection.errorStream ?: connection.inputStream
            }

            val responseBody = responseStream.bufferedReader().use { it.readText() }
            return IngestionResponse(
                statusCode = statusCode,
                success = statusCode in 200..299,
                responseBody = responseBody
            )
        } finally {
            connection.disconnect()
        }
    }

    private fun escapeJson(input: String): String {
        return input.replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t")
    }
}
