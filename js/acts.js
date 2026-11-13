"use strict";
/* ================== 10 dạng hoạt động mới ==================
   Đóng vai · Nói đuổi · Nghe hội thoại · Chép chính tả cả đoạn · Ghép hỏi–đáp · Sắp xếp đoạn văn ·
   Điền từ vào đoạn văn · Đúng/Sai/Không có thông tin · Tả tranh · Nhật ký 3 câu.
   Nội dung: js/acts-data.js (window.ACTS). Mỗi bài học có 2 hoạt động, chèn trước bài viết cuối bài.
   Bước (step) của các dạng này: { type, sk, ext: 1, lv: chặng, it: nội dung }. Trạng thái tạm lưu trên bước
   (s.k, s.pool...), được đặt lại mỗi lần hiển thị nên "học tiếp" (S.resume) luôn bắt đầu lại hoạt động từ đầu.
   Các nút gọi XA.* (đối tượng toàn cục riêng, không đè hàm của app). */
(function () {
  const A = window.ACTS || {}, POOL = A._pool || {};
  /* build.js chỉ gom icon có dạng ti-<tên> trong mã: ti-messages ti-repeat ti-headphones ti-file-text ti-puzzle ti-list-numbers ti-forms ti-checklist ti-photo ti-notebook */
  const T = {
    role: { sk: "speak", ic: "messages", n: "Đóng vai hội thoại" },
    shadow: { sk: "speak", ic: "repeat", n: "Nói đuổi theo câu" },
    dlg: { sk: "listen", ic: "headphones", n: "Nghe hội thoại rồi trả lời" },
    pdict: { sk: "listen", ic: "file-text", n: "Chép chính tả cả đoạn" },
    match: { sk: "read", ic: "puzzle", n: "Ghép đôi" },
    porder: { sk: "read", ic: "list-numbers", n: "Sắp xếp đoạn văn" },
    cloze: { sk: "vocab", ic: "forms", n: "Điền từ vào đoạn văn" },
    tfng: { sk: "read", ic: "checklist", n: "Đúng / Sai / Không có thông tin" },
    pic: { sk: "speak", ic: "photo", n: "Tả tranh" },
    journal: { sk: "write", ic: "notebook", n: "Nhật ký 3 câu" }
  };
  const STAGE_OF = new Map();
  Object.keys(A).forEach(id => { if (id !== "_pool" && Array.isArray(A[id])) A[id].forEach(it => STAGE_OF.set(it, id.split("-")[0])); });
  Object.keys(POOL).forEach(st => POOL[st].forEach(it => STAGE_OF.set(it, st)));

  /* ---------- tiện ích ---------- */
  const cur = s => !!(P && P.steps && P.steps[P.i] === s);
  const st = () => (P && P.steps ? P.steps[P.i] : null);
  const lab = (s, txt) => `<p class="lab"><i class="ti ti-${T[s.type].ic}"></i> ${SK[T[s.type].sk]} · ${txt || T[s.type].n}</p>`;
  const vi = (t, cls) => `<p class="ax-vi${cls ? " " + cls : ""}">${t}</p>`;
  const hasTTS = () => ("speechSynthesis" in window) && !noTTS();
  const hasSR = () => !!SR && !micBlocked;
  const low = s => ["s0", "a1", "a2"].includes(s.lv);
  const mock = () => P && P.kind === "mock";
  // câu trả lời tiếng Việt: có chữ chỉ tiếng Việt mới có (ă, đ, ơ, ư, dấu nặng/hỏi/ngã), hoặc nhiều chữ có dấu (café, résumé vẫn là tiếng Anh)
  const VN1 = /[ăâđơưạảãầấậẩẫằắặẳẵẹẻẽềếệểễịỉĩọỏõồốộổỗờớợởỡụủũừứựửữỳỵỷỹ]/i, VNA = /[àáèéêìíòóôùúý]/gi;
  const VN = { test: t => VN1.test(t) || (String(t).match(VNA) || []).length >= 3 };
  const words = t => wcount(String(t || ""));
  // đạt: ≥ 4 ý thì được sai 1, ít hơn thì phải đúng hết
  const pass = (ok, n) => n >= 4 ? ok >= n - 1 : ok === n;
  const shuf = (a, notSame) => { let b = shuffle(a); for (let g = 0; g < 6 && notSame && a.length > 1 && b.every((x, i) => x === a[i]); g++) b = shuffle(a); return b; };
  const kwGroups = s => String(s || "").split(";").map(g => g.split("/").map(x => x.trim()).filter(Boolean)).filter(g => g.length);
  const hitG = (text, g) => g.some(a => kwHit(text, a));
  const say2 = (t, o) => { if (hasTTS()) say(t, false, o); else if (o && o.onend) o.onend(); };
  const noVoice = () => `<p class="sm muted c">Máy chưa có giọng đọc tiếng Anh nên phần này hiện chữ để bạn đọc.</p>`;
  const DAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

  /* Giọng đọc hai người: hai giọng tiếng Anh khác nhau nếu máy có, nếu không thì đổi cao độ giọng */
  function enVoices() {
    try { loadV(); } catch (e) {}
    const acc = S.settings.accent, en = voices.filter(v => /^en/i.test(v.lang)), same = en.filter(v => v.lang.replace("_", "-") === acc);
    const pref = v => /Google|Natural|Samantha|Daniel|Aria|Jenny|Alex|Karen|Moira/i.test(v.name) ? 0 : 1;
    return same.sort((a, b) => pref(a) - pref(b)).concat(en.filter(v => !same.includes(v)));
  }
  function sayAs(t, who, o) {
    o = o || {};
    if (!hasTTS()) { if (o.onend) o.onend(); return; }
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(spoken(t)), vs = enVoices();
      u.lang = S.settings.accent;
      if (vs.length) u.voice = vs[who % vs.length];
      u.pitch = vs.length > who ? 1 : [1, 1.3, 0.8][who % 3];
      u.rate = o.slow ? 0.68 : S.settings.rate;
      let done = false; const end = () => { if (done) return; done = true; if (o.onend) o.onend(); };
      u.onend = end; u.onerror = end; speechSynthesis.speak(u);
    } catch (e) { if (o.onend) o.onend(); }
  }
  const XA = window.XA = { pid: 0 };

  /* ================== 1. Đóng vai hội thoại ================== */
  function roleEval(turn, text) {
    text = String(text || "").trim();
    if (!text || VN.test(text)) return false;
    const n = words(text), G = kwGroups(turn[2]), hits = G.filter(g => hitG(text, g)).length, need = Math.max(1, Math.ceil(G.length * 0.5));
    if (n >= 2 && hits >= need) return true;
    if (n >= 2 && compare(text, turn[3]) > 0) return true;
    if (n >= 3 && Grader.answerCheck) { const ac = Grader.answerCheck(text, [turn[0], turn[3]], []); if (ac.sentence && ac.rel >= 0.6 && ac.topicHits >= 2) return true; }
    return false;
  }
  const bubThem = (s, t, k) => `<div class="ax-b them"><span class="ax-who">${esc(s.it.who || "Bạn nói chuyện")}</span><p>${esc(t[0])}${hasTTS() ? spk(t[0], "sm") : ""}</p>${t[1] ? (low(s) ? `<p class="ax-tr">${esc(t[1])}</p>` : `<button class="link sm ax-trb" onclick="this.nextElementSibling.classList.toggle('on')">Xem nghĩa</button><p class="ax-tr ax-hid">${esc(t[1])}</p>`) : ""}</div>`;
  function roleArea(s) {
    const t = s.it.turns[s.k];
    const hint = `<p class="ax-hint"><i class="ti ti-bulb"></i> Gợi ý: ${esc(t[4])}</p>`;
    if (s.typing || !hasSR()) return hint + `<textarea id="inp" rows="2" placeholder="Gõ câu trả lời bằng tiếng Anh" oninput="$('#er').textContent=''" autocapitalize="sentences" autocomplete="off" spellcheck="false"></textarea><p class="err" id="er"></p><button class="btn primary full" id="chk" onclick="XA.rSend()">Gửi câu trả lời</button>`;
    return hint + `<button class="btn primary full lg" onclick="XA.rMic()"><i class="ti ti-microphone"></i> Bấm rồi trả lời</button><button class="link c" onclick="XA.rType()">Không dùng micro được? Gõ câu trả lời</button><p class="err" id="er"></p>`;
  }
  function role(s) {
    s.k = 0; s.okN = 0; s.tries = 0; s.typing = 0;
    setTimeout(() => { if (cur(s) && s.k === 0) say2(s.it.turns[0][0]); }, 400);
    return lab(s) + `<div class="ax-sc"><i class="ti ti-messages"></i>${vi(esc(s.it.sc))}</div>${hasTTS() ? "" : noVoice()}<div class="ax-chat" id="axc">${bubThem(s, s.it.turns[0], 0)}</div><div id="axa">${roleArea(s)}</div>`;
  }
  XA.rType = () => { const s = st(); if (!s || P.ans) return; micOff(); s.typing = 1; $("#axa").innerHTML = roleArea(s); const i = $("#inp"); if (i) i.focus(); };
  XA.rMic = () => {
    const s = st(); if (!s || P.ans) return; $("#axa").innerHTML = micUI("Đang nghe... hãy trả lời");
    listenMic(alts => { if (!cur(s)) return; const t = s.it.turns[s.k]; XA.rAnswer(alts.find(a => roleEval(t, a)) || alts[0]); },
      err => { if (!cur(s)) return; const m = err === "no-speech" ? "Chưa nghe thấy gì. Hãy nói to và rõ hơn." : (micErrMsg(err) || "Chưa dùng được micro."); $("#axa").innerHTML = `<p class="sm muted c micmsg">${m}</p>${micBlocked ? "" : `<button class="btn primary full" onclick="XA.rMic()"><i class="ti ti-microphone"></i> Thử lại</button>`}<button class="link c" onclick="XA.rType()">Gõ câu trả lời</button>`; },
      { onpart: t => { if (cur(s)) micLive(t); } });
  };
  XA.rSend = () => { const s = st(), i = $("#inp"); if (!s || !i || P.ans) return; const v = i.value.trim(); if (!v) { $("#er").textContent = "Hãy gõ câu trả lời trước."; return; } XA.rAnswer(v); };
  XA.rAnswer = text => {
    const s = st(); if (!s || P.ans) return; const t = s.it.turns[s.k], ok = roleEval(t, text), c = $("#axc");
    c.insertAdjacentHTML("beforeend", `<div class="ax-b me ${ok ? "ok" : "bad"}"><p>${esc(text)}</p></div>`);
    if (!ok && VN.test(text)) { c.insertAdjacentHTML("beforeend", `<p class="ax-note bad">Hãy trả lời bằng tiếng Anh nhé.</p>`); $("#axa").innerHTML = roleArea(s); return; }
    if (!ok && !s.tries) { s.tries = 1; c.insertAdjacentHTML("beforeend", `<p class="ax-note bad">Câu trả lời chưa đúng ý. Bạn có thể nói: <b>${esc(t[3])}</b> ${hasTTS() ? spk(t[3], "sm") : ""}</p>`);
      $("#axa").innerHTML = `<div class="row2"><button class="btn" onclick="XA.rNext(false)">Bỏ qua</button><button class="btn primary" onclick="XA.rRetry()"><i class="ti ti-refresh"></i> Thử lại</button></div>`; return; }
    if (ok) { s.okN++; if (norm(text) !== norm(t[3])) c.insertAdjacentHTML("beforeend", `<p class="ax-note">Tốt lắm! Câu mẫu: ${esc(t[3])}</p>`); }
    else c.insertAdjacentHTML("beforeend", `<p class="ax-note bad">Câu mẫu: <b>${esc(t[3])}</b></p>`);
    XA.rNext(null);
  };
  XA.rRetry = () => { const s = st(); if (!s || P.ans) return; $("#axa").innerHTML = roleArea(s); };
  XA.rNext = skipped => {
    const s = st(); if (!s || P.ans) return; const c = $("#axc"), n = s.it.turns.length;
    if (skipped === false) c.insertAdjacentHTML("beforeend", `<p class="ax-note">Câu mẫu: ${esc(s.it.turns[s.k][3])}</p>`);
    s.k++; s.tries = 0;
    if (s.k < n) { c.insertAdjacentHTML("beforeend", bubThem(s, s.it.turns[s.k], s.k)); $("#axa").innerHTML = roleArea(s); say2(s.it.turns[s.k][0]); const b = c.lastElementChild; if (b && b.scrollIntoView) try { b.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {} return; }
    if (s.it.end) { c.insertAdjacentHTML("beforeend", bubThem(s, [s.it.end, ""], n)); say2(s.it.end); }
    $("#axa").innerHTML = "";
    const ok = s.okN >= Math.ceil(n * 0.66);
    grade(ok, "", `Đối đáp tốt ${s.okN}/${n} lượt!`, ok ? "" : `<p class="sm">Bạn trả lời đúng ý ${s.okN}/${n} lượt. Xem lại các câu mẫu trong khung hội thoại.</p>`);
  };

  /* ================== 2. Nói đuổi theo câu ================== */
  const shItem = s => { const p = s.it.s[s.k].split("|"); return { en: p[0], vi: p[1] || "" }; };
  function shView(s) {
    const x = shItem(s), n = s.it.s.length, show = !hasTTS() || s.reveal;
    return `<div class="say ax-sh"><p class="sm muted">Câu ${s.k + 1}/${n}</p><h2 id="axt" class="${show ? "" : "ax-blur"}">${esc(x.en)}</h2><p class="vi">${esc(x.vi)}</p>${show ? "" : `<button class="link sm" id="axrv" onclick="XA.shReveal()"><i class="ti ti-eye"></i> Xem câu</button>`}</div>`;
  }
  function shCtl(s) {
    const x = shItem(s);
    if (!hasTTS()) return `<button class="btn primary full lg" onclick="XA.shMic()"><i class="ti ti-microphone"></i> Bấm rồi đọc to</button>`;
    return `<button class="btn primary full lg" id="axgo" onclick="XA.shGo()"><i class="ti ti-player-play"></i> Nghe rồi nói đuổi ngay</button><div class="c">${slowBtn(x.en)}</div>`;
  }
  function shadow(s) {
    s.k = 0; s.okN = 0; s.tries = 0; s.reveal = 0;
    if (!hasSR()) {
      return lab(s) + vi("Nghe từng câu rồi nói lại ngay theo đúng nhịp của máy, 2–3 lần cho trôi chảy, sau đó tự đánh giá.") +
        `<div class="ax-list">${s.it.s.map(l => { const p = l.split("|"); return `<div class="word">${hasTTS() ? spk(p[0]) : ""}<div class="grow"><b>${esc(p[0])}</b><span class="vi">${esc(p[1] || "")}</span></div>${hasTTS() ? `<button class="ib slow" onclick="say('${jsq(p[0])}',1)" aria-label="Nghe chậm"><i class="ti ti-snail"></i><small>Chậm</small></button>` : ""}</div>`; }).join("")}</div>` +
        `<p class="muted c sm">Máy này chưa nhận được giọng nói nên bạn tự đánh giá.</p><div class="row2"><button class="btn" onclick="XA.shSelf(false)">Chưa được</button><button class="btn primary" id="axself" onclick="XA.shSelf(true)">Nói được rồi</button></div>`;
    }
    return lab(s) + vi(hasTTS() ? "Máy đọc một câu, bạn nói lại <b>ngay sau đó</b>, giữ đúng nhịp và ngữ điệu. Câu tiếng Anh được che đi để bạn tập nghe; bấm “Xem câu” nếu cần." : "Đọc to từng câu, máy sẽ chấm từng từ.") + `<div id="axsv">${shView(s)}</div><div id="mic">${shCtl(s)}</div>`;
  }
  XA.shSelf = ok => { const s = st(); if (!s || P.ans) return; grade(!!ok, "", ok ? "Tốt lắm! Giữ nhịp như vậy nhé." : null); };
  XA.shReveal = () => { const s = st(); if (!s) return; s.reveal = 1; const h = $("#axt"); if (h) h.classList.remove("ax-blur"); const b = $("#axrv"); if (b) b.remove(); };
  XA.shGo = () => {
    const s = st(); if (!s || P.ans) return; const x = shItem(s), id = ++XA.pid;
    $("#mic").innerHTML = `<div class="listening ax-play"><i class="ti ti-volume"></i> Máy đang đọc, chuẩn bị nói theo…</div>`;
    let started = false; const go = () => { if (started || id !== XA.pid || !cur(s)) return; started = true;
      if (isIOSDev()) $("#mic").innerHTML = `<button class="btn primary full lg" onclick="XA.shMic()"><i class="ti ti-microphone"></i> Nói ngay</button>`; else XA.shMic(); };
    say(x.en, false, { onend: go, onerror: go });
    setTimeout(go, (words(x.en) / 2 + 2.5) * 1000 / (S.settings.rate || 0.9)); // máy không báo đọc xong thì vẫn bật micro
  };
  XA.shMic = () => {
    const s = st(); if (!s || P.ans) return; const x = shItem(s);
    $("#mic").innerHTML = micUI("Đang nghe... nói lại câu vừa nghe");
    listenMic(alts => { if (!cur(s)) return; let best = alts[0], sc = -1; alts.forEach(a => { const v = speakScore(x.en, a); if (v > sc) { sc = v; best = a; } }); XA.shRes(best, sc); },
      err => { if (!cur(s)) return; const m = err === "no-speech" ? "Chưa nghe thấy gì. Hãy nói to và rõ hơn." : (micErrMsg(err) || "Chưa dùng được micro.");
        $("#mic").innerHTML = `<p class="sm muted c micmsg">${m}</p>${micBlocked ? "" : `<button class="btn primary full" onclick="XA.shGo()"><i class="ti ti-refresh"></i> Thử lại</button>`}<div class="row2"><button class="btn" onclick="XA.shSelf(false)">Chưa được</button><button class="btn primary" onclick="XA.shSelf(true)">Tự đánh giá: nói được</button></div>`; },
      { onpart: t => { if (cur(s)) micLive(t); } });
  };
  XA.shRes = (heard, sc) => {
    const s = st(); if (!s || P.ans) return; const x = shItem(s), n = s.it.s.length, last = s.k >= n - 1;
    s.reveal = 1; const h = $("#axt"); if (h) { h.classList.remove("ax-blur"); h.innerHTML = diffWords(x.en, heard); } const rb = $("#axrv"); if (rb) rb.remove();
    s.tries++;
    const nextB = `<button class="btn primary full" onclick="XA.shNext()">${last ? "Xem kết quả" : "Câu tiếp theo"} <i class="ti ti-arrow-right"></i></button>`;
    if (sc >= 70) { s.okN++; $("#mic").innerHTML = `<p class="heard">Máy nghe được: “${esc(heard)}” · <b>${sc}%</b> từ đúng</p><p class="sm good c"><i class="ti ti-circle-check"></i> Bắt nhịp tốt!</p>` + nextB; return; }
    $("#mic").innerHTML = `<p class="heard">Máy nghe được: “${esc(heard)}” · <b>${sc}%</b> từ đúng<br><span class="sm muted">Từ màu đỏ là từ máy chưa nghe rõ.</span></p>` + (s.tries < 3 ? `<div class="row2"><button class="btn" onclick="XA.shNext()">Bỏ qua</button><button class="btn primary" onclick="XA.shGo()"><i class="ti ti-refresh"></i> Thử lại</button></div>` : nextB);
  };
  XA.shNext = () => {
    const s = st(); if (!s || P.ans) return; const n = s.it.s.length;
    if (s.k < n - 1) { s.k++; s.tries = 0; s.reveal = 0; $("#axsv").innerHTML = shView(s); $("#mic").innerHTML = shCtl(s); return; }
    $("#mic").innerHTML = "";
    const ok = s.okN >= Math.ceil(n * 0.66);
    grade(ok, "", `Nói đuổi tốt ${s.okN}/${n} câu!`, ok ? "" : `<p class="sm">Bạn nói đạt ${s.okN}/${n} câu. Nghe chậm vài lần rồi luyện lại nhé.</p>`);
  };

  /* ================== 3. Nghe hội thoại ================== */
  const dLines = s => { const who = []; return s.it.l.map(l => { const m = l.match(/^([^:]{1,24}):\s*(.*)$/), name = m ? m[1].trim() : "", t = m ? m[2] : l; if (name && !who.includes(name)) who.push(name); return { name, t, w: Math.max(0, who.indexOf(name)) }; }); };
  const dTrans = s => `<div class="ax-tx">${dLines(s).map((L, k) => `<p class="ax-ln w${L.w % 3}" id="xl${k}"><b>${esc(L.name)}:</b> ${esc(L.t)}${hasTTS() ? spk(L.t, "sm") : ""}</p>`).join("")}</div>`;
  function dlg(s) {
    s.Q = s.it.q.map(x => { const p = x.split("|"), o = shuffle([...new Set(p.slice(1).filter(Boolean))]); return { q: p[0], o, a: o.indexOf(p[1]), sel: -1 }; });
    s.played = 0; const tts = hasTTS();
    if (tts) setTimeout(() => { if (cur(s) && !s.played) XA.dPlay(); }, 450);
    return lab(s) + `<div class="ax-sc"><i class="ti ti-headphones"></i>${vi(esc(s.it.sc))}</div>` +
      (tts ? `<div class="c"><button class="spk xl" onclick="XA.dPlay()" aria-label="Nghe hội thoại"><i class="ti ti-volume"></i></button><button class="link" onclick="XA.dPlay(1)"><i class="ti ti-snail"></i> Nghe chậm</button><span class="sm muted" id="axpl">Nghe cả đoạn hội thoại rồi trả lời câu hỏi</span></div><div id="axtr"></div>` : noVoice() + `<div id="axtr">${dTrans(s)}</div>`) +
      s.Q.map((q, k) => `<div class="rq"><p><b>${k + 1}.</b> ${esc(q.q)}</p><div class="opts">${q.o.map((o, i) => `<button class="opt" id="xq${k}_${i}" onclick="XA.dPick(${k},${i})">${esc(o)}</button>`).join("")}</div></div>`).join("") +
      `<p class="err" id="er"></p><button class="btn primary full" id="xok" onclick="XA.dCheck()">Kiểm tra</button>`;
  }
  XA.dPlay = slow => {
    const s = st(); if (!s || s.type !== "dlg") return; const L = dLines(s), id = ++XA.pid; let k = 0; s.played = 1;
    const pl = $("#axpl"); if (pl) pl.textContent = "Đang phát hội thoại…";
    const next = () => { if (id !== XA.pid || !cur(s)) return; $$(".ax-ln.on").forEach(e => e.classList.remove("on"));
      if (k >= L.length) { const p = $("#axpl"); if (p) p.textContent = "Bấm loa để nghe lại"; return; }
      const x = L[k], el = $("#xl" + k); if (el) el.classList.add("on"); k++;
      sayAs(x.t, x.w, { slow, onend: () => setTimeout(next, 380) }); };
    next();
  };
  XA.dPick = (k, i) => { const s = st(); if (!s || P.ans) return; s.Q[k].sel = i; s.Q[k].o.forEach((_, j) => { const b = $("#xq" + k + "_" + j); if (b) b.classList.toggle("picked", j === i); }); $("#er").textContent = ""; };
  XA.dCheck = () => {
    const s = st(); if (!s || P.ans) return; const miss = s.Q.filter(q => q.sel < 0).length;
    if (miss) { $("#er").textContent = `Còn ${miss} câu chưa chọn đáp án.`; return; }
    let ok = 0; s.Q.forEach((q, k) => { q.o.forEach((_, j) => { const b = $("#xq" + k + "_" + j); b.disabled = true; b.classList.remove("picked"); }); $("#xq" + k + "_" + q.a).classList.add("right"); if (q.sel === q.a) ok++; else $("#xq" + k + "_" + q.sel).classList.add("wrong"); });
    XA.pid++; $("#xok").remove(); const pl = $("#axpl"); if (pl) pl.textContent = "Bấm loa để nghe lại"; $("#axtr").innerHTML = `<details class="ax-det" open><summary>Lời thoại</summary>${dTrans(s)}</details>`;
    grade(pass(ok, s.Q.length), "", `Đúng ${ok}/${s.Q.length} câu!`, pass(ok, s.Q.length) ? "" : `<p class="sm">Đúng ${ok}/${s.Q.length} câu. Đọc lời thoại bên trên và nghe lại nhé.</p>`);
  };

  /* ================== 4. Chép chính tả cả đoạn ================== */
  function pdView(s) {
    const n = s.it.p.length;
    return `<p class="sm muted c" id="axpk">Câu ${s.k + 1}/${n}</p><div class="ax-dots">${s.it.p.map((_, i) => `<span class="${i < s.k ? "done" : i === s.k ? "on" : ""}"></span>`).join("")}</div>` +
      (s.ans.length ? `<div class="ax-typed">${s.ans.map(a => `<p>${esc(a)}</p>`).join("")}</div>` : "");
  }
  function pdict(s) {
    s.k = 0; s.ans = []; s.audio = s.it.p[0];
    if (!hasTTS()) return lab(s) + `<p class="muted c">Máy chưa có giọng đọc tiếng Anh nên chưa làm được bài nghe chép này.</p><button class="btn primary full" onclick="XA.pdSkip()">Bỏ qua</button>`;
    setTimeout(() => { if (cur(s) && s.k === 0) say(s.it.p[0]); }, 400);
    return lab(s) + vi("Máy đọc từng câu của một đoạn văn. Gõ lại câu bạn nghe được rồi bấm <b>Câu tiếp</b> (hoặc Enter). Bấm loa để nghe lại.") +
      `<div class="c">${`<button class="spk xl" onclick="XA.pdSay()" aria-label="Nghe"><i class="ti ti-volume"></i></button>`}<button class="link" onclick="XA.pdSay(1)"><i class="ti ti-snail"></i> Nghe chậm</button></div><div id="axpv">${pdView(s)}</div>` +
      `<textarea id="inp" rows="2" placeholder="Gõ câu bạn nghe được" oninput="$('#er').textContent=''" autocapitalize="sentences" autocomplete="off" spellcheck="false"></textarea><p class="err" id="er"></p><button class="btn primary full" id="chk" onclick="XA.pdNext()">${s.it.p.length > 1 ? "Câu tiếp" : "Kiểm tra"}</button>`;
  }
  XA.pdSkip = () => { const s = st(); if (!s || P.ans) return; grade(false, "", null, "", `<p class="fbt"><i class="ti ti-volume-off"></i> <span class="fbm">Đã bỏ qua bài nghe chép</span></p>`); };
  XA.pdSay = slow => { const s = st(); if (s && s.type === "pdict") say(s.it.p[s.k], slow); };
  XA.pdNext = () => {
    const s = st(); if (!s || P.ans) return; const i = $("#inp"), v = i.value.trim(), n = s.it.p.length;
    if (!v) { $("#er").textContent = "Hãy gõ câu bạn nghe được trước."; return; }
    s.ans.push(v); s.k++;
    if (s.k < n) { s.audio = s.it.p[s.k]; i.value = ""; $("#axpv").innerHTML = pdView(s); $("#chk").textContent = s.k === n - 1 ? "Kiểm tra" : "Câu tiếp"; i.focus(); setTimeout(() => { if (cur(s)) say(s.it.p[s.k]); }, 250); return; }
    let sum = 0; const rows = s.it.p.map((en, k) => { const a = s.ans[k], c = compare(a, en), T2 = norm(en).split(" "), sc = c > 0 ? 1 : lcsWords(norm(a).split(" "), T2) / T2.length; sum += sc;
      return `<div class="ax-pdr ${c > 0 ? "ok" : "bad"}"><i class="ti ti-${c > 0 ? "circle-check" : "alert-circle"}"></i><div class="grow">${c === 2 ? `<p class="diff">${esc(en)}</p>` : diffHtml(a, en)}</div>${spk(en, "sm")}</div>`; }).join("");
    const acc = Math.round(sum / n * 100), ok = acc >= 85;
    i.remove(); $("#chk").remove(); $("#axpv").innerHTML = "";
    $("#er").insertAdjacentHTML("afterend", `<div class="diffbox"><p class="lab">So với đoạn gốc · đúng ${acc}%</p>${rows}<p class="sm muted"><span class="dx">gạch đỏ</span> là từ thừa hoặc sai, <span class="dm">chữ xanh</span> là từ còn thiếu.</p><p class="ax-vi sm">${esc(s.it.vi || "")}</p></div>`);
    grade(ok, "", `Chép đúng ${acc}% đoạn văn!`, ok ? "" : `<p class="sm">Bạn chép đúng ${acc}%, cần từ 85%. Xem phần so sánh bên trên.</p>`);
  };

  /* ================== 5. Ghép đôi ================== */
  function mDraw(s) {
    const L = s.it.pr.map(p => p.split("|")[0]), R = s.it.pr.map(p => p.split("|")[1]);
    $("#axm").innerHTML = `<div class="ax-col">${L.map((t, i) => `<button class="ax-mi${s.done[i] ? " ok" : s.sL === i ? " sel" : ""}" id="xmL${i}" ${s.done[i] ? "disabled" : ""} onclick="XA.mL(${i})">${s.done[i] ? `<span class="ax-n">${s.done[i]}</span>` : ""}${esc(t)}</button>`).join("")}</div>` +
      `<div class="ax-col">${s.R.map((ri, j) => `<button class="ax-mi${s.done[ri] ? " ok" : s.sR === j ? " sel" : ""}" id="xmR${j}" ${s.done[ri] ? "disabled" : ""} onclick="XA.mR(${j})">${s.done[ri] ? `<span class="ax-n">${s.done[ri]}</span>` : ""}${esc(R[ri])}</button>`).join("")}</div>`;
  }
  function match(s) {
    const n = s.it.pr.length; s.R = shuf([...Array(n).keys()], true); s.done = {}; s.cnt = 0; s.err = 0; s.sL = -1; s.sR = -1;
    setTimeout(() => { if (cur(s)) mDraw(s); }, 0);
    const html = lab(s, s.it.lab || "Ghép câu hỏi với câu trả lời") + vi("Bấm một ô bên trái rồi bấm ô phù hợp bên phải. Cặp đúng sẽ được đánh số và khóa lại.") + `<div class="ax-mt" id="axm"></div><p class="sm muted c" id="axms">Đã ghép 0/${n} cặp</p>`;
    return html;
  }
  function mTry(s) {
    if (s.sL < 0 || s.sR < 0) return; const i = s.sL, j = s.sR, ri = s.R[j];
    if (ri === i) { s.cnt++; s.done[i] = s.cnt; s.sL = s.sR = -1; mDraw(s); }
    else { s.err++; beep("bad"); const a = $("#xmL" + i), b = $("#xmR" + j); [a, b].forEach(e => e && e.classList.add("bad")); s.sL = s.sR = -1; setTimeout(() => { if (cur(s) && !P.ans) mDraw(s); }, 450); }
    const n = s.it.pr.length, m = $("#axms"); if (m) m.textContent = `Đã ghép ${s.cnt}/${n} cặp` + (s.err ? ` · sai ${s.err} lần` : "");
    if (s.cnt === n) { const ok = n / (n + s.err) >= 0.75; grade(ok, "", s.err ? `Ghép xong, chỉ sai ${s.err} lần!` : "Ghép đúng hết ngay từ lần đầu!", ok ? "" : `<p class="sm">Bạn ghép sai ${s.err} lần. Đọc lại các cặp đúng bên trên nhé.</p>`); }
  }
  XA.mL = i => { const s = st(); if (!s || P.ans || s.done[i]) return; s.sL = i; if (hasTTS() && s.it.say !== 0 && /[a-z]/i.test(s.it.pr[i].split("|")[0]) && !VN.test(s.it.pr[i].split("|")[0])) say(s.it.pr[i].split("|")[0].replace(/[“”]/g, "")); mDraw(s); mTry(s); };
  XA.mR = j => { const s = st(); if (!s || P.ans || s.done[s.R[j]]) return; s.sR = j; mDraw(s); mTry(s); };

  /* ================== 6. Sắp xếp đoạn văn ================== */
  function poDraw(s) {
    const p = s.it.p;
    $("#axpo").innerHTML = `<li class="fix"><span class="ax-n">1</span><span class="grow">${esc(p[0])}</span><i class="ti ti-lock"></i></li>` + s.ans.map((k, i) => `<li><button onclick="XA.poDel(${i})"><span class="ax-n">${i + 2}</span><span class="grow">${esc(p[k])}</span><i class="ti ti-x"></i></button></li>`).join("") + (s.pool.length ? `<li class="ph"><span class="ax-n">${s.ans.length + 2}</span><span class="muted sm">Bấm câu tiếp theo bên dưới</span></li>` : "");
    $("#axpp").innerHTML = s.pool.map((k, j) => `<button class="ax-pc" onclick="XA.poAdd(${j})">${esc(p[k])}</button>`).join("");
  }
  function porder(s) {
    const n = s.it.p.length; s.pool = shuf([...Array(n).keys()].slice(1), true); s.ans = [];
    setTimeout(() => { if (cur(s)) poDraw(s); }, 0);
    return lab(s) + vi("Câu mở đầu đã cho sẵn. Bấm lần lượt các câu bên dưới theo đúng thứ tự để tạo thành một đoạn văn mạch lạc. Chú ý các từ nối và đại từ (First, Then, However, It, He...). Bấm vào câu đã xếp để bỏ ra.") +
      `<ol class="ax-po" id="axpo"></ol><div class="ax-pool" id="axpp"></div><p class="err" id="er"></p><button class="btn primary full" id="xok" onclick="XA.poCheck()">Kiểm tra</button>`;
  }
  XA.poAdd = j => { const s = st(); if (!s || P.ans) return; s.ans.push(s.pool.splice(j, 1)[0]); $("#er").textContent = ""; poDraw(s); };
  XA.poDel = i => { const s = st(); if (!s || P.ans) return; s.pool.push(s.ans.splice(i, 1)[0]); poDraw(s); };
  XA.poCheck = () => {
    const s = st(); if (!s || P.ans) return; if (s.pool.length) { $("#er").textContent = "Hãy xếp hết các câu trước."; return; }
    const ok = s.ans.every((k, i) => k === i + 1), p = s.it.p;
    $("#xok").remove(); $("#axpp").remove();
    $("#axpo").innerHTML = `<li class="fix"><span class="ax-n">1</span><span class="grow">${esc(p[0])}</span></li>` + s.ans.map((k, i) => `<li class="${k === i + 1 ? "ok" : "bad"}"><span class="ax-n">${i + 2}</span><span class="grow">${esc(p[k])}</span><i class="ti ti-${k === i + 1 ? "check" : "x"}"></i></li>`).join("");
    if (!ok) $("#axpo").insertAdjacentHTML("afterend", `<div class="diffbox"><p class="lab">Đoạn văn đúng</p><div class="passage ax-para">${p.map(esc).join(" ")}</div></div>`);
    grade(ok, "", "Đoạn văn rất mạch lạc!");
  };

  /* ================== 7. Điền từ vào đoạn văn ================== */
  const czParse = s => { const parts = [], ans = []; String(s.it.x).split(/\[([^\]]+)\]/).forEach((x, i) => { if (i % 2) { ans.push(x); parts.push({ b: ans.length - 1 }); } else parts.push({ t: x }); }); return { parts, ans }; };
  const atStart = (parts, k) => { let pre = ""; for (const p of parts) { if (p.b === k) break; pre += p.t !== undefined ? p.t : "x"; } return /(^|[.!?:]\s*|\n\s*)$/.test(pre.replace(/\s+$/, " ").replace(/^\s+$/, "")) || !pre.trim(); };
  const capF = w => w.charAt(0).toUpperCase() + w.slice(1);
  function czDraw(s) {
    const P2 = s.cz.parts;
    $("#axcz").innerHTML = P2.map(p => {
      if (p.t !== undefined) return esc(p.t).replace(/\n/g, "<br>");
      const k = p.b, f = s.fill[k], st0 = s.cz.start[k], w = f === null ? "" : (st0 ? capF(s.bank[f]) : s.bank[f]);
      return `<button class="ax-bl${f !== null ? " full" : ""}${s.sel === k ? " sel" : ""}" id="xb${k}" onclick="XA.cB(${k})" aria-label="Chỗ trống ${k + 1}"><span class="ax-bn">${k + 1}</span>${w ? esc(w) : "&nbsp;"}</button>`;
    }).join("");
    $("#axbk").innerHTML = s.bank.map((w, j) => `<button class="chip${s.fill.includes(j) ? " used" : ""}" id="xw${j}" ${s.fill.includes(j) ? "disabled" : ""} onclick="XA.cW(${j})">${esc(w)}</button>`).join("");
  }
  function cloze(s) {
    s.cz = czParse(s); s.cz.start = s.cz.ans.map((_, k) => atStart(s.cz.parts, k));
    // từ trong khung: viết thường nếu chỉ viết hoa vì đứng đầu câu (không để lộ vị trí)
    s.bank = shuffle(s.cz.ans.map((a, k) => s.cz.start[k] && /^[A-Z][a-z]/.test(a) && !/^(I|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/.test(a) ? a.charAt(0).toLowerCase() + a.slice(1) : a).concat(s.it.w || []));
    s.fill = s.cz.ans.map(() => null); s.sel = 0;
    setTimeout(() => { if (cur(s)) czDraw(s); }, 0);
    return lab(s) + vi("Bấm vào một ô trống rồi chọn từ phù hợp trong khung. Mỗi từ dùng một lần, có một từ thừa. Bấm lại ô đã điền để bỏ từ ra.") +
      `<div class="passage ax-cz" id="axcz"></div><div class="chips ax-bank" id="axbk"></div><p class="err" id="er"></p><button class="btn primary full" id="xok" onclick="XA.cCheck()">Kiểm tra</button>`;
  }
  XA.cB = k => { const s = st(); if (!s || P.ans) return; if (s.fill[k] !== null) s.fill[k] = null; s.sel = k; czDraw(s); };
  XA.cW = j => { const s = st(); if (!s || P.ans || s.fill.includes(j)) return; let k = s.sel; if (k < 0 || s.fill[k] !== null) k = s.fill.indexOf(null); if (k < 0) return;
    s.fill[k] = j; const nx = s.fill.findIndex((f, i) => f === null && i > k); s.sel = nx >= 0 ? nx : s.fill.indexOf(null); $("#er").textContent = ""; czDraw(s); };
  XA.cCheck = () => {
    const s = st(); if (!s || P.ans) return; const miss = s.fill.filter(f => f === null).length;
    if (miss) { $("#er").textContent = `Còn ${miss} chỗ trống chưa điền.`; return; }
    let ok = 0; const n = s.cz.ans.length;
    s.cz.ans.forEach((a, k) => { const g = s.bank[s.fill[k]], right = g.toLowerCase() === a.toLowerCase(), b = $("#xb" + k); if (right) ok++;
      b.disabled = true; b.classList.remove("sel"); b.classList.add(right ? "ok" : "bad"); if (!right) b.insertAdjacentHTML("afterend", `<b class="ax-fix">${esc(a)}</b>`); });
    $$("#axbk .chip").forEach(c => c.disabled = true); $("#xok").remove();
    grade(pass(ok, n), "", `Điền đúng ${ok}/${n} chỗ trống!`, pass(ok, n) ? "" : `<p class="sm">Đúng ${ok}/${n} chỗ. Từ đúng được ghi màu xanh ngay sau ô sai.</p>`);
    const t = s.it.x.replace(/\[([^\]]+)\]/g, "$1").replace(/\n/g, " "); if (hasTTS()) setTimeout(() => { if (P && P.ans) say(t); }, 300);
  };

  /* ================== 8. Đúng / Sai / Không có thông tin ================== */
  const TF = [["T", "Đúng"], ["F", "Sai"], ["NG", "Không có thông tin"]];
  function tfng(s) {
    s.ST = s.it.st.map(x => { const p = x.split("|"); return { q: p[0], a: TF.findIndex(t => t[0] === p[1]), why: p[2] || "", sel: -1 }; });
    const tx = s.it.x.replace(/\n/g, " ");
    return lab(s) + vi("<b>Đúng</b>: bài đọc nói đúng như vậy. <b>Sai</b>: bài đọc nói ngược lại. <b>Không có thông tin</b>: bài đọc không nhắc đến điều này.") +
      `<div class="passage">${esc(s.it.x).replace(/\n/g, "<br>")}</div>${hasTTS() && !mock() ? `<div class="row c2">${spk(tx)}<span class="muted sm">Nghe cả bài</span>${slowBtn(tx)}</div>` : ""}` +
      s.ST.map((q, k) => `<div class="ax-tf" id="xtq${k}"><p><b>${k + 1}.</b> ${esc(q.q)}</p><div class="ax-seg">${TF.map((t, i) => `<button class="opt" id="xt${k}_${i}" onclick="XA.tPick(${k},${i})">${t[1]}</button>`).join("")}</div></div>`).join("") +
      `<p class="err" id="er"></p><button class="btn primary full" id="xok" onclick="XA.tCheck()">Kiểm tra</button>`;
  }
  XA.tPick = (k, i) => { const s = st(); if (!s || P.ans) return; s.ST[k].sel = i; TF.forEach((_, j) => $("#xt" + k + "_" + j).classList.toggle("picked", j === i)); $("#er").textContent = ""; };
  XA.tCheck = () => {
    const s = st(); if (!s || P.ans) return; const miss = s.ST.filter(q => q.sel < 0).length;
    if (miss) { $("#er").textContent = `Còn ${miss} nhận định chưa chọn.`; return; }
    let ok = 0; s.ST.forEach((q, k) => { TF.forEach((_, j) => { const b = $("#xt" + k + "_" + j); b.disabled = true; b.classList.remove("picked"); }); $("#xt" + k + "_" + q.a).classList.add("right");
      if (q.sel === q.a) ok++; else $("#xt" + k + "_" + q.sel).classList.add("wrong");
      if (q.why && (q.sel !== q.a || q.a !== 0)) $("#xtq" + k).insertAdjacentHTML("beforeend", `<p class="ax-why"><i class="ti ti-bulb"></i> ${esc(q.why)}</p>`); });
    $("#xok").remove(); const n = s.ST.length;
    grade(pass(ok, n), "", `Đúng ${ok}/${n} nhận định!`, pass(ok, n) ? "" : `<p class="sm">Đúng ${ok}/${n} nhận định. Xem giải thích dưới từng câu.</p>`);
  };

  /* ================== 9. Tả tranh ================== */
  function scene(it) {
    if (it.chart) {
      const d = it.chart.d, max = Math.max(...d.map(x => x[1])) * 1.15, W = 320, H = 190, bw = Math.min(56, (W - 40) / d.length - 18);
      const gap = (W - 40 - bw * d.length) / (d.length + 1);
      return `<figure class="ax-chart" role="img" aria-label="${esc(it.chart.t)}"><figcaption>${esc(it.chart.t)}</figcaption><svg viewBox="0 0 ${W} ${H + 30}" xmlns="http://www.w3.org/2000/svg">` +
        [0.25, 0.5, 0.75, 1].map(f => `<line x1="30" x2="${W - 6}" y1="${H - f * (H - 16)}" y2="${H - f * (H - 16)}" class="gl"/>`).join("") + `<line x1="30" x2="${W - 6}" y1="${H}" y2="${H}" class="ax"/>` +
        d.map((x, i) => { const h = x[1] / max * (H - 16), X = 30 + gap + i * (bw + gap); return `<rect x="${X}" y="${H - h}" width="${bw}" height="${h}" rx="4" class="br"/><text x="${X + bw / 2}" y="${H - h - 6}" class="vl">${x[1]}%</text><text x="${X + bw / 2}" y="${H + 18}" class="lb">${esc(x[0])}</text>`; }).join("") + `</svg></figure>`;
    }
    const items = String(it.e || "").split(";").map(x => x.trim().split(/\s+/)).filter(a => a.length >= 4);
    return `<div class="ax-pic bg-${esc(it.bg || "park")}" role="img" aria-label="Tranh minh họa"><div class="ax-gr"></div>${items.map(a => `<span style="left:${+a[1]}%;top:${+a[2]}%;--z:${+a[3]}">${a[0]}</span>`).join("")}</div>`;
  }
  function pic(s) {
    const it = s.it, min = it.min || 12; s.txt = "";
    return lab(s, "Tả tranh bằng lời nói") + scene(it) + `<div class="say left"><p><b>${esc(it.q)}</b></p><p class="sm muted ax-vi">${esc(it.vi)}</p><p class="sm muted">Nói hoặc viết 2–4 câu, ít nhất ${min} từ, dùng các gợi ý:</p>${kwChips(it.kw)}</div>` +
      `<div id="mic">${hasSR() ? `<button class="btn primary full lg" onclick="XA.picMic()"><i class="ti ti-microphone"></i> Bấm rồi nói</button>` : ""}</div>` +
      `<textarea id="inp" rows="4" placeholder="${hasSR() ? "Chữ máy nghe được hiện ở đây, bạn sửa lại được. Cũng có thể gõ trực tiếp." : "Gõ câu trả lời bằng tiếng Anh"}" oninput="XA.picWc()" onkeydown="if(event.key==='Enter')event.stopPropagation()" autocapitalize="sentences" spellcheck="false"></textarea><p class="sm muted" id="wc">0 / ${min} từ</p><p class="err" id="er"></p><div id="wres"></div>` +
      `<button class="btn primary full" id="chk" onclick="XA.picCheck()">Chấm câu trả lời</button>${mock() ? "" : `<button class="link" id="skipm" onclick="XA.picSkip()">Xem bài mẫu và bỏ qua</button>`}`;
  }
  XA.picWc = () => { const s = st(), i = $("#inp"); if (!s || !i) return; $("#wc").textContent = words(i.value) + " / " + (s.it.min || 12) + " từ"; $("#er").textContent = ""; };
  XA.picMic = () => {
    const s = st(); if (!s || P.ans) return; const i = $("#inp"), base = i ? i.value.trim() : "";
    $("#mic").innerHTML = micUI("Đang nghe... hãy tả bức tranh");
    const back = () => `<button class="btn primary full lg" onclick="XA.picMic()"><i class="ti ti-microphone"></i> ${$("#inp") && $("#inp").value.trim() ? "Nói tiếp" : "Bấm rồi nói"}</button>`;
    listenMic(alts => { if (!cur(s)) return; const x = $("#inp"); if (x) x.value = (base + " " + alts[0]).trim(); XA.picWc(); $("#mic").innerHTML = back(); },
      err => { if (!cur(s)) return; const m = err === "no-speech" ? "Chưa nghe thấy gì. Hãy nói to và rõ hơn." : (micErrMsg(err) || "Chưa dùng được micro."); $("#mic").innerHTML = `<p class="sm muted c micmsg">${m}</p>${micBlocked ? "" : back()}<p class="sm muted c">Bạn cũng có thể gõ câu trả lời vào ô bên dưới.</p>`; },
      { long: true, maxMs: 45000, onpart: t => { if (cur(s)) micLive((base + " " + t).trim()); } });
  };
  const modelBox = (m, t) => `<div class="model"><div class="row between"><b>${t || "Bài mẫu để so sánh"}</b>${hasTTS() ? spk(m) : ""}</div><p>${esc(m)}</p></div>`;
  XA.picSkip = () => { const s = st(); if (!s || P.ans) return; micOff(); ["#chk", "#skipm", "#mic"].forEach(q => { const e = $(q); if (e) e.remove(); }); const i = $("#inp"); if (i) i.disabled = true; $("#wres").innerHTML = modelBox(s.it.m); grade(false, "", null, "", `<p class="fbt"><i class="ti ti-eye"></i> <span class="fbm">Đã xem bài mẫu – lần sau thử tự tả nhé</span></p>`); };
  XA.picCheck = () => {
    const s = st(); if (!s || P.ans) return; const it = s.it, min = it.min || 12, v = ($("#inp").value || "").trim(), n = words(v);
    if (n < 3) { $("#er").textContent = "Hãy nói hoặc viết vài câu trước khi chấm."; return; }
    if (VN.test(v)) { $("#er").textContent = "Hãy tả bằng tiếng Anh nhé."; return; }
    const G = it.kw.map(k => k.split("/")), hit = G.filter(g => hitG(v, g)), need = Math.max(1, Math.ceil(G.length * 0.6));
    const ac = Grader.answerCheck ? Grader.answerCheck(v, [it.q, it.m, it.kw.join(" ")], it.kw.flatMap(k => k.split("/"))) : null;
    const miss = G.filter(g => !hitG(v, g)).map(g => "“" + g[0] + "”");
    micOff();
    if (n < min) { $("#er").textContent = `Câu trả lời mới có ${n} từ, cần ít nhất ${min} từ. Hãy nói thêm 1–2 câu.`; return; }
    if (hit.length < need) { $("#er").textContent = `Hãy tả đúng nội dung bức tranh và dùng thêm gợi ý: ${miss.join(", ")}.`; return; }
    if (ac && !ac.sentence) { $("#er").textContent = "Hãy nói thành câu hoàn chỉnh (có chủ ngữ và động từ), không chỉ liệt kê từ."; return; }
    ["#chk", "#skipm", "#mic"].forEach(q => { const e = $(q); if (e) e.remove(); }); $("#inp").disabled = true;
    $("#wres").innerHTML = (miss.length ? `<p class="sm muted">Có thể dùng thêm: ${miss.join(", ")}.</p>` : "") + modelBox(it.m);
    grade(true, "", `Tả tranh tốt: dùng ${hit.length}/${G.length} gợi ý!`);
  };

  /* ================== 10. Nhật ký 3 câu mỗi ngày ================== */
  const sentN = t => (String(t).match(/[^.!?]+[.!?]+/g) || []).filter(x => words(x) >= 2).length + (/[A-Za-z][^.!?]*$/.test(String(t).trim()) && words(String(t).trim().split(/[.!?]/).pop()) >= 2 ? 1 : 0);
  const MINJ = { s0: 10, a1: 12, a2: 18, b1: 25, b2: 32, c1: 40 };
  function journal(s) {
    const it = s.it, min = MINJ[s.lv] || 15, d = new Date(), J = S.journal || [], todayN = J.filter(x => x.d === today()).length;
    return lab(s, "Nhật ký 3 câu mỗi ngày") + `<div class="ax-jh"><i class="ti ti-notebook"></i><div class="grow"><b>${DAYS[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}</b><span class="sm muted">${J.length ? `Bạn đã viết ${J.length} trang nhật ký${todayN ? ` · ${todayN} trang hôm nay` : ""}` : "Trang nhật ký đầu tiên của bạn"}</span></div></div>` +
      `<div class="say left"><p><b>${esc(it.q)}</b></p><p class="sm muted ax-vi">${esc(it.vi)}</p><p class="sm muted">Viết ít nhất 3 câu và ${min} từ. Gợi ý:</p>${kwChips(it.kw)}</div>` +
      `<textarea id="inp" rows="5" placeholder="Câu 1...&#10;Câu 2...&#10;Câu 3..." oninput="XA.jWc()" onkeydown="if(event.key==='Enter')event.stopPropagation()" autocapitalize="sentences" spellcheck="true"></textarea><p class="sm muted" id="wc">0 câu · 0 / ${min} từ</p><p class="err" id="er"></p><div id="wres"></div>` +
      `<button class="btn primary full" id="chk" onclick="XA.jCheck()">Chấm nhật ký</button>${mock() ? "" : `<button class="link" id="skipm" onclick="XA.jSkip()">Xem bài mẫu và bỏ qua</button>`}`;
  }
  XA.jWc = () => { const s = st(), i = $("#inp"); if (!s || !i) return; $("#wc").textContent = sentN(i.value) + " câu · " + words(i.value) + " / " + (MINJ[s.lv] || 15) + " từ"; $("#er").textContent = ""; };
  XA.jSkip = () => { const s = st(); if (!s || P.ans) return; ["#chk", "#skipm"].forEach(q => { const e = $(q); if (e) e.remove(); }); $("#inp").disabled = true; $("#wres").insertAdjacentHTML("beforeend", modelBox(s.it.m, "Nhật ký mẫu")); grade(false, "", null, "", `<p class="fbt"><i class="ti ti-eye"></i> <span class="fbm">Đã xem nhật ký mẫu – ngày mai thử tự viết nhé</span></p>`); };
  XA.jCheck = async () => {
    const s = st(); if (!s || P.ans) return; const it = s.it, min = MINJ[s.lv] || 15, v = $("#inp").value.trim(), n = words(v), sn = sentN(v);
    if (n < 3) { $("#er").textContent = "Hãy viết nhật ký trước khi chấm."; return; }
    if (VN.test(v)) { $("#er").textContent = "Hãy viết nhật ký bằng tiếng Anh nhé."; return; }
    if (sn < 3) { $("#er").textContent = `Nhật ký cần 3 câu, bạn mới viết ${sn} câu. Nhớ kết thúc mỗi câu bằng dấu chấm.`; return; }
    if (n < min * 0.8) { $("#er").textContent = `Nhật ký mới có ${n} từ. Viết thêm cho đủ khoảng ${min} từ nhé.`; return; }
    const b = $("#chk"); if (b.disabled) return; b.disabled = true; b.textContent = "Đang chấm…";
    const r = await Grader.grade(v, { min, kw: it.kw });
    if (!cur(s) || P.ans) return;
    b.disabled = false; b.textContent = "Chấm lại";
    const c = String(r.comment || "").split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
    $("#wres").innerHTML = `<div class="gradecard ax-jg"><div class="gtop"><div class="gscore ${r.total >= 7 ? "hi" : r.total >= 5 ? "mid" : "lo"}"><b>${r.total}</b><small>/10</small></div><div class="grow"><p class="lab">Giáo viên nhận xét</p><p>${esc(c)}</p></div></div>${/<mark/.test(r.html || "") ? `<p class="lab">Bấm vào chỗ gạch chân để xem cách sửa</p><div class="annot">${r.html}</div><div id="errtip" class="errtip"></div>` : ""}</div>`;
    if (r.total >= 5) {
      S.journal = (Array.isArray(S.journal) ? S.journal : []).concat({ d: today(), at: Date.now(), q: it.q, t: v.slice(0, 2000), sc: r.total }).slice(-60);
      save(); b.remove(); const k = $("#skipm"); if (k) k.remove(); $("#inp").disabled = true; $("#wres").insertAdjacentHTML("beforeend", modelBox(it.m, "Nhật ký mẫu để so sánh"));
      grade(true, "", `Đạt ${r.total}/10 điểm! Đã lưu vào nhật ký.`);
    } else { $("#er").textContent = `Nhật ký đạt ${r.total}/10, cần từ 5 điểm. Sửa các chỗ gạch chân rồi bấm Chấm lại.`; }
  };

  /* ================== Kết nối với app ================== */
  const RENDER = { role, shadow, dlg, pdict, match, porder, cloze, tfng, pic, journal };
  function make(type, item, stage) {
    type = type || (item && item.t); if (!RENDER[type] || !item) return null;
    return { type, sk: T[type].sk, ext: 1, lv: String(stage || STAGE_OF.get(item) || "b1").toLowerCase(), it: JSON.parse(JSON.stringify(item)) };
  }
  function pool(stage, type) {
    const sid = String(stage || "").toLowerCase(), out = [];
    Object.keys(A).forEach(id => { if (id !== "_pool" && id.split("-")[0] === sid) A[id].forEach(it => { if (!type || it.t === type) out.push(it); }); });
    (POOL[sid] || []).forEach(it => { if (!type || it.t === type) out.push(it); });
    return out;
  }
  // đề nhật ký "của ngày hôm nay": mỗi ngày một đề, xoay vòng trong kho của chặng
  function journalToday(stage) { const p = pool(stage, "journal"); if (!p.length) return null; const d = new Date(), k = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5); return p[k % p.length]; }
  function lessonSteps(L, steps) {
    if (!L || !Array.isArray(steps) || steps.some(x => x && x.ext)) return steps;
    const items = (A[L.id] || []).slice(0, 2), nv = noTTS(), used = new Set(items.map(x => x.t));
    const add = items.map(it => {
      if (nv && it.t === "pdict") { // không có giọng đọc: thay bài nghe chép bằng một bài đọc cùng chặng
        const alt = shuffle(pool(L.stage).filter(x => ["cloze", "porder", "match", "tfng"].includes(x.t) && !used.has(x.t)))[0];
        if (!alt) return null; used.add(alt.t); return make(alt.t, alt, L.stage);
      }
      return make(it.t, it, L.stage);
    }).filter(Boolean);
    if (!add.length) return steps;
    let w = -1; for (let i = steps.length - 1; i >= 0; i--) if (steps[i].type === "write") { w = i; break; }
    if (w < 0) steps.push(...add); else steps.splice(w, 0, ...add);
    return steps;
  }
  window.EXT = { render: RENDER, lessonSteps, make, pool, journalToday, types: T };

  /* Chặng 0 (và bài bảng chữ cái) kết thúc buildLesson sớm, trước móc EXT: bọc thêm để mọi bài đều có 2 hoạt động */
  if (typeof buildLesson === "function") { const _bl = buildLesson; buildLesson = function (L) { const r = _bl(L); return Array.isArray(r) && !r.some(x => x && x.ext) ? lessonSteps(L, r) : r; }; }
  /* Nhật ký lưu trong S.journal (tối đa 60 trang): thêm vào trạng thái mặc định để merge() giữ lại khi tải / khôi phục */
  if (typeof def === "function") { const _def = def; def = function () { const d = _def(); d.journal = []; return d; }; }
  try { const raw = JSON.parse(localStorage.getItem(KEY) || "null"); if (raw && Array.isArray(raw.journal) && !(Array.isArray(S.journal) && S.journal.length)) S.journal = raw.journal; } catch (e) {}
  S.journal = (Array.isArray(S.journal) ? S.journal : []).filter(x => x && typeof x === "object" && typeof x.t === "string").slice(-60);
})();
