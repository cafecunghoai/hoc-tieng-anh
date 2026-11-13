"use strict";
/* ================== Trò chơi ================== */
let G = null;
function gs() { return S.game || (S.game = { best: {}, post: {}, plays: 0, gardenSeen: 0 }); }
function gamePool(min) {
  let p = Object.keys(S.cards).map(k => WMAP[k]).filter(Boolean);
  if (p.length < (min || 12)) { const extra = ALLW.filter(w => isOpen(w.lid) && !S.cards[w.en]); p = p.concat(extra); }
  if (p.length < (min || 12)) p = p.concat(ALLW.filter(w => w.lid.startsWith("a1-")).slice(0, 60));
  return [...new Map(p.filter(w => !/^-|-$/.test(w.en)).map(w => [w.en, w])).values()];
}
function exitGame() { G = null; nav("play"); } // nav() tự tải lại nếu đang chờ bản cập nhật
const gTop = (title, right) => `<div class="ptop"><button class="ib" onclick="exitGame()" aria-label="Thoát"><i class="ti ti-x"></i></button><b class="grow gtitle">${title}</b>${right || ""}</div>`;
function gameEnd(icon, title, msg, xp, again, win = true) {
  tick(); if (xp) addXP(xp); gs().plays++; save();
  app().innerHTML = `<div class="donescr${win ? "" : " fail"}"><div class="gend">${icon}</div><h1>${title}</h1><p class="muted">${msg}</p>${xp ? `<p class="xpbig">+${xp} XP</p>` : ""}<div class="stack"><button class="btn primary full lg" onclick="${again}">Chơi lại</button><button class="btn full" onclick="exitGame()">Về trang trò chơi</button></div></div>`;
  if (win) { beep("done"); confetti(); } checkBadges(); checkDay();
}

/* ---------- Trang trò chơi ---------- */
function vPlay() {
  const g = gs(), n = Object.keys(S.cards).length, dry = dueCards().length;
  const card = (fn, emo, t, d, meta, col) => `<button class="gcard ${col}" onclick="${fn}"><span class="gemo">${emo}</span><span class="grow"><b>${t}</b><small>${d}</small>${meta ? `<em>${meta}</em>` : ""}</span><i class="ti ti-chevron-right"></i></button>`;
  app().innerHTML = `<header class="page"><h1>Trò chơi</h1><p class="muted">Vừa chơi vừa nhớ lại từ đã học.<br>Mỗi trò rèn một kỹ năng riêng.</p></header>
  ${card("openGarden()", "🌱", "Vườn từ vựng", "Mỗi từ là một cây. Ôn đúng thì cây lớn và kết trái.", n ? `${n} cây · ${dry ? dry + " cây cần tưới" : "vườn xanh tốt"}` : "Học bài đầu tiên để gieo hạt", "g1")}
  ${card("startMarket()", "🧺", "Phiên chợ quê", "Nghe khách gọi hàng bằng tiếng Anh, nhặt đúng món, đúng số lượng.", g.best.market ? `Kỷ lục: ${g.best.market}/8 đơn` : "Luyện nghe · số đếm · đồ ăn", "g2")}
  ${card("openJourney()", "🚌", "Chuyến xe về quê", "Trả lời đúng để xe lăn bánh qua từng tỉnh, nhận bưu thiếp mỗi chặng.", Object.keys(g.post).length ? `${Object.keys(g.post).length} bưu thiếp đã nhận` : "Về miền Tây · Xuyên Việt", "g3")}
  ${card("startMemory()", "🎴", "Lật thẻ hội chợ", "Lật thẻ ghép từ tiếng Anh với nghĩa tiếng Việt.", g.best.memory ? `Kỷ lục: ${g.best.memory} lượt` : "Luyện trí nhớ · từ vựng", "g4")}
  <p class="note">Trò chơi dùng các từ trong kho ôn tập của bạn. Học càng nhiều bài, trò chơi càng phong phú.</p>`;
}

