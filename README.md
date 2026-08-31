# Habitly

App multiplataforma (web + iOS + Android) para el seguimiento de hábitos personales, con rachas, calendario/heatmap y soporte offline. Todo en TypeScript.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend (web + iOS + Android) | Expo (React Native) + Expo Router |
| Backend | Fastify (Node.js + TypeScript) |
| ORM | Drizzle ORM |
| Base de datos | PostgreSQL (Supabase - cloud) |
| Almacenamiento local / offline | SQLite (expo-sqlite) |
| Autenticación | JWT (bcryptjs) |

## Estructura del monorepo

```
Habittracker/
├── apps/
│   └── mobile/          # App Expo (web + iOS + Android)
│       ├── app/          # Rutas (Expo Router)
│       ├── lib/          # API client, auth, contexto de sesión
│       └── types/        # Tipos de entorno
├── backend/
│   ├── src/
│   │   ├── routes/       # Endpoints
│   │   ├── auth/         # JWT, password, guard
│   │   └── db/           # Schema + conexión Drizzle
│   └── drizzle/          # Migraciones SQL
├── packages/
│   └── shared-types/     # Tipos TS compartidos (app + backend)
└── docker-compose.yml    # PostgreSQL local (opcional, para desarrollo)
```

## Requisitos

- Node.js 18+
- pnpm (`corepack enable` / `corepack prepare pnpm@latest --activate`)
- Una base de datos PostgreSQL (recomendado: Supabase, plan gratuito)

## Puesta en marcha

### 1. Configurar el entorno

Copia el archivo de ejemplo y rellena tus credenciales:

```bash
cp backend/.env.example backend/.env
```

En `backend/.env`, pon la `DATABASE_URL` que te da tu proveedor de PostgreSQL
(por ejemplo, la "Connection string" de Supabase) y un `JWT_SECRET` propio.

> El archivo `.env` está en `.gitignore`, así que tus credenciales **no** se suben al repo.

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. (Opcional) PostgreSQL local con Docker

Si prefieres una BD local en vez de la nube:

```bash
docker compose up -d
```
y usa `postgresql://habit_user:habit_pass@localhost:5432/habit_tracker` como `DATABASE_URL`.

### 4. Migraciones de base de datos

```bash
pnpm run db:generate   # genera migraciones desde el schema Drizzle
pnpm run db:migrate    # aplica las migraciones a la BD
```

### 5. Backend

```bash
pnpm run dev:backend   # servidor en http://localhost:3001
```

### 6. App mobile (web, iOS o Android)

```bash
pnpm run dev:mobile -- --web      # versión web
pnpm run dev:mobile -- --ios      # simulador iOS
pnpm run dev:mobile -- --android  # emulador Android
```

## Comandos útiles

| Comando | Descripción |
|---|---|
| `pnpm run dev:backend` | Backend en modo desarrollo (recarga automática) |
| `pnpm run dev:mobile` | App Expo |
| `pnpm run db:generate` | Genera migraciones Drizzle |
| `pnpm run db:migrate` | Aplica migraciones a la BD |
| `pnpm -r typecheck` | Typecheck de todos los workspaces |

## Configuración

Las credenciales se leen de `backend/.env` (usa `.env.example` como plantilla):

| Variable | Ejemplo | Uso |
|---|---|---|
| `DATABASE_URL` | `postgresql://usuario:password@host:5432/database` | Conexión a PostgreSQL (Supabase, local con Docker, etc.) |
| `JWT_SECRET` | `cambia-esto-por-un-secreto-largo` | Secreto para firmar tokens (¡cámbialo!) |
| `PORT` | `3001` | Puerto del backend |

En la app mobile, la URL del API se configura con:

```
EXPO_PUBLIC_API_URL=http://<ip-o-dominio>:3001
```

## Endpoints API

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Registrar usuario | No |
| `POST` | `/auth/login` | Iniciar sesión (devuelve JWT) | No |
| `GET` | `/health` | Health check público | No |
| `GET` | `/health/protected` | Health check autenticado | Sí |

## Estado del proyecto (por fases)

- [x] **Fase 1 — Setup inicial:** monorepo, app Expo base, backend Fastify, docker-compose con Postgres
- [x] **Fase 2 — Auth:** registro/login con JWT
- [ ] **Fase 3 — CRUD de hábitos:** backend + pantallas
- [ ] **Fase 4 — Logs diarios + cálculo de rachas**
- [ ] **Fase 5 — Offline-first:** SQLite local + cola de sincronización
- [ ] **Fase 6 — UI de calendario/heatmap**
- [ ] **Fase 7 — Notificaciones**
- [ ] **Fase 8 — Polido de UI/temas**
