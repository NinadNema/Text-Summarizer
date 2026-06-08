import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "..", "summaries.db")

conn = sqlite3.connect(DB_PATH, check_same_thread=False)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# USERS TABLE
cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )
''')

# SUMMARIES TABLE — added bullets, keywords, important_sentences columns
cursor.execute('''
    CREATE TABLE IF NOT EXISTS summaries (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        original_text       TEXT,
        summary             TEXT,
        mode                TEXT,
        length              TEXT,
        created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id             INTEGER,
        favorite            INTEGER DEFAULT 0,
        bullets             TEXT DEFAULT '[]',
        keywords            TEXT DEFAULT '[]',
        important_sentences TEXT DEFAULT '[]'
    )
''')

conn.commit()

# WAL mode — prevents "database is locked" errors under concurrent requests
conn.execute("PRAGMA journal_mode=WAL")