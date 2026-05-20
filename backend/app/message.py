from app.constants import SYSTEM

class Message:
    def __init__(self, author, content):
        self.content = content 
        self.author = author

    @classmethod
    def from_server(cls, content):
        return cls(SYSTEM, content)
    
