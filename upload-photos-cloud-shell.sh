#!/bin/bash
# Upload all 26 mom photos to Cosmos DB using Azure CLI
# Run this in Azure Cloud Shell (Bash mode)

echo "📸 Lisätään 26 mom:n kuvaa Cosmos DB:hen..."
echo ""

# Configuration
SUBSCRIPTION="Enel-Virtual-desktop-Infrastructure"
RESOURCE_GROUP="ReminderAppDB"
ACCOUNT_NAME="reminderappdb"
DATABASE_NAME="ReminderAppDB"
CONTAINER_NAME="Photos"

# Set subscription
echo "🔧 Asetetaan subscription..."
az account set --subscription "$SUBSCRIPTION"

echo "✅ Subscription asetettu"
echo ""

# Create temporary directory for photo JSON files
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

echo "📝 Luodaan JSON-tiedostot..."

# Function to create photo JSON
create_photo_json() {
    local photo_num=$1
    local url=$2
    local caption=$3
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local photo_id=$(printf "photo_mom_%03d" $photo_num)
    local filename=$(printf "photo-mom-%03d.json" $photo_num)
    
    cat > "$filename" <<EOF
{
  "id": "$photo_id",
  "clientId": "mom",
  "type": "photo",
  "fileName": "",
  "blobUrl": "",
  "thumbnailUrl": "",
  "url": "$url",
  "caption": "$caption",
  "uploadedAt": "$timestamp",
  "uploadedBy": "petri",
  "uploadSource": "google_drive",
  "source": "google-drive",
  "telegramFileId": null,
  "senderName": null,
  "senderChatId": null,
  "createdAt": "$timestamp",
  "fileSize": 0,
  "mimeType": "image/jpeg",
  "isActive": true,
  "tags": ["family", "memories", "historical"]
}
EOF
}

