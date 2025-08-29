using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Net;
using Twilio.Jwt.AccessToken;

namespace GasProxyFunctions.Twilio;

public class TwilioTokenFunction
{
    private readonly IConfiguration _config;

    public TwilioTokenFunction(IConfiguration config)
    {
        _config = config;
    }

    [Function("TwilioToken")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Function, "get", Route = "twilio/token")] HttpRequestData req)
    {
        var accountSid = _config["TWILIO_ACCOUNT_SID"];
        var apiKey = _config["TWILIO_API_KEY_SID"];
        var apiSecret = _config["TWILIO_API_KEY_SECRET"];
        var voiceIdentity = req.Query["identity"].FirstOrDefault() ?? "mom";

        if (string.IsNullOrWhiteSpace(accountSid) || string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(apiSecret))
        {
            var bad = req.CreateResponse(HttpStatusCode.BadRequest);
            await bad.WriteStringAsync("Missing Twilio credentials");
            return bad;
        }

        var grant = new VoiceGrant
        {
            OutgoingApplicationSid = _config["TWILIO_TWIML_APP_SID"],
            IncomingAllow = true
        };

        var token = new Token(accountSid, apiKey, apiSecret, voiceIdentity, grants: new HashSet<IGrant> { grant });

        var ok = req.CreateResponse(HttpStatusCode.OK);
        await ok.WriteAsJsonAsync(new { token = token.ToJwt() });
        return ok;
    }
}
