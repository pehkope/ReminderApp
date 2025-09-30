#!/bin/bash
# Simple photo upload using correct Azure CLI command

echo "📸 Lisätään mom:n kuvat Cosmos DB:hen..."
echo ""

# Test the correct command syntax first
echo "🧪 Testaa ensin yhdellä kuvalla..."

# Create a temporary JSON file
cat > /tmp/test_photo.json <<'EOF'
{
  "id": "photo_mom_001",
  "clientId": "mom",
  "type": "photo",
  "url": "https://drive.google.com/thumbnail?id=1-C_GAzA6QP7UDIfDU2VgYxyd3ZcWwELw",
  "caption": "Äiti, Petri ja Tiitta euroopan kiertueella",
  "uploadedAt": "2025-09-30T12:00:00Z",
  "uploadedBy": "petri",
  "uploadSource": "google_drive",
  "source": "google-drive",
  "fileName": "",
  "blobUrl": "",
  "thumbnailUrl": "",
  "telegramFileId": null,
  "senderName": null,
  "senderChatId": null,
  "createdAt": "2025-09-30T12:00:00Z",
  "fileSize": 0,
  "mimeType": "image/jpeg",
  "isActive": true,
  "tags": ["family", "memories", "historical"]
}
EOF

echo "Testataan komentoa..."
az cosmosdb sql container item create \
    --account-name reminderappdb \
    --resource-group ReminderAppDB \
    --database-name ReminderAppDB \
    --container-name Photos \
    --partition-key-value "mom" \
    --body @/tmp/test_photo.json

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ TOIMII! Kuva lisätty!"
    echo ""
    echo "📝 Seuraavaksi: kopioi add-all-26-photos.sh ja aja se"
else
    echo ""
    echo "❌ Virhe. Tarkista:"
    echo "1. Resource group: ReminderAppDB"
    echo "2. Cosmos DB account: reminderappdb"
    echo "3. Database: ReminderAppDB"
    echo "4. Container: Photos"
    echo ""
    echo "Aja tämä tarkistaaksesi:"
    echo "az cosmosdb list --output table"
fi
