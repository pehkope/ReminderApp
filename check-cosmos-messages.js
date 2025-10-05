const { CosmosClient } = require("@azure/cosmos");
const { execSync } = require("child_process");

// Fetch Cosmos DB connection string
const connectionString = execSync(
  'az cosmosdb keys list --name reminderapp-cosmos2025 --resource-group ReminderApp-RG --type connection-strings --query "connectionStrings[0].connectionString" -o tsv',
  { encoding: "utf-8" }
).trim();

const client = new CosmosClient(connectionString);
const database = client.database("ReminderAppDB");
const container = database.container("Messages");

async function checkMessages() {
  const query = "SELECT * FROM c WHERE c.clientId = 'mom'";
  const { resources } = await container.items.query(query).fetchAll();
  
  console.log(`\n📊 Löytyi ${resources.length} viestiä:\n`);
  
  for (const msg of resources) {
    console.log(`⏰ ${msg.timeSlot} (hour ${msg.hour})`);
    console.log(`   Tervehdyksiä: ${msg.messages?.length || 0}`);
    console.log(`   Sisäaktiviteetteja: ${msg.activities_indoor?.length || 0}`);
    console.log(`   Ulkoaktiviteetteja: ${msg.activities_outdoor?.length || 0}`);
    console.log();
  }
}

checkMessages().catch(console.error);
