# Azure Deployment Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Issue 1: PowerShell Script Won't Run

**Error:** `.\deploy-azure-simple.ps1 : File cannot be loaded because running scripts is disabled on this system`

**Solution:**
```powershell
# Run in PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or for all users (requires Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
```

### Issue 2: Azure CLI Not Found

**Error:** `'az' is not recognized as an internal or external command`

**Solutions:**

**Option A: Install Azure CLI**
```powershell
# Using winget (recommended)
winget install Microsoft.AzureCLI

# Or download MSI from https://aka.ms/installazurecliwindows
```

**Option B: Use Azure Cloud Shell**
1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Cloud Shell" (top right)
3. Use Bash or PowerShell in browser

### Issue 3: Azure Login Fails

**Error:** `Please run 'az login' to setup account.`

**Solution:**
```powershell
az login
# This opens browser for authentication
```

### Issue 4: Permission Denied

**Error:** `Access denied` or `Administrator privileges required`

**Solution:**
- Right-click PowerShell → "Run as Administrator"
- Or use Command Prompt as Administrator

### Issue 5: File Not Found

**Error:** `The system cannot find the file specified`

**Solution:**
```powershell
# Check current directory
pwd

# Navigate to correct folder
cd "C:\Users\ppehkonen\source\repos\ReminderApp"

# List files to verify
ls *.ps1
```

---

## 🛠️ Alternative Deployment Methods

### Method 1: Manual Commands (Safest)

Run each command individually in PowerShell:

```powershell
# 1. Login
az login

# 2. Create Resource Group
az group create --name ReminderApp_RG --location "Sweden Central"

# 3. Create Cosmos DB
az cosmosdb create --name reminderapp-cosmos --resource-group ReminderApp_RG --locations regionName="Sweden Central" failoverPriority=0 --enable-free-tier true

# 4. Create Database
az cosmosdb sql database create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --name ReminderAppDB

# 5. Create Container
az cosmosdb sql container create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --database-name ReminderAppDB --name Configurations --partition-key-path "/clientID"

# 6. Create Storage
az storage account create --name reminderappstorage --location "Sweden Central" --resource-group ReminderApp_RG --sku Standard_LRS

# 7. Create Function App
az functionapp create --resource-group ReminderApp_RG --consumption-plan-location "Sweden Central" --runtime node --runtime-version 18 --functions-version 4 --name reminderapp-functions --storage-account reminderappstorage

# 8. Get connection details
$cosmosEndpoint = az cosmosdb show --name reminderapp-cosmos --resource-group ReminderApp_RG --query documentEndpoint --output tsv
$cosmosKey = az cosmosdb keys list --name reminderapp-cosmos --resource-group ReminderApp_RG --query primaryMasterKey --output tsv

# 9. Configure settings
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_ENDPOINT="$cosmosEndpoint"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_KEY="$cosmosKey"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_DATABASE="ReminderAppDB"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_CONTAINER="Configurations"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting WEATHER_API_KEY="your-openweathermap-key"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting FUNCTIONS_WORKER_RUNTIME="node"
```

### Method 2: Azure Portal (Easiest)

1. **Go to [Azure Portal](https://portal.azure.com)**
2. **Create resources manually:**
   - Resource Group: `ReminderApp_RG` (Sweden Central)
   - Cosmos DB: `reminderapp-cosmos` (Core SQL, Free Tier)
   - Storage Account: `reminderappstorage` (Standard LRS)
   - Function App: `reminderapp-functions` (Node.js 18, Consumption)

### Method 3: Azure CLI in WSL/Linux

If you have WSL or Linux available:

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Run deployment
az login
az group create --name ReminderApp_RG --location "Sweden Central"
# ... continue with other commands
```

### Method 4: Visual Studio Code

1. Install Azure Tools extension in VS Code
2. Use Azure Functions extension to create resources
3. Deploy directly from VS Code

---

## 🔍 Diagnosis Steps

### Step 1: Check PowerShell Version
```powershell
$PSVersionTable.PSVersion
# Should be 5.1 or higher
```

### Step 2: Check Execution Policy
```powershell
Get-ExecutionPolicy -List
```

### Step 3: Check Azure CLI Installation
```powershell
az --version
```

### Step 4: Check Current Directory
```powershell
pwd
ls *.ps1
```

### Step 5: Test Basic Azure CLI
```powershell
az account list --output table
```

---

## 📞 Quick Fix Commands

### Fix 1: Enable Script Execution
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

### Fix 2: Reinstall Azure CLI
```powershell
winget uninstall Microsoft.AzureCLI
winget install Microsoft.AzureCLI
```

### Fix 3: Clear Azure Cache
```powershell
az account clear
az login
```

---

## 🎯 What to Do Next

1. **Run diagnosis commands** above to identify the issue
2. **Try Method 1** (Manual commands) if scripts don't work
3. **Use Azure Portal** if CLI issues persist
4. **Contact me** with the specific error message

**Most common issue is execution policy - try Fix 1 first!** 🔧

---

## 📞 Support

If you're still having issues:

1. **Copy the exact error message**
2. **Run the diagnosis commands**
3. **Tell me what method you're trying to use**

I'll help you get the deployment working! 🚀
