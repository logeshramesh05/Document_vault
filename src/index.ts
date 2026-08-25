import { createSchema, createYoga } from "graphql-yoga";
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./schema/resolvers.js";
import { createContext } from "./context.js";

const schema = createSchema({ typeDefs, resolvers });

const yoga = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: "/graphql",
});

const port = Number(process.env.PORT ?? 4000);

Bun.serve({ port, fetch: yoga.fetch });

console.log(`document-vault listening on http://localhost:${port}/graphql`);
