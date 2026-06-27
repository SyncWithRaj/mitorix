const { MongoClient } = require('mongodb');

async function run() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/repolens";
  console.log("Connecting to", uri);
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const result = await db.collection('users').updateOne({}, { $set: { subscriptionTier: "BASIC" } });
    console.log("Updated users:", result.modifiedCount);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
run();
