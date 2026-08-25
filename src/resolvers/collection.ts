import type { PrismaClient, Collection } from "@prisma/client";
import { assertNonEmpty, assertSlug } from "../validation.js";
import { notFoundError, userInputError } from "../errors.js";

export interface CreateCollectionInput {
  name: string;
  slug: string;
}

export async function listCollections(
  db: PrismaClient
): Promise<Collection[]> {
  return db.collection.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getCollection(
  db: PrismaClient,
  id: string
): Promise<Collection | null> {
  return db.collection.findUnique({ where: { id } });
}

export async function createCollection(
  db: PrismaClient,
  input: CreateCollectionInput
): Promise<Collection> {
  assertNonEmpty(input.name, "name");
  assertNonEmpty(input.slug, "slug");
  assertSlug(input.slug);
  const existing = await db.collection.findUnique({
    where: { slug: input.slug },
  });
  if (existing) {
    throw userInputError(`slug '${input.slug}' is already in use`);
  }
  return db.collection.create({
    data: { name: input.name.trim(), slug: input.slug },
  });
}

export async function requireCollection(
  db: PrismaClient,
  id: string
): Promise<Collection> {
  const collection = await db.collection.findUnique({ where: { id } });
  if (!collection) {
    throw notFoundError(`collection '${id}' not found`);
  }
  return collection;
}
