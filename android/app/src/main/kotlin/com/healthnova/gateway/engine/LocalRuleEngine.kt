package com.healthnova.gateway.engine

import com.healthnova.gateway.domain.model.DataClassification
import com.healthnova.gateway.domain.model.ForwardingRule
import com.healthnova.gateway.domain.model.MobileEvent
import com.healthnova.gateway.domain.model.RuleAction
import java.util.regex.Pattern

data class RuleEvaluationResult(
    val action: RuleAction,
    val matchedRules: List<ForwardingRule>,
    val reason: String
)

object LocalRuleEngine {

    fun evaluate(
        event: MobileEvent,
        rules: List<ForwardingRule>
    ): RuleEvaluationResult {
        // Zero-trust baseline: OTP, Secrets, and Unknown are unconditionally BLOCKED
        if (!event.classification.isPermittedForTransmission) {
            return RuleEvaluationResult(
                action = RuleAction.BLOCK,
                matchedRules = emptyList(),
                reason = "Classification '${event.classification}' is barred from transmission under Zero-Trust rules."
            )
        }

        // Active declarative rules sorted by priority (lowest integer first)
        val activeRules = rules
            .filter { it.enabled }
            .sortedBy { it.priority }

        val matched = mutableListOf<ForwardingRule>()

        for (rule in activeRules) {
            // Event Type Filter
            if (rule.eventType != "ALL" && rule.eventType != event.eventType) {
                continue
            }

            // Source Filter (glob-style simple matching)
            if (rule.sourceFilter != "*" && !matchesSource(event.source, rule.sourceFilter)) {
                continue
            }

            // Content Regex Filter
            if (rule.contentRegex.isNotBlank()) {
                try {
                    val pattern = Pattern.compile(rule.contentRegex, Pattern.CASE_INSENSITIVE)
                    if (!pattern.matcher(event.content).find()) {
                        continue
                    }
                } catch (e: Exception) {
                    // Skip malformed regex safely
                    continue
                }
            }

            matched.add(rule)
        }

        if (matched.isEmpty()) {
            return RuleEvaluationResult(
                action = RuleAction.BLOCK,
                matchedRules = emptyList(),
                reason = "Default-Deny: No active rule authorized this event."
            )
        }

        // Conflict Resolution: Most Restrictive Wins (BLOCK > REVIEW_REQUIRED > REDACT > ALLOW)
        val actions = matched.map { it.action }
        val resolvedAction = when {
            actions.contains(RuleAction.BLOCK) -> RuleAction.BLOCK
            actions.contains(RuleAction.REVIEW_REQUIRED) -> RuleAction.REVIEW_REQUIRED
            actions.contains(RuleAction.REDACT) -> RuleAction.REDACT
            else -> RuleAction.ALLOW
        }

        return RuleEvaluationResult(
            action = resolvedAction,
            matchedRules = matched,
            reason = "Resolved to $resolvedAction across ${matched.size} matching rules."
        )
    }

    private fun matchesSource(source: String, filter: String): Boolean {
        if (filter == "*") return true
        val regex = filter
            .replace(".", "\\.")
            .replace("*", ".*")
            .replace("?", ".")
        return Pattern.compile("^$regex$", Pattern.CASE_INSENSITIVE).matcher(source).matches()
    }
}
