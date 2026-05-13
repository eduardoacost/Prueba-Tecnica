# Documentación Técnica - Prescriptions App

## 1. Descripción general

Prescriptions App es una aplicación Full Stack para la gestión de prescripciones médicas.  
El sistema permite que usuarios con diferentes roles puedan crear, consultar, actualizar y descargar prescripciones médicas según sus permisos.

La aplicación está dividida en dos partes:

- **Backend:** API REST desarrollada con NestJS, Prisma ORM y PostgreSQL.
- **Frontend:** aplicación web desarrollada con Next.js, React, TypeScript y TailwindCSS.

La base de datos PostgreSQL está alojada en Railway.

---

## 2. Arquitectura del proyecto

El proyecto se maneja como un mono-repo con separación entre backend y frontend.

txt
Prescripciones-app/
│
├── backend/
│   ├── src/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── email/
│   │   ├── prescriptions/
│   │   ├── users/
│   │   └── main.ts
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── store/
│   │   └── types/
│   │
│   └── package.json
│
└── README.md

---

## 3. Decisiones técnicas
    - 3.1 Backend con NestJS:
        Se eligió NestJS porque permite construir una API REST modular, escalable y organizada mediante módulos, controladores, servicios, guards y decorators.
        La estructura del backend está separada por dominio:
        - auth: autenticación y manejo de tokens.
        - users: administración de usuarios.
        - prescriptions: gestión de prescripciones.
        - admin: métricas, auditoría y funciones administrativas.
        - email: envío de notificaciones por correo.
        - prisma: conexión con la base de datos.

    - 3.2 Base de datos con PostgreSQL en Railway
        Se utilizó PostgreSQL como base de datos relacional por su robustez y soporte para relaciones entre entidades.
        La base de datos está desplegada en Railway, por lo que no se utilizó Docker para levantar la base de datos localmente.
        La conexión se realiza mediante la variable de entorno:
        DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/railway?schema=public"

    - 3.3 Prisma ORM
        Se utilizó Prisma ORM para manejar el acceso a la base de datos.
        Prisma permite:
        Definir los modelos de datos en schema.prisma.
        Ejecutar migraciones.
        Generar un cliente tipado.
        Crear datos iniciales mediante seed.
        Mantener una comunicación segura y estructurada con PostgreSQL
        Comandos principales:
        npx prisma generate
        npx prisma migrate dev
        npx prisma migrate deploy
        npx prisma db seed
        npx prisma studio

    - 3.4 Autenticación con JWT
        La autenticación se implementó usando JWT.
        El sistema trabaja con dos tokens:
        Access token: token de corta duración usado para consumir endpoints protegidos.
        Refresh token: token de mayor duración usado para renovar la sesión.
        Flujo de autenticación:
        El usuario inicia sesión con email y contraseña.
        El backend valida las credenciales.
        Si las credenciales son válidas, se generan tokens.
        El frontend guarda la sesión.
        Las peticiones protegidas envían el token en el header:
        Authorization: Bearer <ACCESS_TOKEN>

    - 3.5 RBAC - Control de acceso por roles
        Se implementó RBAC usando Guards y Decorators de NestJS.
        Roles disponibles:
        admin
        doctor
        patient
        Cada rol tiene permisos diferentes:
        Admin
        Puede ver métricas generales.
        Puede crear usuarios.
        Puede consultar auditoría.
        Puede acceder a información administrativa.
        Doctor
        Puede crear prescripciones.
        Puede listar sus propias prescripciones.
        Puede ver el detalle de sus prescripciones.
        Puede descargar PDFs.
        Patient
        Puede listar únicamente sus propias prescripciones.
        Puede ver el detalle de sus prescripciones.
        Puede marcar prescripciones como consumidas.
        Puede descargar PDFs.

    - 3.6 Validaciones
        El backend utiliza DTOs junto con class-validator para validar la información recibida en las peticiones.
        Se validan aspectos como:
        Campos obligatorios.
        Formato de email.
        Longitud mínima de contraseñas.
        Estados permitidos.
        Roles válidos.
        Estructura de los medicamentos de una prescripción.
        Esto evita que datos inválidos lleguen a la capa de servicios o a la base de datos.

    - 3.7 Generación de PDF con QR
        El sistema permite generar un PDF para cada prescripción médica.
        El PDF incluye la información principal de la prescripción, como:
        Código de prescripción.
        Paciente.
        Médico.
        Fecha.
        Estado.
        Medicamentos.
        Dosis.
        Cantidad.
        Instrucciones.
        También se incluye un código QR para facilitar la identificación o validación de la prescripción.
        Esta funcionalidad está disponible para usuarios autorizados según su rol.

    - 3.8 Auditoría
        Se implementó auditoría para registrar acciones importantes dentro del sistema.
        Principalmente se registran eventos relacionados con las prescripciones, como:
        Creación de prescripción.
        Cambio de estado.
        Prescripción marcada como consumida.
        La auditoría permite consultar:
        Acción realizada.
        Usuario que realizó la acción.
        Prescripción relacionada.
        Fecha del evento.
        Metadata adicional.

    - 3.9 Paginación, filtros y búsqueda
        La consulta de prescripciones permite aplicar filtros para facilitar la navegación de datos.
        Se contemplan filtros como:
        Estado de la prescripción.
        Búsqueda libre.
        Usuario autenticado.
        Rol del usuario.
        Esto permite que cada usuario consulte únicamente la información que le corresponde.
        Ejemplo de consulta:
        GET /api/prescriptions?status=pending&search=amoxicilina&page=1&limit=10

    - 3.10 Notificaciones por email
        El backend incluye un módulo de email para enviar notificaciones mediante SMTP.
        Las variables necesarias son:
        SMTP_HOST="smtp.gmail.com"
        SMTP_PORT=587
        SMTP_SECURE=false
        SMTP_USER="your_email@gmail.com"
        SMTP_PASS="your_google_app_password"
        SMTP_FROM="Prescriptions App <your_email@gmail.com>"
        Para Gmail se debe usar una contraseña de aplicación.

    - 3.11 Métricas en vivo con SSE
        Se implementaron métricas en vivo usando Server-Sent Events.
        Esto permite que el frontend reciba actualizaciones en tiempo real desde el backend sin necesidad de recargar la página.
        Esta funcionalidad se usa principalmente en el dashboard administrativo.

    - 3.12 Frontend con Next.js
        El frontend fue desarrollado con Next.js, React y TypeScript.
        Se utilizó Next.js porque facilita:
        Separación de rutas por carpetas.
        Renderizado eficiente.
        Organización de vistas por rol.
        Integración sencilla con APIs externas.
        Despliegue en plataformas como Vercel.

    - 3.13 Estado global con Zustand
        Se utilizó Zustand para manejar estado global en el frontend.
        Principalmente se usa para:
        Sesión del usuario.
        Información del usuario autenticado.
        Manejo de tokens.
        Tema dark/light persistido.

    - 3.14 UI responsive y tema dark/light
        La interfaz fue construida con TailwindCSS.
        Se implementó diseño responsive para permitir el uso de la aplicación en diferentes tamaños de pantalla.
        También se implementó tema dark/light persistido para mejorar la experiencia del usuario.
