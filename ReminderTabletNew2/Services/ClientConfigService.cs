using ReminderTabletNew2.Models;

namespace ReminderTabletNew2.Services;

/// <summary>
/// Hallinnoi asiakaskohtaisia konfiguraatioita
/// Helpottaa uusien asiakkaiden lisäämistä
/// </summary>
public class ClientConfigService
{
    private readonly Dictionary<string, ClientConfig> _clientConfigs;
    private readonly AppConfig _appConfig;

    public ClientConfigService(AppConfig appConfig)
    {
        _appConfig = appConfig;
        _clientConfigs = new Dictionary<string, ClientConfig>();
        
        // Lataa esimääritetyt asiakaskonfiguraatiot
        LoadPredefinedClients();
    }

    /// <summary>
    /// Hae asiakaskonfiguraatio client ID:n perusteella
    /// </summary>
    public ClientConfig GetClientConfig(string clientId)
    {
        if (_clientConfigs.TryGetValue(clientId, out var config))
        {
            return config;
        }

        // Jos asiakasta ei löydy, palauta oletuskonfiguraatio
        Console.WriteLine($"⚠️ Client '{clientId}' not found, using default config");
        return GetDefaultClientConfig(clientId);
    }

    /// <summary>
    /// Hae kaikki asiakkaat
    /// </summary>
    public List<ClientConfig> GetAllClients()
    {
        return _clientConfigs.Values.ToList();
    }

    /// <summary>
    /// Lisää uusi asiakaskonfiguraatio
    /// </summary>
    public void AddClient(ClientConfig clientConfig)
    {
        _clientConfigs[clientConfig.ClientId] = clientConfig;
        Console.WriteLine($"✅ Added client configuration for: {clientConfig.DisplayName}");
    }

    /// <summary>
    /// Määrittele tunnetut asiakkaat
    /// </summary>
    private void LoadPredefinedClients()
    {
        // Asiakas 1: Äiti (mom)
        AddClient(CreateMomConfig());
        
        // Asiakas 2: Isä (dad) - esimerkki 
        AddClient(CreateDadConfig());
        
        // Asiakas 3: Isoäiti (grandma) - esimerkki
        AddClient(CreateGrandmaConfig());
    }

    /// <summary>
    /// Luo äidin konfiguraatio
    /// </summary>
    private ClientConfig CreateMomConfig()
    {
        return new ClientConfig
        {
            ClientId = "mom",
            DisplayName = "Äiti",
            ApiEndpoint = _appConfig.ApiSettings.BaseUrl,
            Settings = new ClientSettings
            {
                Messages = new ClientMessages
                {
                    MorningGreeting = "Rakas äiti, hyvää huomenta! ☀️",
                    EveningGreeting = "Hyvää iltaa, kultaseni! 🌙",
                    WeeklyPhotoCaption = "Tässä on viikon kuvamuisto sinulle 💕",
                    EncouragementMessages = new List<string>
                    {
                        "Olet mahtava! 💪",
                        "Pidä hyvää huolta itsestäsi! ❤️",
                        "Ajattelen sinua! 🥰"
                    }
                },
                Nutrition = new ClientNutrition
                {
                    PreferredMeals = new List<MealSuggestion>
                    {
                        new() { Name = "Kauraputro", Description = "Marjojen kanssa", TimeOfDay = "Aamu" },
                        new() { Name = "Kalalasagne", Description = "Salaatin kanssa", TimeOfDay = "Päivä" },
                        new() { Name = "Keitto", Description = "Lämmittävä keitto", TimeOfDay = "Ilta" }
                    },
                    DietaryRestrictions = new List<string> { "Vähän suolaa" },
                    DefaultMealReminder = "Lounas tai ainakin kunnon välipala ❤️"
                },
                Medication = new ClientMedication
                {
                    DefaultMedicationReminder = "Muista ottaa päivän lääkkeet 💊",
                    DoctorContact = "Lääkäri: 09-123-4567"
                },
                Schedule = new ClientSchedule
                {
                    PreferredActivities = new List<ActivitySuggestion>
                    {
                        new() { Name = "Kävelyretki", Description = "Meren rannalla", TimeOfDay = "Päivä", DurationMinutes = 30 },
                        new() { Name = "Tuolijumppa", Description = "Kevyt liikunta", TimeOfDay = "Aamu", DurationMinutes = 15 },
                        new() { Name = "Lukeminen", Description = "Hyvä kirja", TimeOfDay = "Ilta", DurationMinutes = 45 }
                    },
                    ExerciseVideoUrl = "https://www.youtube.com/watch?v=gentle-exercise-seniors"
                },
                Contacts = new List<Contact>
                {
                    new() { Name = "Tarja (tytär)", Phone = "+358401234567" },
                    new() { Name = "Päivi (sisar)", Phone = "+358501234567" },
                    new() { Name = "Lääkäri", Phone = "09-123-4567" }
                },
                UI = new ClientUISettings
                {
                    PrimaryColor = "#ff6b6b",
                    SecondaryColor = "#4ecdc4",
                    FontSize = "large",
                    ShowWeather = true,
                    ShowPhoto = true,
                    EnableVoiceAlerts = true
                }
            }
        };
    }

