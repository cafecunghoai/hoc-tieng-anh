"use strict";
/* ================== Tiếng Anh Từ Số 0 ================== */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const app = () => $("#app");
const DAY = 86400000, INT = [0, 1, 2, 4, 7, 15, 30, 60], KEY = "hoc_tieng_anh_v1";
const SK = { vocab: "Từ vựng", gram: "Ngữ pháp", listen: "Nghe", speak: "Nói", read: "Đọc", write: "Viết" };
const SKI = { vocab: "cards", gram: "abc", listen: "headphones", speak: "microphone", read: "book", write: "pencil" };

/* ---------- Dữ liệu bài học ---------- */
const LES = {}, ORDER = [];
STAGES.forEach(st => st.lessons.forEach((L, i) => {
  L.id = st.id + "-" + (i + 1); L.stage = st.id; L.no = i + 1;
  L.W = L.w.split(";").map(x => { const p = x.split("="), en = p[0].trim(), uk = (p[2] || "").trim(); return { en, vi: (p[1] || "").trim(), ipaUK: uk, get ipa() { let us = false; try { us = /US/.test(S.settings.accent); } catch (e) {} return uk && us && IPA_US[en] ? IPA_US[en] : uk; } }; });
  L.S = (L.s || []).map(x => { const p = x.split("|"); return { en: p[0], vi: p[1] }; });
  if (typeof WRITING !== "undefined" && WRITING[L.id]) { const w = WRITING[L.id]; L.WR = { p: w[0], kw: w[1].split(";"), min: w[2], model: w[3] }; }
  LES[L.id] = L; ORDER.push(L.id);
}));
const ALLW = [], WMAP = {};
ORDER.forEach(id => { const L = LES[id]; if (L.kind !== "letters") L.W.forEach(w => { if (!WMAP[w.en]) { WMAP[w.en] = Object.assign({ lid: id }, w); ALLW.push(WMAP[w.en]); } else { const a = WMAP[w.en].vi.toLowerCase(), b = w.vi.toLowerCase(); if (!glossParts(a).some(g => glossParts(b).includes(g)) && !a.includes(b) && !b.includes(a)) WMAP[w.en].vi += "; " + w.vi; } }); });
const stageOf = id => STAGES.find(s => s.id === id);
const VIMAP = {}; ALLW.forEach(w => (VIMAP[w.vi] = VIMAP[w.vi] || new Set()).add(w.en));
{ const seen = new Set(); STAGES.forEach(st => { st.lessons.forEach(L => { if (L.kind !== "letters") L.W.forEach(w => seen.add(w.en)); }); if (st.lessons.length) st.words = "~" + (Math.round(seen.size / 50) * 50).toLocaleString("vi-VN") + " từ"; }); }

/* ---------- Trạng thái ---------- */
function def() {
  return { v: 2, onb: false, done: {}, unlocked: {}, cards: {}, days: {}, log: {}, stagePassed: {}, placement: null, xp: 0, badges: {},
    cnt: { speak: 0, write: 0, review: 0, perfect: 0 }, skill: {}, mistakes: {}, resume: null, dayDone: {}, hideInstall: false, game: { best: {}, post: {}, plays: 0 }, gram: {}, exams: {}, certs: {}, name: "", placeStart: "", voiceWarned: 0, mockOpen: null, _rev: 0, _wipe: 0,
    settings: { rate: 0.9, accent: "en-US", goal: 60, theme: "light", th2: 1, accent2: "ngoc", sound: true } };
}
const ACCENTS = [["ngoc", "Xanh ngọc"], ["bien", "Xanh biển"], ["tim", "Oải hương"], ["hong", "Hồng đào"], ["cam", "Hoàng hôn"], ["son", "Đỏ son"], ["la", "Xanh lá mạ"], ["nau", "Nâu cà phê"]];
function merge(x) { const d = def(); Object.keys(d).forEach(k => { if (x[k] !== undefined) d[k] = (typeof d[k] === "object" && d[k] && !Array.isArray(d[k]) && k !== "resume") ? Object.assign(d[k], x[k]) : x[k]; }); if (Object.keys(d.done).length) d.onb = true; return sanitize(d); }
function sanitize(d) {
  const num = (v, df, lo, hi) => { v = +v; return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : df; };
  d.xp = num(d.xp, 0, 0, 1e9); d.name = String(d.name || "").slice(0, 60);
  d.settings.goal = [15, 30, 60, 90].includes(+d.settings.goal) ? +d.settings.goal : 60;
  d.settings.rate = num(d.settings.rate, 0.9, 0.6, 1.2);
  d.settings.accent = d.settings.accent === "en-GB" ? "en-GB" : "en-US";
  // học tập cần giao diện sáng, thoáng: mặc định là Sáng, không tự theo chế độ tối của điện thoại (vẫn chọn Tối / Tự động được)
  if (d.settings.th2 !== 1) { if (d.settings.theme === "auto") d.settings.theme = "light"; d.settings.th2 = 1; }
  d.settings.theme = ["auto", "light", "dark"].includes(d.settings.theme) ? d.settings.theme : "light";
  d.settings.accent2 = ACCENTS.some(a => a[0] === d.settings.accent2) ? d.settings.accent2 : "ngoc";
  d.settings.sound = !!d.settings.sound;
  Object.keys(d.cards).forEach(k => { const c = d.cards[k]; if (!c || typeof c !== "object") { delete d.cards[k]; return; } c.box = num(c.box, 0, 0, 7) | 0; c.due = num(c.due, Date.now(), 0, 9e15); c.vi = String(c.vi || ""); });
  Object.keys(d.days).forEach(k => d.days[k] = num(d.days[k], 0, 0, 86400));
  Object.keys(d.done).forEach(k => { const v = d.done[k]; if (!v || typeof v !== "object") { delete d.done[k]; return; } v.best = num(v.best, 0, 0, 100); });
  const fixA = a => { if (!a || typeof a !== "object") return; a.overall = num(a.overall, 0, 0, 100); a.skills = a.skills && typeof a.skills === "object" ? a.skills : {}; Object.keys(a.skills).forEach(k => a.skills[k] = num(a.skills[k], 0, 0, 100)); };
  Object.values(d.exams).forEach(arr => Array.isArray(arr) && arr.forEach(fixA)); Object.values(d.certs).forEach(fixA);
  Object.values(d.exams).forEach(arr => Array.isArray(arr) && arr.forEach(a => { if (a && typeof a === "object") a.at = num(a.at, 0, 0, 9e15); }));
  Object.keys(d.exams).forEach(k => { if (!Array.isArray(d.exams[k])) delete d.exams[k]; else d.exams[k] = d.exams[k].filter(a => a && typeof a === "object"); });
  Object.keys(d.certs).forEach(k => { const c = d.certs[k]; if (!c || typeof c !== "object") delete d.certs[k]; else c.at = num(c.at, 0, 0, 9e15); });
  /* Điểm ngữ pháp lưu dạng số (bản cũ có thể là { best }) */
  Object.keys(d.gram).forEach(k => { const g = d.gram[k]; d.gram[k] = num(g && typeof g === "object" ? g.best : g, 0, 0, 100); });
  Object.keys(d.mistakes).forEach(k => { const m = d.mistakes[k];
    if (!m || typeof m !== "object" || !["word", "sent", "gram"].includes(m.t) || (m.t === "gram" && (typeof m.g !== "string" || m.g.split("|").length < 3))) { delete d.mistakes[k]; return; }
    m.n = num(m.n, 1, 1, 99) | 0; m.at = num(m.at, 0, 0, 9e15); m.en = String(m.en || ""); m.vi = String(m.vi || ""); });
  Object.keys(d.log).forEach(k => { const l = d.log[k]; if (!l || typeof l !== "object") { delete d.log[k]; return; } l.lessons = num(l.lessons, 0, 0, 1e4) | 0; l.xp = num(l.xp, 0, 0, 1e9); });
  if (!d.game || typeof d.game !== "object") d.game = { best: {}, post: {}, plays: 0 };
  const gb = d.game.best = d.game.best && typeof d.game.best === "object" ? d.game.best : {};
  Object.keys(gb).forEach(k => { if (!["market", "memory"].includes(k)) gb[k] = gb[k] ? 1 : 0; });
  if (gb.market !== undefined) gb.market = num(gb.market, 0, 0, 8) | 0;
  if (gb.memory !== undefined) gb.memory = num(gb.memory, 99, 1, 99) | 0;
  d.game.plays = num(d.game.plays, 0, 0, 1e7) | 0; d.game.post = d.game.post && typeof d.game.post === "object" ? d.game.post : {};
  if (d.game.gardenSeen !== undefined) d.game.gardenSeen = num(d.game.gardenSeen, 0, 0, 9e15);
  Object.keys(d.cnt).forEach(k => d.cnt[k] = num(d.cnt[k], 0, 0, 1e9) | 0);
  Object.keys(d.skill).forEach(k => { const v = d.skill[k]; if (!Array.isArray(v)) { delete d.skill[k]; return; } d.skill[k] = [num(v[0], 0, 0, 1e9) | 0, num(v[1], 0, 0, 1e9) | 0]; });
  Object.keys(d.badges).forEach(k => d.badges[k] = num(d.badges[k], 1, 0, 9e15));
  if (d.placement !== null && d.placement !== "zero") d.placement = num(d.placement, 0, 0, 100);
  if (d.mockOpen && (typeof d.mockOpen !== "object" || !["A1", "A2", "B1", "B2", "C1"].includes(d.mockOpen.lv))) d.mockOpen = null; else if (d.mockOpen) d.mockOpen = { lv: d.mockOpen.lv, at: num(d.mockOpen.at, 0, 0, 9e15), hb: num(d.mockOpen.hb, 0, 0, 9e15), w: String(d.mockOpen.w || "").slice(0, 12) };
  if (MIG_READY) migrateContent(d);
  d._rev = Math.floor(num(d._rev, 0, 0, 1e12)); d._wipe = num(d._wipe, 0, 0, 9e15);
  if (d.resume && (typeof d.resume !== "object" || typeof d.resume.id !== "string" || !d.resume.P || !Array.isArray(d.resume.P.steps))) d.resume = null;
  return d;
}
/* Dữ liệu lưu bị hỏng (không đọc được): giữ một bản sao riêng, không ghi đè mất, và báo cho người học */
/* Nội dung đã sửa qua các bản cập nhật: lỗi sai và thẻ ôn lưu từ bản cũ được đổi sang câu / đáp án hiện tại,
   hoặc bỏ đi nếu câu, từ đó không còn (để "Luyện lại lỗi sai" không chấm đúng theo đáp án cũ) */
var MIG_READY;
function migrateContent(d) {
  const M = migrateContent.m || (migrateContent.m = (() => { const g = new Map(); if (typeof GRAMMAR !== "undefined") GRAMMAR.forEach(T => T.items.forEach(x => g.set(x.split("|")[1], x)));
    return { g, sents: new Set(ORDER.flatMap(id => (LES[id].S || []).map(s => s.en))) }; })());
  const us = k => k.split(" ").map(w => usSpell(w.toLowerCase()) === w.toLowerCase() ? w : usSpell(w.toLowerCase())).join(" ");
  Object.keys(d.mistakes).forEach(k => { const m = d.mistakes[k];
    if (m.t === "gram") { const cur = M.g.get(m.g.split("|")[1]); if (cur) m.g = cur; else delete d.mistakes[k]; }
    else if (m.t === "sent") { if (!M.sents.has(m.en) && !WMAP[m.en]) delete d.mistakes[k]; }
    else if (!WMAP[m.en]) { const n = us(m.en); delete d.mistakes[k]; if (WMAP[n] && !d.mistakes[n]) d.mistakes[n] = Object.assign(m, { en: n, vi: WMAP[n].vi }); } });
  Object.keys(d.cards).forEach(k => { if (WMAP[k]) return; const n = us(k), c = d.cards[k]; delete d.cards[k]; if (WMAP[n] && !d.cards[n]) d.cards[n] = Object.assign(c, { vi: WMAP[n].vi }); });
}
function load() { let raw = null; try { raw = localStorage.getItem(KEY); const x = JSON.parse(raw); if (x && x.done) return merge(x); } catch (e) {}
  if (raw && raw !== "null") { try { localStorage.setItem(KEY + "_broken_" + Date.now(), raw); } catch (e) {} load.broken = 1; }
  return def(); }
let S = load(), REV = +S._rev || 0, XPBASE = S.xp;
/* Hai cửa sổ cùng mở (app đã cài + tab trình duyệt): cửa sổ khác đã ghi bản mới hơn thì gộp vào trước khi ghi,
   lấy tiến độ cao hơn của từng bài, không xóa tiến độ mà cửa sổ kia vừa học */
