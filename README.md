# SummarAI — AI Text Summarizer

A full-stack AI-powered text summarizer built with React + FastAPI + BART.

## Features
- Summarize text or upload PDF, DOCX, TXT files
- 4 summary modes — Normal, Academic, Simple, Research
- Keyword extraction and highlighting
- Key points and important sentences
- Summary history with favorites
- Dark / Light mode

## Tech Stack
- **Frontend**: React, CSS
- **Backend**: FastAPI, SQLite, Python
- **AI Model**: Facebook BART (facebook/bart-large-cnn)

## Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Environment Variables
Create `backend/.env`:
```
SECRET_KEY=your_secret_key_here
ALLOWED_ORIGINS=http://localhost:3000
```