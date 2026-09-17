package com.healthnova.gateway

import com.healthnova.gateway.domain.model.DataClassification
import com.healthnova.gateway.domain.model.ForwardingRule
import com.healthnova.gateway.domain.model.MobileEvent
import com.healthnova.gateway.domain.model.RuleAction
import com.healthnova.gateway.engine.LocalRuleEngine
import org.junit.Assert.*
import org.junit.Test

class LocalRuleEngineTest {

    @Test
    fun testOtpUnconditionallyBlocked() {
        val event = MobileEvent(
            deviceId = "dev-1",
            eventType = "SMS_RECEIVED",
            source = "+15550001",
            content = "OTP [REDACTED_OTP]",
            classification = DataClassification.OTP
        )

        val allowRule = ForwardingRule(
            id = "r1",
            name = "Allow All",
            action = RuleAction.ALLOW,
            enabled = true,
            priority = 1
        )

        val result = LocalRuleEngine.evaluate(event, listOf(allowRule))
        assertEquals(RuleAction.BLOCK, result.action)
    }

    @Test
    fun testConflictResolutionMostRestrictiveWins() {
        val event = MobileEvent(
            deviceId = "dev-1",
            eventType = "SMS_RECEIVED",
            source = "+15550001",
            content = "Device heartbeat check",
            classification = DataClassification.LOW_SENSITIVITY
        )

        val allowRule = ForwardingRule(
            id = "r1",
            name = "Allow Rule",
            action = RuleAction.ALLOW,
            enabled = true,
            priority = 10
        )

        val blockRule = ForwardingRule(
            id = "r2",
            name = "Block Rule",
            action = RuleAction.BLOCK,
            enabled = true,
            priority = 20
        )

        val result = LocalRuleEngine.evaluate(event, listOf(allowRule, blockRule))
        assertEquals(RuleAction.BLOCK, result.action)
    }

    @Test
    fun testDefaultDenyWhenNoRulesMatch() {
        val event = MobileEvent(
            deviceId = "dev-1",
            eventType = "SMS_RECEIVED",
            source = "+19998887",
            content = "System status ok",
            classification = DataClassification.LOW_SENSITIVITY
        )

        val ruleOtherSource = ForwardingRule(
            id = "r1",
            name = "Specific Sender",
            sourceFilter = "+1555*",
            action = RuleAction.ALLOW,
            enabled = true
        )

        val result = LocalRuleEngine.evaluate(event, listOf(ruleOtherSource))
        assertEquals(RuleAction.BLOCK, result.action)
    }
}
