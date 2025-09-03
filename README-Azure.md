# ReminderApp Azure Functions

## 📋 Overview

This Azure Functions project provides the backend API for ReminderApp PWA, with weather integration and photo validation.

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+**
   ```bash
   node --version
   ```

2. **Azure Functions Core Tools**
   ```bash
   npm install -g azure-functions-core-tools@4 --unsafe-perm true
   ```

3. **Azure CLI** (for deployment)
   ```bash
   # Download from: https://aka.ms/installazurecliwindows
   az --version
   ```

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Edit `local.settings.json`:
   ```json
   {
     "WEATHER_API_KEY": "your-openweathermap-api-key",
     "GOOGLE_SHEETS_API_KEY": "your-google-sheets-api-key"
   }
   ```

3. **Start local development server**
   ```bash
   npm start
   # or
   func start
   ```

4. **Test the function**
   ```bash
   curl "http://localhost:7071/api/ReminderAPI?clientID=mom"
   ```

## 📁 Project Structure

```
ReminderApp/
├── azure-function-template.js    # Main function code
├── package.json                  # Dependencies
├── host.json                     # Function host config
├── local.settings.json           # Local environment
├── README-Azure.md              # This file
└── ReminderPWA/                 # Frontend application
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WEATHER_API_KEY` | OpenWeatherMap API key | Yes |
| `GOOGLE_SHEETS_API_KEY` | Google Sheets API key | Optional |
| `AzureWebJobsStorage` | Azure Storage connection | Auto |

### Function Configuration

The function handles:
- ✅ **GET requests** - Data fetching with weather
- ✅ **POST requests** - Task acknowledgments
- ✅ **OPTIONS requests** - CORS preflight
- ✅ **Timeout protection** - 5s API timeouts
- ✅ **Error handling** - Graceful error responses

## 🌐 API Endpoints

### GET /api/ReminderAPI
Fetch reminder data with weather information.

**Query Parameters:**
- `clientID` (optional): Client identifier (default: 'mom')
- `apiKey` (optional): API key for authentication

**Response:**
```json
{
  "status": "OK",
  "clientID": "mom",
  "tasks": [],
  "weather": {
    "description": "Sää tänään: pilvipouta, 15°C. Loistava päivä ulkoiluun! ☀️",
    "temperature": "15°C",
    "isRaining": false,
    "isCold": false,
    "isGoodForOutdoor": true
  },
  "dailyPhoto": {
    "url": "",
    "caption": "Päivän kuva - Azure versio tulossa"
  },
  "executionTime": 1250
}
```

### POST /api/ReminderAPI
Handle task acknowledgments.

**Request Body:**
```json
{
  "action": "acknowledgeTask",
  "clientID": "mom",
  "taskType": "medicine",
  "timeOfDay": "morning",
  "apiKey": "optional-key"
}
```

## 🚀 Deployment to Azure

### 1. Create Azure Resources

```bash
# Login to Azure
az login

# Create resource group
az group create --name ReminderAppRG --location northeurope

# Create storage account
az storage account create --name reminderappstorage --location northeurope --resource-group ReminderAppRG --sku Standard_LRS

# Create function app
az functionapp create --resource-group ReminderAppRG --consumption-plan-location northeurope --runtime node --runtime-version 18 --functions-version 4 --name reminderapp-functions --storage-account reminderappstorage
```

### 2. Configure Environment Variables

```bash
# Set weather API key
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderAppRG --setting WEATHER_API_KEY="your-api-key-here"
```

### 3. Deploy Function

```bash
# Deploy to Azure
func azure functionapp publish reminderapp-functions
```

### 4. Get Function URL

```bash
az functionapp function show --name reminderapp-functions --resource-group ReminderAppRG --function-name ReminderAPI --query invokeUrlTemplate
```

## 🔍 Monitoring & Troubleshooting

### View Logs

```bash
# Local logs
func start

# Azure logs
az functionapp logstream --name reminderapp-functions --resource-group ReminderAppRG
```

### Common Issues

**❌ Function timeout:**
- Check `API_TIMEOUT_MS` settings
- Monitor external API response times

**❌ Weather API errors:**
- Verify `WEATHER_API_KEY` is set
- Check API key validity

**❌ CORS errors:**
- Verify CORS settings in function configuration
- Check `Access-Control-Allow-Origin` headers

## 📊 Performance

- **Cold start**: ~1-3 seconds
- **Warm execution**: ~100-500ms
- **Memory usage**: ~50-100MB
- **Free tier**: 1M requests/month

## 🔒 Security

- **Anonymous authentication** (API key bypassed)
- **CORS protection** enabled
- **HTTPS only** in production
- **Environment variables** for secrets

## 🎯 Next Steps

1. **Add Azure Storage** for photo management
2. **Implement Azure Monitor** for logging
3. **Add Azure API Management** for advanced features
4. **Configure CI/CD** with GitHub Actions
5. **Add database integration** (Cosmos DB)

---

## 📞 Support

For issues with Azure Functions deployment:
1. Check function logs: `az functionapp logstream`
2. Verify configuration: `az functionapp config appsettings list`
3. Test locally first: `func start`

**Current Status**: Azure Functions template ready for deployment
