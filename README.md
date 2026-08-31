# Habitly

App multiplataforma (web + iOS + Android) para el seguimiento de hábitos personales, con rachas, calendario/heatmap y soporte offline. Todo en TypeScript.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend (web + iOS + Android) | Expo (React Native) + Expo Router |
| Backend | Fastify (Node.js + TypeScript) |
| ORM | Drizzle ORM |
| Base de datos | PostgreSQL (Docker / self-hosted) |
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
└── docker-compose.yml    # PostgreSQL para desarrollo
```

## Requisitos

- Node.js 18+
- pnpm (`corepack enable` / `corepack prepare pnpm@latest --activate`)
- Docker (para PostgreSQL)

## Puesta en marcha

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Levantar PostgreSQL

```bash
docker compose up -d
```

### 3. Migraciones de base de datos

```bash
pnpm run db:generate   # genera migraciones desde el schema Drizzle
pnpm run db:migrate    # aplica las migraciones a la BD
```

### 4. Backend

```bash
pnpm run dev:backend   # servidor en http://localhost:3001
```

### 5. App mobile (web, iOS o Android)

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

Las credenciales y variables se leen de variables de entorno en el backend:

| Variable | Valor por defecto | Uso |
|---|---|---|
| `DATABASE_URL` | `postgresql://habit_user:habit_pass@localhost:5432/habit_tracker` | Conexión a Postgres |
| `JWT_SECRET` | `dev-secret-change-me` | Secreto para firmar tokens (¡cámbialo en producción!) |
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
