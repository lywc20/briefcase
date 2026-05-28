from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from app.message import Message
from sentence_transformers import SentenceTransformer
from scripts.build_embeddings import build_embeddings
from contextlib import asynccontextmanager
from transformers import AutoModelForCausalLM, AutoTokenizer
from numpy import linalg, dot
import torch

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"
origins = [
    "http://localhost:3000",
]

cache = {}

MODEL = "Qwen/Qwen2.5-3B-Instruct"


@asynccontextmanager
async def startup(app: FastAPI):
    print(f"{'-' * 5} Starting Up {'-' * 5}")

    torch.random.manual_seed(0)

    cache["tokenizer"] = AutoTokenizer.from_pretrained(MODEL)

    cache["generator"] = AutoModelForCausalLM.from_pretrained(MODEL)

    cache["cv_chunks"], cache["cv_embeddings"] = build_embeddings()

    yield

    print(f"{'-' * 5} Shutting Down {'-' * 5}")


app = FastAPI(lifespan=startup)

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


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/first_contact")
async def first_const():
    return Message.from_server("You have entered the chat room.")


@app.post("/query")
async def query(payload: Message):

    enc = encode(payload.content)
    relevant_information = get_relevant_chunks(
        enc, cache["cv_chunks"], cache["cv_embeddings"]
    )
    resp = generate_response(relevant_information, payload.content)

    return Message.from_server(str(resp))


def generate_response(chunks, query_text):
    if "generator" not in cache:
        raise (RuntimeError("Error locating generator"))

    prompt = f"""
        You're representative for this full-stack engineer.
        A user made a query and the following information was received from the knowledge base that seems to relate to the user made query.
        ${chunks}

        Here's the query the user made. 
        ${query_text}
        If the information from the knowledge base is useful, use it to respond the user statement. Otherwise return a professional response to the query.
    """

    messages = [{"role": "user", "content": prompt}]

    inputs = (
        cache["tokenizer"]
        .apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        )
        .to(cache["generator"].device)
    )
    with torch.inference_mode():
        resp = cache["generator"].generate(**inputs, max_new_tokens=40)

    out = cache["tokenizer"].decode(
        resp[0][inputs["input_ids"].shape[-1] :], skip_special_tokens=True
    )

    return out


def encode(message):

    # Load embedding model
    if "model" not in cache:
        cache["model"] = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    # # Generate embeddings
    embeddings = cache["model"].encode(message, convert_to_numpy=True)
    return embeddings


def cosine_similarity(e1, e2):
    return dot(e1, e2) / (linalg.norm(e1) * linalg.norm(e2))


def get_relevant_chunks(query_embedding, chunks, embeddings):
    chunk_embedding_pairs = list(zip(chunks, embeddings))
    chunk_embedding_pairs.sort(
        key=lambda embedding: cosine_similarity(query_embedding, embedding[1]),
        reverse=True,
    )
    return [chunk for chunk, _ in chunk_embedding_pairs[:5]]
