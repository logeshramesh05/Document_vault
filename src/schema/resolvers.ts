import { DateTimeResolver } from "graphql-scalars";
import type { Collection, Document } from "@prisma/client";
import type { Context } from "../context.js";
import * as collectionResolvers from "../resolvers/collection.js";
import * as documentResolvers from "../resolvers/document.js";
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentQueryArgs,
} from "../resolvers/document.js";
import type { CreateCollectionInput } from "../resolvers/collection.js";

export const resolvers = {
  DateTime: DateTimeResolver,
  Collection: {
    documents: (parent: Collection, _args: unknown, ctx: Context) =>
      ctx.prisma.document.findMany({
        where: { collectionId: parent.id },
        orderBy: { createdAt: "desc" },
      }),
  },
  Document: {
    collection: (parent: Document, _args: unknown, ctx: Context) =>
      ctx.prisma.collection.findUniqueOrThrow({
        where: { id: parent.collectionId },
      }),
  },
  Query: {
    collections: (_p: unknown, _a: unknown, ctx: Context) =>
      collectionResolvers.listCollections(ctx.prisma),
    collection: (_p: unknown, args: { id: string }, ctx: Context) =>
      collectionResolvers.getCollection(ctx.prisma, args.id),
    documents: (_p: unknown, args: DocumentQueryArgs, ctx: Context) =>
      documentResolvers.listDocuments(ctx.prisma, args),
  },
  Mutation: {
    createCollection: (
      _p: unknown,
      args: { input: CreateCollectionInput },
      ctx: Context
    ) => collectionResolvers.createCollection(ctx.prisma, args.input),
    createDocument: (
      _p: unknown,
      args: { input: CreateDocumentInput },
      ctx: Context
    ) => documentResolvers.createDocument(ctx.prisma, args.input),
    updateDocument: (
      _p: unknown,
      args: { id: string; input: UpdateDocumentInput },
      ctx: Context
    ) => documentResolvers.updateDocument(ctx.prisma, args.id, args.input),
    deleteDocument: (_p: unknown, args: { id: string }, ctx: Context) =>
      documentResolvers.deleteDocument(ctx.prisma, args.id),
    moveDocument: (
      _p: unknown,
      args: { id: string; collectionId: string },
      ctx: Context
    ) => documentResolvers.moveDocument(ctx.prisma, args.id, args.collectionId),
  },
};
