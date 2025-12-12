# Restaurant Admin (Frontend)

Minimal React + Vite admin UI for the restaurant backend. Features:
- Login (JWT)
- Tables list
- Orders list
- Kitchen pending items (mark cooking/done)
- Employees create/list
- Reports (today summary)

Quick start (Windows PowerShell):

```powershell
cd d:\backend\frontend
npm install
npm run dev
```

App runs at `http://localhost:3000` by default. The frontend expects the backend at `http://localhost:8080`.
To change backend base URL create an `.env` file with:

```
VITE_API_BASE=http://localhost:8080
```
