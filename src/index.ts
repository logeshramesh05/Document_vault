import { createSchema, createYoga } from "graphql-yoga";
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./schema/resolvers.js";
import { createContext } from "./context.js";

const schema = createSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: "/graphql",
});

const port = Number(process.env.PORT ?? 4000);

const server = Bun.serve({
  hostname: "0.0.0.0",
  port,

  fetch: async (request) => {
    const url = new URL(request.url);

    // Render health check
    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        service: "document-vault",
      });
    }

    return yoga.fetch(request);
  },
});

console.log(`Document Vault API listening on port ${server.port}`);
console.log(`GraphQL endpoint: /graphql`);
console.log(`Health endpoint: /health`);
