const { CosmosClient } = require("@azure/cosmos");
const fs = require("fs");
const { execSync } = require("child_process");

// Fetch Cosmos DB connection string
const connectionString = execSync(
  'az cosmosdb keys list --name reminderapp-cosmos2025 --resource-group ReminderApp-RG --type connection-strings --query "connectionStrings[0].connectionString" -o tsv',
  { encoding: "utf-8" }
).trim();

console.log("✅ Connection string haettu");

const client = new CosmosClient(connectionString);
const database = client.database("ReminderAppDB");
const container = database.container("Messages");

// Varmista että container on olemassa
async function ensureContainer() {
  console.log("🔍 Tarkistetaan että 'Messages' container on olemassa...");
  try {
    await container.read();
    console.log("✅ Container on jo olemassa\n");
  } catch (error) {
    if (error.code === 404) {
      console.log("📦 Luodaan 'Messages' container...");
      await database.containers.create({
        id: "Messages",
        partitionKey: { paths: ["/clientId"] }
      });
      console.log("✅ Container luotu!\n");
    } else {
      throw error;
    }
  }
}

async function uploadMessages() {
  console.log("\n🚀 Aloitetaan viestien upload...\n");
  
  // Varmista että container on olemassa
  await ensureContainer();
  
  // Hae kaikki messages-mom-*.json tiedostot
  const messageFiles = fs.readdirSync(".").filter(f => f.match(/^messages-mom-.+\.json$/));
  console.log(`Löytyi ${messageFiles.length} viesti-tiedostoa\n`);
  
  let uploaded = 0;
  let failed = 0;
  
  for (const file of messageFiles) {
    const json = fs.readFileSync(file, "utf-8");
    const item = JSON.parse(json);

    console.log(`📤 ${file}: ${item.timeSlot} (hour ${item.hour})...`);

    try {
      await container.items.upsert(item);
      console.log(`   ✅ Uploaded successfully\n`);
      uploaded++;
    } catch (error) {
      console.error(`   ❌ VIRHE ${file}: ${error.message}\n`);
      failed++;
    }
  }

  console.log("==================================================");
  console.log(`✅ Onnistui: ${uploaded}`);
  console.log(`❌ Epäonnistui: ${failed}`);
  console.log(`📦 Yhteensä: ${messageFiles.length}`);
  console.log("==================================================");
  console.log("\n🎉 VALMIS!");
}

uploadMessages().catch(console.error);
