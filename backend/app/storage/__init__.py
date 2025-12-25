"""
Persistence adapters.

This package contains storage providers that encapsulate how sessions and responses
are persisted. Domain logic must not depend on this package.
"""

from app.storage.sqlite import SqliteStorageProvider

_default_provider = SqliteStorageProvider()


def get_storage() -> SqliteStorageProvider:
    return _default_provider


__all__ = ["get_storage", "SqliteStorageProvider"]

