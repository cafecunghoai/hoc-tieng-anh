/* Địa chỉ cũ của "Tiếng Anh Từ Số 0" (cafecunghoai.github.io/hoc-tieng-anh/): app đã chuyển sang https://tienganhtuso0.pages.dev/
   Service worker này thay bản cũ (cùng đường dẫn, cùng phạm vi): xóa toàn bộ bộ nhớ đệm của app cũ, tải lại mọi cửa sổ đang mở
   để chúng rời bản app cũ, và từ đó chỉ lấy từ mạng (không lưu gì). Phiên bản: moved-2026-11-16 */
const MOVED = "moved-2026-11-16";
self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    // Bộ nhớ đệm dùng chung cho cả tên miền cafecunghoai.github.io: chỉ xóa của app này (hta-<phiên bản>, hta-font, hta-meta)
    try { const ks = await caches.keys(); await Promise.all(ks.filter(k => /^hta/.test(k)).map(k => caches.delete(k))); } catch (err) {}
    try { await self.clients.claim(); } catch (err) {}
    try {
      // Không chờ tải lại xong: trang chỉ tải được khi service worker này đã kích hoạt xong (chờ ở đây sẽ kẹt mãi)
      const cs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      cs.forEach(c => { try { if (c.navigate) c.navigate(c.url).catch(() => {}); } catch (err) {} });
    } catch (err) {}
  })());
});
const PAGE = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ứng dụng đã chuyển sang địa chỉ mới</title><style>body{margin:0;background:#F5F2EA;color:#1d2a26;font:16px/1.55 system-ui,sans-serif;text-align:center}main{max-width:420px;margin:0 auto;padding:40px 18px}h1{font-size:22px}a{display:block;margin-top:20px;padding:16px;border-radius:16px;background:#0C7F67;color:#fff;font-weight:700;text-decoration:none}</style></head><body><main><h1>Ứng dụng đã chuyển sang địa chỉ&nbsp;mới</h1><p>Máy đang mất mạng. Khi có mạng, hãy mở <b>tienganhtuso0.pages.dev</b> để học&nbsp;tiếp.</p><a href="https://tienganhtuso0.pages.dev/">Mở ứng dụng ở địa chỉ&nbsp;mới</a></main></body></html>`;
// Chỉ lấy từ mạng, không lưu. Mất mạng khi mở trang: hiện trang báo chuyển địa chỉ (không bao giờ hiện lại app cũ).
self.addEventListener("fetch", e => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => new Response(PAGE, { headers: { "Content-Type": "text/html; charset=utf-8" } })));
});
