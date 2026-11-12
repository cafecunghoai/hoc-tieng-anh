"use strict";
/* ================== Ngữ pháp và Thi thử ================== */
const LV = ["A1", "A2", "B1", "B2", "C1"];
const SECN = { listen: "Nghe", read: "Đọc", use: "Ngữ pháp & Từ vựng", write: "Viết", speak: "Nói" };
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
function rGf(s) { return `<p class="lab"><i class="ti ti-abc"></i> Ngữ pháp · Điền vào chỗ trống</p><h2 class="q gq">${blankHtml(s.q)}</h2><input id="inp" class="inp" placeholder="Gõ từ cần điền" autocomplete="off" autocapitalize="off" spellcheck="false" oninput="$('#er').textContent=''" onkeydown="if(event.key==='Enter'){event.preventDefault();checkGf()}"><p class="err" id="er"></p><button class="btn primary full" id="chk" onclick="checkGf()">Kiểm tra</button>`; }
function checkGf() { const s = P.steps[P.i], v = $("#inp").value.trim(); if (!v) { $("#er").textContent = "Hãy gõ câu trả lời trước."; return; } $("#chk").remove(); $("#inp").disabled = true; const ok = accept(v, s); grade(ok, esc(s.en) + `<br><span class="muted">${esc(s.q.replace(/_{3,}(\s*\([^)]*\))?/, s.en))}</span>`); }
function rGe(s) {
  s.toks = s.q.split(" ");
  return `<p class="lab"><i class="ti ti-abc"></i> Ngữ pháp · Tìm từ sai trong câu</p><p class="muted sm">Bấm vào từ (hoặc cụm từ) bị sai.</p><div class="etoks">${s.toks.map((t, i) => `<button class="etok" id="t${i}" onclick="pickGe(${i})">${esc(t)}</button>`).join("")}</div>`;
}
function geRange(s) { const seg = s.bad.split(" "); for (let i = 0; i < s.toks.length; i++) if (seg.every((x, j) => (s.toks[i + j] || "").replace(/[.,!?]$/, "") === x)) return [i, i + seg.length]; return [-1, -1]; }
function pickGe(k) {
  const s = P.steps[P.i]; if (P.ans) return; const [a, b] = geRange(s), ok = k >= a && k < b;
  $$(".etok").forEach(x => x.disabled = true); for (let i = a; i < b; i++) $("#t" + i).classList.add(P.kind === "mock" ? "" : "bad"); if (!ok && P.kind !== "mock") $("#t" + k).classList.add("pick");
  const fixed = s.toks.slice(0, a).concat(s.corr.startsWith("(") ? [] : [s.corr], s.toks.slice(b)).join(" ").replace(/\s+([.,!?])/g, "$1");
  if (P.kind !== "mock") $(".etoks").insertAdjacentHTML("afterend", `<p class="corr"><i class="ti ti-check"></i> ${esc(fixed)}</p>`);
  grade(ok, `<s>${esc(s.bad)}</s> → ${esc(s.corr)}`);
}
function rGr(s) { const k = s.q.indexOf(":"); const ins = k > 0 ? s.q.slice(0, k) : "Viết lại câu", src = k > 0 ? s.q.slice(k + 1).trim() : s.q; return `<p class="lab"><i class="ti ti-abc"></i> Ngữ pháp · ${esc(ins)}</p><h2 class="q gq">${esc(src)}</h2><textarea id="inp" rows="2" placeholder="Viết câu của bạn" autocapitalize="sentences" autocomplete="off" spellcheck="false" oninput="$('#er').textContent=''"></textarea><p class="err" id="er"></p><button class="btn primary full" id="chk" onclick="checkGr()">Kiểm tra</button>`; }
function checkGr() { const s = P.steps[P.i], v = $("#inp").value.trim(); if (!v) { $("#er").textContent = "Hãy viết câu trả lời trước."; return; } $("#chk").remove(); $("#inp").disabled = true; const ok = accept(v, s); if (!ok) $("#inp").insertAdjacentHTML("afterend", `<div class="diffbox"><p class="lab">So với đáp án</p>${diffHtml(v, s.en)}</div>`); grade(ok, esc(s.en)); }

