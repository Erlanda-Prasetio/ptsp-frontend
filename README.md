## PTSP Central Java RAG Chat UI

Next.js 14 UI that connects to the local Python FastAPI RAG backend (`rag_api.py`).

### 1. Prerequisites

From repo root, ensure you have ingested data (run one of your `ingest_*` scripts). Then start the backend:

```bash
python rag_api.py
```

Backend runs at: http://localhost:8001 (health: `/health`).

### 2. Frontend Environment

Create (or edit) `.env.local` in this folder if you need a custom backend URL:

```
RAG_API_URL=http://localhost:8001
```

### 3. Start UI

```bash
npm install
npm run dev
```

Open http://localhost:3000

### 4. How It Works

`/api/chat` (in `app/api/chat/route.ts`) proxies user messages to the Python `/chat` endpoint and returns:

* answer text (`message` -> `content`)
* retrieved sources (filenames, relevance score, preview)
* enabled enhanced RAG features

The component `components/chat-form.tsx` renders answer, sources, and feature badges.

### 5. Deployment Notes

When deploying frontend separately (e.g., Vercel):
1. Host Python API (e.g. on Render / EC2) over HTTPS.
2. Set `RAG_API_URL` env var in Vercel project to that HTTPS URL.
3. Update CORS origins array in `rag_api.py` to include deployed frontend origin.

### 6. Troubleshooting

| Issue | Check |
|-------|-------|
| 500 from `/api/chat` | Backend running? `curl http://localhost:8001/health` |
| Empty / error answer | Vector store loaded? Run ingest script before starting API |
| CORS error in console | Add frontend origin to `allow_origins` in `rag_api.py` |
| Sources not showing | Confirm backend JSON contains `sources` array |

### 7. Suggested Questions

Backend exposes `/suggestions` for predefined Indonesian domain queries; UI currently hardcodes same list.

### 8. Next Improvements

* Stream token output (Server Sent Events) for faster UX
* Add reranking indicator when implemented
* Provide per-source link/download if available

