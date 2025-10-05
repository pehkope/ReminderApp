const fs = require("fs");

console.log("🔄 Päivitetään Google Drive URL:t thumbnail → täysikokoinen\n");

// Hae kaikki photo-mom-*.json tiedostot
const photoFiles = fs.readdirSync(".").filter(f => f.match(/^photo-mom-\d+\.json$/));

console.log(`Löytyi ${photoFiles.length} valokuva-tiedostoa\n`);

let updated = 0;

for (const file of photoFiles) {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    
    // Tarkista onko thumbnail URL
    if (data.url && data.url.includes("/thumbnail?id=")) {
      const oldUrl = data.url;
      
      // Poimi ID
      const match = oldUrl.match(/id=([^&]+)/);
      if (match) {
        const driveId = match[1];
        
        // Luo uusi täysikokoinen URL
        data.url = `https://drive.google.com/uc?export=view&id=${driveId}`;
        
        // Tallenna päivitetty tiedosto
        fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
        
        console.log(`✅ ${file}`);
        console.log(`   Vanha: ${oldUrl}`);
        console.log(`   Uusi:  ${data.url}\n`);
        
        updated++;
      }
    } else {
      console.log(`⏭️  ${file} - Ei thumbnail URL:ia, ohitetaan\n`);
    }
  } catch (error) {
    console.error(`❌ VIRHE ${file}: ${error.message}\n`);
  }
}

console.log("=".repeat(50));
console.log(`✅ Päivitetty: ${updated} tiedostoa`);
console.log("=".repeat(50));
