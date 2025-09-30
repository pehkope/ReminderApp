#!/bin/bash
# Debug version - shows all errors

echo "📸 Lisätään kuvat - NÄYTETÄÄN VIRHEET"
echo ""

# Test with just ONE photo and show full error
echo "🧪 Testi yhdellä kuvalla..."
echo ""

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

echo "Yritetään lisätä photo_mom_001..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

az cosmosdb sql container item create \
    --account-name reminderappdb \
    --resource-group ReminderAppDB \
    --database-name ReminderAppDB \
    --container-name Photos \
    --partition-key-value "mom" \
    --body @/tmp/test_photo.json

EXIT_CODE=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ ONNISTUI!"
else
    echo "❌ EPÄONNISTUI (exit code: $EXIT_CODE)"
    echo ""
    echo "Tarkista:"
    echo "1. Cosmos DB account: reminderappdb"
    echo "2. Resource Group: ReminderAppDB"
    echo "3. Database: ReminderAppDB"
    echo "4. Container: Photos"
    echo ""
    echo "Aja nämä komennot:"
    echo "  az cosmosdb list --output table"
    echo "  az cosmosdb sql database list --account-name reminderappdb --resource-group ReminderAppDB --output table"
    echo "  az cosmosdb sql container list --account-name reminderappdb --resource-group ReminderAppDB --database-name ReminderAppDB --output table"
fi

echo ""
echo "📋 Kopioi KAIKKI yllä oleva teksti tähän chattiin!"
