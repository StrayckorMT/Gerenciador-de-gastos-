// ATENÇÃO: Sempre que você mudar qualquer coisa no HTML, CSS ou JS, 
// você DEVE mudar esse número (ex: v3, v4, v5...) para o app atualizar.
const CACHE_NAME = 'gastos-app-v01'; 

const urlsToCache = [
  './',
  './index.html',
  './pagina2.html',
  './style.css',
  './script.js',
  './pagina2.js',
  './manifest.json',
  './pagina3.html',
  './pagina3.js'
];

// 1. Instala e guarda os arquivos na memória
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  // Força o Service Worker a assumir o controle imediatamente
  self.skipWaiting(); 
});

// 2. A FAXINA: Apaga a memória antiga quando o CACHE_NAME muda
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Se o nome do cache for diferente do atual, apague-o
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); 
          }
        })
      );
    })
  );
  // Garante que a página já carregue a versão nova logo de cara
  self.clients.claim();
});

// 3. Busca da memória para funcionar offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Retorna da memória
        }
        return fetch(event.request); // Busca na internet se não tiver na memória
      })
  );
});