function mergeOther(o) {
  const mx = (a, b) => Math.max(+a || 0, +b || 0);
  Object.keys(o.done).forEach(k => { if (!S.done[k] || o.done[k].best > S.done[k].best) S.done[k] = o.done[k]; });
  Object.keys(o.cards).forEach(k => { if (!WMAP[k]) return; const a = S.cards[k], b = o.cards[k]; if (!a || b.box > a.box || (b.box === a.box && b.due > a.due)) S.cards[k] = b; });
  S.xp = Math.max(S.xp, (+o.xp || 0) + Math.max(0, S.xp - XPBASE)); // XP cộng dồn: phần cửa sổ này vừa nhận cộng vào bản của cửa sổ kia
  ["unlocked", "stagePassed", "badges", "dayDone"].forEach(f => { S[f] = Object.assign({}, o[f] || {}, S[f]); });
  Object.keys(o.certs).forEach(k => { if (!S.certs[k] || o.certs[k].overall > S.certs[k].overall) S.certs[k] = o.certs[k]; });
  Object.keys(o.exams).forEach(k => { const have = new Set((S.exams[k] || []).map(a => a.at)); S.exams[k] = (S.exams[k] || []).concat(o.exams[k].filter(a => !have.has(a.at))).sort((a, b) => a.at - b.at); });
  Object.keys(o.gram).forEach(k => S.gram[k] = mx(S.gram[k], o.gram[k]));
  Object.keys(o.days).forEach(k => S.days[k] = mx(S.days[k], o.days[k]));
  Object.keys(o.log).forEach(k => { const a = S.log[k] || (S.log[k] = { lessons: 0, xp: 0 }); a.lessons = mx(a.lessons, o.log[k].lessons); a.xp = mx(a.xp, o.log[k].xp); });
  Object.keys(o.cnt).forEach(k => S.cnt[k] = mx(S.cnt[k], o.cnt[k]));
  Object.keys(o.skill).forEach(k => { const a = S.skill[k], b = o.skill[k]; if (!a || b[1] > a[1]) S.skill[k] = b; });
  Object.keys(o.mistakes).forEach(k => { if (!S.mistakes[k] && o.mistakes[k].at > (REV_AT || 0)) S.mistakes[k] = o.mistakes[k]; });
  Object.keys(o.game.best || {}).forEach(k => { const a = S.game.best[k], b = o.game.best[k]; S.game.best[k] = k === "memory" ? (a ? Math.min(a, b) : b) : mx(a, b); });
  S.game.plays = mx(S.game.plays, o.game.plays);
  if (!S.name && o.name) S.name = o.name; if (S.onb === false && o.onb) S.onb = true;
  if ((!S.mockOpen || S.mockOpen.w !== WIN) && o.mockOpen && o.mockOpen.w !== WIN && (!S.mockOpen || o.mockOpen.at >= S.mockOpen.at)) S.mockOpen = o.mockOpen;
  else if (S.mockOpen && S.mockOpen.w !== WIN && !o.mockOpen) S.mockOpen = null; // cửa sổ kia đã thi xong
}
let REV_AT = Date.now(); /* mã cửa sổ: giữ nguyên khi tải lại cùng một tab (sessionStorage), khác nhau giữa hai cửa sổ */
const WIN = (() => { let w = ""; try { w = sessionStorage.getItem("hta_win") || ""; if (!w) { w = Math.random().toString(36).slice(2, 10); sessionStorage.setItem("hta_win", w); } } catch (e) { w = Math.random().toString(36).slice(2, 10); } return w; })();
/* force: ghi đè có chủ ý (xóa tiến độ, khôi phục từ bản sao lưu) */
function save(force) { try {
  if (!force) { const raw = localStorage.getItem(KEY), cur = raw && JSON.parse(raw); if (cur && cur.done && (+cur._rev || 0) > REV) { const o = merge(cur); if (o._wipe !== S._wipe) S = o; else mergeOther(o); REV = +cur._rev; } }
  S._rev = REV = REV + 1; REV_AT = Date.now(); XPBASE = S.xp; localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
window.addEventListener("storage", e => { if (e.key !== KEY || !e.newValue) return;
  if (!P && (typeof G === "undefined" || !G) && !VIEW) { try { const x = JSON.parse(e.newValue); if (x && x.done) { S = merge(x); REV = +S._rev || 0; XPBASE = S.xp; const a = document.activeElement; if (!a || !/^(INPUT|TEXTAREA)$/.test(a.tagName)) render(); } } catch (er) {} }
  else if (!storage1) { storage1 = 1; toast("Ứng dụng đang mở ở một cửa sổ khác.<br>Hãy chỉ dùng một cửa sổ để không bị lẫn tiến độ.", 5000); } });
let storage1 = 0;

/* ---------- Tiện ích ---------- */
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
/* số thập phân hiển thị kiểu Việt Nam: 8,5 (chỉ để hiển thị, không dùng để tính) */
const vnum = (x, d) => (+x).toFixed(d).replace(".", ","), vdec = x => String(x).replace(".", ",");
/* bài đọc dài một khối (> 700 ký tự, không xuống dòng) chia thành 2–3 đoạn ở ranh giới câu cho dễ đọc trên điện thoại */
function paraHtml(t) {
  t = String(t); if (t.length <= 700) return esc(t).replace(/\n/g, "<br>");
  if (/\n/.test(t)) return t.split(/\n+/).filter(x => x.trim()).map(p => `<p>${esc(p)}</p>`).join("");
  const ss = t.split(/(?<=[.!?]["”’')]?)\s+(?=["“‘']?[A-Z0-9])/); if (ss.length < 4) return esc(t);
  const k = t.length > 1300 ? 3 : 2, cum = []; let c = 0; ss.forEach(x => { c += x.length + 1; cum.push(c); });
  const cuts = []; for (let m = 1; m < k; m++) { const tg = c * m / k; let best = -1; cum.forEach((v, i) => { if (i < ss.length - 1 && !cuts.includes(i) && !/\b(Mr|Mrs|Ms|Dr|St|vs|etc|e\.g|i\.e|[A-Z])\.$/.test(ss[i]) && (best < 0 || Math.abs(v - tg) < Math.abs(cum[best] - tg))) best = i; }); if (best >= 0) cuts.push(best); }
  const out = []; let cur = []; ss.forEach((x, i) => { cur.push(x); if (cuts.includes(i)) { out.push(cur.join(" ")); cur = []; } }); if (cur.length) out.push(cur.join(" "));
  return out.map(p => `<p>${esc(p)}</p>`).join("");
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const jsq = s => esc(String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, " "));
const dkey = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const today = () => dkey(new Date());
const plural = (n, w) => n + " " + w;
function toast(m, ms) { const t = $("#toast"); t.innerHTML = m; placeToast(t); t.classList.add("on"); toast.at = Date.now(); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), ms || 2800); }
/* Đổi màn hình: thông báo cũ (đã hiện hơn 0,3 giây) thì ẩn đi; thông báo vừa bật cho chính thao tác này thì đặt lại chỗ */
function toastOff() { const t = $("#toast"); if (t && t.classList.contains("on") && Date.now() - (toast.at || 0) > 300) { t.classList.remove("on"); clearTimeout(toast.h); } }
function toastFit() { const t = $("#toast"); if (t && t.classList.contains("on")) placeToast(t); }
/* Thông báo nằm ở khoảng trống phía dưới: trên thanh điều hướng / thanh kết quả, không che nút bấm, không che tiêu đề */
function placeToast(t) {
  const vh = innerHeight, a = app().getBoundingClientRect(), cx = a.width ? a.left + a.width / 2 : innerWidth / 2;
  t.style.left = cx + "px"; t.style.top = "0px"; t.classList.remove("slim");
  const nav = $("#nav"), nr = nav && getComputedStyle(nav).display !== "none" ? nav.getBoundingClientRect() : null, fb = $("#fb.on");
  let bottom = vh - 12; if (nr && nr.top > vh / 2) bottom = nr.top - 10; if (fb) bottom = Math.min(bottom, innerHeight - fb.offsetHeight - 10); // vị trí khi thanh đã trượt lên hết (đang trượt thì rect còn ở dưới màn hình)
  const h = t.offsetHeight, w = t.offsetWidth, L = cx - w / 2 - 6, R = cx + w / 2 + 6, pt = $(".ptop"), top0 = (pt ? pt.getBoundingClientRect().bottom : 0) + 8;
  const hits = $$("button,.btn,input,textarea,select,a[href],[onclick],h1,h2,h3,h4,.lab,.sec,.card.big p,.card.big .row").filter(e => !e.closest("#toast,#nav,#fb,.modal")).map(e => e.getBoundingClientRect()).filter(r => r.height && r.height < 140 && r.right > L && r.left < R && r.bottom > top0 && r.top < bottom);
  let y = bottom;
  for (let k = 0; k < 16; k++) { const hit = hits.filter(r => r.bottom > y - h - 6 && r.top < y); if (!hit.length) break; y = Math.min(...hit.map(r => r.top)) - 8; }
  // không còn chỗ trống: đè lên giữa thanh tiêu đề (thanh tiến độ, không phải nút) nếu đủ hẹp, nếu không thì ngay dưới thanh
  if (y - h < top0) { const pr = pt && pt.getBoundingClientRect(); if (pr && w < pr.width - 140 && h <= pr.height + 12) { t.classList.add("slim"); const h2 = t.offsetHeight; t.style.top = Math.round(Math.max(2, pr.top + (pr.height - h2) / 2)) + "px"; return; } y = top0 + h; }
  t.style.top = Math.round(y - h) + "px";
}
function glossParts(v) { return String(v).toLowerCase().replace(/\([^)]*\)/g, m => "," + m.slice(1, -1) + ",").split(/[,;/]|\s+hoặc\s+/).map(x => x.trim()).filter(x => x.length > 1); }
const NEVER = [["hello", "hi"], ["thank you", "thanks"], ["sorry", "excuse me"], ["fine", "okay"], ["have", "has"], ["a", "an"], ["usually", "often", "always"], ["house", "home"], ["get to", "arrive"], ["jacket", "coat"], ["great", "amazing"], ["got", "came", "arrived"], ["personality", "character"], ["probably", "perhaps", "maybe"], ["free", "available"], ["reservation", "book a room"], ["reception", "receptionist"], ["should", "ought to", "had better"], ["must", "have to", "required"], ["damaged", "broken"], ["chop", "slice"], ["worried", "nervous"], ["who", "which", "that"], ["eventually", "in the end", "finally"], ["opposite", "across from"], ["bill", "check", "receipt"], ["however", "nevertheless", "nonetheless", "but", "even so", "yet", "that said", "all the same"], ["postpone", "put off", "delay"], ["notice", "realize"], ["big", "large"], ["small", "little"],
  ["recently", "lately"], ["whether", "if"], ["must be", "no doubt"], ["lead to", "result in"], ["make a decision", "make up your mind", "decide"], ["looking back", "in hindsight", "in retrospect", "hindsight"], ["breathtaking", "spectacular", "stunning"], ["it seems that", "it appears that", "seem"], ["implement", "roll out"], ["unquestionably", "there is little doubt that"], ["likewise", "similarly"], ["moving on", "turning now to"],
  ["get up", "wake up"], ["right now", "at the moment"], ["street", "road"], ["do", "work"], ["rarely", "hardly ever"], ["a week", "weekly"], ["abroad", "foreign"], ["mustn't", "forbidden"], ["regards", "sincerely", "best wishes"], ["unless", "otherwise"], ["goodbye", "bye", "see you"], ["price", "cost"], ["habit", "routine"], ["later", "in the future", "one day"], ["predict", "forecast"], ["luggage", "suitcase"], ["required", "necessary"], ["deliver", "delivery"], ["trash", "waste"], ["confused", "embarrassed"], ["made in", "produced"], ["tool", "device", "machine"], ["tradition", "custom"],
  ["allegedly", "supposedly", "reportedly"],
  ["even though", "although", "though", "much as"], ["actually", "genuinely", "in fact"], ["carry on", "go on doing", "keep on"], ["acknowledge", "admittedly", "concede"], ["happy", "fun"], ["speak", "talk"], ["picture", "photo"], ["oppose", "against", "be against"], ["adapt", "get used to", "adjust"], ["soon", "later", "in a while"], ["saw", "watched"], ["nervous", "stressed", "worried", "anxious"], ["now", "at the moment", "right now"], ["cup", "glass"], ["suddenly", "all of a sudden"], ["strength", "advantage"], ["absolutely", "i agree with you", "exactly"], ["gasp", "breathless"], ["granted", "admittedly"], ["somewhat", "slightly", "relatively", "rather", "fairly"], ["tone down", "soften"], ["logical", "valid", "reasonable"], ["remind", "reminded"], ["complain", "make a complaint"], ["depend on", "rely on", "count on"], ["furthermore", "in addition", "moreover", "besides", "what is more"], ["consequently", "thus", "hence", "therefore", "as a result"], ["contraction", "abbreviation"], ["holiday", "vacation"], ["cheap", "inexpensive"], ["said", "told"], ["interesting", "exciting"], ["the main idea", "gist", "key point", "main point", "point", "the crucial point is"], ["must be", "no doubt", "certain", "definitely"], ["make an effort", "do your best", "try to do"], ["unquestionably", "there is little doubt that", "undoubtedly"], ["devil's advocate", "to play devil's advocate"], ["fair enough", "that's a valid point"], ["would it be possible", "i was wondering whether"], ["to be honest", "with all due respect"], ["give up", "give up on"], ["discover", "find out", "uncover"], ["advantage", "benefit"], ["attend", "take part in"], ["confidence", "self-belief"], ["in my view", "i'd say"], ["bear in mind", "let's not lose sight of"], ["hedging", "hedge"], ["stingy", "cheap"], ["daily", "every day"], ["angry", "furious"], ["weakness", "disadvantage", "drawback"], ["evidently", "apparently"], ["in short", "briefly"], ["informal", "colloquial"], ["confident", "certain"], ["trip", "journey"], ["quit", "step down"], ["rephrase", "to put it another way"], ["angry", "furious"]];
const never = (a, b) => { a = a.toLowerCase(); b = b.toLowerCase(); return a === b || (window.SYN && ((SYN[a] || []).includes(b) || (SYN[b] || []).includes(a))) || NEVER.some(g => g.includes(a) && g.includes(b)); };
/* Hai nghĩa gần như trùng nhau: các âm tiết của phần nghĩa này nằm liền nhau trong phần nghĩa kia
   (vui ⊂ vui vẻ, hủy ⊂ bị hủy, có vẻ ⊂ có vẻ như, ăn ⊂ đã ăn, dẫn đến ⊂ dẫn đến kết quả) */
const glossNear = (a, b) => a !== b && ((" " + a + " ").includes(" " + b + " ") || (" " + b + " ").includes(" " + a + " "));
const nearAny = (x, ml) => glossParts(x).some(g => ml.some(m => glossNear(g, m)));
/* near: lọc cả nghĩa gần trùng (thẻ nghĩa tiếng Việt). Nếu lọc quá chặt làm thiếu phương án thì bù bằng phương án chỉ khác nghĩa */
function opts(correct, pool, avoid, near) { const mine = new Set(glossParts(correct).concat(avoid || [])), ml = [...mine];
  const cand = shuffle([...new Set(pool.filter(x => x && x !== correct && !glossParts(x).some(g => mine.has(g))))]);
  const good = near ? cand.filter(x => !nearAny(x, ml)) : cand, others = good.concat(cand.filter(x => !good.includes(x))).slice(0, 3);
  const o = shuffle([correct, ...others]); return { o, a: o.indexOf(correct) }; }
const CONTR = { "i'm": "i am", "you're": "you are", "he's": "he is", "she's": "she is", "it's": "it is", "we're": "we are", "they're": "they are", "don't": "do not", "doesn't": "does not", "didn't": "did not", "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not", "can't": "can not", "cannot": "can not", "couldn't": "could not", "i'd": "i would", "i'll": "i will", "you'll": "you will", "we'll": "we will", "it'll": "it will", "i've": "i have", "you've": "you have", "we've": "we have", "they've": "they have", "haven't": "have not", "hasn't": "has not", "what's": "what is", "that's": "that is", "there's": "there is", "where's": "where is", "let's": "let us", "shouldn't": "should not", "won't": "will not", "you'd": "you would", "mustn't": "must not",
  "he'll": "he will", "she'll": "she will", "they'll": "they will", "that'll": "that will", "there'll": "there will", "who'll": "who will",
  "he'd": "he would", "she'd": "she would", "we'd": "we would", "they'd": "they would", "it'd": "it would", "who'd": "who would", "that'd": "that would", "there'd": "there would",
  "wouldn't": "would not", "hadn't": "had not", "needn't": "need not", "mightn't": "might not", "shan't": "shall not", "ain't": "is not",
  "who's": "who is", "how's": "how is", "here's": "here is", "when's": "when is", "why's": "why is",
  "must've": "must have", "could've": "could have", "should've": "should have", "would've": "would have", "might've": "might have", "who've": "who have",
  "they're": "they are", "who're": "who are", "what're": "what are",
  im: "i am", youre: "you are", dont: "do not", doesnt: "does not", didnt: "did not", isnt: "is not", arent: "are not", wasnt: "was not", werent: "were not", cant: "can not", whats: "what is", thats: "that is", theres: "there is", wheres: "where is", shouldnt: "should not", wont: "will not", ive: "i have", havent: "have not", hasnt: "has not", couldnt: "could not", mustnt: "must not", wouldnt: "would not", hadnt: "had not", neednt: "need not", ok: "okay" };
const NUMS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const UKUS = { colour: "color", colours: "colors", favourite: "favorite", neighbour: "neighbor", neighbours: "neighbors", neighbourhood: "neighborhood", centre: "center", theatre: "theater", behaviour: "behavior", humour: "humor", honour: "honor", flavour: "flavor", harbour: "harbor", labour: "labor", programme: "program", grey: "gray", metre: "meter", litre: "liter", analyse: "analyze", catalogue: "catalog", practise: "practice", practising: "practicing", practised: "practiced", travelled: "traveled", travelling: "traveling", traveller: "traveler", travellers: "travelers", cancelled: "canceled", cancelling: "canceling", jewellery: "jewelry", tyre: "tire", pyjamas: "pajamas", mum: "mom", favour: "favor", favours: "favors", favourite: "favorite", rumour: "rumor", ageing: "aging", enquire: "inquire", enquiry: "inquiry", fuelled: "fueled", fuelling: "fueling", levelled: "leveled", trialled: "trialed", centres: "centers", programmes: "programs", analysed: "analyzed", analyses: "analyzes", fertiliser: "fertilizer", grey: "gray", licence: "license", defence: "defense", offence: "offense", cheque: "check", kilometre: "kilometer", kilometres: "kilometers", metres: "meters", organisation: "organization", organisations: "organizations", colourful: "colorful", sceptics: "skeptics", sceptical: "skeptical" };
function usSpell(w) { if (UKUS[w]) return UKUS[w]; const m = w.match(/^(.*[a-z]{3})is(e|es|ed|ing|ation|ations)$/); if (m && /(real|organ|apolog|recogn|critic|summar|priorit|modern|special|minim|maxim|memor|final|util|custom|standard|categor|emphas|symbol|visual|global|urban|moral|author|harmon|optim|central|civil|fertil|stabil|sympath|scrutin|character|legal|normal|subsid|monopol|capital|general|human|ideal|jeopard|mobil|neutral|polar)$/.test(m[1])) return m[1] + "iz" + m[2]; return w; }
function norm(s) {
  s = String(s).toLowerCase().replace(/[’‘`]/g, "'"); s = s.replace(/[a-z']+/g, w => CONTR[w] || (/'s$/.test(w) && UKUS[w.slice(0, -2)] ? UKUS[w.slice(0, -2)] + "'s" : w));
  s = s.replace(/\b\d{1,3}(?:\.\d{3})+\b(?!\.\d)/g, m => m.replace(/\./g, "")); // 2.000.000 (cách viết số của người Việt) = 2,000,000
  s = s.replace(/(\d),(?=\d{3}\b)/g, "$1").replace(/'/g, "").replace(/[^a-z0-9\s-]/g, " ").replace(/\be-mail/g, "email").replace(/\bcheckout\b/g, "check out");
  s = s.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-](one|two|three|four|five|six|seven|eight|nine)\b/g, (m, a, b) => String(NUMS[a] + NUMS[b]));
  s = s.replace(/-/g, " ").replace(/\b[a-z]+\b/g, w => NUMS[w] !== undefined ? String(NUMS[w]) : usSpell(w));
  s = s.replace(/\b(?:(a|1)|(\d+)) (hundred|thousand|million)\b/g, (m, a, n, u) => String((n ? +n : 1) * { hundred: 100, thousand: 1000, million: 1e6 }[u]));
  // two hundred thousand = 200,000; three million five hundred thousand chỉ ghép từng cặp
  s = s.replace(/\b(\d+) (thousand|million)\b/g, (m, n, u) => String(+n * (u === "thousand" ? 1000 : 1e6)));
  return s.replace(/\s+/g, " ").trim();
}
function lev(a, b) { const m = a.length, n = b.length; if (!m) return n; if (!n) return m; let p = Array(n + 1).fill(0).map((_, i) => i); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
/* 'd = would hoặc had, 's = is hoặc has. Cách hiểu chọn theo từ đứng sau:
   'd + V3 / better / been → had, 'd + V nguyên mẫu / like / rather → would; 's + V3 / been / got → has, còn lại → is.
   Đáp án: chỉ lấy cách hiểu đúng ngữ pháp (để "He is been", "If I would known", "I had like" không thành đúng).
   Câu người học gõ dạng viết tắt: viết tắt luôn đúng, nên nhận cả hai cách hiểu hợp với từ đứng sau. */
const RE_C = /^(i|you|he|she|we|they|it|who|there|that|what|where|here|how|when|why|somebody|someone|everyone|everybody|nobody)['’](d|s)$/i;
const C_ADV = new Set("already just never ever always also still not really recently finally probably definitely only even often usually sometimes nearly almost completely totally certainly actually rather".split(" "));
const PP_SET = new Set("been done gone seen taken given eaten written broken chosen spoken forgotten forgiven gotten got fallen driven ridden risen hidden beaten bitten frozen stolen woken shaken shown known grown thrown flown drawn drunk sung rung sunk swum begun worn torn withdrawn undertaken lain made had said paid bought brought caught taught thought fought sought built sent spent lent meant met felt kept slept left lost found heard held told sold stood understood sat won hung led fed burnt learnt dreamt dealt dug lit laid shot stuck struck shone spelt spilt smelt mistaken proven".split(" "));
const PP_AMB = new Set("come become run overcome read put cut set hit hurt let shut quit cost spread bet upset broadcast forecast".split(" "));
const BASE_ED = new Set("need feed seed speed bleed breed weed shed wed exceed proceed succeed embed red bed shred".split(" "));
const S_IS = new Set("tired bored married interested worried excited scared surprised pleased annoyed confused embarrassed disappointed satisfied called named located used supposed based allowed required expected designed considered situated involved concerned prepared dressed engaged amazed shocked frightened exhausted relaxed qualified crowded".split(" "));
const S_INTR = new Set("gone come become happened arrived lived worked stayed died fallen risen changed started begun grown been got gotten had".split(" "));
const C_PREP = new Set("in on at of for with by from to into about and but or so than as because when if since".split(" "));
const isPP = w => PP_SET.has(w) || (/[a-z]{2}ed$/.test(w) && !BASE_ED.has(w));
function cReadings(c, w, after, lenient) {
  if (c === "d") {
    if (!w) return ["would"];
    if (/^(better|been|had|got|gotten)$/.test(w)) return lenient ? ["had", "would"] : ["had"];
    if (PP_AMB.has(w)) return ["would", "had"];
    if (isPP(w)) return lenient ? ["had", "would"] : ["had"];
    // "I'd a dog / I'd more time" (had là động từ chính viết tắt) không chuẩn trong tiếng Anh Mỹ: không đọc là had
    return ["would"];
  }
  if (!w) return ["is"];
  if (/^(been|got|gotten|had)$/.test(w)) return lenient ? ["has", "is"] : ["has"];
  if (/ing$/.test(w) || S_IS.has(w)) return ["is"];
  if (PP_AMB.has(w) && !/^(come|become|run|overcome)$/.test(w)) return ["is", "has"];
  if (isPP(w) || PP_AMB.has(w)) { if (lenient) return ["has", "is"]; return (!after || C_PREP.has(after)) && !S_INTR.has(w) && !PP_AMB.has(w) ? ["has", "is"] : ["has"]; }
  return ["is"];
}
function expandC(x, lenient) {
  const tk = String(x).split(/\s+/).filter(Boolean), ch = tk.map(t => [t]);
  const clean = t => (t || "").toLowerCase().replace(/[’‘]/g, "'").replace(/^[("“'‘]+/, "").replace(/[^a-z'-]+$/, "");
  const ends = t => /[.,;:!?…)"”]$/.test(t || "");
  tk.forEach((t, i) => {
    let m = clean(t).match(RE_C);
    // danh từ + 's + been/gone/got: chắc chắn là has (My bike's been stolen), không phải sở hữu cách
    if (!m && /^[a-z]+['’]s$/.test(clean(t)) && !ends(t) && /^(been|gone|got|gotten)$/.test(clean(tk[i + 1]))) m = [0, 0, "s"];
    if (!m) return;
    const tail = t.match(/[^A-Za-z'’]*$/)[0];
    let k = i + 1; if (!ends(t)) while (k < tk.length && C_ADV.has(clean(tk[k])) && !ends(tk[k])) k++;
    const w = ends(t) || k >= tk.length ? "" : clean(tk[k]), after = !w || ends(tk[k]) || k + 1 >= tk.length ? "" : clean(tk[k + 1]);
    const lead = t.slice(0, t.length - tail.length).replace(/['’](d|s)$/i, "");
    ch[i] = cReadings(m[2].toLowerCase(), w, after, lenient).map(r => lead + " " + r + tail);
  });
  let v = [""]; ch.forEach(c => { v = v.flatMap(p => c.map(x => p ? p + " " + x : x)).slice(0, 32); });
  return v;
}
function normAlts(t, lenient) {
  const x = String(t), r = expandC(x, lenient).map(norm);
  // từ có gạch nối viết liền (check-out / checkout, T-shirt / Tshirt)
  if (/[a-z]-[a-z]/i.test(x)) r.push(norm(x.replace(/([a-z])-(?=[a-z])/gi, "$1")));
  return [...new Set(r)];
}
/* Gõ sai một chữ mà ra một từ có thật (know/now, bought/brought, these/those) là dùng sai từ, không phải lỗi gõ */
const CONFUSE = "know now knew new no bought brought these those then than were where we're wear quite quiet live life lose loose sit seat advice advise affect effect affects effects thought though through threw caught taught bitter better chose choose choice began begin begun spoke speak broke break take taken took give gave given lend borrow leave live alone along accept except desert dessert later latter lightning lightening dairy diary weather whether their there they're your you're its it's of off form from angel angle cloth clothes clothe breath breathe price prize sight site rise raise lay lie fell feel fill full pool pull sheep ship bead bed bad beat bit heat hit leave leaf worker worked light right could would should cold hold hole whole word world sleep slip steal steel work walk wonder wander".split(" ");
let KNOWN = null;
function known() { if (KNOWN) return KNOWN; const k = new Set(CONFUSE), add = t => norm(t).split(" ").forEach(w => w && !/^\d+$/.test(w) && k.add(w));
  ORDER.forEach(id => { (LES[id].S || []).forEach(s => add(s.en)); if (LES[id].r) add(LES[id].r.t); }); ALLW.forEach(w => add(w.en)); IRR.forEach(g => g.forEach(add));
  return (KNOWN = k); }
/* Từ điển chính tả (nếu đã tải, không tự tải): chỉ dùng dạng gốc trong tệp .dic, và dạng -s của từ có cờ S */
function spellKnown(w) {
  try {
    if (!spellKnown.set) { const d = Object.getOwnPropertyDescriptor(window, "SPELL_DIC"); if (!d || typeof d.value !== "string") return false;
      const st = new Map(); d.value.split("\n").forEach(l => { const m = l.match(/^([A-Za-z]+)(?:\/(\S*))?/); if (m) st.set(m[1].toLowerCase(), (st.get(m[1].toLowerCase()) || "") + (m[2] || "")); }); spellKnown.set = st; }
    const st = spellKnown.set; if (st.has(w)) return true; const b = w.replace(/s$/, ""); return b !== w && /[SM]/.test(st.get(b) || "");
  } catch (e) { return false; }
}
function compare1(a, b) {
  if (a === b) return 2;
  const A = a.split(" "), B = b.split(" "); if (A.length !== B.length || B.length === 1) return 0; // một từ đơn lẻ (nghe chép từ): phải đúng hẳn
  const stem = x => x.replace(/(ing|es|ed|s|d)$/, "");
  let typos = 0;
  for (let k = 0; k < B.length; k++) {
    const x = A[k], y = B[k]; if (x === y) continue;
    if (y.length < 5 || /^\d+$/.test(y) || lev(x, y) > 1 || stem(x) === stem(y) || x + "s" === y || y + "s" === x) return 0;
    if (known().has(x) || spellKnown(x)) return 0;
    typos++;
  }
  return typos <= Math.max(1, Math.floor(B.length / 6)) ? 1 : 0;
}
function compare(input, target) { const A = normAlts(input, true), B = normAlts(target); let best = 0; for (const a of A) for (const b of B) { best = Math.max(best, a === b ? 2 : compare1(a, b)); if (best === 2) return 2; } return best; }
function lcsWords(a, b) { const m = a.length, n = b.length, t = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0)); for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) t[i][j] = a[i - 1] === b[j - 1] ? t[i - 1][j - 1] + 1 : Math.max(t[i - 1][j], t[i][j - 1]); return t[m][n]; }
function speakScore(target, heard) { const a = norm(target).split(" "), b = norm(heard).split(" "); return Math.round(lcsWords(a, b) / a.length * 100); }
function diffWords(target, heard) { const h = new Set(norm(heard).split(" ")); return target.split(" ").map(w => h.has(norm(w)) ? `<span class="okw">${esc(w)}</span>` : `<span class="badw">${esc(w)}</span>`).join(" "); }

/* ---------- Âm thanh ---------- */
let voices = [];
/* Máy không có giọng đọc tiếng Anh (trình duyệt trong Zalo/Facebook): bỏ câu nghe chép, thay câu nghe-chọn bằng câu chọn nghĩa */
const noTTS = () => { if (!("speechSynthesis" in window)) return true; try { loadV(); } catch (e) {} return voices.length > 0 && !voices.some(v => /^en/i.test(v.lang)); };
function loadV() { try { voices = speechSynthesis.getVoices(); } catch (e) {} }
if ("speechSynthesis" in window) { loadV(); try { speechSynthesis.onvoiceschanged = loadV; } catch (e) {} }
const IPA_US = { hot: "hɑːt", dog: "dɔːɡ", car: "kɑːr", door: "dɔːr", bird: "bɝːd", go: "ɡoʊ", here: "hɪr", hair: "her", mother: "ˈmʌðɚ", chair: "tʃer", job: "dʒɑːb", dogs: "dɔːɡz", worked: "wɝːkt", wanted: "ˈwɑːntɪd", water: "ˈwɑːt̬ɚ", hotel: "hoʊˈtel", banana: "bəˈnænə", computer: "kəmˈpjuːt̬ɚ", coffee: "ˈkɑːfi", teacher: "ˈtiːtʃɚ", important: "ɪmˈpɔːrtnt", O: "oʊ", R: "ɑːr", Z: "ziː" };
const LNAME = { A: "ay", B: "bee", C: "see", D: "dee", E: "ee", F: "eff", G: "jee", H: "aitch", I: "eye", J: "jay", K: "kay", L: "el", M: "em", N: "en", O: "oh", P: "pee", Q: "cue", R: "are", S: "ess", T: "tee", U: "you", V: "vee", W: "double-you", X: "ex", Y: "why", Z: "zee" };
function spoken(t) {
  const s = String(t).trim();
  if (/^[A-Za-z]$/.test(s)) { const u = s.toUpperCase(); return u === "Z" && /GB/.test(S.settings.accent) ? "zed" : LNAME[u]; }
  if (/^[A-Z](\s*[–\-,.]\s*[A-Z])+$/.test(s)) return s.split(/\s*[–\-,.]\s*/).map(x => spoken(x)).join(", ");
  return s;
}
function say(t, slow, o) {
  t = spoken(t); o = o || {};
  if (!("speechSynthesis" in window)) { if (!say.warned) { say.warned = 1; toast("Thiết bị này chưa hỗ trợ giọng đọc tiếng Anh"); } if (o.onerror) o.onerror(); return; }
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t), acc = S.settings.accent; u.lang = acc;
    const cand = voices.filter(v => v.lang.replace("_", "-") === acc);
    const v = cand.find(v => /Google|Natural|Samantha|Daniel|Aria|Jenny/i.test(v.name)) || cand[0] || voices.find(v => v.lang.toLowerCase().startsWith("en"));
    if (v) u.voice = v;
    u.rate = o.rate || (slow ? 0.62 : S.settings.rate); if (o.onstart) u.onstart = o.onstart; if (o.onerror) u.onerror = o.onerror; if (o.onend) u.onend = o.onend; speechSynthesis.speak(u);
  } catch (e) { toast("Không phát được âm thanh"); if (o.onerror) o.onerror(); }
}
let AC = null;
function beep(kind) {
  if (!S.settings.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const seq = { good: [[660, 0], [880, .09]], bad: [[220, 0], [180, .12]], done: [[523, 0], [659, .1], [784, .2], [1047, .3]], tap: [[440, 0]] }[kind]; if (!seq) return;
    seq.forEach(([f, t]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = kind === "bad" ? "triangle" : "sine"; o.frequency.value = f; g.gain.setValueAtTime(.0001, AC.currentTime + t); g.gain.exponentialRampToValueAtTime(.18, AC.currentTime + t + .02); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + t + .18); o.connect(g).connect(AC.destination); o.start(AC.currentTime + t); o.stop(AC.currentTime + t + .2); });
  } catch (e) {}
}
function confetti() {
  const box = document.createElement("div"); box.className = "confetti";
  const cols = ["#0E5E51", "#F0A13A", "#E8664A", "#3F8EFC", "#9B5DE5", "#2E8B57"];
  for (let i = 0; i < 70; i++) { const p = document.createElement("i"); p.style.left = Math.random() * 100 + "%"; p.style.background = cols[i % cols.length]; p.style.animationDelay = Math.random() * .4 + "s"; p.style.animationDuration = 1.6 + Math.random() * 1.2 + "s"; p.style.transform = `rotate(${Math.random() * 360}deg)`; box.appendChild(p); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 3400);
}
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let micBlocked = false;
/* Nhận giọng nói (mọi chỗ dùng micro: đọc theo trong bài, đọc to trong thi thử, trả lời câu hỏi, kiểm tra micro).
   iPhone Safari thường chỉ gửi kết quả tạm (interim) và không tự dừng, không gọi onend cho tới khi stop():
   - luôn bật interimResults, mỗi lần có kết quả thì lưu lại toàn bộ chữ nghe được (chính thức + tạm)
   - im lặng ~1,3 giây (trả lời dài: 2,5 giây) sau kết quả cuối thì tự kết thúc và trả chữ đã nghe, không chờ onend
   - giới hạn cứng 12 giây (dài: 45 giây): trả chữ đã có, chưa có gì thì báo "no-speech"
   - bấm "Xong" (stopMic) trả ngay chữ đã nghe; mỗi lần nghe chỉ trả kết quả một lần, lần nghe cũ bị bỏ khi bắt đầu lần mới
   o.long: nghe liên tục; o.onpart(t): chữ đang nghe được (hiện cho người học thấy máy đang nghe) */
const MIC_SIL = 1300, MIC_SIL_LONG = 2500;
function listenMic(onres, onerr, o) {
  o = o || {};
  const old = listenMic.cur; if (old) old.kill();
  if (!SR || micBlocked) { onerr("none"); return; }
  let r; try { r = new SR(); } catch (e) { onerr("none"); return; }
  r.lang = S.settings.accent; r.interimResults = true; r.maxAlternatives = 3; r.continuous = !!o.long;
  let dead = false, fin = "", tmp = "", alts = [], sil = 0, cap = 0;
  const text = () => (fin + " " + tmp).replace(/\s+/g, " ").trim();
  const ses = { r };
  ses.kill = () => { dead = true; clearTimeout(sil); clearTimeout(cap); if (listenMic.cur === ses) listenMic.cur = null; try { r.stop(); } catch (e) {} setTimeout(() => { try { r.abort(); } catch (e) {} }, 1500); };
  ses.finish = () => { if (dead) return; const t = text(); ses.kill(); if (t) onres([t, ...alts.filter(a => a && a.toLowerCase() !== t.toLowerCase())]); else onerr("no-speech"); };
  ses.fail = err => { if (dead) return; ses.kill(); listenMic.lastErr = err; onerr(err); };
  cap = setTimeout(ses.finish, o.maxMs || (o.long ? 45000 : 12000));
  listenMic.cur = ses; listenMic.lastErr = "";
  r.onresult = e => {
    if (dead) return; fin = ""; tmp = "";
    for (let k = 0; k < e.results.length; k++) { const x = e.results[k]; if (x.isFinal) fin += " " + x[0].transcript; else tmp += " " + x[0].transcript; }
    // một câu ngắn: giữ thêm các cách nghe khác (máy chấm lấy cách giống câu mẫu nhất)
    alts = !o.long && e.results.length === 1 ? [...e.results[0]].slice(1).map(a => String(a.transcript || "").trim()) : [];
    if (o.onpart) try { o.onpart(text()); } catch (er) {}
    clearTimeout(sil); sil = setTimeout(ses.finish, o.long ? MIC_SIL_LONG : MIC_SIL);
    // máy tính / Android: câu ngắn đã có kết quả chính thức thì xong luôn
    if (!o.long && e.results.length && [...e.results].every(x => x.isFinal)) ses.finish();
  };
  r.onerror = e => {
    if (dead) return; const er = (e && e.error) || "none"; listenMic.lastErr = er;
    if (er === "not-allowed" || er === "service-not-allowed") micBlocked = true;
    if (text() && /^(aborted|no-speech|network)$/.test(er)) return ses.finish();
    ses.fail(er === "aborted" ? "no-speech" : er);
  };
  r.onend = () => { if (dead) return; if (text()) ses.finish(); else ses.fail("no-speech"); };
  try { r.start(); } catch (e) { ses.fail("none"); }
}
/* Rời câu / màn hình: tắt micro đang nghe, không trả kết quả */
function micOff() { const s = listenMic.cur; if (s) s.kill(); }
/* Nút "Xong": kết thúc ngay và chấm phần đã nghe được */
function stopMic() { const s = listenMic.cur; if (s) s.finish(); }
// điện thoại, máy tính bảng (màn hình cảm ứng, không có bàn phím): ẩn gợi ý phím "Enter"
const TOUCH_DEV = /iP(hone|ad|od)|Android/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) || !!(window.matchMedia && matchMedia("(hover:none) and (pointer:coarse)").matches);
document.documentElement.classList.toggle("touch", TOUCH_DEV);
const isIOSDev = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
/* Lời nhắc khi micro / nhận giọng nói bị chặn */
function micErrMsg(err) {
  if (err === "audio-capture") return "Không tìm thấy micro trên máy.<br>Hãy kiểm tra micro hoặc tai nghe rồi thử lại.";
  if (err === "not-allowed" || err === "service-not-allowed" || err === "none") return isIOSDev()
    ? "Chưa dùng được micro. Trên iPhone, hãy:<br>1. Cho phép Safari dùng micro (bấm “aA” trên thanh địa chỉ › Cài đặt trang web › Micrô › Cho phép).<br>2. Bật Đọc chính tả: Cài đặt › Cài đặt chung › Bàn phím › Bật Đọc chính tả.<br>3. Cho phép nhận dạng giọng nói: Cài đặt › Quyền riêng tư &amp; Bảo mật › Nhận dạng giọng nói › bật Safari.<br>Sau đó tải lại trang."
    : err === "none" ? "Trình duyệt này chưa hỗ trợ nhận giọng nói.<br>Hãy mở app bằng Chrome hoặc Safari." : "Chưa dùng được micro.<br>Hãy cho phép trình duyệt dùng micro (biểu tượng ổ khóa cạnh địa chỉ trang) rồi thử lại.";
  return "";
}
/* Khung "đang nghe": chữ máy nghe được hiện ngay bên dưới, nút Xong để chấm luôn */
const micUI = msg => `<div class="listening"><span class="dot"></span> ${msg}</div><p class="heard live" id="micLive" aria-live="polite">Máy đang chờ bạn nói…</p><button class="btn full" onclick="stopMic()"><i class="ti ti-check"></i> Xong</button>`;
// câu máy nghe được: câu ngắn giữ trên một dòng, điểm xuống dòng riêng
const heardQ = t => { const q = "“" + esc(t) + "”"; return String(t).length <= 24 ? `<span class="nw">${q}</span>` : q; };
const micLive = t => { const el = $("#micLive"); if (el) el.innerHTML = t ? `Máy nghe được: “${esc(t)}”` : "Máy đang chờ bạn nói…"; };
/* Hồ sơ › Kiểm tra micro: thử nhận giọng nói, hiện chữ nghe được và mã lỗi gốc */
function micTest() {
  const box = $("#mictest"); if (!box) return;
  if (!SR) { box.innerHTML = `<p class="err">Trình duyệt không có nhận giọng nói (SpeechRecognition).</p><p class="sm muted">${micErrMsg("none")}</p>`; return; }
  micBlocked = false;
  box.innerHTML = micUI("Đang nghe... hãy nói “Hello, how are you?”");
  listenMic(a => { const b = $("#mictest"); if (b) b.innerHTML = `<p class="heard">Máy nghe được: “${esc(a[0])}”</p><p class="sm good c"><i class="ti ti-circle-check"></i> Micro hoạt động tốt.</p><button class="btn full" onclick="micTest()"><i class="ti ti-microphone"></i> Thử lại</button>`; },
    err => { const b = $("#mictest"); if (b) b.innerHTML = `<p class="sm micmsg">${err === "no-speech" ? "Chưa nghe thấy gì. Hãy nói to và rõ hơn." : micErrMsg(err) || "Không nhận được giọng nói."}</p><p class="sm muted">Mã lỗi: ${esc(err)}${listenMic.lastErr && listenMic.lastErr !== err ? " (" + esc(listenMic.lastErr) + ")" : ""}</p><button class="btn full" onclick="micTest()"><i class="ti ti-microphone"></i> Thử lại</button>`; },
    { onpart: micLive });
}
document.addEventListener("visibilitychange", () => { if (!document.hidden) micBlocked = false; });
function checkVoice() {
  if (S.voiceWarned) return;
  const warn = m => { S.voiceWarned = 1; save(); modal("Chưa nghe được giọng đọc?", m, "Đã hiểu", () => {}, false, "Đóng"); };
  if (!("speechSynthesis" in window)) return warn("Trình duyệt này chưa hỗ trợ đọc tiếng Anh. Hãy mở app bằng <b>Chrome</b> (Android, máy tính) hoặc <b>Safari</b> (iPhone).");
  loadV(); if (voices.length && !voices.some(v => v.lang.toLowerCase().startsWith("en"))) warn("Máy của bạn chưa có giọng tiếng Anh.<br>1. Mở <b>Cài đặt</b> → <b>Ngôn ngữ</b>.<br>2. Chọn <b>Chuyển văn bản thành giọng nói</b>.<br>3. Tải thêm giọng <b>English</b>.");
}

/* ---------- Thời gian, XP, cấp độ ---------- */
let last = Date.now();
function lg() { const k = today(); return S.log[k] || (S.log[k] = { lessons: 0, xp: 0 }); }
function tick() { const now = Date.now(), cs = P && P.steps && P.steps[P.i], cap = cs && (cs.type === "write" || cs.type === "read" || cs.type === "xs") ? 600 : 180; const s = Math.min((now - last) / 1000, cap); last = now; const k = today(); S.days[k] = (S.days[k] || 0) + s; save(); }
const minutesToday = () => Math.round((S.days[today()] || 0) / 60);
function streak() { let n = 0; const d = new Date(); if (!(S.days[dkey(d)] > 30)) d.setDate(d.getDate() - 1); while (S.days[dkey(d)] > 30) { n++; d.setDate(d.getDate() - 1); } return n; }
const totalHours = () => Object.values(S.days).reduce((a, b) => a + b, 0) / 3600;
function addXP(n) { S.xp += n; lg().xp += n; save(); }
function levelOf(xp) { let n = 1; while (50 * n * (n + 1) <= xp) n++; const lo = 50 * n * (n - 1), hi = 50 * n * (n + 1); return { n, pct: Math.round((xp - lo) / (hi - lo) * 100), need: hi - xp }; }
function levelName(n) { return n < 5 ? "Mới nảy mầm" : n < 10 ? "Người học chăm" : n < 15 ? "Người nói tự tin" : n < 20 ? "Người dùng độc lập" : "Bậc thầy"; }
function addSkill(k, ok) { const v = S.skill[k] || (S.skill[k] = [0, 0]); v[1]++; if (ok) v[0]++; }

/* ---------- Huy hiệu ---------- */
const stageDone = id => !!S.stagePassed[id] || stageOf(id).lessons.every(L => passed(L.id));
const BADGES = [
  ["first", "flag", "Bước đầu tiên", "Hoàn thành bài học đầu tiên", () => Object.keys(S.done).length >= 1],
  ["s0", "ear", "Tai thính, lưỡi mềm", "Hoàn thành Chặng 0 – Làm quen âm", () => stageDone("s0")],
  ["a1", "plant", "Vượt A1", "Hoàn thành trình độ A1", () => stageDone("a1")],
  ["a2", "plant-2", "Vượt A2", "Hoàn thành trình độ A2", () => stageDone("a2")],
  ["st3", "flame", "Lửa nhỏ", "Học 3 ngày liên tiếp", () => streak() >= 3],
  ["st7", "flame", "Lửa bền", "Học 7 ngày liên tiếp", () => streak() >= 7],
  ["st30", "trophy", "Ngọn đuốc", "Học 30 ngày liên tiếp", () => streak() >= 30],
  ["w100", "vocabulary", "100 từ", "Có 100 từ trong kho ôn tập", () => Object.keys(S.cards).length >= 100],
  ["w500", "books", "500 từ", "Có 500 từ trong kho ôn tập", () => Object.keys(S.cards).length >= 500],
  ["w1000", "book-2", "1.000 từ", "Có 1.000 từ trong kho ôn tập", () => Object.keys(S.cards).length >= 1000],
  ["perfect", "star", "Điểm tuyệt đối", "Đạt 100% một bài học", () => S.cnt.perfect >= 1],
  ["speak", "microphone", "Tự tin cất lời", "Nói đạt 50 câu", () => S.cnt.speak >= 50],
  ["write", "pencil", "Cây bút chăm chỉ", "Viết đạt 10 đoạn văn", () => S.cnt.write >= 10],
  ["review", "brain", "Trí nhớ thép", "Ôn đúng 300 thẻ", () => S.cnt.review >= 300],
  ["h10", "clock", "10 giờ miệt mài", "Tổng thời gian học đạt 10 giờ", () => totalHours() >= 10],
  ["market", "basket", "Người bán hàng giỏi", "Giao đúng 8/8 đơn ở Phiên chợ quê", () => !!(S.game.best || {}).marketPerfect],
  ["home", "home-heart", "Về tới nhà ngoại", "Hoàn thành chuyến xe về miền Tây", () => !!(S.game.best || {}).j_tay],
  ["xv", "map-2", "Xuyên Việt", "Đi hết chuyến xe Hà Nội – Sài Gòn", () => !!(S.game.best || {}).j_xv],
  ["mem", "cards", "Trí nhớ siêu đẳng", "Đạt 3 sao ở Lật thẻ hội chợ", () => !!(S.game.best || {}).memory3],
  ["gram10", "abc", "Vững ngữ pháp", "Đạt từ 80% ở 10 chủ điểm ngữ pháp", () => Object.values(S.gram || {}).filter(v => v >= 80).length >= 10],
  ["cert", "certificate", "Chứng nhận đầu tiên", "Đạt một bài thi thử theo khung CEFR", () => Object.keys(S.certs || {}).length >= 1],
  ["certB2", "award", "Chuẩn B2", "Đạt bài thi thử B2 – sử dụng tiếng Anh độc lập", () => !!(S.certs || {}).B2],
  ["day", "calendar-check", "Ngày trọn vẹn", "Hoàn thành kế hoạch một ngày", () => Object.keys(S.dayDone).length >= 1]
];
function checkBadges() { let got = []; BADGES.forEach(b => { if (!S.badges[b[0]] && b[4]()) { S.badges[b[0]] = Date.now(); got.push(b); } }); if (got.length) { save(); setTimeout(() => celebrate("award", "Huy hiệu mới", got.map(b => `<span class="nw">${b[2]}</span>`).join(" · "), 3600), 600); } }
/* Trên màn hình kết quả: hiện ngay trong khối kết quả; nơi khác: hiện thông báo nhỏ */
/* Pháo giấy và chuông chỉ khi màn hình không phải kết quả chưa đạt */
function celebrate(ic, title, body, ms) { const d = $(".donescr .stack"); if (d) d.insertAdjacentHTML("beforebegin", `<div class="newbdg"><i class="ti ti-${ic}"></i><p><b>${title}</b><span class="nb">${body}</span></p></div>`); else toast(`<b>${title}:</b> ${body}`, ms); if (!$(".donescr.fail")) { confetti(); beep("done"); } }

/* ---------- Mở khóa, kế hoạch ---------- */
const passed = id => S.done[id] && S.done[id].best >= 80;
function isOpen(id) { const L = LES[id]; if (!L || stageOf(L.stage).locked) return false; if (S.unlocked[id]) return true; const i = ORDER.indexOf(id); if (i === 0) return true; const prev = ORDER[i - 1]; return passed(prev) || !!S.stagePassed[LES[prev].stage] || !!S.stagePassed[L.stage]; }
const nextLesson = () => { const ps = S.placeStart ? ORDER.indexOf(S.placeStart) : -1; return (ps >= 0 && ORDER.find((id, i) => i >= ps && isOpen(id) && !passed(id))) || ORDER.find(id => isOpen(id) && !passed(id)) || null; };
const dueCards = () => { const now = Date.now(); return Object.keys(S.cards).filter(k => S.cards[k].due <= now); };
const stageProgress = st => st.lessons.length ? Math.round(st.lessons.filter(L => passed(L.id)).length / st.lessons.length * 100) : 0;
function plan() {
  const due = dueCards().length, hasCards = Object.keys(S.cards).length > 0, m = minutesToday(), g = S.settings.goal, l = (S.log[today()] || {}).lessons || 0;
  return [
    { ic: "cards", t: "Ôn từ đến hạn", d: !hasCards ? "Chưa có thẻ nào" : due ? due + " thẻ đang chờ" : "Đã ôn xong", ok: hasCards ? due === 0 : l > 0, go: "nav('review')" },
    { ic: "book", t: "Học 1 bài mới", d: l ? "Đã học " + l + " bài" : "Chưa học bài nào", ok: l >= 1, go: "goNext()" },
    { ic: "clock", t: `Học đủ ${g} phút`, d: m + " / " + g + " phút", ok: m >= g, go: "goNext()" }
  ];
}
function checkDay() { const p = plan(); if (p.every(x => x.ok) && !S.dayDone[today()]) { S.dayDone[today()] = 1; addXP(50); save(); setTimeout(() => celebrate("calendar-check", "Hoàn thành kế hoạch hôm nay", "Thưởng thêm <b>+50 XP</b>", 3400), 900); } }
function goNext() { const n = nextLesson(); if (n) openIntro(n); else nav("road"); }

/* ---------- Điều hướng ---------- */
let TAB = "home", P = null, VIEW = null, OB = 0;
function nav(t) { if (window.__upd) { location.reload(); return; } toastOff(); micOff(); TAB = t; P = null; VIEW = null; render(); window.scrollTo(0, 0); }
// pháo giấy chỉ thuộc về màn hình kết quả vừa hiện: sang màn khác thì dọn ngay (không rơi tiếp lên màn sau, kể cả màn "chưa đạt")
const noConfetti = () => document.querySelectorAll(".confetti").forEach(c => c.remove());
function render() { noConfetti(); renderIn(); pushSub(); }
/* Nút Back của điện thoại / trình duyệt: khi đang ở ngoài trang chủ, giữ một mục lịch sử để Back đi theo nút quay lại / thoát của app
   (giữa bài học: lưu chỗ rồi về trang giới thiệu bài; giữa bài thi: hỏi "Bỏ dở bài thi?"), không thoát app.
   Ở trang chủ không giữ mục nào: Back lần nữa thì thoát như bình thường. */
let HIST = (() => { try { return history.state && history.state.hta ? 1 : 0; } catch (e) { return 0; } })();
const inGame = () => typeof G !== "undefined" && !!G;
const inSub = () => S.onb ? !!(P || VIEW || inGame() || TAB !== "home" || $(".modal") || $("#app .donescr")) : !!(P || OB > 0 || $(".modal"));
function pushSub() { if (!HIST && inSub()) { try { history.pushState({ hta: 1 }, ""); HIST = 1; } catch (e) {} } }
function onBack() {
  const ms = $$(".modal");
  if (ms.length) { const m = ms[ms.length - 1], no = m.querySelector("#mno"); no ? no.click() : m.remove(); } // hộp thoại: Back = nút bên trái (Thi tiếp / Làm tiếp / Không)
  else if (P) quit();
  else if (!S.onb) { if (OB > 0) { OB--; render(); } }
  else if (inGame()) exitGame();
  else if ($("#app .donescr")) nav(TAB);
  else if (VIEW) { const b = $("#app .ptop .ib"); if (b) b.click(); else { VIEW = null; render(); } }
  else if (TAB !== "home") nav("home");
}
addEventListener("popstate", () => { HIST = 0; try { onBack(); } catch (e) { console.error(e); } setTimeout(pushSub, 0); });
function renderIn() {
  applyTheme();
  const inPlayer = !!P || !!VIEW || !S.onb;
  document.body.classList.toggle("playing", inPlayer);
  $$("#nav button").forEach(b => b.classList.toggle("on", b.dataset.t === (TAB === "book" ? "review" : TAB)));
  if (!S.onb && !P) return vOnb();
  if (P) return showStep();
  if (VIEW) { VIEW(); toastFit(); return; }
  ({ home: vHome, road: vRoad, gram: vGram, exam: vExam, play: vPlay, review: vReview, book: vBook, me: vMe })[TAB]();
  toastFit();
}
function applyTheme() {
  const t = S.settings.theme, de = document.documentElement; const dark = t === "dark" || (t === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  de.dataset.theme = dark ? "dark" : "light"; const a = S.settings.accent2 || "ngoc"; if (a === "ngoc") delete de.dataset.accent; else de.dataset.accent = a;
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = dark ? "#0F1614" : (getComputedStyle(de).getPropertyValue("--pri").trim() || "#0C7F67");
}
/* đổi màu / chế độ: chuyển màu mượt trong 0,4 giây */
function setLook(k, v) { const de = document.documentElement; de.classList.add("thx"); clearTimeout(setLook.h); setLook.h = setTimeout(() => de.classList.remove("thx"), 450); S.settings[k] = v; save(); applyTheme(); render(); }

/* ---------- Chào mừng ---------- */
function vOnb() {
  const g = S.settings.goal;
  const hero = `<svg viewBox="0 0 240 150" class="heroart" aria-hidden="true"><rect x="20" y="20" width="120" height="64" rx="18" fill="var(--pri)"/><path d="M48 84 L40 104 L68 84Z" fill="var(--pri)"/><text x="80" y="60" text-anchor="middle" font-size="26" font-weight="700" fill="#fff" font-family="inherit">Hello!</text><rect x="104" y="64" width="118" height="60" rx="18" fill="var(--acc)"/><path d="M196 124 L204 142 L178 124Z" fill="var(--acc)"/><text x="163" y="101" text-anchor="middle" font-size="21" font-weight="700" fill="#3B2603" font-family="inherit">Xin chào!</text></svg>`;
  let h = `<div class="onb">`;
  if (OB === 0) h += `${hero}<h1>Tiếng Anh từ số 0</h1><p class="lead">Lộ trình rõ ràng từ chưa biết gì đến <b>nghe, nói, đọc, viết</b> thành thạo. Mỗi ngày một chút, app nhắc ôn đúng lúc.</p>
    <ul class="feat"><li><i class="ti ti-route"></i><span><b>6 chặng, 116 bài</b> theo khung chuẩn châu Âu CEFR<br><span class="nw">0 → A1 → A2 → B1 → B2 → C1</span></span></li><li><i class="ti ti-microphone"></i><span><b>Luyện nói</b> có máy chấm phát âm</span></li><li><i class="ti ti-brain"></i><span><b>Ôn từ thông minh</b>: nhắc đúng lúc sắp quên</span></li><li><i class="ti ti-language"></i><span><b>Giải thích bằng tiếng Việt</b>, dễ hiểu</span></li></ul>
    <button class="btn primary full lg" onclick="OB=1;render()">Bắt đầu</button>`;
  else if (OB === 1) h += `<p class="stepn">Bước 1/2</p><h1>Mỗi ngày bạn học bao lâu?</h1><p class="muted">Đều đặn quan trọng hơn học nhiều.<br>Bạn đổi được bất cứ lúc nào.</p><div class="choices">
    ${[[15, "Nhẹ nhàng", "coffee"], [30, "Đều đặn", "walk"], [60, "Nghiêm túc", "run"], [90, "Tăng tốc", "rocket"]].map(x => `<button class="choice ${g === x[0] ? "on" : ""}" onclick="S.settings.goal=${x[0]};save();render()"><i class="ti ti-${x[2]}"></i><span class="grow"><b class="nw">${x[0]}&nbsp;phút/ngày</b><small>${x[0] === 60 ? "Nên chọn" : x[1]}</small></span><small class="eta">B2 sau ~${etaTxt(x[0])}</small></button>`).join("")}</div>
    <p class="note">Ước tính theo Cambridge: cần khoảng <span class="nw">500–600 giờ</span> học có hướng dẫn để từ số 0 đạt B2.</p><button class="btn primary full lg" onclick="OB=2;render()">Tiếp tục</button>`;
  else h += `<p class="stepn">Bước 2/2</p><h1>Bạn biết <span class="nw">tiếng Anh</span> đến đâu?</h1><p class="muted">Để app xếp bạn vào đúng bài.</p><div class="choices">
    <button class="choice" onclick="finishOnb('zero')"><i class="ti ti-plant"></i><span class="grow"><b>Tôi mới bắt đầu</b><small>Bắt đầu từ phát âm và bảng chữ cái</small></span><i class="ti ti-chevron-right"></i></button>
    <button class="choice" onclick="finishOnb('test')"><i class="ti ti-clipboard-check"></i><span class="grow"><b>Tôi biết một chút</b><small>Kiểm tra nhanh ${PLACEMENT.length} câu, khoảng ${Math.ceil(PLACEMENT.length / 4)} phút</small></span><i class="ti ti-chevron-right"></i></button></div>
    <button class="link" onclick="OB=1;render()"><i class="ti ti-arrow-left"></i> Quay lại</button>`;
  app().innerHTML = h + `</div>`;
}
const etaMonths = g => Math.round(550 * 60 / g / 30), etaTxt = g => { const m = etaMonths(g); return m > 24 ? Math.round(m / 12) + " năm" : m + " tháng"; };
function finishOnb(m) { S.onb = true; if (m === "zero") { S.placement = "zero"; save(); openIntro("s0-1"); } else { save(); startPlacement(); } }

/* ---------- Trang chủ ---------- */
function vHome() {
  const n = nextLesson(), L = n && LES[n], st = L && stageOf(L.stage), lv = levelOf(S.xp), p = plan(), pd = p.filter(x => x.ok).length;
  const hr = new Date().getHours(), hi = hr < 11 ? "Chào buổi sáng" : hr < 14 ? "Chào buổi trưa" : hr < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  const mk = Object.keys(S.mistakes).length, due = dueCards().length;
  let h = `<header class="hero hero2"><p class="muted hi">${hi}</p><div class="hctl"><div class="streak" title="Chuỗi ngày học" aria-label="Chuỗi ${streak()} ngày học"><i class="ti ti-flame"></i><b>${streak()}</b><span>ngày</span></div><button class="avatar" onclick="nav('me')" aria-label="Hồ sơ"><i class="ti ti-user-circle"></i></button></div><h1>Hôm nay học gì nào?</h1></header>`;
  if (L) {
    const rs = S.resume && S.resume.id === n;
    h += `<section class="card big" onclick="openIntro('${n}')"><div class="row between"><span class="tag">${st.name} · Bài ${L.no}/${st.lessons.length}</span><span class="sm muted">${stageProgress(st)}% chặng</span></div><h2>${esc(L.t)}</h2><p class="muted">${L.W.length} ${L.kind === "letters" ? "chữ cái" : "từ mới"} · ~25 phút<br><span class="nw">${L.stage === "s0" ? "Nghe · Nói · Phát âm" : "Nghe · Nói · Đọc · Viết"}</span></p><button class="btn primary full lg">${rs ? "Học tiếp" : "Vào học"} <i class="ti ti-arrow-right"></i></button></section>`;
  } else h += `<section class="card big"><h2>Bạn đã học hết nội dung hiện có!</h2><p class="muted">Bạn đã đi hết toàn bộ lộ trình từ số 0 đến C1. Hãy ôn thẻ và chơi trò chơi mỗi ngày để giữ vốn từ.</p><button class="btn full" onclick="nav('road')">Xem lộ trình</button></section>`;
  if (installEvt && !S.hideInstall) h += `<section class="card accent row"><i class="ti ti-device-mobile bigi"></i><div class="grow"><b>Cài app lên điện thoại</b><p class="sm">Mở nhanh từ màn hình chính, học cả khi không có mạng.</p></div><button class="btn primary" onclick="doInstall()">Cài</button><button class="ib" aria-label="Ẩn" onclick="S.hideInstall=true;save();render()"><i class="ti ti-x"></i></button></section>`;
  h += `<section class="card"><div class="row between"><h3>Kế hoạch hôm nay</h3><span class="pill ${pd === 3 ? "good" : ""}">${pd}/3</span></div>
  ${p.map(x => `<button class="task ${x.ok ? "ok" : ""}" onclick="${x.go}"><span class="chk">${x.ok ? '<i class="ti ti-check"></i>' : ""}</span><i class="ti ti-${x.ic}"></i><span class="grow"><b>${x.t}</b><small>${x.d}</small></span><i class="ti ti-chevron-right muted"></i></button>`).join("")}</section>`;
  h += `<section class="card lvl" onclick="nav('me')"><div class="lvn">${lv.n}</div><div class="grow"><p class="sm muted">Cấp ${lv.n} · ${levelName(lv.n)}</p><div class="bar sm"><span style="width:${lv.pct}%"></span></div><p class="sm muted">${S.xp} XP · còn ${lv.need} XP lên cấp</p></div></section>`;
  h += `<div class="quick"><button onclick="nav('review')"><i class="ti ti-cards"></i><b>${due}</b><span>thẻ cần ôn</span></button><button onclick="${mk ? "startMistakes()" : "nav('book')"}"><i class="ti ti-alert-triangle"></i><b>${mk}</b><span>lỗi cần sửa</span></button><button onclick="nav('book')"><i class="ti ti-notebook"></i><b>${Object.keys(S.cards).length}</b><span>từ đã học</span></button></div>`;
  h += `<h4 class="sec">Một buổi học 60 phút lý tưởng</h4><div class="loop">${[["cards", "10'", "Ôn thẻ"], ["headphones", "15'", "Nghe"], ["microphone", "15'", "Nói theo"], ["book", "10'", "Đọc"], ["pencil", "10'", "Viết"]].map(x => `<div><i class="ti ti-${x[0]}"></i><b>${x[1]}</b><span>${x[2]}</span></div>`).join("")}</div>`;
  if (window.TEACHER && TEACHER.homeCard) h = TEACHER.homeCard(h);
  app().innerHTML = h;
}

/* ---------- Lộ trình ---------- */
let openStage = null;
function vRoad() {
  const th = totalHours(), g = S.settings.goal;
  let h = `<header class="page"><h1>Lộ trình của bạn</h1><p class="muted">Từ số 0 đến C1, đích đến là B2: tự tin dùng tiếng&nbsp;Anh khi làm việc và sống.</p>
  <div class="card flat"><div class="row between"><span>Đã học <b>${th < 1 ? Math.round(th * 60) + " phút" : vnum(th, 1) + " giờ"}</b></span><span class="muted sm">mục tiêu ~550 giờ</span></div><div class="bar"><span style="width:${Math.min(100, th / 550 * 100).toFixed(1)}%"></span></div><p class="sm muted">Với ${g}&nbsp;phút mỗi ngày,<br>bạn đạt B2 sau khoảng ${Math.max(1, Math.round((550 - th) * 60 / g / 30))}&nbsp;tháng nữa.</p></div></header>`;
  if (!openStage) openStage = (LES[nextLesson()] || {}).stage || "s0";
  STAGES.forEach(st => {
    const p = stageProgress(st), op = openStage === st.id, done = stageDone(st.id) && !st.locked;
    h += `<section class="card stage ${st.locked ? "lock" : ""} ${op ? "open" : ""}"><button class="sthead" onclick="openStage=openStage==='${st.id}'?'-':'${st.id}';render()"><div class="badge lv-${st.id} ${done ? "done" : ""}">${done ? '<i class="ti ti-check"></i>' : st.name}</div><div class="grow"><h3>${st.name === "Chặng 0" ? "" : st.name + " · "}<span class="nw">${st.title}</span></h3><p class="muted sm">${st.hours} giờ · ${st.words}${st.locked ? " · đang soạn" : " · " + st.lessons.length + " bài · " + p + "%"}</p>${st.locked ? "" : `<div class="bar sm"><span style="width:${p}%"></span></div>`}</div><i class="ti ti-${st.locked ? "lock" : op ? "chevron-up" : "chevron-down"}"></i></button>`;
    if (op) {
      h += `<p class="lab">Học xong bạn làm được:</p><ul class="goals">${st.goals.map(x => `<li><i class="ti ti-check"></i>${x}</li>`).join("")}</ul>`;
      if (st.locked) h += `<p class="sm muted">Chặng này đang được soạn và sẽ có trong bản cập nhật tới. Trong lúc chờ, hãy ôn thẻ đều đặn để giữ từ vựng.</p>`;
      else {
        h += `<div class="lessons">` + st.lessons.map(L => { const o = isOpen(L.id), d = S.done[L.id]; return `<button class="les ${o ? "" : "off"} ${passed(L.id) ? "ok" : ""}" onclick="${o ? `openIntro('${L.id}')` : `toast('Cần đạt 80% ở bài trước<br>để mở bài này')`}"><span class="n">${passed(L.id) ? '<i class="ti ti-check"></i>' : L.no}</span><span class="grow">${esc(L.t)}</span><span class="sc">${d ? d.best + "%" : o ? '<i class="ti ti-player-play"></i>' : '<i class="ti ti-lock"></i>'}</span></button>`; }).join("") + `</div>`;
        h += `<button class="btn full xbtn" onclick="startExam('${st.id}')"><i class="ti ti-certificate"></i><span><b>${S.stagePassed[st.id] ? "Làm lại bài kiểm tra vượt chặng" : "Bài kiểm tra vượt chặng"}</b><small>Đạt 80% để mở mọi bài trong chặng</small></span></button>`;
      }
    }
    h += `</section>`;
  });
  h += `<p class="note">Số giờ theo khung CEFR và ước tính của Cambridge English. Từ vựng bám theo danh sách Oxford 3000.</p>`;
  app().innerHTML = h;
}

/* ---------- Ôn tập ---------- */
function vReview() {
  const due = dueCards().length, total = Object.keys(S.cards).length, mast = Object.values(S.cards).filter(c => c.box >= 4).length, mk = Object.keys(S.mistakes).length;
  let h = `<header class="page"><h1>Ôn tập</h1><p class="muted">Mỗi từ được nhắc lại đúng lúc bạn sắp quên.<br>Nhớ thì giãn ra, quên thì nhắc sớm.</p></header>
  <div class="stats"><div><b>${due}</b><span>đến hạn</span></div><div><b>${total}</b><span>đã học</span></div><div><b>${mast}</b><span>đã thuộc</span></div></div>`;
  if (due) h += `<button class="btn primary full lg" onclick="startReview()"><i class="ti ti-player-play"></i> Ôn ${Math.min(due, 20)} thẻ ngay</button>`;
  else if (total) h += `<section class="card"><p><b>Hôm nay đã ôn xong.</b> Ôn thêm giúp nhớ chắc hơn.</p><button class="btn full" onclick="startReview(true)">Ôn thêm 10 thẻ</button></section>`;
  else h += `<section class="card"><p>Chưa có thẻ nào. Học xong một bài, các từ mới sẽ tự vào đây.</p><button class="btn primary full" onclick="goNext()">Đi học bài</button></section>`;
  h += `<section class="card row" ${mk ? `onclick="startMistakes()"` : ""}><div class="ico warn"><i class="ti ti-alert-triangle"></i></div><div class="grow"><h3>Luyện lại lỗi sai</h3><p class="muted sm">${mk ? mk + " lỗi bạn từng làm sai" : "Chưa có lỗi nào. Tuyệt vời!"}</p></div>${mk ? '<i class="ti ti-chevron-right"></i>' : ""}</section>`;
  h += `<section class="card row" onclick="nav('book')"><div class="ico"><i class="ti ti-notebook"></i></div><div class="grow"><h3>Sổ tay</h3><p class="muted sm">Từ đã học, lỗi sai và ngữ pháp</p></div><i class="ti ti-chevron-right"></i></section>`;
  if (total) {
    const boxes = Array(8).fill(0); Object.values(S.cards).forEach(c => boxes[Math.min(7, c.box)]++); const mx = Math.max(...boxes, 1);
    h += `<h4 class="sec">Độ nhớ của bạn</h4><div class="chart boxes">${["Mới", "1 ngày", "2 ngày", "4 ngày", "7 ngày", "15 ngày", "30 ngày", "60 ngày"].map((l, i) => `<div><b>${boxes[i]}</b><span style="height:${Math.max(3, boxes[i] / mx * 100)}%"></span><small>${l.replace(" ngày", '<span class="dunit"> ngày</span>')}</small></div>`).join("")}</div><p class="note"><span class="dcap">Số dưới cột là số ngày giữa hai lần ôn. </span>Cột càng dồn về bên phải nghĩa là bạn nhớ càng lâu.</p>`;
  }
  app().innerHTML = h;
}

/* ---------- Sổ tay ---------- */
let BK = { seg: "words", q: "", f: "learned", lim: 150 };
function vBook() {
  let h = `<header class="page"><button class="link back" onclick="nav('review')"><i class="ti ti-arrow-left"></i> Ôn tập</button><h1>Sổ tay</h1></header><div class="seg big">${[["words", "Từ vựng"], ["mist", "Lỗi sai"], ["gram", "Ngữ pháp"]].map(x => `<button class="${BK.seg === x[0] ? "on" : ""}" onclick="BK.seg='${x[0]}';render()">${x[1]}</button>`).join("")}</div>`;
  if (BK.seg === "words") {
    h += `<div class="search"><i class="ti ti-search"></i><input id="q" placeholder="Tìm từ tiếng Anh hoặc tiếng Việt" value="${esc(BK.q)}" oninput="BK.q=this.value;BK.lim=150;drawWords()"></div>
    <div class="chips2">${[["all", "Tất cả"], ["learned", "Đã học"], ["weak", "Đang yếu"], ["master", "Đã thuộc"]].map(x => `<button class="${BK.f === x[0] ? "on" : ""}" onclick="BK.f='${x[0]}';BK.lim=150;render()">${x[1]}</button>`).join("")}</div><p class="sm muted memleg"><span class="memd" aria-hidden="true"><i class="on"></i><i class="on"></i><i class="on"></i><i></i><i></i></span> Mức nhớ: càng nhiều vạch càng nhớ lâu</p><div id="wl"></div>`;
    app().innerHTML = h; drawWords(); return;
  }
  if (BK.seg === "mist") {
    const ms = Object.values(S.mistakes).sort((a, b) => b.at - a.at);
    h += ms.length ? `<button class="btn primary full" onclick="startMistakes()"><i class="ti ti-refresh"></i> Luyện lại ${ms.length} lỗi</button><p class="note">Làm đúng 2 lần, lỗi sẽ tự biến mất khỏi danh sách.</p>` + ms.map(m => { const x = m.t === "gram" ? gramFix(m.g) : m; return `<div class="word mrow">${spk(x.en)}<div class="grow"><b class="${m.t !== "word" ? "sent" : ""}">${esc(x.en)}</b><span class="vi">${esc(x.vi)}</span><span class="pill bad">sai ${m.n}&nbsp;lần</span></div></div>`; }).join("") : `<section class="card c"><i class="ti ti-mood-happy bigi"></i><p>Chưa có lỗi sai nào. Những câu bạn làm sai sẽ được lưu ở đây để luyện lại.</p></section>`;
  } else {
    const ls = ORDER.filter(id => isOpen(id) && LES[id].g);
    h += `<p class="muted sm">Các điểm ngữ pháp của những bài bạn đã mở.</p>` + ls.map(id => { const L = LES[id]; return `<details class="card gd"><summary><span class="tag">${stageOf(L.stage).name} · ${L.no}</span> ${esc(L.t)}</summary><div class="gram">${L.g}</div></details>`; }).join("");
  }
  app().innerHTML = h;
}
function drawWords() {
  const q = norm(BK.q), qv = BK.q.trim().toLowerCase();
  let list = ALLW.filter(w => {
    const c = S.cards[w.en];
    if (BK.f === "learned" && !c) return false; if (BK.f === "master" && !(c && c.box >= 4)) return false; if (BK.f === "weak" && !(c && c.box <= 1)) return false;
    if (BK.f === "all" && !isOpen(w.lid)) return false;
    return !qv || w.en.toLowerCase().includes(qv) || norm(w.en).includes(q) || w.vi.toLowerCase().includes(qv);
  });
  const n = list.length; list = list.slice(0, BK.lim);
  $("#wl").innerHTML = (n ? `<p class="sm muted">${n} từ${n > BK.lim ? ` · đang hiện ${BK.lim} từ đầu` : ""}</p>` : `<p class="muted c">${BK.f === "learned" && !Object.keys(S.cards).length ? "Học xong bài đầu tiên, từ vựng sẽ xuất hiện ở đây." : "Không tìm thấy từ nào."}</p>${BK.q.trim() ? `<button class="btn full" onclick="BK.q='';BK.lim=150;render()"><i class="ti ti-x"></i> Xóa tìm kiếm</button>` : ""}`) +
    list.map(w => { const c = S.cards[w.en], b = c ? c.box : -1; return `<div class="word">${spk(w.en)}<div class="grow"><b>${esc(w.en)}</b><span class="vi">${esc(w.vi)}</span></div><span class="memd" title="Mức nhớ ${Math.max(0, Math.min(5, b - 1))}/5" aria-label="Mức nhớ ${Math.max(0, Math.min(5, b - 1))}/5">${[1, 2, 3, 4, 5].map(i => `<i class="${b >= i + 1 ? "on" : ""}"></i>`).join("")}</span></div>`; }).join("") + (n > BK.lim ? `<button class="btn full" onclick="BK.lim+=150;drawWords()">Xem thêm ${Math.min(150, n - BK.lim)} từ</button>` : "");
}

/* ---------- Hồ sơ ---------- */
function vMe() {
  const done = ORDER.filter(passed).length, th = totalHours(), lv = levelOf(S.xp);
  const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push({ l: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()], m: Math.round((S.days[dkey(d)] || 0) / 60) }); }
  const mx = Math.max(S.settings.goal, ...days.map(d => d.m));
  let h = `<header class="page"><h1>Hồ sơ</h1></header>
  <section class="card lvl"><div class="lvn xl">${lv.n}</div><div class="grow"><h3>Cấp ${lv.n} · ${levelName(lv.n)}</h3><div class="bar"><span style="width:${lv.pct}%"></span></div><p class="sm muted">${S.xp} XP · còn ${lv.need} XP lên cấp ${lv.n + 1}</p></div></section>
  <div class="stats"><div><b>${streak()}</b><span>ngày liên tiếp</span></div><div><b>${done}</b><span>bài đã xong</span></div><div><b>${th < 1 ? Math.round(th * 60) + "'" : vnum(th, 1) + " giờ"}</b><span>tổng thời gian</span></div></div>
  <h4 class="sec">7 ngày qua (phút)</h4><div class="chart week">${days.map(d => `<div><b>${d.m}</b><span class="${d.m >= S.settings.goal ? "full" : ""}" style="height:${Math.max(3, d.m / mx * 100)}%"></span><small>${d.l}</small></div>`).join("")}</div>
  <h4 class="sec">Độ chính xác theo kỹ năng</h4><section class="card">${Object.keys(SK).map(k => { const v = S.skill[k] || [0, 0], p = v[1] ? Math.round(v[0] / v[1] * 100) : 0; return `<div class="skrow sk-${k}"><i class="ti ti-${SKI[k]}"></i><span class="skn">${SK[k]}</span><div class="bar grow"><span style="width:${p}%"></span></div><b>${v[1] ? p + "%" : "–"}</b></div>`; }).join("")}</section>
  <h4 class="sec">Huy hiệu (${Object.keys(S.badges).length}/${BADGES.length})</h4><div class="badges">${BADGES.map(b => `<div class="bdg ${S.badges[b[0]] ? "on" : ""}" onclick="toast('<b>${b[2]}</b>: ${b[3]}')"><i class="ti ti-${b[1]}"></i><span>${b[2]}</span></div>`).join("")}</div>
  <h4 class="sec" id="appear">Giao diện</h4><section class="card set">
  <label>Chế độ sáng / tối</label><div class="seg">${[["light", "Sáng"], ["dark", "Tối"], ["auto", "Tự động"]].map(x => `<button class="${S.settings.theme === x[0] ? "on" : ""}" aria-pressed="${S.settings.theme === x[0]}" onclick="setLook('theme','${x[0]}')">${x[1]}</button>`).join("")}</div>
  <label id="acclab">Màu chủ đạo</label><div class="swatches" role="radiogroup" aria-labelledby="acclab">${ACCENTS.map(a => { const on = S.settings.accent2 === a[0]; return `<button class="sw ${on ? "on" : ""}" data-acc="${a[0]}" role="radio" aria-checked="${on}" onclick="setLook('accent2','${a[0]}')"><span class="dot">${on ? '<i class="ti ti-check"></i>' : ""}</span><small>${a[1]}</small></button>`; }).join("")}</div></section>
  <h4 class="sec">Cài đặt</h4><section class="card set">
  <label>Mục tiêu mỗi ngày</label><div class="seg">${[15, 30, 60, 90].map(x => `<button class="${S.settings.goal === x ? "on" : ""}" onclick="S.settings.goal=${x};save();render()">${x}'</button>`).join("")}</div>
  <label>Giọng đọc</label><div class="seg">${[["en-US", "Anh – Mỹ"], ["en-GB", "Anh – Anh"]].map(x => `<button class="${S.settings.accent === x[0] ? "on" : ""}" onclick="S.settings.accent='${x[0]}';save();render()">${x[1]}</button>`).join("")}</div>
  <label for="rate">Tốc độ đọc <b id="rv">${vdec(S.settings.rate)}×</b></label><input type="range" id="rate" min="0.6" max="1.2" step="0.1" value="${S.settings.rate}" aria-label="Tốc độ đọc" oninput="S.settings.rate=+this.value;$('#rv').textContent=vdec(this.value)+'×';save()">
  <button class="btn full" onclick="say('Hello! Nice to meet you. How are you today?')"><i class="ti ti-volume"></i> Nghe thử giọng</button>
  <button class="btn full" onclick="micTest()"><i class="ti ti-microphone"></i> Kiểm tra micro</button><div id="mictest" aria-live="polite"></div>
  <label>Tên của bạn (in trên chứng nhận)</label><input class="inp" value="${esc(S.name || "")}" placeholder="Nhập họ tên" onchange="S.name=this.value.trim();save()">
  <label class="tg">Âm thanh đúng / sai <input type="checkbox" ${S.settings.sound ? "checked" : ""} onchange="S.settings.sound=this.checked;save()"></label></section>
  ${installEvt ? `<button class="btn primary full" onclick="doInstall()"><i class="ti ti-device-mobile"></i> Cài app lên màn hình chính</button>` : isIOS() ? `<section class="card sm iostip"><b>Cài lên iPhone:</b> trong Safari bấm nút <span class="nw">Chia sẻ <i class="ti ti-share-2"></i></span> rồi chọn “Thêm vào MH chính”.</section>` : ""}
  <h4 class="sec">Sao lưu tiến độ</h4><section class="card set"><p class="muted sm">Tiến độ lưu trên trình duyệt của máy này. Muốn học trên máy khác, hãy tải tệp sao lưu rồi mở ở máy kia.</p>
  <div class="row2"><button class="btn" onclick="exportFile()"><i class="ti ti-download"></i> Tải tệp</button><button class="btn" onclick="exportCode()"><i class="ti ti-copy"></i> Chép mã</button></div>
  <label class="btn full fileb"><i class="ti ti-upload"></i> Khôi phục từ tệp<input type="file" accept=".json,application/json" onchange="importFile(this)"></label>
  <textarea id="bk" rows="2" placeholder="Hoặc dán mã sao lưu vào đây" oninput="$('#bkerr').textContent=''"></textarea><p class="err" id="bkerr"></p><button class="btn full" onclick="importCode()">Khôi phục từ mã</button>
  <button class="btn full danger" onclick="askReset()"><i class="ti ti-trash"></i> Xóa toàn bộ tiến độ</button></section>
  <p class="note">Tiếng Anh Từ Số 0 · nội dung bám khung CEFR và danh sách từ Oxford 3000<br><a class="foot" href="https://github.com/cafecunghoai/hoc-tieng-anh">Mã nguồn trên GitHub</a></p>`;
  app().innerHTML = h;
}
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
const backupStr = () => JSON.stringify(Object.assign({}, S, { resume: null, mockOpen: null }));
function exportFile() { try { const b = new Blob([backupStr()], { type: "application/json" }), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "sao-luu-tieng-anh-" + today() + ".json"; document.body.appendChild(a); a.click(); a.remove(); toast("Đã tải tệp sao lưu"); } catch (e) { exportCode(); } }
function exportCode() { const c = btoa(unescape(encodeURIComponent(backupStr()))); const t = $("#bk"); if ($("#bkerr")) $("#bkerr").textContent = ""; t.value = c; t.select(); try { navigator.clipboard.writeText(c).then(() => toast("Đã chép mã sao lưu"), () => toast("Hãy tự chép đoạn mã trong ô")); } catch (e) { toast("Hãy tự chép đoạn mã trong ô"); } }
/* Mã sao lưu đến từ bên ngoài: không nhận phần "học tiếp" (chứa HTML của bài học) */
function restore(x) { if (!x || typeof x !== "object" || !x.done) throw 0; S = merge(Object.assign({}, x, { resume: null, mockOpen: null })); S.onb = true; S._rev = REV; S._wipe = Date.now(); save(true); nav("home"); toast("Đã khôi phục tiến độ"); }
function importFile(inp) { const f = inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { restore(JSON.parse(r.result)); } catch (e) { $("#bkerr").textContent = "Tệp không đúng định dạng sao lưu."; } }; r.readAsText(f); }
function importCode() { const v = $("#bk").value.trim(), e = $("#bkerr"); if (!v) { e.textContent = "Dán mã sao lưu vào ô trước."; return; } try { restore(JSON.parse(decodeURIComponent(escape(atob(v))))); } catch (er) { e.textContent = "Mã không đúng. Hãy kiểm tra lại."; } }
function askReset() { modal("Xóa toàn bộ tiến độ?", "Mọi bài đã học, thẻ ôn, XP và huy hiệu sẽ mất.<br>Không thể hoàn tác.", "Xóa hết", () => { S = def(); S._rev = REV; S._wipe = Date.now(); save(true); OB = 0; nav("home"); }, true, "Giữ lại"); }
function modal(t, m, ok, fn, danger, cancel, fnCancel) { const d = document.createElement("div"); d.className = "modal"; d.innerHTML = `<div class="box"><h3>${t}</h3><p>${m}</p><div class="row2"><button class="btn" id="mno">${cancel || "Không"}</button><button class="btn ${danger ? "dangerf" : "primary"}" id="mok">${ok}</button></div></div>`; document.body.appendChild(d); d.querySelector("#mno").onclick = () => { d.remove(); if (fnCancel) fnCancel(); }; d.querySelector("#mok").onclick = () => { if (fn() !== false) d.remove(); }; pushSub(); }

/* ---------- Giới thiệu bài ---------- */
function openIntro(id) {
  if (!isOpen(id)) { toast("Bài này chưa mở"); return; }
  VIEW = () => {
    const L = LES[id], st = stageOf(L.stage), rs = S.resume && S.resume.id === id ? S.resume : null, d = S.done[id];
    const tmp = document.createElement("div"); tmp.innerHTML = L.g; const heads = [...tmp.querySelectorAll("h4")].map(x => x.textContent);
    const focus = heads.length ? heads : [tmp.textContent.split(".")[0]];
    const sk = L.stage === "s0" ? ["listen", "speak", "vocab"] : ["vocab", "gram", "listen", "speak", "read", "write"];
    app().innerHTML = `<div class="ptop"><button class="ib" onclick="nav(TAB)" aria-label="Quay lại"><i class="ti ti-arrow-left"></i></button><span class="muted sm">${st.name} · Bài ${L.no}/${st.lessons.length}</span></div>
    <div class="intro"><h1>${esc(L.t)}</h1>${d ? `<p class="pill ${d.best >= 80 ? "good" : ""}">Điểm cao nhất: ${d.best}%</p>` : ""}
    <div class="skills" aria-label="Kỹ năng trong bài">${sk.map(k => `<span class="sk-${k}"><i class="ti ti-${SKI[k]}"></i>${SK[k]}</span>`).join("")}</div>
    <section class="card"><p class="lab">Trọng tâm bài học</p><ul class="goals">${focus.map(x => `<li><i class="ti ti-target"></i>${esc(x)}</li>`).join("")}</ul></section>
    <section class="card"><p class="lab">${L.W.length} ${L.kind === "letters" ? "chữ cái" : "từ mới"} · bấm để nghe</p><div class="chips">${L.W.slice(0, 14).map(w => `<button class="chip sm" onclick="say('${jsq(w.en)}')">${esc(w.en)}</button>`).join("")}${L.W.length > 14 ? `<span class="muted sm">+${L.W.length - 14}</span>` : ""}</div></section>
    <p class="note">Cần đạt 80% để mở bài tiếp theo.<br>Câu làm sai sẽ được hỏi lại ở cuối bài.</p>
    ${rs ? `<button class="btn primary full lg" onclick="resumeLesson()"><i class="ti ti-player-play"></i> Học tiếp (câu ${Math.min(rs.P.i + 1, baseN(rs.P))}/${baseN(rs.P)})</button><button class="btn full" onclick="startLesson('${id}')">Học lại từ đầu</button>` : `<button class="btn primary full lg" onclick="startLesson('${id}')"><i class="ti ti-player-play"></i> Bắt đầu học</button>`}</div>`;
  };
  toastOff(); P = null; render(); window.scrollTo(0, 0);
}

/* ---------- Tạo bài tập ---------- */
function mqMeaning(w, pool) { const same = pool.filter(x => x.en.toLowerCase() === w.en.toLowerCase()).flatMap(x => glossParts(x.vi)), p = opts(w.vi, pool.filter(x => x.en.toLowerCase() !== w.en.toLowerCase() && !never(w.en, x.en)).map(x => x.vi), same, true); return { type: "mcq", sk: "vocab", label: "Chọn nghĩa đúng", q: w.en, sub: w.ipa ? "/" + w.ipa + "/" : "", audio: w.en, o: p.o.map(x => x.split("; ")[0]), a: p.a, mk: w.en }; } // nghĩa gộp từ nhiều bài: chỉ hiện nghĩa đầu (đủ nghĩa xem trong Sổ tay)
function mqReverse(w, pool) { const mine = new Set(glossParts(w.vi)), ml = [...mine], cand = pool.filter(x => x.vi !== w.vi && !(VIMAP[w.vi] || new Set()).has(x.en) && !glossParts(x.vi).some(g => mine.has(g)) && x.en.toLowerCase() !== w.en.toLowerCase() && !never(w.en, x.en)), good = cand.filter(x => !nearAny(x.vi, ml));
  const p = opts(w.en, (good.length >= 3 ? good : good.concat(shuffle(cand.filter(x => !good.includes(x))).slice(0, 3 - good.length))).map(x => x.en)); return { type: "mcq", sk: "vocab", label: "Chọn từ tiếng Anh đúng", q: w.vi, vq: 1, o: p.o, a: p.a, mk: w.en, sayAns: 1 }; }
const HOMO = [["two", "too", "to"], ["write", "right"], ["hour", "our"], ["I", "eye"], ["know", "no"], ["buy", "by", "bye"], ["for", "four"], ["son", "sun"], ["meet", "meat"], ["their", "there"], ["red", "read"], ["ate", "eight"], ["weather", "whether"], ["wear", "where"], ["bored", "board"], ["see", "sea"], ["week", "weak"], ["hear", "here"], ["one", "won"], ["flower", "flour"], ["mail", "male"], ["sale", "sail"], ["road", "rode"], ["tail", "tale"], ["piece", "peace"], ["plane", "plain"], ["break", "brake"], ["new", "knew"], ["sell", "cell"], ["cent", "sent", "scent"], ["would", "wood"], ["than", "then"]];
function mqListen(w, pool) { const p = opts(w.en, pool.filter(x => !HOMO.some(g => g.includes(x.en) && g.includes(w.en) && x.en !== w.en)).map(x => x.en)); return { type: "mcq", sk: "listen", label: "Nghe và chọn từ bạn nghe được", audio: w.en, autoplay: true, o: p.o, a: p.a, mk: w.en }; }
function buildLesson(L) {
  const st = [], W = L.W, pool = W.length >= 6 ? W : ALLW;
  for (let i = 0; i < W.length; i += 5) st.push({ type: "words", items: W.slice(i, i + 5), from: i + 1, total: W.length });
  st.push({ type: "gram", html: L.g });
  if (typeof GRAMMAR !== "undefined") { const its = GRAMMAR.filter(T => T.lesson === L.id).flatMap(T => T.items.map(x => [x, T])); const pickT = t => shuffle(its.filter(x => x[0][0] === t))[0]; ["c", "f", "e", "r"].forEach(t => { const x = pickT(t); if (x) st.push(gStep(x[0], x[1])); }); }
  const nv = noTTS(), lis = (w, p) => nv ? mqMeaning(w, p) : mqListen(w, p);
  if (L.kind === "letters") { pick(W, 10).forEach(w => st.push(lis(w, W))); L.S.forEach(s => st.push({ type: "speak", sk: "speak", en: s.en, vi: s.vi })); return st; }
  pick(W, 6).forEach(w => st.push(mqMeaning(w, pool)));
  pick(W, 3).forEach(w => st.push(mqReverse(w, pool)));
  pick(W.filter(w => !/^-|-$|=/.test(w.en) && !w.en.includes("-") || /\w-\w/.test(w.en)), 5).forEach(w => st.push(lis(w, pool)));
  if (L.stage === "s0") {
    if (!nv) pick(W, 4).forEach(w => st.push({ type: "dict", sk: "listen", label: "Nghe và gõ lại từ", en: w.en, vi: w.vi }));
    pick(W, 4).forEach(w => st.push({ type: "speak", sk: "speak", en: w.en, vi: w.vi, ipa: w.ipa }));
    L.S.forEach(s => st.push({ type: "speak", sk: "speak", en: s.en, vi: s.vi }));
    return st;
  }
  const ss = shuffle(L.S);
  if (!nv) ss.slice(0, 2).forEach(s => st.push({ type: "dict", sk: "listen", label: "Nghe và gõ lại câu", en: s.en, vi: s.vi }));
  ss.slice(2, 5).forEach(s => st.push({ type: "speak", sk: "speak", en: s.en, vi: s.vi }));
  if (L.r) st.push(mkRead(L.r));
  shuffle(L.S).slice(0, 2).forEach(s => st.push({ type: "order", sk: "write", en: s.en, vi: s.vi }));
  shuffle(L.S).slice(0, 2).forEach(s => st.push({ type: "trans", sk: "write", en: s.en, vi: s.vi }));
  if (L.WR) st.push({ type: "write", sk: "write", wr: L.WR });
  return window.EXT && EXT.lessonSteps ? EXT.lessonSteps(L, st) : st;
}
/* Bài đọc: giữ đủ mọi phương án của đề (các phương án là cả cụm, không lọc theo nghĩa như thẻ từ) */
function mkRead(r) { return { type: "read", sk: "read", t: r.t, q: r.q.map(x => { const p = x.split("|"), o = shuffle([...new Set(p.slice(1).filter(Boolean))]); return { q: p[0], o, a: o.indexOf(p[1]) }; }) }; }
function newP(kind, steps, extra) { toastOff(); P = Object.assign({ kind, steps, i: 0, ok: 0, tot: 0, xp: 0, sk: {}, wrong: 0 }, extra || {}); last = Date.now(); VIEW = null; render(); }
function startLesson(id) { if (!isOpen(id)) { toast("Bài này chưa mở"); return; } checkVoice(); if (noTTS()) setTimeout(() => toast("Máy chưa có giọng đọc tiếng Anh nên bài này bỏ các câu nghe chép,<br>thay câu chọn từ nghe được bằng câu chọn nghĩa.", 5000), 400); if (S.resume && S.resume.id === id) S.resume = null; newP("lesson", buildLesson(LES[id]), { id }); }
function resumeLesson() { const r = S.resume; P = r.P; last = Date.now(); VIEW = null; render(); }
function startReview(extra) {
  const keys = extra ? pick(Object.keys(S.cards), 10) : dueCards().sort((a, b) => S.cards[a].due - S.cards[b].due).slice(0, 20);
  if (!keys.length) { toast("Chưa có thẻ để ôn"); return; }
  const steps = shuffle(keys).map((k, i) => { const w = WMAP[k] || { en: k, vi: S.cards[k].vi }; const s = i % 3 === 2 && !noTTS() ? mqListen(w, ALLW) : i % 3 === 1 ? mqReverse(w, ALLW) : mqMeaning(w, ALLW); s.card = k; return s; });
  newP("review", steps);
}
function startMistakes() {
  const ms = Object.values(S.mistakes); if (!ms.length) { toast("Chưa có lỗi sai nào"); return; }
  const steps = shuffle(ms).slice(0, 15).map((m, i) => { let s; if (m.t === "gram") { s = gStep(m.g, {}); s.fix = "g:" + m.g.split("|")[1]; return s; } if (m.t === "sent") s = i % 2 ? { type: "order", sk: "write", en: m.en, vi: m.vi } : { type: "trans", sk: "write", en: m.en, vi: m.vi }; else { const w = WMAP[m.en] || { en: m.en, vi: m.vi }; s = i % 2 ? mqReverse(w, ALLW) : mqMeaning(w, ALLW); } s.fix = m.en; return s; });
  newP("mist", steps);
}
function startExam(sid) {
  const st = stageOf(sid), Ls = st.lessons.filter(L => L.kind !== "letters");
  const W = [], Ss = []; Ls.forEach(L => { L.W.forEach(w => W.push(w)); L.S.forEach(s => Ss.push(s)); });
  const steps = [];
  pick(W, 8).forEach(w => steps.push(mqMeaning(w, W)));
  const nv = noTTS(); pick(W, 4).forEach(w => steps.push(nv ? mqReverse(w, W) : mqListen(w, W)));
  if (sid === "s0" && !nv) pick(W, 8).forEach(w => steps.push({ type: "dict", sk: "listen", label: "Nghe và gõ lại từ", en: w.en, vi: w.vi }));
  else { pick(Ss, 3).forEach(s => steps.push({ type: "order", sk: "write", en: s.en, vi: s.vi })); pick(Ss, 3).forEach(s => steps.push({ type: "trans", sk: "write", en: s.en, vi: s.vi })); if (!nv) pick(Ss, 2).forEach(s => steps.push({ type: "dict", sk: "listen", label: "Nghe và gõ lại câu", en: s.en, vi: s.vi })); const rl = pick(Ls.filter(L => L.r), 1)[0]; if (rl) steps.push(mkRead(rl.r)); }
  newP("exam", shuffle(steps), { sid });
}
const IDK = "Tôi chưa biết";
const M_A2 = "Bạn đã vững A1! Bắt đầu từ <b>A2 – Bài 1</b>. Nếu thấy dễ, hãy làm bài kiểm tra vượt chặng A2 trong Lộ trình.",
  M_B1 = "Bạn đã nắm chắc A2. Bắt đầu từ <b>B1 – Bài 1</b>. Nếu thấy dễ, hãy làm bài kiểm tra vượt chặng B1 trong Lộ trình. Nếu thấy khó, hãy quay lại ôn các bài A2.",
  M_B2 = "Trình độ của bạn tốt. Bắt đầu từ <b>B2 – Bài 1</b>. Nếu thấy dễ, hãy làm bài kiểm tra vượt chặng B2 trong Lộ trình.";
function startPlacement() {
  const steps = PLACEMENT.map(x => { const o = shuffle(x.o); o.push(IDK); return { type: "mcq", sk: "", lv: x.lv, label: x.audio ? x.q : "Chọn đáp án đúng", q: x.audio ? "" : x.q, blank: !x.audio && /_{3,}/.test(x.q), audio: x.audio, autoplay: !!x.audio, o, a: o.indexOf(x.o[0]), nofb: 1 }; });
  newP("place", steps);
}

/* ---------- Trình học ---------- */
function quit() {
  if (P.kind === "lesson" && P.i > 0) { const snap = JSON.parse(JSON.stringify(P)); if (P.ans) snap.i++; S.resume = { id: P.id, P: snap }; save(); const id = P.id; P = null; openIntro(id); toast("Đã lưu chỗ bạn đang học. Lần sau học tiếp nhé!"); }
  else if (P.kind === "mock" && P.i > 0) modal("Bỏ dở bài thi?", "Lần thi này sẽ được ghi là<br>chưa đạt (0%).", "Bỏ thi", () => { if (!P || P.kind !== "mock") return; clearInterval(P.tm); (S.exams[P.lv] = S.exams[P.lv] || []).push({ at: Date.now(), overall: 0, skills: {}, pass: false, aborted: 1 }); S.mockOpen = null; save(); P = null; nav("exam"); }, true, "Thi tiếp");
  else if (P.kind === "gram") { const g = P.gid; P = null; g ? openTopic(g) : nav("gram"); }
  else if (P.kind === "exam" && P.i > 0) modal("Dừng bài kiểm tra vượt chặng?", "Kết quả lần này sẽ không được lưu.", "Dừng", () => { if (!P || P.kind !== "exam") return; P = null; nav("road"); }, true, "Làm tiếp");
  else if (P.kind === "place" && P.i > 0) modal("Dừng bài kiểm tra?", "Bạn sẽ bắt đầu học từ Chặng 0.", "Dừng", () => { S.placement = "zero"; save(); P = null; nav("home"); });
  else { P = null; render(); }
}
function showStep() {
  noConfetti();
  micOff(); if (P.i >= P.steps.length) return finish();
  const s = P.steps[P.i]; P.ans = false; P.lockUntil = P.kind === "mock" ? Date.now() + 400 : 0;
  const title = P.kind === "lesson" ? esc(LES[P.id].t) : P.kind === "gram" ? esc(P.title) : P.kind === "mock" ? "Thi thử " + P.lv + (SECN[s.sec] ? " · " + SECN[s.sec] : "") : { review: "Ôn từ vựng", exam: "Kiểm tra vượt chặng" + (P.sid ? " · " + stageOf(P.sid).name : ""), place: "Kiểm tra đầu vào", mist: "Luyện lại lỗi sai" }[P.kind];
  let h = `<div class="ptop"><button class="ib" onclick="quit()" aria-label="Thoát"><i class="ti ti-x"></i></button><div class="bar grow"><span style="width:${P.i / P.steps.length * 100}%"></span></div>${P.kind === "mock" ? `<span class="timer" id="timer">${fmtTime(mockLeft())}</span>` : progTxt()}</div><p class="ptitle">${title}${s.r ? ' · <span class="retry">làm lại câu sai</span>' : ""}</p><div class="pbody">`;
  h += ({ words: rWords, gram: rGram, mcq: rMcq, dict: rDict, trans: rTrans, order: rOrder, speak: rSpeak, read: rRead, write: rWrite, gf: rGf, ge: rGe, gr: rGr, xs: rXs, xintro: rXintro, xsec: rXsec })[s.type] ? ({ words: rWords, gram: rGram, mcq: rMcq, dict: rDict, trans: rTrans, order: rOrder, speak: rSpeak, read: rRead, write: rWrite, gf: rGf, ge: rGe, gr: rGr, xs: rXs, xintro: rXintro, xsec: rXsec })[s.type](s) : window.EXT && EXT.render[s.type] ? EXT.render[s.type](s) : "";
  h += `</div><div id="fb" class="fb" role="status"></div>`;
  app().innerHTML = h; window.scrollTo(0, 0);
  if (s.type === "words" || s.type === "gram") cont();
  if (s.type === "xsec") cont("", "");
  if (s.autoplay) setTimeout(() => { if (P && P.steps[P.i] === s) s.limit ? examPlay() : say(s.audio); }, 350);
  if (s.type === "dict") setTimeout(() => say(s.en), 350);
  if (s.type === "order") drawOrder();
  if (P.kind === "lesson" && P.i > 0) { S.resume = { id: P.id, P: JSON.parse(JSON.stringify(P)) }; save(); }
  toastFit();
}
const baseN = p => p.steps.filter(s => !s.r).length;
function progTxt() { const b = baseN(P), rq = P.steps.length - b; return P.i < b ? `<span class="muted sm prog">${P.i + 1}/${b}${rq ? ` <span class="requeue">+${rq} làm lại</span>` : ""}</span>` : `<span class="muted sm prog"><span class="requeue">Làm lại ${P.i - b + 1}/${rq}</span></span>`; }
function cont(cls, msg) { const f = $("#fb"); f.className = "fb on " + (cls || ""); f.innerHTML = `<div class="fbin">${msg || ""}<button class="btn primary full lg" id="nextb" onclick="nextStep()">Tiếp tục <span class="kbd">Enter</span></button></div>`; fitFb(); toastFit(); setTimeout(toastFit, 280); }
/* Thanh kết quả không được che đáp án: chừa chỗ phía dưới và cuộn để thấy đáp án đúng và lựa chọn của bạn */
function fitFb() {
  const f = $("#fb"), pb = $(".pbody"); if (!f || !pb) return;
  pb.style.paddingBottom = f.offsetHeight + 24 + "px";
  const els = $$(".opt.right,.opt.wrong,.etok.bad,.etok.pick,.diffbox,.corr"); if (!els.length) return;
  const rs = els.map(e => e.getBoundingClientRect()), top = Math.min(...rs.map(r => r.top)), bot = Math.max(...rs.map(r => r.bottom)), lim = innerHeight - f.offsetHeight - 12, head = ($(".ptop") ? $(".ptop").getBoundingClientRect().bottom : 0) + 8;
  if (bot > lim) window.scrollBy({ top: Math.min(bot - lim, Math.max(0, top - head)), behavior: "smooth" });
}
function nextStep() { tick(); P.i++; showStep(); }
function grade(ok, ans, note, extra, neutral) {
  if (P.ans) return; P.ans = true;
  const s = P.steps[P.i]; s.got = ok;
  if (s.type === "speak") $$("#mic button").forEach(b => b.disabled = true);
  if (!s.r) { P.tot++; if (ok) P.ok++; if (s.sk) { addSkill(s.sk, ok); const v = P.sk[s.sk] || (P.sk[s.sk] = [0, 0]); v[1]++; if (ok) v[0]++; } }
  if (ok && P.kind !== "place") { const g = s.r ? 3 : s.card ? 5 : 10; P.xp += g; }
  if (!ok) P.wrong++;
  if (s.card) { const c = S.cards[s.card], wasDue = c.due <= Date.now(); if (ok) { if (wasDue) c.box = Math.min(7, c.box + 1); c.due = Math.max(c.due, Date.now() + INT[c.box] * DAY); S.cnt.review++; } else { c.box = Math.min(c.box, 1); c.due = Date.now() + 10 * 60000; } }
  if (s.fix) { const m = S.mistakes[s.fix]; if (m) { if (ok) { m.n--; if (m.n <= 0) delete S.mistakes[s.fix]; } else m.n++; } }
  if (!ok && P.kind !== "place" && !s.fix) recordMistake(s);
  if (!ok && (P.kind === "lesson" || P.kind === "gram") && ["mcq", "dict", "trans", "order", "gf", "ge", "gr"].includes(s.type) && (s.r || 0) < 2) requeue(s);
  if (P.kind === "mock") { secAdd(s.sec, ok ? (s.pts || 1) : (s.part || 0)); }
  if (ok && s.type === "speak") S.cnt.speak++;
  if (ok && s.type === "write") S.cnt.write++;
  save();
  if (s.nofb || P.kind === "mock") { if (P.kind !== "mock") beep("tap"); nextStep(); return; }
  if (neutral) { beep("tap"); cont("", neutral); return; }
  beep(ok ? "good" : "bad");
  cont(ok ? "good" : "bad", `<p class="fbt"><i class="ti ti-${ok ? "circle-check" : "alert-circle"}"></i> <span class="fbm">${ok ? (note || pick(["Chính xác!", "Tuyệt vời!", "Giỏi lắm!", "Đúng rồi!"], 1)[0]) : "Chưa đúng"}</span>${ok && !s.r && P.kind !== "place" ? `<span class="xpg">+${s.card ? 5 : 10} XP</span>` : ""}</p>${extra || ""}${!ok && ans ? `<p class="fba">Đáp án: <b>${ans}</b></p>` : ""}${s.why ? `<p class="why"><i class="ti ti-bulb"></i> ${esc(s.why)}</p>` : ""}${!ok && (P.kind === "lesson" || P.kind === "gram") && (s.r || 0) < 2 && ["mcq", "dict", "trans", "order", "gf", "ge", "gr"].includes(s.type) ? `<p class="sm">Câu này sẽ quay lại cuối bài.</p>` : ""}`);
}
/* Lỗi ngữ pháp trong Sổ tay: hiện câu đã sửa đúng (không hiện câu sai hay đề bài) */
const GKIND = { c: "Chọn đáp án", f: "Điền từ", e: "Tìm lỗi sai", r: "Viết lại câu" };
function gramFix(g) {
  const p = String(g).split("|"), t = p[0]; let en;
  if (t === "e") { const bad = (p[2] || "").split("||")[0], c = p[3] || ""; en = p[1].replace(bad, c.startsWith("(") ? "" : c).replace(/\s+([.,!?])/g, "$1").replace(/\s{2,}/g, " ").trim(); }
  else if (t === "r") en = p[2] || "";
  else en = p[1].replace(/_{3,}(\s*\([^)]*\))?/, p[2] || "").replace(/\s*\([^)]*\)\s*$/, "").replace(/\s*Dùng be going to\.$/, "");
  return { en, vi: "Ngữ pháp · " + (GKIND[t] || "Ngữ pháp") };
}
function recordMistake(s) {
  let en, vi, t;
  if (s.gi) { const k = "g:" + s.gi.split("|")[1], fx = gramFix(s.gi); const m = S.mistakes[k] || (S.mistakes[k] = { en: fx.en, vi: fx.vi, t: "gram", g: s.gi, n: 0 }); m.n = Math.min(2, m.n + 1); m.at = Date.now(); return; }
  if (s.type === "mcq" && s.mk && WMAP[s.mk]) { en = s.mk; vi = WMAP[s.mk].vi; t = "word"; }
  else if (["dict", "trans", "order"].includes(s.type) && s.en.includes(" ")) { en = s.en; vi = s.vi; t = "sent"; }
  else return;
  const m = S.mistakes[en] || (S.mistakes[en] = { en, vi, t, n: 0 }); m.n = Math.min(2, m.n + 1); m.at = Date.now();
}
function requeue(s) {
  const c = JSON.parse(JSON.stringify(s)); c.r = (s.r || 0) + 1;
  if (c.type === "mcq") { const o = shuffle(c.o); c.a = o.indexOf(c.o[c.a]); c.o = o; }
  delete c.pool; delete c.ans; delete c.picked;
  P.steps.push(c);
}
const spk = (t, extra) => `<button class="spk ${extra || ""}" onclick="event.stopPropagation();say('${jsq(t)}')" aria-label="Nghe"><i class="ti ti-volume"></i></button>`;
const slowBtn = t => `<button class="link" onclick="say('${jsq(t)}',1)"><i class="ti ti-snail"></i> Nghe chậm</button>`;
function rWords(s) { return `<p class="lab">${P.id && LES[P.id] && LES[P.id].kind === "letters" ? "Chữ cái" : "Từ mới"} ${s.from}–${s.from + s.items.length - 1} / ${s.total} · bấm loa để nghe, nói to theo</p>` + s.items.map(w => `<div class="word">${spk(w.en)}<div class="grow"><b>${esc(w.en)}</b>${w.ipa ? `<span class="ipa">/${esc(w.ipa)}/</span>` : ""}<span class="vi">${esc(w.vi)}</span></div><button class="ib slow" onclick="say('${jsq(w.en)}',1)" aria-label="Nghe chậm"><i class="ti ti-snail"></i><small>Chậm</small></button></div>`).join(""); }
function rGram(s) { return `<p class="lab"><i class="ti ti-bulb"></i> Kiến thức trọng tâm</p><div class="gram">${s.html}</div>`; }
function rMcq(s) {
  return `<p class="lab">${s.sk ? `<i class="ti ti-${SKI[s.sk]}"></i> ${SK[s.sk]} · ` : ""}${s.label}</p>` + (s.q ? `<h2 class="q ${s.vq ? "vi" : ""} ${s.blank ? "gq" : ""}">${s.blank ? blankHtml(s.q) : esc(s.q)}</h2>` : "") + (s.sub ? `<p class="ipa c">${esc(s.sub)}</p>` : "") +
    (s.limit ? `<div class="c"><button class="spk xl" onclick="examPlay()" aria-label="Nghe"><i class="ti ti-volume"></i></button><span id="plays" class="sm muted">${s.played ? `Còn ${s.limit - s.played} lần nghe` : `Bấm loa để nghe (tối đa ${s.limit} lần)`}</span></div>` : s.audio && !s.q ? `<div class="c">${spk(s.audio, "xl")}${slowBtn(s.audio)}</div>` : s.audio ? `<div class="c">${spk(s.audio)}</div>` : "") +
    `<div class="opts">${s.o.map((o, i) => `<button class="opt" id="o${i}" onclick="pickOpt(${i})"><span class="k">${i + 1}</span>${esc(o)}</button>`).join("")}</div>` + (P.kind === "mock" ? `<button class="btn primary full" id="xok" disabled onclick="mockConfirm()">Xác nhận, sang câu sau</button>` : "");
}
function mockConfirm() { const s = P.steps[P.i]; if (P.ans || s.sel === undefined || (P.lockUntil && Date.now() < P.lockUntil)) return; $$(".opt").forEach(b => b.disabled = true); grade(s.sel === s.a, ""); }
function pickOpt(i) { const s = P.steps[P.i]; if (P.ans || (P.lockUntil && Date.now() < P.lockUntil)) return; if (P.kind === "mock") { s.sel = i; $$(".opt").forEach(b => b.classList.remove("picked")); $("#o" + i).classList.add("picked"); const c = $("#xok"); if (c) c.disabled = false; return; } $$(".opt").forEach(b => b.disabled = true); if (!s.nofb && P.kind !== "mock") { $("#o" + s.a).classList.add("right"); if (i !== s.a) $("#o" + i).classList.add("wrong"); } else $("#o" + i).classList.add("picked"); if (s.sayAns) say(s.o[s.a]); grade(i === s.a, esc(s.o[s.a])); }
function rDict(s) { return `<p class="lab"><i class="ti ti-headphones"></i> Nghe · ${s.label}</p><div class="c">${spk(s.en, "xl")}${slowBtn(s.en)}</div><textarea id="inp" rows="2" placeholder="Gõ những gì bạn nghe được" oninput="$('#er').textContent=''" autocapitalize="off" autocomplete="off" spellcheck="false"></textarea><p class="err" id="er"></p><button class="btn primary full" id="chk" onclick="checkText()">Kiểm tra</button>`; }
function rTrans(s) { return `<p class="lab"><i class="ti ti-pencil"></i> Viết · Dịch sang tiếng Anh</p><h2 class="q vi">${esc(s.vi)}</h2><textarea id="inp" rows="2" placeholder="Viết câu tiếng Anh" oninput="$('#er').textContent=''" autocapitalize="sentences" autocomplete="off" spellcheck="false"></textarea><p class="err" id="er"></p><div id="hint"><button class="link" onclick="$('#hint').innerHTML='<p class=hint>Gợi ý: ${jsq(s.en.split(" ").slice(0, 2).join(" "))} ...</p>'"><i class="ti ti-bulb"></i> Gợi ý</button></div><button class="btn primary full" id="chk" onclick="checkText()">Kiểm tra</button>`; }
function checkText() {
  const s = P.steps[P.i], v = $("#inp").value.trim();
  if (!v) { $("#er").textContent = "Hãy gõ câu trả lời trước."; return; }
  $("#er").textContent = "";
  const r = compare(v, s.en); $("#chk").remove(); $("#inp").disabled = true;
  if (r === 0) $("#inp").insertAdjacentHTML("afterend", `<div class="diffbox"><p class="lab">So với đáp án</p>${diffHtml(v, s.en)}<p class="sm muted"><span class="dx">gạch đỏ</span> là từ thừa hoặc sai, <span class="dm">chữ xanh</span> là từ còn thiếu.</p></div>`);
  grade(r > 0, esc(s.en) + `<br><span class="muted">${esc(s.vi)}</span>`, r === 1 ? "Gần đúng! Chú ý chính tả:" : null, r === 1 ? diffHtml(v, s.en).replace('class="diff"', 'class="diff fbd"') : "");
  setTimeout(() => say(s.en), 250);
}
const LOWER1 = new Set("he she it they we you the a an my your his her our their this that these those there what where when who why how which do does did can could will would should is are was were have has had don't doesn't didn't can't won't let's please excuse sorry thank thanks yes no not every some many most all after before if although because while first then today tomorrow yesterday in on at as during".split(" "));
/* Chip đầu câu viết thường (để không lộ từ đứng đầu), trừ I và tên riêng: tên có trong danh sách,
   tên viết hoa ở giữa câu trong bài học, hoặc tên gồm nhiều chữ hoa liền nhau (Ho Chi Minh, Da Lat, Nguyen Du) */
const PROPER = new Set("Tet Fansipan Hanoi Saigon Vietnam Hue Mekong Sapa English Vietnamese Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December".split(" "));
function properSet() { if (properSet.c) return properSet.c; const c = new Set(PROPER); ORDER.forEach(id => (LES[id].S || []).forEach(x => x.en.split(/\s+/).forEach((w, i, a) => { const b = w.replace(/['’]s$/, "").replace(/[^A-Za-z]/g, ""); if (i > 0 && !/[.!?:;]$/.test(a[i - 1]) && /^[A-Z][a-z]+$/.test(b) && !LOWER1.has(b.toLowerCase()) && !WMAP[b.toLowerCase()]) c.add(b); }))); return (properSet.c = c); }
function orderWords(en) { const ws = en.replace(/\s*[.?!]+$/, "").split(" "); const f = ws[0], nx = ws[1] || "", b = f.replace(/['’]s$/, "").replace(/[^A-Za-z]/g, "");
  const keep = f === "I" || /^I['’]/.test(f) || /^[A-Z]{2,}/.test(b) || properSet().has(b) || (/^[A-Z][a-z]/.test(nx) && !/^I\b/.test(nx) && !LOWER1.has(b.toLowerCase()) && !WMAP[b.toLowerCase()]);
  if (!keep && /^[A-Z]/.test(f)) ws[0] = f[0].toLowerCase() + f.slice(1); return ws; }
function rOrder(s) { s.pool = shuffle(orderWords(s.en).map((w, i) => ({ w, i }))); s.ans = []; return `<p class="lab"><i class="ti ti-pencil"></i> Viết · Sắp xếp thành câu đúng</p><h2 class="q vi">${esc(s.vi)}</h2><div class="line" id="ln"></div><div class="chips" id="ch"></div><p class="err" id="er"></p><button class="btn primary full" id="chk" onclick="checkOrder()">Kiểm tra</button>`; }
function drawOrder() { const s = P.steps[P.i]; $("#ln").innerHTML = s.ans.map((c, k) => `<button class="chip" onclick="unchip(${k})">${esc(c.w)}</button>`).join("") || `<span class="muted sm">Bấm các từ bên dưới theo đúng thứ tự</span>`; $("#ch").innerHTML = s.pool.map((c, k) => `<button class="chip" onclick="chip(${k})">${esc(c.w)}</button>`).join(""); }
function chip(k) { const s = P.steps[P.i]; if (P.ans) return; s.ans.push(s.pool.splice(k, 1)[0]); $("#er").textContent = ""; drawOrder(); }
function unchip(k) { const s = P.steps[P.i]; if (P.ans) return; s.pool.push(s.ans.splice(k, 1)[0]); drawOrder(); }
function checkOrder() { const s = P.steps[P.i]; if (s.pool.length) { $("#er").textContent = "Hãy xếp hết các từ trước."; return; } $("#er").textContent = ""; $("#chk").remove(); const got = norm(s.ans.map(c => c.w).join(" ")), want = norm(s.en), mv = x => { const m = x.match(/^(today|tomorrow|yesterday|now|sometimes|usually|tonight|then|finally|first|unfortunately|fortunately|luckily) (.+)$/); return m ? m[2] + " " + m[1] : x; }, ok = got === want || mv(got) === mv(want);
  // Sai thứ tự: hai dòng riêng, dòng của bạn tô đỏ những từ đứng sai chỗ
  if (!ok) { const want2 = orderWords(s.en), mine = s.ans.map(c => c.w); $("#ln").insertAdjacentHTML("afterend", `<div class="diffbox"><p class="lab">Bạn xếp</p><p class="diff">${mine.map((w, i) => norm(w) === norm(want2[i] || "") ? `<span>${esc(w)}</span>` : `<span class="dmv">${esc(w)}</span>`).join(" ")}</p><p class="lab">Câu đúng</p><p><b>${esc(s.en)}</b></p><p class="sm muted"><span class="dmv">Gạch dưới đỏ</span> là từ đứng sai chỗ.</p></div>`); }
  grade(ok, esc(s.en)); say(s.en); }
function rSpeak(s) {
  return `<p class="lab"><i class="ti ti-microphone"></i> Nói · Nghe mẫu rồi nói theo</p><div class="say"><h2 id="sayt">${esc(s.en)}</h2>${s.ipa ? `<p class="ipa">/${esc(s.ipa)}/</p>` : ""}<p class="vi">${esc(s.vi)}</p></div>${P.kind === "mock" ? "" : `<div class="c">${spk(s.en, "xl")}${slowBtn(s.en)}</div>`}
  <div id="mic">${SR && !micBlocked ? `<button class="btn primary full lg" onclick="doMic()"><i class="ti ti-microphone"></i> Bấm rồi nói</button><button class="link c" onclick="$('#mic').innerHTML=selfRate()">Không dùng micro được?</button>` : selfRate()}</div>`;
}
function selfRate(msg) { if (P && P.kind === "mock") return `<p class="muted c sm">${msg ? msg + "<br>" : ""}Không có micro nên câu này không được chấm.<br>Lần thi này sẽ không được ghi nhận đạt.</p><button class="btn primary full" onclick="const s=P.steps[P.i];s.part=0;s.unrated=1;grade(false,'')">Tiếp tục</button>`; return `<p class="muted c sm">${msg || "Nghe mẫu, nói to theo 2–3 lần cho trôi chảy, rồi tự đánh giá."}</p><div class="row2"><button class="btn" onclick="grade(false,'')">Chưa được</button><button class="btn primary" onclick="grade(true,'','Tốt lắm! Giữ nhịp như vậy nhé.')">Nói được rồi</button></div>`; }
function doMic() {
  const s = P.steps[P.i]; $("#mic").innerHTML = micUI("Đang nghe... hãy nói câu trên");
  listenMic(alts => {
    if (!P || P.steps[P.i] !== s) return;
    let best = alts[0], sc = -1; alts.forEach(a => { const v = speakScore(s.en, a); if (v > sc) { sc = v; best = a; } });
    if (P.kind === "mock") {
      s.best = Math.max(s.best || 0, sc); s.tries = (s.tries || 0) + 1; s.part = Math.min(1, s.best / 100);
      if (s.tries >= 2 || s.best >= 90) { grade(s.best >= 99, ""); return; }
      $("#mic").innerHTML = `<p class="heard">Máy nghe được: ${heardQ(best)}<br><b>${sc}%</b> từ đúng</p><p class="sm muted c">Bạn được đọc lại 1 lần, máy lấy kết quả tốt hơn.</p><div class="row2"><button class="btn" onclick="grade(false,'')">Nộp kết quả này</button><button class="btn primary" onclick="doMic()"><i class="ti ti-refresh"></i> Đọc lại</button></div>`; return;
    }
    $("#sayt").innerHTML = diffWords(s.en, best);
    if (sc >= 70) { $("#mic").innerHTML = `<p class="heard">Máy nghe được: “${esc(best)}”</p>`; grade(true, "", `Phát âm tốt: ${sc}% từ đúng`); }
    else $("#mic").innerHTML = `<p class="heard">Máy nghe được: ${heardQ(best)}<br><b>${sc}%</b> từ đúng<br><span class="sm muted">Từ màu đỏ là từ máy chưa nghe rõ. Nghe chậm rồi thử lại.</span></p><div class="row2"><button class="btn" onclick="grade(false,'${jsq(s.en)}')">Bỏ qua</button><button class="btn primary" onclick="doMic()"><i class="ti ti-refresh"></i> Thử lại</button></div>`;
  }, err => {
    if (!P || P.steps[P.i] !== s) return;
    const mk = P.kind === "mock", m = micErrMsg(err) && err !== "none" ? micErrMsg(err) : err === "no-speech" ? "Chưa nghe thấy gì.<br>Hãy nói to và rõ hơn." : err === "network" ? (mk ? "Mạng yếu nên máy chưa nghe được.<br>Hãy bấm Thử lại." : "Mạng yếu nên máy chưa nghe được.<br>Thử lại hoặc tự đánh giá nhé.") : (mk ? (micBlocked ? "Chưa dùng được micro." : "Chưa dùng được micro.<br>Hãy cho phép micro rồi bấm Thử lại.") : "Chưa dùng được micro.<br>Hãy cho phép micro, hoặc tự đánh giá nhé.");
    const again = micBlocked ? "" : `<button class="btn ${P.kind === "mock" ? "primary " : ""}full" onclick="doMic()"><i class="ti ti-microphone"></i> Thử lại</button>`;
    // Thi thử: micro vẫn dùng được (bấm Dừng, im lặng, mạng chập chờn) thì chỉ cho thử lại, không đánh dấu "không chấm được"
    if (P.kind === "mock" && !micBlocked && (err === "no-speech" || err === "network")) { $("#mic").innerHTML = `<p class="muted c sm">${m}</p>` + again + `<button class="link c" onclick="grade(false,'')">Bỏ qua câu này</button>`; return; }
    $("#mic").innerHTML = P.kind === "mock" ? again + selfRate(m) : selfRate(m) + again;
  }, { onpart: t => { if (P && P.steps[P.i] === s) micLive(t); } });
}
function rRead(s) { s.left = s.q.filter(q => !q.done).length; const mock = P.kind === "mock"; return `<p class="lab"><i class="ti ti-book"></i> Đọc · Đọc bài rồi trả lời</p><div class="passage">${paraHtml(s.t)}</div>${mock ? "" : `<div class="row c2">${spk(s.t.replace(/\n/g, " "))}<span class="muted sm">Nghe cả bài</span>${slowBtn(s.t.replace(/\n/g, " "))}</div>`}` + s.q.map((q, k) => `<div class="rq"><p><b>${k + 1}.</b> ${esc(q.q)}</p><div class="opts">${q.o.map((o, i) => `<button class="opt" id="r${k}_${i}" onclick="pickRead(${k},${i})">${esc(o)}</button>`).join("")}</div></div>`).join("") + (mock ? `<p class="err" id="er"></p><button class="btn primary full" id="xok" onclick="mockReadSubmit()">Nộp bài đọc này</button>` : ""); }
function mockReadSubmit() { const s = P.steps[P.i]; if (P.ans) return; const miss = s.q.filter(q => q.sel === undefined).length; if (miss) { $("#er").textContent = `Còn ${miss} câu chưa chọn đáp án.`; return; } s.q.forEach(q => { q.done = 1; secAdd("read", q.sel === q.a ? 1 : 0); }); $$(".rq .opt").forEach(b => b.disabled = true); $("#xok").remove(); P.ans = true; nextStep(); }
function pickRead(k, i) { const s = P.steps[P.i], q = s.q[k];
  // Thi thử: chỉ đánh dấu lựa chọn, đổi được cho tới khi bấm "Nộp bài đọc này"
  if (P.kind === "mock") { if (P.ans || q.done) return; q.sel = i; q.o.forEach((_, j) => $("#r" + k + "_" + j).classList.toggle("picked", j === i)); if ($("#er")) $("#er").textContent = ""; return; }
  if (q.done) return; q.done = 1; q.o.forEach((_, j) => $("#r" + k + "_" + j).disabled = true); $("#r" + k + "_" + q.a).classList.add("right"); if (i !== q.a) $("#r" + k + "_" + i).classList.add("wrong"); P.tot++; addSkill("read", i === q.a); const v = P.sk.read || (P.sk.read = [0, 0]); v[1]++; if (i === q.a) { P.ok++; v[0]++; P.xp += 10; beep("good"); } else beep("bad"); save(); if (--s.left === 0) { P.ans = true; cont("", `<p class="fbt"><i class="ti ti-book"></i> Đã trả lời xong ${s.q.length} câu hỏi</p>`); } }
const wcount = t => (t.trim().match(/[A-Za-z0-9'’-]+/g) || []).length;
/* Từ khóa của đề viết: mỗi từ trong cụm khớp cả các dạng chia (lead → leads, led, leading; take → took, taken;
   study → studied; plan → planned) và dạng viết tắt (should've = should have) */
const IRR = "be:was:were:been:being:am:is:are;have:had:has:having;do:did:done:does:doing;go:went:gone:goes:going;become:became;begin:began:begun;break:broke:broken;bring:brought;build:built;burn:burned:burnt;buy:bought;catch:caught;choose:chose:chosen;come:came;cost;cut;deal:dealt;dig:dug;draw:drew:drawn;dream:dreamed:dreamt;drink:drank:drunk;drive:drove:driven;eat:ate:eaten;fall:fell:fallen;feed:fed;feel:felt;fight:fought;find:found;fly:flew:flown;forget:forgot:forgotten;forgive:forgave:forgiven;freeze:froze:frozen;get:got:gotten;give:gave:given;grow:grew:grown;hang:hung;hear:heard;hide:hid:hidden;hit;hold:held;hurt;keep:kept;know:knew:known;lay:laid;lead:led;learn:learned:learnt;leave:left;lend:lent;let;lie:lay:lain:lying;light:lit;lose:lost;make:made;mean:meant;meet:met;overcome:overcame;pay:paid;put;quit;read;ride:rode:ridden;ring:rang:rung;rise:rose:risen:rising;run:ran;say:said;see:saw:seen;seek:sought;sell:sold;send:sent;set;shake:shook:shaken;shine:shone;shoot:shot;show:showed:shown;shut;sing:sang:sung;sink:sank:sunk;sit:sat;sleep:slept;speak:spoke:spoken;spend:spent;spread;stand:stood;steal:stole:stolen;stick:stuck;strike:struck;swim:swam:swum;take:took:taken;teach:taught;tear:tore:torn;tell:told;think:thought;throw:threw:thrown;understand:understood;undertake:undertook:undertaken;wake:woke:woken;wear:wore:worn;win:won;withdraw:withdrew:withdrawn;write:wrote:written;spell:spelled:spelt;spill:spilled:spilt;smell:smelled:smelt;fit:fitted;forecast;bet;upset;broadcast;mislead:misled;overtake:overtook:overtaken;undergo:underwent:undergone;outgrow:outgrew:outgrown;arise:arose:arisen;bear:bore:borne:born;bite:bit:bitten;blow:blew:blown;bend:bent;bind:bound;bleed:bled;breed:bred;flee:fled;forbid:forbade:forbidden;grind:ground;slide:slid;split;sweep:swept;swing:swung;weep:wept;wind:wound;rebuild:rebuilt;rethink:rethought;foresee:foresaw:foreseen;give up:gave up:given up"
  .split(";").map(x => x.split(":"));
const IRRMAP = new Map(); IRR.forEach(g => g.forEach(f => { if (!IRRMAP.has(f)) IRRMAP.set(f, g); }));
const KW_STOP = new Set("the and but for not nor you your our its his her their they them him she this that these those there with from into onto than then when what who whom which very much many more most less some any all one two who's".split(" "));
function regForms(b) { const f = [b, b + "s", b + "es", b + "ed", b + "ing", b + "d"];
  if (/e$/.test(b)) f.push(b.slice(0, -1) + "ing");
  if (/[^aeiou]y$/.test(b)) f.push(b.slice(0, -1) + "ied", b.slice(0, -1) + "ies");
  if (/[^aeiou][aeiou][bdgklmnprt]$/.test(b)) f.push(b + b.slice(-1) + "ed", b + b.slice(-1) + "ing");
  if (/ie$/.test(b)) f.push(b.slice(0, -2) + "ying");
  return f; }
function kwForms(w) {
  if (KW_STOP.has(w) || /^\d+$/.test(w) || (w.length < 3 && !IRRMAP.has(w))) return new Set([w]);
  const bases = new Set([w]);
  // từ khóa đã chia sẵn (leads, skyrocketed, fueling, studied) → đoán dạng gốc
  let m; if ((m = w.match(/^(.{2,})ies$/)) || (m = w.match(/^(.{2,})ied$/))) bases.add(m[1] + "y");
  if ((m = w.match(/^(.{2,}?)(es|s)$/))) { bases.add(m[1]); if (m[2] === "es") bases.add(m[1] + "e"); }
  if ((m = w.match(/^(.{2,}?)(ed|ing)$/))) { bases.add(m[1]); bases.add(m[1] + "e"); if (/(.)\1$/.test(m[1])) bases.add(m[1].slice(0, -1)); }
  if ((m = w.match(/^(.{2,})d$/))) bases.add(m[1]);
  const out = new Set();
  bases.forEach(b => { const g = IRRMAP.get(b); if (g) { g.forEach(x => out.add(x)); if (g[0].length > 2) regForms(g[0]).forEach(x => out.add(x)); } else if (b.length > 2) regForms(b).forEach(x => out.add(x)); });
  out.add(w);
  return out;
}
const KWC = new Map();
function kwHit(text, alt) {
  alt = alt.trim(); const t = norm(text); if (!alt) return false;
  if (alt === "ing" || alt === "-ing") return /\b\w{2,}ing\b/.test(t);
  const a = norm(alt); if (!a) return false;
  if ((" " + t + " ").includes(" " + a + " ")) return true;
  let pat = KWC.get(a); if (!pat) { pat = a.split(" ").map(kwForms); KWC.set(a, pat); }
  const T = t.split(" ");
  for (let i = 0; i + pat.length <= T.length; i++) if (pat.every((fs, j) => fs.has(T[i + j]))) return true;
  return false;
}
const kwChips = kw => `<div class="kws">${kw.map(k => { const l = k.split("/")[0].trim(); return `<span class="kw">${esc(l === "ing" ? "-ing" : l)}</span>`; }).join("")}</div>`;
function kwLine(min, n) { const k = Math.max(1, Math.ceil(n * 0.7)); return `Ít nhất ${min} từ · ${k >= n ? (n > 1 ? `dùng cả ${n} gợi ý` : "dùng gợi ý") : `dùng ít nhất ${k}/${n} gợi ý`}:`; }
/* Thi thử: không cho dán / kéo thả / chèn một mảng chữ lớn (bàn phím gợi ý dán, đọc chính tả, execCommand) */
const NOPASTE = "Bài thi không cho dán văn bản, hãy tự gõ.";
function mockBefore(e) { if (!P || P.kind !== "mock") return; const t = e.inputType || "", d = e.data || (e.dataTransfer && e.dataTransfer.getData && e.dataTransfer.getData("text")) || "";
  if (/^insertFrom/.test(t) || ((t === "insertText" || t === "insertReplacementText" || t === "insertCompositionText") && d.length > 25)) { e.preventDefault(); toast(NOPASTE); } }
/* Hoàn tác / làm lại (Ctrl+Z, phím hoàn tác, lắc máy) chỉ khôi phục chữ chính người học gõ (dán không vào được ngăn hoàn tác).
   Chèn nhiều mảng nhỏ liên tiếp (dán từng đoạn 25 ký tự) mà gần như không gõ phím: cũng chặn */
function mockInput(el, ev) { if (!P || P.kind !== "mock") return true; const t = (ev && ev.inputType) || "", prev = el._prev || "", add = el.value.length - prev.length, now = performance.now();
  const ok = el._ok || (el._ok = new Set([""]));
  // hoàn tác / làm lại chỉ được về một nội dung đã từng được nhận (chữ tự gõ), không mang lại mảng chữ đã bị chặn
  if (/^history(Undo|Redo)$/.test(t)) { if (!ok.has(el.value)) { el.value = prev; toast(NOPASTE); return false; } el._prev = el.value; el._burst = []; return true; }
  if (add > 25) { el.value = prev; toast(NOPASTE); return false; }
  if (add > 0) { const b = (el._burst = (el._burst || []).filter(x => now - x[0] < 2000)); b.push([now, add, prev]);
    el._keys = (el._keys || []).filter(x => now - x < 2000); const chars = b.reduce((a, x) => a + x[1], 0);
    if (chars > 60 && el._keys.length < chars / 3) { el.value = b[0][2]; el._burst = []; el._prev = el.value; toast(NOPASTE); return false; } }
  ok.add(el.value); el._prev = el.value; return true; }
const MOCK_GUARD = `onpaste="event.preventDefault();toast(NOPASTE)" ondrop="event.preventDefault();toast(NOPASTE)" onbeforeinput="mockBefore(event)" onkeydown="(this._keys=this._keys||[]).push(performance.now())"`;
function rWrite(s) {
  const w = s.wr;
  const mock = P.kind === "mock";
  return `<p class="lab"><i class="ti ti-pencil"></i> Viết · ${mock ? "Bài viết" : "Viết đoạn văn ngắn"}</p><div class="say left">${w.en ? `<p><b>${esc(w.en)}</b></p><p class="sm muted">${esc(w.p)}</p>` : `<p><b>${esc(w.p)}</b></p>`}<p class="sm muted">${kwLine(w.min, w.kw.length)}</p>${kwChips(w.kw)}</div>
  <textarea id="inp" rows="6" placeholder="Viết bằng tiếng Anh..." oninput="${mock ? "mockInput(this,event);" : ""}$('#wc').textContent=wcount(this.value)+' / ${w.min} từ';$('#er').textContent=''" autocapitalize="sentences" spellcheck="${mock ? "false" : "true"}" ${mock ? `autocorrect="off" ${MOCK_GUARD}` : ""}></textarea><p class="sm muted" id="wc">0 / ${w.min} từ</p><p class="err" id="er"></p><div id="wres"></div>
  <button class="btn primary full" id="chk" onclick="checkWrite()">${P.kind === "mock" ? "Nộp bài viết" : "Chấm bài"}</button>${P.kind === "mock" ? "" : `<button class="link" id="skipm" onclick="showModel()">Xem bài mẫu và bỏ qua</button>`}`;
}
async function checkWrite() {
  const s = P.steps[P.i], w = s.wr, v = $("#inp").value;
  if (wcount(v) < 3) { $("#er").textContent = "Hãy viết vài câu trước khi kiểm tra."; return; }
  $("#wc").textContent = wcount(v) + " / " + w.min + " từ";
  const btn = $("#chk"); if (btn) { if (btn.disabled) return; btn.disabled = true; btn.innerHTML = "Đang chấm bài..."; } const sk = $("#skipm"); if (sk) sk.style.visibility = "hidden";
  s.gtext = v; s.grading = Grader.grade(v, { min: w.min, kw: w.kw, refs: P.kind === "mock" ? mockRefs() : s.seenModel ? [w.model] : [], topic: P.kind === "mock" ? [w.p, w.en || "", w.model].join("\n") : undefined, tense: /vừa rồi|vừa qua|hôm qua|tuần trước|tháng trước|năm ngoái|hồi nhỏ|ngày xưa|đã từng|lần đầu tiên|kể lại/i.test(w.p) ? "past" : undefined });
  const r = await s.grading; s.grading = null;
  if (!P || P.steps[P.i] !== s || P.ending) return; // hết giờ trong lúc chấm: timeUp() dùng kết quả này
  if (sk) sk.style.visibility = "";
  if (P.kind === "mock") { P.wres = { r, text: v, wr: w }; s.part = r.total / 10 * (s.pts || 10); grade(r.total >= 10, ""); return; }
  if (btn) { btn.disabled = false; btn.innerHTML = "Chấm lại"; }
  $("#wres").innerHTML = myReport(r, w, { id: "les" });
  const pass = r.total >= 5 && r.n >= w.min * 0.8;
  s.tries = (s.tries || 0) + 1;
  if (pass) { $("#er").textContent = ""; if (btn) btn.remove(); const sk2 = $("#skipm"); if (sk2) sk2.remove(); $("#inp").disabled = true; showModelBox(); grade(true, "", `Đạt ${vdec(r.total)}/10 điểm!`); }
  else { $("#er").textContent = r.n < w.min * 0.8 ? `Bài mới có ${r.n} từ. Viết thêm cho đủ ${w.min} từ rồi bấm Chấm lại.` : `Bài đạt ${vdec(r.total)}/10, cần từ 5 điểm. Sửa các lỗi gạch chân rồi bấm Chấm lại.`; const er = $("#er"), top = (er.getBoundingClientRect().top + scrollY) - ($(".ptop") ? $(".ptop").offsetHeight : 0) - 24; window.scrollTo({ top: Math.max(0, top), behavior: "smooth" }); }
}
function showModelBox() { const w = P.steps[P.i].wr; P.steps[P.i].seenModel = 1; $("#wres").insertAdjacentHTML("beforeend", `<div class="model"><div class="row between"><b>Bài mẫu để so sánh</b>${spk(w.model.replace(/\n/g, " "))}</div><p>${esc(w.model).replace(/\n/g, "<br>")}</p><p class="sm muted">So sánh cách mở bài, từ nối và cấu trúc câu của bài mẫu với bài của bạn.</p></div>`); }
function showModel() { if (P.ans) return; const c = $("#chk"); if (c) c.remove(); const k = $("#skipm"); if (k) k.remove(); $("#inp").disabled = true; showModelBox(); grade(false, "", null, "", `<p class="fbt"><i class="ti ti-eye"></i> <span class="fbm">Đã xem bài mẫu – lần sau thử tự viết nhé</span></p>`); }

/* ---------- Kết thúc ---------- */
function finish() {
  try { if (window.TEACHER && TEACHER.onFinish && P) TEACHER.onFinish(P); } catch (e) {}
  tick();
  if (P.kind === "gram" || P.kind === "mock") return finishStudy();
  const k = P.kind, sc = P.tot ? Math.round(P.ok / P.tot * 100) : 100; let h = "", btns = "", bonus = 0;
  if (k === "lesson") {
    const L = LES[P.id], prev = S.done[L.id], ok = sc >= 80, first = !passed(L.id) && ok;
    S.done[L.id] = { best: Math.max(sc, prev ? prev.best : 0), at: Date.now() }; S.resume = null; if (!prev) lg().lessons++;
    if (L.srs !== false) L.W.forEach(w => { if (!S.cards[w.en]) S.cards[w.en] = { vi: w.vi, box: 0, due: Date.now() + DAY }; });
    bonus = 20 + (first ? 30 : 0) + (sc === 100 ? 20 : 0); if (sc === 100) S.cnt.perfect++;
    const n = nextLesson();
    h = `<h1>${sc === 100 ? "Hoàn hảo!" : ok ? "Hoàn thành bài học!" : "Gần được rồi!"}</h1><p class="muted">${ok ? (n && n !== L.id ? "Bài tiếp theo đã mở." : "Bạn đã xong bài này.") + (L.srs !== false ? `<br>${L.W.length} ${L.kind === "letters" ? "chữ cái" : "từ mới"} đã vào kho ôn tập.` : "") : "Cần đạt 80% để mở bài tiếp theo.<br>Học lại một lần nữa sẽ dễ hơn nhiều!"}</p>`;
    btns = (ok && n && n !== L.id ? `<button class="btn primary full lg" onclick="openIntro('${n}')">Bài tiếp theo <i class="ti ti-arrow-right"></i></button>` : `<button class="btn primary full lg" onclick="startLesson('${L.id}')"><i class="ti ti-refresh"></i> Học lại</button>`) + `<button class="btn full" onclick="nav('home')">Về trang chủ</button>`;
  } else if (k === "review" || k === "mist") {
    bonus = 10;
    h = `<h1>${k === "review" ? "Ôn xong!" : "Sửa lỗi xong!"}</h1><p class="muted">${k === "review" ? "Từ bạn nhớ đúng sẽ được nhắc lại thưa hơn.<br>Từ sai sẽ quay lại sớm." : `Còn ${Object.keys(S.mistakes).length} lỗi trong Sổ tay.`}</p>`;
    btns = `<button class="btn primary full lg" onclick="nav('home')">Về trang chủ</button>`;
  } else if (k === "exam") {
    const st = stageOf(P.sid), ok = sc >= 80;
    if (ok) { bonus = 100; S.stagePassed[P.sid] = true; st.lessons.forEach(L => { S.unlocked[L.id] = true; if (L.srs !== false) L.W.forEach(w => { if (!S.cards[w.en]) S.cards[w.en] = { vi: w.vi, box: 3, due: Date.now() + (3 + Math.floor(Math.random() * 28)) * DAY }; }); }); const ni = ORDER.indexOf(st.lessons[st.lessons.length - 1].id) + 1; if (ORDER[ni]) S.unlocked[ORDER[ni]] = true; }
    const mk = P.wrong > 0 && Object.keys(S.mistakes).length > 0;
    h = `<h1>${ok ? "Chúc mừng! Bạn đã qua " + st.name : "Chưa qua chặng"}</h1><p class="muted">${ok ? "Toàn bộ bài trong chặng đã mở<br>và chặng kế tiếp đã sẵn sàng." : "Cần đạt 80%.<br>Luyện lại các câu sai rồi làm lại bài kiểm tra nhé."}</p>`;
    btns = ok ? `<button class="btn primary full lg" onclick="nav('road')">Xem lộ trình</button>` : `<button class="btn primary full lg" onclick="startExam('${P.sid}')"><i class="ti ti-refresh"></i> Làm lại bài kiểm tra</button>${mk ? `<button class="btn full" onclick="startMistakes()"><i class="ti ti-alert-triangle"></i> Luyện lại câu sai</button>` : ""}<button class="btn full" onclick="nav('road')">Xem lộ trình</button>`;
  } else {
    const n = P.ok; let start, msg; const c = { a1: 0, a2: 0, b1: 0, b2: 0, c1: 0 }, lvd = P.steps.some(s => s.lv); P.steps.forEach(s => { if (s.lv && s.got && !s.r) c[s.lv] = (c[s.lv] || 0) + 1; });
    if (lvd) {
      // 9/11 câu A1 là đã vững A1; một hai câu sơ suất ở A1 không kéo người học giỏi xuống thấp
      if (c.a1 <= 3) { start = "s0-1"; msg = "Bạn nên bắt đầu từ <b class='nw'>Chặng 0 – Làm quen âm</b> để có nền phát âm chắc."; }
      else if (c.a1 <= 6) { start = "a1-1"; msg = "Bạn đã có chút nền. Bắt đầu từ <b>A1 – Bài 1</b>. Chặng 0 vẫn mở để bạn luyện phát âm."; }
      else if (c.a1 <= 8 && c.a2 <= 2) { start = "a1-13"; msg = "Bạn nắm khá tốt phần đầu A1. Đã mở đến <b>A1 – Bài 13</b>."; }
      // muốn bỏ qua một chặng phải làm đúng phần lớn câu của chặng đó (A2 4/5, B1 3/4, B2 3/4 và B2 + C1 6/8): đoán mò may mắn không nhảy cóc cả chặng
      else if (c.a2 <= 3) { start = "a2-1"; msg = M_A2; }
      else if (c.b1 <= 2) { start = "b1-1"; msg = M_B1; }
      else if (c.b2 <= 2 || c.b2 + c.c1 <= 5) { start = "b2-1"; msg = M_B2; }
      else { start = "c1-1"; msg = "Rất ấn tượng! Bạn có thể học thẳng <b>C1 – Cao cấp</b>. Nếu muốn chắc chắn, hãy làm bài kiểm tra vượt chặng B2 trong Lộ trình."; }
    }
    else if (n <= 3) { start = "s0-1"; msg = "Bạn nên bắt đầu từ <b class='nw'>Chặng 0 – Làm quen âm</b> để có nền phát âm chắc."; }
    else if (n <= 7) { start = "a1-1"; msg = "Bạn đã có chút nền. Bắt đầu từ <b>A1 – Bài 1</b>. Chặng 0 vẫn mở để bạn luyện phát âm."; }
    else if (n <= 10) { start = "a1-13"; msg = "Bạn nắm khá tốt phần đầu A1. Đã mở đến <b>A1 – Bài 13</b>."; }
    else if (n <= 14) { start = "a2-1"; msg = M_A2; }
    else if (n <= 17) { start = "b1-1"; msg = M_B1; }
    else if (n <= 21) { start = "b2-1"; msg = M_B2; }
    else { start = "c1-1"; msg = "Rất ấn tượng! Bạn có thể học thẳng <b>C1 – Cao cấp</b>. Nếu muốn chắc chắn, hãy làm bài kiểm tra vượt chặng B2 trong Lộ trình."; }
    S.placement = n; S.placeStart = start; ORDER.slice(0, ORDER.indexOf(start) + 1).forEach(id => S.unlocked[id] = true);
    h = `<h1>Kết quả: ${n}/${P.tot} câu đúng</h1><p>${msg}</p>`; btns = `<button class="btn primary full lg" onclick="openIntro('${start}')">Bắt đầu học</button><button class="btn full" onclick="nav('road')">Xem lộ trình</button>`;
  }
  const gained = P.xp + bonus; if (gained) addXP(gained);
  const skr = Object.keys(P.sk).length ? `<div class="card skbox">${Object.keys(P.sk).map(x => { const v = P.sk[x], p = Math.round(v[0] / v[1] * 100); return `<div class="skrow"><i class="ti ti-${SKI[x]}"></i><span class="skn">${SK[x]}</span><div class="bar grow"><span style="width:${p}%"></span></div><b>${v[0]}/${v[1]}</b></div>`; }).join("")}</div>` : "";
  const ok = sc >= 80 || k === "review" || k === "mist" || k === "place";
  P = null; save();
  app().innerHTML = `<div class="donescr${ok ? "" : " fail"}"><div class="ring xl" style="--p:${sc}"><span>${k === "place" ? '<i class="ti ti-clipboard-check"></i>' : sc + "%"}</span></div>${h}${gained ? `<p class="xpbig">+${gained} XP</p>` : ""}${skr}<div class="stack">${btns}</div></div>`;
  document.body.classList.add("playing");
  if (ok) { beep("done"); if (sc >= 80 && k !== "place") confetti(); }
  checkBadges(); checkDay();
}

/* ---------- Bàn phím ---------- */
document.addEventListener("keydown", e => {
  if (!P || e.defaultPrevented || $(".modal")) return; // hộp thoại đang mở: phím không tác động lên trang phía sau
  if (e.repeat && e.key !== "Shift") return;
  const t = e.target.tagName;
  if (e.key === "Enter" && !e.shiftKey) {
    const nb = $("#nextb"); if (nb && $("#fb.on")) { e.preventDefault(); nb.click(); return; }
    const s = P.steps[P.i]; if (t === "TEXTAREA" && s && s.type !== "write" && s.type !== "xs") { e.preventDefault(); const c = $("#chk"); if (c) c.click(); return; }
    const xk = $("#xok"); if (xk && !xk.disabled && t !== "TEXTAREA" && t !== "INPUT") { e.preventDefault(); xk.click(); return; }
  }
  if (t === "TEXTAREA" || t === "INPUT") return;
  if (/^[1-6]$/.test(e.key)) { const b = $("#o" + (+e.key - 1)); if (b && !b.disabled) b.click(); }
  if ((e.key === " " && t !== "BUTTON") || e.key === "r") { const s = P.steps[P.i]; const a = s && (s.audio || s.en); if (s && s.limit) { e.preventDefault(); examPlay(); } else if (a && P.kind !== "mock") { e.preventDefault(); say(a); } }
});

/* ---------- Cài đặt app (PWA) ---------- */
let installEvt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; if (!P && !VIEW) render(); });
function doInstall() { if (!installEvt) return; installEvt.prompt(); installEvt.userChoice.finally(() => { installEvt = null; render(); }); }
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  const hadSW = !!navigator.serviceWorker.controller;
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  // Có bản mới: chỉ tự tải lại khi không có bài học, trò chơi, màn hình phụ hay ô nhập đang dở
  const busy = () => !!P || (typeof G !== "undefined" && !!G) || !!VIEW || $$("textarea,input.inp").some(e => e.value.trim() && (e === document.activeElement || e.id === "bk"));
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadSW) { window.__upd = 1; if (!busy()) location.reload(); else toast(P ? "Đã có bản cập nhật. Học xong bài này app sẽ tự tải lại." : "Đã có bản cập nhật. App sẽ tải lại khi bạn về trang chính."); } });
}
if (window.matchMedia) try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => applyTheme()); } catch (e) {}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") last = Date.now(); });
MIG_READY = true; try { migrateContent(S); } catch (e) {}
if (load.broken) setTimeout(() => toast("Dữ liệu học cũ trên máy bị hỏng nên không đọc được.<br>App đã giữ lại một bản sao. Nếu có mã hoặc tệp sao lưu, hãy khôi phục trong Hồ sơ.", 8000), 900);
/* ================= Ngắt dòng có nghĩa =================
   Chỉ đụng tới chữ tiếng Việt: không tách từ ghép, số đi với đơn vị, không để một âm tiết mồ côi ở dòng cuối,
   không để dấu "·" hay chữ đầu câu mới bị treo ở cuối dòng. Chữ tiếng Anh, ô nhập liệu, bài đọc không bị đổi. */
const VI_CH = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
/* Từ ghép 2–3 âm tiết (Viet74K ∩ chữ trong app, đã lọc bỏ cụm hư từ ghép sai) */
const VWORDS = new Set("an toàn|anh chị|anh chị em|ba mươi|ba tuần|ban công|ban đêm|bao giờ|bao gồm|bao lâu|bao nhiêu|biên bản|biên lai|biên tập|biên tập viên|biến đổi|biến động|biết ơn|biển báo|biểu tượng|biện minh|biện pháp|buồn bực|buổi chiều|buổi sáng|buổi trưa|buổi tối|bà ngoại|bà nội|bài giảng|bài hát|bài học|bài kiểm tra|bài mẫu|bài nghe|bài thi|bài tập|bài viết|bài đọc|bàn chân|bàn giao|bàn phím|bàn tay|bàn thờ|bác bỏ|bác sĩ|bám sát|bán hoa|bán hàng|bánh chưng|bánh mì|bánh ngọt|bánh trung thu|báo chí|báo cáo|báo hiệu|bát tràng|bát đĩa|bây giờ|bãi biển|bên cạnh|bên dưới|bên ngoài|bên trong|bình luận|bình thường|bình tĩnh|bình đẳng|bí mật|bí ẩn|bóng đá|bóp méo|bù nhìn|bút chì|bơi lội|bưu kiện|bưu thiếp|bưu điện|bước ngoặt|bước đầu|bướng bỉnh|bạn bè|bạn học|bạn thân|bạn đọc|bản chất|bản năng|bản thân|bản tin|bản xứ|bản đồ|bảng chữ cái|bảo dưỡng|bảo hiểm|bảo hành|bảo mật|bảo tàng|bảo vệ|bấm loa|bấm nút|bấm vào|bất bình|bất bình đẳng|bất chấp|bất cẩn|bất cứ|bất kể|bất lịch sự|bất ngờ|bất tiện|bầu không khí|bầu trời|bậc thầy|bận rộn|bật hơi|bắt buộc|bắt cá|bắt nguồn|bắt đầu|bắt đầu từ|bằng chứng|bằng cấp|bến tre|bền chặt|bền vững|bệnh nhân|bệnh viện|bị thương|bị động|bỏ chạy|bỏ dở|bỏ lỗi|bỏ lỡ|bỏ phiếu|bỏ qua|bỏ quên|bỏ sót|bỏ thuốc|bỏ đi|bố cục|bố mẹ|bốc đồng|bối cảnh|bối rối|bốn mươi|bồi thường|bổ sung|bổ trợ|bỗng nhiên|bộ ba|bộ luật|bộ phận|bờ biển|bởi vì|bữa tiệc|bực mình|ca sĩ|cao cấp|cao nhất|cao tốc|cha mẹ|chi phí|chi tiêu|chi tiết|chi trả|chia bài|chia sẻ|chiến dịch|chiến lược|chiếu phim|cho mượn|cho phép|cho rằng|cho đến|choáng ngợp|chuyên gia|chuyên môn|chuyên mục|chuyên nghiệp|chuyên ngành|chuyến xe|chuyển khoản|chuyển nhà|chuyển tiếp|chuyển đổi|chuẩn bị|chuẩn xác|chuỗi ngày|chào hỏi|chào mừng|chán quá|cháy nắng|châm biếm|châm chọc|chân răng|chân váy|chí minh|chính phủ|chính quyền|chính sách|chính thức|chính tả|chính xác|chó mèo|chóng mặt|chú rể|chú ý|chúc mừng|chúng ta|chúng tôi|chăm chỉ|chăm sóc|chưa từng|chương trình|chạy thoát|chạy đua|chấm bài|chấm dứt|chấm phần|chấm điểm|chấn thương|chấp nhận|chất liệu|chất lượng|chất thải|chất đạm|chậm nhất là|chậm rãi|chậm tiến|chậm trễ|chắc chắn|chắc hẳn|chẳng bao lâu|chẳng hạn|chặng đường|chặt chẽ|chế biến|chế độ|chỉ cần|chỉ dẫn|chỉ số|chỉ trích|chị em|chị gái|chịu đựng|chọn lọc|chống lại|chỗ ngồi|chỗ trống|chợ nổi|chụp ảnh|chủ nghĩa|chủ nhiệm|chủ ngữ|chủ nhật|chủ quan|chủ sở hữu|chủ trì|chủ yếu|chủ điểm|chủ đích|chủ đề|chủ động|chức năng|chứng chỉ|chứng khoán|chứng kiến|chứng minh|chứng nhận|chừng mực|chữ cái|chữ viết|con cái|con gái|con người|con sông|con số|con tàu|con đường|cung cấp|cuối bài|cuối cùng|cuối tuần|cuộc họp|cuộc sống|cuộc đua|cuộc đời|cà chua|cà phê|cà phê sữa|cà rốt|cà vạt|cài đặt|cá nhân|cách diễn|cái bàn|cái gì|cái răng|cánh tay|cánh đồng|cáo buộc|cân bằng|cân nhắc|câu chuyện|câu hỏi|câu kết|câu lạc bộ|câu nói|câu sai|câu trả lời|câu ví|câu văn|cây bút|cây non|còn lại|có lý|có lẽ|có lỗi|có lợi|có mặt|có nghĩa|có phải|có sẵn|có thể|có vấn đề|có vẻ|cô dâu|cô đơn|cô đọng|côn trùng|công bố|công chúng|công cộng|công kích|công nghiệp|công nghệ|công nhân|công nhận|công sở|công sức|công thức|công trình|công ty|công viên|công việc|cù lao|cù lao xanh|cùng lúc|cùng nhau|căn cứ|căn hộ|căng thẳng|cũng vậy|cơ bản|cơ chế|cơ hội|cơ sở|cơ thể|cơm chiên|cư dân|cải thiện|cải tạo|cảm giác|cảm kích|cảm lạnh|cảm nhận|cảm thấy|cảm xúc|cảm động|cảm ơn|cảnh báo|cảnh sát|cảnh tỉnh|cấm đoán|cấp độ|cất cánh|cất lời|cấu thành|cấu trúc|cấu tạo|cần thiết|cần thơ|cầu lông|cầu thang|cẩn thận|cập nhật|cậu bé|cắn răng|cắt cổ|cắt giảm|cắt tóc|cẳng chân|cố gắng|cố tình|cố vấn|cố ý|cố định|cốt lõi|cốt truyện|cổ họng|cổ phiếu|cổ xưa|cột mốc|cởi mở|cụ thể|cụm từ|củng cố|cửa hàng|cửa ngõ|cửa ra|cửa sổ|cửu long|danh sách|danh từ|dao hai lưỡi|di cư|di sản|dinh dưỡng|diễn giải|diễn thuyết|diễn tả|diễn tập|diễn viên|diễn đạt|do đó|doanh nghiệp|doanh số|du khách|du lịch|duy nhất|duy trì|dài hạn|dàn ý|dành dụm|dân nghèo|dân số|dù cho|dù sao|dùng từ|dưa hấu|dưa leo|dường như|dược sĩ|dấu chấm|dấu câu|dấu hiệu|dấu phẩy|dấy lên|dần dần|dẫn dắt|dễ chịu|dễ dàng|dễ hiểu|dễ ợt|dị ứng|dịch vụ|dọn dẹp|dụng cụ|dữ liệu|dự báo|dự kiến|dự tính|dự án|dự đoán|dự định|e ngại|em bé|em gái|em họ|ghen tị|ghi chép|ghi nhận|ghi nhớ|ghi âm|gia sư|gia tài|gia tăng|gia đình|giai thoại|gian lận|giao diện|giao hàng|giao thông|giao tiếp|giá cả|giá thị trường|giá trị|gián tiếp|giáo dục|giáo viên|giúp đỡ|giả sử|giả thuyết|giả vờ|giả định|giải lao|giải pháp|giải quyết|giải thích|giảm chi|giảm giá|giảm nhẹ|giảm thiểu|giảm đau|giản dị|giảng viên|giấc mơ|giấc ngủ|giấy ghi nhận|giận dữ|giặt giũ|giọng nói|giọng điệu|giọng đọc|giọt nước|giỏ hàng|giới hạn|giới thiệu|giới từ|giờ giấc|giờ ăn|giờ đây|giữ lại|giữ nguyên|giữ ý|giữa chừng|gây bệnh|góp phần|góp ý|gượng gạo|gạch chân|gạch đầu dòng|gạo nếp|gạt bỏ|gấp đôi|gần như|gần đây|gốc rễ|gốc từ|gợi ý|hai mươi|hai mặt|hiếu khách|hiển nhiên|hiển thị|hiểu biết|hiểu lầm|hiện hành|hiện tượng|hiện tại|hiện đại|hiệu quả|hiệu suất|hiệu trưởng|hoa đào|hoang dã|hoài bão|hoài niệm|hoàn chỉnh|hoàn cảnh|hoàn hảo|hoàn lại|hoàn thành|hoàn toàn|hoàn tác|hoàng đế|hoảng loạn|hung hăng|huy hiệu|huyết áp|hy vọng|hà nội|hài hước|hài lòng|hàm răng|hàm ý|hàn huyên|hàng không|hàng nghìn|hàng xóm|hành chính|hành doanh|hành trình|hành tây|hành vi|hành động|hào hứng|hào phóng|há hốc|hình dung|hình như|hình thức|hình ảnh|hòn đảo|hôm nay|hôm qua|hôm sau|hôm trước|hùng biện|hút bụi|hơn hẳn|hơn hết|hơn nữa|hơn thế nữa|hư hại|hư hỏng|hướng dẫn|hướng dẫn viên|hạ tầng|hạn chế|hạn hán|hạn hẹp|hạn định|hạt giống|hạt tiêu|hải phòng|hải quan|hầu hết|hầu như|hậu quả|hậu tố|hắt hơi|hằng ngày|hết giờ|hết sức|hệ thống|họ hàng|học bổng|học giới|học hiệu|học hành|học kỳ|học lại|học phí|học sinh|học thuật|học tập|học viên|họp báo|hỏng mắt|hối hận|hối tiếc|hồ sơ|hồi hộp|hồi lâu|hồi phục|hồi tưởng|hổn hển|hỗ trợ|hỗn hợp|hộ chiếu|hội an|hội chợ|hội nghị|hội thoại|hội tụ|hộp thư|hợp lý|hợp lệ|hợp tác|hợp đồng|hụt hơi|hủy bỏ|hữu thanh|hữu ích|im lặng|keo kiệt|khi nào|khiếu nại|kho báu|kho ôn tập|khoa học|khoai tây|khoảng cách|khoảng trống|khu phố|khu vực|khuyến khích|khuyến nghị|khuyết thiếu|khuôn mẫu|khuôn mặt|khác biệt|khác nhau|khách du|khách hàng|khách quan|khách sạn|khái quát|khái quát hóa|khám bệnh|khám phá|khán giả|kháng sinh|khéo léo|khét tiếng|khí hậu|khích lệ|khó hiểu|khó khăn|khó xử|khó đọc|khôi phục|khôn ngoan|không gian|không hề|không khí|không những|không phải|không thể|không thể nào|khả năng|khả thi|khảo sát|khẩn cấp|khẩu ngữ|khẩu phần|khẳng định|khỏe mạnh|khối lượng|khởi hành|khởi động|khủng hoảng|kim loại|kinh nghiệm|kinh ngạc|kinh thành|kinh tế|kinh đô|kiên nhẫn|kiên quyết|kiêu ngạo|kiến thức|kiến trúc|kiểm chứng|kiểm tra|kiệt sức|kiệt tác|kéo dài|kích cỡ|kích hoạt|kích thước|ký hiệu|kẻ trộm|kế hoạch|kế tiếp|kết bạn|kết hôn|kết hợp|kết luận|kết nối|kết quả|kết thúc|kết trái|kể chuyện|kể lại|kể từ|kịch bản|kịch tính|kỷ luật|kỷ lục|kỷ niệm|kỹ năng|kỹ sư|kỹ thuật|lan truyền|linh hoạt|linh động|liên hệ|liên kết|liên lạc|liên quan|liên tiếp|liên tục|liệt kê|lo lắng|lo ngại|lo âu|loại bỏ|loại từ|luyện lại|luyện tập|luôn luôn|luẩn quẩn|luận thuyết|luận điểm|luật lệ|làm bài|làm bằng|làm cho|làm chủ|làm gì|làm hỏng|làm lại|làm ngơ|làm phiền|làm quen|làm ra|làm tin|làm tình|làm việc|làm xong|làm đổ|làm ơn|làm ẩu|lành mạnh|lái xe|lâm sàng|lâu dài|lâu đài|lãi suất|lãng phí|lãnh đạo|lên giọng|lên đường|lì xì|lòng vòng|lôi cuốn|lúc này|lúc đó|lý do|lý lịch|lý thuyết|lý tưởng|lăn bánh|lăng mộ|lĩnh vực|lũ lụt|lưu loát|lưu niệm|lưu ý|lương thực|lười biếng|lưỡi mềm|lưỡng lự|lược bỏ|lạc đà|lạc đường|lạc đề|lạm dụng|lạm phát|lấy làm|lấy lại|lần lượt|lập kế|lập luận|lập trường|lập tức|lật thẻ|lắng nghe|lắp đặt|lặp lại|lẽ ra|lễ hội|lễ tân|lịch sự|lịch trình|lịch đại|lối sống|lỗ hổng|lỗi sai|lộ trình|lớn lên|lớp học|lời giải|lời hứa|lời khuyên|lời nói|lỡ cơ|lợi nhuận|lợi thế|lợi ích|lừa đảo|lửa bền|lửa nhỏ|lựa chọn|manh mối|may mắn|minh họa|miêu tả|miền nam|miền tây|miễn dịch|miễn là|miễn phí|miệt mài|mong chờ|mong muốn|mong đợi|mua sắm|muối bỏ bể|muộn màng|mà còn|màn hình|màu sắc|mái tóc|mát mẻ|máy bay|máy móc|máy nghe|máy tính|mâu thuẫn|mãn tính|móc túi|món hàng|món ăn|mô phỏng|mô tả|môi trường|môn học|mùa hè|mùa khô|mùa thu|mùa xuân|mùa đông|măng tô|mơ hồ|mưa như trút|mươi lăm|mười lăm|mạch lạc|mạo từ|mất công|mất ngủ|mấu chốt|mầm non|mẫu đơn|mật khẩu|mắc kẹt|mắc lỗi|mặc dù|mặt khác|mặt trời|mặt đất|mệnh lệnh|mệnh đề|mệt mỏi|mỉa mai|mỉm cười|mồ hôi|mỗi ngày|mỗi tuần|một chút|một cách|một lần|một mình|một mặt|một số|một ít|mới nảy mầm|mới đó|mở cửa|mở miệng|mở rộng|mở đường|mở đầu|mục tiêu|mục đích|mức lương|mức nhớ|mức độ|mực nước|ngay lập tức|nghe chậm|nghe nói|nghe thấy|nghe thử|nghi ngờ|nghiêm khắc|nghiêm nghị|nghiêm trọng|nghiêm túc|nghiên cứu|nghèo đói|nghìn năm|nghĩ ra|nghĩa là|nghĩa vụ|nghề nghiệp|nghỉ hưu|nghỉ ngơi|nghỉ việc|nghị luận|nghịch lý|nghịch ngợm|ngoài ra|ngoài trời|ngoại giao|ngoại hình|ngoại ngữ|ngoại phạm|ngoại động|ngoại động từ|ngoạn mục|nguy cơ|nguy hiểm|nguyên liệu|nguyên mẫu|nguyên nhân|nguyên văn|nguyên âm|nguyên đán|nguồn tin|ngày càng|ngày kia|ngày lễ|ngày mai|ngày nay|ngày sinh|ngày tháng|ngày thường|ngày trước|ngày xưa|ngân hàng|ngân hàng đề|ngân sách|ngôi nhà|ngôi thứ|ngôi thứ ba|ngôn ngữ|ngôn từ|ngăn kéo|người già|người học|người làm|người lạ|người lớn|người máy|người nhà|người phát ngôn|người ta|người thân|ngược lại|ngượng ngùng|ngạc nhiên|ngần ngại|ngẫu nhiên|ngập lụt|ngắn gọn|ngắn hạn|ngắt lời|ngọn đuốc|ngọn đèn|ngộ độc|ngụ ý|ngủ dậy|ngủ gục|ngủ ngon|ngủ quên|ngủ thiếp|ngữ cảnh|ngữ pháp|ngữ điệu|nhanh chóng|nhiên liệu|nhiệm vụ|nhiệt độ|nhu cầu|nhà báo|nhà bếp|nhà cửa|nhà ga|nhà hàng|nhà máy|nhà ngoại|nhà thuốc|nhà thơ|nhà ở|nhàm chán|nhân chứng|nhân quả|nhân tạo|nhân viên|nhân vật|nhân đạo|nhã nhặn|nhìn chung|nhìn nhận|nhìn thấy|nhút nhát|như nhau|như thế|như vậy|nhược điểm|nhượng bộ|nhạc cụ|nhạt nhẽo|nhạy cảm|nhảy dù|nhảy múa|nhấn mạnh|nhất là|nhận lời|nhận ra|nhận thức|nhận xét|nhập khẩu|nhắc lại|nhắc nhở|nhắn tin|nhẹ lời|nhẹ nhàng|nhẹ nhõm|nhộn nhịp|nhớ lâu|nhớ lại|nhớ nhà|ninh bình|niềm tin|nào đó|nâng cao|nâng cấp|né tránh|nói chuyện|nói cách khác|nói khéo|nói lẫn|nói ra|nói rào|nói rõ|nói theo|nói thật|nói thẳng|nói to|nông dân|nông thôn|núi non|nút bấm|năm mươi|năm nay|năm ngoái|năm năm|năm qua|năm tuổi|năm tới|năng lượng|năng lực|nước cam|nước dừa|nước mưa|nước mắm|nước mặn|nước ngoài|nước sạch|nước ép|nảy mầm|nấu cơm|nấu ăn|nắm chắc|nắm vững|nặng nề|nối âm|nồi cơm điện|nổi bật|nổi tiếng|nỗ lực|nội dung|nửa đêm|nữ sinh|pha chế|phi công|phiên chợ|phiên âm|phiêu lưu|phiến diện|phong cách|phong cảnh|phong phú|phong tục|phàn nàn|phá hủy|phá kỷ lục|phá vỡ|phác thảo|pháo hoa|phát hiện|phát minh|phát ngôn|phát sóng|phát triển|phát âm|phân tích|phân từ|phê bình|phê duyệt|phòng khi|phòng khách|phòng ngủ|phóng viên|phù hợp|phúc lợi|phương pháp|phương tiện|phạm vi|phản biện|phản hồi|phản tác dụng|phản đối|phản ứng|phản ứng thế|phần lớn|phần nào|phần thưởng|phần trăm|phẩm chất|phỏng vấn|phổ biến|phổ thông|phụ lục|phụ nữ|phụ thuộc|phụ âm|phụ đề|phục hồi|phục vụ|phủ nhận|phủ định|phức tạp|qua sông|quan hệ|quan ngại|quan niệm|quan trọng|quan tâm|quan điểm|quanh năm|quay lại|quy hoạch|quy tắc|quy định|quyên góp|quyết tâm|quyết đoán|quyết định|quá hạn|quá khứ|quá mức|quá tay|quá trình|quá tải|quát mắng|quê hương|quản lý|quảng cáo|quần bò|quần soóc|quần áo|quầy hàng|quốc gia|quốc nội|quốc tế|ra hiệu|ra lệnh|ra mắt|ra vào|ra đi|ra đời|riêng lẻ|riêng tư|run rẩy|ruộng lúa|rào đón|rác thải|rõ ràng|rút gọn|rút tiền|rước đèn|rườm rà|rập khuôn|rắc rối|rốt cuộc|rộng rãi|rủi ro|rực rỡ|sai khiến|sai lầm|sang hình|sang số|sao chép|sao lưu|sau này|sau đó|sinh hoạt|sinh học|sinh nhật|sinh viên|sinh vật|siêu thị|siêu đẳng|so sánh|so với|soi xét|suy giảm|suy luận|suy nghĩ|suy thoái|suy yếu|suy đoán|suýt soát|sài gòn|sáng kiến|sáng lập|sáng suốt|sáng sớm|sân bay|sân chơi|sâu xa|sông cửu long|sông nước|sơ cấp|sơ mi|sơ yếu|sưu tập|sản phẩm|sản xuất|sắc bén|sắc thái|sắp quên|sắp xếp|sẵn có|sẵn sàng|số hiệu|số liệu|số lượng|số nhiều|số ít|sống sót|sống động|sổ tay|sở hữu|sở thích|sở thú|sợ hãi|sụp đổ|sứ quán|sức khỏe|sức mua|sử dụng|sửa chữa|sửa lỗi|sửa sang|sự cố|sự kiện|sự nghiệp|sự thật|sự việc|tai nạn|tai thính|tao nhã|tham dự|tham khảo|tham nhũng|thanh thiếu niên|thanh thản|thanh toán|thanh điệu|thao túng|thay thế|thay vì|thay đổi|then chốt|theo dõi|theo kịp|theo như|thi công|thi thử|thiên kiến|thiên lệch|thiên nhiên|thiên vị|thiết bị|thiết kế|thiết lập|thiết yếu|thiếu niên|thiện trí|thon thả|thoải mái|thu hút|thu nhập|thuyết phục|thuyết trình|thuật ngữ|thuật số|thuốc lá|thành công|thành danh|thành lập|thành ngữ|thành phố|thành thạo|thành thật|thành tích|thách thức|thái quá|thái độ|tháng ba|tháng bảy|tháng chín|tháng hai|tháng mười|tháng mười hai|tháng mười một|tháng năm|tháng sáu|tháng trước|tháng tám|tháng tư|thâm hụt|thân mật|thân thiện|thân ái|thèm muốn|thì thầm|thí điểm|thích nghi|thích thú|thói quen|thô lỗ|thôi thúc|thông báo|thông cáo|thông công|thông dụng|thông minh|thông thường|thông tin|thú vị|thúc đẩy|thăm dò|thăng chức|thư giãn|thư thái|thư viện|thư điện tử|thưa hơn|thương lượng|thường dùng|thường ngày|thường thường|thường xuyên|thưởng thức|thảo luận|thất bại|thất hứa|thất lạc|thất nghiệp|thất vọng|thần đồng|thầy giáo|thẩm định|thận trọng|thập kỷ|thật ra|thật sự|thắng cuộc|thắt lưng|thẳng thắn|thẳng thừng|thặng dư|thế giới|thế hệ|thế kỷ|thế nào|thể diện|thể dục|thể hiện|thể hình|thể thao|thỉnh thoảng|thị thực|thị trường|thỏa hiệp|thỏa thuận|thống kê|thống nhất|thờ cúng|thời gian|thời lượng|thời tiết|thời trang|thời điểm|thở dài|thợ may|thợ máy|thợ điện|thủ công|thủ pháp|thủ tục|thủ đô|thủy tinh|thứ ba|thứ bảy|thứ hai|thứ năm|thứ sáu|thứ tư|thứ tự|thức dậy|thức giả|thức uống|thừa nhận|thử lại|thử nghiệm|thử thách|thực hiện|thực phẩm|thực ra|thực sự|thực tập|thực tế|thực đơn|tin chắc|tin cậy|tin dùng|tin tức|tin đồn|tinh gọn|tinh thần|tinh tế|tiêu chí|tiêu cực|tiêu dùng|tiêu thụ|tiêu đề|tiến bộ|tiến độ|tiếng anh|tiếng lóng|tiếng việt|tiếng động|tiếng ồn|tiếp cận|tiếp diễn|tiếp quản|tiếp theo|tiếp tục|tiếp xúc|tiết chế|tiết kiệm|tiết lộ|tiết phụ|tiền bạc|tiền giang|tiền mặt|tiền thưởng|tiền tiêu|tiền tố|tiền đề|tiểu học|tiểu thuyết|tiện lợi|tiện ích|toàn bộ|toàn cầu|toàn diện|toàn phần|tra cứu|trang chủ|trang lứa|trang phục|trang trí|trang trọng|tranh cãi|tranh luận|trao đổi|tri giác|triều đại|triển khai|triển lãm|triệu chứng|triệu phú|trong suốt|trung bình|trung cấp|trung học|trung lập|trung thực|trung tâm|trung tính|trung ương|truy cập|truyền miệng|truyền thuyết|truyền thông|truyền thống|truyền đạt|truyện ngắn|tràn ngập|tràn đầy|trách nhiệm|trái cây|trái lại|trái nghĩa|trái ngược|trái tim|tráng miệng|trân trọng|trì hoãn|trình bày|trình báo|trình duyệt|trình tự|trình độ|trí nhớ|trí nhớ thép|trí tuệ|trích dẫn|trò chuyện|trò chơi|trôi chảy|trùng lặp|trăm năm|trước hết|trước khi|trước đây|trường học|trường hợp|trạng thái|trạng từ|trả lại|trả lời|trải nghiệm|trầm lặng|trật tự|trắc nghiệm|trẻ con|trẻ em|trẻ trung|trọn vẹn|trọng tâm|trọng âm|trốn thoát|trớ trêu|trở lên|trở ngại|trở nên|trở thành|trở đi|trợ cấp|trợ động từ|trừ khi|trừu tượng|trực tiếp|trực tuyến|tu từ|tuy nhiên|tuy vậy|tuyên bố|tuyển dụng|tuyệt chủng|tuyệt diệu|tuyệt vời|tuyệt đối|tuần trước|tuổi thơ|tài chính|tài khoản|tài liệu|tài xế|tàu hỏa|tàu điện|tác dụng|tác giả|tác động|tái chế|tái tạo|tán thành|tâm lý|tâm thành|tân ngữ|tây nguyên|tên chữ|tên riêng|tìm kiếm|tìm ra|tìm thấy|tình bạn|tình cờ|tình huống|tình hình|tình nguyện|tình thế|tình tiết|tình trạng|tích cực|tích hợp|tích lũy|tính chất|tính cách|tính giờ|tính nết|tính từ|tò mò|tóm lược|tóm lại|tóm tắt|tôn trọng|túi xách|tăng trưởng|tăng tốc|tư cách|tư duy|tương lai|tương quan|tương tự|tương đương|tương đối|tương đồng|tương ứng|tường thuật|tưởng tượng|tại nhà|tạm biệt|tạm thời|tạp chí|tất cả|tất yếu|tầm nhìn|tầm phào|tần suất|tận cùng|tập thể|tập thể dục|tập trung|tế nhị|tết nguyên đán|tỉ lệ|tỉnh giấc|tị nạn|tọa lạc|tọc mạch|tốc độ|tối qua|tối thiểu|tối đa|tốn kém|tốt bụng|tốt nghiệp|tổ chức|tổ tiên|tổ ấm|tổng hợp|tổng quan|tổng sản phẩm|tổng thể|tổng thời gian|tủ lạnh|tức giận|tức thì|từ bỏ|từ chối|từ chức|từ nối|từ thiện|từ trái nghĩa|từ vựng|từ điển|từ đồng nghĩa|tự hào|tự hỏi|tự nhiên|tự tin|tự tôn|tự xưng|tự đánh giá|tự động|tự động hóa|tỷ giá|tỷ lệ|uy tín|uyển ngữ|uống thuốc|vai trò|van nài|viên bao|viết hoa|việc làm|việc nhà|viện dẫn|viện trợ|vui lòng|vui sướng|vui vẻ|vào sổ|vì sao|vì thế|vì vậy|ví dụ|vòi sen|vòm miệng|vòng luẩn quẩn|vòng quanh|vô cùng|vô hình|vô thanh|vô trách nhiệm|vô tình|vô tư|văn bản|văn bằng|văn giới|văn học|văn phong|văn phòng|văn tự|vĩnh long|vũng tàu|vượt chặng|vượt qua|vạch trần|vải bông|vấn đề|vất vả|vận chuyển|vận động|vật liệu|vật lộn|vắng mặt|về quê|về sau|về trang|vệ sinh|vị trí|vội vàng|vội vã|vụ án|vứt bỏ|vừa mới|vừa phải|vừa qua|vừa rồi|vừa vặn|vững chắc|vững ngữ pháp|vững vàng|xa cách|xanh dương|xanh tốt|xao nhãng|xe buýt|xe hơi|xe lăn|xe máy|xe điện|xe đạp|xem lại|xem xét|xin lỗi|xin phép|xin việc|xoay xở|xu hướng|xuyên việt|xuất hiện|xuất khẩu|xuất phát|xuất sắc|xuất trình|xuống dòng|xuống giọng|xác lập|xác minh|xác nhận|xác định|xách tay|xây dựng|xã hội|xã luận|xảy ra|xấu hổ|xếp hàng|xổ số|xứ dừa|xử lý|y tá|y tế|yên bình|yên lặng|yên tĩnh|yêu cầu|yêu thích|yêu thương|yếu tố|ách tắc|ánh sáng|áo dài|áo khoác|áo mưa|áo sơ mi|áo thun|áo xanh|áp dụng|áp lực|âm cuối|âm nhạc|âm thanh|âm tiết|âm đầu|ít nhất|ít nói|ô nhiễm|ô tô|ôn tập|ông bà|ông ngoại|ông nội|ùn tắc|ý chí|ý kiến|ý nghĩa|ý thức|ý tưởng|ý tứ|ăn mừng|ăn trộm|đa dạng|đa dạng hóa|đang yếu|đau bụng|đau lưng|đau đầu|đe dọa|đi bộ|đi chơi|đi chợ|đi dọc|đi học|đi kèm|đi làm|đi lại|đi nghỉ|đi theo|đi thăm|đi thẳng|đi vào|đi vắng|điềm tĩnh|điều chỉnh|điều hành|điều hòa|điều khoản|điều kiện|điều phối|điều tra|điểm cao|điểm dừng|điện thoại|điện tử|đoán chừng|đoạn văn|đuổi theo|đà lạt|đà nẵng|đàm phán|đàn ông|đào tạo|đá bóng|đám cưới|đám mây|đám đông|đáng kể|đáng ngờ|đáng tin|đáng tiếc|đáng tiền|đánh dấu|đánh giá|đánh liều|đánh răng|đánh rơi|đánh trứng|đánh vần|đáp án|đáp ứng|đã thuộc|đã vững|đèn bàn|đèn dầu|đèn lồng|đèn điện|đòi hỏi|đóng cửa|đóng góp|đóng vai|đô la|đô thị|đô thị hóa|đôi bên|đông dân|đông đúc|đúng giờ|đúng lúc|đăng ký|đơn giản|đơn hàng|đơn thuốc|đơn vị|đơn xin|đưa ra|đưa tin|đương nhiên|đường cao|đường cao tốc|đường dây|đường sắt|đường đi|đại chúng|đại dương|đại học|đại sứ|đại sứ quán|đại thể|đại từ|đại ý|đạo văn|đất nước|đầu bài|đầu bếp|đầu lưỡi|đầu tiên|đầu tư|đầu vào|đầu đọc|đầy đủ|đắt đỏ|đặc biệt|đặc trưng|đặc ân|đặt hàng|đếm được|đến hạn|đến mức|đến nay|đến nơi|đề bài|đề cập|đề mục|đề nghị|đề xuất|đều đặn|đều đều|để lại|để lộ|để mắt|để ý|địa chỉ|địa danh|địa phương|địa điểm|định dạng|định kiến|định nghĩa|đọc bài|đọc to|đỏ hoe|đối chiếu|đối chứng|đối diện|đối lập|đối phó|đối phương|đồ dùng|đồ gốm|đồ uống|đồ vật|đồ ăn|đồng bằng|đồng cảm|đồng hồ|đồng nghiệp|đồng nghĩa|đồng phục|đồng tiền|đồng ý|đồng đội|đổ bộ|đổ lỗi|đổi mới|đổi ý|độ chính xác|độ dài|độ nhớ|độ tin cậy|độc giả|độc lập|độc quyền|động cơ|động lực|động từ|động vật|đột nhiên|đột phá|đời sống|đủ số|đứng dậy|đứng giữa|đứng đầu|ưu tiên|ưu điểm|ước lượng|ước mơ|ước nguyện|ước tính|ướt sũng|ảnh hưởng|ảnh ẩn|ấm áp|ấn tượng|ẩn dụ|ập đến|ồn ào|ổn định|ở lại|ủng hộ|ứng dụng|ứng phó|ứng tuyển|ứng viên".split("|"));
["người nói", "người bạn", "bạn mới", "người bạn mới", "ghi nhận", "công nhận"].forEach(w => VWORDS.add(w));
const VFUNC = new Set("và của là các những không để cho với ở một đã sẽ đang rất mỗi hoặc nhưng thì mà được bị khi nếu vì như theo trong trên dưới về đến từ".split(" "));
const VUNIT = new Set("phút giờ giây câu từ bài ngày tuần tháng năm thẻ lượt cặp xp lần chặng cây lỗi đơn phần kỹ chủ điểm chữ âm".split(" "));
const VLBL = /^(chặng|bài|cấp|bước|câu|đơn|phần|lần|ngày|tuần|đạt|thiếu|còn|mã|lớp|mục|top|lầu|tầng)$/i;
const NBS = " ", WJ = "⁠";
const vCore = t => t.replace(/^[(“"‘'«\[]+/, "").replace(/[)”"’'»\].,;:!?…]+$/, "").toLowerCase();
const vEnd = t => /[.,;:!?…)”"’»]$/.test(t);
function glueVi(t, tail, max) {
  /* r5: căn đều hai bên cần nhiều chỗ ngắt. Chỉ nối: từ ghép 2 âm tiết, số + đơn vị, nhãn + số, ký hiệu với chữ bên cạnh.
     Không nối chuỗi quá 2 chữ, không nối qua dấu câu, không nối hư từ, không giữ "2 chữ cuối" (dòng cuối căn trái). */
  if (!VI_CH.test(t)) return t;
  const lead = t.match(/^[ \t\r\n]*/)[0], trail = t.match(/[ \t\r\n]*$/)[0], body = t.slice(lead.length, t.length - trail.length);
  if (!body) return t;
  const tk = body.split(/[ \t\r\n]+/).map(x => x.replace(/(\d)[–-](?=\d)/g, "$1–" + WJ)), n = tk.length, j = new Array(Math.max(0, n - 1)).fill(0);
  if (n < 2) return lead + tk.join(" ") + trail;
  const co = tk.map(vCore), num = i => /^[+~≈]?\d+(?:[.,]\d+)*(?:–⁠\d+)?(?:%|\/\d+)?$/.test(tk[i].replace(/^[(“"‘']/, ""));
  const sym = i => !/[\p{L}\p{N}]/u.test(tk[i]);
  for (let i = 0; i < n - 1; i++) {
    if (/^[·–—:.,;!?)…]+$/.test(tk[i + 1])) { j[i] = 2; continue; }                 // dấu câu đứng riêng bám chữ trước
    if (/^[=→+(/]$/.test(tk[i])) { j[i] = 3; continue; }                              // "= b", "→ b" đi cùng nhau
    if (/^[=+]$/.test(tk[i + 1]) && tk[i].length <= 4 && !vEnd(tk[i])) { j[i] = 2; continue; } // 45 = forty-five, in + tháng
    if (/^-[a-z]{1,4}[.,;:)]?$/.test(tk[i + 1])) { j[i] = 2; continue; }                 // thêm -s, đuôi -ing
    if (/^\((?:n|v|adj|adv|prep|conj)\)[.,;:]?$/.test(tk[i + 1])) { j[i] = 3; continue; }
    if (vEnd(tk[i])) continue;
    // "biết tiếng Anh", "học tiếng Việt": tên ngôn ngữ đi liền, không để chữ đứng trước giành mất "tiếng"
    if (co[i + 1] === "tiếng" && i + 2 < n && /^(anh|việt|pháp|trung|nhật|hàn|đức)$/.test(co[i + 2])) continue;
    // không nối thành chuỗi: chữ đã nối với chữ trước thì không nối tiếp với chữ sau
    if (i > 0 && j[i - 1] && !sym(i - 1)) continue;
    if (VWORDS.has(co[i] + " " + co[i + 1]) || (num(i) && VUNIT.has(co[i + 1])) || (VLBL.test(tk[i]) && /^\d/.test(tk[i + 1]))) j[i] = 3;
  }
  max = Math.min(max || 18, 18);
  for (let guard = 0; guard < 40; guard++) {
    let s = 0, best = null;
    while (s < n) { let e = s; while (e < n - 1 && j[e]) e++; const len = tk.slice(s, e + 1).join(" ").length; if (e > s && len > max) { const mid = (s + e) / 2; let bk = null; for (let k = s; k < e; k++) if (bk === null || j[k] < j[bk] || (j[k] === j[bk] && Math.abs(k - mid) < Math.abs(bk - mid))) bk = k; best = bk; break; } s = e + 1; }
    if (best === null) break; j[best] = 0;
  }
  let out = tk[0]; for (let i = 1; i < n; i++) out += (j[i - 1] ? NBS : " ") + tk[i];
  return lead + out + trail;
}
/* Tiêu đề, câu ví dụ tiếng Anh: chỉ giữ 2 chữ cuối đi cùng nhau (câu ngắn ≤ 32 ký tự thì không ngắt) */
function glueEnTail(t, short, tail) {
  const s = t.trim(); if (!s || VI_CH.test(s)) return t;
  if (short && s.length <= 18) return t.replace(/ +(?=\S)/g, (m, o) => o > 0 && o < t.trimEnd().length ? NBS : m);
  // dấu câu / ký hiệu đứng riêng bám vào chữ bên cạnh; 2 chữ cuối đi cùng nhau
  let u = t.replace(/(\S) +(?=[.,;:!?)…]+(\s|$))/g, "$1" + NBS).replace(/([=→]) +(?=\S)/g, "$1" + NBS).replace(/(^|\s)([+=(]) +(?=\S)/g, "$1$2" + NBS).replace(/(\S) +(?=\((?:n|v|adj|adv|prep|conj)\))/g, "$1" + NBS);
  if (tail !== false) { const e = u.trimEnd(), k = e.lastIndexOf(" "); if (k > 0 && e.split(/\s+/).length >= 3 && e.length - k <= 14 && !/[=→]/.test(e.slice(k - 2, k + 2))) u = u.slice(0, k) + NBS + u.slice(k + 1); }
  return u;
}
const KT_SKIP = "textarea,input,select,script,style,[contenteditable],.etoks,.chips,.kws,.passage,.annot,.diff,code,pre,.chip";
const KT_NARROW = ".bdg,.stats,.quick,.loop,.chart,.gstats,.stall,.plot,.stop,.cgrid,.mcard,#nav,.pill,.tag,.streak", KT_TINY = ".bdg,.stall,.plot,.stop,.cgrid,.mcard,.gstats";
const KT_DONE = new WeakSet();
function ktTail(n) {
  let x = n;
  for (let d = 0; x && d < 6; d++) {
    let s = x.nextSibling; while (s && ((s.nodeType === 3 && !s.nodeValue.trim()) || (s.nodeType === 1 && (s.matches("i.ti,.sep") && !s.nextSibling) ))) s = s.nextSibling;
    if (s) return s.nodeType === 1 && s.tagName === "BR";
    const p = x.parentElement; if (!p || getComputedStyle(p).display !== "inline") return true; x = p;
  }
  return true;
}
function ktText(n) {
  if (KT_DONE.has(n)) return;
  const pe = n.parentElement; if (!pe) return;
  // nội dung trong <details> đang đóng: để dành tới khi mở ra (Sổ tay › Ngữ pháp có hơn 100 mục)
  if (pe.closest("details:not([open])") && !pe.closest("summary")) return;
  KT_DONE.add(n); if (pe.closest(KT_SKIP)) return;
  let t = n.nodeValue;
  // dấu "·" thành phần tử riêng để ẩn được khi rơi vào cuối dòng
  if (/ · |^· | ·$/.test(t) && !pe.closest(".sep") && /^(inline|block|list-item|inline-block|table-cell)$/.test(getComputedStyle(pe).display)) {
    const parts = t.split(/ ?· ?/), f = document.createDocumentFragment();
    parts.forEach((x, k) => { if (k) { const sp = document.createElement("span"); sp.className = "sep"; sp.textContent = NBS + "·"; f.appendChild(sp); x = " " + x; } if (x) { const tn = document.createTextNode(x); f.appendChild(tn); } });
    const kids = [...f.childNodes]; n.replaceWith(f); kids.forEach(k => { if (k.nodeType === 3) { KT_DONE.delete(k); ktText(k); } else KT_DONE.add(k.firstChild); }); return;
  }
  let u = t;
  // "nhiều vật: <i>There are…</i>": chữ trước dấu hai chấm bám nhau, chỗ ngắt dòng rơi đúng sau dấu hai chấm
  const colon = /:\s*$/.test(t) && n.nextSibling && n.nextSibling.nodeType === 1 && /^(I|EM|B|SPAN)$/.test(n.nextSibling.tagName);
  if (VI_CH.test(t)) { const fs = parseFloat(getComputedStyle(pe).fontSize) || 16; u = glueVi(t, colon ? 3 : ktTail(n) && (pe.closest(".gram,.errlist") ? 2 : 1), pe.closest(KT_TINY) ? 10 : pe.closest(KT_NARROW) ? 13 : Math.max(12, Math.min(24, Math.floor(300 / (fs * 0.58))))); }
  else if (pe.closest(".q,.say h2,.postcard h2,.bubble p")) u = glueEnTail(t, false, true);
  else if (pe.closest(".gram,.errlist")) u = glueEnTail(t, false, false);
  // "a → b", "x = y", "V + to": ký hiệu luôn đi với vế sau (cả khi vế sau nằm trong thẻ khác)
  u = u.replace(/(^|\s)([=→+]) +(?=\S)/g, "$1$2" + NBS);
  // cặp "I–me", "he–him": không ngắt dòng ngay sau gạch nối
  if (pe.closest(".gram,.errlist,.tip")) u = u.replace(/([A-Za-z'])–(?=[A-Za-z])/g, "$1\u2060–\u2060");
  if (/[=→+] +$/.test(u) && n.nextSibling && n.nextSibling.nodeType === 1) u = u.replace(/([=→+]) +$/, "$1" + NBS);
  if (u !== t) n.nodeValue = u;
}
/* bảng ngữ pháp 3 cột: trên điện thoại (≤ 480px, xem CSS) mỗi hàng thành một thẻ. Hàng đầu là tiêu đề cột (chữ Việt, không in đậm)
   thì ẩn đi và ghi tên cột trước từng ô; cột 1 là nhãn tiếng Việt thì in đậm làm tiêu đề thẻ. Bảng toàn ô ngắn giữ nguyên dạng bảng. */
function gramTables(root) {
  const tbs = root.matches && root.matches(".gram table") ? [root] : root.querySelectorAll ? [...root.querySelectorAll(".gram table")] : [];
  tbs.forEach(tb => {
    if (tb.dataset.t3) return; tb.dataset.t3 = 1;
    const rows = [...tb.rows], nc = Math.max(0, ...rows.map(r => r.cells.length)), cells = [...tb.querySelectorAll("td")];
    if (nc < 3 || cells.every(c => c.textContent.trim().length <= 12)) return;
    tb.classList.add("t3");
    const h = rows[0], hc = [...h.cells], vi = c => VI_CH.test(c.textContent) || !c.textContent.trim();
    const hdr = rows.length > 2 && hc.every(c => !c.querySelector("b,i") && c.textContent.trim().length <= 24 && vi(c)) && rows.slice(1).some(r => [...r.cells].some(c => !VI_CH.test(c.textContent) && c.textContent.trim()));
    if (hdr) { h.classList.add("thd"); rows.slice(1).forEach(r => [...r.cells].forEach((c, i) => { const t = hc[i] && hc[i].textContent.trim(); if (t) c.dataset.h = t; })); }
    else if (rows.every(r => r.cells[0] && VI_CH.test(r.cells[0].textContent))) tb.classList.add("tlab");
    else tb.classList.add("tinl");   // không có cột nhãn: các ô của một hàng nối tiếp trên một dòng, ngăn bằng "·"
  });
}
function keepTogether(root) {
  if (root.nodeType === 3) { ktText(root); return; }
  if (root.closest && root.closest(KT_SKIP)) return;
  // đoạn ngắn (đến ~4 dòng) trong ghi chú ngữ pháp và danh sách lỗi: cân dòng; đoạn dài: tránh mồ côi
  if (root.querySelectorAll) [...(root.matches && root.matches(".gram p,.gram li,.errlist p") ? [root] : []), ...root.querySelectorAll(".gram p,.gram li,.errlist p")].forEach(e => e.classList.toggle("bal", e.textContent.length <= 150));
  gramTables(root);
  // câu ví dụ ngắn trong ghi chú ngữ pháp (≤ 28 ký tự) không bị ngắt giữa chừng: "I am / not tired."
  if (root.querySelectorAll) [...(root.matches && root.matches(".gram i,.gram .tip b") ? [root] : []), ...root.querySelectorAll(".gram i,.gram .tip b")].forEach(e => { if (!e.children.length || [...e.children].every(k => /^(B|STRONG|I|EM|U)$/.test(k.tagName))) e.classList.toggle("nw", e.textContent.trim().length <= 28 && !/\n/.test(e.textContent)); });
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = []; let n; while ((n = w.nextNode())) list.push(n);
  list.forEach(ktText);
}
/* "·" rơi vào cuối dòng thì ẩn đi (giữ nguyên bề rộng để dòng không nhảy) */
function nextRect(el) { let n = el.nextSibling; while (n) { if (n.nodeType === 3) { const m = n.nodeValue.search(/\S/); if (m >= 0) { const r = document.createRange(); r.setStart(n, m); r.setEnd(n, m + 1); const rs = r.getClientRects(); if (rs.length) return rs[0]; } } else if (n.nodeType === 1 && !n.matches(".sep")) { const rs = n.getClientRects(); if (rs.length) return rs[0]; } n = n.nextSibling; } return null; }
function fixSeps() { fixSeps.q = 0; $$(".sep").forEach(sp => { const r = sp.getClientRects()[0]; if (!r) return; const nx = nextRect(sp); sp.classList.toggle("eol", !nx || nx.top > r.top + r.height * 0.5); }); }
const queueSeps = () => { if (!fixSeps.q) { fixSeps.q = 1; requestAnimationFrame(() => requestAnimationFrame(fixSeps)); } };
/* ================= Ngắt theo cụm ý + cân dòng (chạy được cả trên Safari không có text-wrap) =================
   1) Câu mô tả được chia thành cụm ý ở ". ", ", ", ": ", "; ", " – " và trước "→"; mỗi cụm là một khối inline-block
      nên trình duyệt ngắt giữa các cụm trước. Cụm 1–2 chữ được gộp với cụm bên cạnh.
   2) phFit: nếu ngắt ở ranh giới cụm làm dòng trên quá hụt (dấu phẩy < 50%, hết câu < 30%, dấu hai chấm < 25%) thì cụm sau chảy tiếp như chữ thường.
   3) Không có text-wrap: balance (Safari < 17.5): JS tìm bề rộng nhỏ nhất giữ nguyên số dòng cho khối ngắn (≤ 4 dòng) và cho từng cụm xuống dòng. */
const NATIVE_BAL = !!(window.CSS && CSS.supports && CSS.supports("text-wrap", "balance"));
document.documentElement.classList.toggle("jsbal", !NATIVE_BAL);
const PH_SKIP = KT_SKIP + ",.passage,.btn,.opt,.stats,.chart,.cgrid,.gstats,.stall,.plot,.stop,.mcard,#nav,.pill,.tag,.timer,.seg,.ph,.quick,.loop,.xpg,.bdg,.lvn,.badge,.ring,.heard.live";
const PH_TAGS = "td";
const PH_TH = { s: .3, k: .25, a: 0, d: .4, c: .5 };
function phCuts(t) {
  const c = [], re = /([.!?…]["”’)]?\s+)|([,;]\s+)|(:\s+)|(\s[–—]\s+)|(\s+(?=→))/g; let m;
  while ((m = re.exec(t))) { const end = m.index + m[0].length; if (end >= t.length) continue; c.push([m.index + m[0].replace(/\s+$/, "").length, end, m[1] ? "s" : m[2] ? "c" : m[3] ? "k" : m[4] ? "d" : "a"]); }
  return c;
}
const phWords = x => (x.match(/[\p{L}\p{N}]+/gu) || []).length;
function phraseWrap(el) {
  if (el.dataset.ph || el.closest(PH_SKIP)) return;
  const cs = getComputedStyle(el);
  if (!/^(block|list-item|table-cell|inline-block|inline)$/.test(cs.display) || cs.whiteSpace === "nowrap") return;
  const kids = [...el.childNodes];
  if (kids.some(k => k.nodeType === 1 && !/^(inline|inline-block|inline-flex)$/.test(getComputedStyle(k).display) && k.tagName !== "BR")) return;
  const txt = el.textContent;
  if (txt.trim().length < 6 || !/→/.test(txt)) return;
  el.dataset.ph = 1;
  // tách thành các cụm
  const segs = [{ n: [], b: "" }]; let cur = segs[0];
  const close = b => { cur = { n: [], b }; segs.push(cur); };
  kids.forEach(k => {
    if (k.nodeType === 1 && k.tagName === "BR") { cur.br = 1; close("br"); cur.lead = k; return; }
    if (k.nodeType !== 3) { cur.n.push(k); return; }
    const t = k.nodeValue; let pos = 0;
    phCuts(t).forEach(([e, nx, b]) => { const piece = t.slice(pos, e); if (piece) cur.n.push(document.createTextNode(piece)); close(b); pos = nx; });
    const rest = t.slice(pos); if (rest) cur.n.push(document.createTextNode(rest));
  });
  const wc = g => phWords(g.n.map(x => x.textContent).join(" "));
  // cụm quá ngắn (1–2 chữ, không phải một câu trọn) gộp với cụm sau; cụm cuối quá ngắn gộp với cụm trước. "→ x" luôn là một cụm riêng.
  for (let i = 0; i < segs.length - 1; i++) { const a = segs[i], b = segs[i + 1]; if (b.b === "br" || b.b === "a") continue; const last = a.n.map(x => x.textContent).join("").trim(); if (wc(a) < 3 && !/[.!?…]["”’)]?$/.test(last)) { a.n.push(document.createTextNode(" "), ...b.n); a.br = b.br; segs.splice(i + 1, 1); i--; } }
  for (let i = segs.length - 1; i > 0; i--) { const a = segs[i - 1], b = segs[i]; if (b.b === "br" || b.b === "a") continue; if (wc(b) < 3 && b.n.length) { a.n.push(document.createTextNode(" "), ...b.n); a.br = b.br; segs.splice(i, 1); } }
  if (segs.filter(g => g.n.length).length < 2) { delete el.dataset.ph; return phNest(el); }
  const f = document.createDocumentFragment();
  segs.forEach((g, i) => {
    if (g.b === "br" && g.lead) f.appendChild(g.lead); else if (i) { const sp0 = document.createTextNode(" "); KT_DONE.add(sp0); f.appendChild(sp0); }
    if (!g.n.length) return;
    const sp = document.createElement("span"); sp.className = "ph"; if (g.b && g.b !== "br") sp.dataset.b = g.b;
    g.n.forEach(x => { if (x.nodeType === 3) KT_DONE.add(x); sp.appendChild(x); }); f.appendChild(sp);
  });
  KT_PH.add(el); el.textContent = ""; el.appendChild(f);
  phNest(el);
}
// câu ví dụ tiếng Anh dài trong ghi chú: ngắt sau dấu phẩy / ranh giới mệnh đề
function phNest(el) { el.querySelectorAll("i,em").forEach(x => { if (!x.dataset.ph && x.textContent.length >= 40 && /[,;:]\s/.test(x.textContent)) phraseWrap(x); }); }
const KT_PH = new WeakSet();
function contentBox(el) { const b = el.closest("p,li,td,div,summary,small,h4,#toast") || el, r = b.getBoundingClientRect(), cs = getComputedStyle(b); const l = r.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth); return { l, w: r.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth) - l }; }
const lastRect = el => { const rs = el.getClientRects(); let r = null; [...rs].forEach(x => { if (x.width && (!r || x.bottom > r.bottom + 1 || (Math.abs(x.bottom - r.bottom) <= 1 && x.right > r.right))) r = x; }); const rg = document.createRange(); rg.selectNodeContents(el); [...rg.getClientRects()].forEach(x => { if (x.width && (!r || x.bottom > r.bottom + 1 || (Math.abs(x.bottom - r.bottom) <= 1 && x.right > r.right))) r = x; }); return r; };
function phFit(el) {
  const ps = [...el.children].filter(c => c.classList.contains("ph"));
  ps.forEach(p => { p.classList.remove("pi"); p.style.maxWidth = ""; });
  const nested = getComputedStyle(el).display === "inline";
  if (ps.length < (nested ? 1 : 2)) return;
  const box = contentBox(el); if (!box.w) return;
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i]; let prev = p.previousElementSibling;
    if (i === 0) { if (!nested) continue; let q = el.previousSibling; while (q && q.nodeType === 3 && !q.nodeValue.trim()) q = q.previousSibling; prev = q && (q.nodeType === 1 ? q : (() => { const sp = document.createRange(); sp.selectNodeContents(q); return { getClientRects: () => sp.getClientRects() }; })()); if (!prev) continue; }
    else if (!prev || !prev.classList.contains("ph")) continue;
    const a = prev.nodeType === 1 ? lastRect(prev) : [...prev.getClientRects()].filter(x => x.width).pop(), b = p.getBoundingClientRect(); if (!a || !b.width) continue;
    if (b.top >= a.bottom - 2) {
      const fill = (a.right - box.l) / box.w; if (fill < (PH_TH[p.dataset.b] ?? .5)) { p.classList.add("pi"); continue; }
      // cụm sau tự xuống nhiều dòng: nếu cho chảy tiếp mà khối bớt được một dòng thì chọn cách đó
      if (b.height > parseFloat(getComputedStyle(p).lineHeight) * 1.5) { const blk = el.closest("p,li,td,div,summary,small,h4,#toast") || el, h0 = blk.getBoundingClientRect().height; p.classList.add("pi"); if (blk.getBoundingClientRect().height > h0 - 2) p.classList.remove("pi"); }
    }
  }
}
function balBox(el, maxL) {
  if (!el.classList.contains("ph") && el.id !== "toast") return balPad(el, maxL);
  el.style.maxWidth = ""; el.classList.remove("balc");
  const cs = getComputedStyle(el); if (/flex|grid|^inline$|none/.test(cs.display) || cs.whiteSpace === "nowrap") return;
  const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
  const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.45;
  const inner = r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth);
  const lines = Math.round(inner / lh); if (lines < 2 || lines > maxL) return;
  const h0 = r.height, rg = document.createRange(), ok = w => { el.style.maxWidth = w + "px"; const b = el.getBoundingClientRect(); if (b.height > h0 + 0.5 || el.scrollWidth > el.clientWidth + 1) return false; rg.selectNodeContents(el); return [...rg.getClientRects()].every(x => !x.width || (x.left >= b.left - 1 && x.right <= b.right + 1)); };
  let lo = r.width * (lines === 2 ? 0.45 : 0.6), hi = r.width;
  if (ok(lo)) hi = lo; else for (let k = 0; k < 8 && hi - lo > 2; k++) { const m = (lo + hi) / 2; if (ok(m)) hi = m; else lo = m; }
  if (hi >= r.width - 1) { el.style.maxWidth = ""; return; }
  el.style.maxWidth = Math.ceil(hi + 1) + "px";
  if (cs.textAlign === "center" && cs.display !== "inline-block" && cs.display !== "table-cell") el.classList.add("balc");
}
/* khối thường: thu hẹp vùng chữ bằng padding (hộp, nền, viền giữ nguyên kích thước) */
function balPad(el, maxL) {
  const o = el.dataset.bp; if (o) { const [l, r] = o.split(","); el.style.paddingLeft = l; el.style.paddingRight = r; delete el.dataset.bp; }
  const cs = getComputedStyle(el); if (/grid|^inline$|none/.test(cs.display) || cs.whiteSpace === "nowrap") return;
  if (/flex/.test(cs.display) && [...el.children].some(k => !k.matches("i.ti,svg,.k,br") && !/^inline/.test(getComputedStyle(k).display) && !(cs.flexDirection === "row" && k.matches("span,b,small") && !k.children.length && false))) return;
  const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
  const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.45, pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight);
  const inner = r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth);
  const lines = Math.round(inner / lh); if (lines < 2 || lines > maxL) return;
  el.style.transition = "none";
  const cw = el.clientWidth - pl - pr, ctr = cs.textAlign === "center", h0 = r.height;
  const rg = document.createRange();
  const w0 = r.width, dw0 = document.documentElement.scrollWidth;
  // không bao giờ làm khối rộng ra (ô lưới, cột co theo nội dung) hay làm cả trang rộng hơn màn hình
  const ok = d => { if (ctr) { el.style.paddingLeft = pl + d / 2 + "px"; el.style.paddingRight = pr + d / 2 + "px"; } else el.style.paddingRight = pr + d + "px"; const bb = el.getBoundingClientRect(); if (bb.height > h0 + 0.5 || bb.width > w0 + 0.5 || document.documentElement.scrollWidth > dw0) return false;
    // không chữ nào tràn sang phần đệm vừa thêm
    const b = el.getBoundingClientRect(), L = b.left + parseFloat(el.style.paddingLeft || pl) - 1, R = b.right - parseFloat(el.style.paddingRight) + 1; rg.selectNodeContents(el); return [...rg.getClientRects()].every(x => !x.width || (x.left >= L && x.right <= R)); };
  el.dataset.bp = el.style.paddingLeft + "," + el.style.paddingRight;
  let lo = 0, hi = cw * (lines === 2 ? 0.55 : 0.4);
  if (!ok(lo)) { el.style.transition = ""; el.style.paddingLeft = el.dataset.bp.split(",")[0]; el.style.paddingRight = el.dataset.bp.split(",")[1]; delete el.dataset.bp; return; }
  if (ok(hi)) lo = hi; else for (let k = 0; k < 8 && hi - lo > 2; k++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
  ok(Math.floor(lo)); el.style.transition = "";
}
const BAL_FORCE = "#app button,b.grow,.q,.say h2,.ph,.link,.link>span,.fbm,.lab,.btn,.opt,.gtitle,summary,.task b,.topic b,.choice b,.gcard b,.chip,.etok";
const BAL_SEL = BAL_FORCE + ",.sw small,h1,h2,h3,h4,p,li,small,summary,.lab,.vi,.q,.note,.gcard b,.choice b,.task b,.bdg span,.heard,.topic b,.les .grow b,.why>span,.say h2,.ph,.capn>span";
const BAL_SKIP = ".bdg,.q.gq,.passage,textarea,.etoks,.chips,.kws,.annot,.diff,.stats,.chart,.cgrid,.gstats,.stall,.plot,.stop,.mcard,#nav,.timer,.ring,.seg,.xpg";
function layoutText(root) {
  if (!root || !root.isConnected) return;
  const els = root.nodeType === 1 ? [root, ...root.querySelectorAll("*")] : [];
  els.forEach(e => { if (e.dataset && e.dataset.ph && KT_PH.has(e)) phFit(e); });
  // bảng "a → b": nếu có ô phải xuống dòng trước "→" thì cả bảng xuống dòng trước "→" cho đồng đều
  (root.closest && root.closest("table") ? [root.closest("table")] : []).concat(root.querySelectorAll ? [...root.querySelectorAll("table")] : []).forEach(tb => {
    tb.classList.remove("arrbr"); const ar = [...tb.querySelectorAll('.ph[data-b="a"]')]; if (!ar.length) return;
    if (ar.some(p => { const pv = p.previousElementSibling; return pv && p.getBoundingClientRect().top >= lastRect(pv).bottom - 2; })) tb.classList.add("arrbr");
  });
  // khung quá hẹp (phóng chữ 160%, cột hẹp): cụm nối bằng dấu cách không ngắt mà rộng hơn khung thì tháo nối
  els.forEach(e => { if (!e.firstChild || e.closest(".chips2,.stop,.plot,.mem,.stall,#nav,.nw,.pill,.xpg,.timer")) return; if (![...e.childNodes].some(k => k.nodeType === 3 && k.nodeValue.includes(NBS))) return; if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0 && getComputedStyle(e).whiteSpace !== "nowrap") e.childNodes.forEach(k => { if (k.nodeType === 3 && k.nodeValue.includes(NBS)) k.nodeValue = k.nodeValue.replace(/\u00a0/g, " "); }); });
  // khối tiếng Anh: lang="en" để Safari ngắt âm tiết (gạch nối) khi căn đều, không để khoảng trắng quá rộng
  els.forEach(e => { if (e.matches && !e.hasAttribute("lang") && e.matches(EN_SEL) && /[a-z]{2}/i.test(e.textContent) && !VI_CH.test(e.textContent)) e.setAttribute("lang", "en"); });
  // đoạn văn căn trái → căn đều hai bên (dòng cuối căn trái), như văn bản hành chính
  els.forEach(jusMark);
  jusCheck(els);
  if (!NATIVE_BAL) els.filter(e => e.matches && e.matches(BAL_SEL) && !e.classList.contains("jus") && !e.closest(BAL_SKIP) && (/^H[1-4]$/.test(e.tagName) || e.matches(BAL_FORCE) || getComputedStyle(e).textAlign === "center")).forEach(e => {
    if (e.classList.contains("ph")) { if (e.classList.contains("pi")) return; const nx = e.nextElementSibling, t0 = nx && nx.getBoundingClientRect().top; balBox(e, 6); if (nx && nx.getBoundingClientRect().top < t0 - 1) e.style.maxWidth = ""; }
    else balBox(e, 4);
  });
}
const EN_SEL = ".passage,.passage p,.rq>p,.model,.say h2,.bubble p,h2.q:not(.vi),.opt,.ax-para,.ax-cz,.ax-b p,.postcard p";
const JUS_SKIP = ".fbt,.btn,.opt,.chip,.lab,.tag,.pill,h1,h2,h3,h4,#nav,input,textarea,select,.stats,.chart,.cgrid,.gstats,.stall,.plot,.stop,.mcard,.timer,.seg,.etoks,.chips,.kws,.diff,.ptop,.xpg,.bdg,.badge,.ring,.lvn,.streak,.quick,.loop,.ptitle,.skrow,.crit,.memleg,.geleg,.road,label,.cert,.heard.live,.errtip .g,.les .grow,.topic small,.glv p,.gcard small,.goals li,.gram table.t3 td,.iostip,.ax-cz";
/* căn đều mà khoảng trắng giữa chữ quá 2,3 lần bình thường (khung hẹp, chữ Anh dài) thì trả về căn trái */
let JCV;
function jusGap(e) {
  const cs = getComputedStyle(e); JCV = JCV || document.createElement("canvas").getContext("2d"); JCV.font = cs.font; const sc = e.offsetWidth ? e.getBoundingClientRect().width / e.offsetWidth : 1, sp = (JCV.measureText(" ").width || 4) * (sc || 1);
  // các "món" trên dòng theo thứ tự: từng chữ, và nguyên khối cho phần tử inline-block (nút loa, biểu tượng, ô trống)
  const items = [], rg = document.createRange();
  const walk = n => { n.childNodes.forEach(k => { if (k.nodeType === 3) { const re = /[^\s]+/g, v = k.nodeValue; let m; while ((m = re.exec(v))) { rg.setStart(k, m.index); rg.setEnd(k, m.index + m[0].length); const rs = rg.getClientRects(); if (rs.length) items.push([rs[0], rs[rs.length - 1]]); } } else if (k.nodeType === 1) { const d = getComputedStyle(k).display; if (d === "none") return; if (d !== "inline" || k.matches("i.ti,svg,img,button")) { const r = k.getBoundingClientRect(); if (r.width) items.push([r, r]); } else walk(k); } }); };
  walk(e); if (items.length < 2) return 0;
  const lastTop = items[items.length - 1][1].top; let worst = 0;
  for (let i = 1; i < items.length; i++) { const a = items[i - 1][1], b = items[i][0]; if (Math.abs(b.top - a.top) < Math.min(a.height, b.height) * 0.6 && Math.abs(b.top - lastTop) > 2 && b.left > a.right) worst = Math.max(worst, (b.left - a.right) / sp); }
  return worst;
}
function jusCheck(els) { els.forEach(e => { if (!e.classList || !e.classList.contains("jus")) return; e.classList.remove("jusno");
  const multi = () => e.getClientRects().length && e.getBoundingClientRect().height > parseFloat(getComputedStyle(e).lineHeight) * 1.5;
  const ex = e.dataset.exb ? e.querySelector(".exb") : null; if (ex) ex.classList.remove("exb");
  const last = [...e.childNodes].filter(k => k.nodeType === 1 || k.nodeValue.trim()).pop();
  const labEx = last && last.nodeType === 1 && /^(I|EM)$/.test(last.tagName) && /:\s*$/.test((last.previousSibling && last.previousSibling.textContent) || "");
  // ghi chú ngữ pháp: "Nhãn: <i>ví dụ</i>" mà không vừa một dòng thì ví dụ luôn xuống dòng riêng (mọi dòng như nhau)
  if (labEx && e.closest(".gram") && multi()) { last.classList.add("exb"); e.dataset.exb = 1; }
  if (!multi() || jusGap(e) <= 2.5) return;
  // đoạn dài (từ 4 dòng): một dòng hơi thưa vẫn tốt hơn cả đoạn lởm chởm, chỉ bỏ căn đều khi khoảng trắng quá 3,2 lần
  const nLines = () => { const c = getComputedStyle(e); return Math.round((e.getBoundingClientRect().height - parseFloat(c.paddingTop) - parseFloat(c.paddingBottom) - parseFloat(c.borderTopWidth) - parseFloat(c.borderBottomWidth)) / (parseFloat(c.lineHeight) || 24)); }, longOk = () => nLines() >= 3 && jusGap(e) <= 3;
  // "Nhãn: <i>câu ví dụ</i>" không căn đều được: đưa câu ví dụ xuống dòng riêng (căn trái), như ví dụ trong sách
  if (labEx && !last.classList.contains("exb")) { last.classList.add("exb"); e.dataset.exb = 1; if (!multi() || jusGap(e) <= 2.5) return; }
  // còn hở: tháo bớt dấu cách không ngắt của từ ghép trong đoạn này để có thêm chỗ xuống dòng (giữ "→ b", "= b", dấu câu)
  if (!e.dataset.ug) { e.dataset.ug = 1; const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let t; while ((t = tw.nextNode())) if (t.nodeValue.includes(NBS)) t.nodeValue = t.nodeValue.replace(/(?<![=→+(/\d])\u00a0(?![·–—:.,;!?)…\d])/g, " "); if (jusGap(e) <= 2.5) return; }
  // vẫn hở: cho câu ví dụ ngắn (đang giữ liền một dòng) được xuống dòng giữa chừng, để cả đoạn căn đều được
  if (!e.dataset.unw) { const ws = e.querySelectorAll(".nw"); if (ws.length) { e.dataset.unw = 1; ws.forEach(w => w.classList.remove("nw")); if (jusGap(e) <= 2.5) return; } }
  // đoạn văn thật (từ 3 dòng) luôn căn đều như văn bản hành chính; ghi chú 1–2 dòng hở quá thì căn trái, cân dòng
  if (nLines() >= 3 && jusGap(e) <= 4.2) return;
  if (longOk()) return;
  e.classList.add("jusno"); }); }
function jusMark(e) {
  if (!e || e.nodeType !== 1 || e.classList.contains("jus") || !e.matches("p,li,small,div,span,dd,summary,b.sent,td,section,.vi") || e.closest(JUS_SKIP)) return;
  const cs = getComputedStyle(e);
  if (!/^(block|list-item|table-cell|flex)$/.test(cs.display) || !/^(start|left|justify|-webkit-left)$/.test(cs.textAlign) || cs.whiteSpace === "nowrap") return;
  if (cs.display === "flex" && cs.flexDirection !== "row") return;
  if (cs.display === "table-cell" && e.textContent.trim().length <= 16 && !e.querySelector("br")) { e.style.whiteSpace = "nowrap"; return; }   // ô bảng ngắn (You / We / They) không xuống dòng
  if (!e.textContent.trim() || ![...e.childNodes].some(k => (k.nodeType === 3 && k.nodeValue.trim()) || (k.nodeType === 1 && !k.matches("i.ti") && k.textContent.trim()))) return;
  if ([...e.children].some(k => k.tagName !== "BR" && !k.matches("i.ti,svg") && !/^inline/.test(getComputedStyle(k).display))) return;
  if (cs.display === "flex" && ![...e.childNodes].some(k => k.nodeType === 3 && k.nodeValue.trim())) return;
  if (e.textContent.trim().length < (cs.display === "table-cell" ? 40 : 24)) return;
  if (e.querySelectorAll(".sep").length >= 2 && e.textContent.length < 120) return;   // danh sách ngăn bằng "·", không phải đoạn văn
  e.classList.add("jus");
}
const LT = { roots: new Set(), q: 0 };
function queueLayout(r) { LT.roots.add(r); if (!LT.q) { LT.q = 1; requestAnimationFrame(() => { LT.q = 0; const rs = [...LT.roots]; LT.roots.clear(); rs.filter(r => r.isConnected && !rs.some(o => o !== r && o.contains(r))).forEach(r => { try { r.querySelectorAll && [r, ...r.querySelectorAll(PH_TAGS)].forEach(e => e.matches && e.matches(PH_TAGS) && phraseWrap(e)); layoutText(r); } catch (e) {} }); fixSeps(); if (typeof toastFit === "function" && rs.some(r => r.closest && r.closest("#toast"))) toastFit();
    // sau hiệu ứng xuất hiện (phóng to, trượt) đo lại khoảng trắng của đoạn căn đều
    setTimeout(() => rs.forEach(r => { if (r.isConnected && r.querySelectorAll) jusCheck([r, ...r.querySelectorAll(".jus")]); }), 650); }); } }
function relayoutAll() { ["#app", "#toast", ".modal", ".fb"].forEach(s => $$(s).forEach(e => { layoutText(e); })); fixSeps(); }
new MutationObserver(ms => { ms.forEach(m => m.addedNodes.forEach(x => { if (x.nodeType === 1 || (x.nodeType === 3 && x.parentNode)) { keepTogether(x); const r = x.nodeType === 1 ? x : x.parentElement; if (r && !r.closest(".timer,#timer,.ph,#micLive")) queueLayout(r.closest("p,li,td,small,div,summary,h1,h2,h3,h4,#toast") || r); } })); queueSeps(); }).observe(document.documentElement, { childList: true, subtree: true });
let rsT; window.addEventListener("resize", () => { clearTimeout(rsT); rsT = setTimeout(relayoutAll, 150); });
window.addEventListener("resize", queueSeps); addEventListener("beforeprint", () => $$(".sep.eol").forEach(x => x.classList.remove("eol"))); addEventListener("afterprint", queueSeps); document.addEventListener("toggle", e => { if (e.target.open) { keepTogether(e.target); queueLayout(e.target); } queueSeps(); }, true); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { relayoutAll(); });
document.addEventListener("DOMContentLoaded", render);
