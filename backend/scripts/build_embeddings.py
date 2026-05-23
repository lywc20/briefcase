"""
Script to chunk markdown files and convert to static embeddings
"""

from langchain_text_splitters import (
    MarkdownHeaderTextSplitter,
    RecursiveCharacterTextSplitter,
)
from langchain_community.document_loaders import TextLoader
from sentence_transformers import SentenceTransformer


def build_embeddings():
    # Load CV
    loader = TextLoader("cv.md", encoding="utf-8")
    docs = loader.load()

    # Extract raw markdown text
    markdown_text = docs[0].page_content

    # Split markdown by headers
    headers_to_split_on = [
        ("#", "Header 1"),
        ("##", "Header 2"),
        ("###", "Header 3"),
    ]

    markdown_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=headers_to_split_on
    )

    header_splits = markdown_splitter.split_text(markdown_text)

    # Further split into smaller chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)

    chunks = text_splitter.split_documents(header_splits)

    # Extract chunk text
    chunk_texts = [chunk.page_content for chunk in chunks]

    # Load embedding model
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    # Generate embeddings
    embeddings = model.encode(chunk_texts, convert_to_numpy=True).tolist()
    print(f"Number of chunks: {len(chunk_texts)}")

    return chunk_texts, embeddings


# with open("embeddings.json", "wb") as f:
#     f.write(orjson.dumps(embeddings))
