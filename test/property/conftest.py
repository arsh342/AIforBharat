"""
Property-based testing configuration and fixtures
"""

import pytest
from hypothesis import settings, Verbosity

# Configure Hypothesis for comprehensive testing
settings.register_profile("default", max_examples=25, verbosity=Verbosity.normal)
settings.register_profile("ci", max_examples=1000, verbosity=Verbosity.verbose)
settings.register_profile("dev", max_examples=10, verbosity=Verbosity.quiet)

# Load profile based on environment
import os
profile = os.getenv("HYPOTHESIS_PROFILE", "default")
settings.load_profile(profile)

@pytest.fixture
def aws_config():
    """Test AWS configuration"""
    return {
        "region": "us-east-1",
        "session_table_name": "test-sessions",
        "temp_storage_bucket": "test-temp-storage",
        "kms_key_id": "test-key-id",
        "bedrock_model_id": "test-model-id",
    }