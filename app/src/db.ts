import { MongoClient, Db, Collection, ReadPreference } from "mongodb";

const url = process.env.MONGO_URL!;
let client: MongoClient;
let db: Db;

export async function getDb(): Promise<Db> {
 if (!client) {
  client = new MongoClient(url, {
   maxPoolSize: 50,
   serverSelectionTimeoutMS: 10000,
   connectTimeoutMS: 10000,
  });
  await client.connect();
  db = client.db();
 }
 return db;
}

// Writes: default (primary)
export async function eventsPrimary(): Promise<Collection> {
 const d = await getDb();
 return d.collection("events_rr");
}

export async function eventsSecondaryPreferred(): Promise<Collection> {
 const d = await getDb();
 return d.collection("events_rr", { readPreference: ReadPreference.SECONDARY_PREFERRED });
}
