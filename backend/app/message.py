from app.constants import SYSTEM
from pydantic import BaseModel


class Message(BaseModel):
    content: str
    author: str

    @classmethod
    def from_server(cls, content: str):
        return cls(author=SYSTEM, content=content)