---
## 4. Documentación de API con Swagger

       - En entorno local la documentación se encuentra en:
        http://localhost:4000/api/docs

        - En producción:
        <URL_BACKEND_DESPLEGADO>/api/docs

       - Swagger permite:
        Ver todos los endpoints disponibles.
        Consultar los DTOs usados por la API.
        Probar peticiones directamente desde el navegador.
        Autorizar peticiones protegidas con JWT.
        Revisar respuestas esperadas.

        - Para probar endpoints protegidos:
            Iniciar sesión.
            Copiar el access token.
            Presionar el botón Authorize en Swagger.
            Ingresar el token con el formato:
            Bearer <ACCESS_TOKEN>

---

## 5. Endpoints principales

    - Auth:
        Endpoints relacionados con autenticación y sesión.
        POST /api/auth/register
        POST /api/auth/login
        POST /api/auth/refresh
        GET  /api/auth/me
        Descripción
        POST /api/auth/register: registra un nuevo usuario.
        POST /api/auth/login: inicia sesión y retorna tokens.
        POST /api/auth/refresh: renueva el access token usando refresh token.
        GET /api/auth/me: retorna la información del usuario autenticado.

    - Users:
        Endpoints relacionados con la administración de usuarios.
        GET    /api/users
        GET    /api/users/:id
        POST   /api/users
        PATCH  /api/users/:id
        DELETE /api/users/:id
        Descripción
        GET /api/users: lista usuarios registrados.
        GET /api/users/:id: obtiene un usuario por ID.
        POST /api/users: crea un usuario.
        PATCH /api/users/:id: actualiza información de un usuario.
        DELETE /api/users/:id: elimina un usuario.
        Estos endpoints están principalmente orientados al rol administrador.

    - Prescriptions:
        Endpoints relacionados con prescripciones médicas.
        GET    /api/prescriptions
        GET    /api/prescriptions/:id
        POST   /api/prescriptions
        PATCH  /api/prescriptions/:id
        PATCH  /api/prescriptions/:id/consume
        GET    /api/prescriptions/:id/pdf
        Descripción
        GET /api/prescriptions: lista prescripciones según el rol del usuario.
        GET /api/prescriptions/:id: obtiene el detalle de una prescripción.
        POST /api/prescriptions: crea una nueva prescripción.
        PATCH /api/prescriptions/:id: actualiza una prescripción.
        PATCH /api/prescriptions/:id/consume: marca una prescripción como consumida.
        GET /api/prescriptions/:id/pdf: descarga el PDF de una prescripción.

    - Admin:
        Endpoints administrativos.
        GET /api/admin/metrics
        GET /api/admin/audit
        Descripción
        GET /api/admin/metrics: obtiene métricas generales del sistema.
        GET /api/admin/audit: consulta registros de auditoría.

    - Métricas en vivo:
        Endpoint usado para recibir métricas en tiempo real mediante SSE.
        GET /api/admin/live
        Descripción
        GET /api/admin/live: mantiene una conexión abierta para enviar métricas actualizadas al frontend.
---

## 6. Manejo de errores
    La API utiliza códigos HTTP estándar.
        Ejemplos:
            - 400 Bad Request
            - 401 Unauthorized
            - 403 Forbidden
            - 404 Not Found
            - 409 Conflict
            - 500 Internal Server Error
    Esto permite que el frontend pueda interpretar errores y mostrar mensajes claros al usuario.

---

## 7. Manejo de errores
    Las cuentas de prueba son creadas mediante el seed.
        - Admin:
            admin@test.com / admin123
        - Médico:
            dr@test.com / dr123
        - Paciente:
            patient@test.com / patient123