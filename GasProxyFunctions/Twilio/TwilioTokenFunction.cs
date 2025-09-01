using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Net;
using Twilio.Jwt.AccessToken;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.WebUtilities;

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
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "twilio/token")] HttpRequestData req)
    {
        var accountSid = _config["TWILIO_ACCOUNT_SID"];
        var apiKey = _config["TWILIO_API_KEY_SID"];
        var apiSecret = _config["TWILIO_API_KEY_SECRET"];
        var parsed = QueryHelpers.ParseQuery(req.Url.Query);
        var voiceIdentity = parsed.TryGetValue("identity", out var identityVals) ? identityVals.ToString() : "mom";
        var allowedOrigins = _config["ALLOWED_ORIGINS"] ?? "*";

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
        ok.Headers.Add("Access-Control-Allow-Origin", allowedOrigins);
        ok.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS");
        ok.Headers.Add("Access-Control-Allow-Headers", "Content-Type");
        ok.Headers.Add("Content-Type", "application/json; charset=utf-8");
        await ok.WriteStringAsync(System.Text.Json.JsonSerializer.Serialize(new { token = token.ToJwt() }), System.Text.Encoding.UTF8);
        return ok;
    }
}
