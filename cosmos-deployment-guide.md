# Cosmos DB Deployment Guide for Multi-Tenant ReminderApp

## 📋 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PWA Client    │────│ Azure Functions │────│  Cosmos DB      │
│  (per customer) │    │  (shared)       │    │ (per customer)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Azure Storage   │
                       │  (photos)       │
                       └─────────────────┘
```

## 🚀 Complete Deployment

### 1. Create Azure Resources

```bash
# Create resource group
az group create --name ReminderApp_RG --location "Sweden Central"

# Create Cosmos DB account
az cosmosdb create \
  --name reminderapp-cosmos \
  --resource-group ReminderApp_RG \
  --locations regionName="Sweden Central" failoverPriority=0 \
  --enable-free-tier true

# Create database and container
az cosmosdb sql database create \
  --account-name reminderapp-cosmos \
  --resource-group ReminderApp_RG \
  --name ReminderAppDB

az cosmosdb sql container create \
  --account-name reminderapp-cosmos \
  --resource-group ReminderApp_RG \
  --database-name ReminderAppDB \
  --name Configurations \
  --partition-key-path "/clientID"

# Create storage account for photos
az storage account create \
  --name reminderappstorage \
  --resource-group ReminderApp_RG \
  --location "Sweden Central" \
  --sku Standard_LRS \
  --allow-blob-public-access false

# Create function app
az functionapp create \
  --resource-group ReminderApp_RG \
  --consumption-plan-location "Sweden Central" \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name reminderapp-functions \
  --storage-account reminderappstorage
```

### 2. Configure Environment Variables

```bash
# Get Cosmos DB connection details
COSMOS_ENDPOINT=$(az cosmosdb show \
  --name reminderapp-cosmos \
  --resource-group ReminderApp_RG \
  --query documentEndpoint \
  --output tsv)

COSMOS_KEY=$(az cosmosdb keys list \
  --name reminderapp-cosmos \
  --resource-group ReminderApp_RG \
  --query primaryMasterKey \
  --output tsv)

# Set function app settings
az functionapp config appsettings set \
  --name reminderapp-functions \
  --resource-group ReminderApp_RG \
  --setting COSMOS_ENDPOINT="$COSMOS_ENDPOINT"

az functionapp config appsettings set \
  --name reminderapp-functions \
  --resource-group ReminderApp_RG \
  --setting COSMOS_KEY="$COSMOS_KEY"

az functionapp config appsettings set \
  --name reminderapp-functions \
  --resource-group ReminderApp_RG \
  --setting COSMOS_DATABASE="ReminderAppDB"

az functionapp config appsettings set \
  --name reminderapp-functions \
  --resource-group ReminderApp_RG \
  --setting COSMOS_CONTAINER="Configurations"
```

### 3. Deploy Function Code

```bash
# Copy the Cosmos DB version to main function file
cp azure-functions-cosmos-config.js azure-function-template.js

# Deploy to Azure
func azure functionapp publish reminderapp-functions
```

## 🔧 Configuration Management

### Create Customer Configuration

```bash
# Example: Create configuration for customer "clinic1"
curl -X POST "https://reminderapp-functions.azurewebsites.net/api/config/clinic1" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "useWeather": true,
      "usePhotos": true,
      "useTelegram": true,
      "language": "fi"
    },
    "weather": {
      "apiKey": "customer-specific-weather-key",
      "location": "Helsinki"
    },
    "telegram": {
      "botToken": "customer-telegram-token",
      "chatIds": ["123456789"]
    }
  }'
```

### Get Customer Configuration

```bash
curl "https://reminderapp-functions.azurewebsites.net/api/config/clinic1"
```

### Update Customer Configuration

```bash
curl -X PUT "https://reminderapp-functions.azurewebsites.net/api/config/clinic1" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "usePhotos": false
    }
  }'
```

## 📊 Database Schema

### Configurations Container

```json
{
  "id": "auto-generated",
  "clientID": "clinic1",
  "settings": {
    "useWeather": true,
    "usePhotos": true,
    "useTelegram": false,
    "useSMS": false,
    "timezone": "Europe/Helsinki",
    "language": "fi"
  },
  "weather": {
    "apiKey": "",
    "location": "Helsinki",
    "units": "metric"
  },
  "photos": {
    "source": "azure-storage",
    "azureStorage": {
      "accountName": "clinic1storage",
      "containerName": "photos",
      "sasToken": "..."
    }
  },
  "telegram": {
    "botToken": "",
    "chatIds": []
  },
  "sms": {
    "twilioSid": "",
    "twilioToken": "",
    "fromNumber": "",
    "enabledNumbers": []
  },
  "schedules": {
    "morning": [],
    "afternoon": [],
    "evening": [],
    "night": []
  },
  "notifications": {
    "enabled": true,
    "reminderTime": 15,
    "retryCount": 3,
    "retryInterval": 5
  },
  "created": "2024-01-01T00:00:00.000Z",
  "updated": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## 🌐 API Endpoints

### Customer API
```
GET  /api/ReminderAPI?clientID={id}     # Get customer data
POST /api/ReminderAPI                    # Handle acknowledgments
```

### Configuration API
```
GET    /api/config/{clientID}           # Get configuration
POST   /api/config/{clientID}           # Create configuration
PUT    /api/config/{clientID}           # Update configuration
```

## 🔒 Security & Multi-tenancy

### Row-Level Security
- Each customer can only access their own configuration
- Partitioned by `clientID` for optimal performance
- No cross-customer data leakage

### API Security
- Function-level authentication via Azure AD
- Customer-specific API keys stored in Cosmos DB
- Request validation and rate limiting

## 📈 Scaling Strategy

### Horizontal Scaling
- Azure Functions auto-scale based on load
- Cosmos DB handles multiple concurrent customers
- Storage accounts per customer for isolation

### Cost Optimization
- Consumption plan: pay only for actual usage
- Free tier available for development
- RU/s optimization for Cosmos DB queries

## 🔍 Monitoring & Troubleshooting

### Application Insights
```bash
# Enable Application Insights
az monitor app-insights component create \
  --app reminderapp-insights \
  --location "Sweden Central" \
  --resource-group ReminderApp_RG
```

### View Logs
```bash
# Function logs
az functionapp logstream --name reminderapp-functions --resource-group ReminderApp_RG

# Cosmos DB metrics
az monitor metrics list \
  --resource /subscriptions/.../reminderapp-cosmos \
  --metric "TotalRequests"
```

## 🎯 Migration Path

### Phase 1: Foundation (Current)
- ✅ Cosmos DB setup
- ✅ Function App deployment
- ✅ Basic configuration management

### Phase 2: Customer Onboarding
- 🔄 Customer portal for self-configuration
- 🔄 Automated customer setup process
- 🔄 Billing integration

### Phase 3: Advanced Features
- 🔄 Azure Storage integration for photos
- 🔄 Azure Monitor dashboards
- 🔄 Azure API Management

---

## 💰 Cost Estimation

| Service | Free Tier | Pay-as-you-go |
|---------|-----------|---------------|
| Functions | 1M requests | $0.20/1M requests |
| Cosmos DB | 400 RU/s | $0.008/hour per 100 RU/s |
| Storage | 5GB | $0.02/GB/month |
| **Total/month** | **Free** | **~$10-50** |

**Perfect for SaaS business model!** 🚀
