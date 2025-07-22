# 📱 ReminderApp Tablet - Alzheimer-ystävällinen muistuttajasovellus

**Täydellinen Blazor WebAssembly -pohjainen tablet-sovellus** Alzheimer-potilaille.

## ✨ Keskeiset ominaisuudet

- 🕐 **Suuri kello ja päivämäärä** - selkeä ajantaju
- 💬 **Text-to-Speech** - kuuntele muistutukset ääneen
- 📞 **Suorat soittopainikkeet** - helppo yhteydenpito
- 🆘 **Hätäpainike** - turvallisuus
- 📱 **PWA-tuki** - asennus tablettiin
- 🌤️ **Säätiedot** - älykäs päivän suunnittelu
- 📸 **Päivän kuva** - muistoja ja iloa

## 🎨 Alzheimer-ystävällinen suunnittelu

- ✅ **Suuret fontit** (24px+)
- ✅ **Korkea kontrasti** - tummansininen/vaalea keltainen
- ✅ **Yksinkertainen navigaatio** - ei piilotettuja valikoita
- ✅ **Suorat toiminnot** - yksi klikkaus = yksi toiminto

## 🚀 Pika-aloitus

```bash
git clone https://github.com/pehkope/ReminderApp.git
cd ReminderApp
dotnet restore
dotnet run
```

## 🔗 Yhdistäminen ReminderApp API:in

Muokkaa `Services/ReminderApiService.cs`:
```csharp
private const string API_BASE_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
```

Yhdistyy Google Apps Script ReminderApp_Test.js -backendin kanssa.

---
💝 **Tehty rakkaudella perhettä ajatellen**