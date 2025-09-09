// Fetch photos from Google Sheets using public CSV export (no API key needed)
const https = require('https');

// Google Sheets public CSV export URL
const SHEETS_ID = '14i3QPYquqSqyE7fTp_pa2LNBq2Jb_re2rwsuUpRRSHo';
const SHEET_GID = '557084529'; // This is the gid from the URL you provided
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEETS_ID}/export?format=csv&gid=${SHEET_GID}`;

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  return lines.map(line => {
    // Simple CSV parsing (handles basic cases)
    const cells = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

async function fetchMomPhotosPublic() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Fetching photos from Google Sheets (public CSV)...');
    console.log(`Sheet ID: ${SHEETS_ID}`);
    console.log(`Sheet GID: ${SHEET_GID}`);
    console.log(`CSV URL: ${CSV_URL}`);
    
    function makeRequest(url, redirectCount = 0) {
      if (redirectCount > 5) {
        reject(new Error('Too many redirects'));
        return;
      }
      
      https.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
          const redirectUrl = response.headers.location;
          console.log(`📍 Redirecting to: ${redirectUrl}`);
          makeRequest(redirectUrl, redirectCount + 1);
          return;
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
      
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          console.log('\n📊 Raw CSV data received:');
          console.log('First 500 chars:', data.substring(0, 500));
          
          const rows = parseCSV(data);
          console.log(`\n📋 Parsed ${rows.length} rows`);
          
          if (rows.length <= 1) {
            console.log('❌ No data rows found (only header or empty)');
            return;
          }
          
          console.log('Header row:', rows[0]);
          
          // Find photos for mom client (case insensitive)
          const clientID = 'mom';
          const momPhotos = rows.slice(1).filter(row => 
            row[0] && row[0].toLowerCase().trim() === clientID.toLowerCase()
          );
          
          if (momPhotos.length === 0) {
            console.log(`❌ No photos found for client: ${clientID}`);
            console.log('\n🔍 Available clients in data:');
            const clients = [...new Set(rows.slice(1).map(row => row[0]).filter(Boolean))];
            clients.forEach(client => console.log(`  - "${client}"`));
            return;
          }
          
          console.log(`\n📸 Found ${momPhotos.length} photos for mom:`);
          
          // Generate Cosmos DB documents
          const cosmosPhotos = momPhotos.map((photo, index) => ({
            id: `photo_mom_${String(index + 1).padStart(3, '0')}`,
            clientId: 'mom',
            type: 'photo',
            url: photo[1] ? photo[1].trim() : '',
            caption: photo[2] ? photo[2].trim() : `Valokuva ${index + 1}`,
            source: 'google_sheets',
            isActive: true,
            uploadedAt: new Date().toISOString(),
            uploadedBy: 'google_sheets_import',
            tags: ['family', 'memories']
          }));
          
          console.log('\n📄 Cosmos DB JSON documents for Photos container:');
          console.log('='.repeat(60));
          
          cosmosPhotos.forEach((photo, index) => {
            console.log(`\n// Photo ${index + 1}:`);
            console.log(JSON.stringify(photo, null, 2));
          });
          
          console.log('\n' + '='.repeat(60));
          console.log('✅ Copy-paste these JSON documents to Cosmos DB Photos container!');
          console.log('💡 Azure Portal → Cosmos DB → Data Explorer → Photos → New Item');
          
          // Show raw data for verification
          console.log('\n📊 Raw Google Sheets data verification:');
          momPhotos.forEach((row, index) => {
            console.log(`${index + 1}. Client: "${row[0]}", URL: "${row[1]}", Caption: "${row[2]}"`);
          });
          
          resolve(cosmosPhotos);
          
        } catch (error) {
          reject(error);
        }
      });
      
      }).on('error', (error) => {
        reject(error);
      });
    }
    
    makeRequest(CSV_URL);
  });
}

// Run if called directly
if (require.main === module) {
  fetchMomPhotosPublic()
    .then(() => console.log('\n🎉 Success!'))
    .catch(error => {
      console.error('❌ Error:', error.message);
      
      if (error.message.includes('403')) {
        console.log('💡 Sheet might not be publicly accessible. Make sure it\'s shared with "Anyone with the link can view"');
      } else if (error.message.includes('404')) {
        console.log('💡 Sheet or specific sheet tab (gid) not found. Check the URL and gid parameter.');
      }
    });
}

module.exports = { fetchMomPhotosPublic };
