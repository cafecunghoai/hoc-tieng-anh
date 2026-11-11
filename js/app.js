"use strict";
/* ================== Tiếng Anh Từ Số 0 ================== */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const app = () => $("#app");
const DAY = 86400000, INT = [0, 1, 2, 4, 7, 15, 30, 60], KEY = "hoc_tieng_anh_v1";
const SK = { vocab: "Từ vựng", listen: "Nghe", speak: "Nói", read: "Đọc", write: "Viết" };
const SKI = { vocab: "cards", listen: "headphones", speak: "microphone", read: "book", write: "pencil" };

/* ---------- Dữ liệu bài học ---------- */
const LES = {}, ORDER = [];
STAGES.forEach(st => st.lessons.forEach((L, i) => {
  L.id = st.id + "-" + (i + 1); L.stage = st.id; L.no = i + 1;
  L.W = L.w.split(";").map(x => { const p = x.split("="); return { en: p[0].trim(), vi: (p[1] || "").trim(), ipa: (p[2] || "").trim() }; });
  L.S = (L.s || []).map(x => { const p = x.split("|"); return { en: p[0], vi: p[1] }; });
  if (typeof WRITING !== "undefined" && WRITING[L.id]) { const w = WRITING[L.id]; L.WR = { p: w[0], kw: w[1].split(";"), min: w[2], model: w[3] }; }
  LES[L.id] = L; ORDER.push(L.id);
}));
const ALLW = [], WMAP = {};
ORDER.forEach(id => { const L = LES[id]; if (L.kind !== "letters") L.W.forEach(w => { if (!WMAP[w.en]) { WMAP[w.en] = Object.assign({ lid: id }, w); ALLW.push(WMAP[w.en]); } }); });
const stageOf = id => STAGES.find(s => s.id === id);
const VIMAP = {}; ALLW.forEach(w => (VIMAP[w.vi] = VIMAP[w.vi] || new Set()).add(w.en));
{ const seen = new Set(); STAGES.forEach(st => { st.lessons.forEach(L => { if (L.kind !== "letters") L.W.forEach(w => seen.add(w.en)); }); if (st.lessons.length) st.words = "~" + (Math.round(seen.size / 50) * 50).toLocaleString("vi-VN") + " từ"; }); }

/* ---------- Trạng thái ---------- */
function def() {
  return { v: 2, onb: false, done: {}, unlocked: {}, cards: {}, days: {}, log: {}, stagePassed: {}, placement: null, xp: 0, badges: {},
    cnt: { speak: 0, write: 0, review: 0, perfect: 0 }, skill: {}, mistakes: {}, resume: null, dayDone: {}, hideInstall: false, game: { best: {}, post: {}, plays: 0 },
    settings: { rate: 0.9, accent: "en-US", goal: 60, theme: "auto", sound: true } };
}
function merge(x) { const d = def(); Object.keys(d).forEach(k => { if (x[k] !== undefined) d[k] = (typeof d[k] === "object" && d[k] && !Array.isArray(d[k]) && k !== "resume") ? Object.assign(d[k], x[k]) : x[k]; }); if (Object.keys(d.done).length) d.onb = true; return d; }
function load() { try { const x = JSON.parse(localStorage.getItem(KEY)); if (x && x.done) return merge(x); } catch (e) {} return def(); }
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ---------- Tiện ích ---------- */
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const jsq = s => esc(String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, " "));
const dkey = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const today = () => dkey(new Date());
const plural = (n, w) => n + " " + w;
function toast(m, ms) { const t = $("#toast"); t.innerHTML = m; t.classList.add("on"); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), ms || 2800); }
function opts(correct, pool) { const others = shuffle([...new Set(pool.filter(x => x && x !== correct))]).slice(0, 3); const o = shuffle([correct, ...others]); return { o, a: o.indexOf(correct) }; }
const CONTR = { "i'm": "i am", "you're": "you are", "he's": "he is", "she's": "she is", "it's": "it is", "we're": "we are", "they're": "they are", "don't": "do not", "doesn't": "does not", "didn't": "did not", "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not", "can't": "can not", "cannot": "can not", "couldn't": "could not", "i'd": "i would", "i'll": "i will", "you'll": "you will", "we'll": "we will", "it'll": "it will", "i've": "i have", "you've": "you have", "we've": "we have", "they've": "they have", "haven't": "have not", "hasn't": "has not", "what's": "what is", "that's": "that is", "there's": "there is", "where's": "where is", "let's": "let us", "shouldn't": "should not", "won't": "will not", "you'd": "you would", "mustn't": "must not",
  im: "i am", youre: "you are", dont: "do not", doesnt: "does not", didnt: "did not", isnt: "is not", arent: "are not", wasnt: "was not", werent: "were not", cant: "can not", whats: "what is", thats: "that is", theres: "there is", wheres: "where is", shouldnt: "should not", its: "it is", ive: "i have", havent: "have not", hasnt: "has not", couldnt: "could not", mustnt: "must not" };
