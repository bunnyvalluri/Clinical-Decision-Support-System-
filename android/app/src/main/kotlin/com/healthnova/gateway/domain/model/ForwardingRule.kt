package com.healthnova.gateway.domain.model

enum class RuleAction {
    ALLOW,
    BLOCK,
    REDACT,
    REVIEW_REQUIRED
}

data class ForwardingRule(
    val id: String,
    val name: String,
    val eventType: String = "ALL",
    val sourceFilter: String = "*",
    val contentRegex: String = "",
    val action: RuleAction = RuleAction.BLOCK,
    val priority: Int = 100, // Lower = higher priority
    val enabled: Boolean = false // Default-deny
)
