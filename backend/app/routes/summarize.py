import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Header, HTTPException
from app.models.request_models import SummaryRequest
from app.database import cursor, conn
from app.services.summarizer import (
    generate_summary,
    generate_bullet_summary,
    extract_keywords,
    important_sentences,
    save_summary,
    get_summary_history
)
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token
)
from PyPDF2 import PdfReader
from docx import Document

router = APIRouter()

# FIX: Max upload size = 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024

# HELPER — shared token verification
def get_user_from_header(authorization: str):
    if not authorization:
        return None, {"error": "Token missing"}
    token = authorization.replace("Bearer ", "")
    user = verify_token(token)
    if not user:
        return None, {"error": "Invalid token"}
    return user, None

# -----------------------------------
# REGISTER USER
# -----------------------------------
@router.post("/register")
async def register(data: dict):
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return {"error": "Username and password required"}

    cursor.execute(
        "SELECT * FROM users WHERE username = ?",
        (username,)
    )
    if cursor.fetchone():
        return {"error": "Username already exists"}

    hashed_password = hash_password(password)
    cursor.execute(
        '''
        INSERT INTO users (username, password)
        VALUES (?, ?)
        ''',
        (username, hashed_password)
    )
    conn.commit()
    return {"message": "User registered successfully"}

# -----------------------------------
# LOGIN USER
# -----------------------------------
@router.post("/login")
async def login(data: dict):
    username = data.get("username")
    password = data.get("password")

    cursor.execute(
        "SELECT * FROM users WHERE username = ?",
        (username,)
    )
    user = cursor.fetchone()

    if not user:
        return {"error": "Invalid username or password"}

    user_id = user["id"]
    hashed_password = user["password"]

    if not verify_password(password, hashed_password):
        return {"error": "Invalid username or password"}

    token = create_access_token({
        "user_id": user_id,
        "username": username
    })
    return {
        "access_token": token,
        "user_id": user_id,
        "username": username
    }

# -----------------------------------
# TEXT SUMMARIZATION
# -----------------------------------
@router.post("/summarize")
async def summarize_text(
    request: SummaryRequest,
    authorization: str = Header(None)
):
    user, err = get_user_from_header(authorization)
    if err:
        return err

    # FIX: Backend validation for empty text
    if not request.text.strip():
        return {"error": "Text cannot be empty"}

    user_id  = user["user_id"]
    summary  = generate_summary(request.text, request.length, request.mode)
    bullets  = generate_bullet_summary(summary)
    keywords = extract_keywords(request.text)
    important = important_sentences(request.text)

    save_summary(
        request.text, summary, request.mode, request.length, user_id,
        bullets, keywords, important
    )


    return {
        "summary":              summary,
        "bullets":              bullets,
        "keywords":             keywords,
        "important_sentences":  important,
        "original_words":       len(request.text.split()),
        "summary_words":        len(summary.split())
    }

# -----------------------------------
# FILE UPLOAD SUMMARIZATION
# -----------------------------------
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    length: str = "medium",
    mode: str = "normal",
    authorization: str = Header(None)
):
    user, err = get_user_from_header(authorization)
    if err:
        return err

    user_id = user["user_id"]

    # FIX: Read all bytes once at the top — prevents stream exhaustion
    raw_bytes = await file.read()

    # FIX: File size validation
    if len(raw_bytes) > MAX_FILE_SIZE:
        return {"error": "File too large. Maximum size is 10MB."}

    try:
        text = ""
        filename = file.filename.lower()

        # TXT FILE
        if filename.endswith(".txt"):
            text = raw_bytes.decode("utf-8")

        # PDF FILE
        elif filename.endswith(".pdf"):
            import io
            pdf = PdfReader(io.BytesIO(raw_bytes))
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted

        # DOCX FILE — FIX: uses BytesIO from already-read bytes, no stream issue
        elif filename.endswith(".docx"):
            import io
            doc = Document(io.BytesIO(raw_bytes))
            for para in doc.paragraphs:
                text += para.text + "\n"

        else:
            return {"error": "Unsupported file format. Use .txt, .pdf, or .docx"}

        # EMPTY TEXT CHECK
        if not text.strip():
            return {"error": "No readable text found in the file"}

        summary  = generate_summary(text, length, mode)
        bullets  = generate_bullet_summary(summary)
        keywords = extract_keywords(text)
        important = important_sentences(text)

        save_summary(
            text, summary, mode, length, user_id,
            bullets, keywords, important
        )


        return {
            "summary":             summary,
            "bullets":             bullets,
            "keywords":            keywords,
            "important_sentences": important,
            "original_words":      len(text.split()),
            "summary_words":       len(summary.split())
        }

    except Exception as e:
        return {"error": str(e)}

# -----------------------------------
# SUMMARY HISTORY
# -----------------------------------
@router.get("/history")
async def history(authorization: str = Header(None)):
    user, err = get_user_from_header(authorization)
    if err:
        return err

    data = get_summary_history(user["user_id"])
    return {"history": data}

# -----------------------------------
# DELETE HISTORY ITEM
# -----------------------------------
@router.delete("/history/{summary_id}")
async def delete_history(
    summary_id: int,
    authorization: str = Header(None)
):
    user, err = get_user_from_header(authorization)
    if err:
        return err

    cursor.execute(
        '''
        DELETE FROM summaries
        WHERE id = ? AND user_id = ?
        ''',
        (summary_id, user["user_id"])
    )
    conn.commit()

    # FIX: Check if anything was actually deleted
    if cursor.rowcount == 0:
        return {"error": "History item not found or access denied"}

    return {"message": "History deleted"}

# -----------------------------------
# TOGGLE FAVORITE
# -----------------------------------
@router.put("/favorite/{summary_id}")
async def toggle_favorite(
    summary_id: int,
    authorization: str = Header(None)
):
    user, err = get_user_from_header(authorization)
    if err:
        return err

    cursor.execute(
        '''
        UPDATE summaries
        SET favorite = CASE WHEN favorite = 1 THEN 0 ELSE 1 END
        WHERE id = ? AND user_id = ?
        ''',
        (summary_id, user["user_id"])
    )
    conn.commit()
    return {"message": "Favorite updated"}


# -----------------------------------
# ANALYZE ONLY — no save (used by View button)
# -----------------------------------
@router.post("/analyze")
async def analyze_text(
    request: SummaryRequest,
    authorization: str = Header(None)
):
    user, err = get_user_from_header(authorization)
    if err:
        return err

    if not request.text.strip():
        return {"error": "Text cannot be empty"}

    summary  = generate_summary(request.text, request.length, request.mode)
    bullets  = generate_bullet_summary(summary)
    keywords = extract_keywords(request.text)
    important = important_sentences(request.text)

    return {
        "summary":             summary,
        "bullets":             bullets,
        "keywords":            keywords,
        "important_sentences": important,
        "original_words":      len(request.text.split()),
        "summary_words":       len(summary.split())
    }