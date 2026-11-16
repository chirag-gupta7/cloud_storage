# Cloud Storage

A full-stack cloud storage web application built with React and FastAPI.

## Features

- User authentication (JWT) with register/login
- File upload with drag-and-drop and progress tracking
- Folder creation and navigation
- File preview and download via signed URLs
- File search
- File and folder sharing with public links
- Trash with restore and permanent delete
- Star files (client-only)

## Tech Stack

**Frontend**

- React 19 + Vite
- Tailwind CSS
- React Router, React Query, Axios
- React Dropzone, Lucide Icons

**Backend**

- FastAPI (Python)
- SQLAlchemy + PostgreSQL
- Supabase (file storage)
- JWT authentication (python-jose, passlib, bcrypt)

## Project Structure

```
cloud_storage/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── services/  # API clients
│   │   ├── state/     # Auth store
│   │   ├── ui/        # Pages and components
│   │   └── utils/     # Helpers
│   └── package.json
├── backend/           # FastAPI app
│   ├── app/
│   │   ├── core/      # Config, security
│   │   ├── db/        # Models, database
│   │   ├── routes/    # API endpoints
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Business logic
│   │   └── utils/     # Helpers
│   ├── requirements.txt
│   └── .env
└── README.md
```

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```
DATABASE_URL=postgresql://user:password@host:port/dbname
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
SUPABASE_BUCKET=files
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```
VITE_API_BASE_URL=/api
VITE_DEV_PROXY_TARGET=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

The app runs at `http://localhost:5173` and proxies API requests to the backend.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and get JWT token |
| GET | `/folders` | List root folders |
| POST | `/folders` | Create a folder |
| GET | `/folders/:id` | Get folder contents |
| POST | `/upload?folder_id=` | Upload files to a folder |
| GET | `/files/search` | Search files |
| GET | `/files/:id/preview` | Preview a file |
| GET | `/files/:id/download` | Download a file |
| POST | `/shares` | Share a file or folder |
| GET | `/shares/me` | List my shares |
| POST | `/public` | Create public link |
| GET | `/public/:token` | Access public link |
| GET | `/files/trash/list` | List trashed files |
| POST | `/files/:id/restore` | Restore from trash |
| DELETE | `/files/:id/permanent` | Permanent delete |
