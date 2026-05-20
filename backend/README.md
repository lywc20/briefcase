# Backend

Handles chunking, embeddings, and response generation.
Client side handles retrieval

## Requirements

- Textsplitter
- Setence transformer

## Steps

1. Setup a markdown file
2. Chunk the markdown file using the text splitter library from langchain
3. Create embeddings using sentence transformer
4. Writes embeddings to embeddings.json
