import pytest

from app.backup import create_backup, restore_backup


class TestCreateBackup:
    """Tests for create_backup function."""

    def test_create_backup_basic(self, test_db, test_client, sample_template, session_data):
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

        backup = create_backup(session_data["session_id"])

        assert backup["session_id"] == session_data["session_id"]
        assert backup["version"] == "2.0"
        assert "backup_id" in backup
        assert "backup" in backup

        payload = backup["backup"]
        assert payload["responses"]["A"]["Q1"]["status"] == "YES"
        assert payload["responses"]["B"]["Q1"]["status"] == "YES"

    def test_create_backup_session_not_found(self, test_db):
        with pytest.raises(ValueError, match="Session not found"):
            create_backup("non_existent_session")

    def test_create_backup_empty_responses(self, test_db, session_data):
        backup = create_backup(session_data["session_id"])
        payload = backup["backup"]
        assert payload["responses"]["A"] is None
        assert payload["responses"]["B"] is None


class TestRestoreBackup:
    """Tests for restore_backup function."""

    def test_restore_backup_basic(self, test_db, test_client, sample_template, session_data):
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

        backup = create_backup(session_data["session_id"])
        new_session_id = restore_backup(backup["backup"], "Restored Session")

        assert new_session_id != session_data["session_id"]

        resp = test_client.get(f"/api/sessions/{new_session_id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Restored Session"

    def test_restore_backup_preserves_responses(self, test_db, test_client, sample_template, session_data):
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

        backup = create_backup(session_data["session_id"])
        new_session_id = restore_backup(backup["backup"])

        load = test_client.post(f"/api/sessions/{new_session_id}/responses/A/load", json={})
        assert load.status_code == 200
        assert load.json()["responses"] == responses_a

    def test_restore_backup_invalid_format(self, test_db):
        with pytest.raises(ValueError):
            restore_backup({"version": "2.0"}, None)

    def test_restore_backup_unsupported_version(self, test_db):
        with pytest.raises(ValueError, match="Unsupported backup version"):
            restore_backup({"version": "1.0", "session": {"id": "x", "name": "y"}})


class TestBackupRestoreIntegration:
    def test_backup_restore_roundtrip(self, test_db, test_client, sample_template, session_data):
        responses_a = {"Q1": {"status": "YES", "interest": 3, "comfort": 4}, "Q2": {"value": 7}}
        responses_b = {"Q1": {"status": "YES", "interest": 4, "comfort": 3}, "Q2": {"value": 8}}

        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/save",
            json={"responses": responses_a},
        )
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/B/save",
            json={"responses": responses_b},
        )

        backup = create_backup(session_data["session_id"])
        restored_session_id = restore_backup(backup["backup"])

        ra = test_client.post(f"/api/sessions/{restored_session_id}/responses/A/load", json={})
        rb = test_client.post(f"/api/sessions/{restored_session_id}/responses/B/load", json={})
        assert ra.status_code == 200
        assert rb.status_code == 200
        assert ra.json()["responses"] == responses_a
        assert rb.json()["responses"] == responses_b
