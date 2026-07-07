# Backend Subrepo

The Briefcase backend serves as the RAG (Retrieval-Augmented Generation) query processor. It chunks raw CV documents, runs a local similarity search, and streams answers using a local quantized LLM.

## 🚀 Key Features

*   **Privacy-First**: No data is sent to external API providers (e.g., OpenAI). All embedding similarity search and text generation run entirely locally.
*   **Vector Search**: Utilizes **FAISS** (`IndexFlatIP`) for high-speed in-memory vector calculations.
*   **Concurrency Handling**: CPU/GPU-intensive processes are offloaded to FastAPI's background threadpool via `run_in_threadpool` to prevent blocking the event loop.
*   **Inference Cancellation**: Actively checks for client disconnections and terminates local LLM generation loops immediately if the user aborts, preventing resource waste.

---

## 🛠️ Requirements

*   **Python**: `>=3.12, <3.13`
*   **Package Manager**: `uv` (recommended) or `pip`
*   **Local LLM Weights**: Download `Qwen2.5-7B-Instruct-Q4_K_M.gguf` and place it in the `models/` directory:
    *   Path: `backend/models/Qwen2.5-7B-Instruct-Q4_K_M.gguf`

---

## 💻 Setup & Running

1.  **Install Dependencies**:
    Using `uv` (recommended):
    ```bash
    uv sync
    ```
    Using standard `pip`:
    ```bash
    pip install -r pyproject.toml
    ```

2.  **Ensure CV Data is Present**:
    Ensure [cv.md](file:///Users/v/Projects/playground/briefcase/backend/cv.md) contains your target resume/CV content.

3.  **Run Development Server**:
    Using `uv`:
    ```bash
    uv run fastapi dev
    ```
    The server will boot and run on [http://localhost:8000](http://localhost:8000).
