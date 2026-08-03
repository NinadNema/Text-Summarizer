"""
Tests for Register and Login endpoints
"""
from conftest import TEST_USER, TEST_PASS


# ── REGISTER TESTS ─────────────────────────────────────

def test_register_success(client):
    """New user can register successfully"""
    response = client.post("/register", json={
        "username": TEST_USER,
        "password": TEST_PASS
    })
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == "User registered successfully"


def test_register_duplicate_username(client):
    """Cannot register with an already existing username"""
    # Try registering same user again
    response = client.post("/register", json={
        "username": TEST_USER,
        "password": TEST_PASS
    })
    assert response.status_code == 200
    data = response.json()
    assert "error" in data
    assert data["error"] == "Username already exists"


def test_register_missing_username(client):
    """Cannot register without a username"""
    response = client.post("/register", json={
        "username": "",
        "password": TEST_PASS
    })
    assert response.status_code == 200
    data = response.json()
    assert "error" in data


def test_register_missing_password(client):
    """Cannot register without a password"""
    response = client.post("/register", json={
        "username": TEST_USER,
        "password": ""
    })
    assert response.status_code == 200
    data = response.json()
    assert "error" in data


# ── LOGIN TESTS ────────────────────────────────────────

def test_login_success(client):
    """Registered user can login and gets a token"""
    response = client.post("/login", json={
        "username": TEST_USER,
        "password": TEST_PASS
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["username"] == TEST_USER


def test_login_wrong_password(client):
    """Login fails with wrong password"""
    response = client.post("/login", json={
        "username": TEST_USER,
        "password": "wrongpassword"
    })
    assert response.status_code == 200
    data = response.json()
    assert "error" in data
    assert data["error"] == "Invalid username or password"


def test_login_wrong_username(client):
    """Login fails with non-existent username"""
    response = client.post("/login", json={
        "username": "nonexistentuser999",
        "password": TEST_PASS
    })
    assert response.status_code == 200
    data = response.json()
    assert "error" in data
    assert data["error"] == "Invalid username or password"


def test_login_returns_user_id(client):
    """Login response includes user_id"""
    response = client.post("/login", json={
        "username": TEST_USER,
        "password": TEST_PASS
    })
    data = response.json()
    assert "user_id" in data
    assert isinstance(data["user_id"], int)