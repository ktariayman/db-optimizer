import { MongoClient, Collection } from "mongodb";

const url = process.env.MONGO_URL!;
let client: MongoClient | null = null;

export async function eventsRR(): Promise<Collection> {
 if (!client) {
  client = new MongoClient(url);
  await client.connect();
 }
 return client.db().collection("events_rr");
}
