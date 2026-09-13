"""
Automated tests for Django Channels WebSockets:
- JWT authentication middleware
- Role-based group authorization (Dashboard, Risk Alerts, Patient stream, Notifications)
- Heartbeat ping/pong keep-alive
- Unauthorized subscription rejection (close code 4003)
- Event delivery across channel layer
"""
from datetime import date
import json
import pytest
from channels.layers import channel_layers, get_channel_layer
from channels.testing import WebsocketCommunicator
from rest_framework_simplejwt.tokens import AccessToken

from apps.accounts.models import User, UserRole
from apps.patients.models import Patient
from channels_app.events import (
    DashboardStatsUpdatedEvent,
    NotificationEvent,
    PredictionCreatedEvent,
    RiskAlertEvent,
)
from config.asgi import application

WS_TIMEOUT = 15  # Network/TLS timeout buffer for remote Neon PostgreSQL queries


@pytest.fixture(autouse=True)
def in_memory_channel_layer(settings):
    """Use fast in-memory channel layer for local test suite."""
    settings.CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }
    channel_layers.backends.clear()
    yield
    channel_layers.backends.clear()


def _generate_token_for_user(user: User) -> str:
    """Generate a valid SimpleJWT access token for testing."""
    token = AccessToken.for_user(user)
    return str(token)


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(
        username="ws_doc",
        email="ws.doc@hospital.org",
        password="SecureDocPassword123!",
        role=UserRole.CLINICIAN,
        first_name="Gregory",
        last_name="House",
        is_active=True,
    )


@pytest.fixture
def inactive_doctor_user(db):
    return User.objects.create_user(
        username="ws_inactive_doc",
        email="inactive.doc@hospital.org",
        password="SecureDocPassword123!",
        role=UserRole.CLINICIAN,
        first_name="Inactive",
        last_name="Doctor",
        is_active=False,
    )


@pytest.fixture
def patient_user_1(db):
    return User.objects.create_user(
        username="ws_patient_1",
        email="patient1@hospital.org",
        password="SecurePatientPassword123!",
        role=UserRole.PATIENT,
        first_name="Alice",
        last_name="Smith",
        is_active=True,
    )


@pytest.fixture
def patient_user_2(db):
    return User.objects.create_user(
        username="ws_patient_2",
        email="patient2@hospital.org",
        password="SecurePatientPassword123!",
        role=UserRole.PATIENT,
        first_name="Bob",
        last_name="Jones",
        is_active=True,
    )


@pytest.fixture
def patient_record_1(db, patient_user_1):
    return Patient.objects.create(
        user=patient_user_1,
        mrn="MRN-WS-001",
        first_name="Alice",
        last_name="Smith",
        date_of_birth=date(1985, 4, 12),
        gender="FEMALE",
        blood_group="A_POS",
    )


@pytest.fixture
def patient_record_2(db, patient_user_2):
    return Patient.objects.create(
        user=patient_user_2,
        mrn="MRN-WS-002",
        first_name="Bob",
        last_name="Jones",
        date_of_birth=date(1990, 8, 20),
        gender="MALE",
        blood_group="O_POS",
    )


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
class TestWebSocketAuthentication:
    """Tests for JWT token authentication in WebSockets."""

    async def test_unauthenticated_connection_rejected(self):
        """Connecting without token must close with code 4001."""
        communicator = WebsocketCommunicator(application, "/ws/dashboard/")
        connected, close_code = await communicator.connect(timeout=WS_TIMEOUT)
        assert not connected
        assert close_code == 4001

    async def test_invalid_jwt_connection_rejected(self):
        """Connecting with forged/malformed token must close with code 4001."""
        communicator = WebsocketCommunicator(application, "/ws/dashboard/?token=invalid.jwt.token")
        connected, close_code = await communicator.connect(timeout=WS_TIMEOUT)
        assert not connected
        assert close_code == 4001

    async def test_inactive_user_connection_rejected(self, inactive_doctor_user):
        """Inactive user token must be rejected with 4001."""
        token = _generate_token_for_user(inactive_doctor_user)

        communicator = WebsocketCommunicator(application, f"/ws/dashboard/?token={token}")
        connected, close_code = await communicator.connect(timeout=WS_TIMEOUT)
        assert not connected
        assert close_code == 4001


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
class TestWebSocketAuthorization:
    """Tests for role-based access control across WebSocket groups."""

    async def test_clinician_can_join_dashboard_group(self, doctor_user):
        """Clinician role is authorized to connect to /ws/dashboard/."""
        token = _generate_token_for_user(doctor_user)
        communicator = WebsocketCommunicator(application, f"/ws/dashboard/?token={token}")
        connected, subprotocol = await communicator.connect(timeout=WS_TIMEOUT)
        assert connected
        await communicator.disconnect()

    async def test_patient_cannot_join_dashboard_group(self, patient_user_1):
        """Patient role must be rejected from /ws/dashboard/ with 4003 Forbidden."""
        token = _generate_token_for_user(patient_user_1)
        communicator = WebsocketCommunicator(application, f"/ws/dashboard/?token={token}")
        connected, close_code = await communicator.connect(timeout=WS_TIMEOUT)
        assert not connected
        assert close_code == 4003

    async def test_clinician_can_join_risk_alerts_group(self, doctor_user):
        """Clinician role is authorized to connect to /ws/alerts/."""
        token = _generate_token_for_user(doctor_user)
        communicator = WebsocketCommunicator(application, f"/ws/alerts/?token={token}")
        connected, subprotocol = await communicator.connect(timeout=WS_TIMEOUT)
        assert connected
        await communicator.disconnect()

    async def test_patient_cannot_join_risk_alerts_group(self, patient_user_1):
        """Patient role must be rejected from /ws/alerts/ with 4003 Forbidden."""
        token = _generate_token_for_user(patient_user_1)
        communicator = WebsocketCommunicator(application, f"/ws/alerts/?token={token}")
        connected, close_code = await communicator.connect(timeout=WS_TIMEOUT)
        assert not connected
        assert close_code == 4003

    async def test_patient_can_join_own_patient_group(self, patient_user_1, patient_record_1):
        """Patient Alice can connect to her own channel /ws/patients/{alice_id}/."""
        token = _generate_token_for_user(patient_user_1)
        communicator = WebsocketCommunicator(
            application, f"/ws/patients/{patient_record_1.id}/?token={token}"
        )
        connected, subprotocol = await communicator.connect(timeout=WS_TIMEOUT)
        assert connected
        await communicator.disconnect()

    async def test_patient_cannot_join_other_patient_group(self, patient_user_1, patient_record_2):
        """Patient Alice must be rejected from Bob's channel with 4003 Forbidden."""
        token = _generate_token_for_user(patient_user_1)
        communicator = WebsocketCommunicator(
            application, f"/ws/patients/{patient_record_2.id}/?token={token}"
        )
        connected, close_code = await communicator.connect(timeout=WS_TIMEOUT)
        assert not connected
        assert close_code == 4003

    async def test_clinician_can_join_any_patient_group(self, doctor_user, patient_record_1):
        """Attending clinician is authorized to connect to any patient channel."""
        token = _generate_token_for_user(doctor_user)
        communicator = WebsocketCommunicator(
            application, f"/ws/patients/{patient_record_1.id}/?token={token}"
        )
        connected, subprotocol = await communicator.connect(timeout=WS_TIMEOUT)
        assert connected
        await communicator.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
