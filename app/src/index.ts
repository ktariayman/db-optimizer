import Fastify from "fastify";
import { recipesPrimary, recipesSecondaryPreferred } from "./db";

const app = Fastify();

app.get("/health", async () => ({ ok: true, db: "mongo-repl" }));

// READ: Search recipes
app.get("/recipes", async (req, reply) => {
  const q: any = req.query || {};
  const search = q.search ? String(q.search) : null;

  const filter: any = {};
  if (search) {
    filter.$text = { $search: search };
  }

  const limit = Math.min(Number(q.limit || 10), 100);

  const col = await recipesSecondaryPreferred();
  const docs = await col.find(filter)
    .limit(limit)
    .project({ _id: 0, recipe_title: 1, ingredients: 1, cook_speed: 1 }) // Project specific fields
    .toArray();

  return docs;
});

// WRITE: Add recipe
app.post("/recipes", async (req, reply) => {
  const body: any = req.body;
  const item = body;

  const col = await recipesPrimary();
  await col.insertOne({
    recipe_title: item.recipe_title || "Untitled",
    ingredients: item.ingredients || [],
    directions: item.directions || [],
    created_at: new Date()
  });

  reply.code(201).send({ ok: true });
});

const port = Number(process.env.PORT || 8080);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  console.log(`api listening on ${port}`);
});
