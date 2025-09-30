#!/bin/bash
# Add all 26 mom photos to Cosmos DB
# Copy this entire file and paste to Azure Cloud Shell (Bash mode)

echo "📸 Lisätään 26 mom:n kuvaa Cosmos DB:hen..."

# Configuration
SUBSCRIPTION="ReminderApp"
RESOURCE_GROUP="ReminderAppDB"
ACCOUNT_NAME="reminderappdb"
DATABASE_NAME="ReminderAppDB"
CONTAINER_NAME="Photos"

# Set subscription
az account set --subscription "$SUBSCRIPTION"

# Function to add photo
add_photo() {
    local num=$1
    local url=$2
    local caption=$3
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local id=$(printf "photo_mom_%03d" $num)
    
    local json=$(cat <<EOF
{
  "id": "$id",
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
)
    
    echo "$json" | az cosmosdb sql container create-item \
        --account-name "$ACCOUNT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --database-name "$DATABASE_NAME" \
        --container-name "$CONTAINER_NAME" \
        --partition-key-value "mom" \
        --body @- > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ $num/26: $caption"
        return 0
    else
        echo "❌ $num/26: VIRHE - $caption"
        return 1
    fi
}

# Add all 26 photos
SUCCESS=0
add_photo 1 "https://drive.google.com/thumbnail?id=1-C_GAzA6QP7UDIfDU2VgYxyd3ZcWwELw" "Äiti, Petri ja Tiitta euroopan kiertueella" && SUCCESS=$((SUCCESS+1))
add_photo 2 "https://drive.google.com/thumbnail?id=13bnl5gdYaUzj591PulJJsORr28RK6AHu" "Joensuun mummi, Petri ja Tiitta" && SUCCESS=$((SUCCESS+1))
add_photo 3 "https://drive.google.com/thumbnail?id=1Dp2KrOUMGr1tR8zWBAUODDlY1uZ-bymL" "Äiti ja Asta Kostamo Kilpisjärvellä" && SUCCESS=$((SUCCESS+1))
add_photo 4 "https://drive.google.com/thumbnail?id=1uiP0mA3WTJmEdQKu6Aor7ex0TUKhI4yN" "Pehkoset ja Kostamot Kilpisjärvellä" && SUCCESS=$((SUCCESS+1))
add_photo 5 "https://drive.google.com/thumbnail?id=13yTXPhaFwsQhZAb7IvPG4msh7Us4B73W" "Petri" && SUCCESS=$((SUCCESS+1))
add_photo 6 "https://drive.google.com/thumbnail?id=14zyxO39JwagjzsUDnEk4psrEfdtAIwTG" "Äiti, Petri ja Tiitta" && SUCCESS=$((SUCCESS+1))
add_photo 7 "https://drive.google.com/thumbnail?id=1LFp6yUXtCrEbP2sGFUBSBbRrfJEujYxY" "Äiti, Petri ja Tiitta" && SUCCESS=$((SUCCESS+1))
add_photo 8 "https://drive.google.com/thumbnail?id=1khLG2HcfgcUrJPkDdGSuu2i_6OTpcPiO" "Airi ja Petri" && SUCCESS=$((SUCCESS+1))
add_photo 9 "https://drive.google.com/thumbnail?id=1dGWsX6Jn8oBdRGfVorY2B-hiGF4dZyM2" "Äiti, Petri, Tiitta ja Raili (lastenhoitaja / sukulainen)" && SUCCESS=$((SUCCESS+1))
add_photo 10 "https://drive.google.com/thumbnail?id=1f61SLOOH7dxax7tiGq1iiXI9otOMP4mq" "Isä ja Tiitta" && SUCCESS=$((SUCCESS+1))
add_photo 11 "https://drive.google.com/thumbnail?id=1lsQ5-bEz0odiy7yyz-yDfyyUTX5BG_W1" "Ukki ja sen isä sekä ukin veli (Kangasniemi)" && SUCCESS=$((SUCCESS+1))
add_photo 12 "https://drive.google.com/thumbnail?id=1D2IN2wNB4JE1OAURQdo4fGjTGm8GY7is" "Isän vanhemmat  eli Juho ja Eeva" && SUCCESS=$((SUCCESS+1))
add_photo 13 "https://drive.google.com/thumbnail?id=1oZMT7tyOEU7nHwW7HLwEavBQo1I6wC7B" "Kajoo - navetta" && SUCCESS=$((SUCCESS+1))
add_photo 14 "https://drive.google.com/thumbnail?id=1OpX1h-HTKj9PVgWBCr3fzrU2aObIicMh" "Tiitta" && SUCCESS=$((SUCCESS+1))
add_photo 15 "https://drive.google.com/thumbnail?id=1qN9ko3DFUpToOGFpFVGADmqQNEKc9UPZ" "Petri ja Tiitta Aittolammella" && SUCCESS=$((SUCCESS+1))
add_photo 16 "https://drive.google.com/thumbnail?id=1S2UjtmLOR1kIk8ziI_ubWCCVi3YeFCPO" "Malmin kavereita" && SUCCESS=$((SUCCESS+1))
add_photo 17 "https://drive.google.com/thumbnail?id=1RydqtIGmfduqvxlPfUJ4DO68--qXkaMf" "Tiitta" && SUCCESS=$((SUCCESS+1))
add_photo 18 "https://drive.google.com/thumbnail?id=1DtnX3ShL8bhBqKbNSB76TjWkYrGTJ10K" "Äiti, Petri ja Tiitta Juuassa (Kajoo)" && SUCCESS=$((SUCCESS+1))
add_photo 19 "https://drive.google.com/thumbnail?id=1CRYAeHKySiZ7QGGmoO8XgGQRCRhuqgPq" "Malmilla hiekkalaatikolla" && SUCCESS=$((SUCCESS+1))
add_photo 20 "https://drive.google.com/thumbnail?id=1bQXgA47Ly9LRgugi0pTom0xzeJQnaLyx" "Toivon lapsia (meidän serkkuja)" && SUCCESS=$((SUCCESS+1))
add_photo 21 "https://drive.google.com/thumbnail?id=1uRT3QXa77J7ajWmxNXHI4dLwWx0jWTu2" "Liisa (täti), Petri ja Tiitta" && SUCCESS=$((SUCCESS+1))
add_photo 22 "https://drive.google.com/thumbnail?id=18lkhB90VPj2UHr-SUNLbdA2-Svw62ywX" "Serjon perhe, mummi ja äiti sekä Kukkoset" && SUCCESS=$((SUCCESS+1))
add_photo 23 "https://drive.google.com/thumbnail?id=1nDrMukpljNk5pQ9NCSyfzaXPuIvl4rBJ" "Äiti, Petri ja Tiitta" && SUCCESS=$((SUCCESS+1))
add_photo 24 "https://drive.google.com/thumbnail?id=1A_gV4isk3ONeDLnJiv_Yk7ry3s-13bsb" "Petri ja Tiitta Malmilla" && SUCCESS=$((SUCCESS+1))
add_photo 25 "https://drive.google.com/thumbnail?id=1b19jQt8YqUCbFhuAZKsJqqW2n7bOYzI5" "Isä ja Tiitta tai Petri" && SUCCESS=$((SUCCESS+1))
add_photo 26 "https://drive.google.com/thumbnail?id=1_9SeYaRC16MEs-dzpeZK8fGhwGr5trJi" "Äiti, Petri ja Tiitta Jukan-Salpan takapihalla" && SUCCESS=$((SUCCESS+1))

echo ""
echo "════════════════════════════════════════"
echo "✅ Lisätty: $SUCCESS / 26 kuvaa"
echo "════════════════════════════════════════"

if [ $SUCCESS -eq 26 ]; then
    echo "🎉 VALMIS! Kaikki kuvat lisätty!"
    echo ""
    echo "🧪 Testaa nyt:"
    echo "Invoke-RestMethod -Uri 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom' | Select-Object dailyPhotoUrl, dailyPhotoCaption"
else
    echo "⚠️ Virheitä: $((26 - SUCCESS))"
fi
