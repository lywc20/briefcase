from contextlib import asynccontextmanager
from pathlib import Path

import faiss
import numpy as np
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import (
    MarkdownHeaderTextSplitter,
    RecursiveCharacterTextSplitter,
)
from llama_cpp import Llama
from sentence_transformers import SentenceTransformer
from starlette.concurrency import run_in_threadpool

from app.message import Message

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"
origins = [
    "http://localhost:3000",
]


@asynccontextmanager
async def lifespan_event(app: FastAPI):
    print(f"{'-' * 5} Starting Up {'-' * 5}")

    # Expensive resources
    app.state.embedding_model = SentenceTransformer(
        "sentence-transformers/all-MiniLM-L6-v2"
    )

    app.state.embedder = EmbeddingManager(app.state.embedding_model)

    app.state.llm = Llama(
        model_path="./models/Qwen2.5-7B-Instruct-Q4_K_M.gguf",
        n_ctx=4096,
        n_threads=6,
    )

    app.state.retrieve_manager = RetrieveManager(app.state.embedder)

    yield

    print(f"{'-' * 5} Shutting Down {'-' * 5}")

    del app.state.embedding_model
    del app.state.embedder
    del app.state.llm
    del app.state.retrieve_manager


app = FastAPI(lifespan=lifespan_event)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR / ".next/build"),
    name="static",
)


def get_llm(request: Request) -> Llama:
    return request.app.state.llm


def get_retriever(request: Request):
    return request.app.state.retrieve_manager


def get_embedder(request: Request):
    return request.app.state.embedder


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/first_contact")
async def first_const():
    return Message.from_server("You have entered the chat room.")


@app.post("/query")
async def query(
    query: Message,
    embedder=Depends(get_embedder),
    llm=Depends(get_llm),
    retriever=Depends(get_retriever),
):

    query_embedding = await embedder.encode(query.content)
    retrieved = retriever.get_relevant_chunks(query_embedding)

    if not retrieved:
        return Message.from_server("Unable to find relevant information in CV.")

    chunks = [item["chunk"] for item in retrieved]

    context = "\n\n".join(chunks)

    resp = await GeneratorManager(llm).generate_response(
        query=query.content,
        context=context,
    )

    return Message.from_server(resp)


class EmbeddingManager:
    def __init__(self, model):
        self.model = model

    def sync_encode(self, text) -> np.ndarray:
        return self.model.encode(text, convert_to_numpy=True)

    async def encode(self, text) -> np.ndarray:
        return await run_in_threadpool(
            self.model.encode,
            text,
            convert_to_numpy=True,
        )


class RetrieveManager:
    def build_cv_chunks(self):
        try:
            # Load CV
            loader = TextLoader("cv.md", encoding="utf-8")
            docs = loader.load()
        except Exception:
            print("Unable to find cv.md")
            raise

        # Extract raw markdown text
        markdown_text = docs[0].page_content

        # Split markdown by headers
        headers_to_split_on = [
            ("#", "Header 1"),
            ("##", "Header 2"),
            ("###", "Header 3"),
        ]

        markdown_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=headers_to_split_on, strip_headers=False
        )

        header_splits = markdown_splitter.split_text(markdown_text)

        # Further split into smaller chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)

        chunks = text_splitter.split_documents(header_splits)

        # Extract chunk text
        chunk_texts = [chunk.page_content for chunk in chunks]
        return chunk_texts

    def __init__(self, em: EmbeddingManager):
        self.cv_chunks = self.build_cv_chunks()
        self.cv_embeddings = em.sync_encode(self.cv_chunks).astype("float32")
        self.normalize_embeddings(self.cv_embeddings)
        self.index = self.build_index()

    def build_index(self):
        print(f"{'-' * 5} Building vector index {'-' * 5}")

        embeddings = self.cv_embeddings.astype("float32")

        if len(embeddings) == 0:
            raise ValueError("No embeddings generated")

        dimension = embeddings.shape[1]

        index = faiss.IndexFlatIP(dimension)
        index.add(embeddings)
        return index

    def normalize_embeddings(self, embeddings):
        faiss.normalize_L2(embeddings)

    def get_relevant_chunks(self, query_vector: np.ndarray) -> list[dict]:
        query_vector = query_vector.astype("float32").reshape(1, -1)
        self.normalize_embeddings(query_vector)

        scores, indices = self.index.search(
            query_vector,
            5,
        )
        results = []

        for score, idx in zip(scores[0], indices[0]):
            if score >= 0.10:
                results.append(
                    {
                        "chunk": self.cv_chunks[idx],
                        "score": float(score),
                    }
                )

        return results


class GeneratorManager:
    def __init__(self, llm):
        self.llm = llm

    def _generate_response(self, query, context):

        messages = [
            {
                "role": "system",
                "content": """
                    You are a helpful assistant. You are a professional assistant representing the owner of a CV.

                    Your primary purpose is to answer questions about the person's:

                    - work experience
                    - education
                    - projects
                    - skills
                    - qualifications

                    Use the provided CV context when answering.

                    If the answer cannot be found in the CV, clearly say that the information is not available in the CV rather than inventing details.

                    Treat the context as the authoritative source of information about the person.
                    """,
            },
            {
                "role": "user",
                "content": f"Context:\n{context}",
            },
            {
                "role": "user",
                "content": query,
            },
        ]

        response = self.llm.create_chat_completion(
            messages=messages,
            max_tokens=256,
            temperature=0.7,
        )

        return response["choices"][0]["message"]["content"]

    async def generate_response(self, query, context):
        return await run_in_threadpool(
            self._generate_response,
            query,
            context,
        )
