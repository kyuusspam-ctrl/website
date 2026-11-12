const CACHE='memory-bookshelf-shell-v12';
const SHELL=['./','./index.html','./manifest.json','./styles/theme.css','./styles/room.css','./styles/book.css','./styles/editor.css','./styles/ambience.css','./js/app.js','./js/ambience.js','./js/data.js','./js/storage.js','./js/crypto.js','./js/sync.js','./js/config.js','./js/export.js','./js/photo-sort.js','./assets/icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(url.origin!==location.origin||url.pathname.includes('/storage/v1/object/')||request.method!=='GET')return;
 event.respondWith(
  fetch(request).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}
   return response;
  }).catch(()=>caches.match(request).then(cached=>cached||caches.match('./index.html')))
 );
});