class TestWebSocketHeartbeatAndEvents:
    """Tests for ping/pong keepalive and real-time message delivery."""

    async def test_ping_pong_heartbeat(self, doctor_user):
        """Client ping must trigger immediate server pong with event PONG."""
        token = _generate_token_for_user(doctor_user)
        communicator = WebsocketCommunicator(application, f"/ws/dashboard/?token={token}")
        connected, _ = await communicator.connect(timeout=WS_TIMEOUT)
        assert connected

        # Send ping
        await communicator.send_json_to({"action": "ping"})

        # Receive pong response
        response = await communicator.receive_json_from(timeout=WS_TIMEOUT)
        assert response["event"] == "PONG"
        assert response["type"] == "pong"
        assert "timestamp" in response

        await communicator.disconnect()

    async def test_dashboard_receives_prediction_created_event(self, doctor_user):
        """Dashboard channel must receive PREDICTION_CREATED events via channel layer."""
        token = _generate_token_for_user(doctor_user)
        communicator = WebsocketCommunicator(application, f"/ws/dashboard/?token={token}")
        connected, _ = await communicator.connect(timeout=WS_TIMEOUT)
        assert connected

        channel_layer = get_channel_layer()
        event_dict = PredictionCreatedEvent(
            prediction_id="11111111-2222-3333-4444-555555555555",
            patient_id="66666666-7777-8888-9999-000000000000",
            risk_level="HIGH",
            probability=0.825,
            model_name="RandomForest",
            model_version="1.0.0",
        ).to_dict()

        await channel_layer.group_send("dashboard", event_dict)

        received = await communicator.receive_json_from(timeout=WS_TIMEOUT)
        assert received["event"] == "PREDICTION_CREATED"
        assert received["prediction_id"] == "11111111-2222-3333-4444-555555555555"
        assert received["risk_level"] == "HIGH"
        assert received["probability"] == 0.825

        await communicator.disconnect()

    async def test_risk_alerts_stream_delivery(self, doctor_user):
        """RiskAlertConsumer must receive and format critical clinical alerts."""
        token = _generate_token_for_user(doctor_user)
        communicator = WebsocketCommunicator(application, f"/ws/alerts/?token={token}")
        connected, _ = await communicator.connect(timeout=WS_TIMEOUT)
        assert connected

        channel_layer = get_channel_layer()
        alert_dict = RiskAlertEvent(
            prediction_id="pred-alert-1",
            patient_id="patient-alert-1",
            patient_mrn="MRN-CRIT-99",
            risk_level="CRITICAL",
            probability=0.965,
            severity="CRITICAL",
            message="Critical risk detected: immediate clinician review required.",
        ).to_dict()

        await channel_layer.group_send("risk_alerts", alert_dict)

        received = await communicator.receive_json_from(timeout=WS_TIMEOUT)
        assert received["event"] == "RISK_ALERT"
        assert received["severity"] == "CRITICAL"
        assert received["patient_mrn"] == "MRN-CRIT-99"
        assert received["probability"] == 0.965

        await communicator.disconnect()

    async def test_user_specific_notification_delivery(self, doctor_user):
        """NotificationConsumer strictly receives notifications directed to notifications_{user.id}."""
        token = _generate_token_for_user(doctor_user)
        communicator = WebsocketCommunicator(application, f"/ws/notifications/?token={token}")
        connected, _ = await communicator.connect(timeout=WS_TIMEOUT)
        assert connected

        channel_layer = get_channel_layer()
        notif_dict = NotificationEvent(
            notification_id="notif-doc-1",
            title="Urgent Vitals Update",
            severity="HIGH",
            message="Patient John Doe BP elevated: 165/105",
            action_url="/patients/1/",
        ).to_dict()

        await channel_layer.group_send(f"notifications_{doctor_user.id}", notif_dict)

        received = await communicator.receive_json_from(timeout=WS_TIMEOUT)
        assert received["event"] == "NOTIFICATION"
        assert received["notification_id"] == "notif-doc-1"
        assert received["severity"] == "HIGH"

        await communicator.disconnect()
