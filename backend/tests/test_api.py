"""
Tests for general API health and root endpoint
"""

def test_api_root(client):
    """Root endpoint returns running message"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "Running" in data["message"]


def test_api_404(client):
    """Unknown endpoint returns 404"""
    response = client.get("/nonexistent")
    assert response.status_code == 404


def test_api_login_endpoint_exists(client):
    """Login endpoint exists and accepts POST"""
    response = client.post("/login", json={
        "username": "checkendpoint",
        "password": "checkendpoint"
    })
    # Should return 200 with error message, not 404
    assert response.status_code == 200


def test_api_register_endpoint_exists(client):
    """Register endpoint exists and accepts POST"""
    response = client.post("/register", json={
        "username": "",
        "password": ""
    })
    assert response.status_code == 200


def test_api_history_endpoint_exists(client):
    """History endpoint exists"""
    response = client.get("/history")
    assert response.status_code == 200