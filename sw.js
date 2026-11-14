/* Service worker: chạy offline, tự cập nhật khi có bản mới. build.js gắn ?v=<phiên bản> vào các tệp js/css trong CORE, khớp với index.html.
   r9: lưu sẵn cả 3 bộ chữ Be Vietnam Pro (vietnamese, latin, latin-ext: ký hiệu IPA ŋ ɪ ʃ ə) để chạy offline sau mỗi lần cập nhật. */
/* w1: bớt dung lượng lưu sẵn lần đầu: không lưu sẵn từ điển chính tả (js/vendor/spell.js, ~600 KB, chỉ bộ chấm bài viết dùng),
   phông chữ đậm 500/800 và các hình minh họa ngoài màn đầu: các tệp này được lưu khi dùng tới lần đầu (mạng trước, rồi giữ lại).
   Mã tải chậm (exams, grader, acts-data) vẫn lưu sẵn để học được khi mất mạng. */
const V = "hta-mwg2h9tv", FONT = "hta-font", META = "hta-meta";
const CORE = ["./", "index.html", "css/style.css?v=mwg2h9tv", "js/icons.js?v=mwg2h9tv", "js/data-core.js?v=mwg2h9tv", "js/data-a2.js?v=mwg2h9tv", "js/data-b1.js?v=mwg2h9tv", "js/data-b2.js?v=mwg2h9tv", "js/data-c1.js?v=mwg2h9tv", "js/writing.js?v=mwg2h9tv", "js/grammar-a.js?v=mwg2h9tv", "js/grammar-b.js?v=mwg2h9tv", "js/exams.js?v=mwg2h9tv", "js/grader.js?v=mwg2h9tv", "js/syn.js?v=mwg2h9tv", "js/app.js?v=mwg2h9tv", "js/games.js?v=mwg2h9tv", "js/study.js?v=mwg2h9tv", "js/acts-data.js?v=mwg2h9tv", "js/acts.js?v=mwg2h9tv", "js/teacher.js?v=mwg2h9tv", "js/extra.js?v=mwg2h9tv", "js/w1.js?v=mwg2h9tv", "manifest.webmanifest", "icons/icon-192.png"].concat([400, 600, 700].flatMap(w => ["vietnamese", "latin", "latin-ext"].map(b => `fonts/bvp-${b}-${w}.woff2`))).concat(["img/ill/chao-mung.webp","img/ill/chuc-mung.webp"]);
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
// Giữ lại bộ nhớ phông chữ (tên cố định) qua các phiên bản, chỉ xóa bản app cũ
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== FONT && k !== META).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
/* w1 review: tệp có số phiên bản (?v=) chỉ lấy đúng bản đó; không lấy nhầm tệp của phiên bản khác */
const fromCache = (c, req) => c.match(req).then(hit => hit || (/[?&]v=/.test(req.url) ? null : c.match(req, { ignoreSearch: true }))).then(hit => hit || (req.mode === "navigate" ? c.match("index.html") : null)).then(hit => hit || Response.error());
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
self.addEventListener("notificationclick", e => { e.notification.close(); const go = (e.notification.data && e.notification.data.url) || "./"; e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => { const c = cs.find(x => "focus" in x); if (!c) return self.clients.openWindow(go); return c.focus().then(w => (w || c).navigate && go !== "./" ? (w || c).navigate(new URL(go, self.registration.scope).href) : w); })); });
/* w1: nhắc thêm khi app đã cài trên Android (Periodic Background Sync, trình duyệt tự chọn lúc chạy, không chắc đúng giờ):
   sau 18 giờ mà hôm nay chưa học thì nhắc, mỗi ngày tối đa một lần. Trang ghi ngày học gần nhất vào bộ nhớ "hta-meta". */
const dk = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
self.addEventListener("periodicsync", e => {
  if (e.tag !== "hta-remind") return;
  e.waitUntil(caches.open(META).then(c => Promise.all([c.match("last-study").then(r => r ? r.json() : {}), c.match("last-notif").then(r => r ? r.text() : "")]).then(([m, ln]) => {
    const now = new Date(), td = dk(now);
    if (now.getHours() < 18 || (m && m.last === td) || ln === td) return;
    return c.put("last-notif", new Response(td)).then(() => self.registration.showNotification("Hôm nay mình chưa học", { body: "5 phút thôi: ôn 5 từ, nghe 1 câu.", icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag: "hta-remind", lang: "vi", data: { url: "./#q5" } }));
  })).catch(() => {}));
});
