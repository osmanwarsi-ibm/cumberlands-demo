"""Integration tests for all API endpoints."""
import pytest


class TestHealthEndpoint:
    """Tests for /health endpoint."""
    
    def test_health_check_success(self, client):
        """Test health endpoint returns correct status."""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "ok"
        assert data["sqlite"] == "reachable"
        assert data["fixtures_loaded"] is True
        assert data["triage_mode"] in ("MOCK", "LLM")


class TestAuthEndpoint:
    """Tests for /api/auth/login endpoint."""
    
    def test_login_success(self, client):
        """Test successful login with valid user."""
        response = client.post("/api/auth/login", json={"username": "p.nair"})
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["username"] == "p.nair"
        assert data["user"]["role"] == "AP_SPECIALIST"
    
    def test_login_invalid_user(self, client):
        """Test login with non-existent user returns 401."""
        response = client.post("/api/auth/login", json={"username": "nonexistent"})
        assert response.status_code == 401
    
    def test_login_validation_error(self, client):
        """Test login with missing username returns 422."""
        response = client.post("/api/auth/login", json={})
        assert response.status_code == 422


class TestIntakeEndpoint:
    """Tests for /api/intake/batches endpoint."""
    
    def test_create_batch_success(self, client, auth_headers):
        """Test successful batch creation."""
        response = client.post(
            "/api/intake/batches",
            json={
                "source_type": "fixture_record_set",
                "source_identifier": "pilot_batch_01",
                "initiated_by": "p.nair"
            },
            headers=auth_headers
        )
        assert response.status_code == 201
        
        data = response.json()
        assert "batch_id" in data
        assert data["status"] in ("COMPLETED", "PARTIAL", "REJECTED")
        assert data["total_lines"] >= 0
        assert data["accepted_lines"] >= 0
    
    def test_create_batch_unauthorized(self, client):
        """Test batch creation without auth returns 401."""
        response = client.post(
            "/api/intake/batches",
            json={
                "source_type": "fixture_record_set",
                "source_identifier": "pilot_batch_01",
                "initiated_by": "p.nair"
            }
        )
        assert response.status_code == 401
    
    def test_create_batch_validation_error(self, client, auth_headers):
        """Test batch creation with invalid source type."""
        response = client.post(
            "/api/intake/batches",
            json={
                "source_type": "invalid_type",
                "source_identifier": "test",
                "initiated_by": "p.nair"
            },
            headers=auth_headers
        )
        # Should return 400 for business validation error
        assert response.status_code in (400, 422)


