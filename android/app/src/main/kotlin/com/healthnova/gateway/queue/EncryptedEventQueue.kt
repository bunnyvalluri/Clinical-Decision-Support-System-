package com.healthnova.gateway.queue

import com.healthnova.gateway.domain.model.MobileEvent
import java.util.concurrent.ConcurrentLinkedQueue

class EncryptedEventQueue(
    private val maxCapacity: Int = 500,
    private val ttlMillis: Long = 24 * 60 * 60 * 1000L // 24 hours
) {
    private val queue = ConcurrentLinkedQueue<MobileEvent>()
    private val seenKeys = HashSet<String>()

    @Synchronized
    fun enqueue(event: MobileEvent): Boolean {
        pruneExpired()

        if (seenKeys.contains(event.idempotencyKey)) {
            return false // Deduplicated
        }

        if (queue.size >= maxCapacity) {
            // Drop oldest item to prevent memory exhaustion
            val dropped = queue.poll()
            dropped?.let { seenKeys.remove(it.idempotencyKey) }
        }

        queue.add(event)
        seenKeys.add(event.idempotencyKey)
        return true
    }

    @Synchronized
    fun poll(): MobileEvent? {
        pruneExpired()
        val event = queue.poll()
        event?.let { seenKeys.remove(it.idempotencyKey) }
        return event
    }

    @Synchronized
    fun peek(): MobileEvent? {
        pruneExpired()
        return queue.peek()
    }

    @Synchronized
    fun size(): Int {
        pruneExpired()
        return queue.size
    }

    @Synchronized
    fun pruneExpired(): Int {
        val now = System.currentTimeMillis()
        val cutoff = now - ttlMillis
        var prunedCount = 0

        val iterator = queue.iterator()
        while (iterator.hasNext()) {
            val event = iterator.next()
            if (event.createdAt < cutoff) {
                iterator.remove()
                seenKeys.remove(event.idempotencyKey)
                prunedCount++
            }
        }
        return prunedCount
    }
}
