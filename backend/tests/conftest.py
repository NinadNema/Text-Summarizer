import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import cursor, conn

# ── SHARED TEST CLIENT ─────────────────────────────────
@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c

# ── CLEAN UP TEST USERS AFTER ALL TESTS ───────────────
@pytest.fixture(scope="session", autouse=True)
def cleanup():
    yield
    # Delete test users created during tests
    cursor.execute("DELETE FROM users WHERE username LIKE 'testuser%'")
    cursor.execute("DELETE FROM summaries WHERE original_text LIKE 'This is a test%'")
    conn.commit()

# ── SHARED TEST CREDENTIALS ───────────────────────────
TEST_USER = "testuser_pytest"
TEST_PASS = "testpassword123"