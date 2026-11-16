# Cloud Storage Frontend (React + Vite)

This frontend is wired to the FastAPI backend in `../backend` and supports:

- Email/password auth (`/auth/register`, `/auth/login`)
- Drive (folders + files listing)
- Folder navigation (`/folders/:id`)
- Drag & drop uploads (`POST /upload?folder_id=...`) with progress
- File preview + download via signed URLs (`/files/:id/preview`, `/files/:id/download`)
- Search (`/files/search`)
- Sharing (file/folder) (`POST /shares`, `GET /shares/me`)
- Public links (`POST /public`, `GET /public/:token`)
- Trash + restore + permanent delete (`/files/trash/list`, `/files/:id/restore`, `/files/:id/permanent`)

Notes:
- Stars are **client-only** in this MVP (stored in `localStorage`) because the backend currently has no stars endpoints.
- The backend uses `HTTPBearer`, so the JWT is stored in `localStorage` and sent via the `Authorization: Bearer ...` header.

## Dev setup

1) Start the backend (default `http://localhost:8000`).
2) In `frontend/`, install deps and run:

- `npm install`
- `npm run dev`

The Vite dev server proxies `/api/*` to the backend. Configure with `frontend/.env.example`:

- `VITE_API_BASE_URL=/api`
- `VITE_DEV_PROXY_TARGET=http://localhost:8000`
