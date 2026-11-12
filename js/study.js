"use strict";
/* ================== Ngữ pháp và Thi thử ================== */
const LV = ["A1", "A2", "B1", "B2", "C1"];
const SECN = { listen: "Nghe", read: "Đọc", use: "Ngữ pháp, từ vựng", write: "Viết", speak: "Nói" };
const SECI = { listen: "headphones", read: "book", use: "abc", write: "pencil", speak: "microphone" };
const GT = {}; if (typeof GRAMMAR !== "undefined") GRAMMAR.forEach(T => GT[T.id] = T);

/* ---------- Tiện ích ---------- */
const blankHtml = q => esc(q).replace(/_{3,}/g, '<span class="blank">&nbsp;</span>');
const fmtTime = ms => { ms = Math.max(0, ms); const m = Math.floor(ms / 60000), s = Math.floor(ms % 60000 / 1000); return m + ":" + String(s).padStart(2, "0"); };
function diffHtml(user, target) {
  const a = user.trim().split(/\s+/), b = target.trim().split(/\s+/), na = a.map(norm), nb = b.map(norm);
  const m = a.length, n = b.length, t = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) t[i][j] = na[i] === nb[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  let i = 0, j = 0, out = [];
  while (i < m && j < n) { if (na[i] === nb[j]) { out.push(`<span>${esc(b[j])}</span>`); i++; j++; } else if (t[i + 1][j] >= t[i][j + 1]) { out.push(`<span class="dx">${esc(a[i])}</span>`); i++; } else { out.push(`<span class="dm">${esc(b[j])}</span>`); j++; } }
  while (i < m) out.push(`<span class="dx">${esc(a[i++])}</span>`); while (j < n) out.push(`<span class="dm">${esc(b[j++])}</span>`);
  return `<p class="diff">${out.join(" ")}</p>`;
}
function gStep(str, T) {
  const p = str.split("|"), ty = p[0], base = { sk: "gram", why: p[4], gi: str, gt: T && T.id };
  if (ty === "c") { const o = shuffle([p[2]].concat(p[3].split(";"))); return Object.assign(base, { type: "mcq", label: "Chọn đáp án đúng", q: p[1], blank: 1, o, a: o.indexOf(p[2]) }); }
  if (ty === "f") return Object.assign(base, { type: "gf", q: p[1], en: p[2], alts: p[3] ? p[3].split(";") : [] });
  if (ty === "e") return Object.assign(base, { type: "ge", q: p[1], bad: p[2], fix: undefined, corr: p[3] });
  return Object.assign(base, { type: "gr", q: p[1], en: p[2], alts: p[3] ? p[3].split(";") : [] });
}
const accept = (v, s) => [s.en].concat(s.alts || []).some(x => compare(v, x) === 2);

/* ---------- Các dạng bài ngữ pháp ---------- */
function rGf(s) { return `<p class="lab"><i class="ti ti-abc"></i> Ngữ pháp · Điền vào chỗ trống</p><h2 class="q gq">${blankHtml(s.q)}</h2><input id="inp" class="inp" placeholder="Gõ từ cần điền" autocomplete="off" autocapitalize="off" spellcheck="false" oninput="$('#er').textContent=''" onkeydown="if(event.key==='Enter'){event.preventDefault();event.stopPropagation();checkGf()}"><p class="err" id="er"></p><button class="btn primary full" id="chk" onclick="checkGf()">Kiểm tra</button>`; }
function checkGf() { const s = P.steps[P.i], v = $("#inp").value.trim(); if (!v) { $("#er").textContent = "Hãy gõ câu trả lời trước."; return; } $("#er").textContent = ""; $("#chk").remove(); $("#inp").disabled = true; const ok = accept(v, s); grade(ok, esc(s.en) + `<br><span class="muted">${esc(s.q.replace(/_{3,}(\s*\([^)]*\))?/, s.en).replace(/\s*\([^)]*\)\s*$/, "").replace(/\s*Dùng be going to\.$/, ""))}</span>`); }
function rGe(s) {
  s.toks = s.q.split(" ");
  return `<p class="lab"><i class="ti ti-abc"></i> Ngữ pháp · Tìm từ sai trong câu</p><p class="muted sm">Bấm vào từ (hoặc cụm từ) bị sai.</p><div class="etoks">${s.toks.map((t, i) => `<button class="etok" id="t${i}" onclick="pickGe(${i})">${esc(t)}</button>`).join("")}</div>`;
}
function geRange(s, bad) { const seg = (bad || s.bad.split("||")[0]).split(" "); for (let i = 0; i < s.toks.length; i++) if (seg.every((x, j) => (s.toks[i + j] || "").replace(/[.,!?]$/, "") === x)) return [i, i + seg.length]; return [-1, -1]; }
function pickGe(k) {
  const s = P.steps[P.i]; if (P.ans) return; const [a, b] = geRange(s), ok = s.bad.split("||").some(bd => { const [x, y] = geRange(s, bd); return k >= x && k < y; });
  $$(".etok").forEach(x => x.disabled = true); if (P.kind !== "mock") for (let i = a; i < b; i++) $("#t" + i).classList.add("bad"); if (!ok && P.kind !== "mock") $("#t" + k).classList.add("pick");
  // dấu câu dính ở cuối cụm sai (rains, / cat. / advice?) được giữ lại sau phần sửa
  const tail = ((s.toks[b - 1] || "").match(/[.,!?]+$/) || [""])[0], del = s.corr.startsWith("("), corr = del ? "" : s.corr + (/[.,!?]$/.test(s.corr) ? "" : tail);
  let fixed = s.toks.slice(0, a).concat(corr ? [corr] : [], s.toks.slice(b)).join(" ").replace(/\s+([.,!?])/g, "$1");
  if (del && tail && !/[.,!?]$/.test(fixed)) fixed += tail;
  if (P.kind !== "mock") $(".etoks").insertAdjacentHTML("afterend", `<p class="geleg sm"><span class="lg bad">Từ sai ở đây</span>${ok ? "" : `<span class="lg pick">Bạn chọn</span>`}</p><p class="corr"><i class="ti ti-check"></i> ${esc(fixed)}</p>`);
  grade(ok, `<s>${esc(s.bad.split("||")[0])}</s> → ${esc(s.corr)}`);
}
function rGr(s) { const k = s.q.indexOf(":"); const ins = k > 0 ? s.q.slice(0, k) : "Viết lại câu", src = k > 0 ? s.q.slice(k + 1).trim() : s.q; return `<p class="lab"><i class="ti ti-abc"></i> Ngữ pháp · ${esc(ins)}</p><h2 class="q gq">${esc(src)}</h2><textarea id="inp" rows="2" placeholder="Viết câu của bạn" autocapitalize="sentences" autocomplete="off" spellcheck="false" oninput="$('#er').textContent=''"></textarea><p class="err" id="er"></p><button class="btn primary full" id="chk" onclick="checkGr()">Kiểm tra</button>`; }
function checkGr() { const s = P.steps[P.i], v = $("#inp").value.trim(); if (!v) { $("#er").textContent = "Hãy viết câu trả lời trước."; return; } $("#er").textContent = ""; $("#chk").remove(); $("#inp").disabled = true; const ok = accept(v, s); if (!ok) $("#inp").insertAdjacentHTML("afterend", `<div class="diffbox"><p class="lab">So với đáp án</p>${diffHtml(v, s.en)}</div>`); grade(ok, esc(s.en)); }

