# Prescriptions App

Prueba Tecnica de una Aplicacion de Prescripciones Medicas.

## Stack

### Backend

- NestJS
- Prisma ORM 7
- PostgreSQL en Railway
- JWT access token + refresh token
- RBAC con Guards y Decorators
- Swagger/OpenAPI
- PDF con QR
- Auditoría de cambios de estado
- Notificaciones por email
- SSE para métricas en vivo
- Validación con class-validator
- Manejo de errores HTTP estándar

### Frontend

- Next.js
- React
- TypeScript
- TailwindCSS
- Zustand
- Axios
- Recharts
- React Hot Toast
- UI responsive
- Tema dark/light persistido

---

## Roles

### Admin

- Visualiza métricas generales.
- Ve totales de médicos, pacientes y prescripciones.
- Consulta métricas por estado y por día.
- Crea usuarios y asigna roles.
- Consulta auditoría.

### Médico

- Crea prescripciones para pacientes existentes.
- Lista sus propias prescripciones.
- Filtra por estado y búsqueda libre.
- Ve detalle de sus prescripciones.
- Descarga PDF.

### Paciente

- Lista únicamente sus propias prescripciones.
- Ve detalle de sus prescripciones.
- Marca prescripciones como consumidas.
- Descarga PDF.

---


## Variabels de Entorno
- BACKEND:
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/railway?schema=public"

    JWT_ACCESS_SECRET="change_me_access_secret"
    JWT_REFRESH_SECRET="change_me_refresh_secret"

    JWT_ACCESS_TTL="15m"
    JWT_REFRESH_TTL="7d"

    APP_ORIGIN="http://localhost:3000"
    PORT=4000

    SMTP_HOST="smtp.gmail.com"
    SMTP_PORT=587
    SMTP_SECURE=false
    SMTP_USER="your_email@gmail.com"
    SMTP_PASS="your_google_app_password"
    SMTP_FROM="Prescriptions App <your_email@gmail.com>"

- Frontend:
    NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api

---

## Setup local (Commandos/ Scripts)

- Backend:
 - npm install (Instalar dependencias)
 - npx prisma generate (Generar Prisma Client)
 - npx prisma migrate dev (Ejecutar migraciones)
 - npx prisma db seed (Ejecutar seed)
 - npm run start:dev (Levantar el backend en modo desarrollo)
 - La documentación Swagger queda disponible en : http://localhost:4000/api/docs 
 - En Produccion: https://backend-production-02e3.up.railway.app/docs
 - El backend queda disponible en: http://localhost:4000
 - En Produccion: https://backend-production-02e3.up.railway.app/api

- Frontend:
 - npm install (Instalar dependencias)
 - npm run dev (Ejecutar el frontend)
 - El frontend queda disponible en: http://localhost:3000
 - En Produccion: https://pruebatecnicafrontend.vercel.app

---

## Testing (Commandos/Scripts)
 - Backend: 
  - npx jest --clearCache(limpiar el Cache)
  - npm run test (Iniciar el Test)
  - npm run test:cov (Iniciar el Coverage)
- Frontend: 
 - npm run test (Iniciar el Test)
---

## URL DE DESPLIEGUE:
    - Frontend:
        https://pruebatecnicafrontend.vercel.app

    - Backend: 
        https://backend-production-02e3.up.railway.app/api

## Cuentas de prueba

```txt
Admin:
admin@test.com / admin123

Médico:
dr@test.com / dr123

Paciente:
patient@test.com / patient123



