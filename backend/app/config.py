"""
Configuration module for Intimacy Tool.

Environment variables:
- FORCE_ENCRYPTION: If "true", require encryption for all new sessions (default: false)
- WARN_UNENCRYPTED: If "true", log warnings when creating unencrypted sessions (default: true)
- INTIMACY_TOOL_DB: Custom database path (optional)
"""

import os
from typing import Literal


def get_bool_env(key: str, default: bool = False) -> bool:
    """Get boolean from environment variable."""
    value = os.environ.get(key, "").lower()
    if value in ("true", "1", "yes", "on"):
        return True
    elif value in ("false", "0", "no", "off"):
        return False
    return default


class Config:
    """Application configuration"""

    # Encryption settings
    FORCE_ENCRYPTION: bool = get_bool_env("FORCE_ENCRYPTION", default=False)
    WARN_UNENCRYPTED: bool = get_bool_env("WARN_UNENCRYPTED", default=True)

    # Database
    DATABASE_PATH: str = os.environ.get("INTIMACY_TOOL_DB", "")

    # Encryption defaults
    MIN_PASSWORD_LENGTH: int = 12
    MAX_PASSWORD_LENGTH: int = 128

    @classmethod
    def is_encryption_required(cls) -> bool:
        """Check if encryption is required for new sessions."""
        return cls.FORCE_ENCRYPTION

    @classmethod
    def should_warn_unencrypted(cls) -> bool:
        """Check if warnings should be logged for unencrypted sessions."""
        return cls.WARN_UNENCRYPTED


# Global config instance
config = Config()
