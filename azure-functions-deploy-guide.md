# Azure Functions Deployment Guide

## 📋 Prerequisites

### 1. Install Azure Functions Core Tools
```bash
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

### 2. Install Azure CLI
```bash
# Windows
winget install Microsoft.AzureCLI

# Or download from: https://aka.ms/installazurecliwindows
```

### 3. Login to Azure
```bash
az login
```

---

## 🚀 Quick Start

### Step 1: Create Function App
```bash
# Create resource group (if needed)
az group create --name ReminderAppRG --location northeurope

# Create storage account
az storage account create --name reminderappstorage --location northeurope --resource-group ReminderAppRG --sku Standard_LRS

# Create function app
az functionapp create --resource-group ReminderAppRG --consumption-plan-location northeurope --runtime node --runtime-version 18 --functions-version 4 --name reminderapp-functions --storage-account reminderappstorage
```

### Step 2: Create Local Functions Project
```bash
# Create directory for functions
mkdir ReminderAppAzure
cd ReminderAppAzure

# Initialize function app
func init --javascript --model v4

# Create HTTP trigger function
func new --name ReminderAPI --template "HTTP trigger" --authlevel "anonymous"
```

### Step 3: Deploy to Azure
```bash
# Deploy to Azure
func azure functionapp publish reminderapp-functions
```

---

## 📁 Project Structure

```
ReminderAppAzure/
├── host.json
├── local.settings.json
├── package.json
└── ReminderAPI/
    ├── function.json
    └── index.js
```

---

## 🔧 Configuration Files

### host.json
```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "excludedTypes": "Request"
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  }
}
```

### local.settings.json
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "WEATHER_API_KEY": "your-openweathermap-key",
    "GOOGLE_SHEETS_API_KEY": "your-google-sheets-key"
  }
}
```

---

## ⚡ Quick Deployment Commands

```bash
# One-liner setup (requires Azure CLI login)
az group create --name ReminderAppRG --location northeurope
az storage account create --name reminderappstorage$RANDOM --location northeurope --resource-group ReminderAppRG --sku Standard_LRS
az functionapp create --resource-group ReminderAppRG --consumption-plan-location northeurope --runtime node --runtime-version 18 --functions-version 4 --name reminderapp-functions --storage-account reminderappstorage$RANDOM
```

---

## 🔍 Troubleshooting

### Function App Creation Issues
```bash
# Check if name is available
az functionapp list --query "[].name"

# Delete if needed
az functionapp delete --name reminderapp-functions --resource-group ReminderAppRG
```

### Deployment Issues
```bash
# Check function app logs
az functionapp logstream --name reminderapp-functions --resource-group ReminderAppRG

# Check deployment status
az functionapp deployment list-publishing-profiles --name reminderapp-functions --resource-group ReminderAppRG
```

---

## 📊 Cost Estimation

- **Free Tier**: 1M requests/month, 400k GB-s
- **Pay-as-you-go**: ~$0.20 per million requests
- **Storage**: ~$0.02 per GB/month

---

## 🔄 Migration Steps

1. ✅ **GAS version working** (current status)
2. 🔄 **Create Azure Functions project** (next)
3. 🔄 **Migrate GAS code to Node.js**
4. 🔄 **Configure Azure Storage**
5. 🔄 **Deploy and test**
6. 🔄 **Update PWA URLs**

**Current Status**: Ready for Azure Functions migration
