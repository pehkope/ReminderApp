#!/bin/bash
# Simple script to upload photos from local JSON files to Cosmos DB
# Run in Azure Cloud Shell after uploading JSON files

echo "📸 Ladataan valokuvat Cosmos DB:hen..."
echo ""

# Configuration
RESOURCE_GROUP="ReminderAppDB"
ACCOUNT_NAME="reminderappdb"
DATABASE_NAME="ReminderAppDB"
CONTAINER_NAME="Photos"

echo "🔑 Haetaan Cosmos DB avain..."
COSMOS_KEY=$(az cosmosdb keys list \
    --name $ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP \
    --query primaryMasterKey \
    --output tsv)

if [ -z "$COSMOS_KEY" ]; then
    echo "❌ Ei saatu Cosmos DB avainta!"
    exit 1
fi

echo "✅ Avain haettu!"
echo ""

# Check if photo files exist
if [ ! -f "photo-mom-001.json" ]; then
    echo "❌ Photo-tiedostoja ei löydy!"
    echo ""
    echo "📝 Ohjeet:"
    echo "1. Lataa photo-mom-*.json tiedostot Azure Cloud Shellin"
    echo "2. Voit tehdä tämän Cloud Shellin Upload-napilla"
    echo "3. Tai kopioi tiedostojen sisällöt yksitellen"
    exit 1
fi

echo "📤 Ladataan 26 kuvaa..."
SUCCESS=0
FAIL=0

for i in {1..26}; do
    FILENAME=$(printf "photo-mom-%03d.json" $i)
    
    if [ ! -f "$FILENAME" ]; then
        echo "⚠️  $FILENAME ei löydy, ohitetaan..."
        continue
    fi
    
    echo -n "Ladataan $FILENAME... "
    
    # Use Azure Data Explorer REST API
    ENDPOINT="https://${ACCOUNT_NAME}.documents.azure.com"
    RESOURCE_LINK="dbs/${DATABASE_NAME}/colls/${CONTAINER_NAME}/docs"
    DATE=$(date -u +"%a, %d %b %Y %H:%M:%S GMT")
    
    # Read JSON content
    JSON_CONTENT=$(cat "$FILENAME")
    
    # Make REST API call
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        "${ENDPOINT}/${RESOURCE_LINK}" \
        -H "Authorization: $(echo -n "post\ndocs\n${RESOURCE_LINK}\n${DATE}\n\n" | openssl dgst -sha256 -hmac "$COSMOS_KEY" -binary | base64 | sed 's/+/%2B/g' | sed 's/\//%2F/g')" \
        -H "x-ms-date: ${DATE}" \
        -H "x-ms-version: 2018-12-31" \
        -H "Content-Type: application/json" \
        -H "x-ms-documentdb-partitionkey: [\"mom\"]" \
        -d "$JSON_CONTENT")
    
    if [ "$HTTP_CODE" = "201" ]; then
        echo "✅"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "❌ (HTTP $HTTP_CODE)"
        FAIL=$((FAIL + 1))
    fi
done

echo ""
echo "════════════════════════════════════════"
echo "✅ Onnistuneet: $SUCCESS / 26"
echo "❌ Epäonnistuneet: $FAIL / 26"
echo "════════════════════════════════════════"

if [ $SUCCESS -gt 0 ]; then
    echo ""
    echo "🎉 Kuvat lisätty! Testaa PowerShellissä:"
    echo ".\test-photos-direct.ps1"
fi
