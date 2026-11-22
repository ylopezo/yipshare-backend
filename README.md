# YipShare (backend)

API REST de YipShare: condominios, vecinos, artículos, préstamos, reportes y reseñas.

## Tecnologías
Bun, Express 5, PostgreSQL con Drizzle ORM, zod para validar, JWT (jose) y argon2 para contraseñas.

## Cómo correrlo
    bun install
    cp .env.example .env   # en Windows: copy .env.example .env
    bun run db:push        # crea las tablas
    bun run db:seed        # permisos, categorías y administrador
    bun run dev            # http://localhost:3000

## Estructura de src/
- routes/: define las URL y los permisos de cada una
- controllers/: lee la petición y valida con zod (schema/)
- services/: lógica de negocio y consultas a la base de datos
- middlewares/: autenticación, autorización y manejo de errores
- db/: conexión, tablas (schema.ts) y seed
- utils/: errores, archivos, códigos de verificación

## Pruebas manuales
Los archivos de tests/http se ejecutan con la extensión REST Client de VS Code.