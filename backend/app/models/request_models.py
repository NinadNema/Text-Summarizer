from pydantic import BaseModel

class SummaryRequest(BaseModel):

    text: str

    length: str = "medium"

    mode: str = "normal"