# Contratos de API (rascunho v1)

Objetivo: alinhar entidades/fluxos antes da implementação. Campos finais podem evoluir.

## Auth (Representantes)
- `POST /auth/register` (cria empresa + representante owner)
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`

## Empresas
- `GET /companies/:id`
- `PATCH /companies/:id`
- `POST /companies/:id/logo` (v1: atualiza `logoUrl`; upload real futuro)

## Representantes
- `GET /companies/:id/representatives`
- `POST /companies/:id/representatives` (convidar/cadastrar)
- `POST /representatives/:id/approve`
- `POST /representatives/:id/reject`
- `POST /representatives/:id/disable`

## Me
- `GET /me`

## Feed
- `GET /posts`
- `POST /posts`
- `POST /posts/:id/like`
- `POST /posts/:id/comments`

## Serviços
- `GET /service-categories`
- `POST /service-offerings`
- `GET /service-offerings?companyId=...&categoryId=...`
- `POST /service-requests`
- `GET /service-requests`
- `POST /service-requests/:id/proposals`
- `POST /service-proposals/:id/accept`
- `POST /service-proposals/:id/reject`

## Avaliações
- `POST /jobs/:id/reviews`
- `GET /companies/:id/reviews`