    /// <summary>
    /// Luo isän konfiguraatio (esimerkki)
    /// </summary>
    private ClientConfig CreateDadConfig()
    {
        return new ClientConfig
        {
            ClientId = "dad",
            DisplayName = "Isä",
            ApiEndpoint = _appConfig.ApiSettings.BaseUrl,
            Settings = new ClientSettings
            {
                Messages = new ClientMessages
                {
                    MorningGreeting = "Hyvää huomenta! ☕",
                    EveningGreeting = "Hyvää iltaa! 📺",
                    WeeklyPhotoCaption = "Viikon kuva 📸"
                },
                Nutrition = new ClientNutrition
                {
                    PreferredMeals = new List<MealSuggestion>
                    {
                        new() { Name = "Kahvi ja pulla", Description = "Perinteinen aamupala", TimeOfDay = "Aamu" },
                        new() { Name = "Lihapullat", Description = "Perunoiden kanssa", TimeOfDay = "Päivä" }
                    },
                    DefaultMealReminder = "Aika syödä! 🍽️"
                },
                UI = new ClientUISettings
                {
                    PrimaryColor = "#2196F3",
                    SecondaryColor = "#1976D2",
                    FontSize = "medium"
                }
            }
        };
    }

    /// <summary>
    /// Luo isoäidin konfiguraatio (esimerkki)
    /// </summary>
    private ClientConfig CreateGrandmaConfig()
    {
        return new ClientConfig
        {
            ClientId = "grandma",
            DisplayName = "Isoäiti",
            ApiEndpoint = _appConfig.ApiSettings.BaseUrl,
            Settings = new ClientSettings
            {
                Messages = new ClientMessages
                {
                    MorningGreeting = "Hyvää huomenta mummo! 🌸",
                    EveningGreeting = "Hyvää iltaa kulta! 🌺"
                },
                UI = new ClientUISettings
                {
                    PrimaryColor = "#E91E63",
                    SecondaryColor = "#AD1457",
                    FontSize = "extra-large"
                }
            }
        };
    }

    /// <summary>
    /// Luo oletuskonfiguraatio tuntemattomalle asiakkaalle
    /// </summary>
    private ClientConfig GetDefaultClientConfig(string clientId)
    {
        return new ClientConfig
        {
            ClientId = clientId,
            DisplayName = $"Asiakas {clientId}",
            ApiEndpoint = _appConfig.ApiSettings.BaseUrl,
            Settings = new ClientSettings
            {
                Messages = new ClientMessages
                {
                    MorningGreeting = "Hyvää huomenta!",
                    EveningGreeting = "Hyvää iltaa!"
                },
                UI = new ClientUISettings
                {
                    PrimaryColor = "#667eea",
                    SecondaryColor = "#764ba2",
                    FontSize = "medium"
                }
            }
        };
    }
}