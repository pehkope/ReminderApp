namespace ReminderTabletNew2.Models;

/// <summary>
/// Asiakaskohtainen konfiguraatio - sallii helposti uusien asiakkaiden lisäämisen
/// </summary>
public class ClientConfig
{
    public string ClientId { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string ApiEndpoint { get; set; } = "";
    public ClientSettings Settings { get; set; } = new();
    public Dictionary<string, string> CustomSettings { get; set; } = new();
}

/// <summary>
/// Asiakaskohtaiset asetukset
/// </summary>
public class ClientSettings
{
    // Viestit ja muistuttajat
    public ClientMessages Messages { get; set; } = new();
    
    // Ruokavalio ja ateriat  
    public ClientNutrition Nutrition { get; set; } = new();
    
    // Lääkitys
    public ClientMedication Medication { get; set; } = new();
    
    // Tapaamiset ja aktiviteetit
    public ClientSchedule Schedule { get; set; } = new();
    
    // Yhteystiedot
    public List<Contact> Contacts { get; set; } = new();
    
    // UI-asetukset
    public ClientUISettings UI { get; set; } = new();
}

/// <summary>
/// Asiakaskohtaiset viestit
/// </summary>
public class ClientMessages
{
    public string MorningGreeting { get; set; } = "Hyvää huomenta!";
    public string EveningGreeting { get; set; } = "Hyvää iltaa!";
    public string WeeklyPhotoCaption { get; set; } = "Viikon kuva 💕";
    public Dictionary<string, string> CustomMessages { get; set; } = new();
    public List<string> EncouragementMessages { get; set; } = new();
}

/// <summary>
/// Asiakaskohtainen ravitsemus
/// </summary>
public class ClientNutrition
{
    public List<MealSuggestion> PreferredMeals { get; set; } = new();
    public List<string> DietaryRestrictions { get; set; } = new();
    public List<string> FavoriteFoods { get; set; } = new();
    public string DefaultMealReminder { get; set; } = "Muista syödä!";
}

/// <summary>
/// Asiakaskohtainen lääkitys
/// </summary>
public class ClientMedication
{
    public List<Medication> DailyMedications { get; set; } = new();
    public string DefaultMedicationReminder { get; set; } = "Muista ottaa lääkkeet!";
    public string DoctorContact { get; set; } = "";
}

/// <summary>
/// Asiakaskohtainen aikataulu
/// </summary>
public class ClientSchedule
{
    public List<UpcomingAppointment> RecurringAppointments { get; set; } = new();
    public List<ActivitySuggestion> PreferredActivities { get; set; } = new();
    public string ExerciseVideoUrl { get; set; } = "";
}

/// <summary>
/// UI-asetukset asiakaskohtaisesti
/// </summary>
public class ClientUISettings
{
    public string PrimaryColor { get; set; } = "#667eea";
    public string SecondaryColor { get; set; } = "#764ba2";
    public string FontSize { get; set; } = "medium";
    public bool ShowWeather { get; set; } = true;
    public bool ShowPhoto { get; set; } = true;
    public bool EnableVoiceAlerts { get; set; } = true;
}

// Apuluokat
public class MealSuggestion
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string TimeOfDay { get; set; } = ""; // Aamu, Päivä, Ilta
    public List<string> Ingredients { get; set; } = new();
}

public class Medication
{
    public string Name { get; set; } = "";
    public string Dosage { get; set; } = "";
    public List<string> Times { get; set; } = new(); // "08:00", "12:00", "18:00"
    public string Instructions { get; set; } = "";
}

public class ActivitySuggestion  
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string TimeOfDay { get; set; } = "";
    public string VideoUrl { get; set; } = "";
    public int DurationMinutes { get; set; } = 0;
}