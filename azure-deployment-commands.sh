#!/bin/bash

# Azure Functions Deployment Script for ReminderApp
# Location: Sweden Central
# Resource Group: ReminderApp_RG

echo "=== AZURE FUNCTIONS DEPLOYMENT COMMANDS ==="
echo "Location: Sweden Central"
echo "Resource Group: ReminderApp_RG"
echo ""

echo "# 1. Login to Azure"
echo "az login"
echo ""

echo "# 2. Create Resource Group"
echo "az group create --name ReminderApp_RG --location \"Sweden Central\""
echo ""

echo "# 3. Create Cosmos DB Account"
echo "az cosmosdb create --name reminderapp-cosmos --resource-group ReminderApp_RG --locations regionName=\"Sweden Central\" failoverPriority=0 --enable-free-tier true"
echo ""

echo "# 4. Create Database and Container"
echo "az cosmosdb sql database create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --name ReminderAppDB"
echo ""

echo "az cosmosdb sql container create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --database-name ReminderAppDB --name Configurations --partition-key-path \"/clientID\""
echo ""

echo "# 5. Create Storage Account"
echo "az storage account create --name reminderappstorage --location \"Sweden Central\" --resource-group ReminderApp_RG --sku Standard_LRS"
echo ""

echo "# 6. Create Function App"
echo "az functionapp create --resource-group ReminderApp_RG --consumption-plan-location \"Sweden Central\" --runtime node --runtime-version 18 --functions-version 4 --name reminderapp-functions --storage-account reminderappstorage"
echo ""

echo "# 7. Configure Environment Variables"
echo "# Get Cosmos DB connection details"
echo "COSMOS_ENDPOINT=\$(az cosmosdb show --name reminderapp-cosmos --resource-group ReminderApp_RG --query documentEndpoint --output tsv)"
echo "COSMOS_KEY=\$(az cosmosdb keys list --name reminderapp-cosmos --resource-group ReminderApp_RG --query primaryMasterKey --output tsv)"
echo ""

echo "# Set function app settings"
echo "az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_ENDPOINT=\"\$COSMOS_ENDPOINT\""
echo "az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_KEY=\"\$COSMOS_KEY\""
echo "az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_DATABASE=\"ReminderAppDB\""
echo "az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_CONTAINER=\"Configurations\""
echo ""

echo "# 8. Deploy Function Code"
echo "func azure functionapp publish reminderapp-functions"
echo ""

echo "# 9. Test the deployment"
echo "curl \"https://reminderapp-functions.azurewebsites.net/api/ReminderAPI?clientID=test\""
echo ""

echo "=== ONE-LINER SCRIPT (Copy and run in terminal) ==="
echo ""
echo "az login && \\"
echo "az group create --name ReminderApp_RG --location \"Sweden Central\" && \\"
echo "az cosmosdb create --name reminderapp-cosmos --resource-group ReminderApp_RG --locations regionName=\"Sweden Central\" failoverPriority=0 --enable-free-tier true && \\"
echo "az cosmosdb sql database create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --name ReminderAppDB && \\"
echo "az cosmosdb sql container create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --database-name ReminderAppDB --name Configurations --partition-key-path \"/clientID\" && \\"
echo "az storage account create --name reminderappstorage --location \"Sweden Central\" --resource-group ReminderApp_RG --sku Standard_LRS && \\"
echo "az functionapp create --resource-group ReminderApp_RG --consumption-plan-location \"Sweden Central\" --runtime node --runtime-version 18 --functions-version 4 --name reminderapp-functions --storage-account reminderappstorage && \\"
echo "COSMOS_ENDPOINT=\$(az cosmosdb show --name reminderapp-cosmos --resource-group ReminderApp_RG --query documentEndpoint --output tsv) && \\"
echo "COSMOS_KEY=\$(az cosmosdb keys list --name reminderapp-cosmos --resource-group ReminderApp_RG --query primaryMasterKey --output tsv) && \\"
echo "az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_ENDPOINT=\"\$COSMOS_ENDPOINT\" && \\"
echo "az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_KEY=\"\$COSMOS_KEY\" && \\"
echo "az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_DATABASE=\"ReminderAppDB\" && \\"
echo "az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_CONTAINER=\"Configurations\" && \\"
echo "echo \"Deployment complete! Function URL: https://reminderapp-functions.azurewebsites.net\""
