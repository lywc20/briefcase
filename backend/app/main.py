from math import sqrt
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from app.message import Message
from sentence_transformers import SentenceTransformer
from scripts.build_embeddings import build_embeddings

from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"
origins = [
    "http://localhost:3000",
]

app = FastAPI()

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

MODEL = "Qwen/Qwen2.5-3B-Instruct"

cache = {}

torch.random.manual_seed(0)

tokenizer = AutoTokenizer.from_pretrained(MODEL)


cache["generator"] = AutoModelForCausalLM.from_pretrained(MODEL)

generation_args = {
    "max_new_tokens": 500,
    "return_full_text": False,
    "temperature": 0.0,
    "do_sample": False,
}
cv_chunks, cv_embeddings = build_embeddings()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/first_contact")
async def first_const():
    return Message.from_server("You have entered the chat room.")


@app.post("/query")
async def query(payload: Message):

    enc = encode(payload.content)
    relevant_information = get_relevant_chunks(enc, cv_chunks, cv_embeddings)
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
        If the information from the knolwedge base is useful, use it to respond the user statement. Otherwise return a professional response to the query.
    """

    messages = [{"role": "user", "content": prompt}]

    inputs = tokenizer.apply_chat_template(
        messages,
        add_generation_prompt=True,
        tokenize=True,
        return_dict=True,
        return_tensors="pt",
    ).to(cache["generator"].device)

    resp = cache["generator"].generate(**inputs, max_new_tokens=40)
    out = tokenizer.decode(resp[0][inputs["input_ids"].shape[-1] :])

    return out


def encode(message):

    # Load embedding model
    if "model" not in cache:
        cache["model"] = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    # # Generate embeddings
    embeddings = cache["model"].encode(message, convert_to_numpy=True)
    return embeddings


def cosine_similarity(e1, e2):
    dot_product = 0
    sum_of_squares_e1 = 0
    sum_of_squares_e2 = 0
    for element_1, element_2 in zip(e1, e2):
        dot_product += element_1 * element_2
        sum_of_squares_e1 += element_1 * element_1
        sum_of_squares_e2 += element_2 * element_2
    return dot_product / (sqrt(sum_of_squares_e1) * sqrt(sum_of_squares_e2))


def get_relevant_chunks(query_embedding, chunks, embeddings):
    chunk_embedding_pairs = list(zip(chunks, embeddings))
    chunk_embedding_pairs.sort(
        key=lambda embedding: cosine_similarity(query_embedding, embedding[1]),
        reverse=True,
    )
    return [chunk for chunk, _ in chunk_embedding_pairs[:5]]
