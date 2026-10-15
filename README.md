# DocReader-RAG

DocReader-RAG is a full-stack Retrieval-Augmented Generation (RAG) application that allows users to upload PDF documents and ask questions in natural language. The system extracts content, generates embeddings, stores them in a vector database, and generates contextual answers using AI.

## 🚀 Features

- **Document Ingestion**: Upload PDF documents with secure parsing and background job processing.
- **RAG Architecture**: Uses semantic embeddings and vector similarity search to retrieve relevant text chunks from uploaded PDFs.
- **Interactive Chat**: Real-time contextual chat interface with Markdown and code rendering.
- **User Authentication**: Secure authentication powered by Firebase Auth.
- **Asynchronous Processing**: Background job queues using BullMQ and Valkey (Redis-compatible) for smooth document chunking and vector indexing.

---

## 🛠️ Tech Stack

### Client
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication
- **Icons & Markdown**: Lucide React, React Markdown, Remark GFM

### Server
- **Runtime**: Node.js & Express
- **AI & RAG**: LangChain (`@langchain/google-genai`, `@langchain/openai`, `@langchain/qdrant`, `@langchain/community`)
- **Vector Database**: Qdrant
- **Task Queue**: BullMQ with Valkey / Redis
- **File Uploads**: Multer & pdf-parse

---

## 📋 Prerequisites

- **Node.js** (v18+)
- **Docker & Docker Compose** (for Valkey & Qdrant)
- **API Keys**: Google Gemini API Key and/or OpenAI API Key, Firebase Project credentials

---

## ⚙️ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/SHARIQ-MANSOORI/DocReader-RAG.git
cd DocReader-RAG
```

### 2. Start Services via Docker
Start the Valkey (Queue) and Qdrant (Vector DB) containers:
```bash
docker compose up -d
```

### 3. Server Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory (reference `.env.example`):
```env
PORT=8000
GOOGLE_API_KEY=your_gemini_api_key
QDRANT_URL=http://localhost:6333
REDIS_HOST=localhost
REDIS_PORT=6379
```
Run the server and queue worker:
```bash
# Terminal 1: Run server
npm run dev

# Terminal 2: Run worker
npm run dev:worker
```

### 4. Client Setup
```bash
cd ../client
npm install
```
Create a `.env` file in the `client` directory (reference `.env.example`):
```env
VITE_API_URL=http://localhost:8000
# Firebase configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
Start the client development server:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
