using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.TwiML;
using Twilio.TwiML.Voice;

namespace ReminderApp.Functions.Services;

public class TwilioService
{
    private readonly string? _accountSid;
    private readonly string? _authToken;
    private readonly string? _fromNumber;
    private readonly bool _isConfigured;

    public TwilioService()
    {
        _accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        _authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");
        _fromNumber = Environment.GetEnvironmentVariable("TWILIO_FROM_NUMBER");

        _isConfigured = !string.IsNullOrEmpty(_accountSid) && 
                       !string.IsNullOrEmpty(_authToken) && 
                       !string.IsNullOrEmpty(_fromNumber);

        if (_isConfigured)
        {
            TwilioClient.Init(_accountSid, _authToken);
        }
    }

    public bool IsConfigured => _isConfigured;

    /// <summary>
    /// Send SMS message in Finnish
    /// </summary>
    public async Task<bool> SendSmsAsync(string toNumber, string message, string? clientId = null)
    {
        if (!IsConfigured)
        {
            Console.WriteLine("Twilio SMS not configured");
            return false;
        }

        try
        {
            var messageResource = await MessageResource.CreateAsync(
                body: message,
                from: new Twilio.Types.PhoneNumber(_fromNumber!),
                to: new Twilio.Types.PhoneNumber(toNumber)
            );

            Console.WriteLine($"✅ SMS sent to {toNumber} (SID: {messageResource.Sid}) for client: {clientId}");
            return messageResource.Status != MessageResource.StatusEnum.Failed;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error sending SMS to {toNumber}: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Generate TwiML for voice calls with Finnish language support
    /// </summary>
    public string GenerateVoiceTwiML(string? clientId = null, string? customMessage = null)
    {
        var response = new VoiceResponse();

        // Default Finnish greeting
        var message = customMessage ?? GetDefaultVoiceMessage(clientId);

        response.Say(
            message: message,
            voice: Twilio.TwiML.Voice.Say.VoiceEnum.Alice,
            language: Twilio.TwiML.Voice.Say.LanguageEnum.FiFi
        );

        response.Pause(1);
        
        response.Say(
            message: "Kiitos soitosta. Hyvää päivää!",
            voice: Twilio.TwiML.Voice.Say.VoiceEnum.Alice,
            language: Twilio.TwiML.Voice.Say.LanguageEnum.FiFi
        );

        response.Hangup();

        return response.ToString();
    }

    /// <summary>
    /// Generate TwiML for SMS responses with Finnish language support
    /// </summary>
    public string GenerateSmsTwiML(string? incomingMessage = null, string? clientId = null)
    {
        var response = new MessagingResponse();

        var replyMessage = string.IsNullOrEmpty(incomingMessage) 
            ? "Kiitos viestistäsi! ReminderApp on vastaanottanut viestisi. Hoitaja saa tiedon pian."
            : $"Kiitos viestistäsi! ReminderApp on vastaanottanut viestisi: \"{incomingMessage}\". Hoitaja saa tiedon pian.";

        response.Message(replyMessage);

        return response.ToString();
    }

    /// <summary>
    /// Send emergency notification via SMS
    /// </summary>
    public async Task<bool> SendEmergencyNotificationAsync(string toNumber, string clientId, string? details = null)
    {
        if (!IsConfigured) return false;

        var message = $"🚨 HÄTÄILMOITUS ReminderApp:ista!\n\n" +
                     $"Asiakas: {clientId}\n" +
                     $"Aika: {DateTime.Now:dd.MM.yyyy HH:mm}\n" +
                     $"Tiedot: {details ?? "Hätäpainike painettu"}\n\n" +
                     $"Ota yhteyttä asiakkaaseen välittömästi!";

        return await SendSmsAsync(toNumber, message, clientId);
    }

    /// <summary>
    /// Send medication reminder via SMS
    /// </summary>
    public async Task<bool> SendMedicationReminderAsync(string toNumber, string medicationName, string dosage, string clientId)
    {
        if (!IsConfigured) return false;

        var message = $"💊 Lääkemuistutus ReminderApp:ista\n\n" +
                     $"Aika ottaa: {medicationName}\n" +
                     $"Annos: {dosage}\n" +
                     $"Aika: {DateTime.Now:HH:mm}\n\n" +
                     $"Muista juoda vettä lääkkeen kanssa! 💧";

        return await SendSmsAsync(toNumber, message, clientId);
    }

    /// <summary>
    /// Send appointment reminder via SMS
    /// </summary>
    public async Task<bool> SendAppointmentReminderAsync(string toNumber, string appointmentTitle, DateTime appointmentTime, string clientId)
    {
        if (!IsConfigured) return false;

        var timeUntil = appointmentTime - DateTime.Now;
        var timeString = timeUntil.TotalHours < 2 
            ? $"{(int)timeUntil.TotalMinutes} minuutin kuluttua"
            : $"{(int)timeUntil.TotalHours} tunnin kuluttua";

        var message = $"📅 Tapaaminen tulossa!\n\n" +
                     $"Mitä: {appointmentTitle}\n" +
                     $"Milloin: {appointmentTime:dd.MM.yyyy HH:mm}\n" +
                     $"Aikaa jäljellä: {timeString}\n\n" +
                     $"Muista valmistautua ajoissa! 🚗";

        return await SendSmsAsync(toNumber, message, clientId);
    }

    private static string GetDefaultVoiceMessage(string? clientId)
    {
        return clientId?.ToLower() switch
        {
            "mom" => "Hei kultaseni! Tämä on ReminderApp automaattinen vastaus. " +
                    "Soittosi on vastaanotettu. Jos tarvitset apua, ota yhteyttä hoitajaan.",
            _ => "Hei! Tämä on ReminderApp automaattinen vastaus. " +
                "Soittosi on vastaanotettu. Jos tarvitset apua, ota yhteyttä hoitajaan."
        };
    }
}
