// Fetch real photo URLs from Google Sheets for mom
const { google } = require('googleapis');

// Google Sheets configuration (same as in ReminderAPI)
const SHEETS_ID = '14i3QPYquqSqyE7fTp_pa2LNBq2Jb_re2rwsuUpRRSHo';
const PHOTOS_SHEET_NAME = 'Kuvat';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'YOUR_API_KEY_HERE';

async function fetchMomPhotos() {
  try {
    console.log('🔍 Fetching photos from Google Sheets...');
    console.log(`Sheet ID: ${SHEETS_ID}`);
    console.log(`Sheet Name: ${PHOTOS_SHEET_NAME}`);
    console.log(`API Key: ${GOOGLE_API_KEY ? 'SET' : 'NOT SET'}`);
    
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'YOUR_API_KEY_HERE') {
      console.error('❌ GOOGLE_API_KEY not set! Please set environment variable.');
      console.log('💡 Run: set GOOGLE_API_KEY=your_actual_api_key');
      return;
    }

    const sheets = google.sheets({ version: 'v4', auth: GOOGLE_API_KEY });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEETS_ID,
      range: `${PHOTOS_SHEET_NAME}!A:C`, // ClientID, URL, Caption columns
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      console.log('❌ No photo data found in sheets');
      return;
    }

    console.log(`📊 Found ${rows.length - 1} rows of data (excluding header)`);
    console.log('\n📋 Header row:', rows[0]);

    // Find photos for mom client
    const clientID = 'mom';
    const momPhotos = rows.slice(1).filter(row => 
      row[0] && row[0].toLowerCase() === clientID.toLowerCase()
    );

    if (momPhotos.length === 0) {
      console.log(`❌ No photos found for client: ${clientID}`);
      console.log('\n🔍 Available clients:');
      const clients = [...new Set(rows.slice(1).map(row => row[0]).filter(Boolean))];
      clients.forEach(client => console.log(`  - ${client}`));
      return;
    }

    console.log(`\n📸 Found ${momPhotos.length} photos for mom:`);
    
    // Generate Cosmos DB documents
    const cosmosPhotos = momPhotos.map((photo, index) => ({
      id: `photo_mom_${String(index + 1).padStart(3, '0')}`,
      clientId: 'mom',
      type: 'photo',
      url: photo[1] || '',
      caption: photo[2] || `Valokuva ${index + 1}`,
      source: 'google_sheets',
      isActive: true,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'google_sheets_import',
      tags: ['family', 'memories']
    }));

    console.log('\n📄 Cosmos DB JSON documents:');
    console.log('='.repeat(50));
    
    cosmosPhotos.forEach((photo, index) => {
      console.log(`\n// Photo ${index + 1} for Photos container:`);
      console.log(JSON.stringify(photo, null, 2));
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ Copy-paste these JSON documents to Cosmos DB Photos container!');
    console.log('💡 Azure Portal → Cosmos DB → Data Explorer → Photos → New Item');

    // Also show raw data for verification
    console.log('\n📊 Raw Google Sheets data:');
    momPhotos.forEach((row, index) => {
      console.log(`${index + 1}. Client: "${row[0]}", URL: "${row[1]}", Caption: "${row[2]}"`);
    });

  } catch (error) {
    console.error('❌ Error fetching photos from Google Sheets:', error.message);
    
    if (error.message.includes('API key not valid')) {
      console.log('💡 Check that your Google API key is correct and has Sheets API enabled');
    } else if (error.message.includes('Unable to parse range')) {
      console.log('💡 Check that sheet name "Kuvat" exists in the Google Sheet');
    } else if (error.message.includes('Requested entity was not found')) {
      console.log('💡 Check that the Google Sheet ID is correct and publicly accessible');
    }
  }
}

// Run if called directly
if (require.main === module) {
  fetchMomPhotos();
}

module.exports = { fetchMomPhotos };
