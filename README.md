# YipShare (backend)

API REST de YipShare: condominios, vecinos, artículos, préstamos, reportes y reseñas.

## Tecnologías
Bun, Express 5, PostgreSQL con Drizzle ORM, zod para validar, JWT (jose) y argon2 para contraseñas.

## Requisitos previos
- [Bun](https://bun.sh) instalado (necesario incluso si ejecutas los scripts con `npm`).
- Una instancia de **PostgreSQL** corriendo localmente (o en la nube) y una base de datos creada para el proyecto (Aunque no necesariamente inicializada).

## Cómo correrlo (USANDO BUN)
```bash
bun install
cp .env.example .env   # en Windows: copy .env.example .env
bun run db:push        # crea las tablas (PUEDE BORRAR DATOS SI ELIMINAS O RENOMBRAS TABLAS / COLUMNAS) (NO ES NECESARIO SI YA SE INICIALIZÓ PREVIAMENTE A MENOS DE HABER CAMBIOS)
bun run db:seed        # permisos, categorías y administrador (NO ES NECESARIO SI YA SE HIZO EL db:seed PREVIAMENTE A MENOS DE HABER CAMBIOS)

# PARA CORRER EL BACKEND EN MODO DESARROLLADOR (Usa --watch para detectar cambios y volver a ejecutar o actualizar)
bun run dev            # http://localhost:3000

# PARA CORRER EL BACKEND
bun run start            # http://localhost:3000
```

## Estructura de src/
- routes/: define las URL y los permisos de cada una
- controllers/: lee la petición y valida con zod (schema/)
- services/: lógica de negocio y consultas a la base de datos
- middlewares/: autenticación, autorización y manejo de errores
- db/: conexión, tablas (schema.ts) y seed
- utils/: errores, archivos, códigos de verificación

## Pruebas manuales
Los archivos de `tests/http` se pueden ejecutar con la extensión **REST Client** de VS Code, el cliente HTTP integrado de **WebStorm** (u otros IDEs de JetBrains), o herramientas similares compatibles con archivos `.http`.