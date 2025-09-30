#!/bin/bash
# Debug script to check Cosmos DB access

echo "🔍 Tarkistetaan Azure-resurssit..."
echo ""

echo "1️⃣ Näytetään kaikki subscriptionit:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
az account list --output table
echo ""

echo "2️⃣ Nykyinen aktiivinen subscription:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
az account show --output table
echo ""

echo "3️⃣ Etsitään 'ReminderApp' sisältävät subscriptionit:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
az account list --query "[?contains(name, 'Reminder')||contains(name, 'reminder')].[name, id, state]" --output table
echo ""

echo "4️⃣ Etsitään 'Enel' sisältävät subscriptionit:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
az account list --query "[?contains(name, 'Enel')||contains(name, 'enel')].[name, id, state]" --output table
echo ""

echo "5️⃣ Näytetään kaikki resource groupit:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
az group list --output table
echo ""

echo "6️⃣ Etsitään ReminderAppDB resource group:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
az group show --name ReminderAppDB --output table 2>&1
echo ""

echo "7️⃣ Etsitään Cosmos DB accountia:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
az cosmosdb list --output table
echo ""

echo "✅ Tarkistus valmis!"
echo ""
echo "📝 Kopioi yllä olevat tulokset ja lähetä chattiin niin korjaan scriptin."
