"""
Tests for Summarize, Upload, History, Favorite, Delete endpoints
"""
import pytest
from conftest import TEST_USER, TEST_PASS

# ── HELPER — get token ─────────────────────────────────
@pytest.fixture(scope="module")
def auth_token(client):
    """Login and return token for use in all tests in this module"""
    response = client.post("/login", json={
        "username": TEST_USER,
        "password": TEST_PASS
    })
    data = response.json()
    assert "access_token" in data, "Login failed — cannot run summarize tests"
    return data["access_token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Return auth headers dict"""
    return {"Authorization": f"Bearer {auth_token}"}


# ── SUMMARIZE TESTS ────────────────────────────────────

def test_summarize_success(client, auth_headers):
    """Valid text returns a summary with all fields"""
    response = client.post("/summarize",
        json={
            "text": "This is a test. " * 50,  # 50 repetitions = enough words
            "length": "short",
            "mode": "normal"
        },
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "bullets" in data
    assert "keywords" in data
    assert "important_sentences" in data
    assert "original_words" in data
    assert "summary_words" in data
    assert len(data["summary"]) > 0


def test_summarize_empty_text(client, auth_headers):
    """Empty text returns an error"""
    response = client.post("/summarize",
        json={"text": "", "length": "short", "mode": "normal"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "error" in data


def test_summarize_no_token(client):
    """Summarize without token returns error"""
    response = client.post("/summarize",
        json={"text": "Some text here", "length": "short", "mode": "normal"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "error" in data


def test_summarize_invalid_token(client):
    """Summarize with invalid token returns error"""
    response = client.post("/summarize",
        json={"text": "Some text here", "length": "short", "mode": "normal"},
        headers={"Authorization": "Bearer invalidtoken123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "error" in data


def test_summarize_word_counts(client, auth_headers):
    """original_words and summary_words are correct integers"""
    text = "This is a test sentence. " * 40
    response = client.post("/summarize",
        json={"text": text, "length": "short", "mode": "normal"},
        headers=auth_headers
    )
    data = response.json()
    assert isinstance(data["original_words"], int)
    assert isinstance(data["summary_words"], int)
    assert data["original_words"] > 0
    assert data["summary_words"] > 0
    assert data["summary_words"] < data["original_words"]


def test_summarize_all_modes(client, auth_headers):
    """All 4 modes return a valid summary"""
    text = "Education is important. " * 40
    for mode in ["normal", "academic", "simple", "research"]:
        response = client.post("/summarize",
            json={"text": text, "length": "short", "mode": mode},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert len(data["summary"]) > 0, f"Mode {mode} returned empty summary"


def test_summarize_all_lengths(client, auth_headers):
    """All 3 lengths return a valid summary"""
    text = "Education is important. " * 60
    for length in ["short", "medium", "long"]:
        response = client.post("/summarize",
            json={"text": text, "length": length, "mode": "normal"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert len(data["summary"]) > 0, f"Length {length} returned empty summary"


# ── HISTORY TESTS ──────────────────────────────────────

def test_history_returns_list(client, auth_headers):
    """History endpoint returns a list"""
    response = client.get("/history", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "history" in data
    assert isinstance(data["history"], list)


def test_history_no_token(client):
    """History without token returns error"""
    response = client.get("/history")
    assert response.status_code == 200
    data = response.json()
    assert "error" in data


def test_history_contains_summary_fields(client, auth_headers):
    """Each history item has required fields"""
    response = client.get("/history", headers=auth_headers)
    data = response.json()
    if len(data["history"]) > 0:
        item = data["history"][0]
        assert "id" in item
        assert "summary" in item
        assert "mode" in item
        assert "length" in item
        assert "created_at" in item
        assert "bullets" in item
        assert "keywords" in item
        assert "important_sentences" in item


# ── FAVORITE TESTS ─────────────────────────────────────

def test_toggle_favorite(client, auth_headers):
    """Can toggle favorite on a history item"""
    # Get history first
    history_response = client.get("/history", headers=auth_headers)
    history = history_response.json()["history"]

    if len(history) == 0:
        pytest.skip("No history items to test favorite")

    item_id = history[0]["id"]
    original_favorite = history[0]["favorite"]

    # Toggle favorite
    response = client.put(f"/favorite/{item_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data

    # Verify it changed
    history_response2 = client.get("/history", headers=auth_headers)
    history2 = history_response2.json()["history"]
    updated_item = next((i for i in history2 if i["id"] == item_id), None)
    assert updated_item is not None
    assert updated_item["favorite"] != original_favorite


# ── DELETE TESTS ───────────────────────────────────────

def test_delete_history_item(client, auth_headers):
    """Can delete a history item"""
    # Get history
    history_response = client.get("/history", headers=auth_headers)
    history = history_response.json()["history"]

    if len(history) == 0:
        pytest.skip("No history items to delete")

    item_id = history[-1]["id"]  # delete the last item
    count_before = len(history)

    # Delete it
    response = client.delete(f"/history/{item_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data

    # Verify it's gone
    history_response2 = client.get("/history", headers=auth_headers)
    history2 = history_response2.json()["history"]
    assert len(history2) == count_before - 1
    assert not any(i["id"] == item_id for i in history2)


def test_delete_nonexistent_item(client, auth_headers):
    """Deleting non-existent item returns error"""
    response = client.delete("/history/999999", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "error" in data


# ── FILE UPLOAD TESTS ──────────────────────────────────

def test_upload_txt_file(client, auth_headers):
    """Can upload and summarize a TXT file"""
    txt_content = b"Education is important for society. " * 50
    response = client.post(
        "/upload?length=short&mode=normal",
        files={"file": ("test.txt", txt_content, "text/plain")},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert len(data["summary"]) > 0


def test_upload_unsupported_format(client, auth_headers):
    """Unsupported file format returns error"""
    response = client.post(
        "/upload?length=short&mode=normal",
        files={"file": ("test.csv", b"col1,col2\n1,2", "text/csv")},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "error" in data


def test_upload_no_token(client):
    """Upload without token returns error"""
    txt_content = b"Some text content here " * 20
    response = client.post(
        "/upload?length=short&mode=normal",
        files={"file": ("test.txt", txt_content, "text/plain")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "error" in data