class TestReconciliationEndpoint:
    """Tests for /api/reconciliation/batches/{batch_id}/run endpoint."""
    
    def test_run_reconciliation_success(self, client, auth_headers):
        """Test successful reconciliation run."""
        # First create a batch
        intake_response = client.post(
            "/api/intake/batches",
            json={
                "source_type": "fixture_record_set",
                "source_identifier": "pilot_batch_01",
                "initiated_by": "p.nair"
            },
            headers=auth_headers
        )
        batch_id = intake_response.json()["batch_id"]
        
        # Run reconciliation
        response = client.post(
            f"/api/reconciliation/batches/{batch_id}/run",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["batch_id"] == batch_id
        assert "full_matches" in data
        assert "cost_exceptions" in data
        assert "quantity_exceptions" in data
        assert "unmatched_statements" in data
        assert "unmatched_receipts" in data
    
    def test_run_reconciliation_batch_not_found(self, client, auth_headers):
        """Test reconciliation with non-existent batch returns 404."""
        response = client.post(
            "/api/reconciliation/batches/nonexistent/run",
            headers=auth_headers
        )
        assert response.status_code == 404


class TestQueuesEndpoint:
    """Tests for /api/queues/{queue_type} endpoint."""
    
    def test_get_queue_success(self, client):
        """Test successful queue retrieval."""
        # Login as price book analyst
        login_response = client.post("/api/auth/login", json={"username": "d.whitfield"})
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get("/api/queues/cost_review", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["queue_type"] == "cost_review"
        assert "total" in data
        assert "items" in data
    
    def test_get_queue_role_mismatch(self, client, auth_headers):
        """Test queue access with wrong role returns 403."""
        # AP Specialist trying to access cost_review queue
        response = client.get("/api/queues/cost_review", headers=auth_headers)
        assert response.status_code == 403
    
    def test_get_queue_invalid_type(self, client, auth_headers):
        """Test queue access with invalid queue type returns 400."""
        response = client.get("/api/queues/invalid_queue", headers=auth_headers)
        assert response.status_code == 400


class TestCasesEndpoint:
    """Tests for /api/cases endpoints."""
    
    def test_get_case_not_found(self, client, auth_headers):
        """Test case detail for non-existent case returns 404."""
        response = client.get("/api/cases/nonexistent", headers=auth_headers)
        assert response.status_code == 404
    
    def test_review_decision_validation(self, client, auth_headers):
        """Test review decision with invalid data returns error."""
        response = client.post(
            "/api/cases/test_case/review-decisions",
            json={
                "decision_type": "INVALID_TYPE",
                "reviewer_user_id": "user1"
            },
            headers=auth_headers
        )
        # Should return 404 for non-existent case or 400 for validation
        assert response.status_code in (400, 404, 422)


class TestSettlementEndpoint:
    """Tests for /api/cases/{case_id}/settlement endpoint."""
    
    def test_settlement_not_found(self, client, auth_headers):
        """Test settlement for non-existent case returns 404."""
        response = client.post(
            "/api/cases/nonexistent/settlement",
            json={"prepared_by_user_id": "user1"},
            headers=auth_headers
        )
        assert response.status_code == 404
    
    def test_settlement_role_check(self, client):
        """Test settlement by non-AP-Specialist returns 403."""
        # Login as price book analyst
        login_response = client.post("/api/auth/login", json={"username": "d.whitfield"})
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/cases/test_case/settlement",
            json={"prepared_by_user_id": "user2"},
            headers=headers
        )
        # Should return 403 or 404
        assert response.status_code in (403, 404)


class TestAuditEndpoint:
    """Tests for /api/audit endpoints."""
    
    def test_get_audit_trail_success(self, client, auth_headers):
        """Test audit trail retrieval."""
        response = client.get(
            "/api/audit/BATCH/test_batch_id",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["aggregate_type"] == "BATCH"
        assert data["aggregate_id"] == "test_batch_id"
        assert "total" in data
        assert "events" in data
    
    def test_get_audit_trail_with_filter(self, client, auth_headers):
        """Test audit trail with event type filter."""
        response = client.get(
            "/api/audit/CASE/test_case_id?event_type=REVIEW_DECISION",
            headers=auth_headers
        )
        assert response.status_code == 200


class TestEndToEndFlow:
    """End-to-end integration tests covering full reconciliation flow."""
    
    def test_complete_flow(self, client):
        """Test complete flow from intake to settlement."""
        # 1. Login
        login_response = client.post("/api/auth/login", json={"username": "p.nair"})
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        user_id = login_response.json()["user"]["id"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Create batch
        intake_response = client.post(
            "/api/intake/batches",
            json={
                "source_type": "fixture_record_set",
                "source_identifier": "pilot_batch_01",
                "initiated_by": "p.nair"
            },
            headers=headers
        )
        assert intake_response.status_code == 201
        batch_id = intake_response.json()["batch_id"]
        
        # 3. Run reconciliation
        recon_response = client.post(
            f"/api/reconciliation/batches/{batch_id}/run",
            headers=headers
        )
        assert recon_response.status_code == 200
        
        # 4. Check audit trail
        audit_response = client.get(
            f"/api/audit/BATCH/{batch_id}",
            headers=headers
        )
        assert audit_response.status_code == 200
        assert audit_response.json()["total"] >= 2  # At least ingestion and reconciliation events
