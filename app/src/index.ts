import Fastify from "fastify";
import { recipesPrimary, recipesSecondaryPreferred } from "./db";

const app = Fastify();

app.get("/health", async () => ({ ok: true, db: "mongo-repl" }));

// READ: Normal GET (text search)
app.get("/recipes", async (req, reply) => {
  const q: any = req.query || {};
  const limit = Math.min(Number(q.limit || 10), 100);
  const search = q.search;

  const filter: any = {};
  if (search) filter.recipe_title = { $regex: String(search), $options: "i" };

  const col = await recipesSecondaryPreferred();
  const docs = await col
    .find(filter)
    .limit(limit)
    .project({ _id: 0, recipe_title: 1 })
    .toArray();

  return docs;
});


// READ: Schema-sensitive filter by prep/cook time (minPrep/maxPrep)
app.get("/recipes/by-time", async (req, reply) => {
  const q: any = req.query || {};
  const maxPrep = q.maxPrep ?? "9999";
  const limit = Math.min(Number(q.limit || 10), 100);


  const importType = (process.env.IMPORT_TYPE || "raw").toLowerCase(); // "raw" | "schema"
  const cast = (v: any) => (importType === "schema" ? Number(v) : String(v));



  const filter: any = {
    "timing.prep_time": { $lte: cast(maxPrep) },
  };

  const col = await recipesSecondaryPreferred();
  const docs = await col
    .find(filter)
    .limit(limit)
    .project({ _id: 0, recipe_title: 1, "timing.prep_time": 1 })
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
    content: {
      ingredients: item.ingredients || [],
      directions: item.directions || [],
    },
    timing: {
      cook_speed: item.cook_speed || "unknown",
    },
  });


  reply.code(201).send({ ok: true });
});

const port = Number(process.env.PORT || 8080);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  console.log(`api listening on ${port}`);
});
