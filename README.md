# Conecta Empreendedor

Planejamento e execução em `PLANS.md`.

Infra de desenvolvimento (PostgreSQL):
- Copie `.env.example` para `.env`
- Suba o banco: `docker compose up -d db`

Backend (API):
- `cd api`
- `C:\Program Files\nodejs\npm.cmd install`
- `C:\Program Files\nodejs\npm.cmd run dev` (porta `3333`)

Frontend:
- `cd frontend`
- `C:\Program Files\nodejs\npm.cmd install`
- `C:\Program Files\nodejs\npm.cmd run dev` (porta `5173`)
