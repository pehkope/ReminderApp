const { CosmosClient } = require("@azure/cosmos");
const fs = require("fs");
const { execSync } = require("child_process");

// Hae connection string
console.log("Fetching Cosmos DB connection string...");
const connectionString = execSync(
  'az cosmosdb keys list --name reminderapp-cosmos2025 --resource-group ReminderApp-RG --type connection-strings --query "connectionStrings[0].connectionString" -o tsv',
  { encoding: "utf-8" }
).trim();

console.log("✓ Connection string retrieved");

// Luo Cosmos client
const client = new CosmosClient(connectionString);
const database = client.database("ReminderAppDB");
const container = database.container("Photos");

// Lataa kaikki valokuva-tiedostot
const files = fs.readdirSync(".").filter((f) => f.match(/^photo-mom-\d+\.json$/));
console.log(`Found ${files.length} photo files`);

async function uploadPhotos() {
  for (const file of files) {
    const json = JSON.parse(fs.readFileSync(file, "utf-8"));
    console.log(`Uploading: ${json.id} - ${json.caption}`);
    
    try {
      await container.items.upsert(json);
      console.log(`✓ Uploaded ${json.id}`);
    } catch (err) {
      console.error(`✗ Failed ${json.id}:`, err.message);
    }
  }
  console.log("\n🎉 All photos uploaded!");
}

uploadPhotos().catch(console.error);

