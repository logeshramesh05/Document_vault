# Document Vault

A GraphQL API for organizing and managing documents inside collections. Built with Bun, TypeScript, GraphQL Yoga, Prisma, and PostgreSQL, with schema-first GraphQL, validation, cursor pagination, migrations, and unit/integration testing.


# Link Link

https://document-vault-epdp.onrender.com
 
## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Docker](#docker)
- [GraphQL Endpoint](#graphql-endpoint)
- [Queries](#queries)
- [Mutations](#mutations)
- [Search and Filtering](#search-and-filtering)
- [Pagination](#pagination)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Scripts](#scripts)
- [Design Decisions](#design-decisions)
- [Extending the API](#extending-the-api)
- [End-to-End Workflow](#end-to-end-workflow)
- [Out of Scope](#out-of-scope)

---

## Overview

Document Vault provides a GraphQL API for storing and organizing documents into collections.

The API supports:

- Creating and listing collections
- Retrieving a collection by ID
- Creating, updating, and deleting documents
- Searching documents by title and content
- Filtering by collection and archive status
- Archiving and unarchiving documents
- Moving documents between collections
- Cursor-based pagination
- Structured GraphQL errors
- Prisma migrations
- Unit and integration tests

---

## Features

### Collections

- Unique collection slugs
- Collection listing
- Collection lookup
- One-to-many relationship with documents
- Cascade deletion of documents when a collection is deleted

### Documents

- Create documents inside collections
- Update title, content, tags, and archive state
- Search title and content
- Filter by collection
- Filter by archive state
- Move between collections
- Hard delete

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Bun | Runtime and package manager |
| TypeScript | Application language |
| GraphQL | API layer |
| GraphQL Yoga | GraphQL HTTP server |
| GraphQL Scalars | GraphQL scalar types |
| Prisma | ORM and database access |
| PostgreSQL | Relational database |
| Neon | Managed PostgreSQL |
| Docker | Containerized execution |
| Bun Test | Testing |
| ESLint | Code quality |

---

## Architecture

```text
Client
  |
  | GraphQL HTTP
  v
GraphQL Yoga
  |
  v
schema.graphql
  |
  v
GraphQL Resolvers
  |
  v
Domain Resolver Functions
  |
  v
Prisma Client
  |
  v
PostgreSQL / Neon
```

GraphQL transport logic is separated from application/business logic, allowing resolver functions to be tested independently.

---

## Getting Started

### Prerequisites

- Bun
- PostgreSQL or Neon PostgreSQL
- Docker (optional)

Check Bun:

```bash
bun --version
```

### Local Setup

```bash
cp .env.example .env
bun install
bun run gendb
bun run dev
```

The API starts on:

```text
http://localhost:4000/graphql
```

---

## Environment Variables

Create `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
PORT=4000
```

For Neon, use the connection string provided by Neon.

Never commit real database credentials.

---

## Docker

Start the application:

```bash
docker compose up -d --build
```

View logs:

```bash
docker compose logs -f app
```

Stop:

```bash
docker compose down
```

The container applies existing Prisma migrations before starting the GraphQL server.

```text
Docker
  |
  +-- Prisma migrate deploy
  |
  +-- Prisma Client
  |
  +-- GraphQL Yoga
           |
           v
      Neon PostgreSQL
```

---

## GraphQL Endpoint

```text
http://localhost:4000/graphql
```

GraphQL requests use:

```http
POST /graphql
```

---

# Queries

## `collections`

Returns all collections.

```graphql
query {
  collections {
    id
    name
    slug
    createdAt
  }
}
```

## `collection`

Returns a collection by ID.

```graphql
query {
  collection(id: "COLLECTION_ID") {
    id
    name
    slug
    createdAt
  }
}
```

## `documents`

Lists documents with optional filtering, searching, and pagination.

```graphql
query {
  documents {
    edges {
      id
      title
      content
      tags
      isArchived
      createdAt
      collectionId
    }
    nextCursor
  }
}
```

Supported arguments:

| Argument | Type | Description |
|---|---|---|
| `collectionId` | `ID` | Filter by collection |
| `search` | `String` | Search title and content |
| `isArchived` | `Boolean` | Filter archive state |
| `take` | `Int` | Page size |
| `cursor` | `ID` | Cursor for the next page |

---

# Mutations

## `createCollection`

```graphql
mutation {
  createCollection(
    input: {
      name: "Engineering"
      slug: "engineering"
    }
  ) {
    id
    name
    slug
    createdAt
  }
}
```

## `createDocument`

```graphql
mutation {
  createDocument(
    input: {
      title: "GraphQL API Documentation"
      content: "Document Vault API documentation."
      tags: ["graphql", "api", "documentation"]
      collectionId: "COLLECTION_ID"
    }
  ) {
    id
    title
    content
    tags
    isArchived
    createdAt
    collectionId
  }
}
```

The collection must exist.

## `updateDocument`

Supported fields:

- `title`
- `content`
- `tags`
- `isArchived`

```graphql
mutation {
  updateDocument(
    id: "DOCUMENT_ID"
    input: {
      title: "Updated API Documentation"
      content: "Updated content."
      tags: ["graphql", "updated"]
    }
  ) {
    id
    title
    content
    tags
    isArchived
  }
}
```

Updates are partial.

### Archive

```graphql
mutation {
  updateDocument(
    id: "DOCUMENT_ID"
    input: {
      isArchived: true
    }
  ) {
    id
    title
    isArchived
  }
}
```

### Unarchive

```graphql
mutation {
  updateDocument(
    id: "DOCUMENT_ID"
    input: {
      isArchived: false
    }
  ) {
    id
    title
    isArchived
  }
}
```

## `moveDocument`

```graphql
mutation {
  moveDocument(
    id: "DOCUMENT_ID"
    collectionId: "TARGET_COLLECTION_ID"
  ) {
    id
    title
    collectionId
  }
}
```

Both the document and target collection must exist.

## `deleteDocument`

```graphql
mutation {
  deleteDocument(id: "DOCUMENT_ID")
}
```

Returns:

```json
{
  "data": {
    "deleteDocument": true
  }
}
```

The current implementation performs a hard delete.

---

# Search and Filtering

## Filter by Collection

```graphql
query {
  documents(collectionId: "COLLECTION_ID") {
    edges {
      id
      title
      tags
      collectionId
    }
    nextCursor
  }
}
```

## Active Documents

```graphql
query {
  documents(isArchived: false) {
    edges {
      id
      title
      isArchived
    }
    nextCursor
  }
}
```

## Archived Documents

```graphql
query {
  documents(isArchived: true) {
    edges {
      id
      title
      isArchived
    }
    nextCursor
  }
}
```

## Search

Search currently uses case-insensitive substring matching against `title` and `content`.

```graphql
query {
  documents(search: "GraphQL") {
    edges {
      id
      title
      content
      tags
    }
    nextCursor
  }
}
```

---

# Pagination

Document listing uses cursor-based pagination.

First page:

```graphql
query {
  documents(take: 2) {
    edges {
      id
      title
      createdAt
    }
    nextCursor
  }
}
```

Next page:

```graphql
query {
  documents(
    take: 2
    cursor: "NEXT_CURSOR"
  ) {
    edges {
      id
      title
      createdAt
    }
    nextCursor
  }
}
```

The implementation fetches `take + 1` rows. The extra row determines whether another page exists without a separate count query.

Documents are ordered by:

```text
createdAt DESC
id DESC
```

Default page size: `20`

Maximum page size: `100`

---

# Error Handling

Errors use GraphQL's `extensions.code`.

## `BAD_USER_INPUT`

Used for invalid request input.

Example:

```json
{
  "errors": [
    {
      "message": "name must not be empty",
      "extensions": {
        "code": "BAD_USER_INPUT"
      }
    }
  ]
}
```

Common causes:

- Empty collection name
- Empty slug
- Invalid slug
- Empty document title
- Empty document content
- Invalid pagination size

## `NOT_FOUND`

Used when a required resource does not exist.

Example:

```json
{
  "errors": [
    {
      "message": "collection '...' not found",
      "extensions": {
        "code": "NOT_FOUND"
      }
    }
  ]
}
```

Common cases:

- Collection does not exist
- Document does not exist
- Target collection does not exist during a move

---

# Validation Rules

## Collection Name

Must not be empty or whitespace-only.

## Collection Slug

Must be lowercase and use alphanumeric characters separated by single hyphens.

Valid:

```text
engineering
engineering-docs
project-2026
```

Invalid:

```text
Engineering
engineering_docs
engineering docs
engineering--docs
-engineering
engineering-
```

## Document Title

Must not be empty.

## Document Content

Must not be empty.

## Pagination

`take` must be between `1` and `100`.

---

# Database Schema

## Collection

```prisma
model Collection {
  id        String     @id @default(uuid())
  name      String
  slug      String     @unique
  createdAt DateTime   @default(now())
  documents Document[]
}
```

## Document

```prisma
model Document {
  id           String     @id @default(uuid())
  title        String
  content      String
  tags         String[]
  isArchived   Boolean    @default(false)
  createdAt    DateTime   @default(now())
  collectionId String
  collection   Collection @relation(
    fields: [collectionId],
    references: [id],
    onDelete: Cascade
  )

  @@index([collectionId])
  @@index([createdAt])
}
```

Relationship:

```text
Collection
    |
    | 1:N
    v
Document
```

A collection can contain multiple documents. A document belongs to exactly one collection. Deleting a collection cascades to its documents.

---

# Testing

## All Tests

```bash
bun test
```

## Unit Tests

```bash
bun run test:unit
```

Unit tests use mocked Prisma behavior to test resolver/business logic independently of the database.

## Integration Tests

```bash
bun run test:integration
```

Integration tests verify database-backed behavior.

## Complete Sanity Check

```bash
bun run sanity
```

Runs:

```text
lint
  |
  v
typecheck
  |
  v
tests
```

---

# Scripts

| Command | Purpose |
|---|---|
| `bun run dev` | Start development server |
| `bun run gendb` | Run Prisma development migrations and generate client |
| `bun run migrate:deploy` | Apply existing Prisma migrations |
| `bun run generate` | Generate Prisma Client |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run lint` | Run ESLint |
| `bun run test` | Run all tests |
| `bun run test:unit` | Run unit tests |
| `bun run test:integration` | Run integration tests |
| `bun run sanity` | Run lint, typecheck, and tests |

---

# Design Decisions

## Schema-First GraphQL

`schema.graphql` is the source of truth for the public API contract.

## Resolver Separation

GraphQL transport logic is separated from business logic:

```text
GraphQL Resolver
      |
      v
Domain Resolver Function
      |
      v
Validation
      |
      v
Prisma
```

This makes business logic easier to test.

## Cursor Pagination

Cursor pagination is used instead of offset pagination. Fetching `take + 1` records avoids a separate count query.

## Database Indexing

Indexes exist on:

```text
collectionId
createdAt
```

to support common document listing and ordering operations.

## Migrations

All schema changes are managed through Prisma migrations under:

```text
prisma/migrations/
```

Migrations are version-controlled rather than maintained as hand-written schema SQL.

---

# Extending the API

## Authentication

Add the authenticated user to GraphQL context:

```text
Context
├── db
└── user
```

Then associate collections and documents with users and enforce ownership in resolvers.

## Full-Text Search

The current implementation uses substring matching. For larger datasets, PostgreSQL full-text search can use:

```text
tsvector
tsquery
GIN index
```

## Soft Delete

`deleteDocument` currently hard-deletes records.

For audit/history requirements, add:

```prisma
deletedAt DateTime?
```

and mark records as deleted instead of physically removing them.

## Federation

Collections and documents can later be exposed through a federated subgraph if another service needs to reference them.

---

# End-to-End Workflow

```text
CREATE COLLECTION
       |
       v
CREATE DOCUMENT
       |
       +--------> SEARCH
       |
       +--------> UPDATE
       |
       +--------> ARCHIVE
       |
       +--------> MOVE
       |
       v
DELETE DOCUMENT
```

### Example

1. Create a collection.
2. Save the returned collection ID.
3. Create a document using that collection ID.
4. Search or filter documents.
5. Update or archive the document.
6. Move it to another collection if required.
7. Delete it when no longer needed.

---

# Out of Scope

The following are intentionally excluded:

- Authentication
- Authorization/RBAC
- Multi-user ownership
- GraphQL Federation
- Caching
- File uploads
- Object storage
- Advanced full-text search
- Audit logging
- Soft deletion
- Production deployment infrastructure

These features can be introduced incrementally as the application evolves.

---

# API Summary

| Operation | Type | Purpose |
|---|---|---|
| `collections` | Query | List collections |
| `collection` | Query | Retrieve a collection |
| `documents` | Query | List, search, and filter documents |
| `createCollection` | Mutation | Create a collection |
| `createDocument` | Mutation | Create a document |
| `updateDocument` | Mutation | Update or archive a document |
| `moveDocument` | Mutation | Move a document |
| `deleteDocument` | Mutation | Permanently delete a document |

---

## Summary

Document Vault demonstrates:

- Schema-first GraphQL API design
- Type-safe TypeScript
- Prisma/PostgreSQL data modeling
- Collection/document relationships
- CRUD operations
- Search and filtering
- Cursor-based pagination
- Input validation
- Structured GraphQL errors
- Database migrations
- Unit and integration testing
- Dockerized execution
- Neon PostgreSQL integration

The implementation keeps the scope focused while providing a clean foundation for authentication, authorization, full-text search, auditing, and other production capabilities.
