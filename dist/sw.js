"use strict";
const base = self.registration.scope;
const prefix = "svg-diagramm-generator:" + base + ":";
const cacheName = prefix + "4";
const files = [
  "./index.html", "./style.css", "./diagram.js", "./app.js", "./manifest.webmanifest",
  "./icons/diagramm.svg", "./icons/diagramm-180.png", "./icons/diagramm-192.png", "./icons/diagramm-512.png"
];
const assets = new Set(files.map(path => new URL(path, base).href));
const home = new URL("./index.html", base).href;

self.addEventListener("install", event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(
    [...assets].map(url => new Request(url, { cache: "reload" }))
  )));
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(prefix) && key !== cacheName) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const navigation = request.mode === "navigate";
  if (navigation) {
    url.search = "";
    if (url.href !== base && url.href !== home) return;
  } else if (!assets.has(url.href)) return;

  event.respondWith((async () => {
    try {
      return await fetch(request);
    } catch (error) {
      const cache = await caches.open(cacheName);
      const response = await cache.match(navigation ? home : request.url);
      if (response) return response;
      throw error;
    }
  })());
});
