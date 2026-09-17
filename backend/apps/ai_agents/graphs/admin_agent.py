from apps.ai_agents.graphs.base import DeterministicAgentRuntime


class AdminAgentRuntime(DeterministicAgentRuntime):
    """
    IT Infrastructure and Systems Diagnostics Runtime.
    Restricted to system health checks, database vitality, and queue monitoring.
    Zero destructive shell or raw SQL execution.
    """
    pass
