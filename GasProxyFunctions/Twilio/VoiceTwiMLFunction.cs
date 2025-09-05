using System.Net;
using System.Text;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Twilio.TwiML;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.WebUtilities;
using Twilio.TwiML.Voice;

namespace GasProxyFunctions.Twilio;

public class VoiceTwiMLFunction
{
    private readonly IConfiguration _config;

    public VoiceTwiMLFunction(IConfiguration config)
    {
        _config = config;
    }

    [Function("TwilioVoiceTwiML")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = "twilio/voice")] HttpRequestData req)
    {
        var callerId = _config["TWILIO_CALLER_ID"] ?? string.Empty; // E.164 muoto, esim. +358...
        var parsed = QueryHelpers.ParseQuery(req.Url.Query);
        var to = parsed.TryGetValue("To", out var vals) ? vals.ToString() : string.Empty;

        var response = new VoiceResponse();

        if (!string.IsNullOrWhiteSpace(to))
        {
            var dial = new Dial(callerId: callerId);
            if (to.StartsWith("+") || to.Any(char.IsDigit))
            {
                dial.Number(to);
            }
            else
            {
                dial.Client(to);
            }
            response.Append(dial);
        }
        else
        {
            response.Say("No destination provided.");
        }

        var xml = response.ToString();
        var http = req.CreateResponse(HttpStatusCode.OK);
        http.Headers.Add("Content-Type", "application/xml; charset=utf-8");
        await http.WriteStringAsync(xml, Encoding.UTF8);
        return http;
    }
}
