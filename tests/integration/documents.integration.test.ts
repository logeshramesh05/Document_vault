import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { PrismaClient } from "@prisma/client";
import {
  createDocument,
  listDocuments,
  moveDocument,
} from "../../src/resolvers/document.js";
import { createCollection } from "../../src/resolvers/collection.js";

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await prisma.document.deleteMany();
  await prisma.collection.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("document vault integration", () => {
  test("create collection, create + move + search documents", async () => {
    const inbox = await createCollection(prisma, {
      name: "Inbox",
      slug: "inbox",
    });
    const archive = await createCollection(prisma, {
      name: "Archive",
      slug: "archive",
    });

    const doc = await createDocument(prisma, {
      title: "Quarterly Report",
      content: "Revenue figures for Q3",
      tags: ["finance"],
      collectionId: inbox.id,
    });

    const moved = await moveDocument(prisma, doc.id, archive.id);
    expect(moved.collectionId).toBe(archive.id);

    const found = await listDocuments(prisma, {
      collectionId: archive.id,
      search: "revenue",
    });
    expect(found.edges).toHaveLength(1);
    expect(found.edges[0]?.id).toBe(doc.id);

    const notFound = await listDocuments(prisma, {
      collectionId: inbox.id,
      search: "revenue",
    });
    expect(notFound.edges).toHaveLength(0);
  });

  test("cursor pagination returns nextCursor and stable ordering", async () => {
    const col = await createCollection(prisma, { name: "Bulk", slug: "bulk" });
    for (let i = 0; i < 5; i++) {
      await createDocument(prisma, {
        title: `Doc ${i}`,
        content: "body",
        collectionId: col.id,
      });
    }
    const page1 = await listDocuments(prisma, {
      collectionId: col.id,
      take: 2,
    });
    expect(page1.edges).toHaveLength(2);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await listDocuments(prisma, {
      collectionId: col.id,
      take: 2,
      cursor: page1.nextCursor ?? undefined,
    });
    expect(page2.edges).toHaveLength(2);
    const ids1 = page1.edges.map((d) => d.id);
    const ids2 = page2.edges.map((d) => d.id);
    expect(ids1.some((id) => ids2.includes(id))).toBe(false);
  });

  test("rejects malformed slug and empty title", async () => {
    await expect(
      createCollection(prisma, { name: "Bad", slug: "Bad Slug!" })
    ).rejects.toThrow();

    const col = await createCollection(prisma, { name: "Ok", slug: "ok" });
    await expect(
      createDocument(prisma, {
        title: "  ",
        content: "x",
        collectionId: col.id,
      })
    ).rejects.toThrow();
  });
});
