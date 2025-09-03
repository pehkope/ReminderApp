# 🚀 Azure Functions Deployment - Quick Start

## 📋 Prerequisites

### 1. Azure Account
- [Free Azure Account](https://azure.microsoft.com/en-us/free/)
- Subscription with credit (or free trial)

### 2. Install Azure CLI
```powershell
# Run as Administrator
.\azure-cli-setup.ps1
```

### 3. Install Azure Functions Core Tools
```bash
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

---

## ⚡ Quick Deployment (3 Steps)

### Step 1: Run Setup Script
```powershell
# Run in PowerShell as Administrator
.\azure-deployment-commands.ps1
```

**This creates:**
- ✅ Resource Group: `ReminderApp_RG` (Sweden Central)
- ✅ Cosmos DB: `reminderapp-cosmos`
- ✅ Storage Account: `reminderappstorage`
- ✅ Function App: `reminderapp-functions`
- ✅ All configurations and settings

### Step 2: Deploy Code
```bash
# Deploy the Cosmos DB version
func azure functionapp publish reminderapp-functions
```

### Step 3: Test
```bash
curl "https://reminderapp-functions.azurewebsites.net/api/ReminderAPI?clientID=test"
```

---

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `azure-functions-cosmos-config.js` | Main function code with Cosmos DB |
| `package-cosmos.json` | Dependencies for Cosmos DB |
| `azure-deployment-commands.ps1` | PowerShell deployment script |
| `azure-cli-setup.ps1` | Azure CLI installation script |
| `cosmos-deployment-guide.md` | Complete deployment guide |

---

## 🔧 Manual Steps (Alternative)

If PowerShell script doesn't work:

### 1. Azure Portal
1. Go to [portal.azure.com](https://portal.azure.com)
2. Follow `azure-manual-setup.md` guide

### 2. Azure CLI Commands
```bash
az login
az group create --name ReminderApp_RG --location "Sweden Central"
az cosmosdb create --name reminderapp-cosmos --resource-group ReminderApp_RG --locations regionName="Sweden Central" failoverPriority=0 --enable-free-tier true
az functionapp create --resource-group ReminderApp_RG --consumption-plan-location "Sweden Central" --runtime node --runtime-version 18 --functions-version 4 --name reminderapp-functions --storage-account reminderappstorage
```

---

## 🌐 API Endpoints

After deployment, your API will be available at:
```
https://reminderapp-functions.azurewebsites.net/api/
```

### Main API
```
GET  /api/ReminderAPI?clientID={id}     # Get reminders + weather
POST /api/ReminderAPI                   # Handle acknowledgments
```

### Configuration API
```
GET    /api/config/{clientID}           # Get customer config
POST   /api/config/{clientID}           # Create customer config
PUT    /api/config/{clientID}           # Update customer config
```

---

## 💰 Cost Estimation

| Service | Free Tier | First 10 Customers |
|---------|-----------|-------------------|
| Cosmos DB | 400 RU/s free | ~$5/month |
| Functions | 1M requests free | ~$2/month |
| Storage | 5GB free | ~$0.50/month |
| **Total** | **Free** | **~$7.50/month** |

---

## 🎯 Next Steps

1. **Test the API** with different client IDs
2. **Create customer configurations** via `/api/config/` endpoints
3. **Update PWA** to use new Azure API URLs
4. **Add Azure Storage** for customer photos
5. **Implement billing** for paid features

---

## 🆘 Troubleshooting

### Function App Issues
```bash
# Check logs
az functionapp logstream --name reminderapp-functions --resource-group ReminderApp_RG

# Restart function app
az functionapp restart --name reminderapp-functions --resource-group ReminderApp_RG
```

### Cosmos DB Issues
```bash
# Check database
az cosmosdb sql database list --account-name reminderapp-cosmos --resource-group ReminderApp_RG

# Check containers
az cosmosdb sql container list --account-name reminderapp-cosmos --resource-group ReminderApp_RG --database-name ReminderAppDB
```

---

## 📞 Support

- **Issues with setup**: Check `cosmos-deployment-guide.md`
- **API problems**: Check function logs
- **Cosmos DB issues**: Check Data Explorer in Azure Portal

**Happy deploying! 🚀**
