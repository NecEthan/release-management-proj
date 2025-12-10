# React + Express Starter

A minimal full-stack setup:
- Server: Express (CommonJS) with CORS and JSON.
- Client: React (Vite).

## Quick Start

### 1) Install deps
```powershell
# Run these from the repo root or respective folders
Set-Location "server"; npm install; Set-Location ..
Set-Location "client"; npm install; Set-Location ..
```

### 2) Run dev
```powershell
# In one terminal
Set-Location "server"; npm run dev

# In another terminal
Set-Location "client"; npm run dev
```

Server runs on `http://localhost:5000` and client on `http://localhost:3000`.
The client fetches `GET /api/health` from the server.

### 3) Configure env (optional)
Copy `server/.env.example` to `server/.env` and update `PORT`.

```powershell
Copy-Item "server/.env.example" "server/.env"
```

## Notes
- Using CommonJS on the server avoids ESM/TypeScript loader issues.
- You can add routes in `server/index.js` and components in `client/src`.
