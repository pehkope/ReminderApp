const { BlobServiceClient } = require("@azure/storage-blob");
const { CosmosClient } = require("@azure/cosmos");
const { execSync } = require("child_process");
const https = require("https");
const fs = require("fs");
const path = require("path");

// Hae connection stringit
console.log("📦 Haetaan Azure connection stringit...");

const storageConnStr = execSync(
  'az storage account show-connection-string --name reminderappstorage2025 --resource-group ReminderApp-RG --query connectionString -o tsv',
  { encoding: "utf-8" }
).trim();

const cosmosConnStr = execSync(
  'az cosmosdb keys list --name reminderapp-cosmos2025 --resource-group ReminderApp-RG --type connection-strings --query "connectionStrings[0].connectionString" -o tsv',
  { encoding: "utf-8" }
).trim();

console.log("✅ Connection stringit haettu");

// Azure clientit
const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnStr);
const containerClient = blobServiceClient.getContainerClient("photos");

const cosmosClient = new CosmosClient(cosmosConnStr);
const cosmosContainer = cosmosClient.database("ReminderAppDB").container("Photos");

// Varmista että container on olemassa
async function ensureContainer() {
  console.log("🔍 Tarkistetaan että 'photos' container on olemassa...");
  const exists = await containerClient.exists();
  if (!exists) {
    console.log("📦 Luodaan 'photos' container (private)...");
    await containerClient.create(); // Private access
    console.log("✅ Container luotu!\n");
  } else {
    console.log("✅ Container on jo olemassa\n");
  }
}

// Lataa kuva URL:sta (seuraa redirectejä)
function downloadImage(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error("Liikaa redirectejä"));
      return;
    }
    
    https.get(url, (response) => {
      // Seuraa redirectejä
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (!redirectUrl) {
          reject(new Error("Redirect ilman location headeria"));
          return;
        }
        resolve(downloadImage(redirectUrl, redirectCount + 1));
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }
      
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks)));
      response.on("error", reject);
    }).on("error", reject);
  });
}

async function uploadPhotosToBlob() {
  console.log("\n🚀 Aloitetaan kuvien upload...\n");
  
  // Varmista että container on olemassa
  await ensureContainer();
  
  // Hae kaikki photo-mom-*.json tiedostot
  const photoFiles = fs.readdirSync(".").filter(f => f.match(/^photo-mom-\d+\.json$/));
  console.log(`Löytyi ${photoFiles.length} valokuva-tiedostoa\n`);
  
  let uploaded = 0;
  let failed = 0;
  
  for (const file of photoFiles) {
    try {
      const photoData = JSON.parse(fs.readFileSync(file, "utf-8"));
      const { id, url, caption, clientId } = photoData;
      
      if (!url || url.trim() === "") {
        console.log(`⚠️  ${id}: Ei URL:ia, ohitetaan`);
        continue;
      }
      
      console.log(`📥 ${id}: Ladataan ${caption.substring(0, 40)}...`);
      
      // Lataa kuva Google Drivestä
      const imageBuffer = await downloadImage(url);
      console.log(`   Ladattu: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
      
      // Upload Azure Blob Storageen
      const blobName = `${id}.jpg`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      await blockBlobClient.upload(imageBuffer, imageBuffer.length, {
        blobHTTPHeaders: { blobContentType: "image/jpeg" }
      });
      
      const blobUrl = blockBlobClient.url;
      console.log(`   ✅ Uploaded: ${blobUrl}`);
      
      // Päivitä CosmosDB
      photoData.blobUrl = blobUrl;
      photoData.fileSize = imageBuffer.length;
      
      await cosmosContainer.item(id, clientId).replace(photoData);
      console.log(`   ✅ CosmosDB päivitetty\n`);
      
      uploaded++;
      
    } catch (error) {
      console.error(`   ❌ VIRHE ${file}: ${error.message}\n`);
      failed++;
    }
  }
  
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Onnistui: ${uploaded}`);
  console.log(`❌ Epäonnistui: ${failed}`);
  console.log(`📦 Yhteensä: ${photoFiles.length}`);
  console.log("=".repeat(50));
}

// Aja skripti
uploadPhotosToBlob()
  .then(() => {
    console.log("\n🎉 VALMIS!\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ KRIITTINEN VIRHE:", error);
    process.exit(1);
  });
