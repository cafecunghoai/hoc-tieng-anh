"use strict";
/* ================== Cô chủ nhiệm: lộ trình tuần, bài tập về nhà, yêu cầu, kiểm tra định kỳ, nhắc học, phiếu liên lạc ==================
   Trạng thái lưu ở S.teacher. def() / sanitize() được bọc lại ở đây (không sửa app.js) để S.teacher không bị bỏ khi tải lại,
   khôi phục sao lưu hay gộp dữ liệu giữa hai cửa sổ. */
var TEACHER = window.TEACHER = (() => {
  const TK = KEY + "_teacher", WDS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"], WDN = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"], ICSD = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"], WEEK = [1, 2, 3, 4, 5, 6, 0];
  const PSK = ["listen", "speak", "write"], SKV = { listen: "Nghe", speak: "Nói", write: "Viết", read: "Đọc", vocab: "Từ vựng", gram: "Ngữ pháp" };
  const TYPES = ["review", "mist", "lesson", "exam", "skill", "gram", "wtest", "mtest"];

  /* ---------- Ngày giờ (luôn theo giờ máy, an toàn khi đổi giờ mùa hè) ---------- */
  const now = () => Date.now();
  const sod = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const addD = (t, n) => { const d = new Date(t); d.setDate(d.getDate() + n); return d.getTime(); };
  const kd = t => dkey(new Date(t));
  const pk = k => { const p = String(k).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]).getTime(); };
  const monday = t => { const d = new Date(sod(t)); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.getTime(); };
  const hm = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ""); return m ? [Math.min(23, +m[1]), Math.min(59, +m[2])] : [19, 30]; };
  const atT = (t, s) => { const [h, m] = hm(s); const d = new Date(sod(t)); d.setHours(h, m, 0, 0); return d.getTime(); };
  const hhmm = t => { const d = new Date(t); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
  const dm = t => { const d = new Date(t); return d.getDate() + "/" + (d.getMonth() + 1); };
  const fmtD = t => WDN[new Date(t).getDay()] + " " + dm(t);
  const fmtS = t => WDS[new Date(t).getDay()] + " " + dm(t);
  const dayDiff = (a, b) => Math.round((sod(a) - sod(b)) / DAY);
  const whenTxt = t => { const n = dayDiff(t, now()); return n === 0 ? "hôm nay" : n === 1 ? "ngày mai" : n === -1 ? "hôm qua" : n > 0 ? fmtD(t) + ` (còn ${n} ngày)` : fmtD(t) + ` (quá ${-n} ngày)`; };

  /* ---------- Trạng thái ---------- */
  const blank = () => ({ v: 1, on: 0, days: [1, 2, 3, 4, 5], time: "19:30", t0: 0, wk: null, hw: {}, ev: [], wt: { next: 0, hist: [] }, mt: { next: 0, hist: [] }, over: [], rep: [], nt: { rem: "", soon: "" }, tab: "today" });
  const num = (v, df, lo, hi) => { v = +v; return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : df; };
  const str = (v, n) => String(v == null ? "" : v).slice(0, n || 80);
  const obj = v => v && typeof v === "object" && !Array.isArray(v);
  function sanTask(x) {
    if (!obj(x) || !TYPES.includes(x.k)) return null;
    const o = { k: x.k, id: str(x.id, 24), done: num(x.done, 0, 0, 9e15), m: num(x.m, 5, 1, 120) | 0 };
    if (x.n !== undefined) o.n = num(x.n, 0, 0, 999) | 0;
    if (x.half !== undefined) o.half = x.half === 2 ? 2 : 1;
    ["lid", "sid", "sk", "gid", "lv"].forEach(f => { if (x[f] !== undefined) o[f] = str(x[f], 40); });
    if (x.sc !== undefined) o.sc = num(x.sc, 0, 0, 100) | 0;
    return o;
  }
  function sanSk(s) { const o = {}; if (obj(s)) Object.keys(s).forEach(k => { if (SK[k] && Array.isArray(s[k])) o[k] = [num(s[k][0], 0, 0, 1e5) | 0, num(s[k][1], 0, 0, 1e5) | 0]; }); return o; }
  function tsan(t) {
    const d = blank(); if (!obj(t)) return d;
    d.on = t.on ? 1 : 0; d.t0 = num(t.t0, 0, 0, 9e15);
    d.days = Array.isArray(t.days) ? [...new Set(t.days.map(Number).filter(x => x >= 0 && x <= 6 && (x | 0) === x))] : d.days; if (!d.days.length) d.days = [1, 2, 3, 4, 5];
    d.time = /^\d{2}:\d{2}$/.test(t.time) ? t.time : d.time;
    d.tab = ["today", "week", "test", "rep"].includes(t.tab) ? t.tab : "today";
    if (obj(t.wk) && /^\d{4}-\d\d-\d\d$/.test(t.wk.id) && Array.isArray(t.wk.days)) d.wk = { id: t.wk.id, made: num(t.wk.made, 0, 0, 9e15), note: str(t.wk.note, 400), f: num(t.wk.f, 1, 0.25, 2), days: t.wk.days.slice(0, 7).map(x => ({ d: str(obj(x) && x.d, 10), study: obj(x) && x.study ? 1 : 0, tasks: (obj(x) && Array.isArray(x.tasks) ? x.tasks : []).map(sanTask).filter(Boolean).slice(0, 6) })) };
    if (obj(t.hw)) { const lim = kd(addD(now(), -60)); Object.keys(t.hw).forEach(k => { const h = t.hw[k]; if (!/^\d{4}-\d\d-\d\d$/.test(k) || k < lim || !obj(h) || !Array.isArray(h.tasks)) return; d.hw[k] = { due: num(h.due, 0, 0, 9e15), due0: num(h.due0, 0, 0, 1e5) | 0, mist0: num(h.mist0, 0, 0, 1e5) | 0, tasks: h.tasks.map(sanTask).filter(Boolean).slice(0, 6) }; }); }
    if (Array.isArray(t.ev)) d.ev = t.ev.filter(obj).slice(-800).map(e => ({ at: num(e.at, 0, 0, 9e15), d: str(e.d, 10), k: str(e.k, 10), id: str(e.id, 40), sc: num(e.sc, 0, 0, 100) | 0, n: num(e.n, 0, 0, 999) | 0, sk: sanSk(e.sk), tt: str(e.tt, 8), ts: str(e.ts, 8), cards: num(e.cards, 0, 0, 999) | 0, first: e.first ? 1 : 0 }));
    ["wt", "mt"].forEach(f => { const x = obj(t[f]) ? t[f] : {}; d[f] = { next: num(x.next, 0, 0, 9e15), hist: (Array.isArray(x.hist) ? x.hist : []).filter(obj).slice(-60).map(h => { const o = { due: num(h.due, 0, 0, 9e15), at: num(h.at, 0, 0, 9e15), sc: num(h.sc, 0, 0, 100) | 0 }; if (h.miss) o.miss = 1; if (h.lv) o.lv = str(h.lv, 3); if (h.pass) o.pass = 1; return o; }) }; });
    if (Array.isArray(t.over)) d.over = t.over.filter(obj).slice(-100).map(o => ({ at: num(o.at, 0, 0, 9e15), why: str(o.why, 10), id: str(o.id, 12) }));
    if (Array.isArray(t.rep)) d.rep = t.rep.filter(x => obj(x) && /^\d{4}-\d\d-\d\d$/.test(x.wk)).slice(-52).map(sanRep);
    if (obj(t.nt)) d.nt = { rem: str(t.nt.rem, 10), soon: str(t.nt.soon, 10) };
    return d;
  }
  function sanRep(r) {
    const o = { wk: r.wk, cm: str(r.cm, 3000) };
    ["min", "goalMin", "plan", "days", "extra", "newL", "lessons", "cards", "hwN", "hwDone", "hwLate", "hwMiss", "hw", "streak", "due", "mist", "over", "wsc", "wmiss", "acc", "mlv", "msc"].forEach(f => { if (r[f] !== undefined && r[f] !== null) o[f] = num(r[f], 0, -1, 1e6); });
    o.sk = sanSk(r.sk); o.good = (Array.isArray(r.good) ? r.good : []).slice(0, 6).map(x => str(x, 200)); o.bad = (Array.isArray(r.bad) ? r.bad : []).slice(0, 6).map(x => str(x, 200));
    o.rate = (Array.isArray(r.rate) ? r.rate : []).slice(0, 3).map(x => [str(x && x[0], 20), str(x && x[1], 20)]);
    if (o.acc === -1) o.acc = null; if (o.wsc === -1) delete o.wsc; return o;
  }
  /* bọc def / sanitize của app.js: giữ S.teacher qua merge() (tải lại, khôi phục sao lưu, cửa sổ khác) */
  if (typeof def === "function") { const d0 = def; def = function () { const d = d0(); if (!("teacher" in d)) d.teacher = null; return d; }; }
  if (typeof sanitize === "function") { const s0 = sanitize; sanitize = function (d) { const r = s0(d) || d; r.teacher = r.teacher ? tsan(r.teacher) : null; return r; }; }
  /* S đã được tải trước khi tệp này chạy (khi đó merge chưa biết S.teacher): lấy lại từ bản lưu, hoặc từ bản dự phòng riêng */
  (function recover() { try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null"); let t = raw && raw.teacher;
    if (raw && !("teacher" in raw)) { const m = JSON.parse(localStorage.getItem(TK) || "null"); if (m && m.w === (+S._wipe || 0)) t = m.t; }
    if (S.teacher === undefined || !S.teacher) S.teacher = t && typeof t === "object" ? tsan(t) : null;
  } catch (e) { S.teacher = null; } })();
  const T = () => { if (!obj(S.teacher)) S.teacher = blank(); return S.teacher; };
  const on = () => obj(S.teacher) && S.teacher.on;
  function tsave() { save(); try { localStorage.setItem(TK, JSON.stringify({ w: +S._wipe || 0, t: S.teacher })); } catch (e) {} }

  /* ---------- Vị trí học, kỹ năng, nội dung ---------- */
  const isStudy = t => T().days.includes(new Date(t).getDay());
  const snapStudy = t => { for (let i = 0; i < 7; i++) { const x = addD(t, i); if (isStudy(x)) return sod(x); } return sod(t); };
  const dueN = () => dueCards().length, mistN = () => Object.keys(S.mistakes).length;
  /* thẻ QUÁ HẠN: đã đến hạn hơn một ngày mà chưa ôn (thẻ vừa đến hạn là việc của bài tập hôm nay) */
  const odN = () => { const c = now() - DAY; return Object.values(S.cards).filter(x => x.due < c).length; };
  /* vị trí học của cô: sau kiểm tra đầu vào / vượt chặng, các bài trước đó đều mở nên nextLesson() của app trả về bài đầu tiên chưa học
     (vd. s0-1 cho người xếp vào B1); cô tính từ bài xa nhất đã được mở trở đi */
  function tNext() {
    let pl = -1; ORDER.forEach((id, i) => { if (S.unlocked[id]) pl = i; });
    return (pl >= 0 && ORDER.find((id, i) => i >= pl && isOpen(id) && !passed(id))) || nextLesson();
  }
  const lvNow = () => { const n = tNext(); return n ? { s0: "A1", a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1" }[LES[n].stage] : "C1"; };
  const resumeFrac = id => { const r = S.resume; if (!r || r.id !== id || !r.P || !Array.isArray(r.P.steps)) return 0; const b = r.P.steps.filter(s => !s.r).length || 1; return Math.min(1, (r.P.i || 0) / b); };
  /* bài kế tiếp: hết chặng mà chưa qua bài kiểm tra vượt chặng thì cô yêu cầu kiểm tra trước */
  function stageGate(id) {
    const L = LES[id]; if (!L || S.unlocked[id] || S.done[id]) return null;
    const i = ORDER.indexOf(id); if (i <= 0) return null; const prev = LES[ORDER[i - 1]];
    if (prev.stage === L.stage || S.stagePassed[prev.stage] || !passed(prev.id)) return null;
    return prev.stage;
  }
  /* hàng đợi bài mới dự kiến: [{lid}] hoặc [{sid}] (kiểm tra vượt chặng) */
  function queue(n) {
    const out = []; let id = tNext(); if (!id) return out;
    const g = stageGate(id); if (g) out.push({ sid: g });
    let i = ORDER.indexOf(id);
    while (out.length < n && i < ORDER.length) { const L = LES[ORDER[i]]; if (stageOf(L.stage).locked) break; if (!passed(L.id)) { if (out.length && out[out.length - 1].lid && LES[out[out.length - 1].lid].stage !== L.stage && !S.stagePassed[LES[out[out.length - 1].lid].stage]) out.push({ sid: LES[out[out.length - 1].lid].stage }); if (out.length < n) out.push({ lid: L.id }); } i++; }
    return out.slice(0, n);
  }
  function accOf(from, to) { const r = {}; T().ev.forEach(e => { if (e.at < from || e.at >= to) return; Object.keys(e.sk || {}).forEach(k => { const v = r[k] || (r[k] = [0, 0]); v[0] += e.sk[k][0]; v[1] += e.sk[k][1]; }); }); return r; }
  const pc = v => v && v[1] ? Math.round(v[0] / v[1] * 100) : null;
  /* kỹ năng yếu: ưu tiên số liệu 14 ngày gần nhất, thiếu thì dùng toàn bộ */
  function weakOrder(stage) {
    const rec = accOf(now() - 14 * DAY, now() + 1), list = stage === "s0" ? ["listen", "speak"] : PSK.slice();
    const score = k => { const a = rec[k] && rec[k][1] >= 5 ? rec[k] : S.skill[k]; return a && a[1] >= 5 ? a[0] / a[1] : 0.78; };
    return list.sort((a, b) => score(a) - score(b));
  }
  function gramQueue() {
    if (typeof GRAMMAR === "undefined") return [];
    const nl = tNext(), ni = nl ? ORDER.indexOf(nl) : ORDER.length, lvs = ["A1", "A2", "B1", "B2", "C1"], cl = lvs.indexOf(lvNow());
    const cand = GRAMMAR.filter(G => (S.gram[G.id] || 0) < 80 && (G.lesson && LES[G.lesson] ? ORDER.indexOf(G.lesson) < ni || passed(G.lesson) : lvs.indexOf(G.lv) <= cl));
    const pos = G => G.lesson && LES[G.lesson] ? ORDER.indexOf(G.lesson) : lvs.indexOf(G.lv) * 24;
    // chủ điểm đã luyện mà chưa đạt lên trước, rồi tới chủ điểm gần vị trí đang học nhất
    return cand.sort((a, b) => ((S.gram[b.id] !== undefined) - (S.gram[a.id] !== undefined)) || pos(b) - pos(a)).map(G => G.id);
  }
  const reviewMin = n => Math.max(3, Math.min(30, Math.round(n * 0.3)));
  const mistMin = n => Math.max(4, Math.min(10, Math.round(n * 0.6)));
  const SKM = { listen: 8, speak: 6, write: 10 };
  const mockMin = lv => (typeof EXAMS !== "undefined" && EXAMS[lv] ? EXAMS[lv].time : 40);
  function taskMin(x) { return ({ review: reviewMin(x.n || 0), mist: mistMin(x.n || 0), lesson: x.half ? 13 : 25, exam: 15, skill: SKM[x.sk] || 8, gram: 8, wtest: 15, mtest: mockMin(x.lv) })[x.k]; }

  /* ---------- Lộ trình tuần ---------- */
  const unitsOf = g => g >= 90 ? 2 : g >= 30 ? 1 : 0.5;
  function adaptOf(r) {
    if (!r) return { f: 1, note: "" };
    const acc = r.acc, hw = r.hw;
    if (r.min === 0) return { f: 0.5, mist: 1, note: "Tuần trước bạn chưa học buổi nào, nên tuần này cô giảm bài mới để bạn bắt nhịp lại, bắt đầu bằng phần ôn thẻ." };
    if ((hw !== undefined && hw < 50) || r.min < r.goalMin * 0.5) return { f: 0.5, mist: 1, note: `Tuần trước bạn hoàn thành ${hw || 0}% bài tập và học ${r.min}/${r.goalMin} phút, nên tuần này cô giảm bài mới để bạn theo kịp và ôn cho chắc.` };
    if (r.due > 30 || r.mist > 15) return { f: 0.5, mist: 1, note: `${r.due > 30 && r.mist > 15 ? `Thẻ quá hạn (${r.due}) và lỗi chưa sửa (${r.mist}) đang tồn nhiều` : r.due > 30 ? `Thẻ quá hạn ôn đang tồn nhiều (${r.due} thẻ)` : `Lỗi chưa sửa đang tồn nhiều (${r.mist} lỗi)`}, nên tuần này cô ưu tiên ôn và sửa lỗi, giảm bớt bài mới.` };
    if (acc !== null && acc !== undefined && acc < 70) return { f: 0.5, mist: 1, note: `Tuần trước bạn làm đúng ${acc}% số câu, chưa vững, nên cô giảm bài mới và thêm phần sửa lỗi.` };
    if (hw >= 90 && acc >= 85 && r.min >= r.goalMin) return { f: 1, hard: 1, note: "Tuần trước bạn làm rất tốt. Cô giữ nhịp bài mới và thêm một bài kiểm tra ngữ pháp để bạn thử sức." };
    return { f: 1, note: "Tuần trước bạn theo khá sát kế hoạch, cô giữ nguyên nhịp học." };
  }
  function genWeek(ws) {
    const t = T(), g = S.settings.goal, prev = t.rep.find(r => r.wk === kd(addD(ws, -7))), ad = adaptOf(prev);
    const units = Math.max(g >= 30 ? 0.5 : 0.25, unitsOf(g) * ad.f), q = queue(16), st = (LES[tNext()] || {}).stage || "c1";
    const wo = weakOrder(st), rot = []; for (let i = 0; i < 7; i++) rot.push(i % 2 === 0 ? wo[0] : wo[1 + ((i >> 1) % (wo.length - 1))] || wo[0]);
    const gq = gramQueue(); let gi = 0, qi = 0, half = q[0] && q[0].lid && resumeFrac(q[0].lid) >= 0.4 ? 1 : 0, acc = 0, si = 0;
    const today0 = sod(now()), studyDays = []; for (let i = 0; i < 7; i++) if (isStudy(addD(ws, i))) studyDays.push(i);
    // ngày làm bài kiểm tra trong tuần: đúng hạn, hoặc (đã quá hạn) buổi học gần nhất từ hôm nay
    const tday = nx => { if (!nx) return -1; if (nx >= today0) return sod(nx); for (let i = 0; i < 7; i++) { const x = addD(today0, i); if (isStudy(x)) return sod(x); } return today0; };
    /* dự báo số thẻ đến hạn từng ngày theo lịch ôn của app (đúng thì lên hộp, giãn INT ngày), cộng cả thẻ của bài mới dự kiến */
    const vc = Object.values(S.cards).map(c => ({ due: c.due, box: c.box })), sess = d => atT(d, t.time);
    let mist = mistN(); const days = [];
    for (let i = 0; i < 7; i++) {
      const dt = addD(ws, i), d = kd(dt), study = isStudy(dt) && sod(dt) >= sod(t.t0 || now()) && sod(dt) >= today0 - (t.wk && t.wk.id === kd(ws) ? 7 * DAY : 0), tasks = [];
      const day = { d, study: study ? 1 : 0, tasks }; days.push(day);
      if (!study) continue;
      const end = sess(dt) + 3 * 3600000; let n = 0;
      vc.forEach(c => { if (c.due < end) { n++; c.box = Math.min(7, c.box + 1); c.due = sess(dt) + INT[c.box] * DAY; } });
      const wDue = sod(dt) === tday(t.wt.next), mDue = sod(dt) === tday(t.mt.next);
      if (mDue) tasks.push({ k: "mtest", lv: lvNow() });
      if (wDue) tasks.push({ k: "wtest" });
      if (n > 0) tasks.push({ k: "review", n: Math.min(n, 100) });
      // thời gian còn lại cho bài mới sau phần kiểm tra và ôn thẻ: ít quá thì chỉ học nửa bài hoặc để hôm khác
      // thời gian ôn thật (không chặn trần) để quyết định bài mới: thẻ ôn quá nhiều thì giảm bài mới cho kịp ôn
      const used = tasks.reduce((a, x) => a + (x.k === "review" ? Math.round(x.n * 0.3) : taskMin(x)), 0), avail = g - used;
      if (avail >= 10) {
        acc += units * 2; let made = 0;
        while (acc >= 1 && qi < q.length && made < 2) {
          const it = q[qi], room = avail - made * 25;
          if (room < 10) break;
          if (it.sid) { tasks.push({ k: "exam", sid: it.sid }); qi++; acc = Math.max(0, acc - 2); made++; continue; }
          if (!half && acc >= 2 && room >= 22) { tasks.push({ k: "lesson", lid: it.lid }); qi++; acc -= 2; }
          else if (!half) { tasks.push({ k: "lesson", lid: it.lid, half: 1 }); half = 1; acc = Math.max(0, acc - 1); }
          else { tasks.push({ k: "lesson", lid: it.lid, half: 2 }); half = 0; qi++; acc = Math.max(0, acc - 1); }
          made++; const L = LES[it.lid]; if (L && L.srs !== false && !half) L.W.forEach(() => vc.push({ box: 0, due: sess(dt) + DAY }));
        }
      }
      if (mist > 0 && (ad.mist || mist >= 15 || si % 2 === 0)) tasks.push({ k: "mist", n: Math.min(15, mist) });
      tasks.push({ k: "skill", sk: rot[si % rot.length] });
      if (gq[gi]) tasks.push({ k: "gram", gid: gq[gi] });
      day.tasks = fit(tasks, g, ad, () => gi++);
      if (ad.hard && si === studyDays.length - 1 && day.tasks.length < 5 && !day.tasks.some(x => x.k === "mtest")) day.tasks.push({ k: "gram", gid: "quiz:" + lvNow() });
      day.tasks.forEach(x => x.m = taskMin(x));
      if (day.tasks.some(x => x.k === "mist")) mist = Math.max(0, mist - 8);
      si++;
    }
    return { id: kd(ws), made: now(), note: ad.note, f: ad.f, days };
  }
  /* giữ 3–5 việc, tổng thời gian sát mục tiêu; thứ tự ưu tiên: kiểm tra > ôn thẻ > bài mới > sửa lỗi > luyện kỹ năng > ngữ pháp */
  function fit(tasks, g, ad, usedGram) {
    const pri = { mtest: 0, wtest: 1, exam: 2, review: 3, lesson: 4, mist: 5, skill: 6, gram: 7 };
    tasks.sort((a, b) => pri[a.k] - pri[b.k]);
    const out = []; let m = 0;
    tasks.forEach(x => { const xm = taskMin(x); if (pri[x.k] <= 4 || out.length < 3 || (m + xm <= g + 3 && out.length < 5)) { if (out.length < 5 || pri[x.k] <= 4) { out.push(x); m += xm; } } });
    while (out.length > 5) out.splice(out.findIndex(x => pri[x.k] >= 5), 1);
    // quá xa mục tiêu: bỏ bớt phần phụ (không bỏ ôn thẻ, bài mới, kiểm tra)
    while (m > g * 1.35 + 5 && out.length > 3) { const j = out.map(x => pri[x.k]).lastIndexOf(Math.max(...out.map(x => pri[x.k]))); if (pri[out[j].k] < 5) break; m -= taskMin(out[j]); out.splice(j, 1); }
    if (out.some(x => x.k === "gram")) usedGram();
    return out;
  }
  function week() {
    const t = T(), ws = monday(now()), id = kd(ws);
    if (!t.wk || t.wk.id !== id) { finalize(); t.wk = genWeek(ws); tsave(); }
    return t.wk;
  }

  /* ---------- Bài tập về nhà ---------- */
  const dueOf = d => { const t = T(), base = atT(pk(d), t.time) + 3 * 3600000, cap = atT(pk(d), "23:30"); return Math.min(base, cap); };
  function mkHW(d) {
    const t = T(), wk = week(), pd = wk.days.find(x => x.d === d), dt = pk(d);
    if (!pd || !pd.study) return null;
    const isToday = d === today(), g = S.settings.goal, tasks = [];
    let q = queue(3), qi = 0;
    pd.tasks.forEach(p => {
      const x = { k: p.k, id: "", done: 0 };
      if (p.k === "review") { const n = dueN(); if (!n && !isToday) x.n = p.n; else if (!n) return; else x.n = Math.min(n, g <= 15 ? 40 : g <= 30 ? 60 : 100); }
      else if (p.k === "lesson") { const it = q[qi++]; if (!it) return; if (it.sid) { x.k = "exam"; x.sid = it.sid; } else { x.lid = it.lid; if (p.half) x.half = resumeFrac(it.lid) >= 0.4 ? 2 : 1; } }
      else if (p.k === "exam") { const it = q[qi++]; if (!it) return; if (it.sid) x.sid = it.sid; else { x.k = "lesson"; x.lid = it.lid; } }
      else if (p.k === "mist") { const n = mistN(); if (!n) return; x.n = Math.min(15, n); }
      else if (p.k === "gram") { if (/^quiz:/.test(p.gid)) x.gid = p.gid; else { const gq = gramQueue(); const id = gq.includes(p.gid) ? p.gid : gq.find(id => !tasks.some(y => y.gid === id)); if (!id) return; x.gid = id; } }
      else if (p.k === "skill") x.sk = p.sk;
      else if (p.k === "wtest") { if (t.wt.next && sod(t.wt.next) > sod(dt)) return; }
      else if (p.k === "mtest") x.lv = p.lv || lvNow();
      tasks.push(x);
    });
    // kiểm tra quá hạn chưa có trong lịch ngày này
    if (t.wt.next && sod(t.wt.next) <= sod(dt) && !tasks.some(x => x.k === "wtest")) tasks.unshift({ k: "wtest", id: "", done: 0 });
    if (t.mt.next && sod(t.mt.next) <= sod(dt) && !tasks.some(x => x.k === "mtest")) tasks.unshift({ k: "mtest", id: "", done: 0, lv: lvNow() });
    // không có gì học được (chưa có bài nào, chưa có thẻ): thêm phần luyện nghe / nói nhỏ sau bài mới
    if (tasks.length < 3) { const have = new Set(tasks.filter(x => x.k === "skill").map(x => x.sk)); weakOrder((LES[tNext()] || {}).stage).forEach(sk => { if (tasks.length < 3 && !have.has(sk)) tasks.push({ k: "skill", sk, id: "", done: 0 }); }); }
    if (tasks.length < 3 && mistN() && !tasks.some(x => x.k === "mist")) tasks.push({ k: "mist", n: Math.min(15, mistN()), id: "", done: 0 });
    // còn nợ nhiều (thẻ quá hạn > 30, lỗi > 15): ôn và sửa lỗi lên trước bài mới; học ít thời gian thì bài mới chỉ học nửa bài
    const backlog = odN() > 30 || mistN() > 15;
    if (backlog) {
      if (mistN() > 15 && !tasks.some(x => x.k === "mist")) tasks.push({ k: "mist", n: 15, id: "", done: 0 });
      const rank = { mtest: 0, wtest: 1, review: 2, mist: 3, exam: 4, lesson: 5, skill: 6, gram: 7 }; tasks.sort((a, b) => rank[a.k] - rank[b.k]);
      if (g <= 30) { tasks.forEach(x => { if (x.k === "lesson" && !x.half) x.half = resumeFrac(x.lid) >= 0.4 ? 2 : 1; }); for (let j = tasks.length - 1; j >= 0 && tasks.length > 3; j--) if (["gram", "skill"].includes(tasks[j].k)) tasks.splice(j, 1); }
    }
    tasks.forEach((x, i) => { x.id = d.slice(5) + "-" + i; x.m = taskMin(x); });
    return { due: dueOf(d), due0: odN(), mist0: mistN(), tasks: tasks.slice(0, 5) };
  }
  function hwFor(d, make) { const t = T(); if (!t.hw[d] && make) { const h = mkHW(d); if (h) { t.hw[d] = h; check(); tsave(); } } return t.hw[d] || null; }
  const evSince = c => T().ev.filter(e => e.at >= c);
  /* việc đã xong chưa: theo kết quả các buổi học sau khi giao bài (sự kiện) hoặc theo trạng thái hiện tại */
  function isDone(x, d) {
    const c = pk(d), E = evSince(c), t = T();
    switch (x.k) {
      case "review": return E.filter(e => e.k === "review").reduce((a, e) => a + e.cards, 0) >= (x.n || 1) || (E.some(e => e.k === "review") && dueN() === 0);
      case "mist": return E.some(e => e.k === "mist") || mistN() === 0;
      case "lesson": return passed(x.lid) || (x.half === 1 && resumeFrac(x.lid) >= 0.4);
      case "exam": return !!S.stagePassed[x.sid];
      case "skill": return E.some(e => e.tt === "hw" && e.ts === x.sk);
      case "gram": return /^quiz:/.test(x.gid) ? E.some(e => e.k === "gram" && e.id === x.gid.slice(5)) : E.some(e => e.k === "gram" && !e.tt && e.id === x.gid) || (S.gram[x.gid] || 0) >= 80;
      case "wtest": return t.wt.hist.some(h => !h.miss && h.at >= c);
      case "mtest": return t.mt.hist.some(h => !h.miss && h.at >= c);
    }
    return false;
  }
  function scoreOf(x, d) {
    const E = evSince(pk(d));
    if (x.k === "lesson") return S.done[x.lid] ? S.done[x.lid].best : undefined;
    if (x.k === "gram") { const e = E.filter(e => e.k === "gram" && !e.tt && (e.id === x.gid || "quiz:" + e.id === x.gid)).pop(); return e ? e.sc : undefined; }
    if (x.k === "exam") { const e = E.filter(e => e.k === "exam" && e.id === x.sid).pop(); return e ? e.sc : undefined; }
    if (x.k === "skill") { const e = E.filter(e => e.tt === "hw" && e.ts === x.sk).pop(); return e ? e.sc : undefined; }
  }
  /* trạng thái: done (đúng hạn), late (nộp muộn), open (chưa làm, còn hạn), over (quá hạn, còn làm bù được), miss (bỏ lỡ) */
  function stOf(x, h, d) {
    if (x.done) return x.done <= h.due ? "done" : "late";
    const n = now(); if (n <= h.due) return "open"; return n < addD(pk(d), 2) ? "over" : "miss";
  }
  function check() {
    const t = T(); if (!t.on) return;
    const n = now(); let ch = 0;
    Object.keys(t.hw).forEach(d => { if (n >= addD(pk(d), 2)) return; const h = t.hw[d];
      h.tasks.forEach(x => { if (!x.done && isDone(x, d)) { x.done = n; ch = 1; } const s = scoreOf(x, d); if (s !== undefined && x.sc !== s) { x.sc = s; ch = 1; } }); });
    ch = rollTests() || ch;
    if (ch) tsave();
  }
  /* kiểm tra tuần / tháng quá hạn quá lâu: ghi là bỏ lỡ, dời sang kỳ sau */
  function rollTests() {
    const t = T(), n = sod(now()); let ch = 0;
    [["wt", 7], ["mt", 30]].forEach(([f, p]) => { const o = t[f]; if (!o.next) return; let g = 0;
      while (n > addD(o.next, p >= 30 ? 14 : 6) && g++ < 60) { o.hist.push({ due: o.next, at: 0, sc: 0, miss: 1 }); o.next = snapStudy(addD(o.next, p)); ch = 1; } });
    return ch;
  }
  function testDone(f, rec) {
    const t = T(), o = t[f], p = f === "wt" ? 7 : 30; rec.due = o.next; o.hist.push(rec);
    let nx = addD(o.next, p); while (sod(nx) <= sod(now())) nx = addD(nx, p); o.next = snapStudy(nx);
  }

  /* ---------- Kết quả từng buổi học ---------- */
  function onFinish(p) {
    try {
      if (!on() || !p) return; const t = T();
      let sc = p.tot ? Math.round(p.ok / p.tot * 100) : 100;
      if (p.kind === "mock") { const r = Object.keys(p.secTot || {}).map(x => Math.min(1, (p.sec[x] || 0) / (p.secTot[x] || 1)) * 100); sc = r.length ? Math.floor(r.reduce((a, b) => a + b, 0) / 5) : 0; }
      const e = { at: now(), d: today(), k: p.kind, id: String(p.id || p.gid || p.sid || p.lv || p.quiz || ""), sc, n: p.tot | 0, sk: sanSk(p.sk), tt: p.tt ? p.tt.type : "", ts: p.tt && p.tt.sk || "", cards: (p.steps || []).filter(s => s.card && !s.r && s.got !== undefined).length, first: p.kind === "lesson" && !passed(p.id) ? 1 : 0 };
      t.ev.push(e); if (t.ev.length > 800) t.ev.splice(0, t.ev.length - 800);
      if (p.tt && p.tt.type === "wtest") testDone("wt", { at: e.at, sc });
      const mock = p.kind === "mock" ? p.lv : null;
      Promise.resolve().then(() => {
        if (mock && t.mt.next && e.at >= addD(t.mt.next, -7)) { const a = (S.exams[mock] || []).slice(-1)[0]; testDone("mt", { at: e.at, sc: a ? a.overall : sc, lv: mock, pass: a && a.pass ? 1 : 0 }); }
        check(); tsave(); if (!p.tt) doneNote();
      });
    } catch (er) {}
  }
  /* màn hình kết quả: một dòng của cô về bài tập còn lại hôm nay */
  function doneNote() {
    const st = $("#app .donescr .stack"); if (!st || $("#app .tnote")) return;
    const h = hwFor(today(), true); if (!h) return;
    const left = h.tasks.filter(x => !x.done), nx = left[0];
    st.insertAdjacentHTML("beforebegin", `<div class="card tnote"><span class="tav sm"><i class="ti ti-school"></i></span><div class="grow"><p class="tsay">${left.length ? `Bài tập về nhà hôm nay: xong <b>${h.tasks.length - left.length}/${h.tasks.length}</b> việc. Việc tiếp theo: <b>${esc(label(nx).t)}</b>.` : `Bạn đã làm xong <b>cả ${h.tasks.length} việc</b> cô giao hôm nay. Rất tốt!`}</p>${left.length ? `<button class="btn full" onclick="${go(nx)}">${esc(label(nx).b)} <i class="ti ti-arrow-right"></i></button>` : ""}</div></div>`);
  }

  /* ---------- Nhãn, nút cho từng việc ---------- */
  const ICON = { review: "cards", mist: "alert-triangle", lesson: "book", exam: "certificate", skill: "target", gram: "abc", wtest: "clipboard-check", mtest: "file-certificate" };
  const SKI2 = { listen: "headphones", speak: "microphone", write: "pencil" };
  function label(x) {
    const L = x.lid && LES[x.lid], st = L && stageOf(L.stage);
    switch (x.k) {
      case "review": return { t: `Ôn ${x.n} thẻ từ vựng`, s: "Thẻ đến hạn, ôn để nhớ lâu", b: "Ôn thẻ" };
      case "mist": return { t: `Sửa ${x.n} lỗi sai`, s: "Các câu làm sai trong Sổ tay", b: "Sửa lỗi" };
      case "lesson": return L ? { t: x.half === 1 ? `Học nửa đầu bài: ${L.t}` : x.half === 2 ? `Học nốt bài: ${L.t}` : `Học bài mới: ${L.t}`, s: `${st.name} · Bài ${L.no} · cần đạt 80%`, b: x.half === 2 ? "Học tiếp" : "Vào học" } : { t: "Học bài mới", s: "", b: "Vào học" };
      case "exam": { const s2 = stageOf(x.sid); return { t: `Kiểm tra vượt chặng ${s2 ? s2.name : ""}`, s: "Đạt 80% để sang chặng mới", b: "Làm bài kiểm tra" }; }
      case "skill": return { t: { listen: "Luyện nghe: nghe và chép lại", speak: "Luyện nói: đọc to theo câu mẫu", write: "Luyện viết: sắp xếp và dịch câu" }[x.sk] || "Luyện kỹ năng", s: "Dùng từ, câu của các bài đã học", b: "Luyện ngay" };
      case "gram": { if (/^quiz:/.test(x.gid)) return { t: `Kiểm tra nhanh ngữ pháp ${x.gid.slice(5)}`, s: "15 câu, thử sức", b: "Làm bài" }; const G = typeof GT !== "undefined" && GT[x.gid]; return { t: `Ngữ pháp: ${G ? G.t : x.gid}`, s: "Luyện 8 câu, cần đạt 80%", b: "Luyện ngữ pháp" }; }
      case "wtest": return { t: "Bài kiểm tra tuần", s: "15 câu từ các bài đã học trong tuần", b: "Làm bài kiểm tra" };
      case "mtest": return { t: `Bài kiểm tra tháng: thi thử ${x.lv || lvNow()}`, s: `${mockMin(x.lv || lvNow())} phút · đủ 5 kỹ năng`, b: "Vào thi" };
    }
    return { t: "", s: "", b: "" };
  }
  function go(x) {
    switch (x.k) {
      case "review": return "startReview()"; case "mist": return "startMistakes()";
      case "lesson": return isOpen(x.lid) ? `openIntro('${x.lid}')` : "goNext()";
      case "exam": return `startExam('${x.sid}')`;
      case "skill": return `TEACHER.practice('${x.sk}')`;
      case "gram": return /^quiz:/.test(x.gid) ? `startGramQuiz('${x.gid.slice(5)}')` : `openTopic('${x.gid}')`;
      case "wtest": return "TEACHER.weekTest()"; case "mtest": return `startMock('${x.lv || lvNow()}')`;
    }
    return "";
  }
  const STN = { done: ["Đã xong", "good"], late: ["Nộp muộn", "warn"], open: ["Chưa làm", ""], over: ["Quá hạn · làm bù", "bad"], miss: ["Bỏ lỡ", "bad"] };
  function taskRow(x, h, d) {
    const l = label(x), s = stOf(x, h, d), lk = x.k === "skill" ? SKI2[x.sk] : ICON[x.k], sc = x.sc !== undefined && ["lesson", "gram", "exam", "skill"].includes(x.k) ? ` · ${x.sc}%` : "";
    const dis = s === "miss";
    return `<button class="task ttask ${x.done ? "ok" : ""} st-${s}" ${dis || x.done ? "" : `onclick="${go(x)}"`} ${dis ? "disabled" : ""}><span class="chk">${x.done ? '<i class="ti ti-check"></i>' : ""}</span><i class="ti ti-${lk}"></i><span class="grow"><b>${esc(l.t)}</b><small>~${x.m} phút · ${esc(l.s)}${sc}</small></span><span class="tst ${STN[s][1]}">${STN[s][0]}${x.done ? " " + hhmm(x.done) : ""}</span></button>`;
  }

  /* ---------- Yêu cầu của cô ---------- */
  function reqs() {
    const t = T(), r = [], due = odN(), mk = mistN(), n0 = sod(now());
    const nl = tNext(), g = nl && stageGate(nl);
    if (g) r.push({ k: "exam", ic: "certificate", t: `Bạn đã học xong các bài của <b>${stageOf(g).name}</b>. Trước khi sang chặng mới, cô yêu cầu làm <b>bài kiểm tra vượt chặng</b> và đạt từ 80%.`, b: "Làm bài kiểm tra vượt chặng", go: `startExam('${g}')` });
    if (t.wt.next && t.wt.next < n0) r.push({ k: "wtest", ic: "clipboard-check", t: `Bài kiểm tra tuần đã quá hạn <b>${dayDiff(n0, t.wt.next)} ngày</b>. Làm bài này trước (khoảng 15 phút) rồi học tiếp nhé.`, b: "Làm bài kiểm tra tuần", go: "TEACHER.weekTest()" });
    if (due > 30) r.push({ k: "due", ic: "cards", t: `Bạn đang có <b>${due} thẻ quá hạn</b> (đã đến hạn hơn một ngày mà chưa ôn). Học bài mới khi từ cũ chưa vững thì chỉ ít hôm sau là quên gần hết. Cô yêu cầu ôn bớt cho còn dưới 30 thẻ quá hạn rồi mới học bài mới.`, b: `Ôn ${Math.min(20, dueN())} thẻ ngay`, go: "startReview()" });
    if (mk > 15) r.push({ k: "mist", ic: "alert-triangle", t: `Sổ tay đang có <b>${mk} lỗi</b> chưa sửa. Lỗi để lâu sẽ thành thói quen, cô yêu cầu sửa bớt cho còn dưới 15 lỗi (mỗi lượt 15 câu, khoảng 8 phút) rồi mới sang bài mới.`, b: "Sửa lỗi ngay", go: "startMistakes()" });
    return r;
  }
  /* trước khi vào một bài MỚI: còn nợ bài thì cô nhắc, vẫn cho học tiếp nhưng ghi lại */
  function gate(id) {
    if (!on() || S.done[id] || !LES[id]) return false;
    const r = reqs(); if (!r.length) return false;
    const a = r[0], d = document.createElement("div"); d.className = "modal tmodal";
    d.innerHTML = `<div class="box"><div class="row"><span class="tav"><i class="ti ti-school"></i></span><h3 class="grow">Cô chủ nhiệm nhắc</h3></div>${r.map(x => `<p class="tsay">${x.t}</p>`).join("")}<button class="btn primary full" id="tgo">${a.b}</button><div class="row2"><button class="btn" id="mno">Để sau</button><button class="btn" id="tover">Vẫn học tiếp</button></div><p class="sm muted tsay">Nếu chọn “Vẫn học tiếp”, cô sẽ ghi lại vào phiếu liên lạc tuần.</p></div>`;
    document.body.appendChild(d);
    d.querySelector("#mno").onclick = () => d.remove();
    d.querySelector("#tgo").onclick = () => { d.remove(); (new Function(a.go))(); };
    d.querySelector("#tover").onclick = () => { d.remove(); const t = T(); r.forEach(x => t.over.push({ at: now(), why: x.k, id })); if (t.over.length > 100) t.over.splice(0, t.over.length - 100); tsave(); sl0(id); };
    pushSub(); return true;
  }
  const sl0 = startLesson;
  startLesson = function (id) { if (gate(id)) return; return sl0.apply(this, arguments); };

  /* ---------- Buổi luyện kỹ năng và bài kiểm tra tuần (dùng trình học sẵn có, kind "gram" để có tiêu đề riêng) ---------- */
  const learned = n => ORDER.filter(id => S.done[id] && S.done[id].best > 0).sort((a, b) => (S.done[b].at || 0) - (S.done[a].at || 0)).slice(0, n).map(id => LES[id]);
  function extTypes(sk) {
    try { const L = EXT.types || EXT.TYPES; if (Array.isArray(L)) return L.map(x => typeof x === "string" ? { id: x } : x).filter(x => x && (x.sk || (EXT.skillOf && EXT.skillOf(x.id || x.type))) === sk).map(x => x.id || x.type);
      if (obj(L)) return Object.keys(L).filter(k => (obj(L[k]) ? L[k].sk : L[k]) === sk); } catch (e) {}
    return [];
  }
  /* hoạt động mới của acts.js (EXT) nếu có; không có thì dùng dạng bài sẵn có */
  function extSteps(sk, stage, n) {
    try { if (!window.EXT || typeof EXT.pool !== "function" || typeof EXT.make !== "function") return [];
      const out = []; shuffle(extTypes(sk)).forEach(ty => { if (out.length >= n) return; const pool = EXT.pool(stage, ty) || []; pick(pool, 1).forEach(it => { const s = EXT.make(ty, it); (Array.isArray(s) ? s : [s]).forEach(x => { if (x && x.type && (EXT.render && EXT.render[x.type] || ["mcq", "dict", "speak", "order", "trans", "write", "read"].includes(x.type))) out.push(x); }); }); });
      return out.slice(0, n);
    } catch (e) { return []; }
  }
  function practiceSteps(sk) {
    const Ls = learned(4); if (!Ls.length) return [];
    const W = Ls.flatMap(L => L.W), Ss = Ls.flatMap(L => L.S || []), nv = noTTS(), pool = W.length >= 6 ? W : ALLW, st = extSteps(sk, Ls[0].stage, 2);
    const shortS = Ss.filter(s => s.en.split(" ").length <= 12);
    if (sk === "listen") {
      if (nv) { const R = Ls.find(L => L.r); if (R) st.push(mkRead(R.r)); pick(W, 5).forEach(w => st.push(mqMeaning(w, pool))); }
      else { if (Ls[0].stage === "s0") pick(W, 4).forEach(w => st.push({ type: "dict", sk: "listen", label: "Nghe và gõ lại từ", en: w.en, vi: w.vi })); else pick(shortS, 3).forEach(s => st.push({ type: "dict", sk: "listen", label: "Nghe và gõ lại câu", en: s.en, vi: s.vi })); pick(W, 4).forEach(w => st.push(mqListen(w, pool))); }
    } else if (sk === "speak") { (Ss.length >= 3 ? pick(Ss, 5) : pick(W, 5)).forEach(s => st.push({ type: "speak", sk: "speak", en: s.en, vi: s.vi, ipa: s.ipa })); }
    else { if (!Ss.length) return practiceSteps("listen"); pick(shortS.length ? shortS : Ss, 2).forEach(s => st.push({ type: "order", sk: "write", en: s.en, vi: s.vi })); pick(Ss, 2).forEach(s => st.push({ type: "trans", sk: "write", en: s.en, vi: s.vi })); const L = Ls.find(L => L.WR); if (L && S.settings.goal >= 30) st.push({ type: "write", sk: "write", wr: L.WR }); }
    return st;
  }
  function practice(sk) {
    const st = practiceSteps(sk);
    if (!st.length) { toast("Học xong bài mới hôm nay rồi luyện phần này nhé:<br>bài luyện dùng từ và câu của bài vừa học."); return; }
    newP("gram", st, { title: "Bài tập về nhà · Luyện " + SKV[sk].toLowerCase(), tt: { type: "hw", sk } });
  }
  function weekLessons() {
    const c = now() - 7 * DAY, ids = [...new Set(T().ev.filter(e => e.k === "lesson" && e.at >= c && e.sc > 0).map(e => e.id))].filter(id => LES[id]);
    if (ids.length >= 2) return ids;
    return [...new Set(ids.concat(learned(3).map(L => L.id)))].slice(0, 3);
  }
  function weekTestSteps() {
    const ids = weekLessons(); if (!ids.length) return [];
    const Ls = ids.map(id => LES[id]), W = Ls.flatMap(L => L.W), Ss = Ls.flatMap(L => L.S || []).filter(s => s.en.includes(" ")), nv = noTTS(), pool = W.length >= 6 ? W : ALLW, st = [];
    const letters = Ls.every(L => L.kind === "letters" || L.stage === "s0");
    if (typeof GRAMMAR !== "undefined") pick(GRAMMAR.filter(G => ids.includes(G.lesson)).flatMap(G => G.items.map(x => [x, G])), 3).forEach(x => st.push(gStep(x[0], x[1])));
    if (!letters && Ss.length) { const s2 = pick(Ss, 3); if (s2[0]) st.push({ type: "order", sk: "write", en: s2[0].en, vi: s2[0].vi }); if (s2[1]) st.push({ type: "trans", sk: "write", en: s2[1].en, vi: s2[1].vi }); if (s2[2] && !nv) st.push({ type: "dict", sk: "listen", label: "Nghe và gõ lại câu", en: s2[2].en, vi: s2[2].vi }); }
    const ws = pick(W, 15 - st.length);
    ws.forEach((w, i) => st.push(letters ? (nv ? mqMeaning(w, pool) : i % 2 ? mqListen(w, pool) : { type: "dict", sk: "listen", label: "Nghe và gõ lại từ", en: w.en, vi: w.vi }) : i % 3 === 2 && !nv ? mqListen(w, pool) : i % 3 === 1 ? mqReverse(w, pool) : mqMeaning(w, pool)));
    return shuffle(st).slice(0, 15);
  }
  function weekTest() {
    const st = weekTestSteps();
    if (!st.length) { toast("Bạn chưa học bài nào nên chưa có gì để kiểm tra.<br>Học bài đầu tiên trước nhé!", 4000); return; }
    newP("gram", st, { title: "Bài kiểm tra tuần", tt: { type: "wtest" } });
  }
  /* kết thúc buổi do cô giao: màn hình kết quả riêng */
  const f0 = finish;
  finish = function () {
    if (!P || !P.tt) return f0.apply(this, arguments);
    onFinish(P); tick();
    const p = P, sc = p.tot ? Math.round(p.ok / p.tot * 100) : 100, wt = p.tt.type === "wtest", good = sc >= 80, gained = p.xp + (wt ? (good ? 40 : 10) : 10); addXP(gained);
    const skr = Object.keys(p.sk).length ? `<div class="card skbox">${Object.keys(p.sk).map(x => { const v = p.sk[x], q = Math.round(v[0] / v[1] * 100); return `<div class="skrow"><i class="ti ti-${SKI[x]}"></i><span class="skn">${SK[x]}</span><div class="bar grow"><span style="width:${q}%"></span></div><b>${v[0]}/${v[1]}</b></div>`; }).join("")}</div>` : "";
    const say = wt ? (good ? `Bài kiểm tra tuần đạt <b>${sc}%</b>. Kiến thức của tuần đã vào đầu, cô ghi vào phiếu liên lạc rồi nhé.` : `Bài kiểm tra tuần được <b>${sc}%</b>, chưa tới mức 80% cô mong đợi. Các câu sai đã vào Sổ tay, tuần này mình sửa cho hết.`) : (good ? "Xong phần luyện tập, làm tốt lắm!" : "Xong phần luyện tập. Câu sai đã vào Sổ tay để sửa lại sau.");
    P = null; save();
    app().innerHTML = `<div class="donescr${good ? "" : " fail"}"><div class="ring xl" style="--p:${sc}"><span>${sc}%</span></div><h1>${wt ? (good ? "Đạt bài kiểm tra tuần!" : "Chưa đạt bài kiểm tra tuần") : "Hoàn thành bài tập!"}</h1><div class="card tnote"><span class="tav sm"><i class="ti ti-school"></i></span><p class="tsay grow">${say}</p></div><p class="xpbig">+${gained} XP</p>${skr}<div class="stack"><button class="btn primary full lg" onclick="TEACHER.open()"><i class="ti ti-school"></i> Về trang Cô chủ nhiệm</button><button class="btn full" onclick="nav('home')">Về trang chủ</button></div></div>`;
    document.body.classList.add("playing"); window.scrollTo(0, 0);
    if (good) { beep("done"); confetti(); } checkBadges(); checkDay();
  };
  const q0 = quit;
  quit = function () {
    if (!P || !P.tt) return q0.apply(this, arguments);
    if (P.tt.type === "wtest" && P.i > 0) { modal("Dừng bài kiểm tra tuần?", "Kết quả lần này sẽ không được lưu.<br>Bài kiểm tra vẫn còn trong danh sách việc cần làm.", "Dừng", () => { P = null; open("test"); }, true, "Làm tiếp"); return; }
    P = null; open();
  };

  /* ---------- Phiếu liên lạc tuần ---------- */
  function streakAt(t) { let n = 0, d = sod(t); if (!(S.days[kd(d)] > 30)) d = addD(d, -1); while (S.days[kd(d)] > 30 && n < 3660) { n++; d = addD(d, -1); } return n; }
  function report(ws, partial) {
    const t = T(), we = addD(ws, 7), g = S.settings.goal, end = partial ? Math.min(we, now()) : we, wkp = t.wk && t.wk.id === kd(ws) ? t.wk : null;
    const ds = []; for (let i = 0; i < 7; i++) ds.push(addD(ws, i));
    const from = sod(t.t0 || ws), planD = ds.filter(x => x >= from && ((wkp && (wkp.days.find(y => y.d === kd(x)) || {}).study) || isStudy(x)) && (!partial || sod(x) < sod(end) || (S.days[kd(x)] || 0) >= 300));
    const min = ds.reduce((a, x) => a + Math.round((S.days[kd(x)] || 0) / 60), 0), act = x => (S.days[kd(x)] || 0) >= 300, days = planD.filter(act).length, extra = ds.filter(x => act(x) && !planD.includes(x) && x >= from).length;
    const E = t.ev.filter(e => e.at >= ws && e.at < we), sk = accOf(ws, we);
    const all = Object.values(sk).reduce((a, v) => [a[0] + v[0], a[1] + v[1]], [0, 0]);
    let hwN = 0, hwDone = 0, hwLate = 0, hwMiss = 0; const missK = {};
    planD.forEach(x => { const d = kd(x), h = t.hw[d];
      const tasks = h ? h.tasks : ((wkp && (wkp.days.find(y => y.d === d) || {}).tasks) || [{ k: "review" }, { k: "lesson" }, { k: "skill" }]);
      tasks.forEach(y => { const s = h ? stOf(y, h, d) : (partial && sod(x) >= sod(now()) ? "open" : "miss"); if (partial && s === "open") return; hwN++; if (s === "done") hwDone++; else if (s === "late") { hwDone++; hwLate++; } else { hwMiss++; missK[y.k] = (missK[y.k] || 0) + 1; } }); });
    const hwKeys = Object.keys(t.hw).filter(d => d >= kd(ws) && d < kd(we)).sort(), lastH = hwKeys.length ? t.hw[hwKeys[hwKeys.length - 1]] : null;
    const wtH = t.wt.hist.filter(h => (h.at >= ws && h.at < we) || (h.miss && h.due >= ws && h.due < we)), wDone = wtH.filter(h => !h.miss).pop(), mtH = t.mt.hist.filter(h => !h.miss && h.at >= ws && h.at < we).pop();
    const r = { wk: kd(ws), min, goalMin: g * planD.length, plan: planD.length, days, extra, newL: E.filter(e => e.k === "lesson" && e.first && e.sc >= 80).length, lessons: new Set(E.filter(e => e.k === "lesson").map(e => e.id)).size, cards: E.filter(e => e.k === "review").reduce((a, e) => a + e.cards, 0),
      hwN, hwDone, hwLate, hwMiss, hw: hwN ? Math.round(hwDone / hwN * 100) : undefined, streak: streakAt(partial ? now() : addD(we, -1)), due: partial || !lastH ? odN() : lastH.due0, mist: partial || !lastH ? mistN() : lastH.mist0,
      over: t.over.filter(o => o.at >= ws && o.at < we).length, sk, acc: all[1] >= 5 ? Math.round(all[0] / all[1] * 100) : null };
    if (wDone) r.wsc = wDone.sc; else if (wtH.some(h => h.miss)) r.wmiss = 1;
    if (mtH) { r.mlv = ["A1", "A2", "B1", "B2", "C1"].indexOf(mtH.lv); r.msc = mtH.sc; }
    analyse(r, missK);
    return r;
  }
  const rate = v => v >= 85 ? "Tốt" : v >= 65 ? "Khá" : v >= 40 ? "Trung bình" : "Cần cố gắng";
  function analyse(r, missK) {
    const good = [], bad = [], ratio = r.goalMin ? r.min / r.goalMin : 0, sks = Object.keys(r.sk).filter(k => r.sk[k][1] >= 6).map(k => [k, pc(r.sk[k]), r.sk[k]]).sort((a, b) => b[1] - a[1]);
    if (r.plan && r.days >= r.plan && ratio >= 1) good.push(`Học đều: ${r.days}/${r.plan} buổi, ${r.min} phút`);
    else if (r.plan && ratio < 0.6) bad.push(`Thời gian học thấp: ${r.min}/${r.goalMin} phút`);
    if (r.hw !== undefined && r.hw >= 90) good.push(`Làm đủ bài tập về nhà (${r.hw}%)`); else if (r.hw !== undefined && r.hw < 60) bad.push(`Bài tập về nhà mới xong ${r.hw}%`);
    if (r.extra) good.push(`Học thêm ${r.extra} buổi ngoài lịch`);
    if (r.newL >= 3) good.push(`Hoàn thành ${r.newL} bài mới`);
    sks.filter(x => x[1] >= 85).slice(0, 2).forEach(x => good.push(`${SKV[x[0]]} chính xác ${x[1]}%`));
    sks.filter(x => x[1] < 70).slice(-2).reverse().forEach(x => bad.push(`${SKV[x[0]]} mới đúng ${x[1]}%`));
    if (r.wsc !== undefined) (r.wsc >= 80 ? good : bad).push(`Kiểm tra tuần ${r.wsc}%`); else if (r.wmiss) bad.push("Bỏ lỡ bài kiểm tra tuần");
    if (r.due > 30) bad.push(`${r.due} thẻ quá hạn ôn`); if (r.mist > 15) bad.push(`${r.mist} lỗi chưa sửa`);
    if (r.over) bad.push(`${r.over} lần bỏ qua lời nhắc ôn tập`);
    if (r.streak >= 7) good.push(`Chuỗi ${r.streak} ngày học liên tiếp`);
    r.good = good.slice(0, 5); r.bad = bad.slice(0, 5);
    r.rate = [["Chuyên cần", rate(r.plan ? Math.min(ratio, r.days / r.plan) * 100 : 0)], ["Bài tập", r.hw === undefined ? "–" : rate(r.hw)], ["Kết quả", r.acc === null ? "–" : rate(r.acc >= 90 ? 100 : (r.acc - 50) * 2.2)]];
    r.cm = comment(r, sks, missK);
  }
  /* lời phê: viết từ số liệu, câu chữ thay đổi theo tuần (hạt giống = mã tuần) nhưng ổn định khi xem lại */
  function seeded(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }
  const MISSN = { review: "phần ôn thẻ", mist: "phần sửa lỗi", lesson: "bài mới", exam: "bài kiểm tra vượt chặng", skill: "phần luyện kỹ năng", gram: "phần ngữ pháp", wtest: "bài kiểm tra tuần", mtest: "bài kiểm tra tháng" };
  const ADV = { listen: "mỗi ngày nghe chép 3–5 câu, nghe chậm trước rồi nghe tốc độ thường", speak: "đọc to theo câu mẫu, chú ý âm cuối của từ và nghe lại giọng mình", write: "viết xong thì đọc lại một lượt, soát thì của động từ và các từ nhỏ như a, the, to", vocab: "ôn thẻ đều mỗi ngày, đừng để dồn", gram: "đọc lại phần giải thích trước khi luyện, đừng đoán mò", read: "đọc câu hỏi trước, tìm từ khóa rồi mới đọc bài" };
  function comment(r, sks, missK) {
    const R = seeded(r.wk + (S.name || "")), P1 = a => a[Math.floor(R() * a.length)];
    const nm = String(S.name || "").trim().split(/\s+/).pop(), b = nm || "bạn";
    const ratio = r.goalMin ? r.min / r.goalMin : 0, pct = Math.round(ratio * 100), miss = Math.max(0, r.plan - r.days), out = [];
    let tone;
    if (!r.plan) { out.push(`Tuần này chưa có buổi nào trong lịch học của ${b}, nên cô chưa chấm chuyên cần.`); tone = 1; }
    else if (r.min === 0) { out.push(P1([`Tuần này cô chưa thấy ${b} vào học buổi nào.`, `Cả tuần qua ${b} chưa học buổi nào.`]) + " " + P1(["Cô hiểu ai cũng có tuần bận, nhưng nghỉ trọn một tuần thì từ vựng bắt đầu rơi rụng, nhất là các thẻ đang đến hạn ôn.", "Cô không trách, nhưng nói thật: nghỉ một tuần thì phải mất gần một tuần nữa mới lấy lại nhịp."])); tone = 0; }
    else if (ratio >= 1 && r.days >= r.plan) { out.push(P1([`Tuần này ${b} học rất đều: đủ ${r.days}/${r.plan} buổi theo lịch, tổng cộng ${r.min} phút, đạt ${pct}% mục tiêu.`, `Cô rất hài lòng với sự chuyên cần của ${b}: ${r.days}/${r.plan} buổi, ${r.min} phút, không bỏ buổi nào.`, `Chuyên cần tuần này rất tốt: ${b} học ${r.min} phút qua ${r.days} buổi, vượt mục tiêu ${r.goalMin} phút.`])); tone = 2; }
    else if (ratio >= 1) { out.push(`${cap(b)} học đủ ${r.min} phút, đạt mục tiêu tuần, nhưng chỉ có ${r.days}/${r.plan} buổi. Học dồn vào ít buổi thì nhớ không lâu bằng học rải đều mỗi ngày.`); tone = 2; }
    else if (ratio >= 0.6) { out.push(P1([`Tuần này ${b} học ${r.days}/${r.plan} buổi, được ${r.min} phút trên mục tiêu ${r.goalMin} phút (${pct}%). ${r.hw !== undefined && r.hw < 50 ? "Thời gian học tạm được, nhưng phần bài tập thì chưa." : `Kết quả tạm ổn, nhưng còn hụt khoảng ${r.goalMin - r.min} phút.`}`, `${cap(b)} đã học ${r.days}/${r.plan} buổi, được ${r.min} phút, tức ${pct}% mục tiêu. ${r.hw !== undefined && r.hw < 50 ? "Thời gian học tạm được, nhưng phần bài tập thì chưa." : ratio >= 0.9 ? "Chỉ còn thiếu một chút nữa là đạt mục tiêu." : `Chưa đủ, nhưng cô thấy ${b} có cố gắng.`}`])); tone = 1; }
    else if (r.hw !== undefined && r.hw >= 90) { out.push(`${cap(b)} làm đủ bài tập nhưng mới học ${r.min} phút trên mục tiêu ${r.goalMin} phút (${pct}%). Bài tập chỉ là phần tối thiểu; thời gian còn lại của mỗi buổi, hãy nghe lại bài, nói theo câu mẫu hoặc chơi trò chơi gợi nhớ.`); tone = 1; }
    else { out.push(`Tuần này ${b} chỉ học ${r.min}/${r.goalMin} phút, mới đạt ${pct}% mục tiêu${miss ? ` và bỏ trống ${miss}/${r.plan} buổi` : ", buổi nào cũng quá ngắn"}. ` + P1(["Cô nói thẳng: với nhịp này thì rất khó giữ được những gì đã học.", "Học như vậy thì kiến thức mới chưa kịp vững đã bị quên."])); tone = 0; }
    // bài tập về nhà
    if (r.hwN) {
      const mk = Object.keys(missK || {}).filter(k => k !== "wtest" && k !== "mtest").sort((a, c) => missK[c] - missK[a])[0];
      if (r.hw === 100 && !r.hwLate) out.push(P1([`Bài tập về nhà làm đủ ${r.hwN}/${r.hwN} việc và đều đúng hạn, cô khen.`, `Cả ${r.hwN} việc cô giao đều xong đúng hạn.`]));
      else if (r.hw >= 80) out.push(`Bài tập về nhà hoàn thành ${r.hw}% (${r.hwDone}/${r.hwN} việc)${r.hwLate ? `, có ${r.hwLate} việc nộp muộn` : ""}.`);
      else if (r.hw >= 50) out.push(`Bài tập về nhà mới xong ${r.hwDone}/${r.hwN} việc (${r.hw}%)${mk ? `, bỏ nhiều nhất là ${MISSN[mk]}` : ""}.`);
      else if (r.min > 0) out.push(`Bài tập về nhà chỉ xong ${r.hwDone}/${r.hwN} việc${mk ? `, bỏ nhiều nhất là ${MISSN[mk]}` : ""}. Bài tập là phần giúp kiến thức ở lại lâu, bỏ nhiều như vậy thì học bài mới cũng khó vững.`);
    }
    // giọng khen / nhắc phải khớp cả phần bài tập: bỏ nhiều bài tập thì không khen
    if (r.hw !== undefined) tone = r.hw < 50 ? 0 : r.hw < 80 ? Math.min(tone, 1) : tone;
    // kỹ năng
    if (sks.length) {
      const best = sks[0], worst = sks[sks.length - 1];
      if (best[1] >= 85) out.push(P1([`Điểm sáng của tuần là ${SKV[best[0]].toLowerCase()}: đúng ${best[1]}% số câu.`, `${SKV[best[0]]} là kỹ năng ${b} làm tốt nhất tuần này, chính xác ${best[1]}%.`]));
      if (worst[1] < 70 && worst !== best) out.push(`Cần lưu ý nhất là ${SKV[worst[0]].toLowerCase()}: mới đúng ${worst[2][0]}/${worst[2][1]} câu (${worst[1]}%). Cách khắc phục: ${ADV[worst[0]]}.`);
      else if (worst[1] < 70) out.push(`${SKV[worst[0]]} mới đúng ${worst[1]}%, cần luyện thêm: ${ADV[worst[0]]}.`);
      else if (best[1] < 85) out.push(`Các kỹ năng khá đồng đều, khoảng ${r.acc}% câu đúng; muốn lên mức tốt thì cần trên 85%.`);
    } else if (r.min > 0) out.push("Tuần này số câu làm còn ít, cô chưa đủ dữ liệu để nhận xét từng kỹ năng.");
    // kiểm tra
    if (r.wsc !== undefined) out.push(r.wsc >= 80 ? `Bài kiểm tra tuần đạt ${r.wsc}%, bài của tuần đã nắm khá chắc.` : `Bài kiểm tra tuần được ${r.wsc}%, chưa tới 80%; các câu sai đã vào Sổ tay để sửa.`);
    else if (r.wmiss) out.push("Bài kiểm tra tuần bị bỏ lỡ, tuần tới phải làm bù trước tiên.");
    if (r.msc !== undefined) out.push(`Bài kiểm tra tháng (thi thử ${["A1", "A2", "B1", "B2", "C1"][r.mlv] || ""}) được ${r.msc}%.`);
    // nề nếp ôn tập
    if (r.over) out.push(`${cap(b)} đã ${r.over} lần bỏ qua lời nhắc để học bài mới. Cô quý sự hăng hái, nhưng từ cũ chưa vững thì bài mới cũng không đứng được lâu.`);
    else if (r.due > 30 || r.mist > 15) out.push(`Hiện còn ${r.due > 30 ? `${r.due} thẻ quá hạn ôn` : ""}${r.due > 30 && r.mist > 15 ? " và " : ""}${r.mist > 15 ? `${r.mist} lỗi chưa sửa` : ""}, đây là việc phải xử lý trước.`);
    // yêu cầu tuần tới
    let req;
    if (r.min === 0 && r.plan) req = `vào học ít nhất ${Math.min(3, r.plan)} buổi, mỗi buổi tối thiểu 10 phút, bắt đầu bằng phần ôn thẻ`;
    else if (r.due > 30 || r.mist > 15 || r.over) req = "ôn hết thẻ quá hạn và sửa lỗi trước, rồi mới học bài mới";
    else if (r.hw !== undefined && r.hw < 60) req = "làm đủ bài tập về nhà trước giờ hạn, mỗi ngày làm việc khó nhất trước";
    else if (ratio < 0.8) req = `học đủ ${S.settings.goal} phút vào các buổi trong lịch, không để dồn`;
    else if (sks.length && sks[sks.length - 1][1] < 75) req = `mỗi buổi dành thêm 5 phút cho ${SKV[sks[sks.length - 1][0]].toLowerCase()}`;
    else if (r.wmiss || r.wsc === undefined) req = "giữ nhịp này và làm bài kiểm tra tuần đúng hạn";
    else req = P1(["giữ vững nhịp này, và thử nói to mỗi câu mẫu hai lần", "giữ nhịp này và tự đặt thêm một câu với từ mới của mỗi bài"]);
    out.push(`Tuần tới cô yêu cầu: ${req}.`);
    out.push(tone === 2 ? P1([`Cứ đà này, cô tin ${b} sẽ tiến bộ rất nhanh.`, `Cô tự hào về ${b}. Giữ vững phong độ nhé!`, "Rất đáng khen, tiếp tục như vậy nhé!"]) : tone === 1 ? P1([`Cô tin ${b} làm được tốt hơn. Cố lên!`, "Mỗi ngày một chút, nhưng đều đặn, là đủ.", `Tuần tới cô chờ ${b} bứt lên.`]) : P1([`Bắt đầu lại không khó: chỉ cần 10 phút ngay hôm nay. Cô chờ ${b} ở buổi học tới.`, `Cô không cần ${b} học nhiều, cô cần ${b} học đều. Hẹn gặp ${b} ở buổi tới.`]));
    return out.join(" ");
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  /* chốt phiếu các tuần đã qua (kể cả tuần không mở app) */
  function finalize() {
    const t = T(); if (!t.on || !t.t0) return;
    const cur = monday(now()); let ws = monday(t.t0), g = 0;
    while (ws < cur && g++ < 60) { const id = kd(ws); if (!t.rep.some(r => r.wk === id)) { t.rep.push(sanRep(report(ws, false))); t.rep.sort((a, b) => a.wk < b.wk ? -1 : 1); } ws = addD(ws, 7); }
    if (t.rep.length > 52) t.rep.splice(0, t.rep.length - 52);
  }

  /* ---------- Nhắc học: thông báo của trình duyệt và tệp lịch .ics ---------- */
  const iosDev = () => typeof isIOSDev === "function" ? isIOSDev() : /iP(hone|ad|od)/.test(navigator.userAgent);
  const standalone = () => !!(navigator.standalone || (window.matchMedia && matchMedia("(display-mode: standalone)").matches));
  function notifState() {
    if (!("Notification" in window)) return iosDev() && !standalone() ? "ios" : "none";
    return Notification.permission; // default | granted | denied
  }
  function askNotif() {
    const s = notifState();
    if (s === "ios" || s === "none") { render(); return; }
    try { const r = Notification.requestPermission(p => { render(); if (p === "granted") { testNotif(); schedule(); } }); if (r && r.then) r.then(p => { render(); if (p === "granted") { testNotif(); schedule(); } }); } catch (e) {}
  }
  function notify(title, body) {
    try { const o = { body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag: "hta-teacher", lang: "vi" };
      const fb = () => { try { new Notification(title, o); } catch (e) {} };
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) navigator.serviceWorker.getRegistration().then(r => r && r.showNotification ? r.showNotification(title, o) : fb(), fb); else fb();
    } catch (e) {}
  }
  function testNotif() { notify("Cô chủ nhiệm đã bật nhắc học", `Cô sẽ nhắc bạn lúc ${T().time} vào các ngày ${dayList()}.`); }
  const dayList = () => WEEK.filter(d => T().days.includes(d)).map(d => WDS[d]).join(", ");
  function remText() {
    const h = hwFor(today(), true); if (!h) return null; const left = h.tasks.filter(x => !x.done); if (!left.length) return null;
    const m = left.reduce((a, x) => a + x.m, 0);
    return { left, m, body: `Hôm nay còn ${left.length} việc (~${m} phút): ${left.slice(0, 3).map(x => label(x).t).join("; ")}${left.length > 3 ? "…" : ""}. Hạn nộp ${hhmm(h.due)}.` };
  }
  let ntH = 0;
  /* khi app đang mở hoặc vừa mở lại: đến giờ học thì nhắc; còn 1 tiếng tới hạn mà chưa xong thì nhắc lần nữa (mỗi loại một lần mỗi ngày) */
  function schedule() {
    clearTimeout(ntH); const t = T(); if (!t.on || notifState() !== "granted") return;
    const n = now(), d = today(), h = isStudy(n) ? hwFor(d, true) : null, rem = atT(n, t.time);
    let next = atT(addD(n, 1), t.time);
    if (h) { const soon = h.due - 3600000, r = remText();
      if (r && n >= rem && n < h.due && t.nt.rem !== d && n < soon) { t.nt.rem = d; tsave(); notify("Đến giờ học tiếng Anh rồi!", r.body); }
      else if (r && n >= soon && n < h.due && t.nt.soon !== d) { t.nt.soon = d; t.nt.rem = d; tsave(); notify("Sắp hết hạn bài tập về nhà", `Còn khoảng ${Math.max(1, Math.round((h.due - n) / 60000))} phút nữa là hết hạn. ${r.body}`); }
      if (n < rem) next = rem; else if (n < soon) next = soon; }
    ntH = setTimeout(schedule, Math.max(30000, Math.min(next - n + 1000, 6 * 3600000)));
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && on()) { check(); schedule(); } });
  const icsEsc = s => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  /* gấp dòng 75 byte (UTF-8), không cắt giữa một ký tự */
  function fold(line) { const out = []; let cur = "", n = 0; for (const ch of line) { const b = unescape(encodeURIComponent(ch)).length; if (n + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; n = 0; } cur += ch; n += b; } out.push(cur); return out.join("\r\n "); }
  const icsDT = t => { const d = new Date(t), p = x => String(x).padStart(2, "0"); return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "T" + p(d.getHours()) + p(d.getMinutes()) + "00"; };
  const icsUTC = t => new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  function ics() {
    const t = T(), g = S.settings.goal, first = (() => { for (let i = 0; i < 8; i++) { const x = addD(now(), i); if (isStudy(x) && atT(x, t.time) > now()) return atT(x, t.time); } return atT(addD(now(), 1), t.time); })();
    const url = /^https?:/.test(location.href) ? location.href.split("#")[0].split("?")[0] : "";
    const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Tieng Anh Tu So 0//Co chu nhiem//VI", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:" + icsEsc("Học tiếng Anh"),
      "BEGIN:VEVENT", "UID:hta-" + (t.t0 || now()) + "-" + t.days.join("") + t.time.replace(":", "") + "@tienganhtuso0", "DTSTAMP:" + icsUTC(now()), "DTSTART:" + icsDT(first), "DURATION:PT" + g + "M",
      "RRULE:FREQ=WEEKLY;BYDAY=" + WEEK.filter(d => t.days.includes(d)).map(d => ICSD[d]).join(","),
      "SUMMARY:" + icsEsc(`Học tiếng Anh ${g} phút`),
      "DESCRIPTION:" + icsEsc(`Cô chủ nhiệm nhắc: đến giờ học rồi!\nMở app Tiếng Anh Từ Số 0, vào trang Cô chủ nhiệm để xem bài tập về nhà hôm nay.\nThứ tự nên làm: ôn thẻ đến hạn → bài mới → luyện kỹ năng.` + (url ? "\n" + url : "")),
      ...(url ? ["URL:" + url] : []), "CATEGORIES:" + icsEsc("Học tập"), "TRANSP:OPAQUE",
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEsc("Đến giờ học tiếng Anh rồi!"), "TRIGGER:PT0S", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"];
    return L.map(fold).join("\r\n") + "\r\n";
  }
  function dlICS() {
    const s = ics(), name = "nhac-hoc-tieng-anh.ics";
    try {
      // iPhone (Safari): mở thẳng tệp lịch (không tải về) để hiện bảng "Thêm vào Lịch"; máy khác: tải tệp .ics
      const b = new Blob([s], { type: "text/calendar;charset=utf-8" }), a = document.createElement("a"), ios = iosDev(); a.href = URL.createObjectURL(b); if (!ios) a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      dlICS.last = s;
      toast(ios ? "Bấm <b>Thêm tất cả</b> để thêm lịch nhắc vào ứng dụng Lịch." : `Đã tải tệp <b>${name}</b>.<br>Mở tệp để thêm lịch nhắc vào ứng dụng Lịch.`, 5000);
    } catch (e) { toast("Máy chưa tải được tệp lịch."); }
  }

  /* ---------- Thẻ ở trang chủ ---------- */
  function hello() { const hr = new Date(now()).getHours(); return hr < 11 ? "Chào buổi sáng" : hr < 14 ? "Chào buổi trưa" : hr < 18 ? "Chào buổi chiều" : "Chào buổi tối"; }
  const nameBit = () => { const n = String(S.name || "").trim().split(/\s+/).pop(); return n ? ", " + esc(n) : ""; };
  function todayLine(h) {
    const d = today();
    if (!isStudy(now())) { const nx = (() => { for (let i = 1; i < 8; i++) { const x = addD(now(), i); if (isStudy(x)) return x; } return 0; })(); return `Hôm nay là ngày nghỉ theo lịch.${dueN() ? ` Nếu rảnh, ôn vài thẻ đến hạn cho nhớ lâu.` : ""}${nx ? ` Buổi tới: <b>${fmtD(nx)}</b>, ${T().time}.` : ""}`; }
    if (!h) return "Cô đang chuẩn bị bài cho hôm nay.";
    const left = h.tasks.filter(x => !x.done), m = left.reduce((a, x) => a + x.m, 0);
    if (!left.length) return `Bạn đã làm xong cả <b>${h.tasks.length} việc</b> cô giao hôm nay. Rất tốt, mai gặp lại nhé!`;
    const late = now() > h.due;
    return `${left.length === h.tasks.length ? `Hôm nay cô giao <b>${h.tasks.length} việc</b>, khoảng ${m} phút.` : `Bạn đã xong <b>${h.tasks.length - left.length}/${h.tasks.length} việc</b>, còn ${left.length} việc (khoảng ${m} phút).`} ${late ? `Đã quá hạn nộp <b>${hhmm(h.due)}</b>, làm bù ngay hôm nay hoặc ngày mai vẫn được ghi nhận.` : `Hạn nộp: <b>${hhmm(h.due)}</b>.`}`;
  }
  function owed() { const y = kd(addD(now(), -1)), h = T().hw[y]; return h ? h.tasks.filter(x => stOf(x, h, y) === "over").map(x => ({ x, h, d: y })) : []; }
  function homeCard(h) {
    try {
      let c;
      if (!on()) c = `<section class="card tcard"><div class="row"><span class="tav"><i class="ti ti-school"></i></span><div class="grow"><b>Cô chủ nhiệm</b><small class="muted">Lộ trình riêng, bài tập về nhà, nhắc học</small></div></div><p class="tsay">Cô sẽ lập lộ trình từng tuần theo thời gian của bạn, giao bài tập mỗi ngày, kiểm tra định kỳ và gửi phiếu liên lạc cuối tuần.</p><button class="btn primary full" onclick="TEACHER.open()">Nhận lộ trình riêng <i class="ti ti-arrow-right"></i></button></section>`;
      else {
        week(); check(); const d = today(), hw = isStudy(now()) ? hwFor(d, true) : null, ow = owed(), rq = reqs();
        const left = hw ? hw.tasks.filter(x => !x.done) : [], nx = ow.length ? ow[0].x : left[0];
        c = `<section class="card tcard"><div class="row"><span class="tav"><i class="ti ti-school"></i></span><div class="grow"><b>${hello()}${nameBit()}!</b><small class="muted">Cô chủ nhiệm · ${fmtD(now())}</small></div>${hw ? `<span class="pill ${left.length ? "" : "good"}">${hw.tasks.length - left.length}/${hw.tasks.length}</span>` : ""}</div>
        <p class="tsay">${todayLine(hw)}</p>
        ${ow.length ? `<p class="twarn"><i class="ti ti-clock-exclamation"></i><span>Còn nợ <b>${ow.length} việc</b> của hôm qua, làm bù trước khi hết ngày hôm nay.</span></p>` : ""}
        ${rq.slice(0, 2).map(r => `<p class="twarn"><i class="ti ti-${r.ic}"></i><span>${{ exam: "Cần qua bài kiểm tra vượt chặng trước khi sang chặng mới.", wtest: "Bài kiểm tra tuần đã quá hạn.", due: `${odN()} thẻ quá hạn ôn: ôn bớt trước khi học bài mới.`, mist: `${mistN()} lỗi chưa sửa: sửa bớt trước khi học bài mới.` }[r.k]}</span></p>`).join("")}
        ${nx ? (() => { const l = label(nx); return `<button class="task ttask" onclick="${go(nx)}"><span class="chk"></span><i class="ti ti-${nx.k === "skill" ? SKI2[nx.sk] : ICON[nx.k]}"></i><span class="grow"><b>${esc(l.t)}</b><small>Việc tiếp theo · ~${nx.m} phút</small></span><i class="ti ti-chevron-right muted"></i></button>`; })() : ""}
        <button class="btn full" onclick="TEACHER.open()"><i class="ti ti-list-check"></i> Xem bài tập và lộ trình</button></section>`;
        schedule();
      }
      const i = h.indexOf("</header>"); return i < 0 ? c + h : h.slice(0, i + 9) + c + h.slice(i + 9);
    } catch (e) { return h; }
  }
  /* Hồ sơ: lối vào trang cô chủ nhiệm (chèn sau khi vMe vẽ xong) */
  if (typeof vMe === "function") { const m0 = vMe; vMe = function () { m0.apply(this, arguments); try { const st = $("#app .stats"); if (st) st.insertAdjacentHTML("afterend", `<button class="card tcard tlink" onclick="TEACHER.open()"><span class="tav"><i class="ti ti-school"></i></span><span class="grow"><b>Cô chủ nhiệm</b><small class="muted">${on() ? "Bài tập, lịch học, kiểm tra, phiếu tuần" : "Nhận lộ trình học riêng theo tuần"}</small></span><i class="ti ti-chevron-right muted"></i></button>`); } catch (e) {} }; }

  /* ---------- Trang cô chủ nhiệm ---------- */
  let draft = null;
  function setupHtml(first) {
    const t = T(), dr = draft || (draft = { days: t.days.slice(), time: t.time, goal: S.settings.goal });
    return `${first ? `<div class="card tcard"><div class="row"><span class="tav"><i class="ti ti-school"></i></span><b class="grow">Chào bạn, cô là <span class="nw">cô chủ nhiệm</span> của bạn</b></div><p class="tsay">Cô sẽ lập lộ trình từng tuần theo thời gian của bạn, giao bài tập về nhà mỗi ngày, cho kiểm tra mỗi tuần và mỗi tháng, nhắc bạn học đúng giờ và gửi phiếu liên lạc vào cuối tuần. Trước hết, cho cô biết bạn học được vào những ngày nào và lúc mấy giờ.</p></div>` : ""}
    <section class="card set"><label>Mỗi buổi học bao lâu?</label><div class="seg">${[15, 30, 60, 90].map(x => `<button class="${dr.goal === x ? "on" : ""}" aria-pressed="${dr.goal === x}" onclick="TEACHER._dr('goal',${x})">${x}'</button>`).join("")}</div>
    <label>Những ngày bạn học được</label><div class="tdays">${WEEK.map(d => `<button class="${dr.days.includes(d) ? "on" : ""}" aria-pressed="${dr.days.includes(d)}" onclick="TEACHER._dr('day',${d})">${WDS[d]}</button>`).join("")}</div>
    <label for="ttime">Giờ học thường ngày</label><input type="time" id="ttime" class="inp" value="${dr.time}" onchange="TEACHER._dr('time',this.value)">
    <p class="sm muted tsay">${dr.days.length} buổi mỗi tuần, ${dr.goal} phút mỗi buổi: khoảng ${String(Math.round(dr.days.length * dr.goal / 60 * 10) / 10).replace(".", ",")} giờ mỗi tuần. ${dr.days.length * dr.goal < 90 ? "Hơi ít: cô vẫn theo được, nhưng tiến độ sẽ chậm." : dr.days.length * dr.goal >= 300 ? "Nhịp học rất mạnh, nhớ ngủ đủ để não kịp ghi nhớ." : "Nhịp học vừa sức, giữ đều là tiến bộ."}</p>
    <button class="btn primary full lg" ${dr.days.length ? "" : "disabled"} onclick="TEACHER._save()">${first ? "Lập lộ trình cho tôi" : "Lưu lịch học"}</button></section>`;
  }
  function dr(k, v) { const d = draft; if (k === "day") { const i = d.days.indexOf(v); if (i >= 0) d.days.splice(i, 1); else d.days.push(v); } else if (k === "time") d.time = /^\d{2}:\d{2}$/.test(v) ? v : d.time; else d.goal = v; render(); }
  function saveSetup() {
    const t = T(), d = draft || { days: t.days, time: t.time, goal: S.settings.goal }; if (!d.days.length) return;
    const first = !t.on, changed = first || d.goal !== S.settings.goal || d.days.join() !== t.days.join();
    t.days = d.days.slice().sort(); t.time = d.time; S.settings.goal = d.goal; draft = null;
    if (first) { t.on = 1; t.t0 = now(); t.wt.next = snapStudy(addD(sod(now()), 7)); t.mt.next = snapStudy(addD(sod(now()), 30)); }
    if (changed) { t.wk = null; const td = today(); if (t.hw[td] && !t.hw[td].tasks.some(x => x.done)) delete t.hw[td]; }
    t.nt = { rem: "", soon: "" }; week(); tsave(); t.tab = first ? "today" : t.tab; render(); schedule();
    toast(first ? "Cô đã lập xong lộ trình tuần này cho bạn!" : "Đã lưu lịch học. Cô cập nhật lại lộ trình tuần.", 3500);
  }
  function remindHtml() {
    const s = notifState(), t = T();
    const nst = { granted: `<p class="pill good"><i class="ti ti-bell-ringing"></i> Đã bật thông báo</p><p class="sm muted tsay">Cô nhắc lúc <b>${t.time}</b> vào các ngày ${dayList()}, và nhắc thêm khi còn 1 tiếng tới hạn nộp bài mà chưa làm xong. Thông báo của trình duyệt chỉ chạy khi app đang mở hoặc vừa được mở lại; muốn được nhắc cả khi đã tắt app, hãy thêm lịch nhắc vào điện thoại ở dưới.</p>`,
      denied: `<p class="pill bad">Thông báo đang bị chặn</p><p class="sm muted tsay">Bạn đã chặn thông báo của trang này. Muốn bật lại, vào phần cài đặt trang web của trình duyệt (biểu tượng ổ khóa cạnh địa chỉ trang), cho phép Thông báo. Hoặc dùng lịch nhắc trên điện thoại ở dưới.</p>`,
      default: `<p class="sm muted tsay">Cho phép thông báo để cô nhắc đúng giờ học. Trình duyệt sẽ hỏi bạn một lần, hãy bấm <b>Cho phép</b>.</p><button class="btn full" onclick="TEACHER._notif()"><i class="ti ti-bell"></i> Bật thông báo nhắc học</button>`,
      ios: `<p class="sm tsay"><b>Trên iPhone, iPad:</b> thông báo chỉ dùng được khi app đã được thêm ra màn hình chính. Mở trang này bằng <b>Safari</b>, bấm nút <span class="nw"><b>Chia sẻ</b> <i class="ti ti-share-2"></i>,</span> chọn <b>“Thêm vào MH chính”</b>, rồi mở app từ biểu tượng mới và bật thông báo ở đây (cần iOS 16.4 trở lên).</p>`,
      none: `<p class="sm muted tsay">Trình duyệt này không hỗ trợ thông báo. Hãy dùng lịch nhắc trên điện thoại ở dưới.</p>` }[s] || "";
    return `<h4 class="sec">Nhắc học</h4><section class="card set" id="tremind"><label>Thông báo trong app</label>${nst}
    <label>Lịch nhắc trên điện thoại</label><p class="sm muted tsay">Tải tệp lịch có sự kiện lặp lại lúc <b>${t.time}</b> vào ${dayList()}, kèm chuông báo đúng giờ. Mở tệp là thêm được vào ứng dụng Lịch của iPhone hoặc Google Calendar, nhắc cả khi không mở app. Đổi giờ học thì tải lại tệp mới và xóa sự kiện cũ.</p>
    <button class="btn full" onclick="TEACHER._ics()"><i class="ti ti-calendar-plus"></i> Thêm lịch nhắc vào điện thoại</button></section>`;
  }
  function todayHtml() {
    const t = T(), d = today(), hw = isStudy(now()) ? hwFor(d, true) : null, ow = owed(), rq = reqs();
    let h = `<div class="card tcard"><div class="row"><span class="tav"><i class="ti ti-school"></i></span><div class="grow"><b>${hello()}${nameBit()}!</b><small class="muted">${fmtD(now())}</small></div></div><p class="tsay">${todayLine(hw)}</p></div>`;
    if (rq.length) h += `<h4 class="sec">Cô yêu cầu</h4>` + rq.map(r => `<section class="card treq"><p class="tsay"><i class="ti ti-${r.ic}"></i> ${r.t}</p><button class="btn primary full" onclick="${r.go}">${r.b}</button></section>`).join("");
    if (ow.length) h += `<h4 class="sec">Nợ bài hôm qua</h4><section class="card">${ow.map(o => taskRow(o.x, o.h, o.d)).join("")}<p class="sm muted tsay">Việc làm bù trong hôm nay vẫn được ghi nhận nhưng tính là nộp muộn.</p></section>`;
    if (hw) { const n = hw.tasks.filter(x => x.done).length, m = hw.tasks.reduce((a, x) => a + x.m, 0);
      h += `<h4 class="sec">Bài tập về nhà</h4><section class="card"><div class="row between"><h3>${fmtD(now())}</h3><span class="pill ${n === hw.tasks.length ? "good" : ""}">${n}/${hw.tasks.length}</span></div><p class="sm muted">Khoảng ${m} phút · hạn nộp ${hhmm(hw.due)} · làm theo thứ tự từ trên xuống</p>${hw.tasks.map(x => taskRow(x, hw, d)).join("")}</section>`; }
    else h += `<section class="card"><p class="tsay">Hôm nay không có bài tập về nhà. Muốn học thêm, bạn có thể ôn thẻ hoặc chơi trò chơi gợi nhớ.</p><div class="row2"><button class="btn" onclick="nav('review')"><i class="ti ti-cards"></i> Ôn tập</button><button class="btn" onclick="nav('play')"><i class="ti ti-device-gamepad-2"></i> Trò chơi</button></div></section>`;
    const last = t.rep[t.rep.length - 1];
    if (last && dayDiff(now(), addD(pk(last.wk), 7)) < 3) h += `<h4 class="sec">Phiếu liên lạc mới</h4><button class="card tcard tlink" onclick="TEACHER.open('rep')"><span class="tav"><i class="ti ti-report"></i></span><span class="grow"><b>Tuần ${dm(pk(last.wk))} – ${dm(addD(pk(last.wk), 6))}</b><small class="muted">${last.rate.map(x => x[0] + ": " + x[1]).join(" · ")}</small></span><i class="ti ti-chevron-right muted"></i></button>`;
    return h;
  }
  function weekHtml() {
    const t = T(), wk = week(), ws = pk(wk.id), td = today();
    let h = `<section class="card"><div class="row between"><h3>Tuần ${dm(ws)} – ${dm(addD(ws, 6))}</h3><span class="pill">${wk.days.filter(x => x.study).length} buổi × ${S.settings.goal}'</span></div>${wk.note ? `<p class="tsay sm">${esc(wk.note)}</p>` : ""}</section><div class="tweek">`;
    wk.days.forEach(day => { const dt = pk(day.d), past = day.d < td, hw = t.hw[day.d];
      const tasks = hw ? hw.tasks : day.tasks, done = hw ? hw.tasks.filter(x => x.done).length : 0, m = tasks.reduce((a, x) => a + (x.m || taskMin(x)), 0);
      h += `<section class="card tday ${day.d === td ? "now" : ""} ${day.study ? "" : "off"}"><div class="row between"><b>${fmtD(dt)}${day.d === td ? " · hôm nay" : ""}</b>${day.study ? (hw && (past || day.d === td) ? `<span class="pill ${done === tasks.length ? "good" : past ? "bad" : ""}">${done}/${tasks.length}</span>` : past ? `<span class="pill bad">Không học</span>` : `<span class="sm muted">~${m} phút</span>`) : `<span class="sm muted">${isStudy(dt) && past ? "Chưa có lộ trình" : "Nghỉ"}</span>`}</div>`;
      if (day.study) h += `<ul class="tlist">${tasks.map(x => { const l = label(x); return `<li class="${x.done ? "ok" : ""}"><i class="ti ti-${x.done ? "check" : x.k === "skill" ? SKI2[x.sk] : ICON[x.k]}"></i><span>${esc(l.t)}</span><small>${x.m || taskMin(x)}'</small></li>`; }).join("")}</ul>`;
      h += `</section>`; });
    h += `</div><p class="note">Bài mới dự kiến theo tiến độ hiện tại. Mỗi ngày cô giao bài tập theo đúng vị trí bạn đang học, nên có thể khác lịch một chút.</p>`;
    h += `<h4 class="sec">Lịch học</h4>` + setupHtml(false) + remindHtml();
    return h;
  }
  function testHtml() {
    const t = T(), n0 = sod(now()), lv = lvNow(), ws = t.wt, ms = t.mt;
    const stT = (o) => !o.next ? "" : o.next < n0 ? `<span class="pill bad">Quá hạn ${dayDiff(n0, o.next)} ngày</span>` : o.next === n0 ? `<span class="pill warn">Hôm nay</span>` : `<span class="pill">${fmtS(o.next)}</span>`;
    const hist = (a, f) => a.length ? `<ul class="thist">${a.slice(-6).reverse().map(f).join("")}</ul>` : `<p class="sm muted">Chưa có lần kiểm tra nào.</p>`;
    let h = `<section class="card"><div class="row between"><h3><i class="ti ti-clipboard-check"></i> Kiểm tra tuần</h3>${stT(ws)}</div><p class="tsay sm">Mỗi 7 ngày một bài, khoảng 15 câu trộn từ vựng, ngữ pháp, nghe và viết, lấy từ các bài bạn học trong tuần. Cô mong đạt từ 80%. Kỳ tới: <b>${whenTxt(ws.next)}</b>.</p><button class="btn ${ws.next <= n0 ? "primary" : ""} full" onclick="TEACHER.weekTest()">${ws.next <= n0 ? "Làm bài kiểm tra tuần" : "Làm sớm bài kiểm tra tuần"}</button>${hist(ws.hist, x => `<li><span>${x.miss ? "Hạn " + dm(x.due) : dm(x.at)}</span><b class="${x.miss || x.sc < 80 ? "b" : "g"}">${x.miss ? "Bỏ lỡ" : x.sc + "%"}</b>${!x.miss && sod(x.at) > x.due ? `<small>muộn ${dayDiff(x.at, x.due)} ngày</small>` : "<small></small>"}</li>`)}</section>`;
    h += `<section class="card"><div class="row between"><h3><i class="ti ti-file-certificate"></i> Kiểm tra tháng</h3>${stT(ms)}</div><p class="tsay sm">Mỗi 30 ngày một bài thi thử đủ 5 kỹ năng ở cấp đang học (hiện là <b>${lv}</b>, ${mockMin(lv)} phút), để đo tiến bộ thật sự. Chưa đạt cũng không sao, quan trọng là điểm tăng qua từng tháng. Kỳ tới: <b>${whenTxt(ms.next)}</b>.</p><button class="btn ${ms.next <= n0 ? "primary" : ""} full" onclick="startMock('${lv}')">Thi thử ${lv}</button>${hist(ms.hist, x => `<li><span>${x.miss ? "Hạn " + dm(x.due) : dm(x.at) + " · " + (x.lv || "")}</span><b class="${x.miss ? "b" : x.pass ? "g" : ""}">${x.miss ? "Bỏ lỡ" : x.sc + "%" + (x.pass ? " · Đạt" : "")}</b><small></small></li>`)}</section>`;
    const nl = tNext(), st = nl ? stageOf(LES[nl].stage) : null, g = nl && stageGate(nl);
    if (st) { const sg = g ? stageOf(g) : st, p = stageProgress(sg);
      h += `<section class="card"><div class="row between"><h3><i class="ti ti-certificate"></i> Kiểm tra vượt chặng</h3>${S.stagePassed[sg.id] ? `<span class="pill good">Đã qua</span>` : `<span class="pill">${p}% chặng</span>`}</div><p class="tsay sm">Học xong các bài của một chặng, bạn phải qua bài kiểm tra vượt chặng (từ 80%) mới sang chặng mới. Chặng hiện tại: <b>${sg.name}${sg.name === "Chặng 0" ? "" : " · " + esc(sg.title)}</b>.</p>${g ? `<button class="btn primary full" onclick="startExam('${g}')">Làm bài kiểm tra vượt chặng</button>` : ""}</section>`; }
    return h;
  }
  function repCard(r, partial) {
    const ws = pk(r.wk), sks = Object.keys(SK).filter(k => r.sk[k] && r.sk[k][1]);
    return `<section class="card trep"><div class="row between"><h3>Phiếu liên lạc · ${dm(ws)} – ${dm(addD(ws, 6))}</h3>${partial ? `<span class="pill">Tạm tính</span>` : ""}</div>
    <div class="trate">${r.rate.map(x => `<div><small>${x[0]}</small><b class="r-${x[1] === "Tốt" ? "g" : x[1] === "Khá" ? "k" : x[1] === "–" ? "n" : "b"}">${x[1]}</b></div>`).join("")}</div>
    <div class="stats tst4"><div><b>${r.min}'</b><span>/ ${r.goalMin}' mục tiêu</span></div><div><b>${r.days}/${r.plan}</b><span>buổi học</span></div><div><b>${r.newL}</b><span>bài mới</span></div><div><b>${r.hw === undefined ? "–" : r.hw + "%"}</b><span>bài tập</span></div></div>
    <p class="sm muted">Chuỗi ngày học: <b>${r.streak}</b> · Thẻ đã ôn: <b>${r.cards}</b>${r.wsc !== undefined ? ` · Kiểm tra tuần: <b>${r.wsc}%</b>` : r.wmiss ? " · Kiểm tra tuần: <b>bỏ lỡ</b>" : ""}${r.hwLate ? ` · Nộp muộn: <b>${r.hwLate}</b>` : ""}</p>
    ${sks.length ? `<p class="lab">Độ chính xác theo kỹ năng</p>${sks.map(k => { const p = pc(r.sk[k]); return `<div class="skrow sk-${k}"><i class="ti ti-${SKI[k]}"></i><span class="skn">${SK[k]}</span><div class="bar grow ${p < 70 ? "lowbar" : ""}"><span style="width:${p}%"></span></div><b>${p}%</b></div>`; }).join("")}` : ""}
    ${r.good.length || r.bad.length ? `<div class="tgb">${r.good.length ? `<div><p class="lab g"><i class="ti ti-thumb-up"></i> Điểm mạnh</p><ul>${r.good.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}${r.bad.length ? `<div><p class="lab b"><i class="ti ti-target-arrow"></i> Cần cố gắng</p><ul>${r.bad.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}</div>` : ""}
    <div class="tlp"><p class="lab"><i class="ti ti-writing-sign"></i> Lời phê của cô</p><p class="tsay">${esc(r.cm)}</p><p class="tsig">Cô chủ nhiệm</p></div></section>`;
  }
  function repHtml() {
    const t = T(), cur = report(monday(now()), true), past = t.rep.slice().reverse();
    return repCard(cur, true) + (past.length ? `<h4 class="sec">Các tuần trước</h4>` + past.map((r, i) => i === 0 ? repCard(r) : `<details class="card tpast"><summary><b>Tuần ${dm(pk(r.wk))} – ${dm(addD(pk(r.wk), 6))}</b><small class="muted">${r.min}' · bài tập ${r.hw === undefined ? "–" : r.hw + "%"} · ${r.rate.map(x => x[1]).join(" / ")}</small></summary>${repCard(r).replace(/^<section class="card trep">/, '<section class="trep in">')}</details>`).join("") : `<p class="note">Phiếu liên lạc của tuần sẽ được chốt vào sáng thứ Hai tuần sau.</p>`);
  }
  function page() {
    const t = T();
    let h = `<div class="ptop"><button class="ib" onclick="nav(TAB)" aria-label="Quay lại"><i class="ti ti-arrow-left"></i></button><span class="muted sm">Cô chủ nhiệm</span></div>`;
    if (!t.on) { app().innerHTML = h + `<div class="tpage">` + setupHtml(true) + `</div>`; return; }
    week(); check();
    const tabs = [["today", "Hôm nay"], ["week", "Lịch<span class=\"tlong\"> tuần</span>"], ["test", "Kiểm tra"], ["rep", "Phiếu<span class=\"tlong\"> tuần</span>"]];
    h += `<div class="tpage"><div class="seg ttabs" role="tablist">${tabs.map(x => `<button role="tab" class="${t.tab === x[0] ? "on" : ""}" aria-selected="${t.tab === x[0]}" onclick="TEACHER.open('${x[0]}',1)">${x[1]}</button>`).join("")}</div>`;
    h += ({ today: todayHtml, week: weekHtml, test: testHtml, rep: repHtml })[t.tab]() + `</div>`;
    app().innerHTML = h; schedule();
  }
  function open(tab, keep) {
    const t = T(); if (tab) t.tab = tab; draft = null;
    VIEW = page; P = null; toastOff(); render(); if (!keep) window.scrollTo(0, 0);
  }

  return { homeCard, onFinish, open, practice, weekTest, _dr: dr, _save: saveSetup, _notif: askNotif, _ics: dlICS,
    _: { tsan, genWeek, week, mkHW, hwFor, check, report, finalize, reqs, gate, ics, remText, schedule, notifState, queue, weakOrder, gramQueue, practiceSteps, weekTestSteps, comment, label, stOf, T, monday, kd, pk, addD } };
})();
