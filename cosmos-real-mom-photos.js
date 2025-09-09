// Real mom photos from Google Sheets for Cosmos DB
const realMomPhotos = [
  {
    "id": "photo_mom_001",
    "clientId": "mom",
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=1-C_GAzA6QP7UDIfDU2VgYxyd3ZcWwELw",
    "caption": "Äiti, Petri ja Tiitta euroopan kiertueella",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "google_sheets_import",
    "tags": ["family", "travel", "memories"]
  },
  {
    "id": "photo_mom_002", 
    "clientId": "mom",
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=13bnl5gdYaUzj591PulJJsORr28RK6AHu",
    "caption": "Joensuun mummi, Petri ja Tiitta",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "google_sheets_import", 
    "tags": ["family", "grandmother", "memories"]
  },
  {
    "id": "photo_mom_003",
    "clientId": "mom",
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=1Dp2KrOUMGr1tR8zWBAUODDlY1uZ-bymL",
    "caption": "Äiti ja Asta Kostamo Kilpisjärvellä",
    "source": "google_sheets", 
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "google_sheets_import",
    "tags": ["family", "kilpisjarvi", "friends"]
  },
  {
    "id": "photo_mom_004",
    "clientId": "mom",
    "type": "photo", 
    "url": "https://drive.google.com/thumbnail?id=1uiP0mA3WTJmEdQKu6Aor7ex0TUKhI4yN",
    "caption": "Pehkoset ja Kostamot Kilpisjärvellä",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "google_sheets_import",
    "tags": ["family", "kilpisjarvi", "friends"]
  },
  {
    "id": "photo_mom_005",
    "clientId": "mom",
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=13yTXPhaFwsQhZAb7IvPG4msh7Us4B73W", 
    "caption": "Petri",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "google_sheets_import",
    "tags": ["family", "son", "memories"]
  },
  {
    "id": "photo_mom_006",
    "clientId": "mom",
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=14zyxO39JwagjzsUDnEk4psrEfdtAIwTG",
    "caption": "Äiti, Petri ja Tiitta",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "google_sheets_import",
    "tags": ["family", "children", "memories"]
  },
  {
    "id": "photo_mom_007",
    "clientId": "mom", 
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=1LFp6yUXtCrEbP2sGFUBSBbRrfJEujYxY",
    "caption": "Äiti, Petri ja Tiitta",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "google_sheets_import",
    "tags": ["family", "children", "memories"]
  },
  {
    "id": "photo_mom_008",
    "clientId": "mom",
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=1khLG2HcfgcUrJPkDdGSuu2i_6OTpcPiO",
    "caption": "Airi ja Petri",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "google_sheets_import",
    "tags": ["family", "mother", "son"]
  },
  {
    "id": "photo_mom_009",
    "clientId": "mom",
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=1dGWsX6Jn8oBdRGfVorY2B-hiGF4dZyM2",
    "caption": "Äiti, Petri, Tiitta ja Raili (lastenhoitaja / sukulainen)",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z", 
    "uploadedBy": "google_sheets_import",
    "tags": ["family", "caregiver", "memories"]
  },
  {
    "id": "photo_mom_010",
    "clientId": "mom",
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=1f61SLOOH7dxax7tiGq1iiXI9otOMP4mq",
    "caption": "Isä ja Tiitta",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "google_sheets_import",
    "tags": ["family", "father", "daughter"]
  }
];

console.log('=== OIKEAT ÄIDIN VALOKUVAT COSMOS DB:HEN ===');
console.log(`Löytyi ${realMomPhotos.length} ensimmäistä valokuvaa (26:sta)`);
console.log('');
console.log('PHOTOS CONTAINER - Lisää nämä JSON dokumentit:');
console.log('='.repeat(60));

realMomPhotos.forEach((photo, index) => {
  console.log(`\n// Valokuva ${index + 1}: ${photo.caption}`);
  console.log(JSON.stringify(photo, null, 2));
});

console.log('\n' + '='.repeat(60));
console.log('✅ Azure Portal → Cosmos DB → Photos container → New Item');
console.log('📋 Copy-paste nämä JSON dokumentit yksi kerrallaan');
console.log('');
console.log('🎯 Testaa sitten ReminderAPI:');
console.log('GET /api/ReminderAPI?clientID=mom');
console.log('');
console.log('📸 Odotettu tulos:');
console.log('- dailyPhotoUrl: Google Drive thumbnail URL');
console.log('- dailyPhotoCaption: Perhekuvan kuvaus');
console.log('- storage: "cosmos" (kun Cosmos DB on käytössä)');
