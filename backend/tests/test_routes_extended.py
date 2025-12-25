import json


class TestScenariosEndpoint:
    def test_get_scenarios_exists(self, test_client):
        resp = test_client.get("/api/scenarios")
        assert resp.status_code == 200

    def test_get_scenarios_returns_list(self, test_client):
        resp = test_client.get("/api/scenarios")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


class TestBackupRestoreEndpoints:
    def test_backup_endpoint(self, test_client, session_data):
        # Save one side so the backup contains some payload
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/save",
            json={"responses": {"Q1": {"status": "YES", "interest": 3, "comfort": 4}}},
        )

        resp = test_client.post(f"/api/sessions/{session_data['session_id']}/backup", json={})
        assert resp.status_code == 200
        data = resp.json()
        assert data["version"] == "2.0"
        assert "backup_id" in data
        assert "backup" in data

    def test_restore_endpoint(self, test_client, session_data):
        backup_resp = test_client.post(f"/api/sessions/{session_data['session_id']}/backup", json={})
        backup = backup_resp.json()

        resp = test_client.post(
            "/api/sessions/restore",
            json={"backup": backup["backup"], "new_name": "Restored Session"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "session_id" in data


class TestExportExtended:
    def test_export_json_includes_all_data(self, test_client, session_data):
        responses_a = {"Q1": {"status": "YES", "interest": 3, "comfort": 4}}
        responses_b = {"Q1": {"status": "YES", "interest": 4, "comfort": 3}}

        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/save",
            json={"responses": responses_a},
        )
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/B/save",
            json={"responses": responses_b},
        )

        resp = test_client.post(f"/api/sessions/{session_data['session_id']}/export/json", json={})
        assert resp.status_code == 200
        data = json.loads(resp.content)
        assert data["session"]["id"] == session_data["session_id"]
        assert data["responses"]["A"] == responses_a
        assert data["responses"]["B"] == responses_b

    def test_export_json_filename(self, test_client, session_data):
        # Compare requires both sides; keep it minimal.
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/save",
            json={"responses": {"Q1": {"status": "YES", "interest": 3, "comfort": 4}}},
        )
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/B/save",
            json={"responses": {"Q1": {"status": "YES", "interest": 4, "comfort": 3}}},
        )

        resp = test_client.post(f"/api/sessions/{session_data['session_id']}/export/json", json={})
        assert "attachment" in resp.headers["content-disposition"]
        assert "intimacy_export_" in resp.headers["content-disposition"]
