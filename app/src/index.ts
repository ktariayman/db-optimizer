import Fastify from "fastify";
import { recipesPrimary, recipesSecondaryPreferred } from "./db";
import { ReadConcern, WriteConcern } from "mongodb";

const app = Fastify({
  logger: true,
});


app.get("/health", async () => ({
  ok: true,
  db: "mongo-repl",
  consistency: {
    reads: "majority",
    writes: "majority",
  },
}));

app.get("/recipes", async (req, reply) => {
  const q: any = req.query || {};
  const search = q.search ? String(q.search) : null;
  const receivedBefore = q.receivedBefore
    ? new Date(String(q.receivedBefore))
    : null;
  const limit = Math.min(Number(q.limit || 10), 100);

  const filter: any = {};
  if (search) {
    filter.$text = { $search: search as string };
  }

  if (receivedBefore) {
    filter.created_at = { $lte: receivedBefore };
  }

  const col = await recipesSecondaryPreferred({
    readConcern: new ReadConcern("majority"),
  });

  const docs = await col
    .find(filter)
    .limit(limit)
    .project({
      _id: 0,
      recipe_title: 1,
      ingredients: 1,
      cook_speed: 1,
      created_at: 1,
    })
    .toArray();

  return {
    count: docs.length,
    data: docs,
  };
});

/**
 * WRITE: Add recipe
 * - Writes to primary
 * - Enforces majority writeConcern
 */
app.post("/recipes", async (req, reply) => {
  const body: any = req.body || {};

  const col = await recipesPrimary({
    writeConcern: new WriteConcern("majority"),
  });

  const now = new Date();

  await col.insertOne({
    recipe_title: body.recipe_title || "Untitled",
    ingredients: body.ingredients || [],
    directions: body.directions || [],
    cook_speed: body.cook_speed || "normal",
    created_at: now,
  });

  reply.code(201).send({
    ok: true,
    created_at: now.toISOString(),
    consistency: "majority",
  });
});

/**
 * Server bootstrap
 */
const port = Number(process.env.PORT || 8080);

app.listen({ port, host: "0.0.0.0" }).then(() => {
  console.log(`API listening on ${port}`);
});