/* ---------- 1. Vườn từ vựng ---------- */
const FRUITS = ["🍊", "🥭", "🍅", "🍓", "🍋", "🍑", "🍐", "🍇"];
function plantOf(w, c) { const h = [...w].reduce((a, ch) => a + ch.charCodeAt(0), 0); return c.box >= 6 ? FRUITS[h % FRUITS.length] : c.box >= 4 ? ["🌷", "🌻", "🌼", "🌸"][h % 4] : c.box >= 2 ? "🌿" : "🌱"; }
function openGarden() {
  VIEW = () => {
    const ks = Object.keys(S.cards), now = Date.now(), due = ks.filter(k => S.cards[k].due <= now);
    const cnt = [0, 0, 0, 0]; ks.forEach(k => { const b = S.cards[k].box; cnt[b >= 6 ? 3 : b >= 4 ? 2 : b >= 2 ? 1 : 0]++; });
    const list = ks.sort((a, b) => (S.cards[b].due <= now) - (S.cards[a].due <= now) || S.cards[b].box - S.cards[a].box).slice(0, 240);
    app().innerHTML = gTop("Vườn từ vựng") + (ks.length ? `
    <div class="garden-sky"><div class="gstats">${[["🌱", "Mầm", cnt[0]], ["🌿", "Cây non", cnt[1]], ["🌷", "Ra hoa", cnt[2]], ["🍊", "Kết trái", cnt[3]]].map(x => `<div><span>${x[0]}</span><b>${x[2]}</b><small>${x[1]}</small></div>`).join("")}</div></div>
    ${due.length ? `<button class="btn primary full lg" onclick="startReview()"><i class="ti ti-droplet"></i> ${due.length > 20 ? `Tưới 20 cây (trong số ${due.length} cây khô)` : `Tưới ${due.length} cây đang khô`}</button>` : `<div class="card flat c"><b>Vườn xanh tốt!</b><span class="sm muted">Không có cây nào cần tưới hôm nay.</span></div>`}
    <p class="sm muted">Bấm vào cây để nghe từ.<br>Cây có 💧 là từ đã đến hạn ôn.</p>
    <div class="garden">${list.map(k => { const c = S.cards[k], d = c.due <= now; return `<button class="plot ${d ? "dry" : ""}" onclick="plantInfo('${jsq(k)}')" title="${esc(k)}"><span>${plantOf(k, c)}</span>${d ? "<em>💧</em>" : ""}<small lang="en" class="${k.length > 9 && !k.includes(" ") ? "lw" : ""}">${esc(k)}</small></button>`; }).join("")}</div>
    ${ks.length > 240 ? `<p class="note">Đang hiện 240 cây. Xem đủ trong Sổ tay.</p>` : ""}` : `<div class="empty"><span class="gemo xl">🌰</span><h2>Vườn còn trống</h2><p class="muted">Học xong một bài, mỗi từ mới sẽ thành một hạt giống trong vườn.</p><button class="btn primary full lg" onclick="goNext()">Đi học bài đầu tiên</button></div>`);
  };
  render();
}
function plantInfo(k) {
  const c = S.cards[k], w = WMAP[k] || { vi: c.vi }, d = Math.ceil((c.due - Date.now()) / DAY);
  say(k);
  modal(`${plantOf(k, c)} ${esc(k)}`, `<span class="big2">${esc(w.vi)}</span><br><span class="sm muted">${c.due <= Date.now() ? "Đã đến hạn ôn, cây đang khô." : "Ôn lại sau " + d + " ngày."}<br>Mức nhớ:&nbsp;${c.box}/7</span>`, "Nghe lại", () => { say(k); return false; }, false, "Đóng");
}

