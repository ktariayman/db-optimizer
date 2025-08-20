import { MongoClient, Db, Collection } from "mongodb";

const url = process.env.MONGO_URL!;
let client: MongoClient;
let db: Db;

export async function getDb(): Promise<Db> {
 if (!client) {
  client = new MongoClient(url);
  await client.connect();
  db = client.db(); // database from URL
 }
 return db;
}

export async function events(): Promise<Collection> {
 const d = await getDb();
 return d.collection("events");
}
