window.twilioVoice = (function(){
  let device = null;
  async function getToken(tokenUrl, identity){
    const url = new URL(tokenUrl);
    if(identity){ url.searchParams.set('identity', identity); }
    const res = await fetch(url.toString(), { method: 'GET' });
    if(!res.ok){ throw new Error('Token fetch failed'); }
    const data = await res.json();
    return data.token;
  }
  async function init(tokenUrl, identity){
    const token = await getToken(tokenUrl, identity);
    device = new Twilio.Device(token, {codecPreferences: ['opus', 'pcmu']});
    return new Promise((resolve, reject) => {
      device.on('ready', () => resolve(true));
      device.on('error', (e) => reject(e));
    });
  }
  function call(to){
    if(!device){ throw new Error('Device not ready'); }
    return device.connect({ To: to });
  }
  function disconnect(){ if(device){ device.disconnectAll(); } }
  return { init, call, disconnect };
})();