# Create all 26 photo JSON files
create_photo_json 1 "https://drive.google.com/thumbnail?id=1-C_GAzA6QP7UDIfDU2VgYxyd3ZcWwELw" "Äiti, Petri ja Tiitta euroopan kiertueella"
create_photo_json 2 "https://drive.google.com/thumbnail?id=13bnl5gdYaUzj591PulJJsORr28RK6AHu" "Joensuun mummi, Petri ja Tiitta"
create_photo_json 3 "https://drive.google.com/thumbnail?id=1Dp2KrOUMGr1tR8zWBAUODDlY1uZ-bymL" "Äiti ja Asta Kostamo Kilpisjärvellä"
create_photo_json 4 "https://drive.google.com/thumbnail?id=1uiP0mA3WTJmEdQKu6Aor7ex0TUKhI4yN" "Pehkoset ja Kostamot Kilpisjärvellä"
create_photo_json 5 "https://drive.google.com/thumbnail?id=13yTXPhaFwsQhZAb7IvPG4msh7Us4B73W" "Petri"
create_photo_json 6 "https://drive.google.com/thumbnail?id=14zyxO39JwagjzsUDnEk4psrEfdtAIwTG" "Äiti, Petri ja Tiitta"
create_photo_json 7 "https://drive.google.com/thumbnail?id=1LFp6yUXtCrEbP2sGFUBSBbRrfJEujYxY" "Äiti, Petri ja Tiitta"
create_photo_json 8 "https://drive.google.com/thumbnail?id=1khLG2HcfgcUrJPkDdGSuu2i_6OTpcPiO" "Airi ja Petri"
create_photo_json 9 "https://drive.google.com/thumbnail?id=1dGWsX6Jn8oBdRGfVorY2B-hiGF4dZyM2" "Äiti, Petri, Tiitta ja Raili (lastenhoitaja / sukulainen)"
create_photo_json 10 "https://drive.google.com/thumbnail?id=1f61SLOOH7dxax7tiGq1iiXI9otOMP4mq" "Isä ja Tiitta"
create_photo_json 11 "https://drive.google.com/thumbnail?id=1lsQ5-bEz0odiy7yyz-yDfyyUTX5BG_W1" "Ukki ja sen isä sekä ukin veli (Kangasniemi)"
create_photo_json 12 "https://drive.google.com/thumbnail?id=1D2IN2wNB4JE1OAURQdo4fGjTGm8GY7is" "Isän vanhemmat  eli Juho ja Eeva"
create_photo_json 13 "https://drive.google.com/thumbnail?id=1oZMT7tyOEU7nHwW7HLwEavBQo1I6wC7B" "Kajoo - navetta"
create_photo_json 14 "https://drive.google.com/thumbnail?id=1OpX1h-HTKj9PVgWBCr3fzrU2aObIicMh" "Tiitta"
create_photo_json 15 "https://drive.google.com/thumbnail?id=1qN9ko3DFUpToOGFpFVGADmqQNEKc9UPZ" "Petri ja Tiitta Aittolammella"
create_photo_json 16 "https://drive.google.com/thumbnail?id=1S2UjtmLOR1kIk8ziI_ubWCCVi3YeFCPO" "Malmin kavereita"
create_photo_json 17 "https://drive.google.com/thumbnail?id=1RydqtIGmfduqvxlPfUJ4DO68--qXkaMf" "Tiitta"
create_photo_json 18 "https://drive.google.com/thumbnail?id=1DtnX3ShL8bhBqKbNSB76TjWkYrGTJ10K" "Äiti, Petri ja Tiitta Juuassa (Kajoo)"
create_photo_json 19 "https://drive.google.com/thumbnail?id=1CRYAeHKySiZ7QGGmoO8XgGQRCRhuqgPq" "Malmilla hiekkalaatikolla"
create_photo_json 20 "https://drive.google.com/thumbnail?id=1bQXgA47Ly9LRgugi0pTom0xzeJQnaLyx" "Toivon lapsia (meidän serkkuja)"
create_photo_json 21 "https://drive.google.com/thumbnail?id=1uRT3QXa77J7ajWmxNXHI4dLwWx0jWTu2" "Liisa (täti), Petri ja Tiitta"
create_photo_json 22 "https://drive.google.com/thumbnail?id=18lkhB90VPj2UHr-SUNLbdA2-Svw62ywX" "Serjon perhe, mummi ja äiti sekä Kukkoset"
create_photo_json 23 "https://drive.google.com/thumbnail?id=1nDrMukpljNk5pQ9NCSyfzaXPuIvl4rBJ" "Äiti, Petri ja Tiitta"
create_photo_json 24 "https://drive.google.com/thumbnail?id=1A_gV4isk3ONeDLnJiv_Yk7ry3s-13bsb" "Petri ja Tiitta Malmilla"
create_photo_json 25 "https://drive.google.com/thumbnail?id=1b19jQt8YqUCbFhuAZKsJqqW2n7bOYzI5" "Isä ja Tiitta tai Petri"
create_photo_json 26 "https://drive.google.com/thumbnail?id=1_9SeYaRC16MEs-dzpeZK8fGhwGr5trJi" "Äiti, Petri ja Tiitta Jukan-Salpan takapihalla"

echo "✅ JSON-tiedostot luotu"
echo ""

# Upload all photos
SUCCESS_COUNT=0
FAIL_COUNT=0

for i in {1..26}; do
    FILENAME=$(printf "photo-mom-%03d.json" $i)
    PHOTO_ID=$(printf "photo_mom_%03d" $i)
    
    echo "📤 Lisätään: $FILENAME..."
    
    if az cosmosdb sql container create-item \
        --account-name "$ACCOUNT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --database-name "$DATABASE_NAME" \
        --container-name "$CONTAINER_NAME" \
        --partition-key-value "mom" \
        --body "@$FILENAME" \
        > /dev/null 2>&1; then
        echo "   ✅ $PHOTO_ID lisätty!"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "   ❌ Virhe lisättäessä $PHOTO_ID"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    # Small delay to avoid throttling
    sleep 0.2
done

echo ""
echo "═══════════════════════════════════════"
echo "📊 YHTEENVETO"
echo "═══════════════════════════════════════"
echo "✅ Onnistuneet: $SUCCESS_COUNT / 26"
echo "❌ Epäonnistuneet: $FAIL_COUNT / 26"
echo ""

if [ $SUCCESS_COUNT -eq 26 ]; then
    echo "🎉 Kaikki kuvat lisätty onnistuneesti!"
    echo ""
    echo "🧪 Testaa nyt PowerShellissä:"
    echo "Invoke-RestMethod -Uri 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom' | Select-Object dailyPhotoUrl, dailyPhotoCaption"
else
    echo "⚠️  Jotkut kuvat epäonnistuivat."
fi

# Cleanup
cd ~
rm -rf "$TMP_DIR"

echo ""
echo "✨ Valmis!"
