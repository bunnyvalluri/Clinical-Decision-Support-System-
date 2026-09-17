from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.ai_agents.models import AgentApproval


@receiver(post_save, sender=AgentApproval)
def on_approval_updated(sender, instance: AgentApproval, created: bool, **kwargs):
    """
    Hook to broadcast approval status changes or trigger notification dispatch.
    """
    pass