/* ---------- Trang Ngữ pháp ---------- */
let GLV = null;
function curLevel() { const n = nextLesson(); const st = n ? LES[n].stage : "c1"; return { s0: "A1", a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1" }[st]; }
function vGram() {
  if (!GLV) GLV = curLevel();
  const list = GRAMMAR.filter(T => T.lv === GLV), done = list.filter(T => (S.gram[T.id] || 0) >= 80).length;
  app().innerHTML = `<header class="page"><h1>Ngữ pháp</h1><p class="muted">${GRAMMAR.length} chủ điểm từ A1 đến C1.<br>Mỗi chủ điểm có giải thích và 8 câu luyện.</p></header>
  <div class="seg big">${LV.map(l => `<button class="${GLV === l ? "on" : ""}" onclick="GLV='${l}';render()">${l}</button>`).join("")}</div>
  <div class="card flat glv"><div class="row between"><b>Cấp ${GLV}</b><span class="sm muted">Đã vững ${done}/${list.length} chủ điểm</span></div><div class="bar sm"><span style="width:${list.length ? done / list.length * 100 : 0}%"></span></div><p class="sm muted">Một chủ điểm được tính là vững khi bạn đạt từ 80%.</p><button class="btn full" onclick="startGramQuiz('${GLV}')"><i class="ti ti-clipboard-check"></i> Kiểm tra nhanh 15 câu cấp ${GLV}</button></div>
  <div class="topics">${list.map((T, i) => { const b = S.gram[T.id]; return `<button class="topic" onclick="openTopic('${T.id}')"><span class="tn ${b >= 80 ? "ok" : ""}">${b >= 80 ? '<i class="ti ti-check"></i>' : i + 1}</span><span class="grow"><b>${esc(T.t)}</b><small>${esc(T.sum)}</small></span><span class="sc">${b !== undefined ? b + "%" : '<i class="ti ti-chevron-right"></i>'}</span></button>`; }).join("")}</div>`;
}
function openTopic(id) {
  const T = GT[id]; if (!T) return nav("gram");
  VIEW = () => {
    const L = LES[T.lesson], b = S.gram[id], i = GRAMMAR.indexOf(T), next = GRAMMAR[i + 1];
    app().innerHTML = `<div class="ptop"><button class="ib" onclick="nav('gram')" aria-label="Quay lại"><i class="ti ti-arrow-left"></i></button><span class="muted sm">Ngữ pháp · ${T.lv}</span></div>
    <div class="intro"><h1>${esc(T.t)}</h1><p class="muted">${esc(T.sum)}</p>${b !== undefined ? `<p class="pill ${b >= 80 ? "good" : ""}">Điểm cao nhất: ${b}%</p>` : ""}
    <div class="gram">${L ? L.g : ""}</div>
    <div class="card flat"><p class="lab">Bài luyện gồm</p><div class="skills"><span><i class="ti ti-list-check"></i>Chọn đáp án</span><span><i class="ti ti-forms"></i>Điền từ</span><span><i class="ti ti-zoom-exclamation"></i>Tìm lỗi sai</span><span><i class="ti ti-refresh"></i>Viết lại câu</span></div></div>
    <button class="btn primary full lg" onclick="startTopic('${id}')"><i class="ti ti-player-play"></i> Luyện tập 8 câu</button>
    ${L && isOpen(L.id) ? `<button class="btn full" onclick="openIntro('${L.id}')"><i class="ti ti-book"></i> Bài học liên quan: ${esc(L.t)}</button>` : ""}
    ${next ? `<button class="link" onclick="openTopic('${next.id}')">Chủ điểm tiếp theo: ${esc(next.t)} <i class="ti ti-arrow-right"></i></button>` : ""}</div>`;
  };
  P = null; render(); window.scrollTo(0, 0);
}
function startTopic(id) { const T = GT[id]; const steps = T.items.map(x => gStep(x, T)); newP("gram", shuffle(steps.filter(s => s.type === "mcq")).concat(steps.filter(s => s.type === "gf"), steps.filter(s => s.type === "ge"), steps.filter(s => s.type === "gr")), { gid: id, title: T.t }); }
function startGramQuiz(lv) { const its = GRAMMAR.filter(T => T.lv === lv).flatMap(T => T.items.map(x => [x, T])); newP("gram", pick(its, 15).map(x => gStep(x[0], x[1])), { title: "Kiểm tra ngữ pháp " + lv, quiz: lv }); }

function failWhy(o, sk) {
  const r = [], low = Object.keys(sk).filter(x => sk[x] < 40);
  if (o < 60) r.push(`Điểm trung bình còn thiếu <b>${Math.max(1, Math.ceil(60 - o))}%</b> để đạt 60%.`); sk = Object.fromEntries(Object.entries(sk).map(([k, v]) => [k, Math.floor(v)]));
  if (low.length > 2) r.push(`<b>${low.length} kỹ năng</b> dưới mức tối thiểu 40%.`); else if (low.length) r.push(`${low.map(x => SECN[x] + "\u00a0<b>" + sk[x] + "%</b>").join(", ")} dưới mức tối thiểu 40%.`);
  return r.join("<br>");
}
/* ---------- Trang Thi thử ---------- */
function vExam() {
  const certs = LV.filter(l => S.certs[l]);
  app().innerHTML = `<header class="page"><h1>Thi thử theo cấp độ CEFR</h1><p class="muted">Đề luyện tập mô phỏng theo các cấp độ CEFR, đủ 5 phần.<br>Câu hỏi được chọn ngẫu nhiên từ ngân hàng đề.</p></header>
  <div class="card flat"><p class="lab">Cách tính điểm đạt</p><ul class="goals"><li><i class="ti ti-check"></i>Điểm trung bình 5 kỹ năng từ 60% trở lên</li><li><i class="ti ti-check"></i>Không kỹ năng nào dưới 40%</li><li><i class="ti ti-check"></i>Từ 80% trở lên: đạt loại xuất sắc</li></ul><p class="sm muted">Phần Nghe được nghe tối đa 2 lần mỗi câu. Bài thi có tính giờ, hết giờ sẽ tự nộp. Phần Nói cần micro, không có micro thì lần thi không được ghi nhận đạt.</p></div>
  ${LV.map(l => { const E = EXAMS[l], h = S.exams[l] || [], last = h[h.length - 1], c = S.certs[l], rec = l === curLevel(); return `<section class="card examc ${c ? "got" : ""} ${rec ? "rec" : ""}" onclick="startMock('${l}')"><div class="row"><div class="badge lv-${l.toLowerCase()} ${c ? "done" : ""}">${c ? '<i class="ti ti-certificate"></i>' : l}</div><div class="grow"><h3>${E.name}</h3><p class="sm muted">${E.time} phút · 5 kỹ năng${rec ? ` · <b class="g">hợp với bạn</b>` : ""}</p>${last ? `<p class="sm">Lần gần nhất: <b>${last.overall}%</b> · ${last.pass ? '<span class="g">Đạt</span>' : last.unrated ? '<span class="b">Chưa ghi nhận (thiếu micro)</span>' : '<span class="b">Chưa đạt</span>'} · ${h.length} lần thi</p>` : ""}</div></div>
  <div class="row2">${c ? `<button class="btn" onclick="event.stopPropagation();showCert('${l}')"><i class="ti ti-certificate"></i> Giấy ghi nhận</button>` : `<span></span>`}<button class="btn ${rec ? "primary" : ""}" onclick="event.stopPropagation();startMock('${l}')">${h.length ? "Thi lại " + l : "Thi " + l}</button></div></section>`; }).join("")}
  ${certs.length ? "" : `<p class="note">Mẹo: học xong các bài của một chặng rồi hãy thi cấp độ tương ứng.</p>`}`;
}

/* ---------- Tạo đề ---------- */
function startMock(lv) {
  const E = EXAMS[lv], li = LV.indexOf(lv), st = [];
  st.push({ type: "xintro", lv });
  st.push({ type: "xsec", sec: "listen" });
  pick(E.listen, Math.min(10, E.listen.length)).forEach(x => { const p = x.split("|"), o = shuffle(p.slice(2)); st.push({ type: "mcq", sec: "listen", sk: "listen", label: "Bấm loa để nghe, rồi chọn câu trả lời đúng", audio: p[0], limit: 2, played: 0, q: p[1], vq: 1, listenQ: 1, o, a: o.indexOf(p[2]) }); });
  st.push({ type: "xsec", sec: "read" });
  pick(E.read, 2).forEach(r => st.push(Object.assign(mkRead(r), { sec: "read" })));
  st.push({ type: "xsec", sec: "use" });
  const itsOf = l => GRAMMAR.filter(T => T.lv === l).flatMap(T => T.items.filter(x => x[0] === "c").map(x => [x, T]));
  const cur = itsOf(lv), prev = li > 0 ? itsOf(LV[li - 1]) : [], nCur = prev.length ? Math.min(cur.length, 8) : 12;
  pick(cur, nCur).concat(pick(prev, 12 - nCur)).forEach(x => st.push(Object.assign(gStep(x[0], x[1]), { sec: "use", why: undefined, gi: undefined })));
  const words = stageOf(E.stage).lessons.flatMap(L => L.W).filter(w => !/^-|-$/.test(w.en) && !/^\+|số ít|số nhiều|\(.*(quá khứ|của )/.test(w.vi) && !/\(/.test(w.en));
  pick([...new Map(words.map(w => [w.en.toLowerCase(), w])).values()], 6).forEach(w => st.push(Object.assign(mqMeaning(w, words), { sec: "use", audio: undefined, mk: undefined })));
  st.push({ type: "xsec", sec: "write" });
  const w = pick(E.write, 1)[0]; st.push({ type: "write", sec: "write", sk: "write", pts: 10, wr: { p: w[0], kw: w[1].split(";"), min: w[2], model: w[3], en: w[4] } });
  st.push({ type: "xsec", sec: "speak" });
  pick(E.speak.read, 3).forEach(t => st.push({ type: "speak", sec: "speak", sk: "speak", en: t, vi: "Đọc to, rõ ràng câu trên.", pts: 1 }));
  const a = pick(E.speak.ask, 1)[0]; st.push({ type: "xs", sec: "speak", pts: 2, q: a[0], vi: a[1], kw: a[2].split(";"), min: a[3] });
  const tot = {}; st.forEach(s => { if (!s.sec || s.type === "xsec") return; tot[s.sec] = (tot[s.sec] || 0) + (s.type === "read" ? s.q.length : (s.pts || 1)); });
  checkVoice(); P = { kind: "mock", lv, steps: st, i: 0, ok: 0, tot: 0, xp: 0, sk: {}, wrong: 0, sec: {}, secTot: tot, started: false, dur: E.time * 60000, t0: 0 };
  last = Date.now(); VIEW = null; render();
}
const mockLeft = () => !P ? 0 : P.t0 ? P.dur - (performance.now() - P.t0) : P.dur;
function secAdd(sec, v) { if (!sec) return; P.sec[sec] = (P.sec[sec] || 0) + v; }
function rXintro(s) {
  const E = EXAMS[s.lv];
  return `<div class="xin"><div class="badge xl lv-${s.lv.toLowerCase()}">${s.lv}</div><h1>Thi thử ${E.name}</h1><p class="muted">Thời gian: <b>${E.time}\u00a0phút</b>. Làm lần lượt 5 phần,<br>không quay lại phần trước.</p>
  <div class="secs">${Object.keys(SECN).map((k, i) => `<div><i class="ti ti-${SECI[k]}"></i><span><b>${i + 1}. ${SECN[k]}</b><small>${{ listen: Math.min(10, E.listen.length) + " câu, nghe tối đa 2 lần", read: "2 bài đọc", use: "18 câu trắc nghiệm", write: "1 bài viết, máy chấm theo 4 tiêu chí", speak: "Đọc to 3 câu và trả lời 1 câu hỏi" }[k]}</small></span></div>`).join("")}</div>
  <p class="sm muted">Cần tai nghe hoặc loa, và micro cho phần Nói. Trong lúc thi không hiện đáp án. Sau khi nộp bài, bạn xem được điểm từng phần và nhận xét bài Viết, Nói.</p>
  <button class="btn primary full lg" onclick="beginMock()"><i class="ti ti-player-play"></i> Bắt đầu tính giờ</button></div>`;
}
const NOVOICE = "Máy chưa có giọng đọc tiếng Anh nên không làm được phần Nghe.<br>Hãy vào <b>Cài đặt</b> → <b>Chuyển văn bản thành giọng nói</b>, tải giọng <b>English</b>, rồi thi lại.";
function beginMock() { const E = EXAMS[P.lv]; if (!("speechSynthesis" in window)) { modal("Chưa thể thi phần Nghe", "Thiết bị chưa có giọng đọc tiếng Anh nên không làm được phần Nghe. Hãy mở app bằng Chrome hoặc Safari rồi thi lại.", "Đã hiểu", () => nav("exam"), false, "Đóng"); return; }
  // đã biết danh sách giọng mà không có giọng tiếng Anh: chặn ngay; danh sách chưa tải xong thì kiểm tra lại khi tải xong
  loadV(); const noEn = () => voices.length && !voices.some(v => v.lang.toLowerCase().startsWith("en"));
  if (noEn()) { modal("Chưa thể thi phần Nghe", NOVOICE, "Đã hiểu", () => nav("exam"), false, "Đóng"); return; }
  if (!voices.length) { const me = P; setTimeout(() => { loadV(); if (P === me && noEn() && !P.sec.listen) { clearInterval(P.tm); S.mockOpen = null; save(); P = null; modal("Chưa thể thi phần Nghe", NOVOICE, "Đã hiểu", () => nav("exam"), false, "Đóng"); } }, 1500); } P.dur = E.time * 60000; P.t0 = performance.now(); P.started = true; S.mockOpen = { lv: P.lv, at: Date.now(), hb: Date.now(), w: WIN }; save(); clearInterval(P.tm);
  // đồng hồ thi dùng performance.now(): chỉnh giờ máy lùi lại không kéo dài được bài thi; mỗi 5 giây ghi "đang thi" để cửa sổ khác không ghi nhầm là bỏ dở
  P.tm = setInterval(() => { const t = $("#timer"); if (!P || P.kind !== "mock") return; const left = mockLeft(); if (t) { t.textContent = fmtTime(left); t.classList.toggle("warn", left < 120000); }
    if (left < 120000 && !P.w2) { P.w2 = 1; toast("Còn 2 phút!"); } if (left < 30000 && !P.w3) { P.w3 = 1; toast("Còn 30 giây!"); }
    if (S.mockOpen && Math.abs(Date.now() - (S.mockOpen.hb || 0)) > 5000) { S.mockOpen.hb = Date.now(); save(); }
    if (left <= 0) timeUp(); }, 1000); P.i++; showStep(); }
async function timeUp() {
  if (!P || P.kind !== "mock" || P.ending) return; P.ending = 1; clearInterval(P.tm);
  document.querySelectorAll(".modal").forEach(m => m.remove());
  const s = P.steps[P.i], inp = $("#inp"), v = inp ? inp.value.trim() : "";
  if (s && s.grading && !P.ans) {
    // bài đang được chấm (vừa bấm Nộp trước khi hết giờ): dùng chính kết quả đó, không chấm lần hai
    toast("Hết giờ! Đang chấm phần bạn đã nộp...");
    const g = await s.grading; if (!P) return;
    if (s.type === "write") { P.wres = { r: g, text: s.gtext || v, wr: s.wr }; secAdd("write", g.total / 10 * (s.pts || 10)); }
    else { secAdd("speak", g.part); P.xsres = g.res; if (g.res.typed) s.unrated = 1; }
  } else if (s && !P.ans && v && (s.type === "write" || s.type === "xs") && wcount(v) >= 3) {
    toast("Hết giờ! Đang chấm phần bạn đã viết...");
    if (s.type === "write") { const w = s.wr, r = await Grader.grade(v, { min: w.min, kw: w.kw, refs: mockRefs(), topic: [w.p, w.en || "", w.model].join("\n") }); if (!P) return; P.wres = { r, text: v, wr: w }; secAdd("write", r.total / 10 * (s.pts || 10)); }
    else { const r = await xsScore(s, v, true); if (!P) return; secAdd("speak", r.part); s.unrated = 1; P.xsres = r.res; }
  } else if (s && !P.ans && s.type === "xs" && (s.txt || "").trim()) {
    // câu trả lời nói đã được máy nghe nhưng chưa bấm Nộp
    toast("Hết giờ! Đang chấm câu trả lời bạn đã nói...");
    const r = await xsScore(s, s.txt.trim(), false); if (!P) return; secAdd("speak", r.part); P.xsres = r.res;
  } else {
    // đáp án đã chọn nhưng chưa bấm Xác nhận / Nộp vẫn được tính
    if (s && !P.ans) {
      if (s.type === "mcq" && s.sel !== undefined) secAdd(s.sec, s.sel === s.a ? (s.pts || 1) : 0);
      else if (s.type === "read") s.q.forEach(q => { if (q.sel !== undefined) secAdd("read", q.sel === q.a ? 1 : 0); });
      else if (s.type === "speak" && s.part) secAdd(s.sec, s.best >= 99 ? (s.pts || 1) : s.part);
    }
    toast("Hết giờ! Bài thi đã được nộp.");
  }
  P.ans = true; P.i = P.steps.length; finishStudy();
}
function mockRefs() { const E = EXAMS[P.lv]; return E.read.map(r => r.t).concat(E.write.map(w => w[3]), E.listen.map(x => x.split("|")[0])); }
function rXsec(s) { const n = Object.keys(SECN).indexOf(s.sec) + 1; return `<div class="xin"><div class="ico xl"><i class="ti ti-${SECI[s.sec]}"></i></div><p class="stepn">Phần ${n}/5</p><h1>${SECN[s.sec]}</h1><p class="muted">${{ listen: "Bấm loa để nghe. Mỗi câu được nghe tối đa 2 lần. Chọn đáp án rồi bấm Xác nhận.", read: "Đọc kỹ bài, chọn đáp án cho mọi câu hỏi rồi bấm Nộp. Trước khi nộp, bạn đổi đáp án được.", use: "Chọn đáp án đúng nhất rồi bấm Xác nhận.", write: "Viết đúng yêu cầu, đủ số từ, không dán văn bản. Máy chấm theo 4 tiêu chí: yêu cầu đề, ngữ pháp, từ vựng, mạch lạc.", speak: "Bấm micro rồi nói to, rõ ràng.<br>Phần Nói cần micro để được chấm.<br>Không có micro thì lần thi không được ghi nhận đạt." }[s.sec]}</p></div>`; }
/* Nghe trong phòng thi: giới hạn số lần nghe */
/* Đọc theo từng câu (giọng mạng của Chrome hay tự dừng khi một lượt đọc dài quá ~15 giây); cả bài tính là 1 lần nghe */
function examPlay() {
  const s = P.steps[P.i]; if (s.played >= s.limit) { toast("Bạn đã nghe đủ 2 lần"); return; }
  if (s.playing || (window.speechSynthesis && speechSynthesis.speaking)) return;
  s.playing = 1; let counted = false; const run = {}; s.run = run; const upd = () => { const c = $("#plays"); if (c) c.textContent = s.played ? `Còn ${s.limit - s.played} lần nghe` : `Bấm loa để nghe (tối đa ${s.limit} lần)`; };
  const parts = String(s.audio).match(/[^.!?]+(?:[.!?]+["”’)]?|$)/g).map(x => x.trim()).filter(Boolean), rate = { A1: 0.85, A2: 0.9, B1: 0.95, B2: 1, C1: 1 }[P.lv] || 1;
  const end = () => { if (s.run === run) s.playing = 0; };
  const next = k => { if (s.run !== run || !P || P.steps[P.i] !== s) return end(); if (k >= parts.length) return end();
    say(parts[k], false, { rate, onstart: () => { if (!counted) { counted = true; s.played++; upd(); } }, onend: () => next(k + 1), onerror: () => { end(); if (counted && k === 0) { s.played--; upd(); } } }); };
  next(0);
  const words = String(s.audio).split(/\s+/).length;
  setTimeout(() => { if (!counted && s.run === run) { s.playing = 0; toast("Chưa phát được âm thanh. Kiểm tra loa hoặc giọng đọc tiếng Anh rồi bấm lại."); } }, 4000);
  setTimeout(() => end(), (words / 2.2 + 5) * 1000 / rate);
}

/* ---------- Nói: trả lời câu hỏi ---------- */
function rXs(s) {
  return `<p class="lab"><i class="ti ti-microphone"></i> Nói · Trả lời câu hỏi (ít nhất ${s.min} từ)</p><div class="say"><h2>${esc(s.q)}</h2><p class="vi">${esc(s.vi)}</p></div><div class="c">${spk(s.q)}</div>
  <p class="sm muted c">Gợi ý nên dùng:</p>${kwChips(s.kw)}
  <div id="mic">${SR && !micBlocked ? `<button class="btn primary full lg" onclick="xsMic()"><i class="ti ti-microphone"></i> Bấm rồi nói</button>` : ""}<button class="link c" onclick="xsType()">${SR && !micBlocked ? "Không dùng micro được? Gõ câu trả lời" : "Gõ câu trả lời của bạn"}</button></div>`;
}
function xsType() { $("#mic").innerHTML = `<p class="sm muted c">Trả lời bằng cách gõ phím chỉ được tối đa 50% điểm, và lần thi này sẽ không được ghi nhận đạt.</p><textarea id="inp" rows="4" placeholder="Gõ câu trả lời bằng tiếng Anh" autocorrect="off" spellcheck="false" ${MOCK_GUARD} oninput="mockInput(this,event);$('#er').textContent=''"></textarea><p class="err" id="er"></p><button class="btn primary full" id="chk" onclick="xsSubmit($('#inp').value,true)">Nộp câu trả lời</button>`; }
function xsMic() { $("#mic").innerHTML = `<div class="listening"><span class="dot"></span> Đang nghe... hãy nói câu trả lời</div><button class="link c" onclick="stopMic()">Dừng</button>`; const s = P.steps[P.i]; s.txt = s.txt || ""; listenMic(alts => { if (!P || P.steps[P.i] !== s) return; s.txt += " " + alts[0]; $("#mic").innerHTML = `<p class="heard">Máy nghe được: “${esc(s.txt.trim())}” (${wcount(s.txt)} từ)</p><div class="row2"><button class="btn" onclick="xsMic()"><i class="ti ti-microphone"></i> Nói tiếp</button><button class="btn primary" onclick="xsSubmit(P.steps[P.i].txt,false)">Nộp</button></div>`; }, () => { if (!P || P.steps[P.i] !== s) return; if (s.txt.trim()) { $("#mic").innerHTML = `<p class="heard">Máy nghe được: “${esc(s.txt.trim())}” (${wcount(s.txt)} từ)</p><div class="row2"><button class="btn" onclick="xsMic()"><i class="ti ti-microphone"></i> Nói tiếp</button><button class="btn primary" onclick="xsSubmit(P.steps[P.i].txt,false)">Nộp</button></div>`; return; } $("#mic").innerHTML = `<p class="muted c sm">Chưa nghe được gì.</p><button class="btn primary full" onclick="xsMic()"><i class="ti ti-microphone"></i> Thử lại</button><button class="link c" onclick="xsType()">Không dùng micro được? Gõ câu trả lời</button>`; }, { long: true, maxMs: 45000, onpart: t => { if (!P || P.steps[P.i] !== s) return; const l = $("#mic .listening"); if (l) l.innerHTML = `<span class="dot"></span> Đang nghe: “${esc(((s.txt || "") + " " + t).trim())}”`; } }); }
/* Phần Nói – trả lời câu hỏi: từ chủ đề (gốc từ, khớp phần đầu) để biết câu trả lời có bám câu hỏi không */
const XS_TOPIC = {
  "what do you do in your free time": "read book music movie film tv sport soccer football game cook swim walk friend park free time weekend",
  "tell me about your family": "family mom mother dad father parent brother sister grand wife husband son daughter child people",
  "describe your hometown": "hometown town city village people food weather river market street place house beach mountain",
  "what did you do last weekend": "weekend saturday sunday went visit watch play stay met cook clean friend family",
  "what are the advantages and disadvantages of living in a big city": "city cities job work traffic noise noisy pollut expensive cost transport hospital shop crowd life",
  "describe a person who has influenced you": "person teacher mother father mom dad friend grand boss coach taught teach help show influenc learn",
  "some people think social media does more harm than good what is your opinion": "social media facebook tiktok instagram youtube online internet post news connect addict privacy fake share",
  "describe a difficult decision you have made and what you learned from it": "decision decide choose chose choice job study move university learn lesson regret",
  "to what extent should individuals be responsible for protecting the environment rather than governments": "environment pollut climate recycl plastic waste energy government law tax individual citizen compan carbon",
  "how has technology changed the way people communicate and is this change mostly positive": "technolog phone internet online social media message text email video call face communicat conversation"
};
const XS_STOP = new Set("the and but for not you your our its his her their they them him she this that these those there with from into than then when what who which very much many more most less some any all have has had was were are been being will would can could should might must about also just really because like think".split(" "));
/* Từ nối tự nhiên khác cũng được tính cho nhóm gợi ý tương ứng ("but" cho nhóm "however") */
function xsKw(kw) { return kw.map(k => { const a = k.split("/"), add = [];
  if (a.some(x => /^(however|on the other hand|although|nevertheless|while|whereas|that said)$/.test(x))) add.push("but", "although", "while", "whereas", "yet", "though", "even so", "on the other hand", "however");
  if (a.some(x => /^(i think|in my opinion|i believe)$/.test(x))) add.push("i think", "in my opinion", "i believe", "i feel", "personally", "in my view", "i would say");
  if (a.some(x => /^(for example|for instance)$/.test(x))) add.push("for example", "for instance", "such as");
  if (a.some(x => /^(arguably|undoubtedly|clearly)$/.test(x))) add.push("clearly", "obviously", "certainly", "definitely", "without doubt", "i would say", "undoubtedly", "arguably");
  if (a.some(x => /^(on balance|ultimately)$/.test(x))) add.push("overall", "in the end", "all in all", "to sum up", "in conclusion");
  return [...new Set(a.concat(add))].join("/"); }); }
async function xsScore(s, text, typed) {
  const kw = xsKw(s.kw), r = await Grader.grade(text, { min: s.min, kw });
  const g = r.issues.filter(x => x.cat === "grammar").length;
  let q = 0.5 * Math.min(1, r.n / s.min) + 0.15 * (kw.length ? r.kwHits.length / kw.length : 1) + 0.35 * Math.max(0, 1 - g / 5);
  const toks = norm(text).split(" ").filter(Boolean), qt = new Set(norm(s.q).split(" ")), content = toks.filter(x => x.length > 3), uniq = new Set(toks);
  const copyQ = toks.length && toks.filter(x => qt.has(x)).length / toks.length > 0.6, rep = toks.length >= 8 && uniq.size / toks.length < 0.45;
  // chỉ đọc các từ gợi ý: phần lớn từ là từ gợi ý, hoặc gần như không có từ nội dung nào khác
  const kwTok = new Set(s.kw.flatMap(k => k.split("/")).flatMap(a => norm(a).split(" "))), own = new Set(toks.filter(x => x.length > 2 && !XS_STOP.has(x) && !kwTok.has(x) && !qt.has(x)));
  const chipShare = toks.length ? toks.filter(x => kwTok.has(x)).length / toks.length : 0, needOwn = s.min <= 8 ? 1 : s.min <= 15 ? 2 : 3;
  // bám chủ đề câu hỏi: ít nhất 2 gốc từ chủ đề khác nhau
  const tl = (XS_TOPIC[norm(s.q)] || [...qt].filter(x => x.length > 3 && !XS_STOP.has(x)).join(" ")).split(" "), body = " " + toks.join(" ");
  const topicHits = tl.filter(t => body.includes(" " + t)).length;
  let why = ""; if (copyQ) { q = 0; why = "Câu trả lời chủ yếu chép lại câu hỏi."; }
  else if (chipShare > 0.6 || (own.size < needOwn && chipShare > 0.5)) { q = Math.min(q, 0.2); why = "Câu trả lời chỉ liệt kê các từ gợi ý, chưa thành câu trả lời."; }
  else if (rep) { q = Math.min(q, 0.2); why = "Câu trả lời lặp lại cùng các từ."; }
  else if (topicHits < 2) { q = Math.min(q, 0.4); why = "Câu trả lời chưa bám sát câu hỏi."; }
  else if (content.length < 3) { q = Math.min(q, 0.3); why = "Câu trả lời quá ít ý."; }
  // câu hỏi dài (B2–C1): cần ít nhất 3 gốc từ chủ đề; câu trả lời chung chung (nhiều từ chung, ít ý riêng) tối đa 60%
  const ac = Grader.answerCheck ? Grader.answerCheck(text, [s.q, s.vi || "", XS_TOPIC[norm(s.q)] || ""], s.kw.flatMap(k => k.split("/"))) : null;
  if (!why && ac && !ac.sentence) { q = Math.min(q, 0.3); why = "Câu trả lời cần là câu hoàn chỉnh (có chủ ngữ và động từ)."; }
  if (!why && (topicHits < (s.min >= 25 ? 3 : 2) || (ac && ac.generic >= 0.72 && ac.n < 8))) { q = Math.min(q, 0.6); why = "Câu trả lời còn chung chung, chưa nói cụ thể về câu hỏi."; }
  if (toks.length < 4 || r.n < s.min * 0.6) { q = Math.min(q, 0.5 * Math.min(1, r.n / s.min)); why = why || "Câu trả lời quá ngắn."; }
  if (typed) q = Math.min(q, 0.5);
  return { part: Math.round(q * s.pts * 100) / 100, res: { text, typed, q: Math.round(q * 100), r, why } };
}
async function xsSubmit(text, typed) {
  const s = P.steps[P.i]; text = (text || "").trim(); if (!text) { if ($("#er")) $("#er").textContent = "Hãy trả lời trước khi nộp."; return; }
  const b = $("#chk") || $("#mic .btn.primary"); if (s.submitting) return; s.submitting = 1; if (b) { b.disabled = true; b.textContent = "Đang chấm..."; }
  s.grading = xsScore(s, text, typed); const x = await s.grading; s.grading = null;
  if (!P || P.steps[P.i] !== s || P.ending) return;
  s.part = x.part; if (typed) s.unrated = 1; P.xsres = x.res;
  grade(x.res.q >= 99.9, "");
}

/* ---------- Nhận xét bài viết / câu trả lời nói ----------
   Dùng Grader.report nhưng: lời nhận xét không tự mâu thuẫn khi điểm bị giới hạn, câu hướng dẫn "bấm vào chỗ gạch chân" chỉ khi có gạch chân,
   mỗi khối nhận xét có ô giải thích lỗi riêng (hai khối trên cùng màn hình không lẫn lỗi của nhau).
   o.xs: câu trả lời phần Nói – điểm hiện bằng %, không có 4 tiêu chí của bài viết, lời lẽ "câu trả lời" thay cho "bài viết" */
const RTIPS = {};
function rTip(id, n) { const x = (RTIPS[id] || [])[n], box = document.getElementById("errtip-" + id); if (!x || !box) return; box.innerHTML = `<b>${esc(x.word)}</b>${x.fix ? ` → <b class="g">${esc(x.fix)}</b>` : x.fix === "" ? ' → <b class="g">(bỏ đi)</b>' : ""}<br>${esc(x.msg)}`; box.classList.add("on"); }
function myReport(r, opt, o) {
  o = o || {}; const id = o.id || "w", marks = /<mark/.test(r.html || ""), nIss = (r.issues || []).length;
  let c = String(r.comment || "");
  if (o.xs) {
    const kwm = (r.kwMiss || []).map(k => "“" + (k.split("/")[0] === "ing" ? "-ing" : k.split("/")[0]) + "”");
    c = (o.why ? "" : o.q >= 80 ? "Câu trả lời tốt. " : o.q >= 50 ? "Câu trả lời đạt yêu cầu cơ bản. " : "Câu trả lời cần cải thiện thêm. ") + (nIss ? `Có ${nIss} lỗi cần sửa, xem bên dưới.` : "Không có lỗi ngữ pháp, chính tả.") + (kwm.length ? " Có thể dùng thêm: " + kwm.join(", ") + "." : "");
  } else if (/điểm tối đa|giới hạn điểm|chép lại/.test(c)) c = c.replace(/^(Bài viết rất tốt!|Bài viết khá tốt\.|Bài viết đạt yêu cầu cơ bản\.)\s*/, "").replace("Không phát hiện lỗi nào. Tuyệt vời!", "Không có lỗi ngữ pháp, chính tả.");
  RTIPS[id] = r.issues || [];
  let h = Grader.report(Object.assign({}, r, { comment: c }), opt).replace(/onclick="Grader\.show\((\d+)\)"/g, `onclick="rTip('${id}',$1)"`).replace('id="errtip"', `id="errtip-${id}"`)
    .replace(/<p class="lab">Bài của bạn · bấm vào chỗ gạch chân để xem cách sửa<\/p>/, `<p class="lab">${o.xs ? "Câu trả lời của bạn" : "Bài của bạn"}${marks ? " · bấm vào chỗ gạch chân để xem cách sửa" : ""}</p>`);
  if (o.xs) h = h.replace(/<div class="gscore [a-z]+"><b>[^<]*<\/b><small>\/10<\/small><\/div>/, `<div class="gscore pct ${o.q >= 70 ? "hi" : o.q >= 50 ? "mid" : "lo"}"><b>${o.q}%</b></div>`)
    .replace(/<div class="crit">[\s\S]*?<\/b><\/div>/g, "").replace(/<p class="sm muted">Máy chấm dựa trên[\s\S]*?<\/p>/, "");
  return h;
}

/* ---------- Kết thúc: ngữ pháp và thi thử ---------- */
function finishStudy() {
  const k = P.kind; let h = "", btns = "";
  if (k === "gram") {
    const sc = P.tot ? Math.round(P.ok / P.tot * 100) : 100;
    if (P.gid) { const prev = S.gram[P.gid]; S.gram[P.gid] = Math.max(sc, prev || 0); }
    const T = GT[P.gid], i = T ? GRAMMAR.indexOf(T) : -1, next = GRAMMAR[i + 1];
    const gained = P.xp + (sc >= 80 ? 20 : 5); addXP(gained); S.cnt.gram = (S.cnt.gram || 0) + 1;
    h = `<h1>${sc >= 80 ? "Nắm vững chủ điểm!" : "Cần luyện thêm"}</h1><p class="muted">${sc >= 80 ? "Bạn đã làm đúng phần lớn các dạng bài." : "Đọc lại phần giải thích rồi luyện lại nhé.<br>Câu sai đã được lưu vào Sổ tay."}</p><p class="xpbig">+${gained} XP</p>`;
    btns = (!P.gid && P.quiz ? `<button class="btn primary full lg" onclick="startGramQuiz('${P.quiz}')"><i class="ti ti-refresh"></i> Làm lại bài kiểm tra</button>` : sc < 80 && P.gid ? `<button class="btn primary full lg" onclick="startTopic('${P.gid}')"><i class="ti ti-refresh"></i> Luyện lại</button>` : next && P.gid ? `<button class="btn primary full lg" onclick="openTopic('${next.id}')">Chủ điểm tiếp theo <i class="ti ti-arrow-right"></i></button>` : "") + `<button class="btn full" onclick="${P.gid ? `openTopic('${P.gid}')` : "nav('gram')"}">Xem lại giải thích</button><button class="btn full" onclick="nav('gram')">Về trang Ngữ pháp</button>`;
    P = null; save();
    app().innerHTML = `<div class="done${sc >= 80 ? "" : " fail"}"><div class="ring xl" style="--p:${sc}"><span>${sc}%</span></div>${h}<div class="stack">${btns}</div></div>`;
    document.body.classList.add("playing"); if (sc >= 80) { beep("done"); confetti(); } checkBadges(); checkDay(); return;
  }
  clearInterval(P.tm); S.mockOpen = null;
  const lv = P.lv, skills = {}, raw = {}; Object.keys(SECN).forEach(x => { const t = P.secTot[x] || 1; raw[x] = Math.min(1, (P.sec[x] || 0) / t) * 100; skills[x] = Math.floor(raw[x]); });
  const ovRaw = Object.values(raw).reduce((a, b) => a + b, 0) / 5, overall = Math.floor(ovRaw), unrated = P.steps.some(s => s.unrated), scorePass = ovRaw >= 60 && Object.values(raw).every(v => v >= 40), pass = scorePass && !unrated, merit = pass && ovRaw >= 80;
  const att = { at: Date.now(), overall, skills, pass, merit, unrated: unrated ? 1 : 0 }; (S.exams[lv] = S.exams[lv] || []).push(att);
  const newCert = pass && (!S.certs[lv] || overall > S.certs[lv].overall); if (newCert) S.certs[lv] = att;
  addXP(pass ? 150 : 30); save();
  const wr = P.wres, xs = P.xsres;
  const weak = Object.keys(skills).sort((a, b) => skills[a] - skills[b])[0];
  const advice = { listen: "Mỗi ngày nghe 10–15 phút.<br>Làm lại các bài nghe chép trong bài học, dùng nút Nghe\u00a0chậm.", read: "Đọc thêm các bài đọc trong lộ trình, gạch chân từ khóa trong câu hỏi trước khi đọc.", use: "Vào tab Ngữ pháp, luyện các chủ điểm cấp " + lv + " cho đến khi đạt 80%.", write: "Viết lại các đề trong bài học, sửa hết lỗi gạch chân và so với bài mẫu.", speak: "Luyện nói theo câu mẫu mỗi ngày, ghi âm và nghe lại giọng của mình." }[weak];
  app().innerHTML = `<div class="done${pass ? "" : " fail"}"><div class="ring xl" style="--p:${overall}"><span>${overall}%</span></div><h1>${merit ? "Đạt loại xuất sắc bài thi thử " + lv + "!" : pass ? "Chúc mừng! Bạn đạt bài thi thử " + lv : scorePass ? "Đủ điểm nhưng chưa được ghi nhận" : "Chưa đạt " + lv}</h1>
  <p class="muted">${pass ? "Đây là kết quả luyện tập, giúp bạn ước lượng trình độ " + lv + "." : scorePass ? "Phần Nói chưa được chấm bằng micro nên chưa thể ghi nhận đạt. Hãy thi lại trên Chrome có micro." : failWhy(ovRaw, raw)}</p>
  <div class="card skbox">${Object.keys(SECN).map(x => `<div class="skrow"><i class="ti ti-${SECI[x]}"></i><span class="skn">${SECN[x]}</span><div class="bar grow ${skills[x] < 40 ? "lowbar" : ""}"><span style="width:${skills[x]}%"></span></div><b>${skills[x]}%${unrated && x === "speak" ? "*" : ""}</b></div>`).join("")}${unrated ? `<p class="sm muted">* Có câu Nói không chấm được bằng micro,<br>nên lần thi này không được ghi nhận đạt.</p>` : ""}</div>
  <div class="card left"><p class="lab">Lời khuyên</p><p>${skills[weak] >= 80 ? (LV[LV.indexOf(lv) + 1] ? `Bạn làm tốt cả 5 kỹ năng.<br>Hãy thử sức với bài thi thử cấp ${LV[LV.indexOf(lv) + 1]}.` : "Bạn làm tốt cả 5 kỹ năng.<br>Hãy giữ nhịp ôn tập mỗi ngày để duy trì trình độ.") : `Kỹ năng cần ưu tiên: <b>${SECN[weak]}</b>.<br>${advice}`}</p></div>
  ${wr ? `<details class="card left"><summary><b>Bài viết: ${wr.r.total}/10</b> · xem nhận xét chi tiết</summary>${myReport(wr.r, wr.wr, { id: "wr" })}<div class="model"><b>Bài mẫu</b><p>${esc(wr.wr.model).replace(/\n/g, "<br>")}</p></div></details>` : ""}
  ${xs ? `<details class="card left"><summary><b>Câu trả lời phần Nói: ${xs.q}%</b>${xs.typed ? " (gõ phím)" : ""}</summary>${xs.why ? `<p class="b">${xs.why}</p>` : ""}${myReport(xs.r, {}, { xs: 1, id: "xs", q: xs.q, why: xs.why })}</details>` : ""}
  <div class="stack">${pass ? `<button class="btn primary full lg" onclick="showCert('${lv}')"><i class="ti ti-certificate"></i> Xem giấy ghi nhận</button>` : `<button class="btn primary full lg" onclick="startMock('${lv}')"><i class="ti ti-refresh"></i> Thi lại</button>`}<button class="btn full" onclick="nav('exam')">Về trang Thi thử</button></div></div>`;
  P = null; document.body.classList.add("playing"); window.scrollTo(0, 0);
  if (pass) { beep("done"); confetti(); } checkBadges(); checkDay();
}

/* ---------- Chứng nhận ---------- */
function showCert(lv) {
  const c = S.certs[lv]; if (!c) return;
  VIEW = () => {
    const d = new Date(c.at), ds = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
    app().innerHTML = `<div class="ptop noprint"><button class="ib" onclick="nav('exam')" aria-label="Quay lại"><i class="ti ti-arrow-left"></i></button><span class="muted sm">Giấy ghi nhận</span></div>
    <div class="cert" id="cert"><div class="certin"><p class="ct">GIẤY GHI NHẬN KẾT QUẢ THI THỬ</p><p class="cs">Practice Test Result · not an official certificate</p><p class="cn">${esc(S.name || "Học viên")}</p><p>đã đạt bài thi thử cấp độ</p><div class="clv">${lv}</div><p class="cs">${esc(EXAMS[lv].name.split("–")[1].trim())} · Đề mô phỏng theo mô tả trình độ CEFR</p>
    <div class="cgrid">${Object.keys(SECN).map(x => `<div><b>${c.skills[x]}%</b><small>${SECN[x]}</small></div>`).join("")}</div><p>Điểm trung bình <b>${c.overall}%</b>${c.merit ? " · <b>Xuất sắc</b>" : ""}</p><p class="sm">Ngày ${ds} · Mã lần thi ${String(c.at).slice(-6)} · Ứng dụng Tiếng Anh Từ Số 0</p><p class="sm">Kết quả tự luyện trong ứng dụng, chỉ mang tính tham khảo; không thay thế chứng chỉ chính thức (Cambridge, IELTS, Aptis...).</p></div></div>
    <div class="noprint"><label class="lab">Tên in trên giấy ghi nhận</label><input class="inp" id="nm" value="${esc(S.name || "")}" placeholder="Nhập họ tên của bạn" oninput="S.name=this.value;save();document.querySelector('.cn').textContent=this.value||'Học viên'">
    <button class="btn primary full lg" onclick="window.print()"><i class="ti ti-printer"></i> In hoặc lưu PDF</button></div>`;
  };
  P = null; render(); window.scrollTo(0, 0);
}

/* Tải lại / đóng trang giữa bài thi: lần thi đó được ghi là chưa đạt (không "làm lại cho tới khi đẹp") */
/* Bài thi đang chạy ở cửa sổ khác (nhịp "đang thi" mới trong 90 giây, không phải tab này tải lại): chưa ghi, kiểm tra lại sau */
function recoverMock() { let m = S.mockOpen; try { const c = JSON.parse(localStorage.getItem(KEY) || "null"); if (c && c.mockOpen && m && c.mockOpen.at === m.at) m = S.mockOpen = Object.assign({}, m, { hb: +c.mockOpen.hb || 0 }); } catch (e) {} if (!m) return;
  const age = Date.now() - (m.hb || 0); if (m.w && m.w !== WIN && m.hb && age >= 0 && age < 90000) { setTimeout(recoverMock, 95000); return; }
  if (P && P.kind === "mock") return;
  S.mockOpen = null; (S.exams[m.lv] = S.exams[m.lv] || []).push({ at: m.at || Date.now(), overall: 0, skills: {}, pass: false, aborted: 1 }); save(); setTimeout(() => toast(`Bài thi thử ${m.lv} lần trước bị bỏ dở nên được ghi là chưa đạt.`, 5000), 700); }
recoverMock();
window.addEventListener("beforeunload", e => { if (P && P.kind === "mock" && P.started) { e.preventDefault(); e.returnValue = ""; } });
