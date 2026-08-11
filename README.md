# Kinetix Home Care

Kinetix Home Care is a digital platform for physiotherapy home care management. This repository is a Turborepo monorepo containing both the Next.js frontend and the FastAPI backend.

## Architecture

- **Frontend (`apps/web`)**: Next.js 15+ App Router, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend (`apps/api`)**: FastAPI, Python 3.12, PostgreSQL, SQLAlchemy.
- **Shared Packages (`packages/*`)**: Shared TypeScript configurations, utilities, and UI components.

## Prerequisites

- Node.js >= 18
- pnpm >= 9
- Python >= 3.12
- uv (Python package manager)
- Docker & Docker Compose

## Quick Start

### 1. Environment Setup

Copy the environment example files:
\`\`\`bash
cp .env.example .env
\`\`\`

### 2. Install Dependencies

Install Node.js dependencies via pnpm:
\`\`\`bash
pnpm install
\`\`\`

Install Python dependencies via uv (in the \`apps/api\` directory):
\`\`\`bash
cd apps/api
uv sync
cd ../..
\`\`\`

### 3. Run Development Server

Use Turborepo to start both the frontend and backend simultaneously:
\`\`\`bash
pnpm run dev
\`\`\`
- Frontend runs at: \`http://localhost:3000\`
- Backend API runs at: \`http://localhost:8000\`

### 4. Running with Docker Compose

You can start the entire stack (including PostgreSQL and Redis) using Docker Compose:
\`\`\`bash
docker-compose up --build
\`\`\`

## Commands

From the root directory, you can run the following Turbo commands:

- \`pnpm run build\`: Build all apps and packages
- \`pnpm run dev\`: Start development servers
- \`pnpm run lint\`: Run ESLint and Ruff
- \`pnpm run format\`: Run Prettier and Ruff format
- \`pnpm run typecheck\`: Run tsc and MyPy
- \`pnpm run test\`: Run unit tests

## Contributing

This project enforces strict linting, type-checking, and formatting via Git hooks (Husky). Commits must follow the Conventional Commits specification.
