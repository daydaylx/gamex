"""
Keychain Manager for hybrid encryption system.

Manages the master key and session-specific encryption keys.
Architecture:
- Master Key: Encrypted with user password, stored in keychain table
- Session Keys: Random per session, encrypted with master key
- Data: Encrypted with session keys

This allows:
- Password changes without re-encrypting all data
- Session-level isolation (one session compromise ≠ all sessions)
- Zero-knowledge (server never sees plaintext passwords)
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from app.db import db
from app.crypto import (
    generate_master_key,
    generate_session_key,
    encrypt_master_key,
    decrypt_master_key,
    encrypt_session_key,
    decrypt_session_key,
    InvalidPasswordError,
)


def _utcnow() -> str:
    """Current UTC timestamp in ISO format"""
    return datetime.now(timezone.utc).isoformat()


class KeychainManager:
    """
    Manages master key and session keys for hybrid encryption system.

    All methods are static - this is a stateless manager.
    Actual keys are stored in database or returned to caller.
    """

    @staticmethod
    def is_initialized() -> bool:
        """
        Check if keychain has been initialized with a master password.

        Returns:
            True if keychain exists, False if first-time setup needed
        """
        with db() as conn:
            row = conn.execute("SELECT id FROM keychain WHERE id = 1").fetchone()
        return bool(row)

    @staticmethod
    def initialize(password: str) -> dict:
        """
        Initialize keychain with master password (first-time setup).

        Args:
            password: Master password (will be used to encrypt master key)

        Returns:
            Dict with status and created_at

        Raises:
            ValueError: If keychain already initialized
        """
        if KeychainManager.is_initialized():
            raise ValueError("Keychain already initialized")

        # Generate cryptographically secure random master key
        master_key = generate_master_key()

        # Generate salt for password KDF
        salt = os.urandom(16)

        # Encrypt master key with password
        encrypted = encrypt_master_key(master_key, password, salt)

        # Store in database
        now = _utcnow()
        with db() as conn:
            conn.execute(
                """
                INSERT INTO keychain (id, encrypted_master_key, salt, created_at, updated_at, version)
                VALUES (1, ?, ?, ?, ?, 1)
                """,
                (
                    json.dumps(encrypted),
                    salt.hex(),
                    now,
                    now,
                ),
            )

        return {"status": "initialized", "created_at": now}

    @staticmethod
    def unlock(password: str) -> bytes:
        """
        Unlock keychain and return decrypted master key.

        Args:
            password: Master password

        Returns:
            32-byte master key

        Raises:
            ValueError: If keychain not initialized
            InvalidPasswordError: If password incorrect
        """
        with db() as conn:
            row = conn.execute(
                "SELECT encrypted_master_key, salt FROM keychain WHERE id = 1"
            ).fetchone()

        if not row:
            raise ValueError("Keychain not initialized")

        encrypted = json.loads(row["encrypted_master_key"])

        try:
            master_key = decrypt_master_key(encrypted, password)
        except InvalidPasswordError:
            raise InvalidPasswordError("Incorrect password")

        return master_key

    @staticmethod
    def change_password(old_password: str, new_password: str) -> dict:
        """
        Change master password without re-encrypting all data.

        This is the key advantage of hybrid encryption:
        - Only master key needs re-encryption
        - Session keys stay encrypted with same master key
        - User data stays encrypted with same session keys

        Args:
            old_password: Current password
            new_password: New password

        Returns:
            Dict with status and updated_at

        Raises:
            InvalidPasswordError: If old password incorrect
            ValueError: If keychain not initialized
        """
        # Unlock with old password to get master key
        master_key = KeychainManager.unlock(old_password)

        # Generate new salt for better security
        new_salt = os.urandom(16)

        # Re-encrypt master key with new password
        encrypted = encrypt_master_key(master_key, new_password, new_salt)

        # Update database
        now = _utcnow()
        with db() as conn:
            conn.execute(
                """
                UPDATE keychain
                SET encrypted_master_key = ?, salt = ?, updated_at = ?
                WHERE id = 1
                """,
                (json.dumps(encrypted), new_salt.hex(), now),
            )

        return {"status": "password_changed", "updated_at": now}

    @staticmethod
    def create_session_key(session_id: str, master_key: bytes) -> bytes:
        """
        Generate and encrypt a new session key for a session.

        Args:
            session_id: UUID of session
            master_key: Decrypted master key

        Returns:
            32-byte session key (decrypted, ready to use)

        Note:
            Encrypted session key is stored in sessions table.
        """
        # Generate random session key
        session_key = generate_session_key()

        # Encrypt session key with master key
        encrypted = encrypt_session_key(session_key, master_key)

        # Generate salt for this session
        session_salt = os.urandom(16)

        # Store encrypted session key in database
        with db() as conn:
            conn.execute(
                """
                UPDATE sessions
                SET encrypted_session_key = ?, session_salt = ?, encryption_version = 1
                WHERE id = ?
                """,
                (json.dumps(encrypted), session_salt.hex(), session_id),
            )

        return session_key

    @staticmethod
    def get_session_key(session_id: str, master_key: bytes) -> bytes:
        """
        Decrypt and return session key for a session.

        Args:
            session_id: UUID of session
            master_key: Decrypted master key

        Returns:
            32-byte session key (decrypted)

        Raises:
            ValueError: If session has no encryption key
        """
        with db() as conn:
            row = conn.execute(
                "SELECT encrypted_session_key FROM sessions WHERE id = ?",
                (session_id,),
            ).fetchone()

        if not row or not row["encrypted_session_key"]:
            raise ValueError("Session has no encryption key")

        encrypted = json.loads(row["encrypted_session_key"])
        session_key = decrypt_session_key(encrypted, master_key)

        return session_key

    @staticmethod
    def get_encryption_status() -> dict:
        """
        Get overview of encryption status.

        Returns:
            Dict with:
            - initialized: bool (keychain exists)
            - created_at: str (when initialized)
            - version: int (crypto version)
            - total_sessions: int
            - encrypted_sessions: int
            - unencrypted_sessions: int
        """
        with db() as conn:
            # Keychain info
            keychain_row = conn.execute(
                "SELECT created_at, version FROM keychain WHERE id = 1"
            ).fetchone()

            if not keychain_row:
                return {
                    "initialized": False,
                    "total_sessions": 0,
                    "encrypted_sessions": 0,
                    "unencrypted_sessions": 0,
                }

            # Session stats
            total = conn.execute("SELECT COUNT(*) as cnt FROM sessions").fetchone()["cnt"]
            encrypted = conn.execute(
                "SELECT COUNT(*) as cnt FROM sessions WHERE encryption_version >= 1"
            ).fetchone()["cnt"]

            return {
                "initialized": True,
                "created_at": keychain_row["created_at"],
                "version": keychain_row["version"],
                "total_sessions": total,
                "encrypted_sessions": encrypted,
                "unencrypted_sessions": total - encrypted,
            }

    @staticmethod
    def migrate_session_to_encrypted(session_id: str, master_key: bytes) -> dict:
        """
        Migrate an unencrypted session to encrypted (for legacy sessions).

        Args:
            session_id: UUID of session to migrate
            master_key: Decrypted master key

        Returns:
            Dict with status

        Note:
            This creates a session key but does NOT encrypt existing responses.
            Responses will be encrypted on next save.
        """
        # Check if already encrypted
        with db() as conn:
            row = conn.execute(
                "SELECT encryption_version FROM sessions WHERE id = ?",
                (session_id,),
            ).fetchone()

            if not row:
                raise ValueError("Session not found")

            if row["encryption_version"] and row["encryption_version"] >= 1:
                return {"status": "already_encrypted"}

        # Create session key
        KeychainManager.create_session_key(session_id, master_key)

        return {"status": "migrated", "session_id": session_id}
