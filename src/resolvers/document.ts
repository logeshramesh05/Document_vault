import type { PrismaClient, Document, Prisma } from "@prisma/client";
import { assertNonEmpty, assertTake } from "../validation.js";
import { notFoundError } from "../errors.js";
import { requireCollection } from "./collection.js";

export interface CreateDocumentInput {
  title: string;
  content: string;
  tags?: string[] | null;
  collectionId: string;
}

export interface UpdateDocumentInput {
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
  isArchived?: boolean | null;
}

export interface DocumentQueryArgs {
  collectionId?: string | null;
  search?: string | null;
  isArchived?: boolean | null;
  take?: number | null;
  cursor?: string | null;
}

export interface DocumentPage {
  edges: Document[];
  nextCursor: string | null;
}

export async function listDocuments(
  db: PrismaClient,
  args: DocumentQueryArgs
): Promise<DocumentPage> {
  const take = assertTake(args.take);
  const where: Prisma.DocumentWhereInput = {};
  if (args.collectionId) where.collectionId = args.collectionId;
  if (typeof args.isArchived === "boolean") where.isArchived = args.isArchived;
  if (args.search && args.search.trim().length > 0) {
    where.OR = [
      { title: { contains: args.search, mode: "insensitive" } },
      { content: { contains: args.search, mode: "insensitive" } },
    ];
  }

  const edges = await db.document.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(args.cursor
      ? { cursor: { id: args.cursor }, skip: 1 }
      : {}),
  });

  const hasNext = edges.length > take;
  const page = hasNext ? edges.slice(0, take) : edges;
  const nextCursor = hasNext ? page[page.length - 1]?.id ?? null : null;
  return { edges: page, nextCursor };
}

export async function requireDocument(
  db: PrismaClient,
  id: string
): Promise<Document> {
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) throw notFoundError(`document '${id}' not found`);
  return doc;
}

export async function createDocument(
  db: PrismaClient,
  input: CreateDocumentInput
): Promise<Document> {
  assertNonEmpty(input.title, "title");
  assertNonEmpty(input.content, "content");
  await requireCollection(db, input.collectionId);
  return db.document.create({
    data: {
      title: input.title.trim(),
      content: input.content,
      tags: input.tags ?? [],
      collectionId: input.collectionId,
    },
  });
}

export async function updateDocument(
  db: PrismaClient,
  id: string,
  input: UpdateDocumentInput
): Promise<Document> {
  await requireDocument(db, id);
  if (input.title !== undefined && input.title !== null) {
    assertNonEmpty(input.title, "title");
  }
  if (input.content !== undefined && input.content !== null) {
    assertNonEmpty(input.content, "content");
  }
  const data: Prisma.DocumentUpdateInput = {};
  if (input.title != null) data.title = input.title.trim();
  if (input.content != null) data.content = input.content;
  if (input.tags != null) data.tags = { set: input.tags };
  if (input.isArchived != null) data.isArchived = input.isArchived;
  return db.document.update({ where: { id }, data });
}

export async function deleteDocument(
  db: PrismaClient,
  id: string
): Promise<boolean> {
  await requireDocument(db, id);
  await db.document.delete({ where: { id } });
  return true;
}

export async function moveDocument(
  db: PrismaClient,
  id: string,
  collectionId: string
): Promise<Document> {
  await requireDocument(db, id);
  await requireCollection(db, collectionId);
  return db.document.update({ where: { id }, data: { collectionId } });
}