/* ---------- Trang Ngữ pháp ---------- */
let GLV = null;
function curLevel() { const n = nextLesson(); const st = n ? LES[n].stage : "c1"; return { s0: "A1", a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1" }[st]; }
function vGram() {
  if (!GLV) GLV = curLevel();
  const list = GRAMMAR.filter(T => T.lv === GLV), done = list.filter(T => (S.gram[T.id] || 0) >= 80).length;
  app().innerHTML = `<header class="page"><h1>Ngữ pháp</h1><p class="muted">${GRAMMAR.length} chủ điểm từ A1 đến C1.<br>Mỗi chủ điểm có giải thích và 8 câu luyện.</p></header>
  <div class="seg big">${LV.map(l => `<button class="${GLV === l ? "on" : ""}" onclick="GLV='${l}';render()">${l}</button>`).join("")}</div>
  <div class="card flat row"><div class="grow"><b>Cấp ${GLV}</b><p class="sm muted">Đã vững ${done}/${list.length} chủ điểm (đạt từ 80%)</p><div class="bar sm"><span style="width:${list.length ? done / list.length * 100 : 0}%"></span></div></div><button class="btn" onclick="startGramQuiz('${GLV}')"><i class="ti ti-clipboard-check"></i> Kiểm tra 15 câu</button></div>
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
  if (o < 60) r.push(`Điểm trung bình còn thiếu <b>${60 - o}%</b> để đạt 60%.`);
  if (low.length > 2) r.push(`<b>${low.length} kỹ năng</b> dưới mức tối thiểu 40%.`); else if (low.length) r.push(`${low.map(x => SECN[x] + "\u00a0<b>" + sk[x] + "%</b>").join(", ")} dưới mức tối thiểu 40%.`);
  return r.join("<br>");
}
/* ---------- Trang Thi thử ---------- */
function vExam() {
  const certs = LV.filter(l => S.certs[l]);
  app().innerHTML = `<header class="page"><h1>Thi thử theo khung năng lực</h1><p class="muted">Đề mô phỏng chuẩn CEFR, đủ 5 kỹ năng.<br>Mỗi lần thi đề được trộn khác nhau.</p></header>
  <div class="card flat"><p class="lab">Cách tính điểm đạt</p><ul class="goals"><li><i class="ti ti-check"></i>Điểm trung bình 5 kỹ năng từ 60% trở lên</li><li><i class="ti ti-check"></i>Không kỹ năng nào dưới 40%</li><li><i class="ti ti-check"></i>Từ 80% trở lên: đạt loại xuất sắc</li></ul><p class="sm muted">Phần Nghe chỉ được nghe tối đa 2 lần mỗi câu. Bài thi có tính giờ, hết giờ sẽ tự nộp.</p></div>
  ${LV.map(l => { const E = EXAMS[l], h = S.exams[l] || [], last = h[h.length - 1], c = S.certs[l]; return `<section class="card examc ${c ? "got" : ""}"><div class="row"><div class="badge lv-${l.toLowerCase()} ${c ? "done" : ""}">${c ? '<i class="ti ti-certificate"></i>' : l}</div><div class="grow"><h3>${E.name}</h3><p class="sm muted">${E.time} phút · Nghe, Đọc, Ngữ pháp & Từ vựng, Viết, Nói</p>${last ? `<p class="sm">Lần gần nhất: <b>${last.overall}%</b> · ${last.pass ? '<span class="g">Đạt</span>' : '<span class="b">Chưa đạt</span>'} · ${h.length} lần thi</p>` : ""}</div></div>
  <div class="row2">${c ? `<button class="btn" onclick="showCert('${l}')"><i class="ti ti-certificate"></i> Chứng nhận</button>` : `<span></span>`}<button class="btn primary" onclick="startMock('${l}')">${h.length ? "Thi lại" : "Vào thi"}</button></div></section>`; }).join("")}
  ${certs.length ? "" : `<p class="note">Mẹo: học xong các bài của một chặng rồi hãy thi cấp độ tương ứng.</p>`}`;
}

/* ---------- Tạo đề ---------- */
function startMock(lv) {
  const E = EXAMS[lv], li = LV.indexOf(lv), st = [];
  st.push({ type: "xintro", lv });
  st.push({ type: "xsec", sec: "listen" });
  pick(E.listen, 6).forEach(x => { const p = x.split("|"), o = shuffle(p.slice(2)); st.push({ type: "mcq", sec: "listen", sk: "listen", label: "Nghe và chọn câu trả lời đúng", audio: p[0], autoplay: true, limit: 2, played: 0, q: p[1], vq: 1, listenQ: 1, o, a: o.indexOf(p[2]) }); });
  st.push({ type: "xsec", sec: "read" });
  pick(E.read, 2).forEach(r => st.push(Object.assign(mkRead(r), { sec: "read" })));
  st.push({ type: "xsec", sec: "use" });
  const its = GRAMMAR.filter(T => T.lv === lv || (li > 0 && T.lv === LV[li - 1])).flatMap(T => T.items.filter(x => x[0] === "c").map(x => [x, T]));
  pick(its, 12).forEach(x => st.push(Object.assign(gStep(x[0], x[1]), { sec: "use", why: undefined, gi: undefined })));
  const words = stageOf(E.stage).lessons.flatMap(L => L.W).filter(w => !/^-|-$/.test(w.en));
  pick(words, 6).forEach(w => st.push(Object.assign(mqMeaning(w, words), { sec: "use", audio: undefined, mk: undefined })));
  st.push({ type: "xsec", sec: "write" });
  const w = pick(E.write, 1)[0]; st.push({ type: "write", sec: "write", sk: "write", pts: 10, wr: { p: w[0], kw: w[1].split(";"), min: w[2], model: w[3] } });
  st.push({ type: "xsec", sec: "speak" });
  pick(E.speak.read, 3).forEach(t => st.push({ type: "speak", sec: "speak", sk: "speak", en: t, vi: "Đọc to, rõ ràng câu trên.", pts: 1 }));
  const a = pick(E.speak.ask, 1)[0]; st.push({ type: "xs", sec: "speak", pts: 2, q: a[0], vi: a[1], kw: a[2].split(";"), min: a[3] });
  const tot = {}; st.forEach(s => { if (!s.sec || s.type === "xsec") return; tot[s.sec] = (tot[s.sec] || 0) + (s.type === "read" ? s.q.length : (s.pts || 1)); });
  P = { kind: "mock", lv, steps: st, i: 0, ok: 0, tot: 0, xp: 0, sk: {}, wrong: 0, sec: {}, secTot: tot, started: false, deadline: Date.now() + E.time * 60000 };
  last = Date.now(); VIEW = null; render();
}
function secAdd(sec, v) { if (!sec) return; P.sec[sec] = (P.sec[sec] || 0) + v; }
function rXintro(s) {
  const E = EXAMS[s.lv];
  return `<div class="xin"><div class="badge xl lv-${s.lv.toLowerCase()}">${s.lv}</div><h1>Thi thử ${E.name}</h1><p class="muted">Thời gian: <b>${E.time} phút</b>. Làm lần lượt 5 phần, không quay lại phần trước.</p>
  <div class="secs">${Object.keys(SECN).map((k, i) => `<div><i class="ti ti-${SECI[k]}"></i><span><b>${i + 1}. ${SECN[k]}</b><small>${{ listen: "6 câu, nghe tối đa 2 lần", read: "2 bài đọc, 8 câu hỏi", use: "18 câu trắc nghiệm", write: "1 bài viết, chấm như giáo viên", speak: "Đọc to 3 câu và trả lời 1 câu hỏi" }[k]}</small></span></div>`).join("")}</div>
  <p class="sm muted">Cần tai nghe hoặc loa, và cho phép micro ở phần Nói. Bài thi không hiện đáp án đúng/sai cho đến khi nộp bài.</p>
  <button class="btn primary full lg" onclick="beginMock()"><i class="ti ti-player-play"></i> Bắt đầu tính giờ</button></div>`;
}
function beginMock() { const E = EXAMS[P.lv]; P.deadline = Date.now() + E.time * 60000; P.started = true; clearInterval(P.tm); P.tm = setInterval(() => { const t = $("#timer"); if (!P || P.kind !== "mock") return; if (t) { t.textContent = fmtTime(P.deadline - Date.now()); t.classList.toggle("warn", P.deadline - Date.now() < 120000); } if (Date.now() >= P.deadline) { toast("Hết giờ! Bài thi đã được nộp."); P.i = P.steps.length; finishStudy(); } }, 1000); P.i++; showStep(); }
function rXsec(s) { const n = Object.keys(SECN).indexOf(s.sec) + 1; return `<div class="xin"><div class="ico xl"><i class="ti ti-${SECI[s.sec]}"></i></div><p class="stepn">Phần ${n}/5</p><h1>${SECN[s.sec]}</h1><p class="muted">${{ listen: "Bấm loa để nghe. Mỗi câu chỉ được nghe tối đa 2 lần, sau đó chọn câu trả lời.", read: "Đọc kỹ từng bài rồi trả lời các câu hỏi bên dưới.", use: "Chọn đáp án đúng nhất cho mỗi câu.", write: "Viết đúng yêu cầu, đủ số từ. Bài được chấm theo 4 tiêu chí như giáo viên.", speak: "Bấm micro rồi nói to, rõ ràng. Nếu không dùng được micro, bạn có thể gõ câu trả lời." }[s.sec]}</p></div>`; }
/* Nghe trong phòng thi: giới hạn số lần nghe */
function examPlay() { const s = P.steps[P.i]; if (s.played >= s.limit) { toast("Bạn đã nghe đủ 2 lần"); return; } s.played++; say(s.audio); const c = $("#plays"); if (c) c.textContent = `Còn ${s.limit - s.played} lần nghe`; }

/* ---------- Nói: trả lời câu hỏi ---------- */
function rXs(s) {
  return `<p class="lab"><i class="ti ti-microphone"></i> Nói · Trả lời câu hỏi (ít nhất ${s.min} từ)</p><div class="say"><h2>${esc(s.q)}</h2><p class="vi">${esc(s.vi)}</p></div><div class="c">${spk(s.q)}</div>
  <p class="sm muted c">Gợi ý nên dùng: ${s.kw.map(k => `<span class="kw">${esc(k.split("/")[0])}</span>`).join(" ")}</p>
  <div id="mic">${SR && !micBlocked ? `<button class="btn primary full lg" onclick="xsMic()"><i class="ti ti-microphone"></i> Bấm rồi nói</button>` : ""}<button class="link c" onclick="xsType()">${SR && !micBlocked ? "Không dùng micro được? Gõ câu trả lời" : "Gõ câu trả lời của bạn"}</button></div>`;
}
function xsType() { $("#mic").innerHTML = `<textarea id="inp" rows="4" placeholder="Gõ câu trả lời bằng tiếng Anh"></textarea><p class="err" id="er"></p><button class="btn primary full" onclick="xsSubmit($('#inp').value,true)">Nộp câu trả lời</button>`; }
function xsMic() { $("#mic").innerHTML = `<div class="listening"><span class="dot"></span> Đang nghe... hãy nói câu trả lời</div>`; const s = P.steps[P.i]; s.txt = s.txt || ""; listenMic(alts => { s.txt += " " + alts[0]; $("#mic").innerHTML = `<p class="heard">Máy nghe được: “${esc(s.txt.trim())}” (${wcount(s.txt)} từ)</p><div class="row2"><button class="btn" onclick="xsMic()"><i class="ti ti-microphone"></i> Nói tiếp</button><button class="btn primary" onclick="xsSubmit(P.steps[P.i].txt,false)">Nộp</button></div>`; }, () => { $("#mic").innerHTML = `<p class="muted c sm">Không nghe được micro. Hãy gõ câu trả lời.</p>`; xsType(); }); }
async function xsSubmit(text, typed) {
  const s = P.steps[P.i]; text = (text || "").trim(); if (!text) { if ($("#er")) $("#er").textContent = "Hãy trả lời trước khi nộp."; return; }
  const r = await Grader.grade(text, { min: s.min, kw: s.kw });
  const g = r.issues.filter(x => x.cat === "grammar").length, q = 0.45 * Math.min(1, r.n / s.min) + 0.3 * (s.kw.length ? r.kwHits.length / s.kw.length : 1) + 0.25 * Math.max(0, 1 - g / 5);
  s.part = Math.round(q * s.pts * 100) / 100; P.xsres = { text, typed, q: Math.round(q * 100), r };
  grade(q >= 0.999, "");
}

/* ---------- Kết thúc: ngữ pháp và thi thử ---------- */
function finishStudy() {
  const k = P.kind; let h = "", btns = "";
  if (k === "gram") {
    const sc = P.tot ? Math.round(P.ok / P.tot * 100) : 100;
    if (P.gid) { const prev = S.gram[P.gid]; S.gram[P.gid] = Math.max(sc, prev || 0); }
    const T = GT[P.gid], i = T ? GRAMMAR.indexOf(T) : -1, next = GRAMMAR[i + 1];
    const gained = P.xp + (sc >= 80 ? 20 : 5); addXP(gained); S.cnt.gram = (S.cnt.gram || 0) + 1;
    h = `<h1>${sc >= 80 ? "Nắm vững chủ điểm!" : "Cần luyện thêm"}</h1><p class="muted">${sc >= 80 ? "Bạn đã làm đúng phần lớn các dạng bài." : "Đọc lại phần giải thích rồi luyện lại nhé. Câu sai đã được lưu vào Sổ tay."}</p><p class="xpbig">+${gained} XP</p>`;
    btns = (sc < 80 && P.gid ? `<button class="btn primary full lg" onclick="startTopic('${P.gid}')"><i class="ti ti-refresh"></i> Luyện lại</button>` : next && P.gid ? `<button class="btn primary full lg" onclick="openTopic('${next.id}')">Chủ điểm tiếp theo <i class="ti ti-arrow-right"></i></button>` : "") + `<button class="btn full" onclick="${P.gid ? `openTopic('${P.gid}')` : "nav('gram')"}">Xem lại giải thích</button><button class="btn full" onclick="nav('gram')">Về trang Ngữ pháp</button>`;
    P = null; save();
    app().innerHTML = `<div class="done"><div class="ring xl" style="--p:${sc}"><span>${sc}%</span></div>${h}<div class="stack">${btns}</div></div>`;
    document.body.classList.add("playing"); if (sc >= 80) { beep("done"); confetti(); } checkBadges(); checkDay(); return;
  }
  clearInterval(P.tm);
  const lv = P.lv, skills = {}; Object.keys(SECN).forEach(x => { const t = P.secTot[x] || 1; skills[x] = Math.round(Math.min(1, (P.sec[x] || 0) / t) * 100); });
  const overall = Math.round(Object.values(skills).reduce((a, b) => a + b, 0) / 5), pass = overall >= 60 && Object.values(skills).every(v => v >= 40), merit = pass && overall >= 80;
  const att = { at: Date.now(), overall, skills, pass, merit }; (S.exams[lv] = S.exams[lv] || []).push(att);
  const newCert = pass && (!S.certs[lv] || overall > S.certs[lv].overall); if (newCert) S.certs[lv] = att;
  addXP(pass ? 150 : 30); save();
  const wr = P.wres, xs = P.xsres;
  const weak = Object.keys(skills).sort((a, b) => skills[a] - skills[b])[0];
  const advice = { listen: "Nghe mỗi ngày 10–15 phút: làm lại bài nghe chép trong các bài học, dùng nút Nghe chậm.", read: "Đọc thêm các bài đọc trong lộ trình, gạch chân từ khóa trong câu hỏi trước khi đọc.", use: "Vào tab Ngữ pháp, luyện các chủ điểm cấp " + lv + " cho đến khi đạt 80%.", write: "Viết lại các đề trong bài học, sửa hết lỗi gạch chân và so với bài mẫu.", speak: "Luyện nói nhại theo câu mẫu mỗi ngày, ghi âm và nghe lại giọng của mình." }[weak];
  app().innerHTML = `<div class="done"><div class="ring xl" style="--p:${overall}"><span>${overall}%</span></div><h1>${merit ? "Đạt xuất sắc " + lv + "!" : pass ? "Chúc mừng! Bạn đạt " + lv : "Chưa đạt " + lv}</h1>
  <p class="muted">${pass ? "Bạn đã đáp ứng chuẩn năng lực " + lv + " theo khung CEFR." : failWhy(overall, skills)}</p>
  <div class="card skbox">${Object.keys(SECN).map(x => `<div class="skrow"><i class="ti ti-${SECI[x]}"></i><span class="skn">${SECN[x]}</span><div class="bar grow ${skills[x] < 40 ? "lowbar" : ""}"><span style="width:${skills[x]}%"></span></div><b>${skills[x]}%</b></div>`).join("")}</div>
  <div class="card left"><p class="lab">Lời khuyên</p><p>Kỹ năng cần ưu tiên: <b>${SECN[weak]}</b>. ${advice}</p></div>
  ${wr ? `<details class="card left"><summary><b>Bài viết: ${wr.r.total}/10</b> · xem nhận xét chi tiết</summary>${Grader.report(wr.r, wr.wr)}<div class="model"><b>Bài mẫu</b><p>${esc(wr.wr.model).replace(/\n/g, "<br>")}</p></div></details>` : ""}
  ${xs ? `<details class="card left"><summary><b>Câu trả lời phần Nói: ${xs.q}%</b></summary><p>“${esc(xs.text)}”</p>${Grader.report(xs.r, {})}</details>` : ""}
  <div class="stack">${pass ? `<button class="btn primary full lg" onclick="showCert('${lv}')"><i class="ti ti-certificate"></i> Xem chứng nhận</button>` : `<button class="btn primary full lg" onclick="startMock('${lv}')"><i class="ti ti-refresh"></i> Thi lại</button>`}<button class="btn full" onclick="nav('exam')">Về trang Thi thử</button></div></div>`;
  P = null; document.body.classList.add("playing"); window.scrollTo(0, 0);
  if (pass) { beep("done"); confetti(); } checkBadges(); checkDay();
}

/* ---------- Chứng nhận ---------- */
function showCert(lv) {
  const c = S.certs[lv]; if (!c) return;
  VIEW = () => {
    const d = new Date(c.at), ds = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
    app().innerHTML = `<div class="ptop noprint"><button class="ib" onclick="nav('exam')" aria-label="Quay lại"><i class="ti ti-arrow-left"></i></button><span class="muted sm">Chứng nhận</span></div>
    <div class="cert" id="cert"><div class="certin"><p class="ct">CHỨNG NHẬN NĂNG LỰC TIẾNG ANH</p><p class="cs">Certificate of English Proficiency</p><p class="cn">${esc(S.name || "Học viên")}</p><p>đã hoàn thành bài thi thử và đạt chuẩn</p><div class="clv">${lv}</div><p class="cs">${EXAMS[lv].name.split("–")[1].trim()} · Khung tham chiếu châu Âu (CEFR)</p>
    <div class="cgrid">${Object.keys(SECN).map(x => `<div><b>${c.skills[x]}%</b><small>${SECN[x]}</small></div>`).join("")}</div><p>Điểm trung bình <b>${c.overall}%</b>${c.merit ? " · <b>Xuất sắc</b>" : ""}</p><p class="sm">Ngày ${ds} · Tiếng Anh Từ Số 0</p></div></div>
    <div class="noprint"><label class="lab">Tên in trên chứng nhận</label><input class="inp" id="nm" value="${esc(S.name || "")}" placeholder="Nhập họ tên của bạn" oninput="S.name=this.value;save();document.querySelector('.cn').textContent=this.value||'Học viên'">
    <button class="btn primary full lg" onclick="window.print()"><i class="ti ti-printer"></i> In hoặc lưu PDF</button><p class="note">Đây là chứng nhận luyện tập trong app, giúp bạn tự đánh giá trình độ. Để có chứng chỉ chính thức, hãy thi tại các tổ chức như Cambridge, IELTS, Aptis.</p></div>`;
  };
  P = null; render(); window.scrollTo(0, 0);
}
