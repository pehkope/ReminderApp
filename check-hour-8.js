const { CosmosClient } = require("@azure/cosmos");
const { execSync } = require("child_process");

const connectionString = execSync(
  'az cosmosdb keys list --name reminderapp-cosmos2025 --resource-group ReminderApp-RG --type connection-strings --query "connectionStrings[0].connectionString" -o tsv',
  { encoding: "utf-8" }
).trim();

const client = new CosmosClient(connectionString);
const container = client.database("ReminderAppDB").container("Messages");

async function checkHour8() {
  const query = "SELECT * FROM c WHERE c.clientId = 'mom' AND c.hour = 8";
  const { resources } = await container.items.query(query).fetchAll();
  
  console.log(`\n📊 Hour 8 message:\n`);
  
  if (resources.length > 0) {
    const msg = resources[0];
    console.log(`ID: ${msg.id}`);
    console.log(`TimeSlot: ${msg.timeSlot}`);
    console.log(`Hour: ${msg.hour}`);
    console.log(`\nFirst Message: ${msg.messages[0]}`);
    console.log(`\nFirst Indoor Activity: ${msg.activities_indoor[0]}`);
    console.log(`\nFirst Outdoor Activity: ${msg.activities_outdoor[0]}`);
  } else {
    console.log("❌ No message found for hour 8!");
  }
}

checkHour8().catch(console.error);

