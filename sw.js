/* Service worker: chạy offline, tự cập nhật khi có bản mới. build.js gắn ?v=<phiên bản> vào các tệp js/css trong CORE, khớp với index.html */
const V = "hta-mweuh75v", FONT = "hta-font";
const CORE = ["./", "index.html", "css/style.css?v=mweuh75v", "js/icons.js?v=mweuh75v", "js/data-core.js?v=mweuh75v", "js/data-a2.js?v=mweuh75v", "js/data-b1.js?v=mweuh75v", "js/data-b2.js?v=mweuh75v", "js/data-c1.js?v=mweuh75v", "js/writing.js?v=mweuh75v", "js/grammar-a.js?v=mweuh75v", "js/grammar-b.js?v=mweuh75v", "js/exams.js?v=mweuh75v", "js/grader.js?v=mweuh75v", "js/syn.js?v=mweuh75v", "js/app.js?v=mweuh75v", "js/games.js?v=mweuh75v", "js/study.js?v=mweuh75v", "js/acts-data.js?v=mweuh75v", "js/acts.js?v=mweuh75v", "js/teacher.js?v=mweuh75v", "js/extra.js?v=mweuh75v", "js/vendor/spell.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];
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
      // tệp có số phiên bản (?v=...): chỉ dùng đúng bản đó, không lấy tệp của phiên bản khác (tránh trộn mã cũ và mới)
      const slow = new Promise(res => setTimeout(res, 3000)).then(() => c.match(req).then(hit => hit || (url.search ? net : c.match(req, { ignoreSearch: true }).then(h => h || net))));
      return Promise.race([net, slow]).catch(() => fromCache(c, req)).then(r => r || fromCache(c, req));
    }));
  } else if (/fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(caches.open(FONT).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { c.put(req, r.clone()); return r; }))));
  }
});
// Bấm vào thông báo nhắc học của cô chủ nhiệm: mở lại cửa sổ app đang có, chưa có thì mở app
self.addEventListener("notificationclick", e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => { const c = cs.find(x => "focus" in x); return c ? c.focus() : self.clients.openWindow("./"); })); });
