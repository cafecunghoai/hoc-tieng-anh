/* Service worker: chạy offline, tự cập nhật khi có bản mới */
const V = "hta-mwd7ppmp", FONT = "hta-font";
const CORE = ["./", "index.html", "css/style.css", "js/icons.js", "js/data-core.js", "js/data-a2.js", "js/data-b1.js", "js/data-b2.js", "js/data-c1.js", "js/writing.js", "js/grammar-a.js", "js/grammar-b.js", "js/exams.js", "js/grader.js", "js/app.js", "js/games.js", "js/study.js", "js/vendor/spell.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
// Giữ lại bộ nhớ phông chữ (tên cố định) qua các phiên bản, chỉ xóa bản app cũ
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== FONT).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const fromCache = (c, req) => c.match(req).then(hit => hit || c.match(req, { ignoreSearch: true })).then(hit => hit || c.match("index.html"));
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // Mạng trước để luôn có bản mới nhất; mạng chậm quá 3 giây hoặc mất mạng thì dùng bản đã lưu
    e.respondWith(caches.open(V).then(c => {
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }); net.catch(() => {});
      const slow = new Promise(res => setTimeout(res, 3000)).then(() => c.match(req).then(hit => hit || c.match(req, { ignoreSearch: true })).then(hit => hit || net));
      return Promise.race([net, slow]).catch(() => fromCache(c, req)).then(r => r || fromCache(c, req));
    }));
  } else if (/fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(caches.open(FONT).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { c.put(req, r.clone()); return r; }))));
  }
});