/* ---------- 2. Phiên chợ quê ---------- */
const ITEMS = [["mango", "mangoes", "🥭", "xoài"], ["banana", "bananas", "🍌", "chuối"], ["apple", "apples", "🍎", "táo"], ["orange", "oranges", "🍊", "cam"], ["coconut", "coconuts", "🥥", "dừa"], ["watermelon", "watermelons", "🍉", "dưa hấu"], ["egg", "eggs", "🥚", "trứng"], ["fish", "fish", "🐟", "cá"], ["chicken", "chickens", "🐔", "gà"], ["tomato", "tomatoes", "🍅", "cà chua"], ["carrot", "carrots", "🥕", "cà rốt"], ["pineapple", "pineapples", "🍍", "dứa"], ["lemon", "lemons", "🍋", "chanh"], ["potato", "potatoes", "🥔", "khoai tây"], ["onion", "onions", "🧅", "hành tây"], ["cucumber", "cucumbers", "🥒", "dưa leo"]];
const NUMW = ["", "one", "two", "three", "four", "five"];
const CUST = ["👵", "👨‍🌾", "👩", "🧑", "👴", "👩‍🍳", "🧒", "👨"];
function startMarket() { last = Date.now(); G = { k: "market", round: 0, ok: 0, labels: true, items: [] }; VIEW = mView; newOrder(); render(); }
function newOrder() {
  const stall = pick(ITEMS, 8), two = G.round >= 3, want = pick(stall, two ? 2 : 1).map(it => ({ it, q: 1 + Math.floor(Math.random() * (two ? 3 : 5)) }));
  const ph = want.map(x => NUMW[x.q] + " " + (x.q > 1 ? x.it[1] : x.it[0]));
  const tpl = pick(["Can I have #, please?", "I'd like #, please.", "#, please.", "Could I have #?", "I need #, please."], 1)[0];
  G.stall = stall; G.want = want; G.basket = {}; G.text = tpl.replace("#", ph.join(" and ")).replace(/^./, c => c.toUpperCase()); G.cust = pick(CUST, 1)[0]; G.shown = false; G.res = null;
  const tx = G.text; setTimeout(() => { if (G && G.text === tx) say(tx); }, 400);
}
function mView() {
  const b = G.basket, bl = Object.keys(b).filter(k => b[k] > 0);
  app().innerHTML = gTop("Phiên chợ quê", `<span class="pill">Đơn ${G.round + 1}/8 · đúng ${G.ok}</span>`) + `
  <div class="market"><div class="customer"><span class="cust">${G.cust}</span><div class="bubble">${G.shown || G.res ? `<p>${esc(G.text)}</p>` : `<p class="muted">Bấm loa để nghe khách gọi hàng</p>`}<div class="row">${spk(G.text)}<button class="link" onclick="say(G.text,1)"><i class="ti ti-snail"></i> Chậm</button>${G.shown || G.res ? "" : `<button class="link" onclick="G.shown=true;render()"><i class="ti ti-eye"></i> Hiện chữ</button>`}</div></div></div>
  <div class="row between"><p class="lab">Quầy hàng của bạn</p><label class="tg sm">Hiện tên <input type="checkbox" ${G.labels ? "checked" : ""} onchange="G.labels=this.checked;render()"></label></div>
  <div class="stall">${G.stall.map((it, i) => `<button class="good" onclick="mAdd(${i})" ${G.res ? "disabled" : ""}><span>${it[2]}</span>${G.labels ? `<small>${it[0]}</small>` : ""}${b[it[0]] ? `<em>${b[it[0]]}</em>` : ""}</button>`).join("")}</div>
  <p class="lab">Giỏ hàng ${bl.length ? "· bấm món để bớt" : ""}</p><div class="basket">${bl.length ? bl.map(k => { const it = ITEMS.find(x => x[0] === k); return `<button class="chip" onclick="mDel('${k}')" ${G.res ? "disabled" : ""}>${it[2]} × ${b[k]}</button>`; }).join("") : `<span class="muted sm">Chưa có món nào</span>`}</div>
  ${G.res ? `<div class="mres ${G.res.ok ? "good" : "bad"}"><b>${G.res.ok ? "Giao đúng! Khách rất vui 😊" : "Chưa đúng rồi"}</b>${G.res.ok ? "" : `<p>Khách cần: ${G.want.map(x => x.it[2] + " " + x.it[0] + " × " + x.q).join(", ")}</p>`}<p class="sm">${esc(G.text)}</p></div><button class="btn primary full lg" onclick="mNext()">${G.round >= 7 ? "Xem kết quả" : "Khách tiếp theo"}</button>` : `<button class="btn primary full lg" onclick="mCheck()" ${bl.length ? "" : "disabled"}><i class="ti ti-basket"></i> Giao hàng</button>`}</div>`;
}
function mAdd(i) { const it = G.stall[i]; G.basket[it[0]] = Math.min(9, (G.basket[it[0]] || 0) + 1); say(it[0]); render(); }
function mDel(k) { G.basket[k]--; render(); }
function mCheck() {
  const b = G.basket, need = {}; G.want.forEach(x => need[x.it[0]] = x.q);
  const ok = Object.keys(need).every(k => b[k] === need[k]) && Object.keys(b).filter(k => b[k] > 0).every(k => need[k]);
  if (G.res) return; tick(); G.res = { ok }; G.resAt = Date.now(); if (ok) G.ok++; beep(ok ? "good" : "bad"); addSkill("listen", ok); render();
}
function mNext() { if (!G.res || Date.now() - (G.resAt || 0) < 500) return; G.round++; if (G.round >= 8) { const g = gs(); g.best.market = Math.max(g.best.market || 0, G.ok); if (G.ok === 8) g.best.marketPerfect = 1; const ok = G.ok; VIEW = null; return gameEnd("🧺", ok >= 6 ? "Bán hàng giỏi quá!" : "Hết phiên chợ", `Bạn giao đúng ${ok}/8 đơn hàng.${ok < 8 ? "<br>Mẹo: nghe chậm và để ý số lượng nhé." : ""}`, ok * 8, "startMarket()", ok >= 6); } newOrder(); render(); }

