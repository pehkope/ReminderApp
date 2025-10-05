const { CosmosClient } = require("@azure/cosmos");
const { execSync } = require("child_process");

const cs = execSync(
  'az cosmosdb keys list --name reminderapp-cosmos2025 --resource-group ReminderApp-RG --type connection-strings --query "connectionStrings[0].connectionString" -o tsv',
  { encoding: "utf-8" }
).trim();

const client = new CosmosClient(cs);
const container = client.database("ReminderAppDB").container("Photos");

// Tarkista kaikki mom:in valokuvia
console.log("=== ALL PHOTOS FOR MOM ===");
container.items.query({
  query: "SELECT c.id, c.clientId, c.isActive, c.caption, c.url FROM c WHERE c.clientId = 'mom'"
}).fetchAll()
  .then(result => {
    console.log(`Found ${result.resources.length} photos`);
    result.resources.slice(0, 3).forEach(p => {
      console.log(`- ${p.id}: isActive=${p.isActive}, caption="${p.caption}", url="${p.url.substring(0,50)}..."`);
    });
    
    // Tarkista isActive = true
    console.log("\n=== ACTIVE PHOTOS (isActive = true) ===");
    const active = result.resources.filter(p => p.isActive === true);
    console.log(`Found ${active.length} active photos`);
  })
  .catch(err => console.error("Error:", err.message));
