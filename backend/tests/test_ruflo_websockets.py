"""
Automated Tests for Ruflo AI Orchestrator WebSocket Streams:
- Channels routing at /ws/ai/ and /ws/ai/<workflow_id>/
- Unauthenticated rejection (close code 4001)
- Role-based authorization: Patients rejected from global AI events (close code 4003)
- Authorized clinicians/admins accepted
- Heartbeat ping/pong keep-alive
- Structured real-time event delivery across channel layer
"""
import pytest
from asgiref.sync import async_to_sync
from channels.layers import channel_layers, get_channel_layer
from channels.testing import WebsocketCommunicator
from rest_framework_simplejwt.tokens import AccessToken

from apps.accounts.models import User, UserRole
from config.asgi import application

WS_TIMEOUT = 5


@pytest.fixture(autouse=True)
def in_memory_channel_layer(settings):
    settings.CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }
    channel_layers.backends.clear()
    yield
    channel_layers.backends.clear()


def _generate_token_for_user(user: User) -> str:
    return str(AccessToken.for_user(user))


@pytest.fixture
def ws_doctor_user(db):
    return User.objects.create_user(
        username="ws_doc_ruflo_suite",
        email="ws.doc.ruflo@hospital.org",
        password="SecureDocPassword123!",
        role=UserRole.CLINICIAN,
        first_name="Gregory",
        last_name="House",
        is_active=True,
    )


@pytest.fixture
def ws_patient_user(db):
    return User.objects.create_user(
        username="ws_pat_ruflo_suite",
        email="ws.pat.ruflo@patient.org",
        password="SecurePatPassword123!",
        role=UserRole.PATIENT,
        first_name="John",
        last_name="Cuddy",
        is_active=True,
    )


@pytest.mark.django_db(transaction=True)
def test_unauthenticated_connection_rejected_4001():
    async def _run():
        communicator = WebsocketCommunicator(application, "/ws/ai/")
        connected, close_code = await communicator.connect(timeout=WS_TIMEOUT)
        assert not connected
        assert close_code == 4001
        await communicator.disconnect()

    async_to_sync(_run)()


@pytest.mark.django_db(transaction=True)
def test_patient_role_forbidden_from_ai_events_4003(ws_patient_user):
    token = _generate_token_for_user(ws_patient_user)

    async def _run():
        communicator = WebsocketCommunicator(application, f"/ws/ai/?token={token}")
        connected, close_code = await communicator.connect(timeout=WS_TIMEOUT)
        assert not connected
        assert close_code == 4003
        await communicator.disconnect()

    async_to_sync(_run)()


@pytest.mark.django_db(transaction=True)
def test_authorized_doctor_connects_to_ai_events(ws_doctor_user):
    token = _generate_token_for_user(ws_doctor_user)

    async def _run():
        communicator = WebsocketCommunicator(application, f"/ws/ai/?token={token}")
        connected, _ = await communicator.connect(timeout=WS_TIMEOUT)
        assert connected

        # Ping/Pong test
        await communicator.send_json_to({"type": "ping"})
        response = await communicator.receive_json_from(timeout=WS_TIMEOUT)
        assert response.get("type") == "pong"

        await communicator.disconnect()

    async_to_sync(_run)()


@pytest.mark.django_db(transaction=True)
def test_event_delivery_to_ai_group(ws_doctor_user):
    token = _generate_token_for_user(ws_doctor_user)

    async def _run():
        communicator = WebsocketCommunicator(application, f"/ws/ai/?token={token}")
        connected, _ = await communicator.connect(timeout=WS_TIMEOUT)
        assert connected

        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            "ai_orchestration",
            {
                "type": "ai_event",
                "data": {
                    "event": "AI_WORKFLOW_STARTED",
                    "workflow_id": "wf-test-1234",
                    "status": "RUNNING",
                },
            },
        )

        received = await communicator.receive_json_from(timeout=WS_TIMEOUT)
        assert received.get("event") == "AI_WORKFLOW_STARTED"
        assert received.get("workflow_id") == "wf-test-1234"

        await communicator.disconnect()

    async_to_sync(_run)()
