"use strict";
/* ================== Tính năng thêm (bản 9) ==================
   1. Học 5 phút        2. Huấn luyện phát âm + Luyện âm khó     3. Sổ từ của tôi
   4. Chuyển sang máy khác (liên kết nén + mã QR tự vẽ)         5. Cỡ chữ, tốc độ đọc, ẩn phụ đề
   6. Thi đua cả nhà (liên kết thách đấu, bảng thi đua)
   Không sửa app.js: các hàm của app được bọc lại (như acts.js, teacher.js). Trạng thái mới: S.myw, S.chal,
   S.settings.fz, S.settings.hideSub (thêm vào def() / sanitize() để merge() giữ lại). Nút bấm gọi XTRA.* */
var XTRA = window.XTRA = (() => {
  const X = {};
  const obj = v => v && typeof v === "object" && !Array.isArray(v);
  const num = (v, df, lo, hi) => { v = +v; return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : df; };
  const str = (v, n) => String(v == null ? "" : v).slice(0, n || 80);
  const tok = t => String(t || "").toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9' -]/g, " ").replace(/\s+/g, " ").trim();
  const fmtT = ms => { const s = Math.max(1, Math.round(ms / 1000)), m = Math.floor(s / 60), r = s % 60; return m ? `${m}&nbsp;phút ${String(r).padStart(2, "0")}&nbsp;giây` : `${r}&nbsp;giây`; };
  const BASE = /^https?:$/.test(location.protocol) ? location.origin + location.pathname : "https://cafecunghoai.github.io/hoc-tieng-anh/";
  /* mã lời thách = seed.toString(36): chỉ chữ thường và số. Mọi mã đọc từ liên kết / bản lưu phải qua okId trước khi dùng */
  const okId = v => typeof v === "string" && /^[a-z0-9]{1,12}$/.test(v);
  const okDev = v => typeof v === "string" && /^[a-z0-9]{4,16}$/.test(v);
  /* mã riêng của nơi lưu này (máy / trình duyệt): không đi theo liên kết hay tệp sao lưu sang máy khác */
  const MYDEV = (() => { let d = ""; try { d = localStorage.getItem("hta_dev") || ""; if (!okDev(d)) { d = "d" + Math.random().toString(36).slice(2, 12); localStorage.setItem("hta_dev", d); } } catch (e) { d = "d" + Math.random().toString(36).slice(2, 12); } return d; })();
  const isStandalone = () => { try { return !!(navigator.standalone || (window.matchMedia && matchMedia("(display-mode: standalone)").matches)); } catch (e) { return false; } };
  const inAppUA = () => { const u = navigator.userAgent || ""; return /Zalo/i.test(u) ? "Zalo" : /FBAN|FBAV|FB_IAB|Messenger/i.test(u) ? "Facebook" : /Instagram/i.test(u) ? "Instagram" : /\bLine\//i.test(u) ? "Line" : ""; };
  const iosDevice = () => typeof isIOSDev === "function" ? isIOSDev() : /iP(hone|ad|od)/.test(navigator.userAgent || "");

  /* ================= Trạng thái ================= */
  const FZ = [["s", "Nhỏ"], ["m", "Vừa"], ["l", "Lớn"], ["xl", "Rất lớn"]];
  function sanMyw(a) {
    const seen = new Set();
    return (Array.isArray(a) ? a : []).filter(obj).map(x => ({ en: str(x.en, 60).replace(/\s+/g, " ").trim(), vi: str(x.vi, 120).trim(), note: str(x.note, 120).trim(), at: num(x.at, 0, 0, 9e15), app: x.app ? 1 : 0, mk: x.mk ? 1 : 0 }))
      .filter(x => x.en && x.vi && !seen.has(x.en.toLowerCase()) && seen.add(x.en.toLowerCase())).slice(-500);
  }
  /* câu hỏi thi đua: [từ, [phương án], chỉ số đáp án]; chỉ giữ chuỗi, cắt độ dài */
  const okQ = q => Array.isArray(q) && q.length >= 1 && q.length <= 10 && q.every(x => Array.isArray(x) && typeof x[0] === "string" && x[0].length <= 80 && Array.isArray(x[1]) && x[1].length >= 2 && x[1].length <= 6 && x[1].every(o => typeof o === "string" && o.length <= 160) && Number.isInteger(x[2]) && x[2] >= 0 && x[2] < x[1].length);
  const cleanQ = q => q.map(x => [x[0], x[1].slice(), x[2]]);
  function sanChal(c) {
    const o = { got: [], sent: [], xd: "", xn: 0 }; if (!obj(c)) return o;
    const res = r => obj(r) ? { sc: num(r.sc, 0, 0, 10) | 0, t: num(r.t, 0, 0, 36e5) | 0 } : null;
    // mục có mã không hợp lệ (ví dụ mã chứa dấu nháy, mã độc từ liên kết cũ) bị bỏ hẳn; lời thách chưa chơi phải có đủ câu hỏi hợp lệ
    o.got = (Array.isArray(c.got) ? c.got : []).filter(g => obj(g) && okId(g.id) && res(g.them)).slice(-20).map(g => ({ id: g.id, n: str(g.n, 40), st: num(g.st, 0, 0, 1e4) | 0, wx: num(g.wx, 0, 0, 1e7) | 0, at: num(g.at, 0, 0, 9e15), them: res(g.them), me: res(g.me), rep: g.rep ? 1 : 0, q: okQ(g.q) ? cleanQ(g.q) : [] }))
      .filter(g => g.rep || g.me || g.q.length);
    o.sent = (Array.isArray(c.sent) ? c.sent : []).filter(s => obj(s) && okId(s.id)).slice(-20).map(s => ({ id: s.id, at: num(s.at, 0, 0, 9e15), me: res(s.me) }));
    if (typeof c.xd === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c.xd)) { o.xd = c.xd; o.xn = num(c.xn, 0, 0, 99) | 0; }
    return o;
  }
  /* sổ XP theo từng máy: { mã máy khác: số XP máy đó tự học }, để gộp hai máy không mất XP mà cũng không cộng trùng */
  function sanXpo(x) { const o = {}; if (!obj(x)) return o; Object.keys(x).filter(k => okDev(k) || k === "old").slice(0, 30).forEach(k => { o[k] = num(x[k], 0, 0, 1e9); }); return o; }
  function sanJournal(a) { return (Array.isArray(a) ? a : []).filter(j => obj(j) && typeof j.t === "string" && isFinite(+j.at)).map(j => ({ d: str(j.d, 10), at: +j.at, q: str(j.q, 300), t: str(j.t, 2000), sc: num(j.sc, 0, 0, 10) })).slice(-60); }
  /* từ tự thêm (không có trong từ điển của app) được ghi vào WMAP để thẻ ôn không bị migrateContent / mergeOther bỏ đi */
  function regMy(list) { (list || []).forEach(x => { if (!x.app && (!WMAP[x.en] || WMAP[x.en].my)) WMAP[x.en] = { en: x.en, vi: x.vi, lid: "", ipaUK: "", ipa: "", my: 1 }; }); }
  if (typeof def === "function") { const d0 = def; def = function () { const d = d0(); d.myw = []; d.chal = { got: [], sent: [], xd: "", xn: 0 }; d.xpo = {}; d.dev = ""; d.settings.fz = "m"; d.settings.hideSub = false; return d; }; }
  if (typeof sanitize === "function") {
    const s0 = sanitize;
    sanitize = function (d) {
      d.myw = sanMyw(d.myw); regMy(d.myw);
      if (d.journal !== undefined) d.journal = sanJournal(d.journal);
      const r = s0(d) || d;
      r.chal = sanChal(r.chal); r.xpo = sanXpo(r.xpo); r.dev = okDev(r.dev) ? r.dev : "";
      r.settings.fz = FZ.some(f => f[0] === r.settings.fz) ? r.settings.fz : "m"; r.settings.hideSub = !!r.settings.hideSub;
      return r;
    };
  }
  /* hai cửa sổ cùng mở (cùng một nơi lưu): gộp thêm Sổ từ, bảng thi đua, sổ XP của các máy khác */
  if (typeof mergeOther === "function") { const m0 = mergeOther; mergeOther = function (o) { m0(o); try { unionMyw(o.myw); unionChal(o.chal); const x = sanXpo(o.xpo); Object.keys(x).forEach(k => { if (k !== MYDEV) S.xpo[k] = Math.max(S.xpo[k] || 0, x[k]); }); } catch (e) {} }; }
  /* S được tải trước khi tệp này chạy (merge chưa biết S.myw, migrateContent đã bỏ thẻ của từ tự thêm): lấy lại từ bản lưu */
  (function recover() {
    let raw = null; try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
    S.myw = sanMyw(raw && raw.myw); regMy(S.myw); S.chal = sanChal(raw && raw.chal);
    S.xpo = sanXpo(raw && raw.xpo); delete S.xpo[MYDEV]; S.dev = MYDEV;
    if (Array.isArray(S.journal)) S.journal = sanJournal(S.journal);
    if (raw && obj(raw.cards)) S.myw.forEach(x => { const c = raw.cards[x.en]; if (!S.cards[x.en] && obj(c)) S.cards[x.en] = { vi: String(c.vi || x.vi), box: num(c.box, 0, 0, 7) | 0, due: num(c.due, Date.now(), 0, 9e15) }; });
    S.settings.fz = FZ.some(f => f[0] === S.settings.fz) ? S.settings.fz : "m"; S.settings.hideSub = !!S.settings.hideSub;
  })();
  function unionMyw(list) { const have = new Map(S.myw.map(x => [x.en.toLowerCase(), x])); sanMyw(list).forEach(x => { const h = have.get(x.en.toLowerCase()); if (!h) { S.myw.push(x); have.set(x.en.toLowerCase(), x); } else if (x.at > h.at) Object.assign(h, x); }); regMy(S.myw); }
  function unionChal(c) { c = sanChal(c); const g = new Map(S.chal.got.map(x => [x.id + (x.rep ? "r" : ""), x])); c.got.forEach(x => { const k = x.id + (x.rep ? "r" : ""), h = g.get(k); if (!h) S.chal.got.push(x); else if (!h.me && x.me) h.me = x.me; }); S.chal.got = S.chal.got.sort((a, b) => a.at - b.at).slice(-20);
    const s = new Set(S.chal.sent.map(x => x.id)); c.sent.forEach(x => { if (!s.has(x.id)) S.chal.sent.push(x); }); S.chal.sent = S.chal.sent.sort((a, b) => a.at - b.at).slice(-20);
    if (c.xd > (S.chal.xd || "")) { S.chal.xd = c.xd; S.chal.xn = c.xn; } else if (c.xd && c.xd === S.chal.xd) S.chal.xn = Math.max(S.chal.xn || 0, c.xn); }
  if (typeof save === "function") { const sv0 = save; save = function () { if (S) S.dev = MYDEV; return sv0.apply(this, arguments); }; }

  /* ================= 5. Cỡ chữ ================= */
  function applyFz() { const de = document.documentElement, f = S.settings.fz || "m"; if (f === "m") delete de.dataset.fz; else de.dataset.fz = f; }
  if (typeof applyTheme === "function") { const a0 = applyTheme; applyTheme = function () { a0.apply(this, arguments); applyFz(); }; }
  applyFz();
  X.setFz = f => { if (!FZ.some(x => x[0] === f)) return; S.settings.fz = f; save(); applyFz(); render(); setTimeout(() => { if (typeof relayoutAll === "function") relayoutAll(); }, 60); };

  /* ================= Nén dữ liệu cho liên kết ================= */
  const b64u = u8 => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const ub64u = s => { s = String(s).replace(/[^A-Za-z0-9_-]/g, "").replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  async function pipe(u8, T) {
    const cs = new T("deflate-raw"), w = cs.writable.getWriter(); w.write(u8).catch(() => {}); w.close().catch(() => {});
    const r = cs.readable.getReader(), parts = []; let n = 0;
    for (;;) { const { value, done } = await r.read(); if (done) break; parts.push(value); n += value.length; }
    const out = new Uint8Array(n); let o = 0; parts.forEach(p => { out.set(p, o); o += p.length; }); return out;
  }
  async function pack(o) { const u = new TextEncoder().encode(JSON.stringify(o)); if (window.CompressionStream) { try { return "1" + b64u(await pipe(u, CompressionStream)); } catch (e) {} } return "0" + b64u(u); }
  async function unpack(s) { s = String(s || ""); const t = s[0], u = ub64u(s.slice(1)); if (t === "1" && !window.DecompressionStream) throw new Error("old"); const j = t === "1" ? await pipe(u, DecompressionStream) : u; return JSON.parse(new TextDecoder().decode(j)); }
  X._pack = pack; X._unpack = unpack;

  /* ================= Mã QR (tự vẽ, không cần thư viện ngoài) =================
     Chế độ byte, mức sửa lỗi L, phiên bản 1–25, chọn mặt nạ theo điểm phạt chuẩn ISO 18004 (giản lược). */
  const QR = (() => {
    const ECW = [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30];
    const NBL = [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25];
    const MAXV = 25;
    const gmul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 255; };
    const raw = v => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const na = Math.floor(v / 7) + 2; r -= (25 * na - 10) * na - 55; if (v >= 7) r -= 36; } return r; };
    const cap = v => Math.floor(raw(v) / 8) - ECW[v] * NBL[v];
    function rsDiv(deg) { const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1; for (let i = 0; i < deg; i++) { for (let j = 0; j < deg; j++) { r[j] = gmul(r[j], root); if (j + 1 < deg) r[j] ^= r[j + 1]; } root = gmul(root, 2); } return r; }
    function rsRem(data, dv) { const r = dv.map(() => 0); data.forEach(b => { const f = b ^ r.shift(); r.push(0); dv.forEach((c, i) => r[i] ^= gmul(c, f)); }); return r; }
    const alignPos = v => { if (v === 1) return []; const na = Math.floor(v / 7) + 2, size = v * 4 + 17, step = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (na * 2 - 2)) * 2, r = [6]; for (let p = size - 7; r.length < na; p -= step) r.splice(1, 0, p); return r; };
    const maskF = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, x => x % 3 === 0, (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0, (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
    function make(text, fm) {
      const bytes = [...new TextEncoder().encode(text)]; let v = 1;
      for (; v <= MAXV; v++) if (4 + (v < 10 ? 8 : 16) + 8 * bytes.length <= cap(v) * 8) break;
      if (v > MAXV) return null;
      const bits = [], put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
      put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
      const cb = cap(v) * 8; put(0, Math.min(4, cb - bits.length)); put(0, (8 - bits.length % 8) % 8);
      for (let p = 0xEC; bits.length < cb; p ^= 0xEC ^ 0x11) put(p, 8);
      const data = []; for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => a * 2 + b, 0));
      // chia khối, thêm mã sửa lỗi, xen kẽ
      const nb = NBL[v], ec = ECW[v], rc = Math.floor(raw(v) / 8), ns = nb - rc % nb, sl = Math.floor(rc / nb), dv = rsDiv(ec), blocks = [];
      for (let i = 0, k = 0; i < nb; i++) { const d = data.slice(k, k + sl - ec + (i < ns ? 0 : 1)); k += d.length; const e = rsRem(d, dv); if (i < ns) d.push(0); blocks.push(d.concat(e)); }
      const cw = []; for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== sl - ec || j >= ns) cw.push(b[i]); });
      const n = v * 4 + 17, M = [...Array(n)].map(() => new Array(n).fill(false)), F = [...Array(n)].map(() => new Array(n).fill(false));
      const set = (x, y, d) => { M[y][x] = d; F[y][x] = true; };
      for (let i = 0; i < n; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
      [[3, 3], [n - 4, 3], [3, n - 4]].forEach(([cx, cy]) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy)); if (x >= 0 && x < n && y >= 0 && y < n) set(x, y, d !== 2 && d !== 4); } });
      const ap = alignPos(v), la = ap.length - 1;
      ap.forEach((ax, i) => ap.forEach((ay, j) => { if ((i === 0 && j === 0) || (i === 0 && j === la) || (i === la && j === 0)) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
      const fmt = m => { const d = (1 << 3) | m; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537); const b = ((d << 10) | r) ^ 0x5412, bit = i => ((b >>> i) & 1) === 1;
        for (let i = 0; i <= 5; i++) set(8, i, bit(i)); set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8)); for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
        for (let i = 0; i < 8; i++) set(n - 1 - i, 8, bit(i)); for (let i = 8; i < 15; i++) set(8, n - 15 + i, bit(i)); set(8, n - 8, true); };
      fmt(0);
      if (v >= 7) { let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25); const b = (v << 12) | r; for (let i = 0; i < 18; i++) { const d = ((b >>> i) & 1) === 1, a = n - 11 + i % 3, c = Math.floor(i / 3); set(a, c, d); set(c, a, d); } }
      let bi = 0; const tb = cw.length * 8;
      for (let right = n - 1; right >= 1; right -= 2) { if (right === 6) right = 5; for (let vt = 0; vt < n; vt++) for (let j = 0; j < 2; j++) { const x = right - j, up = ((right + 1) & 2) === 0, y = up ? n - 1 - vt : vt; if (!F[y][x] && bi < tb) { M[y][x] = ((cw[bi >>> 3] >>> (7 - (bi & 7))) & 1) === 1; bi++; } } }
      const flip = m => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!F[y][x] && maskF[m](x, y)) M[y][x] = !M[y][x]; };
      const pen = () => { let p = 0, dark = 0; const line = get => { let run = 1, q = 0; const seq = []; for (let i = 0; i < n; i++) { const c = get(i); seq.push(c ? 1 : 0); if (i && c === get(i - 1)) { run++; if (run === 5) q += 3; else if (run > 5) q++; } else run = 1; } const s = seq.join(""), pa = "10111010000", pb = "00001011101"; for (let i = s.indexOf(pa); i >= 0; i = s.indexOf(pa, i + 1)) q += 40; for (let i = s.indexOf(pb); i >= 0; i = s.indexOf(pb, i + 1)) q += 40; return q; };
        for (let k = 0; k < n; k++) { p += line(i => M[k][i]) + line(i => M[i][k]); }
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { if (M[y][x]) dark++; if (x < n - 1 && y < n - 1) { const c = M[y][x]; if (c === M[y][x + 1] && c === M[y + 1][x] && c === M[y + 1][x + 1]) p += 3; } }
        return p + (Math.ceil(Math.abs(dark * 20 - n * n * 10) / (n * n)) - 1) * 10; };
      let best = 0, bp = Infinity; for (let m = 0; m < 8; m++) { flip(m); fmt(m); const p = pen(); if (p < bp) { bp = p; best = m; } flip(m); }
      if (fm !== undefined) best = fm;
      flip(best); fmt(best);
      return { v, n, M, mask: best };
    }
    function svg(text) {
      const q = make(text); if (!q) return ""; const n = q.n, W = n + 8; let d = "";
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.M[y][x]) { let k = x; while (k + 1 < n && q.M[y][k + 1]) k++; d += `M${x + 4} ${y + 4}h${k - x + 1}v1h-${k - x + 1}z`; x = k; }
      return `<svg class="qrsvg" viewBox="0 0 ${W} ${W}" shape-rendering="crispEdges" role="img" aria-label="Mã QR"><rect width="${W}" height="${W}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
    }
    return { make, svg, maxBytes: cap(MAXV) - 3 };
  })();
  X.QR = QR;

  /* ================= Hộp chia sẻ liên kết: QR + Gửi (Zalo…) + Sao chép ================= */
  let SH = { url: "", title: "", text: "" };
  function shareBox(url, title, text, qrNote) {
    SH = { url, title, text };
    const qr = url.length <= QR.maxBytes ? QR.svg(url) : "";
    return `${qr ? `<div class="qrbox">${qr}</div><p class="sm muted c qrcap">${qrNote || "Mở camera trên máy kia, đưa vào mã này rồi bấm vào liên kết hiện ra."}</p>` : ""}
      ${navigator.share ? `<button class="btn primary full" onclick="XTRA.shareGo()"><i class="ti ti-send"></i> Gửi qua Zalo, tin nhắn…</button>` : ""}
      <button class="btn full${navigator.share ? "" : " primary"}" onclick="XTRA.copyGo()"><i class="ti ti-copy"></i> Sao chép liên kết</button>
      <input class="inp lnk" id="shlink" readonly value="${esc(url)}" aria-label="Liên kết" onfocus="this.select()">`;
  }
  X.shareGo = () => { if (!navigator.share) return X.copyGo(); navigator.share({ title: SH.title, text: SH.text, url: SH.url }).catch(() => {}); };
  X.copyGo = () => {
    const ok = () => toast("Đã chép liên kết.<br>Dán vào Zalo hoặc tin nhắn để gửi đi."), manual = () => { const i = $("#shlink"); if (i) { i.focus(); i.select(); try { if (document.execCommand("copy")) return ok(); } catch (e) {} } toast("Hãy tự chép liên kết trong ô bên dưới"); };
    try { navigator.clipboard.writeText(SH.url).then(ok, manual); } catch (e) { manual(); }
  };

  /* ================= 4. Chuyển sang máy khác ================= */
  const T0 = 1.6e12;
  function compact() {
    const o = JSON.parse(backupStr()); delete o._rev; delete o._wipe; o.dev = MYDEV;
    const c = {}; Object.keys(o.cards).forEach(k => { const x = o.cards[k], w = WMAP[k]; c[k] = w && w.vi === x.vi ? [x.box, Math.round(x.due - T0)] : [x.box, Math.round(x.due - T0), x.vi]; }); o.cards = c;
    const d = {}; Object.keys(o.done).forEach(k => { const x = o.done[k]; d[k] = [x.best, Math.round((x.at || 0) - T0)]; }); o.done = d;
    return { x: 1, s: o };
  }
  function expand(p) {
    if (obj(p) && +p.x > 1 && obj(p.s)) throw new Error("new");
    if (!obj(p) || p.x !== 1 || !obj(p.s)) throw new Error("bad");
    const o = p.s; (o.myw || []).forEach(m => { if (!m.app && !WMAP[m.en]) regMy([m]); });
    const c = {}; Object.keys(o.cards || {}).forEach(k => { const x = o.cards[k]; if (!Array.isArray(x)) return; c[k] = { vi: x[2] !== undefined ? x[2] : (WMAP[k] ? WMAP[k].vi : ""), box: x[0], due: x[1] + T0 }; }); o.cards = c;
    const d = {}; Object.keys(o.done || {}).forEach(k => { const x = o.done[k]; if (Array.isArray(x)) d[k] = { best: x[0], at: x[1] + T0 }; }); o.done = d;
    return o;
  }
  X._compact = compact; X._expand = expand;
  X.xferMake = async () => {
    const box = $("#xfer"); if (!box) return; box.innerHTML = `<p class="sm muted c">Đang tạo liên kết…</p>`;
    let s; try { s = await pack(compact()); } catch (e) { box.innerHTML = `<p class="err">Chưa tạo được liên kết. Hãy dùng “Tải tệp” ở mục Sao lưu bên dưới.</p>`; return; }
    const url = BASE + "#nhan=" + s, b = $("#xfer"); if (!b) return;
    if (url.length > 60000) { b.innerHTML = `<p class="sm">Tiến độ của bạn rất nhiều nên liên kết quá dài để gửi qua tin nhắn. Hãy tải tệp sao lưu rồi gửi tệp sang máy kia, sau đó mở mục <b>Khôi phục từ tệp</b>.</p><button class="btn primary full" onclick="exportFile()"><i class="ti ti-download"></i> Tải tệp sao lưu</button>`; return; }
    b.innerHTML = (url.length > QR.maxBytes ? `<p class="sm muted">Tiến độ của bạn nhiều nên không vừa một mã QR. Hãy gửi liên kết qua Zalo cho chính mình, rồi mở tin nhắn đó trên máy kia.</p>` : "") +
      shareBox(url, "Chuyển tiến độ học tiếng Anh", "Liên kết chuyển tiến độ học “Tiếng Anh Từ Số 0” sang máy khác. Mở trên máy mới:") +
      `<p class="sm muted xnote">Liên kết chứa toàn bộ tiến độ của bạn.<br>Chỉ gửi cho chính mình.</p>`;
  };
  const sumOf = o => { const cards = Object.keys(o.cards || {}).length, done = Object.keys(o.done || {}).filter(k => obj(o.done[k]) && +o.done[k].best >= 80).length; return `<span class="nw">${done} bài đã xong</span> · <span class="nw">${cards} từ</span> · <span class="nw">${Math.round(num(o.xp, 0, 0, 1e9))} XP</span>`; };
  const isFresh = () => !Object.keys(S.done).length && !Object.keys(S.cards).length && !S.xp && !S.myw.length;
  function bigModal(title, body, btns) {
    const d = document.createElement("div"); d.className = "modal";
    d.innerHTML = `<div class="box"><h3>${title}</h3><div class="mbody">${body}</div><div class="stack">${btns.map((b, i) => `<button class="btn full ${b.cls || ""}" ${b.cancel ? 'id="mno"' : ""} data-i="${i}">${b.t}</button>`).join("")}</div></div>`;
    document.body.appendChild(d);
    d.querySelectorAll("button[data-i]").forEach(el => el.onclick = () => { d.remove(); const f = btns[+el.dataset.i].fn; if (f) f(); });
    if (typeof pushSub === "function") pushSub(); return d;
  }
  /* Gộp: lấy phần tốt hơn của cả hai máy (bài: điểm cao hơn, thẻ: hộp cao hơn / hạn xa hơn, ngày: số phút lớn hơn, XP: lớn hơn…) */
  /* XP khi gộp hai máy. XP là số cộng dồn, nên lấy số lớn hơn sẽ mất phần học riêng trên máy nhỏ hơn, còn cộng thẳng hai số
     thì gộp lại lần nữa (hoặc gửi ngược về) sẽ bị cộng trùng. Cách làm: mỗi bản tiến độ giữ sổ S.xpo = { mã máy: số XP máy đó tự học }
     cho các máy KHÁC; XP của chính máy này = S.xp − tổng sổ. Gộp = với mỗi máy khác lấy số lớn hơn giữa hai bên (XP của một máy chỉ tăng),
     rồi XP = phần của máy này + tổng sổ. Gộp cùng một liên kết hai lần cho đúng một kết quả; gộp A vào C rồi C vào A cũng không cộng trùng.
     Bản cũ không có mã máy được ghi vào ô "old". */
  const sumX = x => Object.keys(x).reduce((a, k) => a + x[k], 0);
  function xpLedger(inc, ownNow) {
    const mine = sanXpo(S.xpo); delete mine[MYDEV];
    const own = ownNow !== undefined ? ownNow : Math.max(0, S.xp - sumX(mine)), ox = sanXpo(inc.xpo), src = okDev(inc.dev) ? inc.dev : "old";
    const incOwn = Math.max(0, num(inc.xp, 0, 0, 1e9) - sumX(ox)), m = ownNow !== undefined ? {} : mine;
    Object.keys(ox).forEach(k => { if (k !== MYDEV) m[k] = Math.max(m[k] || 0, ox[k]); });
    if (src !== MYDEV) m[src] = Math.max(m[src] || 0, incOwn);
    return { xpo: m, own: ownNow !== undefined ? (src === MYDEV ? incOwn : (ox[MYDEV] || 0)) : own, xp: own + sumX(m) };
  }
  X._ledger = xpLedger;
  /* Thay thế hoàn toàn / khôi phục tệp: XP lấy đúng như bản được chọn, sổ XP ghi phần của máy kia dưới mã của máy kia */
  if (typeof restore === "function") { const r0 = restore; restore = function (x) {
    if (obj(x) && x.done) { try { const l = xpLedger(x, 0); x = Object.assign({}, x, { xpo: l.xpo, dev: MYDEV }); } catch (e) {} }
    return r0.call(this, x); }; }
  function fullMerge(inc) {
    const snap = JSON.stringify(S), xb = XPBASE;
    try { fullMerge0(inc); return true; }
    catch (e) { try { S = JSON.parse(snap); XPBASE = xb; regMy(S.myw); } catch (e2) {} toast("Chưa gộp được, liên kết bị lỗi.<br>Tiến độ trên máy này vẫn giữ nguyên.", 6000); return false; }
  }
  function fullMerge0(inc) {
    const o = merge(Object.assign({}, inc, { resume: null, mockOpen: null }));
    const x0 = S.xp, led = xpLedger(o);
    XPBASE = S.xp; mergeOther(o);
    S.xpo = led.xpo; S.xp = Math.max(x0, led.xp);
    Object.keys(o.mistakes).forEach(k => { const a = S.mistakes[k], b = o.mistakes[k]; if (!a) S.mistakes[k] = b; else { a.n = Math.max(a.n, b.n); a.at = Math.max(a.at || 0, b.at || 0); } });
    Object.keys(o.log).forEach(k => { const a = S.log[k] || (S.log[k] = { lessons: 0, xp: 0 }), b = o.log[k]; Object.keys(b).forEach(f => { if (typeof b[f] === "number" && !(f in a)) a[f] = b[f]; }); });
    S.game.post = Object.assign({}, o.game.post || {}, S.game.post || {}); if (o.game.gardenSeen) S.game.gardenSeen = Math.max(S.game.gardenSeen || 0, o.game.gardenSeen);
    Object.keys(o.game.best || {}).forEach(k => { if (S.game.best[k] === undefined) S.game.best[k] = o.game.best[k]; });
    if (Array.isArray(o.journal)) { const have = new Set((S.journal || []).map(j => j.at)); S.journal = (S.journal || []).concat(o.journal.filter(j => !have.has(j.at))).sort((a, b) => a.at - b.at).slice(-60); }
    if (o.teacher && (!S.teacher || !S.teacher.on)) S.teacher = o.teacher;
    else if (o.teacher && S.teacher && Array.isArray(o.teacher.ev)) { const have = new Set(S.teacher.ev.map(e => e.at + e.k)); S.teacher.ev = S.teacher.ev.concat(o.teacher.ev.filter(e => !have.has(e.at + e.k))).sort((a, b) => a.at - b.at).slice(-800); }
    if (S.placement === null && o.placement !== null) S.placement = o.placement; if (!S.placeStart && o.placeStart) S.placeStart = o.placeStart;
    if (S.cnt.gram !== undefined || o.cnt.gram !== undefined) S.cnt.gram = Math.max(S.cnt.gram || 0, o.cnt.gram || 0);
    unionMyw(o.myw); unionChal(o.chal);
    if (isFreshSettings()) S.settings = Object.assign({}, o.settings);
    S.onb = true; save();
  }
  let FRESH_SET = false; const isFreshSettings = () => FRESH_SET;
  X._fullMerge = fullMerge;
  /* chép một liên kết; không chép được thì hiện ô để người học tự bấm giữ và chép */
  function copyText(url, msg) {
    const manual = () => bigModal("Chép liên kết", `<p class="sm">Bấm giữ vào ô bên dưới, chọn <b>Chọn tất cả</b> rồi <b>Sao chép</b>.</p><input class="inp lnk" id="cplink" readonly value="${esc(url)}" aria-label="Liên kết" onfocus="this.select()">`, [{ t: "Xong", cls: "primary", cancel: 1 }]);
    try { navigator.clipboard.writeText(url).then(() => toast(msg, 9000), manual); } catch (e) { manual(); }
  }
  /* mở liên kết ở nơi không phải app đã cài (Zalo, Facebook, Safari trên iPhone): tiến độ sẽ vào nơi lưu khác */
  function wrongPlace(kind) {
    const ia = inAppUA(), ios = iosDevice() && !isStandalone();
    // lời thách: người nhận thường chưa cài app, cứ chơi ngay; chỉ nhắc khi đang ở trong trình duyệt của Zalo / Facebook
    if (kind === "duel") return ia ? `<div class="xwarn"><p><b>Bạn đang mở lời thách bên trong ${ia}.</b> Vẫn chơi được ngay ở đây, nhưng kết quả chỉ lưu trong ${ia}. Muốn giữ kết quả trên bảng thi đua: trong ${ia}, bấm dấu <b>•••</b> ở góc trên rồi chọn <b>Mở bằng trình duyệt</b>.</p></div>` : "";
    if (!ia && !ios) return "";
    const steps = `<ol class="steps3"><li>Bấm nút <b>Sao chép liên kết</b> bên dưới.</li><li>Mở app <b>Tiếng Anh Từ Số 0</b> bằng biểu tượng trên màn&nbsp;hình&nbsp;chính.</li><li>Vào <b>Hồ sơ</b>, kéo xuống mục <b>Chuyển sang máy khác</b>, dán vào ô <b>Dán liên kết</b>.</li></ol>`;
    if (ia) return `<div class="xwarn"><p><b>Bạn đang mở liên kết bên trong ${ia}.</b> Tiến độ nhận ở đây chỉ nằm trong ${ia}, không vào app học của bạn.</p>${steps}<p class="sm muted">Chưa cài app: trong ${ia}, bấm dấu <b>•••</b> ở góc trên rồi chọn <b>Mở bằng trình duyệt</b>.</p></div>`;
    return `<div class="xwarn"><p><b>Bạn đang mở trong Safari.</b> Nếu đã cài app lên màn hình chính, hãy nhận trong app: iPhone lưu tiến độ của app và của Safari ở hai nơi riêng, nhận ở Safari thì app vẫn&nbsp;trống.</p>${steps}<p class="sm muted">Chưa cài app thì cứ nhận ở đây.</p></div>`;
  }
  X._wrongPlace = wrongPlace;
  async function xferOpen(data) {
    data = String(data || "").replace(/[^A-Za-z0-9_-]/g, "");
    let o; try { o = expand(await unpack(data)); if (!obj(o.done)) throw 0; } catch (e) {
      const m = e && e.message;
      toast(m === "old" ? "Trình duyệt này cũ nên chưa mở được liên kết.<br>Hãy cập nhật iPhone (iOS 16.4 trở lên) hoặc dùng tệp sao lưu."
        : m === "new" ? "Liên kết được tạo từ bản app mới hơn.<br>Hãy kéo trang xuống để tải lại (cập nhật app), rồi mở lại liên kết."
        : "Liên kết bị hỏng hoặc bị cắt mất một phần.<br>Hãy tạo lại liên kết ở máy cũ.", 8000); return; }
    const nm = o.name ? ` của <b>${esc(str(o.name, 60))}</b>` : "", url = BASE + "#nhan=" + data, warn = wrongPlace("xfer");
    const done = msg => { nav("home"); toast(msg, 4000); };
    const cp = { t: '<i class="ti ti-copy"></i> Sao chép liên kết', cls: warn && inAppUA() ? "primary" : "", fn: () => copyText(url, "Đã chép liên kết.<br>Mở app, vào Hồ sơ › Chuyển sang máy khác rồi dán vào ô Dán liên kết.") };
    if (isFresh()) {
      bigModal("Nhận tiến độ từ máy khác?", `${warn}<p>Tiến độ${nm}: ${sumOf(o)}.</p><p class="sm muted">Máy này chưa có tiến độ nào, app sẽ chép nguyên tiến độ sang.</p>`, (warn && inAppUA() ? [cp] : []).concat([
        { t: '<i class="ti ti-download"></i> ' + (warn && inAppUA() ? `Vẫn nhận trong ${inAppUA()}` : "Nhận tiến độ"), cls: warn && inAppUA() ? "" : "primary", fn: () => { FRESH_SET = true; const r = fullMerge(o); FRESH_SET = false; if (r) done("Đã nhận tiến độ từ máy khác."); } }],
        warn && !inAppUA() ? [cp] : [], [{ t: "Không nhận", cancel: 1 }]));
      return;
    }
    const after = Math.round(xpLedger(o).xp);
    bigModal("Nhận tiến độ từ máy khác?", `${warn}<p><b>Trong liên kết:</b><br>${sumOf(o)}</p><p><b>Máy này:</b><br>${sumOf(S)}</p><p class="sm muted">Gộp: giữ phần tốt hơn của cả hai máy (điểm cao hơn, từ nhớ lâu hơn, số phút học nhiều hơn). XP được cộng phần học riêng trên mỗi máy, không tính trùng: sau khi gộp là <b class="nw">${Math.max(after, Math.round(S.xp))} XP</b>.<br>Thay thế: bỏ tiến độ của máy này, dùng đúng tiến độ trong liên kết.</p>`, (warn && inAppUA() ? [cp] : []).concat([
      { t: '<i class="ti ti-git-merge"></i> Gộp cả hai', cls: warn && inAppUA() ? "" : "primary", fn: () => { if (fullMerge(o)) done("Đã gộp tiến độ của hai máy."); } },
      { t: '<i class="ti ti-replace"></i> Thay thế hoàn toàn', fn: () => { bigModal("Thay thế toàn bộ?", "<p>Tiến độ hiện có trên máy này sẽ mất.<br>Không thể hoàn tác.</p>", [{ t: "Thay thế", cls: "dangerf", fn: () => { restore(o); toast("Đã thay bằng tiến độ từ máy khác.", 4000); } }, { t: "Giữ lại", cancel: 1 }]); } }],
      warn && !inAppUA() ? [cp] : [], [{ t: "Không nhận", cancel: 1 }]));
  }
  X._xferOpen = xferOpen;
  function clearHash() { try { history.replaceState(history.state, "", location.pathname + location.search); } catch (e) { location.hash = ""; } }
  X.checkHash = () => {
    const m = /^#(nhan|thach)=(.+)$/.exec(location.hash || ""); if (!m) return;
    clearHash(); if (P && P.kind === "mock") { toast("Hãy thi xong rồi mở lại liên kết."); return; }
    if (m[1] === "nhan") xferOpen(m[2]); else duelOpen(m[2]);
  };
  X.pasteGo = () => { const v = ($("#xpin") || {}).value || "", m = /#(nhan|thach)=([A-Za-z0-9_-]+)/.exec(v.replace(/\s+/g, "")); if (!m) { $("#xperr").textContent = "Liên kết không hợp lệ. Hãy chép lại cả liên kết."; return; } if (m[1] === "nhan") xferOpen(m[2]); else duelOpen(m[2]); };
  window.addEventListener("hashchange", () => X.checkHash());
  document.addEventListener("DOMContentLoaded", () => setTimeout(X.checkHash, 250));

  /* ================= Phương án nhiễu cùng trình độ =================
     Lấy trong bài của từ đó và hai bài liền kề (cùng chặng, cùng chủ đề: số với số, gia đình với gia đình), rồi các từ cùng chặng
     có nghĩa dài tương tự (chênh tối đa 1 tiếng), cuối cùng mới tới toàn bộ từ điển. Như vậy người mới học không đoán được
     đáp án chỉ vì ba phương án kia là từ C1 dài và lạ. */
  const stOf = w => (w && w.lid ? String(w.lid).split("-")[0] : "");
  const glen = v => String(v || "").split("; ")[0].trim().split(/\s+/).length;
  function poolFor(w) {
    const en = String(w.en).toLowerCase(), use = p => p.filter(x => x.en.toLowerCase() !== en && x.vi);
    if (w.lid && LES[w.lid]) {
      const i = ORDER.indexOf(w.lid), ids = [w.lid, ORDER[i - 1], ORDER[i + 1]].filter(id => id && LES[id] && LES[id].kind !== "letters" && stOf({ lid: id }) === stOf(w));
      const near = use(ids.flatMap(id => LES[id].W));
      if (new Set(near.map(x => x.vi.split("; ")[0])).size >= 10) return near;
    }
    const st = stOf(w), n = glen(w.vi), same = st ? use(ALLW.filter(x => stOf(x) === st)) : use(ALLW.filter(x => /^(s0|a1|a2)$/.test(stOf(x)))), sim = same.filter(x => Math.abs(glen(x.vi) - n) <= 1);
    return sim.length >= 12 ? sim : same.length >= 12 ? same : ALLW;
  }
  /* kèm các mục cùng từ ở bài khác (light = ánh sáng / nhẹ): mqMeaning dùng chúng để không lấy nghĩa khác của chính từ đó làm phương án sai */
  const poolW = w => { const en = String(w.en).toLowerCase(), p = poolFor(w); return p === ALLW ? p : p.concat(ALLW.filter(x => x.en.toLowerCase() === en)); };
  X._poolFor = poolFor;

  /* ================= 1. Học 5 phút ================= */
  const firstWordsLesson = () => { const n = typeof nextLesson === "function" && nextLesson(); if (n && LES[n].kind !== "letters" && LES[n].W.length) return LES[n]; return LES[ORDER.find(id => LES[id].kind !== "letters" && LES[id].S.length)]; };
  /* Học 5 phút chỉ mở khi đã học xong ít nhất một bài có từ vựng (không tính bài bảng chữ cái): người mới học bài đầu tiên trước */
  const quickReady = () => ORDER.some(id => S.done[id] && LES[id] && LES[id].kind !== "letters") || Object.keys(S.cards).length >= 5;
  X._quickReady = quickReady;
  X.quick = () => {
    if (!quickReady()) { toast("Hãy học xong bài đầu tiên có từ vựng.<br>Sau đó Học 5 phút sẽ mở để ôn lại."); return; }
    if (typeof checkVoice === "function") checkVoice();
    const now = Date.now(), all = Object.keys(S.cards);
    let keys = all.filter(k => S.cards[k].due <= now).sort((a, b) => S.cards[a].due - S.cards[b].due).slice(0, 5);
    if (keys.length < 5) keys = keys.concat(all.filter(k => !keys.includes(k)).sort((a, b) => S.cards[a].box - S.cards[b].box || S.cards[a].due - S.cards[b].due).slice(0, 5 - keys.length));
    const steps = shuffle(keys).map((k, i) => { const w = WMAP[k] || { en: k, vi: S.cards[k].vi }, s = i % 2 ? mqReverse(w, poolW(w)) : mqMeaning(w, poolW(w)); s.card = k; return s; });
    const L0 = firstWordsLesson();
    // còn thiếu thì lấy từ bài đang học: các từ này được thêm vào kho ôn khi xong buổi (s.nw), để lần sau ôn lại
    if (steps.length < 5) pick(L0.W.filter(w => !keys.includes(w.en) && WMAP[w.en]), 5 - steps.length).forEach(w => { const s = mqMeaning(w, poolW(w)); s.nw = w.en; steps.push(s); });
    let sents = ORDER.filter(id => S.done[id] && LES[id].kind !== "letters").flatMap(id => LES[id].S).filter(s => s.en.includes(" ") && s.en.length <= 70), studied = true;
    if (sents.length < 2) { studied = false; sents = L0.S.length >= 2 ? L0.S : LES[ORDER.find(id => LES[id].S.length >= 2 && LES[id].kind !== "letters")].S; }
    const [a, b] = pick(sents, 2);
    // câu chưa học: xếp lại câu (có nghĩa tiếng Việt) thay cho nghe chép
    steps.push(noTTS() || !studied ? { type: "order", sk: "write", en: a.en, vi: a.vi } : { type: "dict", sk: "listen", label: "Nghe và gõ lại câu", en: a.en, vi: a.vi });
    steps.push({ type: "speak", sk: "speak", en: (b || a).en, vi: (b || a).vi });
    newP("quick", steps, { t0: now });
  };
  function quickDone() {
    const p = P; try { if (window.TEACHER && TEACHER.onFinish) TEACHER.onFinish(Object.assign({}, p, { kind: "review" })); } catch (e) {}
    tick();
    const sc = p.tot ? Math.round(p.ok / p.tot * 100) : 100, gained = p.xp + 10, nw = p.steps.filter(s => s.card && !s.r).length;
    const fresh = [...new Set(p.steps.filter(s => s.nw && !s.r && WMAP[s.nw] && !S.cards[s.nw]).map(s => s.nw))];
    fresh.forEach(k => { S.cards[k] = { vi: WMAP[k].vi, box: 0, due: Date.now() + DAY }; });
    addXP(gained); S.cnt.quick = (S.cnt.quick || 0) + 1;
    const skr = Object.keys(p.sk).length ? `<div class="card skbox">${Object.keys(p.sk).map(x => { const v = p.sk[x], q = Math.round(v[0] / v[1] * 100); return `<div class="skrow"><i class="ti ti-${SKI[x]}"></i><span class="skn">${SK[x]}</span><div class="bar grow"><span style="width:${q}%"></span></div><b>${v[0]}/${v[1]}</b></div>`; }).join("")}</div>` : "";
    P = null; save();
    const m = minutesToday(), g = S.settings.goal;
    app().innerHTML = `<div class="donescr"><div class="ring xl" style="--p:${sc}"><span>${sc}%</span></div><h1>Xong buổi học 5 phút!</h1><p class="muted">Đã ${[nw ? `<span class="nw">ôn ${nw} từ</span>` : "", fresh.length ? `<span class="nw">học ${fresh.length} từ mới</span>` : "", p.steps.some(s => s.type === "dict") ? `<span class="nw">nghe 1 câu</span>` : `<span class="nw">xếp 1 câu</span>`, `<span class="nw">nói 1 câu</span>`].filter(Boolean).join(" · ")}.${fresh.length ? "<br>Từ mới đã vào Ôn tập." : ""}<br>Hôm nay đã học <b>${m}/${g}&nbsp;phút</b>.</p><p class="xpbig">+${gained} XP</p>${skr}<div class="stack"><button class="btn primary full lg" onclick="goNext()">Học bài tiếp theo <i class="ti ti-arrow-right"></i></button><button class="btn full" onclick="nav('home')">Về trang chủ</button></div></div>`;
    document.body.classList.add("playing"); beep("done"); if (sc >= 80) confetti(); checkBadges(); checkDay();
  }
  if (typeof vHome === "function") { const h0 = vHome; vHome = function () { h0.apply(this, arguments); try {
    const due = dueCards().length, html = quickReady() ? `<button class="qk5" onclick="XTRA.quick()"><span class="qk5i"><i class="ti ti-bolt"></i></span><span class="grow"><b>Học 5 phút</b><small><span class="nw">${due ? Math.min(5, due) + " từ đến hạn" : "5 từ"}</span> · <span class="nw">1 câu nghe</span> · <span class="nw">1 câu nói</span></small></span><i class="ti ti-chevron-right"></i></button>`
      : `<button class="qk5 qk5lock" onclick="XTRA.quick()"><span class="qk5i"><i class="ti ti-lock"></i></span><span class="grow"><b>Học 5 phút</b><small>Mở sau khi bạn học xong bài đầu tiên có từ vựng</small></span></button>`;
    const big = $("#app section.card.big"); if (big) big.insertAdjacentHTML("afterend", html); else { const hd = $("#app header"); if (hd) hd.insertAdjacentHTML("afterend", html); }
  } catch (e) {} }; }

  /* ================= Bọc trình học: tiêu đề, thời gian thi đua, thanh tốc độ / ẩn phụ đề ================= */
  const KTITLE = { quick: "Học 5 phút", duel: "Thi đua" };
  const RATES = [[0.7, "Chậm"], [0.9, "Thường"], [1.05, "Nhanh"]];
  const curRate = () => RATES.reduce((a, r) => Math.abs(r[0] - S.settings.rate) < Math.abs(a[0] - S.settings.rate) ? r : a, RATES[1])[0];
  /* thanh tốc độ chỉ hiện khi tiếng đọc là nội dung chính của câu (nghe chọn từ, nghe chép, nói, đọc bài), không hiện ở câu "Chọn nghĩa đúng" */
  const audioStep = s => s && (s.type === "dict" || s.type === "read" || s.type === "speak" || (s.type === "mcq" && s.audio && !s.q && !s.limit) || (s.ext && ["dlg", "pdict", "shadow", "role"].includes(s.type)));
  function auBar(s) {
    return `<div class="aubar"><span class="aul"><i class="ti ti-gauge"></i>Tốc độ giọng đọc</span><div class="seg ausp" role="group" aria-label="Tốc độ giọng đọc">${RATES.map(r => `<button class="${curRate() === r[0] ? "on" : ""}" aria-pressed="${curRate() === r[0]}" onclick="XTRA.setRate(${r[0]})">${r[1]}</button>`).join("")}</div></div>` +
      (s.type === "read" ? `<label class="tg auhide"><span>Ẩn bài đọc: <span class="nw">nghe trước, đọc sau</span></span><input type="checkbox" ${S.settings.hideSub ? "checked" : ""} onchange="XTRA.setHide(this.checked)"></label>` : "");
  }
  function hidePassage(s) {
    const ps = $(".pbody .passage"); if (!ps || s.type !== "read") return;
    const on = S.settings.hideSub && !s.shown; ps.classList.toggle("subhide", on);
    const old = $("#subrv"); if (old) old.remove();
    // nút "hiện bài đọc" đặt sau hàng nút Nghe cả bài: nghe trước, rồi mới bấm hiện chữ
    if (on) { const row = ps.nextElementSibling && ps.nextElementSibling.classList.contains("c2") ? ps.nextElementSibling : ps; row.insertAdjacentHTML("afterend", `<button class="btn full subrv" id="subrv" onclick="XTRA.reveal()"><i class="ti ti-eye"></i> Nghe xong rồi, hiện bài đọc</button>`); }
  }
  if (typeof showStep === "function") { const ss0 = showStep; showStep = function () {
    const r = ss0.apply(this, arguments);
    try {
      if (!P || !P.steps || P.i >= P.steps.length) return r;
      const s = P.steps[P.i];
      if (KTITLE[P.kind]) { const t = $(".ptitle"); if (t) t.innerHTML = KTITLE[P.kind] + (s.r ? ' · <span class="retry">làm lại câu sai</span>' : ""); }
      if (P.kind === "duel") s.t0 = Date.now();
      if (P.kind !== "mock" && audioStep(s)) { const lab = $(".pbody > .lab"); if (lab) lab.insertAdjacentHTML("afterend", auBar(s)); else { const pb = $(".pbody"); if (pb) pb.insertAdjacentHTML("afterbegin", auBar(s)); } hidePassage(s); }
    } catch (e) {}
    return r; }; }
  X.setRate = v => { S.settings.rate = v; save(); $$(".ausp button").forEach((b, i) => { const on = RATES[i][0] === v; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    const s = P && P.steps[P.i]; if (s && (s.type === "dict" || s.type === "speak")) say(s.en); else if (s && s.type === "mcq" && s.audio) say(s.audio); };
  X.setHide = on => { S.settings.hideSub = !!on; save(); const cb = $(".auhide input"); if (cb) cb.checked = !!on; const s = P && P.steps[P.i]; if (s) hidePassage(s); };
  X.reveal = () => { const s = P && P.steps[P.i]; if (!s) return; s.shown = 1; hidePassage(s); };
  if (typeof grade === "function") { const g0 = grade; grade = function () { const duel = P && P.kind === "duel"; try { if (duel && !P.ans) { const s = P.steps[P.i]; s.dt = Date.now() - (s.t0 || Date.now()); } } catch (e) {} const r = g0.apply(this, arguments);
    // thi đua cộng XP riêng khi chơi xong (+2 mỗi câu đúng, 3 lần đầu mỗi ngày): sửa nhãn "+10 XP" của từng câu cho đúng
    try { if (duel) { const e = $("#fb .xpg"); if (e) { if ((S.chal.xd === today() ? S.chal.xn : 0) >= DUEL_XP_DAY) e.remove(); else e.textContent = "+2 XP"; } } } catch (e) {} return r; }; }
  /* Back / nút thoát giữa lúc thi đua: về trang lời thách (máy chưa mở app lần nào thì không rơi vào màn giới thiệu app) */
  if (typeof quit === "function") { const q0 = quit; quit = function () { if (P && P.kind === "duel") { const d = P.duel; P = null; if (d && d.mode === "answer" && S.chal.got.some(x => x.id === d.id && !x.rep)) X.duelIntro(d.id); else if (S.onb) X.duels(); else { VIEW = null; render(); } return; } return q0.apply(this, arguments); }; }
  if (typeof finish === "function") { const f0 = finish; finish = function () { if (P && P.kind === "quick") return quickDone(); if (P && P.kind === "duel") return duelDone(); return f0.apply(this, arguments); }; }

  /* ================= 2. Phát âm: 12 âm khó với người Việt ================= */
  const SOUNDS = [
    { id: "th_u", cn: "âm /θ/ (th trong think)", ipa: "θ", name: "th trong think", m: ["teeth"], vn: "Hay bị đọc thành “t” hoặc “x”: <i>think</i> nghe thành <i>tink</i> hay <i>sink</i>.", tip: "Đặt đầu lưỡi nhẹ giữa hai hàm&nbsp;răng rồi thổi hơi ra qua khe giữa lưỡi và răng. Cổ họng không&nbsp;rung.", pairs: [["think", "sink", "s"], ["thick", "sick", "s"], ["three", "tree", "t"], ["thank", "tank", "t"], ["path", "pass", "s"], ["mouth", "mouse", "s"], ["thin", "tin", "t"]] },
    { id: "th_v", cn: "âm /ð/ (th trong this)", ipa: "ð", name: "th trong this", m: ["teeth"], vn: "Hay bị đọc thành “đ” hoặc “d”: <i>they</i> nghe thành <i>day</i>.", tip: "Lưỡi đặt giữa hai hàm răng như âm /θ/, nhưng cổ họng rung. Đặt tay lên cổ khi nói sẽ thấy rung.", pairs: [["they", "day", "d"], ["then", "den", "d"], ["those", "doze", "d"], ["there", "dare", "d"], ["breathe", "breeze", "z"], ["though", "dough", "d"]] },
    { id: "s_end", cn: "âm cuối /s/ hoặc /z/", ipa: "s/z", name: "Âm cuối /s/, /z/", m: ["groove"], vn: "Âm cuối /s/ hay bị nuốt mất, nhất là đuôi -s của danh từ số&nbsp;nhiều, nên <i>cats</i> nghe thành <i>cat</i>.", tip: "Ở cuối từ, đưa đầu lưỡi sát phần lợi sau răng trên nhưng không chạm, để hơi xì ra rõ “sss”. Với /z/ thì thêm rung cổ họng.", pairs: [["cat", "cats", ">"], ["book", "books", ">"], ["rice", "rise", "="], ["price", "prize", "="], ["place", "plays", "="], ["bus", "buzz", "="]] },
    { id: "fin", cn: "âm cuối /t/, /k/, /d/", ipa: "t/k/d", name: "Âm cuối /t/, /k/, /d/", m: ["ridge"], vn: "Hay bị bỏ mất âm cuối: <i>light</i> nghe thành <i>lie</i>, <i>white</i> thành <i>why</i>.", tip: "Ở cuối từ, chặn hơi lại rồi bật thật nhẹ. Với /t/ và /d/, đầu lưỡi chạm phần lợi sau răng trên. Với /k/, cuống lưỡi chạm vòm họng.", pairs: [["light", "lie", "+"], ["white", "why", "+"], ["card", "car", "+"], ["side", "sigh", "+"], ["seat", "sea", "+"], ["need", "knee", "+"], ["bike", "buy", "+"]] },
    { id: "ed", cn: "đuôi -ed", ipa: "t/d/ɪd", name: "Đuôi -ed", m: ["ridge"], vn: "Đuôi -ed hay bị bỏ, làm câu quá khứ nghe thành hiện tại: <i>walked</i> nghe thành <i>walk</i>.", tip: "Sau các âm vô thanh p, k, f, s, sh, ch, th, đuôi -ed đọc là /t/ (walked, laughed, washed). Sau t, d thì đọc /ɪd/ (wanted, needed). Các trường&nbsp;hợp còn lại đọc /d/ (played, cleaned). Kết&nbsp;thúc từ bằng đầu lưỡi chạm lợi sau răng trên.", pairs: [["walk", "walked", ">"], ["play", "played", ">"], ["want", "wanted", ">"], ["cook", "cooked", ">"], ["need", "needed", ">"], ["clean", "cleaned", ">"]] },
    { id: "sh", cn: "âm /ʃ/ (sh trong ship)", ipa: "ʃ", name: "sh trong ship", m: ["round"], vn: "Âm /ʃ/ hay bị đọc thành “x” tiếng&nbsp;Việt, nên <i>she</i> nghe thành <i>see</i>.", tip: "Chu môi tròn ra phía trước, lưỡi lùi vào trong hơn một chút so với âm /s/, rồi thổi hơi “sh…” như khi ra hiệu cho người khác im lặng.", pairs: [["ship", "sip", "s"], ["she", "see", "s"], ["shoe", "sue", "s"], ["sheet", "seat", "s"], ["shell", "sell", "s"], ["shame", "same", "s"]] },
    { id: "ch", cn: "âm /tʃ/ (ch trong chip)", ipa: "tʃ", name: "ch trong chip", m: ["ridge", "round"], ml: ["Bắt đầu", "Bật ra"], vn: "Âm /tʃ/ hay bị lẫn với /ʃ/, nên <i>chip</i> nghe thành <i>ship</i>.", tip: "Đầu lưỡi chạm phần lợi sau răng trên, môi hơi chu ra, rồi bật hơi thật nhanh thành “tsh”. Âm này ngắn và dứt khoát, không kéo&nbsp;dài như&nbsp;/ʃ/.", pairs: [["chip", "ship", "sh"], ["chair", "share", "sh"], ["watch", "wash", "sh"], ["cheap", "sheep", "sh"], ["chop", "shop", "sh"], ["match", "mash", "sh"]] },
    { id: "rl", cn: "âm /l/ và /r/", ipa: "l/r", name: "Âm /l/ và /r/", m: ["ridge", "curl"], ml: ["/l/", "/r/"], vn: "Hai âm này hay bị lẫn với nhau, nên <i>light</i> và <i>right</i>, <i>rice</i> và <i>lice</i> nghe giống nhau.", tip: "Âm /l/: đầu lưỡi chạm phần lợi sau răng trên. Âm /r/: cong đầu&nbsp;lưỡi lên và lùi về phía sau, không chạm vào đâu, môi hơi tròn.", pairs: [["light", "right", "="], ["lice", "rice", "="], ["long", "wrong", "="], ["lock", "rock", "="], ["glass", "grass", "="], ["fly", "fry", "="], ["collect", "correct", "="]] },
    { id: "vw", cn: "âm /v/ và /w/", ipa: "v/w", name: "Âm /v/ và /w/", m: ["lip", "round"], ml: ["/v/", "/w/"], vn: "Ở đầu từ, âm /v/ hay bị lẫn với /w/ hoặc /b/, nên <i>vest</i> nghe thành <i>west</i>, <i>very</i> nghe thành <i>berry</i>. Ở cuối từ, tiếng Việt không có âm /v/ nên âm này hay bị bỏ mất hoặc đọc thành /f/: <i>leave</i> nghe thành <i>leaf</i>, <i>have</i> nghe thành <i>half</i>.", tip: "Âm /v/: răng trên chạm nhẹ vào môi dưới, cổ họng rung. Ở cuối từ (leave, have, five) vẫn giữ răng chạm môi và rung cổ họng một chút, đừng bỏ âm. Âm /w/: chu tròn môi như khi huýt sáo, răng không chạm môi.", pairs: [["vest", "west", "="], ["vine", "wine", "="], ["vet", "wet", "="], ["very", "berry", "b"], ["vote", "boat", "b"], ["verse", "worse", "="], ["leave", "leaf", "f"], ["save", "safe", "f"], ["have", "half", "f"]] },
    { id: "ii", cn: "âm /ɪ/ ngắn và /iː/ dài", ipa: "ɪ/iː", name: "/ɪ/ ngắn và /iː/ dài", m: ["relax", "spread"], ml: ["/ɪ/", "/iː/"], vn: "Hai âm hay được đọc giống nhau, nên <i>ship</i> (con tàu) và <i>sheep</i> (con cừu) thành một.", tip: "Âm /ɪ/: môi thả lỏng, lưỡi hạ thấp hơn một chút, đọc ngắn và gọn, nghe gần giữa “i” và “ê”. Âm /iː/: kéo căng môi sang hai bên như đang cười, lưỡi nâng cao, đọc dài “iii”.", pairs: [["ship", "sheep", "="], ["slip", "sleep", "="], ["sit", "seat", "="], ["fill", "feel", "="], ["bit", "beat", "="], ["hit", "heat", "="]] },
    { id: "ae", cn: "âm /æ/ và /e/", ipa: "æ/e", name: "/æ/ và /e/", m: ["open", "mid"], ml: ["/æ/", "/e/"], vn: "Âm /æ/ hay bị đọc thành “e”, nên <i>bad</i> nghe thành <i>bed</i>.", tip: "Âm /æ/: mở miệng rộng, hạ hàm dưới, lưỡi nằm thấp, nghe như “e” nhưng miệng mở to gần như khi nói “a”. Âm /e/: miệng chỉ mở vừa phải.", pairs: [["bad", "bed", "="], ["man", "men", "="], ["sad", "said", "="], ["pan", "pen", "="], ["bag", "beg", "="], ["had", "head", "="]] },
    { id: "ng", cn: "âm cuối /n/ và /ŋ/", ipa: "n/ŋ", name: "Âm cuối /n/ và /ŋ/", m: ["ridge", "back"], ml: ["/n/", "/ŋ/"], vn: "Âm cuối “n” và “ng” hay bị lẫn, nên <i>thin</i> và <i>thing</i> nghe như nhau.", tip: "Âm /n/: đầu lưỡi chạm phần lợi sau răng trên. Âm /ŋ/: cuống lưỡi nâng lên chạm vòm họng mềm, đầu lưỡi để thấp, hơi đi ra đằng mũi.", pairs: [["thin", "thing", "="], ["sin", "sing", "="], ["ban", "bang", "="], ["ran", "rang", "="], ["win", "wing", "="]] }
  ];
  const SND = {}; SOUNDS.forEach(s => SND[s.id] = s);
  const ipaF = s => s.ipa.split("/").map(x => "/" + x + "/").join(" ");
  /* Mỗi cặp [a, b, k]: từ a có âm đang luyện, người học hay đọc thành b. Riêng k = ">" thì b mới là từ có âm đó (cat – cats, walk – walked).
     k = "=": hai chiều (mỗi từ là một trong hai âm của mục, như light – right): hình miệng và lời khuyên theo âm của TỪ MẪU.
     k = "+": từ mẫu b mà máy nghe a là người học THÊM âm (lie → light). k là âm trong EASY (s, t, d…): từ mẫu b mà máy nghe a
     thì âm cần đọc là âm dễ đó (từ mẫu sink, máy nghe think → hãy đọc /s/, không đưa lưỡi ra giữa răng). Không bao giờ đưa lời khuyên
     của âm khó cho một từ không có âm đó. */
  const EASY = {
    s: { cn: "âm /s/", m: "groove", tip: "Âm /s/: đầu lưỡi đưa sát phần lợi sau răng trên nhưng không chạm, không thò ra giữa hai hàm răng, môi không chu ra. Hơi xì ra mảnh “sss”." },
    z: { cn: "âm /z/", m: "groove", tip: "Âm /z/: đặt lưỡi như âm /s/ (sát lợi sau răng trên, không thò ra giữa răng) nhưng cổ họng rung, nghe như tiếng ong “zzz”." },
    t: { cn: "âm /t/", m: "ridge", tip: "Âm /t/: đầu lưỡi chạm phần lợi sau răng trên rồi bật hơi ra. Không đưa lưỡi ra giữa hai hàm răng." },
    d: { cn: "âm /d/", m: "ridge", tip: "Âm /d/: đầu lưỡi chạm phần lợi sau răng trên rồi bật ra, cổ họng rung. Không đưa lưỡi ra giữa hai hàm răng." },
    b: { cn: "âm /b/", m: "", tip: "Âm /b/: mím hai môi lại rồi bật ra, cổ họng rung. Răng trên không chạm vào môi dưới." },
    f: { cn: "âm cuối /f/", m: "lip", tip: "Âm /f/: răng trên chạm nhẹ môi dưới rồi thổi hơi ra, cổ họng không rung." },
    sh: { snd: "sh" }
  };
  const PAIRMAP = new Map(), pset = (k, v) => { if (!PAIRMAP.has(k)) PAIRMAP.set(k, v); };
  SOUNDS.forEach(s => s.pairs.forEach(([a, b, k]) => {
    if (k === "=") { pset(a + "|" + b, { id: s.id, mode: "two", side: 0 }); pset(b + "|" + a, { id: s.id, mode: "two", side: 1 }); }
    else if (k === ">") { pset(b + "|" + a, { id: s.id, mode: "hard", side: 1 }); pset(a + "|" + b, { id: s.id, mode: "add" }); }
    else { pset(a + "|" + b, { id: s.id, mode: "hard", side: 0 }); pset(b + "|" + a, k === "+" ? { id: s.id, mode: "add" } : { id: s.id, mode: "easy", ez: k }); }
  }));
  const VOICED_TH = /^(the|this|that|these|those|they|them|their|theirs|there|then|than|though|thus|themselves|therefore|with|without|other|others|another|mother|father|brother|weather|together|whether|either|neither|rather|bother|clothes|breathe|smooth)$/;
  /* hình miệng nhìn nghiêng (môi bên trái): vị trí đầu lưỡi, môi, răng cho từng kiểu */
  const MOUTH = {
    teeth: { t: [19, 51], h: [62, 57], cap: "Đầu lưỡi giữa hai hàm răng" },
    ridge: { t: [34, 42], h: [64, 55], cap: "Đầu lưỡi chạm lợi sau răng trên" },
    groove: { t: [35, 47], h: [64, 51], air: 1, cap: "Lưỡi sát lợi, hơi xì ra" },
    curl: { t: [52, 39], h: [74, 58], curl: 1, cap: "Cong lưỡi lên, không chạm" },
    back: { t: [37, 64], h: [92, 40], cap: "Cuống lưỡi chạm vòm họng mềm" },
    spread: { t: [35, 60], h: [58, 41], spread: 1, cap: "Môi kéo căng, lưỡi nâng cao" },
    open: { t: [35, 72], h: [66, 69], open: 1, cap: "Miệng mở rộng, lưỡi thấp" },
    mid: { t: [35, 67], h: [64, 58], half: 1, cap: "Miệng mở vừa, lưỡi ở giữa" },
    relax: { t: [35, 62], h: [60, 47], cap: "Môi thả lỏng, lưỡi hơi thấp hơn" },
    round: { t: [40, 53], h: [66, 49], round: 1, cap: "Môi chu tròn ra trước" },
    lip: { t: [38, 62], h: [66, 59], lip: 1, cap: "Răng trên chạm môi dưới" }
  };
  /* hình miệng nhìn nghiêng, môi ở bên trái: vòm miệng, răng, môi, lưỡi (đầu lưỡi t, lưng lưỡi h) */
  function mouthSvg(k) {
    const m = MOUTH[k] || MOUTH.ridge, j = m.open ? 10 : m.half ? 5 : 0, [tx, ty] = m.t, [hx, hy] = m.h, f = m.round ? -6 : 0;
    const ul = m.round ? "M25 29 Q10 28 6 38 Q7 46 24 47 Z" : m.spread ? "M25 33 Q15 33 12 40 Q14 46 24 46 Z" : "M25 29 Q12 29 10 39 Q11 47 24 48 Z";
    const ll = m.lip ? "M31 47 Q20 45 16 52 Q16 62 26 64 L31 60 Z" : m.round ? `M24 ${55 + j} Q8 ${54 + j} 6 ${63 + j} Q9 ${72 + j} 25 ${72 + j} Z` : m.spread ? `M24 ${55 + j} Q14 ${55 + j} 12 ${61 + j} Q15 ${67 + j} 25 ${66 + j} Z` : `M24 ${55 + j} Q11 ${55 + j} 9 ${63 + j} Q11 ${72 + j} 25 ${72 + j} Z`;
    const lt = m.lip ? `M26 ${66 + j} L32 ${66 + j} L32 ${56 + j} Q29 ${54 + j} 26 ${56 + j} Z` : `M25 ${66 + j} L31 ${66 + j} L31 ${55 + j} Q28 ${53 + j} 25 ${55 + j} Z`;
    const fx = Math.max(tx + 16, 50), fy = Math.max(ty + 16, 78 + j);
    const under = m.curl ? `C ${tx - 6} ${ty - 3} ${tx - 9} ${ty + 7} ${tx + 2} ${ty + 11} C ${tx} ${ty + 22} ${tx} ${ty + 32} ${tx + 2} ${78 + j}` : `C ${tx - 3} ${ty + 6} ${tx + 2} ${fy - 4} ${fx} ${fy}`;
    const tg = `M108 ${96} C 106 ${hy + 6} ${hx + 18} ${hy} ${hx} ${hy} C ${hx - 16} ${hy} ${tx + 14} ${ty - 3} ${tx} ${ty} ${under} Q 80 ${90 + j / 2} 108 96 Z`;
    return `<svg class="msvg" viewBox="0 0 120 100" role="img" aria-label="${esc(m.cap)}"><rect x="0" y="0" width="120" height="100" fill="none"/>
      <path d="M31 38 Q34 32 42 31 Q62 22 86 25 Q100 28 104 38" class="mpal"/><path d="M104 38 Q108 48 104 58" class="mpal dsh"/>
      <path d="${tg}" class="mtng"/>
      <path d="M25 33 L31 33 L31 48 Q28 50 25 48 Z" class="mtth"/><path d="${lt}" class="mtth"/>
      <path d="${ul}" class="mlip" transform="translate(${f} 0)"/><path d="${ll}" class="mlip" transform="translate(${f} 0)"/>
      ${m.air ? `<path d="M33 50 L5 50" class="mair"/><path d="M10 46 L5 50 L10 54" class="mair"/>` : ""}</svg>`;
  }
  const mouthHtml = s => !s.m || !s.m.length ? "" : `<div class="mouths${s.m.length > 1 ? " two" : ""}">${s.m.map((k, i) => `<figure class="mouth">${mouthSvg(k)}<figcaption>${s.ml ? `<b>${esc(s.ml[i])}</b> ` : ""}${esc(MOUTH[k].cap)}</figcaption></figure>`).join("")}</div><p class="sm muted mleg"><span class="nw"><span class="lg1"></span>môi</span> <span class="nw"><span class="lg2"></span>lưỡi</span> <span class="nw"><span class="lg3"></span>răng</span><br>Hình nhìn nghiêng, môi ở bên trái</p>`;
  X._mouth = mouthSvg;

  /* So câu mẫu với chữ máy nghe được: tìm từ sai và đoán âm sai (theo kiểu lỗi hay gặp của người Việt).
     Chiều luôn là: âm của TỪ MẪU (âm người học cần đọc) → âm máy nghe được. Máy nghe dài hơn từ mẫu là người học thêm âm, không phải nuốt âm. */
  const swapAt = (t, h, a, b) => { if (t.length !== h.length) return ""; let d = -1; for (let i = 0; i < t.length; i++) if (t[i] !== h[i]) { if (d >= 0) return ""; d = i; } return d >= 0 && ((t[d] === a && h[d] === b) || (t[d] === b && h[d] === a)) ? t[d] : ""; };
  function classify(t, h) {
    t = String(t || "").replace(/['-]/g, ""); h = String(h || "").replace(/['-]/g, "");
    if (!t || !h || t === h) return null;
    const pm = PAIRMAP.get(t + "|" + h); if (pm) return Object.assign({}, pm);
    if (/ed$/.test(t) && (h === t.slice(0, -2) || h === t.slice(0, -1) || (/ied$/.test(t) && h === t.slice(0, -3) + "y"))) return { id: "ed", mode: "hard" };
    if (/s$/.test(t) && !/ss$/.test(t) && t.length > 2 && (h === t.slice(0, -1) || (/es$/.test(t) && h === t.slice(0, -2)) || (/ies$/.test(t) && h === t.slice(0, -3) + "y"))) return { id: "s_end", mode: "hard" };
    if (t.includes("th")) for (const x of ["t", "d", "s", "f", "z"]) if (h === t.replace(/th/g, x) || h === t.replace("th", x)) return { id: VOICED_TH.test(t) ? "th_v" : "th_u", mode: "hard" };
    if (/ng$/.test(t) && h === t.slice(0, -1)) return { id: "ng", mode: "hard", side: 1 };
    const rl = swapAt(t, h, "r", "l"); if (rl) return { id: "rl", mode: "two", side: rl === "l" ? 0 : 1 };
    if (t.includes("sh") && h === t.replace(/sh/g, "s")) return { id: "sh", mode: "hard" };
    if (t.includes("ch") && (h === t.replace(/ch/g, "sh") || h === t.replace(/tch/g, "sh"))) return { id: "ch", mode: "hard" };
    const vw = swapAt(t, h, "v", "w"); if (vw) return { id: "vw", mode: "two", side: vw === "v" ? 0 : 1 };
    if (swapAt(t, h, "v", "b") === "v") return { id: "vw", mode: "hard", side: 0 };
    if (/[tkdp]$/.test(t) && h === t.slice(0, -1)) return { id: "fin", mode: "hard" };
    if (/[tkd]e?$/.test(t) && /[aeiouyw]$/.test(h) && h.length < t.length && h.slice(0, 2) === t.slice(0, 2)) return { id: "fin", mode: "hard" };
    // máy nghe thừa âm ở cuối (play → played, car → card, why → white): không đưa lời khuyên "đọc rõ âm cuối"
    if (h.length > t.length && h.startsWith(t) && /^(e?d|e?s|t|k)$/.test(h.slice(t.length))) return { id: null, mode: "add" };
    if (/[tkd]e?$/.test(h) && /[aeiouyw]$/.test(t) && t.length < h.length && h.slice(0, 2) === t.slice(0, 2)) return { id: null, mode: "add" };
    return null;
  }
  /* hai cách viết của cùng một tiếng (its / it's, to / too / two, morning / mourning, 2 / two, colour / color) không phải lỗi phát âm */
  const HOMX = [["morning", "mourning"], ["your", "youre"], ["there", "their", "theyre"], ["whose", "whos"], ["to", "too", "two", "2"], ["for", "four", "4"], ["one", "won", "1"], ["ate", "eight", "8"], ["by", "buy", "bye"], ["right", "write"], ["hole", "whole"], ["wait", "weight"], ["passed", "past"], ["allowed", "aloud"], ["ok", "okay"], ["mr", "mister"], ["cue", "queue"], ["die", "dye"], ["know", "no"], ["new", "knew"], ["meet", "meat"], ["week", "weak"], ["son", "sun"], ["hear", "here"], ["see", "sea"], ["i", "eye"], ["hour", "our"], ["its"], ["were"]];
  let HOMC = null;
  const homc = () => { if (HOMC) return HOMC; HOMC = new Map(); const add = g => { const c = g[0]; g.forEach(w => { if (!HOMC.has(w)) HOMC.set(w, c); }); };
    HOMX.forEach(add); if (typeof HOMO !== "undefined") HOMO.forEach(g => { const l = g.map(x => x.toLowerCase()); const known = l.find(x => HOMC.has(x)); if (known) { const c = HOMC.get(known); l.forEach(w => { if (!HOMC.has(w)) HOMC.set(w, c); }); } else add(l); }); return HOMC; };
  const key = x => { x = String(x).toLowerCase().replace(/['-]/g, ""); if (typeof NUMS !== "undefined" && NUMS[x] !== undefined) x = String(NUMS[x]); if (typeof usSpell === "function") x = usSpell(x); return homc().get(x) || x; };
  /* viết tắt → dạng đầy đủ (dùng bảng CONTR của app): what's = what is, dont = do not */
  const expand1 = x => { const c = typeof CONTR !== "undefined" ? CONTR[x] : null; return c ? c.split(" ") : [x]; };
  function pronIssues(target, heard) {
    if (typeof speakScore === "function" && speakScore(target, heard) >= 100) return [];
    const tw = String(target).split(/\s+/).filter(Boolean), tt = [], own = [], orig = [];
    tw.forEach((w, i) => tok(w).split(" ").filter(Boolean).forEach(x => expand1(x).forEach(y => { tt.push(y); own.push(i); orig.push(x); })));
    const ht = tok(heard).split(" ").filter(Boolean).flatMap(expand1), m = tt.length, n = ht.length, tk = tt.map(key), hk = ht.map(key);
    const L = [...Array(m + 1)].map(() => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) L[i][j] = tk[i] === hk[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const mt = new Array(m).fill(-1); for (let i = 0, j = 0; i < m && j < n;) { if (tk[i] === hk[j]) { mt[i] = j; i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
    // “It's” trong câu mẫu mà máy ghi “its” (cùng một tiếng): coi như đúng cả từ
    for (let i = 0; i < m; i++) if (mt[i] < 0 && orig[i] !== tt[i]) { const k0 = key(orig[i]); if (ht.some(h => key(h) === k0)) for (let k = 0; k < m; k++) if (own[k] === own[i]) mt[k] = mt[k] < 0 ? -2 : mt[k]; }
    const out = [], usedW = new Set();
    for (let i = 0; i < m; i++) {
      if (mt[i] !== -1 || usedW.has(own[i])) continue;
      let lo = -1, hi = n; for (let k = i - 1; k >= 0; k--) if (mt[k] >= 0) { lo = mt[k]; break; } for (let k = i + 1; k < m; k++) if (mt[k] >= 0) { hi = mt[k]; break; }
      const cand = ht.slice(lo + 1, hi); let h = null, c0 = null;
      for (const c of cand) { const k = classify(tt[i], c) || (orig[i] !== tt[i] ? classify(orig[i], c) : null); if (k) { h = c; c0 = k; break; } }
      // phần còn lại của một từ viết tắt (What's → what + is, máy chỉ nghe “what”): so cả từ với chữ máy nghe ở chỗ đó
      if (!c0 && orig[i] !== tt[i]) for (let k = 0; k < m && !c0; k++) if (own[k] === own[i] && mt[k] >= 0) { const r = classify(orig[i], ht[mt[k]]); if (r) { h = ht[mt[k]]; c0 = r; } }
      if (!h && cand.length) { const best = cand.slice().sort((a, b) => lev(tt[i], a) - lev(tt[i], b))[0]; if (lev(tt[i], best) <= Math.max(2, Math.ceil(tt[i].length / 2))) h = best; }
      usedW.add(own[i]);
      const x = { word: tw[own[i]].replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, ""), t: tt[i], h, snd: null };
      if (c0) { if (c0.mode === "hard" || c0.mode === "two") { x.snd = c0.id; if (c0.side !== undefined) x.side = c0.side; } else if (c0.mode === "easy") { x.ez = c0.ez; x.from = c0.id; } else if (c0.mode === "add") x.add = 1; }
      out.push(x);
    }
    // máy nghe sai quá nửa câu: chỉ giữ các từ đoán được lỗi (danh sách "chưa nghe thấy" dài chỉ gây rối)
    const has = x => !!(x.snd || x.ez || x.add), miss = mt.filter(x => x === -1).length, keep = miss * 2 > m ? out.filter(has) : out;
    return keep.sort((a, b) => (has(b) ? 1 : 0) - (has(a) ? 1 : 0)).slice(0, 3);
  }
  X.pronIssues = pronIssues; X.classify = (t, h) => { const r = classify(t, h); return r && (r.mode === "hard" || r.mode === "two") ? r.id : null; }; X.classify2 = classify; X.SOUNDS = SOUNDS; X._key = key;

  /* âm có hai hình (l/r, v/w, n/ŋ, ɪ/iː, æ/e): chọn hình của âm trong TỪ MẪU (side = vị trí của từ mẫu trong cặp); /tʃ/ giữ cả hai bước */
  function pickMouth(s, t, side) {
    if (s.m.length < 2 || s.id === "ch") return { m: s.m, ml: s.ml || null };
    const k = side === 0 || side === 1 ? side : s.id === "rl" ? (/l/.test(t) && !/r/.test(t) ? 0 : 1) : s.id === "vw" ? (/v/.test(t) ? 0 : 1) : s.id === "ng" ? (/ng$/.test(t) ? 1 : 0) : s.id === "ii" ? (/ee|ea|ie/.test(t) ? 1 : 0) : s.id === "ae" ? (/a/.test(t) ? 0 : 1) : 1;
    return { m: [s.m[k]], ml: s.ml ? [s.ml[k]] : null };
  }
  let COACH = [];
  function coachHtml(list) {
    COACH = list;
    return `<section class="card pcoach" aria-live="polite"><p class="lab"><i class="ti ti-ear"></i>Gợi ý phát âm</p>` + list.map((x, i) => {
      const hd = x.h ? `máy nghe thành <b lang="en">“${esc(x.h)}”</b>` : "máy chưa nghe thấy từ này";
      let body = "", link = "";
      if (x.snd && SND[x.snd]) { const s = SND[x.snd], pm = pickMouth(s, x.t, x.side), nm = s.ml && pm.ml && pm.ml.length === 1 ? `âm ${pm.ml[0]}` : s.cn;
        body = ` Có thể bạn chưa đọc đúng ${esc(nm)}.</p>${mouthHtml(pm)}<p class="sm ptip">${s.tip}</p>`; link = s.id; }
      else if (x.ez && (EASY[x.ez] || {}).snd) { const s = SND[EASY[x.ez].snd]; body = ` Từ này đọc với ${esc(s.cn)}, không phải ${esc(SND[x.from].cn)}.</p>${mouthHtml(pickMouth(s, x.t))}<p class="sm ptip">${s.tip}</p>`; link = s.id; }
      else if (x.ez && EASY[x.ez]) { const e = EASY[x.ez]; body = ` Từ này đọc với ${esc(e.cn)}, không phải ${esc(SND[x.from].cn)}.</p>${e.m ? mouthHtml({ m: [e.m] }) : ""}<p class="sm ptip">${e.tip}</p>`; }
      else if (x.add) body = ` Có vẻ bạn đọc thêm âm ở cuối từ. Hãy đọc đúng <b lang="en">“${esc(x.word)}”</b>, kết thúc gọn, không thêm âm.</p>`;
      else body = "</p>";
      return `<div class="pci"><p><b lang="en">“${esc(x.word)}”</b>: ${hd}.${body}
        <div class="row2"><button class="btn" onclick="XTRA.coachHear(${i})"><i class="ti ti-volume"></i> Nghe mẫu</button><button class="btn primary" onclick="XTRA.coachTry(${i})"><i class="ti ti-microphone"></i> Thử lại</button></div><p class="sm c pres" id="pres${i}" aria-live="polite"></p>${link ? `<button class="link c" onclick="XTRA.sound('${link}')"><span class="nw">Luyện riêng âm này</span><i class="ti ti-arrow-right"></i></button>` : ""}</div>`;
    }).join("") + `<p class="sm muted pnote">Máy chỉ đoán theo những chữ micro nghe được, nên có lúc nhầm. Hãy coi đây là gợi ý để luyện&nbsp;thêm.</p></section>`;
  }
  X.coachHear = i => { const x = COACH[i]; if (x) say(x.word, true); };
  X.coachTry = i => {
    const x = COACH[i], el = $("#pres" + i); if (!x || !el) return;
    if (!SR || micBlocked) { el.innerHTML = "Máy này chưa nhận được giọng nói. Hãy nghe mẫu rồi tự nói theo."; return; }
    el.innerHTML = `<span class="listening"><span class="dot"></span> Đang nghe… hãy nói “${esc(x.word)}”</span>`;
    listenMic(alts => { const e = $("#pres" + i); if (!e) return; const hit = alts.find(a => tok(a).split(" ").flatMap(expand1).map(key).includes(key(x.t)));
      e.innerHTML = hit ? `<span class="good"><i class="ti ti-circle-check"></i> Tốt! Máy nghe được “${esc(x.word)}”.</span>` : `Máy nghe được: “${esc(alts[0])}”. Nghe mẫu rồi thử lại nhé.`; },
    err => { const e = $("#pres" + i); if (e) e.innerHTML = err === "no-speech" ? "Chưa nghe thấy gì. Hãy nói to và rõ hơn." : (micErrMsg(err) || "Chưa dùng được micro."); }, { maxMs: 6000 });
  };
  function coachShow(target, heard) {
    try {
      if (!P || P.kind === "mock") return; const old = $(".pcoach"); if (old) old.remove();
      const list = pronIssues(target, heard); if (!list.length) return;
      const mic = $("#mic"); if (!mic) return; mic.insertAdjacentHTML("afterend", coachHtml(list)); if (typeof fitFb === "function") fitFb();
    } catch (e) {}
  }
  X._coach = coachShow;
  if (typeof diffWords === "function") { const d0 = diffWords; diffWords = function (t, h) { const r = d0.apply(this, arguments); Promise.resolve().then(() => coachShow(t, h)); return r; }; }

  /* ---------- Trang Luyện âm khó ---------- */
  let LA = null, SPK = null;
  const vTop = (back, title) => `<div class="ptop"><button class="ib" onclick="${back}" aria-label="Quay lại"><i class="ti ti-arrow-left"></i></button><b class="grow gtitle">${title}</b></div>`;
  const openView = fn => { toastOff(); micOff(); P = null; VIEW = fn; render(); window.scrollTo(0, 0); };
  X.sounds = () => openView(() => {
    app().innerHTML = vTop("nav('review')", "Luyện âm khó") + `<p class="muted lead2">${SOUNDS.length} âm người Việt hay đọc sai. Chọn một âm để xem cách đặt lưỡi, môi, rồi luyện nghe phân biệt và nói thử.</p>
      <div class="sndlist">${SOUNDS.map(s => `<button class="snd" onclick="XTRA.sound('${s.id}')"><span class="sipa"><span class="ipl">${esc(ipaF(s))}</span><span class="ips" aria-hidden="true">${esc(s.ipa.split("/").join(" "))}</span></span><span class="grow"><b>${esc(s.name)}</b><small lang="en">${s.pairs.slice(0, 2).map(p => `<span class="nw">${p.slice(0, 2).map(esc).join(" – ")}</span>`).join(" · ")}</small></span><i class="ti ti-chevron-right"></i></button>`).join("")}</div>
      <p class="note">Máy chấm dựa trên những chữ mà micro nghe được, nên có lúc nhầm. Nghe mẫu nhiều lần là cách luyện tốt nhất.</p>`;
  });
  X.sound = id => { const s = SND[id]; if (!s) return; LA = null; SPK = null; openView(() => {
    app().innerHTML = vTop("XTRA.sounds()", "Luyện âm khó") + `<h1 class="sndh">${/\//.test(s.name) ? "" : `<span class="sipa big">${esc(ipaF(s))}</span> `}${esc(s.name)}</h1>
      <section class="card sndc"><p class="lab"><i class="ti ti-alert-circle"></i>Lỗi hay gặp</p><p>${s.vn}</p></section>
      <section class="card sndc"><p class="lab"><i class="ti ti-bulb"></i>Cách đặt lưỡi, môi</p>${mouthHtml(s)}<p>${s.tip}</p></section>
      <section class="card sndc"><p class="lab"><i class="ti ti-volume"></i>Cặp từ dễ nhầm · bấm để nghe</p><div class="pairs">${s.pairs.map(([a, b]) => `<div class="pair"><button class="chip" onclick="say('${jsq(a)}')" lang="en">${esc(a)}</button><span class="muted" aria-hidden="true">–</span><button class="chip" onclick="say('${jsq(b)}')" lang="en">${esc(b)}</button></div>`).join("")}</div></section>
      <button class="btn primary full lg" onclick="XTRA.laStart('${id}')"><i class="ti ti-ear"></i> Nghe và chọn từ đúng</button>
      <button class="btn full" onclick="XTRA.spStart('${id}')"><i class="ti ti-microphone"></i> Nói thử từng từ</button>`;
  }); };
  X._la = () => LA;
  X.laStart = id => { const s = SND[id]; LA = { id, i: 0, n: 8, ok: 0, q: [] }; const ps = shuffle(s.pairs.map(p => p.slice(0, 2))); for (let k = 0; k < LA.n; k++) { const p = ps[k % ps.length], a = Math.random() < 0.5 ? 0 : 1; LA.q.push({ o: Math.random() < 0.5 ? p.slice() : p.slice().reverse(), w: p[a] }); } LA.q.forEach(q => q.a = q.o.indexOf(q.w)); openView(laView); setTimeout(() => { if (LA && !LA.done) say(LA.q[0].w); }, 400); };
  function laView() {
    if (!LA) return; const s = SND[LA.id];
    if (LA.done) { const sc = Math.round(LA.ok / LA.n * 100);
      app().innerHTML = `<div class="donescr${sc >= 75 ? "" : " fail"}"><div class="ring xl" style="--p:${sc}"><span>${LA.ok}/${LA.n}</span></div><h1>${sc >= 75 ? "Tai bạn nghe rất tốt!" : "Cần nghe thêm"}</h1><p class="muted">Bạn phân biệt đúng ${LA.ok}/${LA.n} lần âm <b class="nw">${esc(ipaF(s))}</b>.${sc >= 75 ? "" : "<br>Nghe lại các cặp từ rồi thử lần nữa nhé."}</p>${LA.ok ? `<p class="xpbig">+${LA.ok * 2} XP</p>` : ""}<div class="stack"><button class="btn primary full lg" onclick="XTRA.laStart('${s.id}')"><i class="ti ti-refresh"></i> Luyện lại</button><button class="btn full" onclick="XTRA.spStart('${s.id}')"><i class="ti ti-microphone"></i> Nói thử từng từ</button><button class="btn full" onclick="XTRA.sound('${s.id}')">Về âm này</button></div></div>`; return; }
    const q = LA.q[LA.i];
    app().innerHTML = `<div class="ptop"><button class="ib" onclick="XTRA.sound('${s.id}')" aria-label="Thoát"><i class="ti ti-x"></i></button><div class="bar grow"><span style="width:${LA.i / LA.n * 100}%"></span></div><span class="muted sm prog">${LA.i + 1}/${LA.n}</span></div><p class="ptitle">Nghe phân biệt ${esc(ipaF(s))}</p>
      <p class="lab"><i class="ti ti-ear"></i>Bạn nghe thấy từ nào?</p><div class="c">${spk(q.w, "xl")}${slowBtn(q.w)}</div>
      <div class="opts">${q.o.map((o, i) => `<button class="opt" id="lo${i}" onclick="XTRA.laPick(${i})" lang="en"><span class="k">${i + 1}</span>${esc(o)}</button>`).join("")}</div><div id="lafb"></div>`;
  }
  X.laPick = i => { if (!LA || LA.done) return; const q = LA.q[LA.i]; if (q.pk !== undefined) return; q.pk = i; const ok = i === q.a; if (ok) LA.ok++; tick();
    $$(".opts .opt").forEach(b => b.disabled = true); $("#lo" + q.a).classList.add("right"); if (!ok) $("#lo" + i).classList.add("wrong"); beep(ok ? "good" : "bad");
    $("#lafb").innerHTML = `<p class="lares ${ok ? "good" : "bad"}"><i class="ti ti-${ok ? "circle-check" : "alert-circle"}"></i> ${ok ? "Đúng rồi!" : `Chưa đúng.<br>Máy đọc từ <b lang="en" class="nw">“${esc(q.w)}”.</b>`}</p>${ok ? "" : `<div class="row2"><button class="btn" onclick="say('${jsq(q.o[0])}')" lang="en"><i class="ti ti-volume"></i> ${esc(q.o[0])}</button><button class="btn" onclick="say('${jsq(q.o[1])}')" lang="en"><i class="ti ti-volume"></i> ${esc(q.o[1])}</button></div>`}<button class="btn primary full lg" onclick="XTRA.laNext()">${LA.i + 1 >= LA.n ? "Xem kết quả" : "Câu tiếp theo"} <i class="ti ti-arrow-right"></i></button>`; };
  X.laNext = () => { if (!LA) return; LA.i++; if (LA.i >= LA.n) { LA.done = 1; if (LA.ok) addXP(LA.ok * 2); save(); render(); if (LA.ok / LA.n >= 0.75) { beep("done"); confetti(); } return; } render(); setTimeout(() => { if (LA && !LA.done) say(LA.q[LA.i].w); }, 300); };
  X.spStart = id => { const s = SND[id], ws = []; shuffle(s.pairs).slice(0, 3).forEach(p => ws.push(p[0], p[1])); SPK = { id, ws, i: 0, ok: 0 }; openView(spView); };
  function spView() {
    if (!SPK) return; const s = SND[SPK.id];
    if (SPK.i >= SPK.ws.length) { app().innerHTML = `<div class="donescr"><div class="ring xl" style="--p:${Math.round(SPK.ok / SPK.ws.length * 100)}"><span>${SPK.ok}/${SPK.ws.length}</span></div><h1>Xong phần nói thử</h1><p class="muted">Máy nghe đúng ${SPK.ok}/${SPK.ws.length} từ.<br>Nói chậm, rõ âm ${esc(ipaF(s))} là sẽ tiến bộ.</p><div class="stack"><button class="btn primary full lg" onclick="XTRA.spStart('${s.id}')"><i class="ti ti-refresh"></i> Nói lại</button><button class="btn full" onclick="XTRA.sound('${s.id}')">Về âm này</button></div></div>`; return; }
    const w = SPK.ws[SPK.i], vi = WMAP[w] ? WMAP[w].vi.split("; ")[0] : "";
    app().innerHTML = `<div class="ptop"><button class="ib" onclick="XTRA.sound('${s.id}')" aria-label="Thoát"><i class="ti ti-x"></i></button><div class="bar grow"><span style="width:${SPK.i / SPK.ws.length * 100}%"></span></div><span class="muted sm prog">${SPK.i + 1}/${SPK.ws.length}</span></div><p class="ptitle">Nói thử ${esc(ipaF(s))}</p>
      <p class="lab"><i class="ti ti-microphone"></i>Nghe mẫu rồi đọc to từ này</p><div class="say"><h2 lang="en">${esc(w)}</h2>${vi ? `<p class="vi">${esc(vi)}</p>` : ""}</div><div class="c">${spk(w, "xl")}${slowBtn(w)}</div>
      <div id="spm">${SR && !micBlocked ? `<button class="btn primary full lg" onclick="XTRA.spMic()"><i class="ti ti-microphone"></i> Bấm rồi nói</button>` : `<p class="muted c sm">Máy này chưa nhận được giọng nói.<br>Hãy nghe mẫu, nói theo rồi tự so sánh.</p><button class="btn primary full" onclick="XTRA.spNext(0)">Từ tiếp theo <i class="ti ti-arrow-right"></i></button>`}</div>`;
  }
  X.spMic = () => { if (!SPK) return; const s = SND[SPK.id], w = SPK.ws[SPK.i], other = s.pairs.map(p => p.slice(0, 2)).flatMap(p => p.includes(w) ? p.filter(x => x !== w) : []); $("#spm").innerHTML = micUI("Đang nghe… hãy đọc từ trên");
    listenMic(alts => { if (!SPK || SPK.ws[SPK.i] !== w) return; tick(); const toks = alts.map(a => tok(a).split(" ")), hit = toks.some(t => t.includes(w)), conf = !hit && other.find(o => toks.some(t => t.includes(o)));
      const nx = `<div class="row2"><button class="btn" onclick="XTRA.spMic()"><i class="ti ti-refresh"></i> Thử lại</button><button class="btn primary" onclick="XTRA.spNext(${hit ? 1 : 0})">Từ tiếp theo</button></div>`;
      $("#spm").innerHTML = hit ? `<p class="heard good">Tốt! Máy nghe được “${esc(w)}”.</p>` + nx : conf ? `<p class="heard">Máy nghe thành <b lang="en">“${esc(conf)}”</b>.<br><span class="sm muted">${s.tip}</span></p>` + nx : `<p class="heard">Máy nghe được: ${heardQ(alts[0])}<br><span class="sm muted">Nghe mẫu chậm rồi thử lại.</span></p>` + nx;
      if (hit) beep("good"); },
    err => { if (!SPK) return; $("#spm").innerHTML = `<p class="muted c sm">${err === "no-speech" ? "Chưa nghe thấy gì. Hãy nói to và rõ hơn." : (micErrMsg(err) || "Chưa dùng được micro.")}</p><div class="row2"><button class="btn" onclick="XTRA.spMic()"><i class="ti ti-refresh"></i> Thử lại</button><button class="btn primary" onclick="XTRA.spNext(0)">Từ tiếp theo</button></div>`; }, { onpart: micLive, maxMs: 7000 }); };
  X.spNext = ok => { if (!SPK) return; if (ok) { SPK.ok++; addXP(2); } SPK.i++; render(); };
  if (typeof vReview === "function") { const r0 = vReview; vReview = function () { r0.apply(this, arguments); try {
    const c = `<section class="card row" onclick="XTRA.sounds()"><div class="ico"><i class="ti ti-ear"></i></div><div class="grow"><h3>Luyện âm khó</h3><p class="muted sm">${SOUNDS.length} âm hay đọc&nbsp;sai</p></div><i class="ti ti-chevron-right"></i></section>`;
    const bk = [...$$("#app section.card.row")].find(e => /Sổ tay/.test(e.textContent)); if (bk) bk.insertAdjacentHTML("afterend", c); else app().insertAdjacentHTML("beforeend", c);
  } catch (e) {} }; }

  /* ================= 3. Sổ từ của tôi ================= */
  let LIDX = null;
  const lidx = () => { if (!LIDX) { LIDX = new Map(); Object.keys(WMAP).forEach(k => { if (!WMAP[k].my && !LIDX.has(k.toLowerCase())) LIDX.set(k.toLowerCase(), k); }); } return LIDX; };
  const cleanEn = v => String(v || "").replace(/[“”"«»]/g, "").replace(/\s+/g, " ").trim().replace(/[.!?,;:]+$/, "").slice(0, 60);
  /* Tra Sổ từ. Chỉ coi là "khớp" khi đúng từ (hoặc chỉ khác cách viết Anh / Mỹ). Dạng chia chỉ được đưa ra làm GỢI Ý để người học
     tự xác nhận ("Có phải là …?"), không tự điền nghĩa, và chỉ theo quy tắc đúng ngữ pháp:
     - từ ngắn (≤ 3 chữ) và các từ tự đứng riêng như news, is, this, series không bị cắt đuôi;
     - -ed / -ing: thử gốc + e trước (hated → hate, hoping → hope), gốc gấp đôi phụ âm (stopped → stop); gốc trơn chỉ nhận khi không phải
       kiểu một âm tiết phụ âm–nguyên âm–phụ âm (hat + ed phải viết hatted, nên hated không thể là hat);
     - -s / -es / -ies / -ves theo đúng chính tả; không có quy tắc cắt riêng chữ "d" (seed, shed, wed không phải see, she, we);
     - động từ bất quy tắc lấy từ bảng IRR của app (went → go, is → be);
     - từ vừa là dạng chia vừa là một từ riêng (rose, saw, left, leaves…) thì hiện cả hai nghĩa để người học chọn. */
  const NOSTRIP = new Set("news is his this us bus gas yes always series species means physics mathematics economics politics athletics lens bias chaos plus thus christmas alias canvas atlas iris tennis perhaps whereas besides sometimes nowadays upstairs downstairs indoors outdoors afterwards towards hers its ours yours theirs was has does evening during ceiling nothing something anything everything morning pudding sterling herring awning bed red shed wed seed need speed feed deed bleed breed weed reed greed creed hundred naked wicked sacred kindred".split(" "));
  /* dạng trùng với một từ riêng hay gặp: nghĩa riêng của nó (hiện thành một lựa chọn) */
  const OWN = { is: "là, thì, ở (dạng của động từ be)", are: "là, thì, ở (dạng của động từ be)", am: "là, thì, ở (dạng của động từ be, đi với I)", rose: "hoa hồng", saw: "cái cưa", left: "bên trái", felt: "vải nỉ", ground: "mặt đất", wound: "vết thương", bit: "một chút", shot: "phát bắn; mũi tiêm", spoke: "nan hoa (bánh xe)", lay: "đặt, để", leaves: "những chiếc lá (số nhiều của leaf)", lives: "những cuộc sống (số nhiều của life)", means: "phương tiện, cách thức", glasses: "kính đeo mắt", clothes: "quần áo", news: "tin tức", lead: "chì (kim loại)", tear: "nước mắt", bore: "người hay vật gây chán" };
  const CVC = st => /^[^aeiou]*[aeiou][^aeiouwxy]$/.test(st);
  function inflBases(lo) {
    const out = [], add = (b, how) => { if (b && b.length >= 2 && !out.some(x => x.b === b)) out.push({ b, how }); };
    if (lo.length <= 3 || NOSTRIP.has(lo)) return out;
    let m;
    if ((m = lo.match(/^(.{2,})ies$/))) add(m[1] + "y", "pl");
    if ((m = lo.match(/^(.{2,})ves$/))) { add(m[1] + "f", "pl"); add(m[1] + "fe", "pl"); }
    if ((m = lo.match(/^(.{2,}(?:s|x|z|ch|sh|o))es$/))) add(m[1], "pl");
    if ((m = lo.match(/^(.{2,}[^s'u])s$/))) add(m[1], "pl");
    if ((m = lo.match(/^(.{2,})ied$/))) add(m[1] + "y", "ed");
    if ((m = lo.match(/^(.{2,})ying$/))) add(m[1] + "ie", "ing");
    for (const [suf, how] of [["ed", "ed"], ["ing", "ing"]]) {
      if (!(m = lo.match(new RegExp("^(.{2,})" + suf + "$")))) continue;
      const st = m[1];
      add(st + "e", how);
      if (/([^aeiouwxy])\1$/.test(st) && CVC(st.slice(0, -1))) add(st.slice(0, -1), how);
      if (!CVC(st) && !/([^aeiou])\1$/.test(st)) add(st, how);
      if (/(ll|ss|ff|zz)$/.test(st)) add(st, how); // called, missed, stuffed
    }
    return out;
  }
  const HOW = { pl: "số nhiều hoặc dạng thêm -s của", ed: "dạng quá khứ (-ed) của", ing: "dạng -ing của", irr: "một dạng chia của động từ" };
  function dictLook(q) {
    const t = cleanEn(q), lo = t.toLowerCase(), ix = lidx(); if (!t) return null;
    const us = lo.split(" ").map(w => usSpell(w)).join(" ");
    let k = ix.get(lo) || ix.get(us); if (k) return { w: WMAP[k], exact: 1 };
    if (lo.includes(" ")) return null;
    const c = [];
    const g = IRRMAP.get(lo); if (g && g[0] !== lo && ix.get(g[0])) c.push({ w: WMAP[ix.get(g[0])], how: "irr" });
    inflBases(lo).forEach(x => { const kk = ix.get(x.b); if (kk && !c.some(y => y.w.en === WMAP[kk].en)) c.push({ w: WMAP[kk], how: x.how }); });
    if (!c.length && !OWN[lo]) return null;
    return { cands: c.slice(0, 3), own: OWN[lo] || "", sug: 1 };
  }
  X._look = dictLook;
  const myFind = en => S.myw.findIndex(x => x.en.toLowerCase() === String(en).toLowerCase());
  let MYED = -1, MYQ = null;
  function myView() {
    const segs = [["words", "Từ vựng"], ["mist", "Lỗi sai"], ["gram", "Ngữ pháp"], ["my", "Sổ từ"]];
    const list = S.myw.map((x, i) => [x, i]).sort((a, b) => b[0].at - a[0].at), now = Date.now(), due = S.myw.filter(x => S.cards[x.en] && S.cards[x.en].due <= now).length;
    let h = `<header class="page"><button class="link back" onclick="nav('review')"><i class="ti ti-arrow-left"></i> Ôn tập</button><h1>Sổ tay</h1></header><div class="seg big">${segs.map(x => `<button class="${BK.seg === x[0] ? "on" : ""}" onclick="BK.seg='${x[0]}';render()">${x[1]}</button>`).join("")}</div>`;
    h += `<section class="card set myadd"><label for="myen">Ghi lại từ bạn gặp ngoài đời</label><p class="sm muted">Gặp một từ tiếng Anh trên biển hiệu, bao bì, phim hay bài hát? Gõ vào đây, app sẽ tra nghĩa và nhắc bạn ôn.</p>
      <input class="inp" id="myen" placeholder="Ví dụ: take away" autocapitalize="off" autocomplete="off" spellcheck="false" lang="en" enterkeyhint="search" onkeydown="if(event.key==='Enter'){event.preventDefault();XTRA.myLook()}" oninput="$('#myerr').textContent=''" value="${esc(MYQ ? MYQ.q : "")}">
      <p class="err" id="myerr"></p><button class="btn primary full" onclick="XTRA.myLook()"><i class="ti ti-search"></i> Tra nghĩa</button><div id="mylk">${MYQ ? lookHtml() : ""}</div></section>`;
    if (list.length) {
      h += `<div class="row between myhd"><h4 class="sec">Từ của tôi (${list.length})</h4></div>` + (due ? `<button class="btn primary full" onclick="XTRA.myReview()"><i class="ti ti-player-play"></i> Ôn ${Math.min(due, 20)} từ đến hạn</button>` : "");
      h += list.map(([x, i]) => { const c = S.cards[x.en], w = WMAP[x.en], ipa = w && w.ipa;
        if (MYED === i) return `<div class="word myw edit"><div class="grow"><b lang="en">${esc(x.en)}</b>${x.app ? `<span class="vi">${esc(x.vi)}</span><small class="muted">Nghĩa lấy từ từ điển của app</small>` : `<label class="sm" for="mev">Nghĩa tiếng Việt</label><input class="inp sm" id="mev" value="${esc(x.vi)}">`}<label class="sm" for="men">Gặp ở đâu? <span class="muted nw">(không bắt buộc)</span></label><input class="inp sm" id="men" value="${esc(x.note)}" placeholder="Ví dụ: biển hiệu quán cà phê"><p class="err" id="mederr"></p><div class="row2"><button class="btn" onclick="XTRA.myEdit(-1)">Hủy</button><button class="btn primary" onclick="XTRA.mySave(${i})">Lưu</button></div></div></div>`;
        const dd = c ? Math.ceil((c.due - now) / DAY) : null;
        return `<div class="word myw">${spk(x.en)}<div class="grow"><b lang="en">${esc(x.en)}</b>${ipa ? `<span class="ipa">/${esc(ipa)}/</span>` : ""}<span class="vi">${esc(x.vi)}</span>${x.note ? `<small class="mynote"><i class="ti ti-map-pin"></i>${esc(x.note)}</small>` : ""}<small class="muted mydue">${!c ? "" : c.due <= now ? "Đến hạn ôn" : dd <= 1 ? "Ôn lại ngày mai" : `Ôn lại sau ${dd}&nbsp;ngày`}</small></div><span class="myact"><button class="ib" aria-label="Sửa ${esc(x.en)}" onclick="XTRA.myEdit(${i})"><i class="ti ti-pencil"></i></button><button class="ib" aria-label="Xóa ${esc(x.en)}" onclick="XTRA.myDel(${i})"><i class="ti ti-trash"></i></button></span></div>`; }).join("");
    } else h += `<section class="card c myempty"><i class="ti ti-notebook bigi"></i><p>Sổ từ còn trống. Từ bạn ghi lại sẽ hiện ở đây và tự vào mục Ôn tập.</p></section>`;
    app().innerHTML = h;
  }
  function lookHtml() {
    const q = MYQ, r = q.r, ex = myFind(r && r.exact ? r.w.en : q.q);
    if (ex >= 0) return `<p class="sm mymsg">“${esc(S.myw[ex].en)}” đã có trong sổ của bạn.</p><button class="btn full" onclick="XTRA.myEdit(${ex})"><i class="ti ti-pencil"></i> Sửa từ này</button>`;
    const en = r && r.exact ? r.w.en : q.q, w = r && r.exact ? r.w : null;
    // gợi ý (không tự điền): mỗi lựa chọn là một nút, bấm vào mới điền nghĩa vào ô để người học xem lại rồi lưu
    const opts = r && r.sug ? r.cands.map(c => ({ vi: c.w.vi.split("; ")[0], html: `${HOW[c.how]} <b lang="en">${esc(c.w.en)}</b>: ${esc(c.w.vi.split("; ")[0])}` }))
      .concat(r.own ? [{ vi: r.own, html: `<b lang="en">${esc(q.q)}</b>: ${esc(r.own)}` }] : []) : [];
    SUG = opts.map(o => o.vi);
    const sug = opts.length ? `<div class="mysug"><p class="sm mymsg">Từ điển của app chưa có đúng từ <b lang="en">“${esc(q.q)}”</b>. ${opts.length > 1 ? "Có phải là một trong các nghĩa này? Bấm để chọn:" : "Có phải là:"}</p>${opts.map((o, i) => `<button class="btn full mysugb" onclick="XTRA.mySug(${i})"><span>${o.html}</span></button>`).join("")}<p class="sm muted">Chọn xong, hãy xem lại nghĩa trong ô bên dưới cho đúng với chỗ bạn gặp từ này. Không đúng thì tự gõ nghĩa.</p></div>` : "";
    return `<div class="word mypre">${spk(en)}<div class="grow"><b lang="en">${esc(en)}</b>${w && w.ipa ? `<span class="ipa">/${esc(w.ipa)}/</span>` : ""}${w ? `<span class="vi">${esc(w.vi)}</span>` : ""}</div></div>
      ${w ? `<p class="sm good mymsg"><i class="ti ti-circle-check"></i> Có trong từ điển của app.</p>` : sug || `<p class="sm mymsg">Chưa có trong từ điển của app.<br>Hãy gõ nghĩa tiếng&nbsp;Việt để lưu.</p>`}
      ${w ? "" : `<label class="sm" for="myvi">Nghĩa tiếng Việt</label><input class="inp sm" id="myvi" value="" placeholder="${opts.length ? "Chọn gợi ý ở trên hoặc tự gõ" : "Ví dụ: mang đi"}" oninput="$('#myverr').textContent=''">`}<p class="err" id="myverr"></p>
      <label class="sm" for="mynote">Gặp ở đâu? <span class="muted nw">(không bắt buộc)</span></label><input class="inp sm" id="mynote" placeholder="Ví dụ: biển hiệu quán cà phê">
      <button class="btn primary full" onclick="XTRA.myAdd()"><i class="ti ti-plus"></i> Lưu vào sổ và ôn tập</button>`;
  }
  let SUG = [];
  X.mySug = i => { const v = SUG[i], e = $("#myvi"); if (v === undefined || !e) return; e.value = v; $$(".mysugb").forEach((b, k) => b.classList.toggle("on", k === i)); const r = $("#myverr"); if (r) r.textContent = ""; e.focus(); };
  X.myLook = () => { const i = $("#myen"), v = cleanEn(i && i.value); if (!v) { $("#myerr").textContent = "Hãy gõ một từ hoặc cụm từ tiếng Anh."; return; } if (!/[a-z]/i.test(v) || VI_CH.test(v)) { $("#myerr").textContent = "Hãy gõ từ tiếng Anh (không dấu tiếng Việt)."; return; } MYQ = { q: v, r: dictLook(v) }; MYED = -1; $("#mylk").innerHTML = lookHtml(); };
  X.myAdd = (en0, vi0, note0) => {
    if (!MYQ && !en0) return; const r = en0 ? dictLook(en0) : MYQ.r, exact = r && r.exact;
    const en = exact ? r.w.en : cleanEn(en0 || MYQ.q), vi = exact ? r.w.vi : String(vi0 !== undefined ? vi0 : ($("#myvi") || {}).value || "").trim().slice(0, 120), note = String(note0 !== undefined ? note0 : ($("#mynote") || {}).value || "").trim().slice(0, 120);
    if (!vi) { const e = $("#myverr"); if (e) e.textContent = $(".mysugb") ? "Hãy bấm chọn một gợi ý ở trên, hoặc tự gõ nghĩa tiếng Việt." : "Hãy gõ nghĩa tiếng Việt."; return false; }
    if (myFind(en) >= 0) return false;
    const x = { en, vi, note, at: Date.now(), app: exact ? 1 : 0, mk: S.cards[en] ? 0 : 1 }; S.myw.push(x); regMy([x]);
    if (!S.cards[en]) S.cards[en] = { vi, box: 0, due: Date.now() };
    save(); MYQ = null; if (TAB === "book" && !P && !VIEW) { render(); toast(`Đã lưu “${esc(en)}”.<br>Từ này sẽ hiện trong Ôn tập.`); } return true;
  };
  X.myEdit = i => { MYED = i; MYQ = null; render(); const e = $("#mev") || $("#men"); if (e) e.focus(); };
  X.mySave = i => { const x = S.myw[i]; if (!x) return; const vi = $("#mev") ? $("#mev").value.trim().slice(0, 120) : x.vi; if (!vi) { $("#mederr").textContent = "Nghĩa không được để trống."; return; }
    x.vi = vi; x.note = ($("#men").value || "").trim().slice(0, 120); x.at = Date.now();
    if (!x.app) { if (WMAP[x.en] && WMAP[x.en].my) WMAP[x.en].vi = vi; if (S.cards[x.en]) S.cards[x.en].vi = vi; }
    MYED = -1; save(); render(); toast("Đã lưu thay đổi"); };
  X.myDel = i => { const x = S.myw[i]; if (!x) return; modal("Xóa khỏi sổ từ?", `Xóa <b>“${esc(x.en)}”</b> khỏi Sổ từ của bạn.`, "Xóa", () => { X.myRemove(x.en); render(); }, true, "Giữ lại"); };
  X.myRemove = en => { const i = myFind(en); if (i < 0) return; const x = S.myw[i]; S.myw.splice(i, 1);
    if (!x.app) { if (WMAP[x.en] && WMAP[x.en].my) delete WMAP[x.en]; delete S.cards[x.en]; delete S.mistakes[x.en]; }
    else if (x.mk && S.cards[x.en] && !(WMAP[x.en] && S.done[WMAP[x.en].lid])) delete S.cards[x.en];
    MYED = -1; save(); };
  X.myReview = () => { const now = Date.now(), ks = S.myw.map(x => x.en).filter(k => S.cards[k] && S.cards[k].due <= now).slice(0, 20); if (!ks.length) { toast("Chưa có từ nào đến hạn"); return; }
    newP("review", shuffle(ks).map((k, i) => { const w = WMAP[k] || { en: k, vi: S.cards[k].vi }, s = i % 2 ? mqReverse(w, poolW(w)) : mqMeaning(w, poolW(w)); s.card = k; return s; })); };
  if (typeof vBook === "function") { const b0 = vBook; vBook = function () { if (BK.seg === "my") return myView(); MYQ = null; MYED = -1; b0.apply(this, arguments); try { const sg = $("#app .seg.big"); if (sg && !sg.querySelector("[data-my]")) sg.insertAdjacentHTML("beforeend", `<button data-my="1" onclick="BK.seg='my';render()">Sổ từ</button>`); } catch (e) {} }; }

  /* ================= 6. Thi đua cả nhà ================= */
  const mondayKey = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return dkey(d); };
  const xpWeek = () => { const m = mondayKey(); return Object.keys(S.log).filter(k => k >= m).reduce((a, k) => a + (+S.log[k].xp || 0), 0); };
  X._xpWeek = xpWeek;
  const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rshuf = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  /* 10 câu chọn nghĩa từ một hạt giống: từ lấy trong kho của người gửi, phương án nhiễu lấy trong từ điển của app */
  function makeQs(seed) {
    const r = rng(seed), pool = rshuf(gamePool(12).filter(w => !w.my && w.vi && !/^-|-$/.test(w.en)), r).slice(0, 10);
    return pool.map(w => { const lo = w.en.toLowerCase(), mine = ALLW.filter(x => x.en.toLowerCase() === lo).concat(w).flatMap(x => glossParts(x.vi)), ok1 = x => x.en.toLowerCase() !== lo && !never(w.en, x.en) && !glossParts(x.vi).some(g => mine.includes(g)) && !nearAny(x.vi, mine);
      let cand = poolFor(w).filter(ok1); if (new Set(cand.map(x => x.vi.split("; ")[0])).size < 3) cand = ALLW.filter(ok1);
      const ds = []; const seen = new Set(); for (const x of rshuf(cand, r)) { const t = x.vi.split("; ")[0]; if (!seen.has(t) && t !== w.vi.split("; ")[0]) { seen.add(t); ds.push(t); } if (ds.length === 3) break; }
      const o = rshuf([w.vi.split("; ")[0], ...ds], r); return [w.en, o, o.indexOf(w.vi.split("; ")[0])]; });
  }
  X._makeQs = makeQs;
  const myName = () => S.name || "";
  let DU = null; const DUEL_XP_DAY = 3;
  const stTxt = (st, nm) => st > 0 ? `${nm} đang có <span class="nw">chuỗi <b>${st}&nbsp;ngày</b> học</span> · ` : `${nm} có `;
  X.duelNew = () => { if (!duelName()) return; const seed = (Math.random() * 2 ** 31) | 0; DU = { mode: "new", id: seed.toString(36), q: makeQs(seed) }; duelPlay(); };
  function duelName() { const i = $("#duname"); if (i) { const v = i.value.trim().slice(0, 40); if (!v) { const e = $("#duerr"); if (e) e.textContent = "Hãy nhập tên để người nhận biết ai thách."; i.focus(); return false; } if (v !== S.name) { S.name = v; save(); } } return true; }
  function duelPlay() {
    const steps = DU.q.map(x => ({ type: "mcq", sk: "vocab", label: "Chọn nghĩa đúng", q: x[0], audio: x[0], o: x[1].slice(), a: x[2], mk: x[0], fix: "~duel" }));
    newP("duel", steps, { duel: DU, t0: Date.now() });
  }
  const winner = (a, b) => a.sc !== b.sc ? (a.sc > b.sc ? 1 : -1) : Math.abs(a.t - b.t) < 500 ? 0 : a.t < b.t ? 1 : -1;
  const vsHtml = (me, them, nm) => { const w = winner(me, them); return `<div class="vs"><div class="vsc ${w > 0 ? "win" : ""}"><small>Bạn</small><b>${me.sc}/10</b><span>${fmtT(me.t)}</span>${w > 0 ? '<i class="ti ti-crown"></i>' : ""}</div><div class="vsc ${w < 0 ? "win" : ""}"><small>${esc(nm)}</small><b>${them.sc}/10</b><span>${fmtT(them.t)}</span>${w < 0 ? '<i class="ti ti-crown"></i>' : ""}</div></div><p class="vsr">${w > 0 ? "Bạn thắng!" : w < 0 ? `${esc(nm)} thắng lần này.` : "Hai bên hòa nhau!"}</p>`; };
  async function duelLink(payload) { return BASE + "#thach=" + await pack(payload); }
  X._duelLink = duelLink;
  function duelDone() {
    const p = P, d = p.duel, me = { sc: p.ok, t: p.steps.filter(s => !s.r).reduce((a, s) => a + (s.dt || 0), 0) };
    /* XP thi đua: +2 mỗi câu đúng, +5 khi chơi xong, chỉ 3 lần đầu mỗi ngày (chơi thêm vẫn được, nhưng không cộng XP) */
    tick(); const td = today(); if (S.chal.xd !== td) { S.chal.xd = td; S.chal.xn = 0; }
    const xpOn = S.chal.xn < DUEL_XP_DAY, gained = xpOn ? me.sc * 2 + 5 : 0; S.chal.xn++; if (gained) addXP(gained); P = null;
    const base = { k: "d", v: 1, id: d.id, n: myName() || "Bạn", st: streak(), wx: xpWeek(), q: d.q, sc: me.sc, t: me.t, at: Date.now() };
    let head, payload, ttl, txt;
    if (d.mode === "new") { S.chal.sent = S.chal.sent.filter(x => x.id !== d.id).concat({ id: d.id, at: Date.now(), me }).slice(-20); payload = base; head = `<h1>Bạn đúng ${me.sc}/10 câu</h1><p class="muted">Thời gian trả lời: ${fmtT(me.t)}.<br>Gửi lời thách cho người thân để xem ai giỏi hơn!</p>`; ttl = "Thách đấu từ vựng tiếng Anh"; txt = `${base.n} thách bạn thi 10 câu từ vựng tiếng Anh! ${base.n} đúng ${me.sc}/10 câu. Bấm vào liên kết để chơi:`; }
    else { const g = S.chal.got.find(x => x.id === d.id && !x.rep); if (g) g.me = me; payload = Object.assign(base, { re: { n: d.n, sc: d.them.sc, t: d.them.t } }); head = `<h1>Kết quả thi đua</h1>${vsHtml(me, d.them, d.n)}`; ttl = "Kết quả thi đua"; txt = `${base.n} đã nhận lời thách: đúng ${me.sc}/10 câu. Bấm để xem kết quả:`; }
    save();
    app().innerHTML = `<div class="donescr duelend"><div class="ring xl" style="--p:${me.sc * 10}"><span>${me.sc}/10</span></div>${head}${gained ? `<p class="xpbig">+${gained} XP</p>` : `<p class="sm muted">Hôm nay bạn đã nhận XP từ ${DUEL_XP_DAY} lần thi đua.<br>Các lần sau chơi để vui, không cộng thêm XP.</p>`}<section class="card set dushare"><p class="lab"><i class="ti ti-send"></i>${d.mode === "new" ? "Gửi lời thách" : `Gửi kết quả cho ${esc(d.n)}`}</p><div id="dushare"><p class="sm muted c">Đang tạo liên kết…</p></div></section><div class="stack"><button class="btn full" onclick="XTRA.duels()"><i class="ti ti-trophy"></i> Bảng thi đua</button><button class="btn full" onclick="nav('home')">Về trang chủ</button></div></div>`;
    document.body.classList.add("playing"); beep("done"); if (me.sc >= 8) confetti(); checkBadges(); checkDay();
    duelLink(payload).then(u => { const b = $("#dushare"); if (b) b.innerHTML = shareBox(u, ttl, txt, d.mode === "new" ? "Người nhận mở camera, quét mã này là chơi được ngay." : "Người nhận quét mã này để xem kết quả."); }).catch(() => { const b = $("#dushare"); if (b) b.innerHTML = `<p class="err">Chưa tạo được liên kết trên trình duyệt này.</p>`; });
  }
  async function duelOpen(data) {
    let o; try { o = await unpack(String(data || "").replace(/[^A-Za-z0-9_-]/g, "")); if (obj(o) && o.k === "d" && +o.v > 1) throw new Error("new"); if (!obj(o) || o.k !== "d" || !okId(o.id) || !okQ(o.q)) throw 0; } catch (e) {
      const m = e && e.message; toast(m === "old" ? "Trình duyệt này cũ nên chưa mở được lời thách.<br>Hãy cập nhật iPhone (iOS 16.4 trở lên)." : m === "new" ? "Lời thách được tạo từ bản app mới hơn.<br>Hãy kéo trang xuống để tải lại (cập nhật app), rồi mở lại liên kết." : "Liên kết thách đấu bị hỏng.<br>Hãy nhờ người gửi gửi lại.", 7000); return; }
    const id = o.id, nm = str(o.n, 40) || "Bạn của bạn", them = { sc: num(o.sc, 0, 0, 10) | 0, t: num(o.t, 0, 0, 36e5) | 0 }, st = num(o.st, 0, 0, 1e4) | 0, wx = num(o.wx, 0, 0, 1e7) | 0;
    if (o.re) { // trả lời cho lời thách mình đã gửi
      const mine = { sc: num(o.re.sc, 0, 0, 10) | 0, t: num(o.re.t, 0, 0, 36e5) | 0 };
      S.chal.got = S.chal.got.filter(x => !(x.id === id && x.rep && x.n === nm)).concat({ id, n: nm, st, wx, at: Date.now(), them, me: mine, rep: 1, q: [] }).slice(-20); save();
      showDuel(() => `${vTop("XTRA.duels()", "Thi đua cả nhà")}<div class="duin"><h1><span class="nw">${esc(nm)}</span> đã nhận lời thách!</h1><p class="muted">${stTxt(st, esc(nm))}<span class="nw"><b>${wx}&nbsp;XP</b> tuần&nbsp;này</span>.</p>${vsHtml(mine, them, nm)}<button class="btn primary full lg" onclick="XTRA.duelNewView()"><i class="ti ti-swords"></i> Thách lại bằng đề mới</button><button class="btn full" onclick="XTRA.duels()"><i class="ti ti-trophy"></i> Bảng thi đua</button></div>`);
      return;
    }
    if (S.chal.sent.some(x => x.id === id)) { showDuel(() => `${vTop("XTRA.duels()", "Thi đua cả nhà")}<div class="duin"><h1>Đây là lời thách của chính bạn</h1><p class="muted">Hãy gửi liên kết này cho người thân để họ chơi cùng đề.</p><button class="btn full" onclick="XTRA.duels()"><i class="ti ti-trophy"></i> Bảng thi đua</button></div>`); return; }
    let g = S.chal.got.find(x => x.id === id && !x.rep);
    if (!g) { g = { id, n: nm, st, wx, at: Date.now(), them, me: null, rep: 0, q: cleanQ(o.q) }; S.chal.got = S.chal.got.concat(g).slice(-20); save(); }
    X.duelIntro(id);
  }
  X._duelOpen = duelOpen;
  function showDuel(html) { const fn = () => { app().innerHTML = html(); }; toastOff(); P = null; VIEW = fn; if (S.onb) render(); else { document.body.classList.add("playing"); fn(); } window.scrollTo(0, 0); }
  X.duelIntro = id => { const g = S.chal.got.find(x => x.id === id && !x.rep); if (!g) return X.duels();
    showDuel(() => `${vTop("XTRA.duels()", "Thi đua cả nhà")}<div class="duin"><div class="duav"><i class="ti ti-swords"></i></div><h1><span class="nw">${esc(g.n)}</span> thách bạn!</h1>
      <p class="muted">${g.st > 0 ? `Chuỗi <b class="nw">${g.st} ngày</b> học · ` : ""}<span class="nw"><b>${g.wx}&nbsp;XP</b> tuần&nbsp;này</span></p>${g.me ? "" : wrongPlace("duel")}
      <section class="card"><p class="duline">${esc(g.n)} đúng <b>${g.them.sc}/10</b> câu trong <b class="nw">${fmtT(g.them.t)}</b>.</p><p class="sm muted">Bạn sẽ chơi đúng 10 câu chọn nghĩa từ vựng mà ${esc(g.n)} đã chơi. Ai đúng nhiều câu hơn sẽ thắng; bằng điểm thì ai nhanh hơn sẽ&nbsp;thắng.</p></section>
      ${g.me ? `${vsHtml(g.me, g.them, g.n)}<button class="btn primary full lg" onclick="XTRA.duelReplyAgain('${jsq(g.id)}')"><i class="ti ti-send"></i> Gửi lại kết quả</button>` : `${S.name ? "" : `<label class="sm dulab" for="duname">Tên của bạn (để ${esc(g.n)} biết ai trả lời)</label><input class="inp" id="duname" placeholder="Ví dụ: Lan" maxlength="40"><p class="err" id="duerr"></p>`}<button class="btn primary full lg" onclick="XTRA.duelAccept('${jsq(g.id)}')"><i class="ti ti-player-play"></i> Nhận lời thách</button>`}
      <button class="btn full" onclick="XTRA.duels()"><i class="ti ti-trophy"></i> Bảng thi đua</button></div>`); };
  X.duelAccept = id => { const g = S.chal.got.find(x => x.id === id && !x.rep); if (!g || !okQ(g.q)) return; if (!duelName()) return; DU = { mode: "answer", id, q: g.q, n: g.n, them: g.them }; duelPlay(); };
  X.duelReplyAgain = id => { const g = S.chal.got.find(x => x.id === id && !x.rep); if (!g || !g.me) return;
    showDuel(() => `${vTop("XTRA.duels()", "Thi đua cả nhà")}<div class="duin"><h1>Gửi kết quả cho <span class="nw">${esc(g.n)}</span></h1>${vsHtml(g.me, g.them, g.n)}<section class="card set"><div id="dushare"><p class="sm muted c">Đang tạo liên kết…</p></div></section></div>`);
    duelLink({ k: "d", v: 1, id: g.id, n: myName() || "Bạn", st: streak(), wx: xpWeek(), q: g.q, sc: g.me.sc, t: g.me.t, at: Date.now(), re: { n: g.n, sc: g.them.sc, t: g.them.t } }).then(u => { const b = $("#dushare"); if (b) b.innerHTML = shareBox(u, "Kết quả thi đua", `${myName() || "Mình"} đã nhận lời thách: đúng ${g.me.sc}/10 câu.`, "Người nhận quét mã này để xem kết quả."); }); };
  X.duelNewView = () => showDuel(() => `${vTop("XTRA.duels()", "Thi đua cả nhà")}<div class="duin"><h1>Tạo lời thách mới</h1><p class="muted">Bạn chơi trước <span class="nw">10 câu từ vựng</span>,<br>rồi gửi liên kết để người&nbsp;thân chơi&nbsp;lại.</p>
      <label class="sm dulab" for="duname">Tên hiển thị trong lời thách</label><input class="inp" id="duname" value="${esc(S.name || "")}" placeholder="Ví dụ: Hà" maxlength="40"><p class="err" id="duerr"></p>
      <button class="btn primary full lg" onclick="XTRA.duelNew()"><i class="ti ti-player-play"></i> Chơi và tạo lời thách</button></div>`);
  X.duels = () => showDuel(() => {
    const got = S.chal.got.slice().reverse();
    return `${vTop("nav('play')", "Thi đua cả nhà")}<p class="muted lead2">Thách người thân cùng chơi 10 câu từ vựng. Không cần tài khoản: chỉ cần gửi liên kết qua Zalo hoặc cho quét mã QR.</p>
      <div class="stats"><div><b>${streak()}</b><span>ngày liên tiếp</span></div><div><b>${xpWeek()}</b><span>XP tuần này</span></div><div><b>${got.filter(g => g.me && winner(g.me, g.them) > 0).length}</b><span>lần thắng</span></div></div>
      <button class="btn primary full lg" onclick="XTRA.duelNewView()"><i class="ti ti-swords"></i> Tạo lời thách mới</button>
      <h4 class="sec">Bảng thi đua</h4>${got.length ? got.map(g => { const w = g.me ? winner(g.me, g.them) : null;
        return `<section class="card duc"><div class="row"><span class="duav sm"><i class="ti ti-user"></i></span><div class="grow"><b>${esc(g.n)}</b><small class="muted">${g.st > 0 ? `<span class="nw">chuỗi ${g.st}&nbsp;ngày</span> · ` : ""}<span class="nw">${g.wx}&nbsp;XP&nbsp;tuần</span></small></div>${w === null ? '<span class="pill">Chưa chơi</span>' : `<span class="pill ${w > 0 ? "good" : w < 0 ? "bad" : ""}">${w > 0 ? "Bạn thắng" : w < 0 ? "Bạn thua" : "Hòa"}</span>`}</div>
          <p class="sm duline">${g.rep ? `Trả lời lời thách của bạn.<br>` : ""}${esc(g.n)}: <b>${g.them.sc}/10</b> · <span class="nw">${fmtT(g.them.t)}</span>${g.me ? `<br>Bạn: <b>${g.me.sc}/10</b> · <span class="nw">${fmtT(g.me.t)}</span>` : ""}</p>${!g.rep && !g.me ? `<button class="btn primary full" onclick="XTRA.duelIntro('${jsq(g.id)}')"><i class="ti ti-player-play"></i> Chơi ngay</button>` : ""}</section>`; }).join("")
        : `<section class="card c"><i class="ti ti-trophy bigi"></i><p>Chưa có lời thách nào.<br>Kết quả thi đua sẽ hiện ở&nbsp;đây.</p></section>`}`;
  });
  if (typeof vPlay === "function") { const p0 = vPlay; vPlay = function () { p0.apply(this, arguments); try { const n = $("#app .note"), c = `<button class="gcard g5" onclick="XTRA.duels()"><span class="gemo">🏆</span><span class="grow"><b>Thi đua cả nhà</b><small>Gửi 10 câu từ vựng cho người&nbsp;thân qua Zalo, xem ai giỏi&nbsp;hơn.</small><em>${S.chal.got.length ? S.chal.got.length + " lời thách" : "Không cần tài khoản"}</em></span><i class="ti ti-chevron-right"></i></button>`; if (n) n.insertAdjacentHTML("beforebegin", c); else app().insertAdjacentHTML("beforeend", c); } catch (e) {} }; }

  /* ================= Hồ sơ: cỡ chữ, chuyển máy ================= */
  if (typeof vMe === "function") { const m0 = vMe; vMe = function () { m0.apply(this, arguments); try {
    const sw = $("#app .swatches"); if (sw) sw.insertAdjacentHTML("afterend", `<label id="fzlab">Cỡ chữ</label><div class="seg fzseg" role="radiogroup" aria-labelledby="fzlab">${FZ.map(f => `<button class="${S.settings.fz === f[0] ? "on" : ""}" role="radio" aria-checked="${S.settings.fz === f[0]}" onclick="XTRA.setFz('${f[0]}')">${f[1]}</button>`).join("")}</div><p class="sm muted fzprev">Áp dụng cho chữ trong toàn bộ ứng dụng.</p>`);
    const bk = [...$$("#app h4.sec")].find(h => /Sao lưu/.test(h.textContent));
    const sa = isStandalone(), paste = `<div class="xpaste${sa ? " xpaste-on" : ""}"><p class="lab"><i class="ti ti-clipboard"></i>Dán liên kết</p><p class="sm muted">${sa ? "Bạn đang dùng app đã cài. Nhận tiến độ từ máy cũ ở đây: chép liên kết trong tin nhắn Zalo rồi dán vào ô này." : "Dùng khi app đã cài lên màn&nbsp;hình&nbsp;chính, hoặc khi bấm liên kết mà app không mở: chép liên kết rồi dán vào&nbsp;đây."}</p><textarea id="xpin" rows="2" placeholder="Dán liên kết bắt đầu bằng https://" oninput="$('#xperr').textContent=''"></textarea><p class="err" id="xperr"></p><button class="btn${sa ? " primary" : ""} full" onclick="XTRA.pasteGo()"><i class="ti ti-download"></i> Nhận từ liên kết</button></div>`;
    const xs = `<h4 class="sec">Chuyển sang máy khác</h4><section class="card set xfer">${sa ? paste : ""}<p class="lab"><i class="ti ti-devices"></i>Gửi tiến độ từ máy này</p><ol class="steps3"><li>Bấm <b>Tạo liên kết</b> ở máy này.</li><li>Gửi liên kết qua Zalo cho chính mình, hoặc quét mã&nbsp;QR ở máy&nbsp;kia.</li><li><b>Ở máy kia</b>, nếu đã cài app lên màn hình chính: mở app, vào <b>Hồ sơ › Chuyển sang máy khác</b>, dán liên kết vào ô <b>Dán liên kết</b>.</li><li>Nếu máy kia chưa cài app: trong Zalo bấm dấu <b>•••</b> ở góc trên, chọn <b>Mở bằng trình duyệt</b>.</li><li>Chọn <b>Gộp</b> hoặc <b>Thay thế</b> là xong.</li></ol><button class="btn primary full" onclick="XTRA.xferMake()"><i class="ti ti-devices"></i> Tạo liên kết</button><div id="xfer" aria-live="polite"></div>${sa ? "" : paste}</section>`;
    if (bk) bk.insertAdjacentHTML("beforebegin", xs);
  } catch (e) {} }; }

  return X;
})();
