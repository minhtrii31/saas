# Architecture Overview

## Architecture Style

The system uses a modular monolith architecture.

The backend is a single deployable application but internally separated into clear modules.

This allows:

- simpler development
- easier testing
- lower infrastructure complexity
- future migration into microservices if necessary

---

## High-Level Architecture

Frontend:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend:

- NestJS
- TypeScript
- Modular architecture

Infrastructure:

- PostgreSQL database
- Redis
- BullMQ queues
- Cloudinary or S3-compatible file storage

Testing:

- Backend TDD with Jest and Supertest
- Frontend smoke/E2E testing with Playwright

AI:

- Provider abstraction layer
- Support future switching between OpenAI, Gemini, or OpenRouter

---

## Backend Modules

The backend is organized by domain modules.

Examples:

- auth
- users
- cvs
- files
- analysis
- matching
- cover-letter
- history

Each module should contain:

- controller
- service
- DTOs
- entities/models
- tests

---

## System Principles

- Prefer simple and testable code.
- Keep business logic outside controllers.
- Use queues for heavy AI/file-processing tasks.
- Validate all external input.
- Keep modules loosely coupled.
- Avoid premature optimization.

---

## Long-Term Direction

The system may later evolve into:

- AI memory/profile learning
- CV builder
- Recruiter dashboard
- Advanced analytics
- Multi-provider AI orchestration

The MVP should remain focused and lightweight.
