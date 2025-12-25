import os
import logging
import pytest
from pathlib import Path
from app.logging import log_performance, log_api_call, perf_logger, api_logger


class TestLogPerformance:
    """Tests for log_performance function."""
    
    def test_log_performance_basic(self, tmp_path, monkeypatch):
        """Test that log_performance writes to log file."""
        # Create a temporary log directory
        log_dir = tmp_path / "logs"
        log_dir.mkdir()
        log_file = log_dir / "performance.log"
        
        # Monkeypatch the log handler to use temp file
        perf_logger.handlers.clear()
        handler = logging.FileHandler(log_file)
        handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )
        perf_logger.addHandler(handler)
        
        log_performance("test_operation", 123.45, session_id="test123", count=5)
        
        # Verify log was written
        assert log_file.exists()
        content = log_file.read_text()
        assert "test_operation" in content
        assert "123.45" in content
        assert "session_id=test123" in content
        assert "count=5" in content
        
    def test_log_performance_multiple_kwargs(self, tmp_path):
        """Test log_performance with multiple keyword arguments."""
        log_dir = tmp_path / "logs"
        log_dir.mkdir()
        log_file = log_dir / "performance.log"
        
        perf_logger.handlers.clear()
        handler = logging.FileHandler(log_file)
        handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )
        perf_logger.addHandler(handler)
        
        log_performance(
            "complex_operation",
            456.78,
            template_id="t1",
            question_count=10,
            item_count=20,
            extra="info"
        )
        
        content = log_file.read_text()
        assert "complex_operation" in content
        assert "456.78" in content
        assert "template_id=t1" in content
        assert "question_count=10" in content
        assert "item_count=20" in content
        
    def test_log_performance_zero_duration(self, tmp_path):
        """Test log_performance with zero duration."""
        log_dir = tmp_path / "logs"
        log_dir.mkdir()
        log_file = log_dir / "performance.log"
        
        perf_logger.handlers.clear()
        handler = logging.FileHandler(log_file)
        handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )
        perf_logger.addHandler(handler)
        
        log_performance("fast_operation", 0.0)
        
        content = log_file.read_text()
        assert "fast_operation" in content
        assert "0.00" in content or "0.0" in content
        
    def test_log_performance_no_kwargs(self, tmp_path):
        """Test log_performance without keyword arguments."""
        log_dir = tmp_path / "logs"
        log_dir.mkdir()
        log_file = log_dir / "performance.log"
        
        perf_logger.handlers.clear()
        handler = logging.FileHandler(log_file)
        handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )
        perf_logger.addHandler(handler)
        
        log_performance("simple_operation", 100.0)
        
        content = log_file.read_text()
        assert "simple_operation" in content
        assert "100.0" in content or "100.00" in content


class TestLogApiCall:
    """Tests for log_api_call function."""
    
    def test_log_api_call_basic(self, tmp_path):
        """Test that log_api_call writes to log file."""
        log_dir = tmp_path / "logs"
        log_dir.mkdir()
        log_file = log_dir / "api.log"
        
        api_logger.handlers.clear()
        handler = logging.FileHandler(log_file)
        handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )
        api_logger.addHandler(handler)
        
        log_api_call("/api/sessions", "GET", 200, 50.5)
        
        # Verify log was written
        assert log_file.exists()
        content = log_file.read_text()
        assert "/api/sessions" in content
        assert "GET" in content
        assert "200" in content
        assert "50.5" in content or "50.50" in content
        
    def test_log_api_call_post(self, tmp_path):
        """Test log_api_call with POST method."""
        log_dir = tmp_path / "logs"
        log_dir.mkdir()
        log_file = log_dir / "api.log"
        
        api_logger.handlers.clear()
        handler = logging.FileHandler(log_file)
        handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )
        api_logger.addHandler(handler)
        
        log_api_call("/api/sessions/123/compare", "POST", 200, 250.75)
        
        content = log_file.read_text()
        assert "POST" in content
        assert "/api/sessions/123/compare" in content
        
    def test_log_api_call_error_status(self, tmp_path):
        """Test log_api_call with error status codes."""
        log_dir = tmp_path / "logs"
        log_dir.mkdir()
        log_file = log_dir / "api.log"
        
        api_logger.handlers.clear()
        handler = logging.FileHandler(log_file)
        handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )
        api_logger.addHandler(handler)
        
        log_api_call("/api/sessions/invalid", "GET", 404, 10.0)
        log_api_call("/api/sessions/error", "POST", 500, 5.0)
        
        content = log_file.read_text()
        assert "404" in content
        assert "500" in content
        
    def test_log_api_call_long_duration(self, tmp_path):
        """Test log_api_call with long duration."""
        log_dir = tmp_path / "logs"
        log_dir.mkdir()
        log_file = log_dir / "api.log"
        
        api_logger.handlers.clear()
        handler = logging.FileHandler(log_file)
        handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )
        api_logger.addHandler(handler)
        
        log_api_call("/api/sessions/compare", "POST", 200, 1234.567)
        
        content = log_file.read_text()
        assert "1234.56" in content or "1234.57" in content
        
    def test_log_api_call_format(self, tmp_path):
        """Test that log_api_call format is correct."""
        log_dir = tmp_path / "logs"
        log_dir.mkdir()
        log_file = log_dir / "api.log"
        
        api_logger.handlers.clear()
        handler = logging.FileHandler(log_file)
        handler.setFormatter(
            logging.Formatter('%(message)s')  # Simple format for testing
        )
        api_logger.addHandler(handler)
        
        log_api_call("/test/endpoint", "PUT", 201, 99.99)
        
        content = log_file.read_text()
        # Format should be: "PUT /test/endpoint - 201 - 99.99ms"
        assert "PUT" in content
        assert "/test/endpoint" in content
        assert "201" in content
        assert "99.99" in content or "100.0" in content  # Might round


class TestLoggingSetup:
    """Tests for logging setup and configuration."""
    
    def test_perf_logger_exists(self):
        """Test that perf_logger is configured."""
        assert perf_logger is not None
        assert isinstance(perf_logger, logging.Logger)
        assert perf_logger.name == "performance"
        
    def test_api_logger_exists(self):
        """Test that api_logger is configured."""
        assert api_logger is not None
        assert isinstance(api_logger, logging.Logger)
        assert api_logger.name == "api"
        
    def test_loggers_have_handlers(self):
        """Test that loggers have handlers configured."""
        assert len(perf_logger.handlers) > 0
        assert len(api_logger.handlers) > 0
        
    def test_loggers_level(self):
        """Test that loggers are set to INFO level."""
        assert perf_logger.level <= logging.INFO
        assert api_logger.level <= logging.INFO








