const CACHE_NAME = "mis-finanzas-v2";

const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css?v=5",
    "./app.js?v=5",
    "./firebase.js?v=5",
    "./manifest.json",
    "./icons/icon-180.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/icon-512-maskable.png"
];

self.addEventListener("install", function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(APP_SHELL);
            })
    );

    self.skipWaiting();
});

self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys()
            .then(function(keys) {
                return Promise.all(
                    keys
                        .filter(function(key) {
                            return key !== CACHE_NAME;
                        })
                        .map(function(key) {
                            return caches.delete(key);
                        })
                );
            })
            .then(function() {
                return self.clients.claim();
            })
    );
});

self.addEventListener("fetch", function(event) {
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                if (
                    response &&
                    response.status === 200 &&
                    event.request.url.startsWith(self.location.origin)
                ) {
                    const copia = response.clone();

                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, copia);
                        });
                }

                return response;
            })
            .catch(function() {
                return caches.match(event.request)
                    .then(function(respuestaCache) {
                        return respuestaCache || caches.match("./index.html");
                    });
            })
    );
});
