#!/bin/bash
# Add photos using REST API (works with any Azure CLI version)

echo "📸 Lisätään kuvat REST API:lla..."
echo ""

# Get Cosmos DB key
echo "🔑 Haetaan Cosmos DB avain..."
COSMOS_KEY=$(az cosmosdb keys list \
    --name reminderappdb \
    --resource-group ReminderAppDB \
    --query primaryMasterKey \
    --output tsv)

if [ -z "$COSMOS_KEY" ]; then
    echo "❌ Cosmos DB avainta ei saatu!"
    exit 1
fi

echo "✅ Avain haettu"
echo ""

# Cosmos DB details
ACCOUNT_NAME="reminderappdb"
DATABASE_NAME="ReminderAppDB"
CONTAINER_NAME="Photos"
ENDPOINT="https://${ACCOUNT_NAME}.documents.azure.com"

# Function to add photo using REST API
add_photo_rest() {
    local num=$1
    local url=$2
    local caption=$3
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local id=$(printf "photo_mom_%03d" $num)
    
    # Create JSON payload
    local json=$(cat <<EOF
{
  "id": "$id",
  "clientId": "mom",
  "type": "photo",
  "url": "$url",
  "caption": "$caption",
  "uploadedAt": "$timestamp",
  "uploadedBy": "petri",
  "uploadSource": "google_drive",
  "source": "google-drive",
  "fileName": "",
  "blobUrl": "",
  "thumbnailUrl": "",
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
    
    # Generate authorization signature
    local verb="POST"
    local resource_type="docs"
    local resource_link="dbs/${DATABASE_NAME}/colls/${CONTAINER_NAME}"
    local date=$(date -u +"%a, %d %b %Y %H:%M:%S GMT")
    
    local string_to_sign="${verb}\n${resource_type}\n${resource_link}\n${date}\n\n"
    local signature=$(echo -n "$string_to_sign" | openssl dgst -sha256 -hmac "$COSMOS_KEY" -binary | base64)
    local auth_token="type=master&ver=1.0&sig=$signature"
    
    # Make REST API call
    local response=$(curl -s -w "\n%{http_code}" -X POST \
        "${ENDPOINT}/dbs/${DATABASE_NAME}/colls/${CONTAINER_NAME}/docs" \
        -H "Authorization: ${auth_token}" \
        -H "x-ms-date: ${date}" \
        -H "x-ms-version: 2018-12-31" \
        -H "Content-Type: application/json" \
        -H "x-ms-documentdb-partitionkey: [\"mom\"]" \
        -d "$json")
    
    local http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "201" ]; then
        echo "✅ $num/26: $caption"
        return 0
    else
        echo "❌ $num/26: HTTP $http_code"
        return 1
    fi
}

# Test with first photo
echo "🧪 Testaa yhdellä kuvalla..."
add_photo_rest 1 "https://drive.google.com/thumbnail?id=1-C_GAzA6QP7UDIfDU2VgYxyd3ZcWwELw" "Äiti, Petri ja Tiitta euroopan kiertueella"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ TOIMII! Jatketaanko kaikkiin 26 kuvaan? (y/n)"
    read -r answer
    
    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        echo ""
        echo "📤 Lisätään kaikki 26 kuvaa..."
        
        SUCCESS=0
        add_photo_rest 2 "https://drive.google.com/thumbnail?id=13bnl5gdYaUzj591PulJJsORr28RK6AHu" "Joensuun mummi, Petri ja Tiitta" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 3 "https://drive.google.com/thumbnail?id=1Dp2KrOUMGr1tR8zWBAUODDlY1uZ-bymL" "Äiti ja Asta Kostamo Kilpisjärvellä" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 4 "https://drive.google.com/thumbnail?id=1uiP0mA3WTJmEdQKu6Aor7ex0TUKhI4yN" "Pehkoset ja Kostamot Kilpisjärvellä" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 5 "https://drive.google.com/thumbnail?id=13yTXPhaFwsQhZAb7IvPG4msh7Us4B73W" "Petri" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 6 "https://drive.google.com/thumbnail?id=14zyxO39JwagjzsUDnEk4psrEfdtAIwTG" "Äiti, Petri ja Tiitta" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 7 "https://drive.google.com/thumbnail?id=1LFp6yUXtCrEbP2sGFUBSBbRrfJEujYxY" "Äiti, Petri ja Tiitta" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 8 "https://drive.google.com/thumbnail?id=1khLG2HcfgcUrJPkDdGSuu2i_6OTpcPiO" "Airi ja Petri" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 9 "https://drive.google.com/thumbnail?id=1dGWsX6Jn8oBdRGfVorY2B-hiGF4dZyM2" "Äiti, Petri, Tiitta ja Raili (lastenhoitaja / sukulainen)" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 10 "https://drive.google.com/thumbnail?id=1f61SLOOH7dxax7tiGq1iiXI9otOMP4mq" "Isä ja Tiitta" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 11 "https://drive.google.com/thumbnail?id=1lsQ5-bEz0odiy7yyz-yDfyyUTX5BG_W1" "Ukki ja sen isä sekä ukin veli (Kangasniemi)" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 12 "https://drive.google.com/thumbnail?id=1D2IN2wNB4JE1OAURQdo4fGjTGm8GY7is" "Isän vanhemmat  eli Juho ja Eeva" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 13 "https://drive.google.com/thumbnail?id=1oZMT7tyOEU7nHwW7HLwEavBQo1I6wC7B" "Kajoo - navetta" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 14 "https://drive.google.com/thumbnail?id=1OpX1h-HTKj9PVgWBCr3fzrU2aObIicMh" "Tiitta" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 15 "https://drive.google.com/thumbnail?id=1qN9ko3DFUpToOGFpFVGADmqQNEKc9UPZ" "Petri ja Tiitta Aittolammella" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 16 "https://drive.google.com/thumbnail?id=1S2UjtmLOR1kIk8ziI_ubWCCVi3YeFCPO" "Malmin kavereita" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 17 "https://drive.google.com/thumbnail?id=1RydqtIGmfduqvxlPfUJ4DO68--qXkaMf" "Tiitta" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 18 "https://drive.google.com/thumbnail?id=1DtnX3ShL8bhBqKbNSB76TjWkYrGTJ10K" "Äiti, Petri ja Tiitta Juuassa (Kajoo)" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 19 "https://drive.google.com/thumbnail?id=1CRYAeHKySiZ7QGGmoO8XgGQRCRhuqgPq" "Malmilla hiekkalaatikolla" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 20 "https://drive.google.com/thumbnail?id=1bQXgA47Ly9LRgugi0pTom0xzeJQnaLyx" "Toivon lapsia (meidän serkkuja)" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 21 "https://drive.google.com/thumbnail?id=1uRT3QXa77J7ajWmxNXHI4dLwWx0jWTu2" "Liisa (täti), Petri ja Tiitta" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 22 "https://drive.google.com/thumbnail?id=18lkhB90VPj2UHr-SUNLbdA2-Svw62ywX" "Serjon perhe, mummi ja äiti sekä Kukkoset" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 23 "https://drive.google.com/thumbnail?id=1nDrMukpljNk5pQ9NCSyfzaXPuIvl4rBJ" "Äiti, Petri ja Tiitta" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 24 "https://drive.google.com/thumbnail?id=1A_gV4isk3ONeDLnJiv_Yk7ry3s-13bsb" "Petri ja Tiitta Malmilla" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 25 "https://drive.google.com/thumbnail?id=1b19jQt8YqUCbFhuAZKsJqqW2n7bOYzI5" "Isä ja Tiitta tai Petri" && SUCCESS=$((SUCCESS+1))
        add_photo_rest 26 "https://drive.google.com/thumbnail?id=1_9SeYaRC16MEs-dzpeZK8fGhwGr5trJi" "Äiti, Petri ja Tiitta Jukan-Salpan takapihalla" && SUCCESS=$((SUCCESS+1))
        
        echo ""
        echo "════════════════════════════════════════"
        echo "✅ Lisätty: $((SUCCESS+1)) / 26"
        echo "════════════════════════════════════════"
    fi
else
    echo ""
    echo "❌ Testi epäonnistui"
fi
