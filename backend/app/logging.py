import logging
import os
from datetime import datetime
from pathlib import Path

LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

def setup_logging():
    # Performance Log
    perf_logger = logging.getLogger("performance")
    perf_handler = logging.FileHandler(LOG_DIR / "performance.log")
    perf_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    )
    perf_logger.addHandler(perf_handler)
    perf_logger.setLevel(logging.INFO)
    
    # API Log
    api_logger = logging.getLogger("api")
    api_handler = logging.FileHandler(LOG_DIR / "api.log")
    api_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    )
    api_logger.addHandler(api_handler)
    api_logger.setLevel(logging.INFO)
    
    return perf_logger, api_logger

perf_logger, api_logger = setup_logging()

def log_performance(operation: str, duration_ms: float, **kwargs):
    extra_info = " ".join([f"{k}={v}" for k, v in kwargs.items()])
    perf_logger.info(f"{operation} took {duration_ms:.2f}ms {extra_info}")

def log_api_call(endpoint: str, method: str, status_code: int, duration_ms: float):
    api_logger.info(f"{method} {endpoint} - {status_code} - {duration_ms:.2f}ms")







