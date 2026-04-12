# Module 1.1 — Auth Backend

## Status: ✅ Implemented

---

## Files Created

```
backend/src/
├── modules/auth/
│   ├── auth.routes.js       — Express router, mounts all 5 endpoints
│   ├── auth.controller.js   — Thin handlers: validate → service → respond
│   ├── auth.service.js      — Business logic (bcrypt, JWT, Redis, email)
│   └── auth.validator.js    — Input validation (throws 422 on failure)
├── shared/
│   ├── middleware/
│   │   └── auth.middleware.js  — authenticate, optionalAuthenticate, authorize
│   └── utils/
│       ├── jwt.helper.js       — signAccessToken/Refresh, verifyAccessToken/Refresh
│       └── email.helper.js     — sendVerificationEmail (SES in prod, console in dev)

tests/
├── unit/auth.service.test.js         — password hashing, JWT, register, verify, login
└── integration/auth.flow.test.js     — full register→verify→login→refresh→logout flow
```

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | public | Hash password, create user, send verify email |
| POST | /api/auth/verify-email | public | Validate token from Redis, mark isVerified |
| POST | /api/auth/login | public | Return access + refresh tokens |
| POST | /api/auth/logout | Bearer | Blacklist refresh token in Redis |
| POST | /api/auth/refresh-token | public | Rotate refresh token, return new pair |

---

## Key Design Decisions

- **Email verification token**: stored in Redis (`email_verify:{token}` → userId, 24h TTL). No extra DB column needed.
- **Refresh token storage**: stored in Redis (`refresh:{token}` → userId, 7d TTL) for rotation support.
- **Refresh token rotation**: on `/refresh-token`, old token is blacklisted and a new pair is issued.
- **Artist creation**: when `role=artist` is registered, an `Artist` record is created automatically.
- **Email in dev**: logs to console; no real SMTP required.

---

## How to Test

### Unit tests (no DB/Redis needed)
```bash
cd backend
npm run test:unit
```

### Integration tests (requires PostgreSQL + Redis)
```bash
# Start services
docker-compose up -d postgres redis

# Run migrations
npm run db:migrate

# Run integration tests
npm run test:integration
```

### Manual curl smoke test
```bash
# 1. Register
curl -s -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123","displayName":"Test","role":"user"}'

# 2. Copy token from dev console log, then verify
curl -s -X POST http://localhost:8080/api/auth/verify-email \
  -H 'Content-Type: application/json' \
  -d '{"token":"<TOKEN_FROM_LOG>"}'

# 3. Login
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123"}'
```