const NUMS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const UKUS = { colour: "color", colours: "colors", favourite: "favorite", neighbour: "neighbor", neighbours: "neighbors", neighbourhood: "neighborhood", centre: "center", theatre: "theater", behaviour: "behavior", humour: "humor", honour: "honor", flavour: "flavor", harbour: "harbor", labour: "labor", programme: "program", grey: "gray", metre: "meter", litre: "liter", analyse: "analyze", catalogue: "catalog", practise: "practice", practising: "practicing", practised: "practiced", travelled: "traveled", travelling: "traveling", traveller: "traveler", travellers: "travelers", cancelled: "canceled", cancelling: "canceling", jewellery: "jewelry", tyre: "tire", pyjamas: "pajamas", mum: "mom" };
function usSpell(w) { if (UKUS[w]) return UKUS[w]; const m = w.match(/^(.*[a-z]{3})is(e|es|ed|ing|ation|ations)$/); if (m && /(real|organ|apolog|recogn|critic|summar|priorit|modern|special|minim|maxim|memor|final|util|custom|standard|categor|emphas|symbol|visual|global|urban|moral|author|harmon|optim|central|civil|fertil|stabil|sympath)$/.test(m[1])) return m[1] + "iz" + m[2]; return w; }
function norm(s) {
  s = String(s).toLowerCase().replace(/[’‘`]/g, "'"); s = s.replace(/[a-z']+/g, w => CONTR[w] || w);
  s = s.replace(/'/g, "").replace(/[^a-z0-9\s-]/g, " ");
  s = s.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-](one|two|three|four|five|six|seven|eight|nine)\b/g, (m, a, b) => String(NUMS[a] + NUMS[b]));
  s = s.replace(/-/g, " ").replace(/\b[a-z]+\b/g, w => NUMS[w] !== undefined ? String(NUMS[w]) : usSpell(w));
  return s.replace(/\s+/g, " ").trim();
}
function lev(a, b) { const m = a.length, n = b.length; if (!m) return n; if (!n) return m; let p = Array(n + 1).fill(0).map((_, i) => i); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
function compare(input, target) { const a = norm(input), b = norm(target); if (a === b) return 2; return lev(a, b) <= Math.max(1, Math.round(b.length * 0.08)) ? 1 : 0; }
function lcsWords(a, b) { const m = a.length, n = b.length, t = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0)); for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) t[i][j] = a[i - 1] === b[j - 1] ? t[i - 1][j - 1] + 1 : Math.max(t[i - 1][j], t[i][j - 1]); return t[m][n]; }
function speakScore(target, heard) { const a = norm(target).split(" "), b = norm(heard).split(" "); return Math.round(lcsWords(a, b) / a.length * 100); }
function diffWords(target, heard) { const h = new Set(norm(heard).split(" ")); return target.split(" ").map(w => h.has(norm(w)) ? `<span class="okw">${esc(w)}</span>` : `<span class="badw">${esc(w)}</span>`).join(" "); }

/* ---------- Âm thanh ---------- */
let voices = [];
function loadV() { try { voices = speechSynthesis.getVoices(); } catch (e) {} }
if ("speechSynthesis" in window) { loadV(); try { speechSynthesis.onvoiceschanged = loadV; } catch (e) {} }
function say(t, slow) {
  if (!("speechSynthesis" in window)) { toast("Thiết bị này chưa hỗ trợ giọng đọc tiếng Anh"); return; }
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t), acc = S.settings.accent; u.lang = acc;
    const cand = voices.filter(v => v.lang.replace("_", "-") === acc);
    const v = cand.find(v => /Google|Natural|Samantha|Daniel|Aria|Jenny/i.test(v.name)) || cand[0] || voices.find(v => v.lang.toLowerCase().startsWith("en"));
    if (v) u.voice = v;
    u.rate = slow ? 0.62 : S.settings.rate; speechSynthesis.speak(u);
  } catch (e) { toast("Không phát được âm thanh"); }
}
let AC = null;
function beep(kind) {
  if (!S.settings.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const seq = { good: [[660, 0], [880, .09]], bad: [[220, 0], [180, .12]], done: [[523, 0], [659, .1], [784, .2], [1047, .3]] }[kind];
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
function listenMic(onres, onerr) {
  if (!SR || micBlocked) { onerr("none"); return; }
  let r; try { r = new SR(); } catch (e) { onerr("none"); return; }
  r.lang = S.settings.accent; r.interimResults = false; r.maxAlternatives = 3;
  let got = false;
  r.onresult = e => { got = true; onres([...e.results[0]].map(a => a.transcript)); };
  r.onerror = e => { got = true; if (e.error === "not-allowed" || e.error === "service-not-allowed") micBlocked = true; onerr(e.error); };
  r.onend = () => { if (!got) onerr("no-speech"); };
  try { r.start(); } catch (e) { onerr("none"); }
}

function checkVoice() {
  if (S.voiceWarned) return;
  const warn = m => { S.voiceWarned = 1; save(); modal("Chưa nghe được giọng đọc?", m, "Đã hiểu", () => {}, false, "Đóng"); };
  if (!("speechSynthesis" in window)) return warn("Trình duyệt này chưa hỗ trợ đọc tiếng Anh. Hãy mở app bằng <b>Chrome</b> (Android, máy tính) hoặc <b>Safari</b> (iPhone).");
  loadV(); if (voices.length && !voices.some(v => v.lang.toLowerCase().startsWith("en"))) warn("Máy của bạn chưa có giọng tiếng Anh.<br>1. Mở <b>Cài đặt</b> → <b>Ngôn ngữ</b>.<br>2. Chọn <b>Chuyển văn bản thành giọng nói</b>.<br>3. Tải thêm giọng <b>English</b>.");
}

/* ---------- Thời gian, XP, cấp độ ---------- */
let last = Date.now();
function lg() { const k = today(); return S.log[k] || (S.log[k] = { lessons: 0, xp: 0 }); }
function tick() { const now = Date.now(); const s = Math.min((now - last) / 1000, 180); last = now; const k = today(); S.days[k] = (S.days[k] || 0) + s; save(); }
const minutesToday = () => Math.round((S.days[today()] || 0) / 60);
function streak() { let n = 0; const d = new Date(); if (!(S.days[dkey(d)] > 30)) d.setDate(d.getDate() - 1); while (S.days[dkey(d)] > 30) { n++; d.setDate(d.getDate() - 1); } return n; }
const totalHours = () => Object.values(S.days).reduce((a, b) => a + b, 0) / 3600;
function addXP(n) { S.xp += n; lg().xp += n; save(); }
function levelOf(xp) { let n = 1; while (50 * n * (n + 1) <= xp) n++; const lo = 50 * n * (n - 1), hi = 50 * n * (n + 1); return { n, pct: Math.round((xp - lo) / (hi - lo) * 100), need: hi - xp }; }
function levelName(n) { return n < 5 ? "Mầm non" : n < 10 ? "Người học chăm" : n < 15 ? "Người nói tự tin" : n < 20 ? "Người dùng độc lập" : "Bậc thầy"; }
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
  ["day", "calendar-check", "Ngày trọn vẹn", "Hoàn thành kế hoạch một ngày", () => Object.keys(S.dayDone).length >= 1]
];
function checkBadges() { let got = []; BADGES.forEach(b => { if (!S.badges[b[0]] && b[4]()) { S.badges[b[0]] = Date.now(); got.push(b); } }); if (got.length) { save(); setTimeout(() => { toast(`<b>Huy hiệu mới:</b> ${got.map(b => b[2]).join(", ")}`, 3600); confetti(); beep("done"); }, 600); } }

/* ---------- Mở khóa, kế hoạch ---------- */
const passed = id => S.done[id] && S.done[id].best >= 80;
function isOpen(id) { const L = LES[id]; if (!L || stageOf(L.stage).locked) return false; if (S.unlocked[id]) return true; const i = ORDER.indexOf(id); if (i === 0) return true; const prev = ORDER[i - 1]; return passed(prev) || !!S.stagePassed[LES[prev].stage] || !!S.stagePassed[L.stage]; }
const nextLesson = () => ORDER.find(id => isOpen(id) && !passed(id)) || null;
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
function checkDay() { const p = plan(); if (p.every(x => x.ok) && !S.dayDone[today()]) { S.dayDone[today()] = 1; addXP(50); save(); setTimeout(() => { toast("<b>Hoàn thành kế hoạch hôm nay!</b> +50 XP", 3400); confetti(); beep("done"); }, 900); } }
function goNext() { const n = nextLesson(); if (n) openIntro(n); else nav("road"); }

/* ---------- Điều hướng ---------- */
let TAB = "home", P = null, VIEW = null, OB = 0;
function nav(t) { TAB = t; P = null; VIEW = null; render(); window.scrollTo(0, 0); }
function render() {
  applyTheme();
  const inPlayer = !!P || !!VIEW || !S.onb;
  document.body.classList.toggle("playing", inPlayer);
  $$("#nav button").forEach(b => b.classList.toggle("on", b.dataset.t === (TAB === "book" ? "review" : TAB)));
  if (!S.onb && !P) return vOnb();
  if (P) return showStep();
  if (VIEW) return VIEW();
  ({ home: vHome, road: vRoad, play: vPlay, review: vReview, book: vBook, me: vMe })[TAB]();
}
function applyTheme() { const t = S.settings.theme; const dark = t === "dark" || (t === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches); document.documentElement.dataset.theme = dark ? "dark" : "light"; }

/* ---------- Chào mừng ---------- */
function vOnb() {
  const g = S.settings.goal;
  const hero = `<svg viewBox="0 0 240 150" class="heroart" aria-hidden="true"><rect x="20" y="20" width="120" height="64" rx="18" fill="var(--pri)"/><path d="M48 84 L40 104 L68 84Z" fill="var(--pri)"/><text x="80" y="60" text-anchor="middle" font-size="26" font-weight="700" fill="#fff" font-family="inherit">Hello!</text><rect x="104" y="64" width="118" height="60" rx="18" fill="var(--acc)"/><path d="M196 124 L204 142 L178 124Z" fill="var(--acc)"/><text x="163" y="101" text-anchor="middle" font-size="21" font-weight="700" fill="#3B2603" font-family="inherit">Xin chào!</text></svg>`;
  let h = `<div class="onb">`;
  if (OB === 0) h += `${hero}<h1>Tiếng Anh từ số 0</h1><p class="lead">Lộ trình rõ ràng từ chưa biết gì đến <b>nghe, nói, đọc, viết</b> thành thạo. Mỗi ngày một chút, có máy nhắc ôn đúng lúc.</p>
    <ul class="feat"><li><i class="ti ti-route"></i><span><b>6 chặng, 116 bài</b> theo khung chuẩn châu Âu CEFR<br><span class="nw">0 → A1 → A2 → B1 → B2 → C1</span></span></li><li><i class="ti ti-microphone"></i><span><b>Luyện nói</b> có máy chấm phát âm</span></li><li><i class="ti ti-brain"></i><span><b>Ôn từ thông minh</b>: nhắc đúng lúc sắp quên</span></li><li><i class="ti ti-language"></i><span><b>Giải thích bằng tiếng Việt</b>, dễ hiểu</span></li></ul>
    <button class="btn primary full lg" onclick="OB=1;render()">Bắt đầu</button>`;
  else if (OB === 1) h += `<p class="stepn">Bước 1/2</p><h1>Mỗi ngày bạn học bao lâu?</h1><p class="muted">Đều đặn quan trọng hơn học nhiều. Bạn đổi được bất cứ lúc nào.</p><div class="choices">
    ${[[15, "Nhẹ nhàng", "coffee"], [30, "Đều đặn", "walk"], [60, "Nghiêm túc", "run"], [90, "Tăng tốc", "rocket"]].map(x => `<button class="choice ${g === x[0] ? "on" : ""}" onclick="S.settings.goal=${x[0]};save();render()"><i class="ti ti-${x[2]}"></i><span class="grow"><b>${x[0]} phút / ngày</b><small>${x[1]}${x[0] === 60 ? " · khuyên dùng" : ""}</small></span><small class="eta">B2 sau ~${etaMonths(x[0])} tháng</small></button>`).join("")}</div>
    <p class="note">Ước tính theo Cambridge: cần khoảng 500–600 giờ học có hướng dẫn để từ số 0 đạt B2.</p><button class="btn primary full lg" onclick="OB=2;render()">Tiếp tục</button>`;
  else h += `<p class="stepn">Bước 2/2</p><h1>Bạn đang ở đâu?</h1><p class="muted">Để app xếp bạn vào đúng bài.</p><div class="choices">
    <button class="choice" onclick="finishOnb('zero')"><i class="ti ti-plant"></i><span class="grow"><b>Tôi mới bắt đầu</b><small>Bắt đầu từ phát âm và bảng chữ cái</small></span><i class="ti ti-chevron-right"></i></button>
    <button class="choice" onclick="finishOnb('test')"><i class="ti ti-clipboard-check"></i><span class="grow"><b>Tôi biết một chút</b><small>Kiểm tra nhanh 22 câu, khoảng 5 phút</small></span><i class="ti ti-chevron-right"></i></button></div>
    <button class="link" onclick="OB=1;render()"><i class="ti ti-arrow-left"></i> Quay lại</button>`;
  app().innerHTML = h + `</div>`;
}
const etaMonths = g => Math.round(550 * 60 / g / 30);
function finishOnb(m) { S.onb = true; if (m === "zero") { S.placement = "zero"; save(); openIntro("s0-1"); } else { save(); startPlacement(); } }

/* ---------- Trang chủ ---------- */
function vHome() {
  const n = nextLesson(), L = n && LES[n], st = L && stageOf(L.stage), lv = levelOf(S.xp), p = plan(), pd = p.filter(x => x.ok).length;
  const hr = new Date().getHours(), hi = hr < 11 ? "Chào buổi sáng" : hr < 14 ? "Chào buổi trưa" : hr < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  const mk = Object.keys(S.mistakes).length, due = dueCards().length;
  let h = `<header class="hero"><div><p class="muted">${hi}</p><h1>Hôm nay học gì nào?</h1></div><div class="streak" title="Chuỗi ngày học"><i class="ti ti-flame"></i><b>${streak()}</b><span>ngày</span></div></header>
  <section class="card lvl" onclick="nav('me')"><div class="lvn">${lv.n}</div><div class="grow"><p class="sm muted">Cấp ${lv.n} · ${levelName(lv.n)}</p><div class="bar sm"><span style="width:${lv.pct}%"></span></div><p class="sm muted">${S.xp} XP · còn ${lv.need} XP lên cấp</p></div></section>`;
  if (installEvt && !S.hideInstall) h += `<section class="card accent row"><i class="ti ti-device-mobile bigi"></i><div class="grow"><b>Cài app lên điện thoại</b><p class="sm">Mở nhanh từ màn hình chính, học cả khi không có mạng.</p></div><button class="btn primary" onclick="doInstall()">Cài</button><button class="ib" aria-label="Ẩn" onclick="S.hideInstall=true;save();render()"><i class="ti ti-x"></i></button></section>`;
  h += `<section class="card"><div class="row between"><h3>Kế hoạch hôm nay</h3><span class="pill ${pd === 3 ? "good" : ""}">${pd}/3</span></div>
  ${p.map(x => `<button class="task ${x.ok ? "ok" : ""}" onclick="${x.go}"><span class="chk">${x.ok ? '<i class="ti ti-check"></i>' : ""}</span><i class="ti ti-${x.ic}"></i><span class="grow"><b>${x.t}</b><small>${x.d}</small></span><i class="ti ti-chevron-right muted"></i></button>`).join("")}</section>`;
  if (L) {
    const rs = S.resume && S.resume.id === n;
    h += `<section class="card big" onclick="openIntro('${n}')"><div class="row between"><span class="tag">${st.name} · Bài ${L.no}/${st.lessons.length}</span><span class="sm muted">${stageProgress(st)}% chặng</span></div><h2>${esc(L.t)}</h2><p class="muted">${L.W.length} từ mới · ${L.stage === "s0" ? "phát âm" : "nghe · nói · đọc · viết"} · ~25 phút</p><button class="btn primary full lg">${rs ? "Học tiếp" : "Vào học"} <i class="ti ti-arrow-right"></i></button></section>`;
  } else h += `<section class="card big"><h2>Bạn đã học hết nội dung hiện có!</h2><p class="muted">Bạn đã đi hết toàn bộ lộ trình từ số 0 đến C1. Hãy ôn thẻ và chơi trò chơi mỗi ngày để giữ vốn từ.</p><button class="btn full" onclick="nav('road')">Xem lộ trình</button></section>`;
  h += `<div class="quick"><button onclick="nav('review')"><i class="ti ti-cards"></i><b>${due}</b><span>thẻ cần ôn</span></button><button onclick="${mk ? "startMistakes()" : "nav('book')"}"><i class="ti ti-alert-triangle"></i><b>${mk}</b><span>lỗi cần sửa</span></button><button onclick="nav('book')"><i class="ti ti-notebook"></i><b>${Object.keys(S.cards).length}</b><span>từ đã học</span></button></div>`;
  h += `<h4 class="sec">Một buổi học 60 phút lý tưởng</h4><div class="loop">${[["cards", "10'", "Ôn thẻ"], ["headphones", "15'", "Nghe"], ["microphone", "15'", "Nói nhại"], ["book", "10'", "Đọc"], ["pencil", "10'", "Viết"]].map(x => `<div><i class="ti ti-${x[0]}"></i><b>${x[1]}</b><span>${x[2]}</span></div>`).join("")}</div>`;
  app().innerHTML = h;
}

/* ---------- Lộ trình ---------- */
let openStage = null;
function vRoad() {
  const th = totalHours(), g = S.settings.goal;
  let h = `<header class="page"><h1>Lộ trình của bạn</h1><p class="muted">Từ số 0 đến C1. Mục tiêu chính là B2: dùng tiếng Anh độc lập trong công việc và đời sống.</p>
  <div class="card flat"><div class="row between"><span>Đã học <b>${th < 1 ? Math.round(th * 60) + " phút" : th.toFixed(1) + " giờ"}</b></span><span class="muted sm">mục tiêu ~550 giờ</span></div><div class="bar"><span style="width:${Math.min(100, th / 550 * 100).toFixed(1)}%"></span></div><p class="sm muted">Với ${g} phút mỗi ngày, bạn đạt B2 sau khoảng ${Math.max(1, Math.round((550 - th) * 60 / g / 30))} tháng nữa.</p></div></header>`;
  if (!openStage) openStage = (LES[nextLesson()] || {}).stage || "s0";
  STAGES.forEach(st => {
    const p = stageProgress(st), op = openStage === st.id, done = stageDone(st.id) && !st.locked;
    h += `<section class="card stage ${st.locked ? "lock" : ""} ${op ? "open" : ""}"><button class="sthead" onclick="openStage=openStage==='${st.id}'?'-':'${st.id}';render()"><div class="badge ${done ? "done" : ""}">${done ? '<i class="ti ti-check"></i>' : st.name}</div><div class="grow"><h3>${st.name === "Chặng 0" ? "" : st.name + " · "}${st.title}</h3><p class="muted sm">${st.hours} giờ · ${st.words}${st.locked ? " · đang soạn" : " · " + st.lessons.length + " bài · " + p + "%"}</p>${st.locked ? "" : `<div class="bar sm"><span style="width:${p}%"></span></div>`}</div><i class="ti ti-${st.locked ? "lock" : op ? "chevron-up" : "chevron-down"}"></i></button>`;
    if (op) {
      h += `<p class="lab">Học xong bạn làm được:</p><ul class="goals">${st.goals.map(x => `<li><i class="ti ti-check"></i>${x}</li>`).join("")}</ul>`;
      if (st.locked) h += `<p class="sm muted">Chặng này đang được soạn và sẽ có trong bản cập nhật tới. Trong lúc chờ, hãy ôn thẻ đều đặn để giữ từ vựng.</p>`;
      else {
        h += `<div class="lessons">` + st.lessons.map(L => { const o = isOpen(L.id), d = S.done[L.id]; return `<button class="les ${o ? "" : "off"} ${passed(L.id) ? "ok" : ""}" onclick="${o ? `openIntro('${L.id}')` : `toast('Hoàn thành bài trước với 80% để mở bài này')`}"><span class="n">${passed(L.id) ? '<i class="ti ti-check"></i>' : L.no}</span><span class="grow">${esc(L.t)}</span><span class="sc">${d ? d.best + "%" : o ? '<i class="ti ti-player-play"></i>' : '<i class="ti ti-lock"></i>'}</span></button>`; }).join("") + `</div>`;
        h += `<button class="btn full" onclick="startExam('${st.id}')"><i class="ti ti-certificate"></i> ${S.stagePassed[st.id] ? "Thi lại bài qua chặng" : "Thi qua chặng · đạt 80% mở hết chặng"}</button>`;
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
  let h = `<header class="page"><h1>Ôn tập</h1><p class="muted">Mỗi từ được nhắc lại đúng lúc bạn sắp quên: sau 1, 2, 4, 7, 15, 30, 60 ngày. Nhớ đúng thì giãn ra, quên thì nhắc lại sớm.</p></header>
  <div class="stats"><div><b>${due}</b><span>đến hạn</span></div><div><b>${total}</b><span>đã học</span></div><div><b>${mast}</b><span>đã thuộc</span></div></div>`;
  if (due) h += `<button class="btn primary full lg" onclick="startReview()"><i class="ti ti-player-play"></i> Ôn ${Math.min(due, 20)} thẻ ngay</button>`;
  else if (total) h += `<section class="card"><p><b>Hôm nay đã ôn xong.</b> Ôn thêm giúp nhớ chắc hơn.</p><button class="btn full" onclick="startReview(true)">Ôn thêm 10 thẻ</button></section>`;
  else h += `<section class="card"><p>Chưa có thẻ nào. Học xong một bài, các từ mới sẽ tự vào đây.</p><button class="btn primary full" onclick="goNext()">Đi học bài</button></section>`;
  h += `<section class="card row" ${mk ? `onclick="startMistakes()"` : ""}><div class="ico warn"><i class="ti ti-alert-triangle"></i></div><div class="grow"><h3>Luyện lại lỗi sai</h3><p class="muted sm">${mk ? mk + " câu và từ bạn từng làm sai" : "Chưa có lỗi nào. Tuyệt vời!"}</p></div>${mk ? '<i class="ti ti-chevron-right"></i>' : ""}</section>`;
  h += `<section class="card row" onclick="nav('book')"><div class="ico"><i class="ti ti-notebook"></i></div><div class="grow"><h3>Sổ tay</h3><p class="muted sm">Tra từ đã học, xem lại lỗi sai và ngữ pháp</p></div><i class="ti ti-chevron-right"></i></section>`;
  if (total) {
    const boxes = Array(8).fill(0); Object.values(S.cards).forEach(c => boxes[Math.min(7, c.box)]++); const mx = Math.max(...boxes, 1);
    h += `<h4 class="sec">Độ nhớ của bạn</h4><div class="chart boxes">${["Mới", "1 ngày", "2 ngày", "4 ngày", "7 ngày", "15 ngày", "30 ngày", "60 ngày"].map((l, i) => `<div><b>${boxes[i]}</b><span style="height:${Math.max(3, boxes[i] / mx * 100)}%"></span><small>${l}</small></div>`).join("")}</div><p class="note">Cột càng dồn về bên phải nghĩa là bạn nhớ càng lâu.</p>`;
  }
  app().innerHTML = h;
}

/* ---------- Sổ tay ---------- */
let BK = { seg: "words", q: "", f: "learned" };
function vBook() {
  let h = `<header class="page"><h1>Sổ tay</h1></header><div class="seg big">${[["words", "Từ vựng"], ["mist", "Lỗi sai"], ["gram", "Ngữ pháp"]].map(x => `<button class="${BK.seg === x[0] ? "on" : ""}" onclick="BK.seg='${x[0]}';render()">${x[1]}</button>`).join("")}</div>`;
  if (BK.seg === "words") {
    h += `<div class="search"><i class="ti ti-search"></i><input id="q" placeholder="Tìm từ tiếng Anh hoặc tiếng Việt" value="${esc(BK.q)}" oninput="BK.q=this.value;drawWords()"></div>
    <div class="chips2">${[["learned", "Đã học"], ["weak", "Đang yếu"], ["master", "Đã thuộc"], ["all", "Tất cả"]].map(x => `<button class="${BK.f === x[0] ? "on" : ""}" onclick="BK.f='${x[0]}';render()">${x[1]}</button>`).join("")}</div><div id="wl"></div>`;
    app().innerHTML = h; drawWords(); return;
  }
  if (BK.seg === "mist") {
    const ms = Object.values(S.mistakes).sort((a, b) => b.at - a.at);
    h += ms.length ? `<button class="btn primary full" onclick="startMistakes()"><i class="ti ti-refresh"></i> Luyện lại ${ms.length} lỗi</button><p class="note">Làm đúng 2 lần, lỗi sẽ tự biến khỏi danh sách.</p>` + ms.map(m => `<div class="word">${spk(m.en)}<div class="grow"><b class="${m.t === "sent" ? "sent" : ""}">${esc(m.en)}</b><span class="vi">${esc(m.vi)}</span></div><span class="pill bad">sai ${m.n}</span></div>`).join("") : `<section class="card c"><i class="ti ti-mood-happy bigi"></i><p>Chưa có lỗi sai nào. Những câu bạn làm sai sẽ được lưu ở đây để luyện lại.</p></section>`;
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
    return !qv || norm(w.en).includes(q) || w.vi.toLowerCase().includes(qv);
  });
  const n = list.length; list = list.slice(0, 150);
  $("#wl").innerHTML = (n ? `<p class="sm muted">${n} từ${n > 150 ? " · hiện 150 từ đầu" : ""}</p>` : `<p class="muted c">${BK.f === "learned" && !Object.keys(S.cards).length ? "Học xong bài đầu tiên, từ vựng sẽ xuất hiện ở đây." : "Không tìm thấy từ nào."}</p>`) +
    list.map(w => { const c = S.cards[w.en], b = c ? c.box : -1; return `<div class="word">${spk(w.en)}<div class="grow"><b>${esc(w.en)}</b><span class="vi">${esc(w.vi)}</span></div><span class="memd" title="Độ nhớ">${[1, 2, 3, 4, 5].map(i => `<i class="${b >= i + 1 ? "on" : ""}"></i>`).join("")}</span></div>`; }).join("");
}

/* ---------- Hồ sơ ---------- */
function vMe() {
  const done = ORDER.filter(passed).length, th = totalHours(), lv = levelOf(S.xp);
  const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push({ l: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()], m: Math.round((S.days[dkey(d)] || 0) / 60) }); }
  const mx = Math.max(S.settings.goal, ...days.map(d => d.m));
  let h = `<header class="page"><h1>Hồ sơ</h1></header>
  <section class="card lvl"><div class="lvn xl">${lv.n}</div><div class="grow"><h3>Cấp ${lv.n} · ${levelName(lv.n)}</h3><div class="bar"><span style="width:${lv.pct}%"></span></div><p class="sm muted">${S.xp} XP · còn ${lv.need} XP lên cấp ${lv.n + 1}</p></div></section>
  <div class="stats"><div><b>${streak()}</b><span>ngày liên tiếp</span></div><div><b>${done}</b><span>bài đã xong</span></div><div><b>${th < 1 ? Math.round(th * 60) + "'" : th.toFixed(1) + "h"}</b><span>tổng thời gian</span></div></div>
  <h4 class="sec">7 ngày qua (phút)</h4><div class="chart week">${days.map(d => `<div><b>${d.m}</b><span class="${d.m >= S.settings.goal ? "full" : ""}" style="height:${Math.max(3, d.m / mx * 100)}%"></span><small>${d.l}</small></div>`).join("")}</div>
  <h4 class="sec">Độ chính xác theo kỹ năng</h4><section class="card">${Object.keys(SK).map(k => { const v = S.skill[k] || [0, 0], p = v[1] ? Math.round(v[0] / v[1] * 100) : 0; return `<div class="skrow"><i class="ti ti-${SKI[k]}"></i><span class="skn">${SK[k]}</span><div class="bar grow"><span style="width:${p}%"></span></div><b>${v[1] ? p + "%" : "–"}</b></div>`; }).join("")}</section>
  <h4 class="sec">Huy hiệu (${Object.keys(S.badges).length}/${BADGES.length})</h4><div class="badges">${BADGES.map(b => `<div class="bdg ${S.badges[b[0]] ? "on" : ""}" onclick="toast('<b>${b[2]}</b>: ${b[3]}')"><i class="ti ti-${b[1]}"></i><span>${b[2]}</span></div>`).join("")}</div>
  <h4 class="sec">Cài đặt</h4><section class="card set">
  <label>Giao diện</label><div class="seg">${[["auto", "Tự động"], ["light", "Sáng"], ["dark", "Tối"]].map(x => `<button class="${S.settings.theme === x[0] ? "on" : ""}" onclick="S.settings.theme='${x[0]}';save();render()">${x[1]}</button>`).join("")}</div>
  <label>Mục tiêu mỗi ngày</label><div class="seg">${[15, 30, 60, 90].map(x => `<button class="${S.settings.goal === x ? "on" : ""}" onclick="S.settings.goal=${x};save();render()">${x}'</button>`).join("")}</div>
  <label>Giọng đọc</label><div class="seg">${[["en-US", "Anh – Mỹ"], ["en-GB", "Anh – Anh"]].map(x => `<button class="${S.settings.accent === x[0] ? "on" : ""}" onclick="S.settings.accent='${x[0]}';save();render()">${x[1]}</button>`).join("")}</div>
  <label>Tốc độ đọc <b id="rv">${S.settings.rate}</b></label><input type="range" min="0.6" max="1.2" step="0.1" value="${S.settings.rate}" oninput="S.settings.rate=+this.value;$('#rv').textContent=this.value;save()">
  <button class="btn full" onclick="say('Hello! Nice to meet you. How are you today?')"><i class="ti ti-volume"></i> Nghe thử giọng</button>
  <label class="tg">Âm thanh đúng / sai <input type="checkbox" ${S.settings.sound ? "checked" : ""} onchange="S.settings.sound=this.checked;save()"></label></section>
  ${installEvt ? `<button class="btn primary full" onclick="doInstall()"><i class="ti ti-device-mobile"></i> Cài app lên màn hình chính</button>` : isIOS() ? `<section class="card sm"><b>Cài lên iPhone:</b> trong Safari bấm nút Chia sẻ <i class="ti ti-share"></i> rồi chọn “Thêm vào MH chính”.</section>` : ""}
  <h4 class="sec">Sao lưu tiến độ</h4><section class="card set"><p class="muted sm">Tiến độ lưu trên trình duyệt của máy này. Muốn học trên máy khác, hãy tải tệp sao lưu rồi mở ở máy kia.</p>
  <div class="row2"><button class="btn" onclick="exportFile()"><i class="ti ti-download"></i> Tải tệp</button><button class="btn" onclick="exportCode()"><i class="ti ti-copy"></i> Chép mã</button></div>
  <label class="btn full fileb"><i class="ti ti-upload"></i> Khôi phục từ tệp<input type="file" accept=".json,application/json" onchange="importFile(this)"></label>
  <textarea id="bk" rows="2" placeholder="Hoặc dán mã sao lưu vào đây"></textarea><p class="err" id="bkerr"></p><button class="btn full" onclick="importCode()">Khôi phục từ mã</button>
  <button class="btn full danger" onclick="askReset()"><i class="ti ti-trash"></i> Xóa toàn bộ tiến độ</button></section>
  <p class="note">Tiếng Anh Từ Số 0 · nội dung bám khung CEFR và danh sách từ Oxford 3000<br><a href="https://github.com/cafecunghoai/hoc-tieng-anh">Mã nguồn trên GitHub</a></p>`;
  app().innerHTML = h;
}
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
const backupStr = () => JSON.stringify(Object.assign({}, S, { resume: null }));
function exportFile() { try { const b = new Blob([backupStr()], { type: "application/json" }), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "sao-luu-tieng-anh-" + today() + ".json"; document.body.appendChild(a); a.click(); a.remove(); toast("Đã tải tệp sao lưu"); } catch (e) { exportCode(); } }
function exportCode() { const c = btoa(unescape(encodeURIComponent(backupStr()))); const t = $("#bk"); t.value = c; t.select(); try { navigator.clipboard.writeText(c).then(() => toast("Đã chép mã sao lưu"), () => toast("Hãy tự chép đoạn mã trong ô")); } catch (e) { toast("Hãy tự chép đoạn mã trong ô"); } }
function restore(x) { if (!x || !x.done) throw 0; S = merge(x); S.onb = true; save(); toast("Đã khôi phục tiến độ"); nav("home"); }
function importFile(inp) { const f = inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { restore(JSON.parse(r.result)); } catch (e) { $("#bkerr").textContent = "Tệp không đúng định dạng sao lưu."; } }; r.readAsText(f); }
function importCode() { const v = $("#bk").value.trim(), e = $("#bkerr"); if (!v) { e.textContent = "Dán mã sao lưu vào ô trước."; return; } try { restore(JSON.parse(decodeURIComponent(escape(atob(v))))); } catch (er) { e.textContent = "Mã không đúng. Hãy kiểm tra lại."; } }
function askReset() { modal("Xóa toàn bộ tiến độ?", "Mọi bài đã học, thẻ ôn, XP và huy hiệu sẽ mất. Không thể hoàn tác.", "Xóa hết", () => { S = def(); save(); OB = 0; nav("home"); }, true); }
function modal(t, m, ok, fn, danger, cancel, fnCancel) { const d = document.createElement("div"); d.className = "modal"; d.innerHTML = `<div class="box"><h3>${t}</h3><p>${m}</p><div class="row2"><button class="btn" id="mno">${cancel || "Không"}</button><button class="btn ${danger ? "dangerf" : "primary"}" id="mok">${ok}</button></div></div>`; document.body.appendChild(d); d.querySelector("#mno").onclick = () => { d.remove(); if (fnCancel) fnCancel(); }; d.querySelector("#mok").onclick = () => { d.remove(); fn(); }; }

/* ---------- Giới thiệu bài ---------- */
function openIntro(id) {
  if (!isOpen(id)) { toast("Bài này chưa mở"); return; }
  VIEW = () => {
    const L = LES[id], st = stageOf(L.stage), rs = S.resume && S.resume.id === id ? S.resume : null, d = S.done[id];
    const tmp = document.createElement("div"); tmp.innerHTML = L.g; const heads = [...tmp.querySelectorAll("h4")].map(x => x.textContent);
    const focus = heads.length ? heads : [tmp.textContent.split(".")[0]];
    const sk = L.stage === "s0" ? ["listen", "speak", "vocab"] : ["vocab", "listen", "speak", "read", "write"];
    app().innerHTML = `<div class="ptop"><button class="ib" onclick="nav(TAB)" aria-label="Quay lại"><i class="ti ti-arrow-left"></i></button><span class="muted sm">${st.name} · Bài ${L.no}/${st.lessons.length}</span></div>
    <div class="intro"><h1>${esc(L.t)}</h1>${d ? `<p class="pill ${d.best >= 80 ? "good" : ""}">Điểm cao nhất: ${d.best}%</p>` : ""}
    <div class="skills">${sk.map(k => `<span><i class="ti ti-${SKI[k]}"></i>${SK[k]}</span>`).join("")}</div>
    <section class="card"><p class="lab">Trọng tâm bài học</p><ul class="goals">${focus.map(x => `<li><i class="ti ti-target"></i>${esc(x)}</li>`).join("")}</ul></section>
    <section class="card"><p class="lab">${L.W.length} ${L.kind === "letters" ? "chữ cái" : "từ mới"} · bấm để nghe</p><div class="chips">${L.W.slice(0, 14).map(w => `<button class="chip sm" onclick="say('${jsq(w.en)}')">${esc(w.en)}</button>`).join("")}${L.W.length > 14 ? `<span class="muted sm">+${L.W.length - 14}</span>` : ""}</div></section>
    <p class="note">Đạt từ 80% để mở bài tiếp theo. Câu làm sai sẽ quay lại cuối bài để bạn sửa.</p>
    ${rs ? `<button class="btn primary full lg" onclick="resumeLesson()"><i class="ti ti-player-play"></i> Học tiếp (câu ${rs.P.i + 1}/${rs.P.steps.length})</button><button class="btn full" onclick="startLesson('${id}')">Học lại từ đầu</button>` : `<button class="btn primary full lg" onclick="startLesson('${id}')"><i class="ti ti-player-play"></i> Bắt đầu học</button>`}</div>`;
  };
  P = null; render(); window.scrollTo(0, 0);
}

/* ---------- Tạo bài tập ---------- */
function mqMeaning(w, pool) { const p = opts(w.vi, pool.map(x => x.vi)); return { type: "mcq", sk: "vocab", label: "Chọn nghĩa đúng", q: w.en, sub: w.ipa ? "/" + w.ipa + "/" : "", audio: w.en, o: p.o, a: p.a, mk: w.en }; }
function mqReverse(w, pool) { const p = opts(w.en, pool.filter(x => x.vi !== w.vi && !(VIMAP[w.vi] || new Set()).has(x.en)).map(x => x.en)); return { type: "mcq", sk: "vocab", label: "Chọn từ tiếng Anh đúng", q: w.vi, vq: 1, o: p.o, a: p.a, mk: w.en, sayAns: 1 }; }
function mqListen(w, pool) { const p = opts(w.en, pool.map(x => x.en)); return { type: "mcq", sk: "listen", label: "Nghe và chọn từ bạn nghe được", audio: w.en, autoplay: true, o: p.o, a: p.a, mk: w.en }; }
function buildLesson(L) {
  const st = [], W = L.W, pool = W.length >= 6 ? W : ALLW;
  for (let i = 0; i < W.length; i += 5) st.push({ type: "words", items: W.slice(i, i + 5), from: i + 1, total: W.length });
  st.push({ type: "gram", html: L.g });
  if (L.kind === "letters") { pick(W, 10).forEach(w => st.push(mqListen(w, W))); L.S.forEach(s => st.push({ type: "speak", sk: "speak", en: s.en, vi: s.vi })); return st; }
  pick(W, 6).forEach(w => st.push(mqMeaning(w, pool)));
  pick(W, 3).forEach(w => st.push(mqReverse(w, pool)));
  pick(W.filter(w => !/^-|-$|=/.test(w.en) && !w.en.includes("-") || /\w-\w/.test(w.en)), 5).forEach(w => st.push(mqListen(w, pool)));
  if (L.stage === "s0") {
    pick(W, 4).forEach(w => st.push({ type: "dict", sk: "listen", label: "Nghe và gõ lại từ", en: w.en, vi: w.vi }));
    pick(W, 4).forEach(w => st.push({ type: "speak", sk: "speak", en: w.en, vi: w.vi, ipa: w.ipa }));
    L.S.forEach(s => st.push({ type: "speak", sk: "speak", en: s.en, vi: s.vi }));
    return st;
  }
  const ss = shuffle(L.S);
  ss.slice(0, 2).forEach(s => st.push({ type: "dict", sk: "listen", label: "Nghe và gõ lại câu", en: s.en, vi: s.vi }));
  ss.slice(2, 5).forEach(s => st.push({ type: "speak", sk: "speak", en: s.en, vi: s.vi }));
  if (L.r) st.push(mkRead(L.r));
  shuffle(L.S).slice(0, 2).forEach(s => st.push({ type: "order", sk: "write", en: s.en, vi: s.vi }));
  shuffle(L.S).slice(0, 2).forEach(s => st.push({ type: "trans", sk: "write", en: s.en, vi: s.vi }));
  if (L.WR) st.push({ type: "write", sk: "write", wr: L.WR });
  return st;
}
function mkRead(r) { return { type: "read", sk: "read", t: r.t, q: r.q.map(x => { const p = x.split("|"); const o = opts(p[1], p.slice(2)); return { q: p[0], o: o.o, a: o.a }; }) }; }
function newP(kind, steps, extra) { P = Object.assign({ kind, steps, i: 0, ok: 0, tot: 0, xp: 0, sk: {}, wrong: 0 }, extra || {}); last = Date.now(); VIEW = null; render(); }
function startLesson(id) { if (!isOpen(id)) { toast("Bài này chưa mở"); return; } checkVoice(); S.resume = null; newP("lesson", buildLesson(LES[id]), { id }); }
function resumeLesson() { const r = S.resume; P = r.P; last = Date.now(); VIEW = null; render(); }
function startReview(extra) {
  const keys = extra ? pick(Object.keys(S.cards), 10) : dueCards().sort((a, b) => S.cards[a].due - S.cards[b].due).slice(0, 20);
  if (!keys.length) { toast("Chưa có thẻ để ôn"); return; }
  const steps = shuffle(keys).map((k, i) => { const w = WMAP[k] || { en: k, vi: S.cards[k].vi }; const s = i % 3 === 2 ? mqListen(w, ALLW) : i % 3 === 1 ? mqReverse(w, ALLW) : mqMeaning(w, ALLW); s.card = k; return s; });
  newP("review", steps);
}
function startMistakes() {
  const ms = Object.values(S.mistakes); if (!ms.length) { toast("Chưa có lỗi sai nào"); return; }
  const steps = shuffle(ms).slice(0, 15).map((m, i) => { let s; if (m.t === "sent") s = i % 2 ? { type: "order", sk: "write", en: m.en, vi: m.vi } : { type: "trans", sk: "write", en: m.en, vi: m.vi }; else { const w = WMAP[m.en] || { en: m.en, vi: m.vi }; s = i % 2 ? mqReverse(w, ALLW) : mqMeaning(w, ALLW); } s.fix = m.en; return s; });
  newP("mist", steps);
}
function startExam(sid) {
  const st = stageOf(sid), Ls = st.lessons.filter(L => L.kind !== "letters");
  const W = [], Ss = []; Ls.forEach(L => { L.W.forEach(w => W.push(w)); L.S.forEach(s => Ss.push(s)); });
  const steps = [];
  pick(W, 8).forEach(w => steps.push(mqMeaning(w, W)));
  pick(W, 4).forEach(w => steps.push(mqListen(w, W)));
  if (sid === "s0") pick(W, 8).forEach(w => steps.push({ type: "dict", sk: "listen", label: "Nghe và gõ lại từ", en: w.en, vi: w.vi }));
  else { pick(Ss, 3).forEach(s => steps.push({ type: "order", sk: "write", en: s.en, vi: s.vi })); pick(Ss, 3).forEach(s => steps.push({ type: "trans", sk: "write", en: s.en, vi: s.vi })); pick(Ss, 2).forEach(s => steps.push({ type: "dict", sk: "listen", label: "Nghe và gõ lại câu", en: s.en, vi: s.vi })); const rl = pick(Ls.filter(L => L.r), 1)[0]; if (rl) steps.push(mkRead(rl.r)); }
  newP("exam", shuffle(steps), { sid });
}
function startPlacement() {
  const steps = PLACEMENT.map(x => { const o = shuffle(x.o); return { type: "mcq", sk: "", label: x.audio ? x.q : "Chọn đáp án đúng", q: x.audio ? "" : x.q, audio: x.audio, autoplay: !!x.audio, o, a: o.indexOf(x.o[0]), nofb: 1 }; });
  newP("place", steps);
}

/* ---------- Trình học ---------- */
function quit() {
  if (P.kind === "lesson" && P.i > 0) { S.resume = { id: P.id, P: JSON.parse(JSON.stringify(P)) }; save(); toast("Đã lưu chỗ bạn đang học. Lần sau học tiếp nhé!"); const id = P.id; P = null; openIntro(id); }
  else if (P.kind === "place" && P.i > 0) modal("Dừng bài kiểm tra?", "Bạn sẽ bắt đầu học từ Chặng 0.", "Dừng", () => { S.placement = "zero"; P = null; nav("home"); });
  else { P = null; render(); }
}
function showStep() {
  if (P.i >= P.steps.length) return finish();
  const s = P.steps[P.i]; P.ans = false;
  const title = P.kind === "lesson" ? esc(LES[P.id].t) : { review: "Ôn từ vựng", exam: "Thi qua chặng " + (P.sid ? stageOf(P.sid).name : ""), place: "Kiểm tra đầu vào", mist: "Luyện lại lỗi sai" }[P.kind];
  let h = `<div class="ptop"><button class="ib" onclick="quit()" aria-label="Thoát"><i class="ti ti-x"></i></button><div class="bar grow"><span style="width:${P.i / P.steps.length * 100}%"></span></div><span class="muted sm">${P.i + 1}/${P.steps.length}</span></div><p class="ptitle">${title}${s.r ? ' · <span class="retry">làm lại câu sai</span>' : ""}</p><div class="pbody">`;
  h += ({ words: rWords, gram: rGram, mcq: rMcq, dict: rDict, trans: rTrans, order: rOrder, speak: rSpeak, read: rRead, write: rWrite })[s.type](s);
  h += `</div><div id="fb" class="fb"></div>`;
  app().innerHTML = h; window.scrollTo(0, 0);
  if (s.type === "words" || s.type === "gram") cont();
  if (s.autoplay) setTimeout(() => say(s.audio), 350);
  if (s.type === "dict") setTimeout(() => say(s.en), 350);
  if (s.type === "order") drawOrder();
  if (P.kind === "lesson" && P.i > 0) { S.resume = { id: P.id, P: JSON.parse(JSON.stringify(P)) }; save(); }
}
function cont(cls, msg) { const f = $("#fb"); f.className = "fb on " + (cls || ""); f.innerHTML = `<div class="fbin">${msg || ""}<button class="btn primary full lg" id="nextb" onclick="nextStep()">Tiếp tục <span class="kbd">Enter</span></button></div>`; }
function nextStep() { tick(); P.i++; showStep(); }
function grade(ok, ans, note) {
  if (P.ans) return; P.ans = true;
  const s = P.steps[P.i];
  if (!s.r) { P.tot++; if (ok) P.ok++; if (s.sk) { addSkill(s.sk, ok); const v = P.sk[s.sk] || (P.sk[s.sk] = [0, 0]); v[1]++; if (ok) v[0]++; } }
  if (ok && P.kind !== "place") { const g = s.r ? 3 : s.card ? 5 : 10; P.xp += g; }
  if (!ok) P.wrong++;
  if (s.card) { const c = S.cards[s.card]; if (ok) { c.box = Math.min(7, c.box + 1); c.due = Date.now() + INT[c.box] * DAY; S.cnt.review++; } else { c.box = 1; c.due = Date.now() + 10 * 60000; } }
  if (s.fix) { const m = S.mistakes[s.fix]; if (m) { if (ok) { m.n--; if (m.n <= 0) delete S.mistakes[s.fix]; } else m.n++; } }
  if (!ok && P.kind !== "place" && !s.fix) recordMistake(s);
  if (!ok && P.kind === "lesson" && ["mcq", "dict", "trans", "order"].includes(s.type) && (s.r || 0) < 2) requeue(s);
  if (ok && s.type === "speak") S.cnt.speak++;
  if (ok && s.type === "write") S.cnt.write++;
  save();
  if (s.nofb) { beep("good"); nextStep(); return; }
  beep(ok ? "good" : "bad");
  cont(ok ? "good" : "bad", `<p class="fbt"><i class="ti ti-${ok ? "circle-check" : "alert-circle"}"></i> ${ok ? (note || pick(["Chính xác!", "Tuyệt vời!", "Giỏi lắm!", "Đúng rồi!"], 1)[0]) : "Chưa đúng"}${ok && !s.r && P.kind !== "place" ? `<span class="xpg">+${s.card ? 5 : 10} XP</span>` : ""}</p>${!ok && ans ? `<p class="fba">Đáp án: <b>${ans}</b></p>` : ""}${!ok && P.kind === "lesson" && s.r !== undefined && (s.r || 0) < 2 && ["mcq", "dict", "trans", "order"].includes(s.type) ? `<p class="sm">Câu này sẽ quay lại cuối bài.</p>` : ""}`);
}
function recordMistake(s) {
  let en, vi, t;
  if (s.type === "mcq" && s.mk && WMAP[s.mk]) { en = s.mk; vi = WMAP[s.mk].vi; t = "word"; }
  else if (["dict", "trans", "order"].includes(s.type) && s.en.includes(" ")) { en = s.en; vi = s.vi; t = "sent"; }
  else return;
  const m = S.mistakes[en] || (S.mistakes[en] = { en, vi, t, n: 0 }); m.n = Math.min(2, m.n + 1); m.at = Date.now();
}
function requeue(s) {
  const c = JSON.parse(JSON.stringify(s)); c.r = (s.r || 0) + 1;
  if (c.type === "mcq") { const o = shuffle(c.o); c.a = o.indexOf(c.o[c.a]); c.o = o; }
  delete c.pool; delete c.ans;
  P.steps.push(c);
}
const spk = (t, extra) => `<button class="spk ${extra || ""}" onclick="event.stopPropagation();say('${jsq(t)}')" aria-label="Nghe"><i class="ti ti-volume"></i></button>`;
const slowBtn = t => `<button class="link" onclick="say('${jsq(t)}',1)"><i class="ti ti-snail"></i> Nghe chậm</button>`;
function rWords(s) { return `<p class="lab">Từ mới ${s.from}–${s.from + s.items.length - 1} / ${s.total} · bấm loa để nghe, nói to theo</p>` + s.items.map(w => `<div class="word">${spk(w.en)}<div class="grow"><b>${esc(w.en)}</b>${w.ipa ? `<span class="ipa">/${esc(w.ipa)}/</span>` : ""}<span class="vi">${esc(w.vi)}</span></div><button class="ib" onclick="say('${jsq(w.en)}',1)" aria-label="Nghe chậm"><i class="ti ti-snail"></i></button></div>`).join(""); }
function rGram(s) { return `<p class="lab"><i class="ti ti-bulb"></i> Kiến thức trọng tâm</p><div class="gram">${s.html}</div>`; }
function rMcq(s) {
  return `<p class="lab">${s.sk ? `<i class="ti ti-${SKI[s.sk]}"></i> ${SK[s.sk]} · ` : ""}${s.label}</p>` + (s.q ? `<h2 class="q ${s.vq ? "vi" : ""}">${esc(s.q)}</h2>` : "") + (s.sub ? `<p class="ipa c">${esc(s.sub)}</p>` : "") +
    (s.audio && !s.q ? `<div class="c">${spk(s.audio, "xl")}${slowBtn(s.audio)}</div>` : s.audio ? `<div class="c">${spk(s.audio)}</div>` : "") +
    `<div class="opts">${s.o.map((o, i) => `<button class="opt" id="o${i}" onclick="pickOpt(${i})"><span class="k">${i + 1}</span>${esc(o)}</button>`).join("")}</div>`;
}
function pickOpt(i) { const s = P.steps[P.i]; if (P.ans) return; $$(".opt").forEach(b => b.disabled = true); if (!s.nofb) { $("#o" + s.a).classList.add("right"); if (i !== s.a) $("#o" + i).classList.add("wrong"); } else $("#o" + i).classList.add("picked"); if (s.sayAns) say(s.o[s.a]); grade(i === s.a, esc(s.o[s.a])); }
function rDict(s) { return `<p class="lab"><i class="ti ti-headphones"></i> Nghe · ${s.label}</p><div class="c">${spk(s.en, "xl")}${slowBtn(s.en)}</div><textarea id="inp" rows="2" placeholder="Gõ những gì bạn nghe được" oninput="$('#er').textContent=''" autocapitalize="off" autocomplete="off" spellcheck="false"></textarea><p class="err" id="er"></p><button class="btn primary full" id="chk" onclick="checkText()">Kiểm tra</button>`; }
function rTrans(s) { return `<p class="lab"><i class="ti ti-pencil"></i> Viết · Dịch sang tiếng Anh</p><h2 class="q vi">${esc(s.vi)}</h2><textarea id="inp" rows="2" placeholder="Viết câu tiếng Anh" oninput="$('#er').textContent=''" autocapitalize="sentences" autocomplete="off" spellcheck="false"></textarea><p class="err" id="er"></p><div id="hint"><button class="link" onclick="$('#hint').innerHTML='<p class=hint>Gợi ý: ${jsq(s.en.split(" ").slice(0, 2).join(" "))} ...</p>'"><i class="ti ti-bulb"></i> Gợi ý</button></div><button class="btn primary full" id="chk" onclick="checkText()">Kiểm tra</button>`; }
function checkText() {
  const s = P.steps[P.i], v = $("#inp").value.trim();
  if (!v) { $("#er").textContent = "Hãy gõ câu trả lời trước."; return; }
  const r = compare(v, s.en); $("#chk").remove(); $("#inp").disabled = true;
  grade(r > 0, esc(s.en) + `<br><span class="muted">${esc(s.vi)}</span>`, r === 1 ? "Gần đúng! Chú ý chính tả: " + esc(s.en) : null);
  setTimeout(() => say(s.en), 250);
}
function rOrder(s) { s.pool = shuffle(s.en.split(" ").map((w, i) => ({ w, i }))); s.ans = []; return `<p class="lab"><i class="ti ti-pencil"></i> Viết · Sắp xếp thành câu đúng</p><h2 class="q vi">${esc(s.vi)}</h2><div class="line" id="ln"></div><div class="chips" id="ch"></div><p class="err" id="er"></p><button class="btn primary full" id="chk" onclick="checkOrder()">Kiểm tra</button>`; }
function drawOrder() { const s = P.steps[P.i]; $("#ln").innerHTML = s.ans.map((c, k) => `<button class="chip" onclick="unchip(${k})">${esc(c.w)}</button>`).join("") || `<span class="muted sm">Bấm các từ bên dưới theo đúng thứ tự</span>`; $("#ch").innerHTML = s.pool.map((c, k) => `<button class="chip" onclick="chip(${k})">${esc(c.w)}</button>`).join(""); }
function chip(k) { const s = P.steps[P.i]; if (P.ans) return; s.ans.push(s.pool.splice(k, 1)[0]); $("#er").textContent = ""; drawOrder(); }
function unchip(k) { const s = P.steps[P.i]; if (P.ans) return; s.pool.push(s.ans.splice(k, 1)[0]); drawOrder(); }
function checkOrder() { const s = P.steps[P.i]; if (s.pool.length) { $("#er").textContent = "Hãy xếp hết các từ trước."; return; } $("#chk").remove(); grade(norm(s.ans.map(c => c.w).join(" ")) === norm(s.en), esc(s.en)); say(s.en); }
function rSpeak(s) {
  return `<p class="lab"><i class="ti ti-microphone"></i> Nói · Nghe mẫu rồi nói theo</p><div class="say"><h2 id="sayt">${esc(s.en)}</h2>${s.ipa ? `<p class="ipa">/${esc(s.ipa)}/</p>` : ""}<p class="vi">${esc(s.vi)}</p></div><div class="c">${spk(s.en, "xl")}${slowBtn(s.en)}</div>
  <div id="mic">${SR && !micBlocked ? `<button class="btn primary full lg" onclick="doMic()"><i class="ti ti-microphone"></i> Bấm rồi nói</button><button class="link c" onclick="$('#mic').innerHTML=selfRate()">Không dùng micro được?</button>` : selfRate()}</div>`;
}
function selfRate(msg) { return `<p class="muted c sm">${msg || "Nghe mẫu, nói to theo 2–3 lần cho trôi chảy, rồi tự đánh giá."}</p><div class="row2"><button class="btn" onclick="grade(false,'')">Chưa được</button><button class="btn primary" onclick="grade(true,'','Tốt lắm! Giữ nhịp như vậy nhé.')">Nói được rồi</button></div>`; }
function doMic() {
  const s = P.steps[P.i]; $("#mic").innerHTML = `<div class="listening"><span class="dot"></span> Đang nghe... hãy nói câu trên</div>`;
  listenMic(alts => {
    let best = alts[0], sc = -1; alts.forEach(a => { const v = speakScore(s.en, a); if (v > sc) { sc = v; best = a; } });
    $("#sayt").innerHTML = diffWords(s.en, best);
    if (sc >= 70) { $("#mic").innerHTML = `<p class="heard">Máy nghe được: “${esc(best)}”</p>`; grade(true, "", `Phát âm tốt: ${sc}% từ đúng`); }
    else $("#mic").innerHTML = `<p class="heard">Máy nghe được: “${esc(best)}” · <b>${sc}%</b> từ đúng<br><span class="sm muted">Từ màu đỏ là từ máy chưa nghe rõ. Nghe chậm rồi thử lại.</span></p><div class="row2"><button class="btn" onclick="grade(false,'${jsq(s.en)}')">Bỏ qua</button><button class="btn primary" onclick="doMic()"><i class="ti ti-refresh"></i> Thử lại</button></div>`;
  }, err => {
    const m = err === "no-speech" ? "Chưa nghe thấy gì. Hãy nói to và rõ hơn." : "Trình duyệt này chưa cho dùng micro. Hãy cho phép micro, hoặc tự đánh giá nhé.";
    $("#mic").innerHTML = (!micBlocked ? `<button class="btn primary full" onclick="doMic()"><i class="ti ti-microphone"></i> Thử lại</button>` : "") + selfRate(m);
  });
}
function rRead(s) { s.left = s.q.filter(q => !q.done).length; return `<p class="lab"><i class="ti ti-book"></i> Đọc · Đọc bài rồi trả lời</p><div class="passage">${esc(s.t).replace(/\n/g, "<br>")}</div><div class="row c2">${spk(s.t.replace(/\n/g, " "))}<span class="muted sm">Nghe cả bài</span>${slowBtn(s.t.replace(/\n/g, " "))}</div>` + s.q.map((q, k) => `<div class="rq"><p><b>${k + 1}.</b> ${esc(q.q)}</p><div class="opts">${q.o.map((o, i) => `<button class="opt" id="r${k}_${i}" onclick="pickRead(${k},${i})">${esc(o)}</button>`).join("")}</div></div>`).join(""); }
function pickRead(k, i) { const s = P.steps[P.i], q = s.q[k]; if (q.done) return; q.done = 1; q.o.forEach((_, j) => $("#r" + k + "_" + j).disabled = true); $("#r" + k + "_" + q.a).classList.add("right"); if (i !== q.a) $("#r" + k + "_" + i).classList.add("wrong"); P.tot++; addSkill("read", i === q.a); const v = P.sk.read || (P.sk.read = [0, 0]); v[1]++; if (i === q.a) { P.ok++; v[0]++; P.xp += 10; beep("good"); } else beep("bad"); save(); if (--s.left === 0) { P.ans = true; cont("", `<p class="fbt"><i class="ti ti-book"></i> Đã trả lời xong ${s.q.length} câu hỏi</p>`); } }
const wcount = t => (t.trim().match(/[A-Za-z0-9'’-]+/g) || []).length;
function kwHit(text, alt) { const n = " " + norm(text) + " "; alt = alt.trim(); if (alt === "ing") return /\b\w{2,}ing\b/.test(norm(text)); return n.includes(" " + norm(alt) + " "); }
function rWrite(s) {
  const w = s.wr;
  return `<p class="lab"><i class="ti ti-pencil"></i> Viết · Viết đoạn văn ngắn</p><div class="say left"><p><b>${esc(w.p)}</b></p><p class="sm muted">Ít nhất ${w.min} từ. Nên dùng: ${w.kw.map(k => `<span class="kw">${esc(k.split("/")[0])}</span>`).join(" ")}</p></div>
  <textarea id="inp" rows="6" placeholder="Viết bằng tiếng Anh..." oninput="$('#wc').textContent=wcount(this.value)+' / ${w.min} từ';$('#er').textContent=''" autocapitalize="sentences" spellcheck="true"></textarea><p class="sm muted" id="wc">0 / ${w.min} từ</p><p class="err" id="er"></p><div id="wres"></div>
  <button class="btn primary full" id="chk" onclick="checkWrite()">Kiểm tra</button><button class="link" onclick="showModel()">Xem bài mẫu và bỏ qua</button>`;
}
function checkWrite() {
  const s = P.steps[P.i], w = s.wr, v = $("#inp").value;
  if (wcount(v) < 3) { $("#er").textContent = "Hãy viết vài câu trước khi kiểm tra."; return; }
  $("#wc").textContent = wcount(v) + " / " + w.min + " từ";
  const n = wcount(v), res = w.kw.map(k => ({ k: k.split("/")[0], ok: k.split("/").some(a => kwHit(v, a)) })), okLen = n >= w.min, all = okLen && res.every(r => r.ok);
  $("#wres").innerHTML = `<div class="checklist"><p class="${okLen ? "g" : "b"}"><i class="ti ti-${okLen ? "check" : "x"}"></i> Độ dài: ${n}/${w.min} từ</p>${res.map(r => `<p class="${r.ok ? "g" : "b"}"><i class="ti ti-${r.ok ? "check" : "x"}"></i> Có dùng “${esc(r.k)}”</p>`).join("")}</div>`;
  if (all) { $("#chk").remove(); $("#inp").disabled = true; showModelBox(); grade(true, "", "Đoạn văn đạt yêu cầu!"); }
  else $("#er").textContent = "Bổ sung những mục còn thiếu rồi bấm Kiểm tra lại.";
}
function showModelBox() { const w = P.steps[P.i].wr; $("#wres").insertAdjacentHTML("beforeend", `<div class="model"><div class="row between"><b>Bài mẫu để so sánh</b>${spk(w.model.replace(/\n/g, " "))}</div><p>${esc(w.model).replace(/\n/g, "<br>")}</p><p class="sm muted">Máy kiểm tra độ dài và từ khóa. Hãy tự so ngữ pháp với bài mẫu.</p></div>`); }
function showModel() { if (P.ans) return; const c = $("#chk"); if (c) c.remove(); $("#inp").disabled = true; showModelBox(); grade(false, ""); }

/* ---------- Kết thúc ---------- */
function finish() {
  tick();
  const k = P.kind, sc = P.tot ? Math.round(P.ok / P.tot * 100) : 100; let h = "", btns = "", bonus = 0;
  if (k === "lesson") {
    const L = LES[P.id], prev = S.done[L.id], ok = sc >= 80, first = !passed(L.id) && ok;
    S.done[L.id] = { best: Math.max(sc, prev ? prev.best : 0), at: Date.now() }; S.resume = null; lg().lessons++;
    if (L.srs !== false) L.W.forEach(w => { if (!S.cards[w.en]) S.cards[w.en] = { vi: w.vi, box: 0, due: Date.now() + DAY }; });
    bonus = 20 + (first ? 30 : 0) + (sc === 100 ? 20 : 0); if (sc === 100) S.cnt.perfect++;
    const n = nextLesson();
    h = `<h1>${sc === 100 ? "Hoàn hảo!" : ok ? "Hoàn thành bài học!" : "Gần được rồi!"}</h1><p class="muted">${ok ? (n && n !== L.id ? "Bài tiếp theo đã mở." : "Bạn đã xong bài này.") + (L.srs !== false ? ` ${L.W.length} từ mới đã vào kho ôn tập.` : "") : "Cần đạt 80% để mở bài tiếp theo. Học lại một lần nữa sẽ dễ hơn nhiều!"}</p>`;
    btns = (ok && n && n !== L.id ? `<button class="btn primary full lg" onclick="openIntro('${n}')">Bài tiếp theo <i class="ti ti-arrow-right"></i></button>` : `<button class="btn primary full lg" onclick="startLesson('${L.id}')"><i class="ti ti-refresh"></i> Học lại</button>`) + `<button class="btn full" onclick="nav('home')">Về trang chủ</button>`;
  } else if (k === "review" || k === "mist") {
    bonus = 10;
    h = `<h1>${k === "review" ? "Ôn xong!" : "Sửa lỗi xong!"}</h1><p class="muted">${k === "review" ? "Từ nhớ đúng sẽ được nhắc lại sau lâu hơn. Từ sai sẽ quay lại sớm." : `Còn ${Object.keys(S.mistakes).length} lỗi trong sổ tay.`}</p>`;
    btns = `<button class="btn primary full lg" onclick="nav('home')">Về trang chủ</button>`;
  } else if (k === "exam") {
    const st = stageOf(P.sid), ok = sc >= 80;
    if (ok) { bonus = 100; S.stagePassed[P.sid] = true; st.lessons.forEach(L => { S.unlocked[L.id] = true; if (L.srs !== false) L.W.forEach(w => { if (!S.cards[w.en]) S.cards[w.en] = { vi: w.vi, box: 2, due: Date.now() + 2 * DAY }; }); }); const ni = ORDER.indexOf(st.lessons[st.lessons.length - 1].id) + 1; if (ORDER[ni]) S.unlocked[ORDER[ni]] = true; }
    h = `<h1>${ok ? "Chúc mừng! Bạn đã qua " + st.name : "Chưa qua chặng"}</h1><p class="muted">${ok ? "Toàn bộ bài trong chặng đã mở và chặng kế tiếp đã sẵn sàng." : "Cần 80%. Hãy học thêm các bài trong chặng rồi thi lại."}</p>`;
    btns = `<button class="btn primary full lg" onclick="nav('road')">Xem lộ trình</button>`;
  } else {
    const n = P.ok; let start, msg;
    if (n <= 3) { start = "s0-1"; msg = "Bạn nên bắt đầu từ <b>Chặng 0 – Làm quen âm</b> để có nền phát âm chắc."; }
    else if (n <= 7) { start = "a1-1"; msg = "Bạn đã có chút nền. Bắt đầu từ <b>A1 – Bài 1</b>. Chặng 0 vẫn mở để bạn luyện phát âm."; }
    else if (n <= 10) { start = "a1-13"; msg = "Bạn nắm khá tốt phần đầu A1. Đã mở đến <b>A1 – Bài 13</b>."; }
    else if (n <= 13) { start = "a2-1"; msg = "Bạn đã vững A1! Bắt đầu từ <b>A2 – Bài 1</b>. Bạn có thể quay lại ôn A1 bất cứ lúc nào."; }
    else if (n <= 16) { start = "b1-1"; msg = "Bạn đã nắm chắc A2. Bắt đầu từ <b>B1 – Bài 1</b>. Nếu thấy khó, hãy làm bài thi qua chặng A2 để ôn lại."; }
    else if (n <= 19) { start = "b2-1"; msg = "Trình độ của bạn tốt. Bắt đầu từ <b>B2 – Bài 1</b>. Các chặng trước vẫn mở để bạn ôn."; }
    else { start = "c1-1"; msg = "Rất ấn tượng! Bạn có thể học thẳng <b>C1 – Nâng cao</b>. Hãy làm bài thi qua chặng B2 để xác nhận."; }
    S.placement = n; ORDER.slice(0, ORDER.indexOf(start) + 1).forEach(id => S.unlocked[id] = true);
    h = `<h1>Kết quả: ${n}/${P.tot} câu đúng</h1><p>${msg}</p>`; btns = `<button class="btn primary full lg" onclick="openIntro('${start}')">Bắt đầu học</button><button class="btn full" onclick="nav('road')">Xem lộ trình</button>`;
  }
  const gained = P.xp + bonus; if (gained) addXP(gained);
  const skr = Object.keys(P.sk).length ? `<div class="card skbox">${Object.keys(P.sk).map(x => { const v = P.sk[x], p = Math.round(v[0] / v[1] * 100); return `<div class="skrow"><i class="ti ti-${SKI[x]}"></i><span class="skn">${SK[x]}</span><div class="bar grow"><span style="width:${p}%"></span></div><b>${v[0]}/${v[1]}</b></div>`; }).join("")}</div>` : "";
  const ok = sc >= 80 || k === "review" || k === "mist" || k === "place";
  P = null; save();
  app().innerHTML = `<div class="done"><div class="ring xl" style="--p:${k === "place" ? 100 : sc}"><span>${k === "place" ? '<i class="ti ti-clipboard-check"></i>' : sc + "%"}</span></div>${h}${gained ? `<p class="xpbig">+${gained} XP</p>` : ""}${skr}<div class="stack">${btns}</div></div>`;
  document.body.classList.add("playing");
  if (ok) { beep("done"); if (sc >= 80 && k !== "place") confetti(); }
  checkBadges(); checkDay();
}

/* ---------- Bàn phím ---------- */
document.addEventListener("keydown", e => {
  if (!P) return;
  const t = e.target.tagName;
  if (e.key === "Enter" && !e.shiftKey) {
    const nb = $("#nextb"); if (nb && $("#fb.on")) { e.preventDefault(); nb.click(); return; }
    const s = P.steps[P.i]; if (t === "TEXTAREA" && s && s.type !== "write") { e.preventDefault(); const c = $("#chk"); if (c) c.click(); return; }
  }
  if (t === "TEXTAREA" || t === "INPUT") return;
  if (/^[1-6]$/.test(e.key)) { const b = $("#o" + (+e.key - 1)); if (b && !b.disabled) b.click(); }
  if (e.key === " " || e.key === "r") { const s = P.steps[P.i]; const a = s && (s.audio || s.en); if (a) { e.preventDefault(); say(a); } }
});

/* ---------- Cài đặt app (PWA) ---------- */
let installEvt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; if (!P && !VIEW) render(); });
function doInstall() { if (!installEvt) return; installEvt.prompt(); installEvt.userChoice.finally(() => { installEvt = null; render(); }); }
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  const hadSW = !!navigator.serviceWorker.controller;
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadSW) toast("Ứng dụng vừa được cập nhật phiên bản mới"); });
}
if (window.matchMedia) try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => applyTheme()); } catch (e) {}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") last = Date.now(); });
/* Không để số tách khỏi đơn vị khi xuống dòng */
const NB1 = /(\d+(?:[.,]\d+)?%?)\s(phút|giờ|câu|từ|bài|ngày|tháng|năm|thẻ|lượt|cặp|XP|lần|chặng|cây|lỗi|đơn|trên)/g, NB2 = /(Chặng|Bài|Cấp|Bước|câu|chặng|bài|Đơn)\s(\d)/g;
function keepTogether(root) { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const t = n.nodeValue; if (/\d/.test(t)) { const u = t.replace(NB1, "$1\u00a0$2").replace(NB2, "$1\u00a0$2"); if (u !== t) n.nodeValue = u; } } }
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(x => { if (x.nodeType === 1) keepTogether(x); else if (x.nodeType === 3 && x.parentNode) keepTogether(x.parentNode); }))).observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener("DOMContentLoaded", render);
