# Backend Architecture

## Framework

The backend uses NestJS with TypeScript.

NestJS is used because it provides:

- module-based structure
- dependency injection
- clear controller/service separation
- strong testing support
- scalable backend organization

## Architecture Style

The backend follows a modular monolith style.

Each domain should be implemented as a module:

- auth
- users
- cvs
- files
- analysis
- matching
- cover-letter
- history

## Module Structure

Each module should follow this structure when applicable:

src/modules/<module-name>/
├── <module-name>.module.ts
├── <module-name>.controller.ts
├── <module-name>.service.ts
├── dto/
├── tests/
└── types/

## Rules

- Controllers handle HTTP requests only.
- Services contain business logic.
- DTOs validate input.
- Database access should go through Prisma.
- Heavy tasks should use BullMQ queues.
- Do not call AI providers directly from controllers.
- Do not put business logic in Prisma models.
- Write tests before implementing backend features.

## API Style

The API should return consistent responses.

Success:

{
"data": {},
"meta": {}
}

Error:

{
"error": {
"code": "ERROR_CODE",
"message": "Human readable message"
},
"meta": {}
}

## Testing

Backend development follows TDD:

1. Red — write failing test
2. Green — implement minimum code
3. Refactor — improve safely

Use:

- Jest for unit/integration tests
- Supertest for HTTP endpoint tests
