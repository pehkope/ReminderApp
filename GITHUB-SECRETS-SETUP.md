# GitHub Secrets Setup for Automated Deployment

## Tarvittavat GitHub Secrets

Mene: https://github.com/pehkope/ReminderApp/settings/secrets/actions

### 1. AZURE_STATIC_WEB_APPS_API_TOKEN
**Kuvaus:** Static Web App deployment token  
**Arvo:**
```
a2a2c39ed118e07ffd59f66f748051181e191e0be3747c7d5851430872e6d71201-74c0ba42-c241-4a84-a1ea-03033267ace500326160dd372603
```

### 2. AZURE_FUNCTIONAPP_PUBLISH_PROFILE
**Kuvaus:** Function App publish profile (XML)  
**Arvo:** Katso tiedosto `function-publish-profile.xml` projektin juuressa

## Ohjeet GitHub Secretsin asettamiseen:

1. Avaa: https://github.com/pehkope/ReminderApp/settings/secrets/actions
2. Klikkaa: **New repository secret**
3. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
4. Secret: Kopioi yllä oleva token
5. Klikkaa: **Add secret**

6. Toista vaiheet 2-5, mutta:
   - Name: `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
   - Secret: Avaa `function-publish-profile.xml` ja kopioi KOKO sisältö

## Kun secretit on asetettu:

1. Git push käynnistää automaattisesti:
   - Static Web App deployment (PWA)
   - Function App deployment (Backend API)

2. Tarkista deployment status:
   - https://github.com/pehkope/ReminderApp/actions

## Azure Resurssit (westeurope, ReminderApp-RG):

- **Static Web App:** reminderapp-pwa
  - URL: https://proud-mushroom-0dd372603.1.azurestaticapps.net
  
- **Function App:** reminderapp-functions2025
  - URL: https://reminderapp-functions2025.azurewebsites.net
  
- **Storage:** reminderappstorage2025

- **CosmosDB:** reminderapp-cosmos2025 (serverless)