/* ---------- 3. Chuyến xe về quê ---------- */
const ROUTES = {
  tay: { n: "Về miền Tây", e: "🌾", d: "Từ Sài Gòn về nhà ngoại", stops: [["Sài Gòn", "Ho Chi Minh City is the biggest city in Vietnam.", "Thành phố Hồ Chí Minh là thành phố lớn nhất Việt Nam."], ["Long An", "Long An is the gateway to the Mekong Delta.", "Long An là cửa ngõ vào đồng bằng sông Cửu Long."], ["Tiền Giang", "Tien Giang has many fruit gardens.", "Tiền Giang có rất nhiều vườn trái cây."], ["Bến Tre", "Ben Tre is the land of coconuts.", "Bến Tre là xứ dừa."], ["Vĩnh Long", "Vinh Long has green islands on the river.", "Vĩnh Long có những cù lao xanh trên sông."], ["Cần Thơ", "Can Tho has the famous Cai Rang floating market.", "Cần Thơ có chợ nổi Cái Răng nổi tiếng."], ["Nhà ngoại", "Welcome home! Grandma is waiting for you.", "Về tới nhà rồi! Bà ngoại đang chờ bạn."]] },
  xv: { n: "Xuyên Việt", e: "🏮", d: "Từ Hà Nội vào Sài Gòn", stops: [["Hà Nội", "Hanoi is the capital of Vietnam.", "Hà Nội là thủ đô của Việt Nam."], ["Ninh Bình", "Ninh Binh has beautiful mountains and rivers.", "Ninh Bình có núi non và sông nước tuyệt đẹp."], ["Huế", "Hue was the capital for more than a hundred years.", "Huế từng là kinh đô hơn một trăm năm."], ["Đà Nẵng", "Da Nang has long and beautiful beaches.", "Đà Nẵng có những bãi biển dài và đẹp."], ["Hội An", "Hoi An is famous for its colorful lanterns.", "Hội An nổi tiếng với những chiếc đèn lồng rực rỡ."], ["Đà Lạt", "Da Lat is cool all year round.", "Đà Lạt mát mẻ quanh năm."], ["Sài Gòn", "Saigon is busy, young and full of energy.", "Sài Gòn nhộn nhịp, trẻ trung và tràn đầy năng lượng."]] }
};
function openJourney() {
  VIEW = () => {
    const g = gs();
    app().innerHTML = gTop("Chuyến xe về quê") + `<p class="muted">Trả lời đúng 3&nbsp;câu thì xe chạy tới điểm dừng tiếp theo. Bạn có 3 trái tim; mỗi điểm dừng tặng một tấm bưu&nbsp;thiếp tiếng&nbsp;Anh.</p>
    ${Object.keys(ROUTES).map(k => { const r = ROUTES[k], got = r.stops.filter(s => g.post[k + ":" + s[0]]).length; return `<button class="gcard ${k === "tay" ? "g3" : "g2"}" onclick="startJourney('${k}')"><span class="gemo">${r.e}</span><span class="grow"><b>${r.n}</b><small>${r.d} · ${r.stops.length} điểm dừng</small><em>${got}/${r.stops.length} bưu thiếp${g.best["j_" + k] ? " · đã về đích" : ""}</em></span><i class="ti ti-chevron-right"></i></button>`; }).join("")}
    ${Object.keys(g.post).length ? `<h4 class="sec">Bộ sưu tập bưu thiếp</h4><div class="posts">${Object.keys(ROUTES).flatMap(k => ROUTES[k].stops.filter(s => g.post[k + ":" + s[0]]).map(s => `<button class="post" onclick="say('${jsq(s[1])}')"><b>${s[0]}</b><span>${esc(s[1])}</span></button>`)).join("")}</div>` : ""}`;
  };
  render();
}
function startJourney(k) { last = Date.now(); G = { k: "journey", r: k, leg: 0, q: 0, hearts: 3, post: false }; G.pool = gamePool(12); jQuestion(); VIEW = jView; render(); }
function jQuestion() { const w = pick(G.pool, 1)[0], t = Math.floor(Math.random() * 3); G.cur = t === 0 ? mqMeaning(w, G.pool) : t === 1 ? mqListen(w, G.pool) : mqReverse(w, G.pool); G.picked = null; if (G.cur.autoplay) { const a = G.cur.audio; setTimeout(() => { if (G && G.cur && G.cur.audio === a) say(a); }, 350); } }
function jView() {
  const R = ROUTES[G.r], n = R.stops.length, pos = (G.leg + (G.post ? 0 : G.q / 3)) / (n - 1) * 100;
  const road = `<div class="road"><div class="track"><span style="width:${pos}%"></span></div>${R.stops.map((s, i) => `<div class="stop ${i <= G.leg ? "on" : ""}" style="left:${i / (n - 1) * 100}%"><i></i><small>${s[0]}</small></div>`).join("")}<div class="bus" style="left:${pos}%">🚌</div></div>`;
  const hearts = `<span class="hearts">${[0, 1, 2].map(i => `<i class="ti ti-heart ${i < G.hearts ? "on" : ""}"></i>`).join("")}</span>`;
  if (G.post) {
    const s = R.stops[G.leg];
    app().innerHTML = gTop(R.n, hearts) + road + `<div class="postcard"><p class="tag">Bưu thiếp · ${s[0]}</p><h2>${esc(s[1])}</h2><p class="muted">${esc(s[2])}</p><div class="row">${spk(s[1])}<button class="link" onclick="say('${jsq(s[1])}',1)"><i class="ti ti-snail"></i> Nghe chậm</button></div></div>
    <button class="btn primary full lg" onclick="jGo()">${G.leg >= n - 1 ? "Kết thúc chuyến đi" : "Đi tiếp tới " + R.stops[G.leg + 1][0]}</button>`;
    if (!G.said) { G.said = 1; setTimeout(() => { if (G && G.post) say(s[1]); }, 300); } return;
  }
  const c = G.cur;
  app().innerHTML = gTop(R.n, hearts) + road + `<p class="lab">Đang trên đường tới <b>${R.stops[G.leg + 1][0]}</b> · câu ${G.q + 1}/3</p>` +
    (c.q ? `<h2 class="q ${c.vq ? "vi" : ""}">${esc(c.q)}</h2>` : `<div class="c">${spk(c.audio, "xl")}</div>`) + (c.q && c.audio ? `<div class="c">${spk(c.audio)}</div>` : "") +
    `<p class="c muted sm">${c.label}</p><div class="opts">${c.o.map((o, i) => `<button class="opt ${G.picked !== null ? (i === c.a ? "right" : i === G.picked ? "wrong" : "") : ""}" ${G.picked !== null ? "disabled" : ""} onclick="jPick(${i})">${esc(o)}</button>`).join("")}</div>
    ${G.picked !== null ? `<button class="btn primary full lg" onclick="jNext()">${G.picked === c.a ? "Xe chạy tiếp 🚌" : G.hearts > 0 ? "Thử câu khác" : "Xem kết quả"}</button>` : ""}`;
}
function jPick(i) { if (G.picked !== null) return; tick(); G.picked = i; const ok = i === G.cur.a; beep(ok ? "good" : "bad"); if (!ok) G.hearts--; else if (G.cur.sayAns) say(G.cur.o[G.cur.a]); render(); }
function jNext() {
  const ok = G.picked === G.cur.a;
  if (!ok && G.hearts <= 0) { const R = ROUTES[G.r]; VIEW = null; return gameEnd("🛠️", "Xe bị hỏng giữa đường!", `Bạn đã đi được ${G.leg}/${R.stops.length - 1} chặng.<br>Ôn lại từ vựng rồi lên đường lần nữa nhé.`, G.leg * 10, `startJourney('${G.r}')`, false); }
  if (ok) { G.q++; if (G.q >= 3) { G.leg++; G.q = 0; G.post = true; gs().post[G.r + ":" + ROUTES[G.r].stops[G.leg][0]] = 1; save(); beep("done"); return render(); } }
  jQuestion(); render();
}
function jGo() {
  const R = ROUTES[G.r];
  if (G.leg >= R.stops.length - 1) { gs().best["j_" + G.r] = 1; gs().post[G.r + ":" + R.stops[0][0]] = 1; VIEW = null; return gameEnd(R.e, G.r === "tay" ? "Về tới nhà ngoại rồi!" : "Hoàn thành chuyến xuyên Việt!", `Bạn đã đi hết ${R.stops.length - 1} chặng và nhận đủ bưu thiếp.`, 80, `startJourney('${G.r}')`); }
  G.post = false; G.said = 0; jQuestion(); render();
}

