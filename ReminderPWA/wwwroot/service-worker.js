// Service Worker for ReminderApp PWA
// Versio 1.0.0 - Automaattiset päivitykset ja offline-tuki

const CACHE_NAME = 'reminder-app-v1.0.4';
const API_CACHE_NAME = 'reminder-api-v1.0.4';

// Tiedostot jotka tallennetaan cache:een
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/swipe.js',
  '/js/audio.js',
  '/manifest.json',
  '/icon-192.png',
  '/audio/notification.mp3',
  '/_framework/blazor.webassembly.js'
];

// API endpointit joita tallennetaan väliaikaisesti
// Poistettu GAS-URL, jotta SW ei koskaan estä tuoreita API-vastauksia
const API_ENDPOINTS = [];

// Service Worker asennus
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        // Pakota päivitys heti
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker installation failed:', error);
      })
  );
});

// Service Worker aktivointi
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Poista vanhat cachet
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Ota kontrolli kaikista sivuista heti
      clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated successfully');
    })
  );
});

// Verkkopyyntöjen käsittely
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // API-kutsut: Verkko ensin, sitten cache
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
  }
  // Staattiset tiedostot: Cache ensin, sitten verkko
  else if (isStaticAsset(url)) {
    event.respondWith(handleStaticRequest(request));
  }
  // Muut pyynnöt: Verkko ensin
  else {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Jos verkko epäonnistuu, yritä cachesta
          return caches.match(request);
        })
    );
  }
});

// Tarkista onko API-pyyntö
function isApiRequest(url) {
  return API_ENDPOINTS.some(endpoint => url.href.includes(endpoint));
}

// Tarkista onko staattinen tiedosto
function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.pathname === asset) ||
         url.pathname.startsWith('/_framework/');
}

// Käsittele API-pyyntöjä
async function handleApiRequest(request) {
  const apiCache = await caches.open(API_CACHE_NAME);
  
  try {
    // Yritä hakea verkosta
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Tallenna onnistunut vastaus cacheen (max 5 min)
      const responseClone = networkResponse.clone();
      setTimeout(() => {
        apiCache.put(request, responseClone);
      }, 0);
      
      return networkResponse;
    }
  } catch (error) {
    console.log('🌐 Network failed for API request, trying cache...');
  }
  
  // Jos verkko epäonnistuu, yritä cachesta
  const cachedResponse = await apiCache.match(request);
  if (cachedResponse) {
    console.log('📦 Serving API response from cache');
    return cachedResponse;
  }
  
  // Jos ei cache:a, palauta virhe
  return new Response(JSON.stringify({
    error: 'Offline - no cached data available',
    status: 'OFFLINE'
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Käsittele staattisia tiedostoja
async function handleStaticRequest(request) {
  const staticCache = await caches.open(CACHE_NAME);
  
  // Yritä ensin cachesta
  const cachedResponse = await staticCache.match(request);
  if (cachedResponse) {
    // Hae verkosta taustalla päivityksiä varten
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        staticCache.put(request, networkResponse);
      }
    }).catch(() => {
      // Ei haittaa jos verkko epäonnistuu
    });
    
    return cachedResponse;
  }
  
  // Jos ei cachessa, hae verkosta
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      staticCache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Jos verkko epäonnistuu ja ei ole cachessa
    return new Response('Offline', { status: 503 });
  }
}

// Kuuntele viestejä pääsovellukselta
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🔄 Received SKIP_WAITING message');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME,
      timestamp: new Date().toISOString()
    });
  }
});

console.log('📱 ReminderApp Service Worker loaded successfully');