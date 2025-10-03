const { CosmosClient } = require("@azure/cosmos");
const { execSync } = require("child_process");

const cs = execSync(
  'az cosmosdb keys list --name reminderapp-cosmos2025 --resource-group ReminderApp-RG --type connection-strings --query "connectionStrings[0].connectionString" -o tsv',
  { encoding: "utf-8" }
).trim();

const client = new CosmosClient(cs);
const container = client.database("ReminderAppDB").container("Photos");

container.item("photo_mom_004", "mom").read()
  .then(r => {
    console.log("Photo from CosmosDB:");
    console.log("ID:", r.resource.id);
    console.log("Caption:", r.resource.caption);
    console.log("URL:", r.resource.url);
    console.log("BlobUrl:", r.resource.blobUrl);
    console.log("\nFull object:");
    console.log(JSON.stringify(r.resource, null, 2));
  })
  .catch(err => console.error("Error:", err.message));

