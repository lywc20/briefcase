# Briefcase 💼

Briefcase is a privacy-first, self-hosted AI portfolio and resume assistant. It implements a local Retrieval-Augmented Generation (RAG) pipeline to let users interactively chat with your CV/resume.

## 🏗️ Architecture Overview

The project is structured as a monorepo containing two main sub-repositories:

*   **[backend](file:///Users/v/Projects/playground/briefcase/backend)**: A **FastAPI** server that chunks your `cv.md`, indexes it using **FAISS** vector search, and streams answers using a local **Qwen 2.5 7B Instruct** LLM via `llama-cpp-python`.
*   **[frontend](file:///Users/v/Projects/playground/briefcase/frontend)**: A **Next.js 16** and **React 19** single-page web app styled with **Tailwind CSS v4** that connects to the backend, rendering a chat interface with streaming responses and request cancellation support.

---

## 🛠️ Global Requirements

Before starting, ensure you have the following installed on your machine:

1.  **Python 3.12** (We recommend using [uv](https://github.com/astral-sh/uv) for fast, reliable package management).
2.  **Node.js** (v18.x or higher) and **npm**.
3.  **Llama 3 / Qwen GGUF Model weights**: Download the quantized Qwen model:
    *   Model: `Qwen2.5-7B-Instruct-Q4_K_M.gguf`
    *   Destination: Place it in [backend/models/Qwen2.5-7B-Instruct-Q4_K_M.gguf](file:///Users/v/Projects/playground/briefcase/backend/models/Qwen2.5-7B-Instruct-Q4_K_M.gguf)

---

## ⚡ Quick Start

### 1. Start the Backend
Navigate to the `backend` directory, install Python dependencies, and boot the server:

```bash
cd backend
# Install dependencies and sync virtual environment
uv sync

# Run the FastAPI server in development mode
uv run fastapi dev
```
The backend API will run at **`http://localhost:8000`**.

### 2. Start the Frontend
Navigate to the `frontend` directory, install packages, and boot the development server:

```bash
cd frontend
# Install dependencies
npm install

# Start the dev server
npm run dev
```
The frontend application will be available at **`http://localhost:3000`**.

---

## 📁 Repository Map

```
briefcase/
├── backend/            # FastAPI + Llama.cpp RAG pipeline
│   ├── app/            # Server source code (endpoints & RAG logic)
│   ├── models/         # Holds local GGUF model files
│   └── cv.md           # The resume markdown content source
├── frontend/           # Next.js + React web application
│   ├── src/app/        # App routing & pages layout
│   └── src/components/ # Chat & UI React components
└── README.md           # Global project overview (this file)
```
