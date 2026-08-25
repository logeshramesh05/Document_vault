import { describe, expect, test, mock } from "bun:test";
import type { PrismaClient } from "@prisma/client";
import {
  createDocument,
  listDocuments,
  updateDocument,
  moveDocument,
} from "../../src/resolvers/document.js";

interface FakeCollectionTable {
  findUnique: ReturnType<typeof mock>;
}
interface FakeDocumentTable {
  findMany: ReturnType<typeof mock>;
  findUnique: ReturnType<typeof mock>;
  create: ReturnType<typeof mock>;
  update: ReturnType<typeof mock>;
}
interface FakeDb {
  collection: FakeCollectionTable;
  document: FakeDocumentTable;
}

function makeFakeDb(): FakeDb {
  return {
    collection: { findUnique: mock() },
    document: {
      findMany: mock(),
      findUnique: mock(),
      create: mock(),
      update: mock(),
    },
  };
}

describe("createDocument", () => {
  test("rejects empty title", async () => {
    const db = makeFakeDb();
    await expect(
      createDocument(db as unknown as PrismaClient, {
        title: "  ",
        content: "x",
        collectionId: "c1",
      })
    ).rejects.toThrow();
  });

  test("rejects missing collection", async () => {
    const db = makeFakeDb();
    db.collection.findUnique.mockResolvedValue(null);
    await expect(
      createDocument(db as unknown as PrismaClient, {
        title: "t",
        content: "c",
        collectionId: "missing",
      })
    ).rejects.toThrow();
  });

  test("creates document with trimmed title", async () => {
    const db = makeFakeDb();
    db.collection.findUnique.mockResolvedValue({ id: "c1" });
    db.document.create.mockResolvedValue({ id: "d1", title: "t" });
    const result = await createDocument(db as unknown as PrismaClient, {
      title: "  t  ",
      content: "c",
      collectionId: "c1",
    });
    expect(db.document.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: "d1", title: "t" });
  });
});

describe("listDocuments", () => {
  test("requests take+1 and trims nextCursor when overflow", async () => {
    const db = makeFakeDb();
    const rows = Array.from({ length: 3 }, (_, i) => ({ id: `d${i}` }));
    db.document.findMany.mockResolvedValue(rows);
    const page = await listDocuments(db as unknown as PrismaClient, {
      take: 2,
    });
    expect(page.edges.length).toBe(2);
    expect(page.nextCursor).toBe("d1");
  });

  test("no next cursor when results fit", async () => {
    const db = makeFakeDb();
    db.document.findMany.mockResolvedValue([{ id: "d0" }]);
    const page = await listDocuments(db as unknown as PrismaClient, {
      take: 5,
    });
    expect(page.nextCursor).toBeNull();
  });
});

describe("updateDocument", () => {
  test("throws when document missing", async () => {
    const db = makeFakeDb();
    db.document.findUnique.mockResolvedValue(null);
    await expect(
      updateDocument(db as unknown as PrismaClient, "missing", {
        title: "x",
      })
    ).rejects.toThrow();
  });
});

describe("moveDocument", () => {
  test("throws when target collection missing", async () => {
    const db = makeFakeDb();
    db.document.findUnique.mockResolvedValue({ id: "d1" });
    db.collection.findUnique.mockResolvedValue(null);
    await expect(
      moveDocument(db as unknown as PrismaClient, "d1", "missing")
    ).rejects.toThrow();
  });

  test("moves document to valid collection", async () => {
    const db = makeFakeDb();
    db.document.findUnique.mockResolvedValue({ id: "d1" });
    db.collection.findUnique.mockResolvedValue({ id: "c2" });
    db.document.update.mockResolvedValue({ id: "d1", collectionId: "c2" });
    const result = await moveDocument(db as unknown as PrismaClient, "d1", "c2");
    expect(result.collectionId).toBe("c2");
  });
});