/* ---------- 4. Lật thẻ hội chợ ---------- */
function startMemory() {
  const ws = [], seenVi = new Set(); shuffle(gamePool(6)).forEach(w => { if (ws.length < 6 && !seenVi.has(w.vi)) { seenVi.add(w.vi); ws.push(w); } }); const cards = [];
  ws.forEach((w, i) => { cards.push({ p: i, t: w.en, en: 1 }); cards.push({ p: i, t: w.vi, en: 0, w: w.en }); });
  last = Date.now(); G = { k: "memory", cards: shuffle(cards), open: [], done: {}, moves: 0, t0: Date.now(), lock: false };
  VIEW = memView; render();
}
function memView() {
  const m = Object.keys(G.done).length;
  app().innerHTML = gTop("Lật thẻ hội chợ", `<span class="pill">${G.moves} lượt · ${m}/6 cặp</span>`) + `<p class="muted sm">Lật hai thẻ: một từ tiếng Anh và nghĩa tiếng Việt của nó.</p>
  <div class="mem">${G.cards.map((c, i) => { const up = G.open.includes(i) || G.done[c.p]; return `<button class="mcard ${up ? "up" : ""} ${G.done[c.p] ? "ok" : ""} ${c.en ? "en" : "vi"}" onclick="memFlip(${i})" aria-label="Thẻ ${i + 1}"><span class="back">🏮</span><span class="face">${esc(c.t)}</span></button>`; }).join("")}</div>`;
}
function memFlip(i) {
  if (G.lock || G.open.includes(i) || G.done[G.cards[i].p]) return;
  const c = G.cards[i]; G.open.push(i); if (c.en) say(c.t); tick();
  if (G.open.length === 2) {
    G.moves++; const [a, b] = G.open.map(x => G.cards[x]);
    if (a.p === b.p) { G.done[a.p] = 1; G.open = []; beep("good"); if (!a.en) say(b.t); if (Object.keys(G.done).length === 6) { render(); const me = G; return setTimeout(() => { if (G === me) memEnd(); }, 600); } }
    else { G.lock = true; const me = G; setTimeout(() => { if (G !== me) return; G.open = []; G.lock = false; render(); }, 900); beep("bad"); }
  }
  render();
}
function memEnd() {
  const mv = G.moves, st = mv <= 9 ? 3 : mv <= 13 ? 2 : 1, g = gs(); g.best.memory = Math.min(g.best.memory || 99, mv); if (st === 3) g.best.memory3 = 1; VIEW = null;
  gameEnd("⭐".repeat(st), st === 3 ? "Trí nhớ siêu đẳng!" : "Ghép xong hết rồi!", `Bạn ghép 6 cặp trong ${mv} lượt, mất ${Math.round((Date.now() - G.t0) / 1000)} giây.`, 10 + st * 10, "startMemory()");
}
