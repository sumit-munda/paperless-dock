# Paperless Dock

A full-stack digital bookstore and personal reading platform for discovering, purchasing, owning and reading digital books.

## Overview

Paperless Dock brings digital book discovery, e-commerce and personal reading together in one application. Users can explore a book catalog, purchase digital books, access their personal library and read purchased books through an integrated PDF reader.

- `apps/web` — Web application
- `apps/api` — Backend API
- `packages/shared` — Shared code
- `docker` — Docker configuration
- `docs` — Project documentation

## Screenshots

### Homepage
![Paperless Dock Homepage](docs/screenshots/homepage.png)

### Books Catalog
![Books Catalog](docs/screenshots/books-01.png)
![Books Catalog](docs/screenshots/books-02.png)

### Book Details
![Book Details](docs/screenshots/book-details.png)

### Shopping Cart
![Shopping Cart](docs/screenshots/shopping-cart-01.png)
![Shopping Cart](docs/screenshots/shopping-cart-02.png)

### My Library
![My Library](docs/screenshots/my-library-01.png)
![My Library](docs/screenshots/my-library-02.png)

### PDF Reader
![PDF Reader](docs/screenshots/pdf-reader-01.png)
![PDF Reader](docs/screenshots/pdf-reader-02.png)

## Features

### Book Discovery

- Browse books retrieved from the backend.
- Search books by relevant fields.
- Filter books by category and author.
- Sort books and explore detailed book information.

### Authentication & Authorization

- User registration and login.
- Persistent session-based authentication.
- Password hashing using bcrypt.
- PostgreSQL-backed session storage.
- Protected routes and role-based authorization.

### Shopping & Payments

- Add, update and remove cart items.
- Persistent shopping cart.
- Checkout and order creation.
- Razorpay payment integration.
- Server-side payment signature verification.
- Webhook-based payment confirmation with duplicate-event protection.

### Personal Library & Reading

- Access purchased books through a personal library.
- Verify authentication and book ownership before granting file access.
- Read digital books using an integrated PDF reader.
- Serve private PDF files stored in Cloudflare R2 without exposing permanent public file URLs.

## Technology Stack

| Category       | Technologies              |
| :------------- | :------------------------ |
| Language       | TypeScript                |
| Frontend       | React, Vite, React Router |
| Backend        | Node.js, Express.js       |
| Database & ORM | PostgreSQL, Prisma        |
| Authentication | Express Session, bcrypt   |
| Payments       | Razorpay                  |
| Object Storage | Cloudflare R2             |
| PDF Rendering  | React PDF, PDF.js         |
| Validation     | Zod                       |
| Testing        | Vitest, React Testing Library, Supertest |

## Project Structure

```
paperless-dock/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Express backend API
├── packages/
│   └── shared/       # Shared application code
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL

### Installation

Clone the repository and install dependencies:

```
git clone https://github.com/sumit-munda/paperless-dock.git
cd paperless-dock
npm install
```

### Environment Configuration

Create local environment files using the provided examples:

- Copy apps/web/.env.example to apps/web/.env.
- Copy apps/api/.env.example to apps/api/.env.

Configure the required environment variables, including the PostgreSQL connection, session secret, Razorpay credentials and Cloudflare R2 credentials.

Never commit actual .env files or credentials.

### Database Setup

Create the PostgreSQL database and configure DATABASE_URL in apps/api/.env.

Apply the existing Prisma migrations:

```
cd apps/api
npx prisma migrate deploy
```

### Run the Application

Open two terminals from the repository root.

Terminal 1 — Backend:

```
npm run dev:api
```

Terminal 2 — Frontend:

```
npm run dev:web
```

## Testing

Run workspace tests from the repository root:

```
npm test
```

Run backend integration tests separately:

```
cd apps/api
npm run test:integration
```

Integration tests use ```apps/api/.env.test``` and require a separate PostgreSQL database named ```paperless_dock_test```.

## Build

Build the application workspaces from the repository root:

```
npm run build
```

Paperless Dock — Discover, Own, and Read. Completely Paperless.
