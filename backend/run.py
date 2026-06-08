import uvicorn
from dotenv import load_dotenv

load_dotenv()

# Pre-import heavy modules so first request is instant
import app.auth          # loads bcrypt + jose on startup
import app.database      # opens DB connection on startup

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )