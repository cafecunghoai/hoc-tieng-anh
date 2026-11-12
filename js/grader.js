"use strict";
/* ================== Chấm bài viết như giáo viên ==================
   - Chính tả: Hunspell (nspell + từ điển en_US), chấp nhận cả cách viết Anh – Anh
   - Ngữ pháp: bộ luật bắt các lỗi người Việt hay mắc
   - Rubric 4 tiêu chí (0–5): Hoàn thành yêu cầu, Ngữ pháp & chính tả, Từ vựng, Mạch lạc → thang 10 */
const Grader = (() => {
  let SP = null, loading = null;
  const EXTRA = "Vietnam Vietnamese Hanoi Saigon Hue Hoi An Danang Nang Da Lat Dalat Can Tho Mekong Ben Tre Vung Tau Nha Trang Ha Long Sapa Fansipan Giang Ninh Binh Phu Quoc Mui Ne Tet Thi Van Loi Hong Kim Ngoc Bao Thuy Xuan Quoc hotline hotlines audiobook audiobooks pho banh mi chung ao dai dong Nguyen Tran Le Pham Hoang Huynh Phan Vu Vo Dang Bui Do Ho Ngo Duong Ly Lan Mai Hoa Minh Nam Tuan Hung Linh Trang Thao Huong Long Hai Duc Phong Vy Khoa Quan Hanh Thu Tam Chau Ha Huy Kenji Emma Tom Anna IELTS TOEIC CV Cai Rang Ca Mau Kien Quang Thanh Duong Binh Dinh Tay Ninh Hai Phong Bac un mis al ise ize dis inter enquire enquiry enquiries cosy maths café cafe rebook reframe robusta utopian hominem unaffordable unconfident homestay homestays app apps email emails online offline website smartphone laptop TikTok YouTube Facebook Zalo okay OK Wi-Fi wifi internet e-commerce selfie vlog blog durian durians rambutan longan lychee jackfruit mangosteen pho bun cha com xeo tet ao dai Hương".split(" ");
  // từ viết tắt viết hoa hợp lệ (không kiểm tra chính tả)
  const ACRO = new Set("IELTS TOEIC TOEFL SAT GPA CV MBA PhD BA MA BSc MSc NGO UN UNESCO UNICEF WHO ASEAN EU USA US UK UAE TV PC IT AI HR CEO CFO CTO ATM USB GPS SMS DVD CD ID OK FAQ PDF HCMC VND USD NASA FIFA BBC CNN VTV DNA COVID ICU ER PE GDP".split(" "));
  // tên người hay gặp (làm chủ ngữ để kiểm tra chia động từ)
  const NAMES = new Set("Lan Mai Hoa Minh Nam Tuan Hung Linh Trang Thao Huong Duc Phong Vy Khoa Quan Hanh Thu Tam Chau Huy Kenji Emma Tom Anna John Mary Peter David Sarah Jack Lucy Ben Kate".split(" "));
  // chữ cái có dấu tiếng Việt (ngoài Latin-1): ă â đ ê ô ơ ư và các thanh điệu
  const VI_RE = /[ăâđêôơưĩũĂÂĐÊÔƠƯĨŨ\u0300-\u036f\u1EA0-\u1EF9]/;
  const NONASCII = /[^\x00-\x7F]/;
  function loadSpell() {
    if (SP) return Promise.resolve(SP);
    if (loading) return loading;
    loading = new Promise(res => {
      const init = () => { try { SP = window.NSpell(window.SPELL_AFF, window.SPELL_DIC); EXTRA.forEach(w => SP.add(w)); if (typeof ALLW !== "undefined") ALLW.forEach(w => w.en.split(/[\s/]+/).forEach(t => /^[A-Za-z'-]+$/.test(t) && SP.add(t))); } catch (e) { SP = null; } res(SP); };
      if (window.NSpell && window.SPELL_DIC) return init();
      const s = document.createElement("script"); s.src = "js/vendor/spell.js"; s.onload = init; s.onerror = () => res(null); document.head.appendChild(s);
    });
    return loading;
  }

  /* ---------- Dữ liệu cho luật ---------- */
  const W = s => s.split(" ");
  /* ---------- Chia đuôi -ing / -ed đúng chính tả ---------- */
  const DOUBLE2 = W("begin forget prefer admit occur refer permit commit regret upset omit submit control patrol compel expel equip transfer");
  const NODOUBLE = W("visit open listen happen enter offer answer travel cancel label model level total focus benefit target limit market");
  const vg = v => (v.match(/[aeiouy]+/g) || []).length;
  function dbl(v) { // nhân đôi phụ âm cuối? swim → swimm-, begin → beginn-
    if (DOUBLE2.includes(v)) return true;
    if (NODOUBLE.includes(v) || /[wxy]$/.test(v)) return false;
    const q = v.replace(/^qu/, "q");
    return vg(q.replace(/y/g, "")) === 1 && /(^|[^aeiou])[aeiou][b-df-hj-np-tv-z]$/.test(q);
  }
  const ing = v => v === "be" ? "being" : /ie$/.test(v) ? v.slice(0, -2) + "ying" : /[^aeiouy]e$/.test(v) || /[uo]e$/.test(v) && !/oe$/.test(v) ? v.slice(0, -1) + "ing" : dbl(v) ? v + v.slice(-1) + "ing" : v + "ing";
  const ed = v => /e$/.test(v) ? v + "d" : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + "ied" : dbl(v) ? v + v.slice(-1) + "ed" : v + "ed";
  const BASE = W("go do have like love want need work live play study watch eat drink make take get know think say come see look use find give tell feel try leave call help start finish teach speak read write run walk sleep cook buy sell open close travel visit enjoy hate prefer believe remember understand learn hope agree wash miss fly cry carry stay pay wait ask answer change move bring send spend win lose meet sit stand drive ride swim sing dance listen talk decide become begin tend");
  // thêm cho luật thì/to be (không dùng cho luật chia ngôi vì dễ là danh từ: the lesson plan, the bus stop)
  const BASE_X = BASE.concat(W("stop plan shop chat lie die tie forget prefer"));
  const third = v => ({ go: "goes", do: "does", have: "has" })[v] || (/(s|sh|ch|x|z|o)$/.test(v) ? v + "es" : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + "ies" : v + "s");
  const THIRD = {}; BASE.forEach(v => THIRD[third(v)] = v);
  const ING_BASE = {}; BASE.forEach(v => ING_BASE[ing(v)] = v);
  const PAST = { went: "go", did: "do", had: "have", made: "make", took: "take", got: "get", knew: "know", thought: "think", said: "say", came: "come", saw: "see", found: "find", gave: "give", told: "tell", felt: "feel", left: "leave", taught: "teach", spoke: "speak", wrote: "write", ran: "run", slept: "sleep", bought: "buy", sold: "sell", ate: "eat", drank: "drink", understood: "understand", flew: "fly", paid: "pay", brought: "bring", sent: "send", spent: "spend", won: "win", lost: "lose", met: "meet", sat: "sit", stood: "stand", drove: "drive", rode: "ride", swam: "swim", sang: "sing", became: "become", began: "begin", broke: "break", chose: "choose", forgot: "forget", fell: "fall", grew: "grow", threw: "throw", wore: "wear", woke: "wake", stole: "steal" };
  ["liked", "loved", "wanted", "needed", "worked", "lived", "played", "studied", "watched", "cooked", "visited", "enjoyed", "started", "finished", "helped", "called", "walked", "talked", "listened", "travelled", "traveled", "decided", "stayed", "moved", "changed", "tried", "learned", "learnt", "opened", "closed", "waited", "asked", "answered"].forEach(p => { const b = p.replace(/ied$/, "y").replace(/lled$/, "l").replace(/ed$/, "").replace(/(lov|liv|mov|chang|clos|decid|lik)$/, "$1e"); PAST[p] = b === "learnt" ? "learn" : b; });
  const PP = { went: "gone", came: "come", saw: "seen", ate: "eaten", did: "done", wrote: "written", took: "taken", gave: "given", broke: "broken", spoke: "spoken", began: "begun", drank: "drunk", drove: "driven", ran: "run", swam: "swum", knew: "known", flew: "flown", grew: "grown", threw: "thrown", chose: "chosen", forgot: "forgotten", fell: "fallen", rode: "ridden", sang: "sung", stole: "stolen", woke: "woken", wore: "worn", became: "become" };
  const MODALS = W("can could should must will would may might shall 'll can't cannot couldn't won't wouldn't shouldn't mustn't");
  const AUX_BEFORE = W("do does did can could will would should may might must shall to let make help 'll don't doesn't didn't can't won't wouldn't couldn't shouldn't");
  const SING_N = W("mother father brother sister friend teacher boss son daughter wife husband family company city country baby child student doctor manager neighbour neighbor government man woman person girl boy dog cat team school weather grandmother grandfather grandma grandpa uncle aunt cousin mum mom dad parent house phone car life job world town village class shop restaurant hotel market sun river price");
  const PL_IRR = W("people children men women police feet teeth mice cattle staff sheep fish");
  const DET = W("my his her our their the your this that its");
  const ADJ = W("short long big small new old good bad great little young high low large regular simple main real local public social early late whole free full own same certain clear strong different important special usual entire general common recent final major human political economic personal private national natural single daily annual modern only next first second last best other whole entire");
  const PREP = W("in on at of from with near by for to about under over into through between among across behind beside without within during");
  const STATE_V = W("remember know think believe like love hope wish want need prefer understand feel say says mean seem");
  const NOAPOS = { didnt: "didn't", dont: "don't", doesnt: "doesn't", cant: "can't", wont: "won't", isnt: "isn't", arent: "aren't", wasnt: "wasn't", werent: "weren't", havent: "haven't", hasnt: "hasn't", couldnt: "couldn't", shouldnt: "shouldn't", wouldnt: "wouldn't", im: "I'm", ive: "I've", youre: "you're", theyre: "they're", thats: "that's", whats: "what's", lets: "let's" };
  const PAST_MARK = /\b(yesterday|last (night|week|weekend|month|year|summer|winter|sunday|monday|tuesday|wednesday|thursday|friday|saturday|time)|ago|when i was|in (19|200|201)\d)\b/;
  const PRES_MARK = /\b(now|today|usually|always|every|nowadays|currently|these days|at the moment|often|sometimes|never|tomorrow|next|will|going to)\b/;
  const BE_V = W("go agree want need think know live eat come see make take get give buy tell say understand believe enjoy prefer remember learn speak write become decide feel");
  const UNCOUNT = W("advice information furniture news homework luggage baggage equipment knowledge traffic weather money");
  const UNC_PL = { informations: "information", advices: "advice", furnitures: "furniture", homeworks: "homework", luggages: "luggage", knowledges: "knowledge", equipments: "equipment", feedbacks: "feedback", evidences: "evidence", traffics: "traffic", moneys: "money" };
  const IRR_PL = { childs: "children", childrens: "children", mans: "men", womans: "women", womens: "women", mens: "men", foots: "feet", tooths: "teeth", mouses: "mice", sheeps: "sheep", fishs: "fish", gooses: "geese" };
  const COMP = W("better worse bigger cheaper easier faster happier higher larger longer older smaller taller younger hotter colder nicer prettier richer stronger busier");
  const SUP = W("best worst biggest cheapest easiest fastest happiest highest largest longest oldest smallest tallest youngest hottest coldest");
  const COUNT_N = { year: "years", day: "days", month: "months", week: "weeks", hour: "hours", minute: "minutes", book: "books", car: "cars", house: "houses", child: "children", friend: "friends", student: "students", brother: "brothers", sister: "sisters", room: "rooms", country: "countries", city: "cities", time: "times", language: "languages", kilo: "kilos", ticket: "tickets", person: "people" };
  const NUMW = W("two three four five six seven eight nine ten eleven twelve twenty thirty forty fifty hundred several many");
  const VOWEL_EXC = /^(uni|use|usu|euro|eu|one|once|ufo|ewe|uk|us\b|ubiq|uter|utop)/;
  const HSILENT = /^(hour|honest|honou?r|heir)/;
  const CAPS = W("monday tuesday wednesday thursday friday saturday sunday january february march april june july august september october november december english vietnamese vietnam japanese chinese korean french german american british thai hanoi saigon");
  const LINKERS = W("and but so because however although though while when after before then first firstly secondly finally also moreover furthermore besides therefore thus instead meanwhile unless whereas despite since until if or as");
  const LINK2 = ["in addition", "for example", "for instance", "as a result", "on the other hand", "in my opinion", "in conclusion", "to sum up", "even though", "in fact", "in other words", "as well as", "in spite of", "what is more", "that said", "on the whole", "to begin with"];
  const STOP = new Set(W("a an the and or but so because to of in on at for with from by is am are was were be been being have has had do does did i you he she it we they me him her us them my your his its our their this that these those there here not no yes very really just also too can could will would should may might must shall as if then than when while about into over after before up down out off again more most some any many much few little all each every other such own same only so"));

  const CAUS = W("make makes made making let lets letting help helps helped helping see sees saw seen watch watches watched hear hears heard feel feels felt notice noticed have has had");
  const SUBJ_PRON = W("i you he she it we they");
  const PL_DET = W("my his her our their the your these those some many");
  const SG_S = W("news physics mathematics maths economics politics athletics gymnastics series species means gas bus lens chaos christmas tennis this his its us yes plus bonus campus status virus focus crisis basis thesis analysis canvas atlas alias iris census citrus perhaps always");
  const JOB = W("student teacher doctor engineer nurse worker farmer driver singer actor actress manager lawyer pilot cook chef writer artist dentist accountant secretary waiter waitress police officer scientist journalist designer programmer developer businessman housewife tourist pupil");
  const ADJ2 = W("beautiful happy sad tall short big small kind nice friendly busy tired hot cold warm cool good bad young old rich poor fat thin smart clever lazy funny cute pretty handsome hungry thirsty angry interesting boring expensive cheap difficult easy far near important delicious crowded quiet noisy clean dirty strong weak fast slow careful helpful famous popular lucky worried excited bored sick ill fine beautiful lovely wonderful terrible tidy messy shy brave honest polite rude");
  const ING_ADJ = { boring: "bored", interesting: "interested", exciting: "excited", tiring: "tired", confusing: "confused", surprising: "surprised", disappointing: "disappointed", embarrassing: "embarrassed", frightening: "frightened", annoying: "annoyed", amazing: "amazed", worrying: "worried", terrifying: "terrified", relaxing: "relaxed", satisfying: "satisfied", exhausting: "exhausted" };
  const PLACE_N = W("city country town village house home family class school room neighborhood neighbourhood area street hometown province garden office company apartment flat kitchen");
  const NUM_A = W("two three four five six seven eight nine ten eleven twelve twenty thirty forty fifty");
  // quá khứ / quá khứ phân từ của động từ nguyên mẫu (Anh – Mỹ: learned, không dùng learnt)
  const pastOf = v => { for (const k in PAST) if (PAST[k] === v && !/ed$/.test(k) && k !== "learnt") return k; return ed(v); };
  const ppOf = v => { const p = pastOf(v); return PP[p] || p; };
  const INDEF = W("everyone everybody someone somebody nobody anyone anybody");
  const PERSON_N = W("mother father brother sister friend teacher boss son daughter wife husband baby child student doctor manager neighbour neighbor man woman person girl boy grandmother grandfather grandma grandpa uncle aunt cousin mum mom dad parent").concat(JOB);
  const FEM = W("mother sister grandmother grandma wife daughter aunt mom mum girl woman girlfriend lady niece"), MAS = W("father brother grandfather grandpa husband son uncle dad boy man boyfriend nephew");
  const PL_PERS = W("parents grandparents brothers sisters friends children kids people students teachers classmates neighbors neighbours");
  const FEEL_ING = W("boring interesting exciting confusing surprising disappointing embarrassing frightening");
  // want/need/decide… + động từ nguyên mẫu không có to (chỉ những động từ không thể là danh từ đứng sau want/need)
  const TO_V = W("want wants wanted need needs needed decide decides decided hope hopes hoped try tries tried");
  const TO_INF = W("go do make take get find give tell buy meet become learn study travel stay speak write eat watch play swim be have see visit come know sleep");
  const DAYS = W("monday tuesday wednesday thursday friday saturday sunday");
  const COLORS = W("white black red blue green yellow brown pink purple orange grey gray");
  const NOUNY = W("help work change call answer visit play drink swim walk ride cook dance run sleep talk wait stay love hope look use");
  const DUR_V = W("live work study know teach stay learn play use wait");
  const REP_OK = W("that had very really so bye ha haha no bla knock well yeah wow come far more many round again");
  const isAcro = raw => /^[A-Z]{2,}s?$/.test(raw) || ACRO.has(raw);
  const LETTER_AN = /^[AEFHILMNORSX]/; // tên chữ cái đọc bắt đầu bằng nguyên âm: A, E, F (ef), H (eitch), I, L (el), M (em)...
  // dạng số nhiều của danh từ (my parents, the students): bỏ những từ số ít tận cùng -s
  const isPlN = w => w.length > 3 && /s$/.test(w) && !/(ss|us|is|ous|as|ics)$/.test(w) && !SG_S.includes(w) && !STOP.has(w) && !THIRD[w];

  /* ---------- Tách từ ---------- */
  function tokenize(text) {
    const toks = []; const L = "A-Za-zÀ-ÖØ-öø-ɏḀ-ỿ\\u0300-\\u036f"; const re = new RegExp(`\\d+(?:st|nd|rd|th|s)?|[${L}]+(?:[-'’][${L}]+)*`, "g"); let m;
    while ((m = re.exec(text))) toks.push({ s: m.index, e: m.index + m[0].length, raw: m[0], w: m[0].toLowerCase().replace(/’/g, "'") });
    // đánh dấu đầu câu (bỏ qua chữ viết tắt như a.m., Mr., e.g.)
    const ABBR = /^(a|p|m|mr|mrs|ms|dr|st|e|g|i|etc|vs|no|jr|sr)$/;
    const skip = []; let mm; const reS = /\S+@\S+|https?:\/\/\S+|www\.\S+/g; while ((mm = reS.exec(text))) skip.push([mm.index, mm.index + mm[0].length]);
    toks.forEach((t, i) => { const prev = i ? text.slice(toks[i - 1].e, t.s) : text.slice(0, t.s); const pt = prev.replace(/["'”’)\]\s]+$/, "");
      t.gap = prev; t.skip = skip.some(([a, b]) => t.s >= a && t.e <= b);
      t.start = i === 0 || /\n/.test(prev) || (/[.!?]$/.test(pt) && !/\.\.\.$|…$/.test(pt) && !(/^\.$/.test(pt) && ABBR.test(toks[i - 1].w)) && !/[?!,]["”’']\s*$/.test(prev)); });
    return toks;
  }

  /* ---------- Luật ngữ pháp ---------- */
  function rules(text, T, opt) {
    opt = opt || {};
    const out = [], add = (i, j, cat, fix, msg, key) => out.push({ i, j, cat, fix, msg, key: key || cat });
    const CLS = W("and but because so when if while although though since that before after or then");
    const clauseStart = k => !!T[k] && (T[k].start || /[,;:]/.test(T[k].gap) || CLS.includes(T[k - 1] ? T[k - 1].w : ""));
    const w = i => (T[i] ? T[i].w : ""), sameSent = (a, b) => { for (let k = a + 1; k <= b; k++) if (T[k] && T[k].start) return false; return true; };
    // thiếu dấu nháy trong dạng viết tắt: didnt → didn't
    T.forEach(t => { if (NOAPOS[t.w]) { t.fixw = NOAPOS[t.w].toLowerCase(); } });
    for (let i = 0; i < T.length; i++) {
      if (NOAPOS[T[i].w] && !(T[i].w === "lets" && w(i - 1) !== "" && !T[i].start) && !(T[i].w === "wont")) add(i, i + 1, "spell", NOAPOS[T[i].w], "Dạng viết tắt cần dấu nháy (').", "apos");
    }
    const w0 = w; const wv = i => (T[i] ? (T[i].fixw || T[i].w) : "");
    for (let i = 0; i < T.length; i++) {
      const a = wv(i), b = wv(i + 1), c = wv(i + 2), prev = wv(i - 1);
      const ns = T[i + 1] && !T[i + 1].start && !/["“”‘’:;()]|\s'|'\s/.test(T[i + 1].gap);
      if (T[i].skip) continue;
      // i viết thường
      if (T[i].raw === "i") add(i, i + 1, "cap", "I", "Đại từ 'I' (tôi) luôn viết hoa.", "cap-i");
      // đầu câu viết thường
      else if (T[i].start && /^[a-z]/.test(T[i].raw)) add(i, i + 1, "cap", T[i].raw[0].toUpperCase() + T[i].raw.slice(1), "Chữ đầu câu phải viết hoa.", "cap-start");
      else if (CAPS.includes(a) && /^[a-z]/.test(T[i].raw)) add(i, i + 1, "cap", T[i].raw[0].toUpperCase() + T[i].raw.slice(1), "Tên thứ, tháng, ngôn ngữ, quốc gia phải viết hoa.", "cap-name");
      if (!ns && i + 1 < T.length) continue;
      // hòa hợp chủ – vị
      const nounSg0 = (SING_N.includes(a) || (a.length > 2 && !/s$/.test(a) && !STOP.has(a) && !PL_IRR.includes(a) && !BASE.includes(a) && !COMP.includes(a) && !ADJ.includes(a) && !/(ly|ing|ed|est|er|ful|ous|ive|al|ic|ble)$/.test(a))) && DET.includes(prev) && !PREP.includes(w(i - 2)) && b !== "like";
      // my best friend / my little sister: cho phép một tính từ giữa từ hạn định và danh từ
      const nounSgA = SING_N.includes(a) && ADJ.includes(prev) && DET.includes(w(i - 2)) && !PREP.includes(w(i - 3)) && b !== "like";
      // tên riêng làm chủ ngữ: Lan like → likes
      const nameSg = NAMES.has(T[i].raw);
      // từ đứng ngay trước cụm chủ ngữ (trước từ hạn định nếu có)
      const before = nounSgA ? w(i - 3) : nounSg0 ? w(i - 2) : prev;
      // chủ ngữ ghép (my mother and my father go), tân ngữ của động từ sai khiến/tri giác (made my sister cry, let Lan go)
      // "and" nối hai chủ ngữ (my mother and my father go) — không phải "and" nối hai mệnh đề (…today and it make me tired)
      const bw = nounSgA ? w(i - 4) : nounSg0 ? w(i - 3) : w(i - 2), bIdx = nounSgA ? i - 3 : nounSg0 ? i - 2 : i - 1;
      const subjLike = x => SUBJ_PRON.concat(["me", "him", "her", "us", "them"]).includes(x) || SING_N.includes(x) || PERSON_N.includes(x) || isPlN(x) || PL_IRR.includes(x);
      const compound = ["and", "or", "nor", "&"].includes(before) && (!["he", "she", "it"].includes(a) || nounSg0 || nounSgA || subjLike(bw) || NAMES.has(T[bIdx - 1] ? T[bIdx - 1].raw : "")) && !(T[bIdx] && /,/.test(T[bIdx].gap) && ["he", "she", "it"].includes(a));
      const causObj = CAUS.includes(before);
      const nounSg = (nounSg0 || nounSgA || nameSg) && !compound && !causObj;
      const sentTxt = (() => { let s0 = i; while (s0 > 0 && !T[s0].start) s0--; let e0 = i + 1; while (e0 < T.length && !T[e0].start) e0++; return T.slice(s0, e0).map(t => t.w).join(" "); })();
      const subjunctive = prev === "that" && /\b(insist|suggest|recommend|demand|essential|important|vital|propose|request|require|crucial)/.test(sentTxt);
      const subj3 = ((["he", "she", "it"].includes(a) && !compound && !CAUS.includes(prev)) || nounSg) && !subjunctive;
      if (subj3 && !AUX_BEFORE.includes(prev) && !(nounSg && AUX_BEFORE.includes(before))) {
        if (BASE.includes(b) && !["do", "have"].includes(b)) add(i + 1, i + 2, "grammar", third(b), `Chủ ngữ ngôi thứ ba số ít (${T[i].raw}) → động từ thêm -s/-es: ${third(b)}.`, "sva");
        if (b === "have") add(i + 1, i + 2, "grammar", "has", `Với ${T[i].raw} dùng has, không dùng have.`, "sva");
        if (b === "don't") add(i + 1, i + 2, "grammar", "doesn't", `Với ${T[i].raw} dùng doesn't.`, "sva");
        if (b === "are" || b === "am") add(i + 1, i + 2, "grammar", "is", `Với ${T[i].raw} dùng is.`, "be");
        if (b === "were" && ![w(i - 1), w(i - 2), w(i - 3)].some(x => ["if", "wish", "as", "only"].includes(x))) add(i + 1, i + 2, "grammar", "was", `Với ${T[i].raw} ở quá khứ dùng was.`, "be");
      }
      if (["i", "you", "we", "they", "people"].includes(a) && !AUX_BEFORE.includes(prev)) {
        if (THIRD[b] && b !== "is") add(i + 1, i + 2, "grammar", THIRD[b], `Với ${T[i].raw} động từ không thêm -s: ${THIRD[b]}.`, "sva");
        if (b === "doesn't") add(i + 1, i + 2, "grammar", "don't", `Với ${T[i].raw} dùng don't.`, "sva");
        if (b === "is") add(i + 1, i + 2, "grammar", a === "i" ? "am" : "are", `Với ${T[i].raw} dùng ${a === "i" ? "am" : "are"}.`, "be");
        if (b === "was" && a !== "i") add(i + 1, i + 2, "grammar", "were", `Với ${T[i].raw} ở quá khứ dùng were.`, "be");
        if (a === "i" && b === "are") add(i + 1, i + 2, "grammar", "am", "Với I dùng am.", "be");
      }
      // chủ ngữ số nhiều: my parents works, my friends is, he and she goes
      const plSubj = !T[i].skip && !(/^[A-Z]/.test(T[i].raw) && !T[i].start) && ((isPlN(a) && (PL_DET.includes(prev) && clauseStart(i - 1) || ADJ.includes(prev) && PL_DET.includes(w(i - 2)) && clauseStart(i - 2)))
        || (["he", "she", "i", "you", "we", "they"].includes(a) && ["and"].includes(prev) && ["he", "she", "i", "you", "we", "they", "me", "him", "her"].includes(w(i - 2)) && (!T[i - 2] || T[i - 2].start || !/^(between|with|and|for|to|of)$/.test(w(i - 3)))));
      if (plSubj && !AUX_BEFORE.includes(w(i - 2))) {
        const pf = { is: "are", was: "were", has: "have", "doesn't": "don't" }[b] || (THIRD[b] && !["is", "has", "does"].includes(b) ? THIRD[b] : "");
        if (pf) add(i + 1, i + 2, "grammar", pf, `Chủ ngữ số nhiều (${T[i].raw}${["and"].includes(prev) ? " – hai người" : ""}) → dùng ${pf}.`, /^(are|were)$/.test(pf) ? "be" : "sva");
      }
      // danh từ không đếm được đi với động từ số nhiều: the news are
      if (["news", "information", "advice", "furniture", "homework", "luggage", "equipment", "knowledge", "traffic", "money", "physics", "mathematics", "economics"].includes(a) && (DET.includes(prev) || T[i].start) && { are: 1, were: 1 }[b]) add(i + 1, i + 2, "grammar", b === "are" ? "is" : "was", `'${T[i].raw}' là danh từ không đếm được → dùng ${b === "are" ? "is" : "was"}.`, "uncount");
      // everyone/everybody/no one… + động từ số ít: Everybody like → likes (Does everyone have…? thì không gạch)
      const indef = INDEF.includes(a) || (a === "one" && prev === "no");
      if (indef && !AUX_BEFORE.includes(a === "one" ? w(i - 2) : prev) && !CAUS.includes(a === "one" ? w(i - 2) : prev)) {
        const f = { are: "is", were: "was", have: "has", "don't": "doesn't" }[b] || (BASE.includes(b) && b !== "do" ? third(b) : "");
        if (f) add(i + 1, i + 2, "grammar", f, `${a === "one" ? "No one" : T[i].raw[0].toUpperCase() + T[i].raw.slice(1)} đi với động từ số ít: ${f}.`, /^(is|was)$/.test(f) ? "be" : "sva");
      }
      // every/each + danh từ số ít + động từ: Every student like → likes
      if (["every", "each"].includes(a) && (SING_N.includes(b) || JOB.includes(b)) && T[i + 2] && sameSent(i, i + 2) && !/[,;:]/.test(T[i + 2].gap) && !AUX_BEFORE.includes(prev) && !CAUS.includes(prev)) {
        const f = { are: "is", were: "was", have: "has", "don't": "doesn't" }[c] || (BASE.includes(c) && c !== "do" ? third(c) : "");
        if (f) add(i + 2, i + 3, "grammar", f, `Sau ${a} + danh từ số ít, động từ chia số ít: ${f}.`, /^(is|was)$/.test(f) ? "be" : "sva");
      }
      // each of / one of + danh từ số nhiều + động từ số ít: Each of the students have → has
      if (["each", "one"].includes(a) && b === "of" && (clauseStart(i) || ["think", "know", "believe", "say", "said", "guess", "hope"].includes(prev)) && !["no", "the", "which", "any", "every", "this", "that"].includes(prev)) {
        let k = i + 2;
        if (!["us", "them", "you"].includes(w(k))) { if (PL_DET.includes(w(k))) k++; if (ADJ.includes(w(k)) && w(k + 1)) k++; if (!(isPlN(w(k)) || PL_IRR.includes(w(k)))) k = -1; }
        if (k > 0 && T[k + 1] && sameSent(i, k + 1) && !/[,;:]/.test(T.slice(i + 1, k + 2).map(t => t.gap).join(""))) {
          const v = w(k + 1), f = { have: "has", are: "is", were: "was", "don't": "doesn't" }[v] || (BASE.includes(v) && v !== "do" ? third(v) : "");
          if (f) add(k + 1, k + 2, "grammar", f, `Chủ ngữ là '${T[i].raw.toLowerCase()} of ...' (một người/vật) → động từ số ít: ${f}.`, /^(is|was)$/.test(f) ? "be" : "sva");
        }
      }
      if (a === "people" && ["is", "was", "has"].includes(b)) add(i + 1, i + 2, "grammar", { is: "are", was: "were", has: "have" }[b], "People là số nhiều.", "sva");
      // to be + động từ nguyên mẫu
      if (["am", "is", "are", "was", "were", "'m", "'s", "'re"].includes(a) || /'(m|re)$/.test(a)) {
        if (b === "agree") add(i, i + 2, "grammar", (prev || "I") === "i" ? "agree" : "agree", "Agree là động từ: nói 'I agree', không nói 'I am agree'.", "be-v");
        else if ((BE_V.includes(b) || ["run", "lie", "sit", "swim", "stop", "play", "work", "study", "watch", "cook", "sleep", "write", "wait", "travel", "teach", "drive", "walk"].includes(b) && (SUBJ_PRON.includes(prev) || NAMES.has(T[i - 1] ? T[i - 1].raw : "") || PERSON_N.includes(prev) && (DET.includes(w(i - 2)) || ADJ.includes(w(i - 2)) && DET.includes(w(i - 3))))) && !(T[i + 1] && /^[A-Z]/.test(T[i + 1].raw))) {
          const s3 = ["he", "she", "it"].includes(prev) || SING_N.includes(prev) || NAMES.has(T[i - 1] ? T[i - 1].raw : "");
          if (["dream", "goal", "plan", "aim", "wish", "job", "ambition", "idea", "purpose", "hope", "task", "mission"].includes(prev)) add(i, i + 2, "grammar", `${T[i].raw} to ${b}`, `Sau '${T[i - 1].raw} ${T[i].raw}' dùng to + động từ: ${T[i].raw} to ${b}.`, "be-v");
          else add(i, i + 2, "grammar", `${T[i].raw} ${ing(b)} / ${s3 || PERSON_N.includes(prev) && prev !== "people" ? third(b) : b}${JOB.includes(b) ? ` / ${T[i].raw} a ${b}` : ""}`, "Sau to be không dùng động từ nguyên mẫu. Dùng to be + V-ing (đang làm) hoặc bỏ to be.", "be-v");
        }
        // thiếu mạo từ trước nghề nghiệp: I am student → a student
        if (JOB.includes(b) && !["are", "were", "'re"].includes(a) && (!T[i + 2] || T[i + 2].start || /^[.,!?;]/.test(T[i + 2].gap.trim()) || ["at", "in", "of", "from", "and"].includes(c)) && T[i + 1] && !/^[A-Z]/.test(T[i + 1].raw) && !/['-]/.test(T[i + 1].raw))
          add(i + 1, i + 2, "grammar", (/^[aeiou]/.test(b) ? "an " : "a ") + b, `Trước danh từ số ít chỉ nghề nghiệp cần a/an: ${T[i].raw} ${/^[aeiou]/.test(b) ? "an" : "a"} ${b}.`, "article");
        // I am interesting in → interested in
        if (["interesting", "boring", "exciting"].includes(b) && c === "in" && SUBJ_PRON.concat(["people"]).includes(prev)) add(i + 1, i + 2, "grammar", ING_ADJ[b], `Nói về cảm xúc của người dùng tính từ -ed: ${ING_ADJ[b]} in.`, "ing-ed");
      }
      // feel + (very) boring → bored
      if (/^(feel|feels|felt|feeling|get|gets|got|getting)$/.test(a) && (SUBJ_PRON.filter(x => x !== "it").includes(prev) || ["people", "students", "everyone"].includes(prev) || /^(am|is|are|was|were|'m)$/.test(prev) && SUBJ_PRON.includes(w(i - 2)))) { const k = /^(very|so|really|quite|too|a bit|extremely)$/.test(b) ? i + 2 : i + 1; const v = w(k);
        if (ING_ADJ[v] && sameSent(i, k)) add(k, k + 1, "grammar", ING_ADJ[v], `Nói về cảm xúc của mình dùng tính từ -ed: ${a} ${ING_ADJ[v]} (không phải ${v}).`, "ing-ed"); }
      // thiếu to be: She very beautiful → She is very beautiful
      if ((SUBJ_PRON.includes(a) && clauseStart(i) || (SING_N.includes(a) && DET.includes(prev) && clauseStart(i - 1))) && ["very", "so", "really", "quite", "too"].includes(b) && (ADJ2.includes(c) || ADJ.includes(c)) && sameSent(i, i + 2) && !/[,;:]/.test(T[i + 1].gap)) {
        const be = a === "i" ? "am" : ["you", "we", "they"].includes(a) ? "are" : "is";
        add(i + 1, i + 2, "grammar", `${be} ${T[i + 1].raw}`, `Câu thiếu động từ to be trước tính từ: ${T[i].raw} ${be} ${T[i + 1].raw} ${T[i + 2].raw}.`, "missing-be");
      }
      // thiếu chủ ngữ: Is very hot today → It is very hot
      if (T[i].start && /^(is|was)$/.test(a) && (["very", "so", "too", "really", "quite"].includes(b) && (ADJ2.includes(c) || ADJ.includes(c)) || ["raining", "sunny", "cloudy", "windy", "snowing"].includes(b)))
        add(i, i + 1, "grammar", "It " + a, `Câu tiếng Anh cần chủ ngữ. Nói về thời tiết, thời gian, khoảng cách dùng It: It ${a} ${b}...`, "missing-subject");
      // lặp chủ ngữ bằng đại từ: My mother she is → My mother is
      if (["he", "she", "they"].includes(b) && T[i + 1] && !/[,;:—–(-]/.test(T[i + 1].gap) && T[i + 2] && sameSent(i, i + 2)) {
        let ok = NAMES.has(T[i].raw) && T[i].start && b !== "they";
        const g = FEM.includes(a) ? "she" : MAS.includes(a) ? "he" : PL_PERS.includes(a) ? "they" : "";
        if (!ok && g === b) { let d = i - 1; if (ADJ.includes(w(d)) || ["older", "younger", "elder"].includes(w(d))) d--; ok = ["my", "his", "her", "our", "their", "your"].includes(w(d)) && T[d].start; }
        if (ok && (/^(is|was|are|were|has|have|had|does|doesn't|don't|didn't)$/.test(c) || MODALS.includes(c) || THIRD[c] || PAST[c] || (b === "they" && BASE.includes(c))))
          add(i + 1, i + 2, "grammar", "", `Đã có chủ ngữ '${T.slice(T[i].start ? i : i - 1, i + 1).map(t => t.raw).join(" ")}' thì bỏ đại từ '${T[i + 1].raw}' (tiếng Anh không lặp chủ ngữ).`, "double-subj");
      }
      // I am boring (= tôi chán) → I am bored: nói về cảm xúc của mình dùng tính từ -ed
      { let k = -1;
        if ((a === "i" && /^(am|was)$/.test(b) || a === "we" && /^(are|were)$/.test(b)) && clauseStart(i)) k = i + 2; else if (/^(i'm|we're)$/.test(a) && clauseStart(i)) k = i + 1;
        if (k > 0 && /^(very|so|really|quite|too|extremely)$/.test(w(k))) k++;
        if (k > 0 && FEEL_ING.includes(w(k)) && sameSent(i, k) && !(w(k) !== "boring" && w(k + 1) === "in" && k === i + 2) && !(T[k + 1] && !/[,.;:!?]/.test(T[k + 1].gap) && /^(you|him|her|them|us|me|everyone|everybody|people|my|your|his|their|our|the|a|an|this|that)$/.test(w(k + 1))))
          add(k, k + 1, "grammar", ING_ADJ[w(k)], `Nói về cảm xúc của mình dùng tính từ -ed: ${T.slice(i, k).map(t => t.raw).join(" ")} ${ING_ADJ[w(k)]}. '${T[k].raw}' nghĩa là gây ra cảm giác đó cho người khác (ví dụ: I am boring = tôi là người nhàm chán).`, "ing-ed"); }
      // hiện tại (tiếp diễn) + since + mốc thời gian → hiện tại hoàn thành: I am living here since 2018
      if (a === "since" && prev !== "ever" && (/^(19|20)\d\d$/.test(b) || ["last", "yesterday", "childhood", "birth", "then", "january", "february", "march", "april", "june", "july", "august", "september", "october", "november", "december"].includes(b) || b === "i" && /^(was|were)$/.test(c) || ["my", "our"].includes(b) && ["childhood"].includes(c))) {
        let s0 = i; while (s0 > 0 && !T[s0].start) s0--;
        const pre = T.slice(s0, i).map(t => t.fixw || t.w);
        if (!pre.some(x => /^(have|has|had|haven't|hasn't|hadn't|was|were|did|didn't|will|would|it's|it)$/.test(x) || /'ve$|'d$/.test(x))) {
          for (let k = s0; k < i - 1; k++) {
            const x = wv(k), y = wv(k + 1);
            if (/^(am|is|are|'m|'re)$/.test(x) || /^(i'm|you're|we're|they're|he's|she's)$/.test(x)) { const bs = ING_BASE[y] || (DUR_V.find(v => ing(v) === y));
              if (bs) { const h = /^(is|he's|she's)$/.test(x) || x === "'s" ? "has" : "have", pre2 = /'/.test(x) ? x.split("'")[0] + " " : "";
                add(/'/.test(x) ? k : k, k + 2, "grammar", `${pre2 && pre2[0] === "i" ? "I " : pre2}${h} been ${y} / ${pre2 && pre2[0] === "i" ? "I " : pre2}${h} ${ppOf(bs)}`, `Việc bắt đầu trong quá khứ và kéo dài đến nay (since + mốc thời gian) → dùng hiện tại hoàn thành: ${h} ${ppOf(bs)} / ${h} been ${y}.`, "perfect"); break; } }
            const subjK = SUBJ_PRON.includes(x) && x !== "it" || NAMES.has(T[k].raw) || (PERSON_N.includes(x) || PL_PERS.includes(x)) && DET.includes(wv(k - 1));
            const bs = DUR_V.includes(y) ? y : (THIRD[y] && DUR_V.includes(THIRD[y]) ? THIRD[y] : "");
            if (subjK && bs && !AUX_BEFORE.includes(wv(k - 1)) && !/[,;:]/.test(T[k + 1].gap)) { const h = THIRD[y] ? "has" : "have";
              add(k + 1, k + 2, "grammar", `${h} ${ppOf(bs)} / ${h} been ${ing(bs)}`, `Việc bắt đầu trong quá khứ và kéo dài đến nay (since + mốc thời gian) → dùng hiện tại hoàn thành: ${h} ${ppOf(bs)}.`, "perfect"); break; }
          }
        }
      }
      // There have many people → There are
      if (a === "there" && (b === "have" || b === "has") && !/^(been|to|got|gotten|never|always|already|just|recently|ever|not|n't)$/.test(c) && T[i + 2] && sameSent(i, i + 2) && (clauseStart(i) || PLACE_N.includes(prev) && (() => { let s0 = i; while (s0 > 0 && !T[s0].start) s0--; return PREP.includes(w(s0)) && i - s0 <= 4; })())) {
        const be = b === "has" || ["a", "an", "one"].includes(c) ? "is" : "are", cap = /^T/.test(T[i].raw) ? "There" : "there";
        add(i, i + 2, "grammar", `${cap} ${be}`, `Nói "ở đâu có cái gì" dùng there is/there are, không dùng there have/has: ${cap} ${be} ${T[i + 2].raw}...`, "there");
      }
      // want go → want to go
      if ((TO_V.includes(a) || a === "like" && /^(would|'d|i'd|we'd|you'd|he'd|she'd|they'd)$/.test(prev)) && TO_INF.includes(b) && !(T[i + 1] && /^[A-Z]/.test(T[i + 1].raw)) && !(a.startsWith("tr") && ["have", "be"].includes(b)))
        add(i, i + 2, "grammar", `${T[i].raw} to ${T[i + 1].raw}`, `Sau '${T[i].raw}' dùng to + động từ nguyên mẫu: ${T[i].raw} to ${T[i + 1].raw}.`, "to-inf");
      // should of → should have; should've call → should've called
      if (/^(should|could|would|must|might)$/.test(a) && b === "of" && (BASE_X.includes(c) || PAST[c] || PP[c] || Object.values(PP).includes(c) || c === "been" || /ed$/.test(c)))
        add(i, i + 2, "grammar", `${T[i].raw} have`, `Viết là '${T[i].raw} have' (hoặc ${a}'ve), không viết '${a} of' (đọc nhanh nghe giống nhau).`, "modal-have");
      if ((/^(should|could|would|must|might)'ve$/.test(a) || a === "have" && /^(should|could|would|must|might|shouldn't|couldn't|wouldn't|mustn't|might not|not)$/.test(prev) && (prev !== "not" || /^(should|could|would|must|might)$/.test(w(i - 2)))) && BASE.includes(b) && ppOf(b) !== b && b !== "have" && T[i + 1] && !/^[A-Z]/.test(T[i + 1].raw))
        add(i + 1, i + 2, "grammar", ppOf(b), `Sau ${a.endsWith("'ve") ? T[i].raw : prev + " have"} dùng quá khứ phân từ (V3): ${ppOf(b)}.`, "pp");
      // đại từ tân ngữ làm chủ ngữ: Him is → He is
      if (T[i].start && ["him", "them", "her"].includes(a) && (/^(is|was|are|were|has|have|does|doesn't|don't)$/.test(b) || THIRD[b] && a !== "them")) add(i, i + 1, "grammar", { him: "He", them: "They", her: "She" }[a], `Chủ ngữ dùng đại từ ${{ him: "He", them: "They", her: "She" }[a]}, không dùng ${T[i].raw}.`, "pronoun");
      // modal + s: cans speak → can speak
      if (/^(cans|musts|shoulds|wills|coulds|mays|mights)$/.test(a) && BASE.includes(b)) add(i, i + 1, "grammar", a.slice(0, -1), `Động từ khuyết thiếu không thêm -s: ${a.slice(0, -1)}.`, "modal");
      // going to / want to + V-s: is going to buys → buy
      if (a === "to" && /^(going|want|wants|wanted|need|needs|needed|have|has|had|try|tried|like|would|used|able|decided|plan|planned|hope|hoped|started|began)$/.test(prev) && THIRD[b] && !["is", "has", "does", "news"].includes(b) && !NOUNY.includes(THIRD[b])) add(i + 1, i + 2, "grammar", THIRD[b], `Sau to dùng động từ nguyên mẫu: to ${THIRD[b]}.`, "to-inf");
      // Please to sit → Please sit
      if (a === "please" && b === "to" && BASE.includes(c)) add(i + 1, i + 2, "grammar", "", "Sau please dùng động từ nguyên mẫu, không có to: Please sit down.", "to-inf");
      // that we to start → that we start
      if (a === "that" && SUBJ_PRON.includes(b) && c === "to" && BASE.includes(w(i + 3))) add(i + 2, i + 3, "grammar", "", `Sau '${b}' cần động từ chia, không dùng to: that ${b} ${w(i + 3)}.`, "to-inf");
      // I use to go → I used to go (trừ did/didn't use to)
      if (a === "use" && b === "to" && BASE.includes(c) && (SUBJ_PRON.includes(prev) && clauseStart(i - 1) || NAMES.has(T[i - 1] ? T[i - 1].raw : "")) && !/^(that|which|who|where|did|didn't|do|does|don't|doesn't|to)$/.test(w(i - 2))) add(i, i + 1, "grammar", "used", "Thói quen trong quá khứ: used to + V (I used to go...).", "used-to");
      // be/get used to + V → V-ing
      if (a === "used" && b === "to" && /^(am|is|are|was|were|be|been|being|get|gets|got|getting|'m|'re|not)$/.test(prev) && (prev !== "not" || /^(am|is|are|was|were|'m|'re|i'm|you're|we're|they're|he's|she's)$/.test(w(i - 2))) && BASE.includes(c) && !/^(it|that|this|the)$/.test(w(i + 3)) || a === "used" && b === "to" && /^(i'm|you're|we're|they're|he's|she's)$/.test(prev) && BASE.includes(c))
        add(i + 2, i + 3, "grammar", ing(c), `Be used to (đã quen với) + V-ing: used to ${ing(c)}.`, "ving");
      // Having finish → Having finished
      if (a === "having" && (T[i].start || /,/.test(T[i].gap)) && BASE.includes(b) && !NOUNY.includes(b) && ppOf(b) !== b) add(i + 1, i + 2, "grammar", ppOf(b), `Having + quá khứ phân từ (V3): having ${ppOf(b)}.`, "pp");
      // have been knowing → have known (động từ trạng thái không chia tiếp diễn)
      if (a === "been" && /^(knowing|believing|understanding|owning|belonging)$/.test(b)) { const bs = b.replace(/ing$/, "").replace(/^believ$/, "believe"); add(i, i + 2, "grammar", ppOf(bs === "own" ? "own" : bs), `'${bs}' là động từ chỉ trạng thái, không dùng tiếp diễn: have ${ppOf(bs)}.`, "stative"); }
      // in Monday → on Monday
      if (a === "in" && DAYS.includes(b)) add(i, i + 1, "grammar", "on", `Trước thứ trong tuần dùng on: on ${T[i + 1].raw}.`, "prep");
      // despite / because of + mệnh đề → although / because
      if ((a === "despite" || a === "of" && prev === "because") && T[i + 2] && (SUBJ_PRON.includes(b) || b === "there") && (/^(is|was|are|were|am|has|have|had|can|could|will|would|did|didn't|doesn't|don't)$/.test(c) || THIRD[c] || PAST[c]) && sameSent(i, i + 2)) {
        if (a === "despite") add(i, i + 1, "grammar", "although", "Despite + danh từ / V-ing. Trước một mệnh đề (chủ ngữ + động từ) dùng although: although it was raining.", "despite");
        else add(i - 1, i + 1, "grammar", "because", "Because of + danh từ. Trước một mệnh đề (chủ ngữ + động từ) dùng because: because it was raining.", "because-of");
      }
      // so a beautiful day → such a beautiful day
      if (a === "so" && ["a", "an"].includes(b) && (ADJ2.includes(c) || ADJ.includes(c)) && T[i + 3] && !/[,.;!?]/.test(T[i + 3].gap)) add(i, i + 1, "grammar", "such", `Trước a/an + tính từ + danh từ dùng such: such ${b} ${c} ...`, "such");
      // the man which → who
      if (a === "which" && PERSON_N.includes(prev) && DET.concat(["a", "an"]).includes(w(i - 2)) && T[i].gap.trim() === "") add(i, i + 1, "grammar", "who", `Đại từ quan hệ cho người dùng who (hoặc that), không dùng which.`, "relative");
      // Never I have heard → Never have I heard
      if (T[i].start && /^(never|seldom|rarely)$/.test(a) && SUBJ_PRON.includes(b) && /^(have|has|had|can|will|did|do|does)$/.test(c) && T[i + 3]) add(i + 1, i + 3, "grammar", `${c} ${T[i + 1].raw}`, `Đầu câu là ${T[i].raw} thì đảo trợ động từ lên trước chủ ngữ: ${T[i].raw} ${c} ${T[i + 1].raw} ...`, "inversion");
      // If I would have → If I had
      if (a === "if" && ["i", "he", "she", "we", "they", "it"].includes(b) && c === "would" && /^(have|be|know|go|get|can|see|win|live)$/.test(w(i + 3))) add(i + 2, i + 3, "grammar", "", "Mệnh đề if không dùng would: If I had..., I would...", "if-will");
      // I wish I have → had
      if (/^(wish|wishes|wished)$/.test(a) && SUBJ_PRON.includes(b) && /^(have|has|am|is|are|can|will)$/.test(c)) add(i + 2, i + 3, "grammar", { have: "had", has: "had", am: "were", is: "were", are: "were", can: "could", will: "would" }[c], `Sau wish (ước điều không có thật) lùi thì: ${b} ${{ have: "had", has: "had", am: "were", is: "were", are: "were", can: "could", will: "would" }[c]}.`, "wish");
      // a cat white → a white cat
      if (["a", "an"].includes(a) && T[i + 2] && COLORS.includes(c) && (SING_N.includes(b) || /^(cat|dog|car|bike|shirt|dress|hat|bag|house|flower|bird|horse|pen|table|chair|motorbike|phone)$/.test(b)) && sameSent(i, i + 2) && (!T[i + 3] || T[i + 3].start || /[.,!?;]/.test(T[i + 3].gap) || /^(and|but)$/.test(w(i + 3)))) add(i + 1, i + 3, "word", `${c} ${b}`, `Tính từ đứng trước danh từ: a ${c} ${b}.`, "word-order");
      // modal
      if (MODALS.includes(a) || a.endsWith("'ll")) {
        if (b === "to" && BASE.includes(c)) add(i + 1, i + 2, "grammar", "", `Sau ${T[i].raw} không dùng 'to'.`, "modal");
        else if ((THIRD[b] && b !== "is" && b !== "has" || PAST[b] && b !== "had") || ING_BASE[b]) add(i + 1, i + 2, "grammar", THIRD[b] || PAST[b] || ING_BASE[b], `Sau ${T[i].raw} dùng động từ nguyên mẫu: ${THIRD[b] || PAST[b] || ING_BASE[b]}.`, "modal");
      }
      // did/does/do not + quá khứ hoặc -s
      if (["didn't", "doesn't", "don't", "did", "does"].includes(a) || (["did", "does", "do"].includes(a) && b === "not")) {
        const k = b === "not" ? i + 2 : i + 1, v = w(k);
        if (PAST[v] && !["did", "had"].includes(v)) add(k, k + 1, "grammar", PAST[v], `Sau ${a}${b === "not" ? " not" : ""} dùng động từ nguyên mẫu: ${PAST[v]}.`, "did");
        else if (THIRD[v] && !["does", "has", "is"].includes(v) && ["didn't", "doesn't", "don't"].includes(a)) add(k, k + 1, "grammar", THIRD[v], `Sau ${a} dùng động từ nguyên mẫu: ${THIRD[v]}.`, "did");
      }
      // câu hỏi: Did you went / Does she likes / What did you bought
      if (["did", "does", "do", "didn't", "doesn't", "don't"].includes(a)) {
        const k = SUBJ_PRON.includes(b) || NAMES.has(T[i + 1] ? T[i + 1].raw : "") ? i + 2 : (DET.includes(b) && w(i + 2) && !STOP.has(w(i + 2)) ? i + 3 : -1), v = w(k);
        if (k > 0 && sameSent(i, k) && !/[,;:]/.test(T.slice(i + 1, k + 1).map(t => t.gap).join(""))) {
          if (PAST[v] && v !== "did" && !(v === "had" && a !== "did")) add(k, k + 1, "grammar", PAST[v], `Câu hỏi với ${T[i].raw}: động từ chính ở nguyên mẫu: ${PAST[v]}.`, "did");
          else if (THIRD[v] && !["is", "does"].includes(v) && (["does", "doesn't", "did", "didn't"].includes(a) || v !== "has")) add(k, k + 1, "grammar", THIRD[v], `Câu hỏi với ${T[i].raw}: động từ chính ở nguyên mẫu: ${THIRD[v]}.`, "did");
        }
      }
      // In my city have many parks → there are
      if (T[i].start && a === "in" && DET.includes(b) && PLACE_N.includes(c) && ["have", "has"].includes(w(i + 3)) && sameSent(i, i + 3)) add(i + 3, i + 4, "grammar", "there are / there is", `Không dùng have/has để nói "ở đâu có gì". Dùng There is/There are: ${T[i].raw} ${b} ${c}, there are ...`, "there");
      // I like very much football → I like football very much
      if (["like", "likes", "liked", "love", "loves", "loved", "enjoy", "enjoys", "enjoyed"].includes(a) && b === "very" && c === "much" && T[i + 3] && sameSent(i, i + 3) && !/[,.;!?]/.test(T[i + 3].gap)) add(i + 1, i + 3, "word", "", `Trật tự từ: "very much" đứng sau tân ngữ: ${T[i].raw} ${T[i + 3].raw} very much.`, "word-order");
      // a two cats → two cats
      if ((a === "a" || a === "an") && NUM_A.includes(b) && T[i + 2] && /s$/.test(c) && sameSent(i, i + 2)) add(i, i + 1, "grammar", "", `Đã có số đếm '${T[i + 1].raw}' thì bỏ a/an.`, "article");
      // a lots of → a lot of / lots of
      if (a === "a" && b === "lots" && c === "of") add(i, i + 2, "grammar", "a lot / lots", "Nói 'a lot of' hoặc 'lots of', không nói 'a lots of'.", "quant");
      // have + quá khứ đơn
      if (["have", "has", "had", "'ve", "haven't", "hasn't"].includes(a) || /'ve$/.test(a)) {
        if (PP[b]) add(i + 1, i + 2, "grammar", PP[b], `Sau have/has/had dùng quá khứ phân từ (V3): ${PP[b]}.`, "pp");
      }
      // so sánh kép
      if (a === "more" && COMP.includes(b)) add(i, i + 1, "grammar", "", `${T[i + 1].raw} đã là so sánh hơn, bỏ 'more'.`, "comp");
      // the most good → the best; is more good than → better
      if (a === "most" && /^(good|bad)$/.test(b) && /^(the|my|your|his|her|our|their)$/.test(prev)) add(i, i + 2, "grammar", b === "good" ? "best" : "worst", `So sánh nhất của ${b} là ${b === "good" ? "best" : "worst"} (không nói most ${b}).`, "comp");
      if (a === "more" && /^(good|bad)$/.test(b) && c === "than" && !/^(good|bad)$/.test(w(i + 3)) && /^(is|are|was|were|be|'s|'re|much|even|feel|feels|felt|look|looks|seem|seems|get|gets|got)$/.test(prev)) add(i, i + 2, "grammar", b === "good" ? "better" : "worse", `So sánh hơn của ${b} là ${b === "good" ? "better" : "worse"} (không nói more ${b}).`, "comp");
      // People in my city is → are (chủ ngữ số nhiều + cụm giới từ + động từ)
      if ((["people", "children", "men", "women", "police"].includes(a) || isPlN(a) && PL_DET.includes(prev) && clauseStart(i - 1)) && (["people", "children", "men", "women", "police"].includes(a) ? clauseStart(i) || /^(the|my|our|their|many|most|some|young|old)$/.test(prev) && clauseStart(i - 1) : true) && PREP.includes(b) && !/^(of)$/.test(b)) {
        for (let j = i + 2; j <= i + 5 && T[j]; j++) { if (!sameSent(i, j) || /[,;:]/.test(T[j].gap) || /^(who|that|which|where|when)$/.test(w(j))) break;
          if (/^(is|was|has|doesn't|isn't|wasn't|hasn't)$/.test(w(j))) { const f = { is: "are", was: "were", has: "have", "doesn't": "don't", "isn't": "aren't", "wasn't": "weren't", "hasn't": "haven't" }[w(j)];
            add(j, j + 1, "grammar", f, `Chủ ngữ là '${T[i].raw}' (số nhiều), cụm '${T.slice(i + 1, j).map(t => t.raw).join(" ")}' chỉ bổ nghĩa → dùng ${f}.`, /^(are|were)$/.test(f) ? "be" : "sva"); break; }
          if (FIN.has(w(j)) || THIRD[w(j)] || PAST[w(j)] || BASE.includes(w(j)) && j > i + 2) break; }
      }
      // The film was so bored → boring (vật/sự việc gây ra cảm giác: tính từ -ing)
      { const ED_ING = { bored: "boring", interested: "interesting", excited: "exciting", confused: "confusing", surprised: "surprising", disappointed: "disappointing", tired: "tiring", exhausted: "exhausting", annoyed: "annoying", frightened: "frightening", embarrassed: "embarrassing", amazed: "amazing" };
        const THING = /^(film|movie|book|lesson|trip|game|party|story|match|show|job|lecture|program|programme|novel|journey|meeting|speech|song|exam|test|course|video|news|weekend|holiday|vacation|day|museum|subject)$/;
        if ((THING.test(a) && /^(the|this|that|my|our|his|her|their|your|a|an)$/.test(prev) || /^(this|that)$/.test(a) && clauseStart(i)) && /^(is|was|'s|seems|seemed|looks|looked|sounds|sounded|became|got)$/.test(b)) {
          let k = i + 2; if (/^(so|very|really|quite|too|extremely|a)$/.test(w(k))) k++; if (w(k) === "bit" && w(k - 1) === "a") k++;
          const v = w(k); if (ED_ING[v] && sameSent(i, k) && !/^(with|by|for|as|to|of|at)$/.test(w(k + 1))) add(k, k + 1, "grammar", ED_ING[v], `Nói về vật/sự việc gây ra cảm giác dùng tính từ -ing: ${(/^(this|that)$/.test(a) ? "" : T[i - 1].raw + " ") + T[i].raw} ${T[i + 1].raw} ${ED_ING[v]} (người thì mới ${v}).`, "ing-ed"); } }
      // I born in 1998 → I was born
      if (b === "born" && (SUBJ_PRON.includes(a) && a !== "it" || NAMES.has(T[i].raw)) && T[i + 1] && !/[,;:]/.test(T[i + 1].gap)) { const be = /^(you|we|they)$/.test(a) ? "were" : "was"; add(i + 1, i + 2, "grammar", `${be} born`, `"Được sinh ra" là bị động: ${T[i].raw} ${be} born.`, "be"); }
      // good in English → good at English
      if (/^(good|bad|better|best|excellent|great|terrible|poor|weak|strong)$/.test(a) && b === "in" && T[i + 2] && (/^(english|maths|math|mathematics|science|music|sports|sport|history|physics|chemistry|biology|geography|art|literature|languages|french|chinese|japanese|korean|vietnamese|it|computers|football|tennis|badminton|chess|grammar|vocabulary|writing|speaking|reading|listening|singing|dancing|drawing|cooking|swimming|math)$/.test(c) || /[a-z]{3,}ing$/.test(c) && !/^(morning|evening|spring|building|thing|ceiling|everything|something|anything|nothing|clothing|meeting|wedding|beginning|during)$/.test(c)) && /^(am|is|are|was|were|'m|'s|'re|be|been|very|so|really|quite|not|get|got)$/.test(prev))
        add(i + 1, i + 2, "grammar", "at", `Giỏi/kém môn gì, việc gì: ${a} at (không dùng ${a} in): ${a} at ${T[i + 2].raw}.`, "fixed");
      if (a === "most" && SUP.includes(b)) add(i, i + 1, "grammar", "", `${T[i + 1].raw} đã là so sánh nhất, bỏ 'most'.`, "comp");
      if (a === "very" && ["like", "love", "enjoy", "want", "hate", "likes", "loves", "enjoys"].includes(b)) add(i, i + 2, "word", "really " + b, "Không dùng 'very' trước động từ. Dùng 'really like' hoặc 'like ... very much'.", "very");
      // a / an
      const proper = /^A/.test(T[i].raw) && !T[i].start && T[i].raw !== "A" ? true : (T[i].raw === "An" || T[i].raw === "A") && !T[i].start;
      if (!proper && T[i + 1] && isAcro(T[i + 1].raw)) { // a/an + từ viết tắt đọc từng chữ cái: an MBA, a USB
        const r1 = T[i + 1].raw, spelled = r1.length <= 3 && !/^(UNESCO|NASA|FIFA|ASEAN|COVID)$/.test(r1);
        if (spelled && a === "a" && LETTER_AN.test(r1) && !/^U/.test(r1)) add(i, i + 1, "grammar", "an", `'${r1}' đọc từng chữ cái, bắt đầu bằng âm nguyên âm → dùng 'an'.`, "article");
        if (spelled && a === "an" && !LETTER_AN.test(r1)) add(i, i + 1, "grammar", "a", `'${r1}' đọc từng chữ cái, bắt đầu bằng phụ âm → dùng 'a'.`, "article");
      } else if (!proper) {
      if (a === "a" && /^[aeiou]/.test(b) && !VOWEL_EXC.test(b) && !/^\d/.test(b)) add(i, i + 1, "grammar", "an", `'${T[i + 1].raw}' bắt đầu bằng nguyên âm → dùng 'an'.`, "article");
      if (a === "a" && HSILENT.test(b)) add(i, i + 1, "grammar", "an", `'${T[i + 1].raw}' có h câm → dùng 'an'.`, "article");
      if (a === "an" && /^[b-df-hj-np-tv-z]/.test(b) && !HSILENT.test(b)) add(i, i + 1, "grammar", "a", `'${T[i + 1].raw}' bắt đầu bằng phụ âm → dùng 'a'.`, "article");
      if (a === "an" && VOWEL_EXC.test(b)) add(i, i + 1, "grammar", "a", `'${T[i + 1].raw}' đọc bắt đầu bằng phụ âm /j/ hoặc /w/ → dùng 'a'.`, "article");
      if ((a === "a" || a === "an") && UNCOUNT.includes(b) && !["jam", "jams", "light", "lights", "forecast", "report", "sign", "accident", "problem", "box", "bag", "transfer", "officer"].includes(c)) add(i, i + 1, "grammar", "some", `'${T[i + 1].raw}' không đếm được, không dùng a/an.`, "uncount");
      }
      // danh từ số nhiều sai
      if (UNC_PL[a]) add(i, i + 1, "grammar", UNC_PL[a], `'${UNC_PL[a]}' không đếm được, không thêm -s.`, "uncount");
      if (IRR_PL[a]) add(i, i + 1, "grammar", IRR_PL[a], `Số nhiều bất quy tắc: ${IRR_PL[a]}.`, "plural");
      if ((NUMW.includes(a) || (/^\d+$/.test(a) && +a > 1)) && COUNT_N[b] && w(i + 2) !== "old" && !/s$/.test(w(i + 2)) && !(b === "time" && a === "many")) add(i + 1, i + 2, "grammar", COUNT_N[b], `Sau số nhiều, danh từ phải ở số nhiều: ${COUNT_N[b]}.`, "plural");
      if (a === "every" && /s$/.test(b) && COUNT_N[b.replace(/s$/, "")]) add(i + 1, i + 2, "grammar", b.replace(/s$/, ""), "Sau every dùng danh từ số ít.", "plural");
      if (a === "much" && ["people", "cars", "students", "friends", "things", "books", "times", "countries", "places"].includes(b)) add(i, i + 1, "grammar", "many", "Danh từ đếm được số nhiều → many.", "quant");
      if (a === "many" && ["money", "time", "water", "information", "advice", "traffic", "work", "homework", "rice", "sugar"].includes(b)) add(i, i + 1, "grammar", "much", "Danh từ không đếm được → much.", "quant");
      if (a === "there" && b === "is" && (NUMW.includes(c) || /^\d+$/.test(c) && +c > 1 || c === "lots" || (c === "a" && w(i + 3) === "lot" && /s$/.test(w(i + 5))))) add(i + 1, i + 2, "grammar", "are", "Danh từ số nhiều → There are.", "there");
      if (a === "there" && b === "are" && (c === "one" && !["of", "or", "and"].includes(w(i + 3)) || ["a", "an"].includes(c) && !["lot", "few", "number", "couple", "variety", "range", "dozen", "great", "large", "small", "huge", "total", "series", "pair", "group", "lots", "hundred", "thousand", "million"].includes(w(i + 3)))) add(i + 1, i + 2, "grammar", "is", "Một vật → There is.", "there");
      // cụm cố định
      const two = a + " " + b, three = two + " " + c;
      const FIX2 = { "discuss about": ["discuss", "Discuss không đi với about."], "discussed about": ["discussed", "Discuss không đi với about."], "depend of": ["depend on", "Depend on."], "depends of": ["depends on", "Depend on."], "despite of": ["despite", "Despite không đi với of (hoặc dùng in spite of)."], "listen music": ["listen to music", "Listen to + danh từ."], "explain me": ["explain to me", "Explain to sb."], "say me": ["tell me", "Say không có tân ngữ người; dùng tell me."], "said me": ["told me", "Say không có tân ngữ người; dùng told me."], "every days": ["every day", "Every + danh từ số ít."], "borrow me": ["lend me", "Cho ai mượn: lend sb."], "according me": ["in my opinion", "Nói ý kiến mình: In my opinion."], "arrive to": ["arrive in / arrive at", "Arrive in + thành phố, arrive at + địa điểm."], "arrived to": ["arrived in / arrived at", "Arrive in + thành phố, arrive at + địa điểm."], "go to home": ["go home", "Home không cần to: go home."], "went to home": ["went home", "Home không cần to: went home."], "make homework": ["do homework", "Collocation đúng: do homework."], "make exercise": ["do exercise", "Collocation đúng: do exercise."], "make research": ["do research", "Collocation đúng: do research."], "do mistakes": ["make mistakes", "Collocation đúng: make mistakes."], "do a mistake": ["make a mistake", "Collocation đúng: make a mistake."], "did a mistake": ["made a mistake", "Collocation đúng: make a mistake."], "do a decision": ["make a decision", "Collocation đúng: make a decision."], "make a photo": ["take a photo", "Chụp ảnh: take a photo."], "make photos": ["take photos", "Chụp ảnh: take photos."] };
      // married with: be/get married to sb; marry sb (không có with). "married with two children" (đã có gia đình, có 2 con) là đúng
      if (/^(marry|marries|married|marrying)$/.test(a) && b === "with" && sameSent(i, i + 1) && !(NUMW.includes(c) || /^\d/.test(c) || /^(children|kids|a|one|no)$/.test(c) && (c !== "a" && c !== "one" || /^(child|baby|son|daughter|family|kid)$/.test(w(i + 3))) || c === "children")) {
        const beGet = /^(am|is|are|was|were|be|been|being|get|gets|got|gotten|getting|'m|'s|'re)$/.test(prev) || /'(m|s|re)$/.test(prev) || /^(happily|recently|just)$/.test(prev) && /^(am|is|are|was|were|be|been|get|got)$/.test(w(i - 2));
        if (beGet && a === "married") add(i, i + 2, "grammar", "married to", "Kết hôn với ai: be/get married to sb (không dùng with).", "fixed");
        else add(i, i + 2, "grammar", T[i].raw, `Marry không đi với with: ${a} sb (ví dụ: ${a} a doctor), hoặc dùng ${a === "married" ? "got" : "get"} married to sb.`, "fixed");
      }
      const FIX3 = { "in the other": ["on the other", "Cụm đúng: on the other hand."], "according to me": ["in my opinion", "Không nói 'according to me'; dùng In my opinion."], "although it but": null };
      if (FIX2[two] && sameSent(i, i + 1)) add(i, i + 2, two.startsWith("make") || two.includes("mistake") || two.includes("decision") || two.includes("photo") ? "word" : "grammar", FIX2[two][0], FIX2[two][1], "fixed");
      if (FIX3[three] && sameSent(i, i + 2)) add(i, i + 3, "grammar", FIX3[three][0], FIX3[three][1], "fixed");
      if (["look", "looking", "looks"].includes(a) && b === "forward" && c === "to" && BASE.includes(w(i + 3))) add(i + 3, i + 4, "grammar", ing(w(i + 3)), "Look forward to + V-ing.", "ving");
      if (["enjoy", "enjoys", "avoid", "avoids", "finish", "finished", "mind", "suggest", "suggested"].includes(a) && b === "to" && BASE.includes(c)) add(i + 1, i + 3, "grammar", ing(c), `${T[i].raw} + V-ing: ${ing(c)}.`, "ving");
      if (a === "since" && (/^\d+$/.test(b) && +b < 100 || NUMW.includes(b) || ["a", "one"].includes(b)) && ["years", "months", "days", "weeks", "hours", "year", "month", "week", "day", "hour", "minutes"].includes(c) && !(["a", "one"].includes(b) && /s$/.test(c)) && w(i + 3) !== "ago") add(i, i + 1, "grammar", "for", "Khoảng thời gian dùng for, mốc thời gian dùng since.", "for-since");
      if (a === "for" && /^(19|20)\d\d$/.test(b)) add(i, i + 1, "grammar", "since", "Mốc thời gian (năm) dùng since.", "for-since");
      if (a === "if" && ["i", "you", "he", "she", "it", "we", "they"].includes(b) && c === "will") add(i + 2, i + 3, "grammar", "", "Mệnh đề if (điều kiện loại 1) không dùng will.", "if-will");
      if (/n't$|^not$|^cannot$/.test(a) && a !== "not" || (a === "not" && T[i - 1] && /^(do|does|did|is|are|am|was|were|can|could|will|would|should|have|has)$/.test(w(i - 1)))) {
        const NEG = { nothing: "anything", nobody: "anybody", nowhere: "anywhere", never: "ever", none: "any", "no-one": "anyone" };
        for (let k = i + 1; k <= i + 4 && T[k]; k++) { if (!sameSent(i, k) || /[,;:]/.test(T[k].gap) || /^(but|and|or|because|that|if|when|so|than|only)$/.test(w(k))) break;
          if (NEG[w(k)]) { add(k, k + 1, "grammar", NEG[w(k)], `Tiếng Anh không dùng hai từ phủ định trong cùng một câu: ${T[i].raw} ... ${NEG[w(k)]}.`, "double-neg"); break; }
          if (w(k) === "no" && k === i + 2 && BASE.includes(w(i + 1)) && w(i + 1) !== "say" && T[k + 1] && !/[,.!?]/.test(T[k + 1].gap)) { add(k, k + 1, "grammar", "any", `Tiếng Anh không dùng hai từ phủ định: ${T[i].raw} ${w(i + 1)} any ...`, "double-neg"); break; } }
      }
      if (a === b && !REP_OK.includes(a)) add(i + 1, i + 2, "grammar", "", `Lặp từ '${T[i].raw}'.`, "repeat");
    }
    // thì quá khứ: câu kể có mốc quá khứ mà động từ chia hiện tại
    //  - mốc quá khứ trong chính câu đó: gạch cả V nguyên mẫu lẫn V-s
    //  - mốc từ câu trước (ngữ cảnh kể chuyện): chỉ gạch V nguyên mẫu sau I/you/we/they hoặc sau chủ ngữ số ít;
    //    V-s (She lives in Hue) là sự thật ở hiện tại, không gạch
    //  - opts.tense === "past" (đề bài hỏi chuyện đã qua): như ngữ cảnh kể chuyện nếu câu không có mốc hiện tại
    const sents = splitSent(T); let pastCtx = false; const YEAR = new Date().getFullYear();
    const toPast = pastOf; // learn → learned (Anh – Mỹ), không phải learnt
    sents.forEach(([s0, e0]) => {
      const txt = T.slice(s0, e0).map(t => t.fixw || t.w).join(" ");
      const yr = (txt.match(/\bin ((?:19|20)\d\d)\b/) || [])[1], pastYear = !!yr && +yr < YEAR;
      const own = PAST_MARK.test(txt) || pastYear, pres = PRES_MARK.test(txt) || /\b(am|is|are)\b/.test(txt);
      if (pres) pastCtx = false; else if (own) pastCtx = true;
      const hint = opt.tense === "past" && !pres;
      if (!pastCtx && !hint) return;
      const ownPast = own && !pres;
      for (let i = s0; i < e0 - 1; i++) {
        const a = wv(i), b = wv(i + 1), prev = wv(i - 1);
        const nounSubj = DET.includes(prev) && (SING_N.includes(a) || /s$/.test(a)) && !STOP.has(a);
        const subj = SUBJ_PRON.includes(a) || nounSubj || NAMES.has(T[i].raw);
        if (!subj || AUX_BEFORE.includes(prev) || ["that", "who", "which"].includes(prev)) continue;
        if (CAUS.includes(nounSubj ? wv(i - 2) : prev) || ["and", "or"].includes(nounSubj ? wv(i - 2) : prev) && !SUBJ_PRON.includes(a)) continue; // made my sister cry, let Lan go
        if (T[i + 1].gap && /[,;:]/.test(T[i + 1].gap)) continue;
        const base = BASE_X.includes(b) && !(T[i + 1] && /^[A-Z]/.test(T[i + 1].raw)) ? b : THIRD[b];
        if (!base) continue;
        const isThird = !BASE_X.includes(b);
        if (isThird && !ownPast) continue; // She lives in Hue (sự thật hiện tại)
        const dup = out.find(x => x.i === i + 1);
        if (dup && dup.key === "sva") { dup.fix = toPast(base); dup.msg = `Đoạn này kể chuyện đã qua → dùng quá khứ đơn: ${toPast(base)}.`; dup.key = "tense"; continue; }
        if (STATE_V.includes(base)) continue;
        if (!["have", "do", "has", "does", "is"].includes(b) && !dup) add(i + 1, i + 2, "grammar", toPast(base), `Đoạn này kể chuyện đã qua → dùng quá khứ đơn: ${toPast(base)}.`, "tense");
      }
      // hiện tại hoàn thành + mốc quá khứ đã kết thúc trong cùng mệnh đề: I have visited Da Lat last summer → visited
      //   mốc phải đứng sau have + V3 trong cùng mệnh đề, hoặc mở đầu câu ngay trước chủ ngữ (Yesterday I have seen...)
      const pastAt = k => { const x = wv(k), y = wv(k + 1);
        if (x === "yesterday") return 1;
        if (x === "last" && /^(night|week|weekend|month|year|summer|winter|spring|sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/.test(y) && !/^(the|since|for|this|in|over|during|my|his|her|our|their|your)$/.test(wv(k - 1))) return 2;
        if (x === "in" && /^(19|20)\d\d$/.test(y) && +y < YEAR) return 2;
        if (x === "ago" && /^(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|many|several|few|years|months|days|weeks|hours|minutes)$/.test(wv(k - 1)) && !T.slice(s0, k).some(t => t.w === "since")) return 1;
        return 0; };
      for (let i = s0; i < e0 - 1; i++) { const a = wv(i), b = wv(i + 1);
        if (!(/^(have|has)$/.test(a) || /^(i|you|we|they)'ve$/.test(a)) || !(Object.values(PP).includes(b) || b === "been" || PAST[b] && !PP[b] && b !== "did" || /ed$/.test(b) && b.length > 4 && b !== "need")) continue;
        if (AUX_BEFORE.includes(wv(i - 1)) || MODALS.includes(wv(i - 1)) || b === "been" && !/^(to|in|at)$/.test(wv(i + 2))) continue;
        let hit = false;
        for (let k = i + 2; k < Math.min(e0, i + 10); k++) { if (/[,;:]/.test(T[k].gap) || /^(which|who|that|when|while|because|since|and|but|so|if|before|after|until|where)$/.test(wv(k))) break; if (pastAt(k)) { hit = true; break; } }
        if (!hit && pastAt(s0)) { const m = s0 + pastAt(s0); if (i - m <= 2 && i >= m && !T.slice(m + 1, i + 1).some(t => /[;:]/.test(t.gap))) hit = true; }
        if (!hit) continue;
        const pst = b === "been" && wv(i + 2) === "to" ? "went" : b === "been" ? (/^(he|she|it)$/.test(wv(i - 1)) || a === "has" ? "was" : "were") : (Object.keys(PP).find(k => PP[k] === b) || b);
        const subj = /'ve$/.test(a) ? T[i].raw.split(/['’]/)[0] + " " : "";
        add(i, i + 2, "grammar", subj + pst, `Có mốc thời gian quá khứ đã kết thúc (yesterday, last..., ago, in + năm) → dùng quá khứ đơn: ${pst}, không dùng hiện tại hoàn thành.`, "perfect-past"); break; }
      // Yesterday I don't go → didn't (mốc quá khứ trong cùng mệnh đề)
      for (let i = s0; i < e0; i++) { const a = wv(i); if (!/^(don't|doesn't|do|does)$/.test(a) || /^(do|does)$/.test(a) && wv(i + 1) !== "not") continue;
        if (/^(do|does)$/.test(a) && /^(what|where|when|why|how|who)$/.test(wv(i - 1))) continue;
        let hit = false;
        for (let k = i - 1; k >= s0; k--) { if (pastAt(k)) { hit = true; break; } if (/[,;:]/.test(T[k + 1].gap) && k + 1 !== i && !pastAt(s0) || /^(that|which|who|because|so|but|and|if|when|while|since|although)$/.test(wv(k))) break; }
        if (!hit) for (let k = i + 1; k < Math.min(e0, i + 10); k++) { if (/[,;:]/.test(T[k].gap) || /^(that|which|who|whom|what|where|why|how|whether|because|so|but|and|if|when|while|since|although|now|today|anymore|usually|always|every)$/.test(wv(k)) || k > i + 1 && (FIN.has(wv(k)) || PAST[wv(k)] || /'(m|re|s|d)$/.test(wv(k)))) break; if (pastAt(k)) { hit = true; break; } }
        if (!hit) continue; const neg = /n't$/.test(a);
        add(i, i + 1, "grammar", neg ? "didn't" : "did", `Có mốc thời gian quá khứ (yesterday, last..., ago) → phủ định ở quá khứ: ${neg ? "didn't" : "did not"} + động từ nguyên mẫu.`, "tense");
        const dupS = out.findIndex(x => x.i === i + 1 && x.key === "sva"); if (dupS >= 0) out.splice(dupS, 1); }
      // động từ nối bằng and sau một động từ đã gạch: We swim ... and eat
      for (let i = s0 + 1; i < e0 - 1; i++) if (wv(i) === "and" && BASE.includes(wv(i + 1)) && !["have", "do"].includes(wv(i + 1)) && !out.some(x => x.i === i + 1) && out.some(x => x.key === "tense" && x.i > s0 && x.i < i && x.i >= i - 6))
        add(i + 1, i + 2, "grammar", toPast(wv(i + 1)), `Đoạn này kể chuyện đã qua → dùng quá khứ đơn: ${toPast(wv(i + 1))}.`, "tense");
    });
    // although ... but / because ... so trong cùng câu
    sents.forEach(([s, e]) => {
      const ws = T.slice(s, e).map(t => t.w);
      const ia = ws.findIndex(x => x === "although" || x === "though" || x === "even"), ib = ws.indexOf("but");
      if (ia >= 0 && ib > ia && (ws[ia] !== "even" || ws[ia + 1] === "though") && !ws.slice(0, ia).includes("not")) add(s + ib, s + ib + 1, "grammar", "", "Đã có although thì không dùng but trong cùng câu.", "although-but");
      const ic = ws.indexOf("because"), is = ws.indexOf("so");
      if (ic >= 0 && is > ic && T[s + is] && (/,/.test(T[s + is].gap) || SUBJ_PRON.concat(DET, ["there", "people"]).includes(ws[is + 1])) && !["much", "many", "that"].includes(ws[is + 1])) add(s + is, s + is + 1, "grammar", "", "Đã có because thì không dùng so trong cùng câu.", "because-so");
    });
    return out;
  }
  function splitSent(T) { const r = []; let s = 0; T.forEach((t, i) => { if (t.start && i > s) { r.push([s, i]); s = i; } }); if (T.length) r.push([s, T.length]); return r; }

  /* ---------- Chính tả ---------- */
  function okWord(w) {
    const l = w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); if (SP.correct(w) || SP.correct(l) || SP.correct(l[0].toUpperCase() + l.slice(1))) return true;
    const v = [typeof usSpell === "function" ? usSpell(l) : l, l.replace(/our/, "or"), l.replace(/tre(s?)$/, "ter$1"), l.replace(/ys(e|ed|es|ing)$/, "yz$1"), l.replace(/ll(ed|ing|er|ers)$/, "l$1"), l.replace(/is(e|ed|es|ing|ation|ations|er|ers)$/, "iz$1"), l.replace(/isation(s?)$/, "ization$1"), l.replace(/ogue(s?)$/, "og$1"), l.replace(/ence$/, "ense"), l.replace(/our/, "or").replace(/ful$/, "ful"), l.replace(/^programmes?$/, "program"), l.replace(/^instal(ment|ments)$/, "instal$1").replace(/^instal/, "install"), l.replace(/ageing/, "aging"), l.replace(/^scept/, "skept")];
    return v.some(x => SP.correct(x));
  }
  const OVER = { buyed: "bought", goed: "went", eated: "ate", drinked: "drank", runned: "ran", swimed: "swam", swimmed: "swam", writed: "wrote", catched: "caught", teached: "taught", thinked: "thought", bringed: "brought", taked: "took", maked: "made", gived: "gave", comed: "came", seed: "saw", sayed: "said", telled: "told", knowed: "knew", growed: "grew", throwed: "threw", flied: "flew", drived: "drove", rided: "rode", speaked: "spoke", breaked: "broke", choosed: "chose", forgetted: "forgot", getted: "got", leaved: "left", feeled: "felt", keeped: "kept", sleeped: "slept", meeted: "met", sitted: "sat", standed: "stood", understanded: "understood", winned: "won", loosed: "lost", losed: "lost", payed: "paid", spended: "spent", sended: "sent", builded: "built", fighted: "fought", finded: "found", hitted: "hit", putted: "put", cutted: "cut", hurted: "hurt", costed: "cost", becomed: "became", begined: "began", singed: "sang", drawed: "drew", weared: "wore", hided: "hid", falled: "fell", feeded: "fed", holded: "held", readed: "read", heared: "heard", childs: "children", childrens: "children", mans: "men", womans: "women", foots: "feet", tooths: "teeth", mouses: "mice", sheeps: "sheep", fishs: "fish", informations: "information", advices: "advice", furnitures: "furniture", homeworks: "homework", luggages: "luggage", equipments: "equipment", knowledges: "knowledge" };
  function spelling(T) {
    if (!SP) return [];
    const out = [];
    const sents = splitSent(T);
    const sentOf = i => sents.find(([a, b]) => i >= a && i < b);
    // câu viết hoa kiểu tiêu đề / viết hoa toàn bộ: kiểm tra cả những từ viết hoa
    const capsSent = ([a, b]) => { const ws = T.slice(a + 1, b).filter(t => /^[A-Za-z]{2,}/.test(t.raw)); return ws.length >= 3 && ws.filter(t => /^[A-Z]/.test(t.raw)).length >= ws.length * 0.75; };
    const nameLike = k => T[k] && /^[A-Z]/.test(T[k].raw) && (EXTRA.includes(T[k].raw) || NAMES.has(T[k].raw) || NONASCII.test(T[k].raw));
    const mostlyAllCaps = ([a, b]) => { const ws = T.slice(a, b).filter(t => /^[A-Za-z]{2,}/.test(t.raw)); return ws.length >= 3 && ws.filter(t => /^[A-Z]+$/.test(t.raw)).length >= ws.length * 0.5; };
    T.forEach((t, i) => {
      if (/^\d/.test(t.w) || t.raw.length < 2 || t.skip) return;
      if (NONASCII.test(t.raw)) return; // từ tiếng Việt có dấu (Nguyễn, phở, Đà Lạt): coi là tên riêng / từ mượn
      const ov = OVER[t.raw.toLowerCase()];
      if (ov) { out.push({ i, j: i + 1, cat: "grammar", fix: /^[A-Z]{2,}$/.test(t.raw) ? ov.toUpperCase() : /^[A-Z]/.test(t.raw) ? ov[0].toUpperCase() + ov.slice(1) : ov, msg: /ed$/.test(t.raw.toLowerCase()) ? "Động từ bất quy tắc, không thêm -ed." : /(tion|vice|ture|work|gage|ment|ledge)s$/.test(t.raw.toLowerCase()) ? "Danh từ không đếm được, không thêm -s." : "Danh từ số nhiều bất quy tắc.", key: "irreg" }); return; }
      const sn = sentOf(i), allCaps = /^[A-Z]{2,}$/.test(t.raw);
      if (allCaps) { // từ VIẾT HOA: bỏ qua từ viết tắt thật (≤4 chữ hoặc có trong danh sách), trừ khi cả câu viết hoa
        if (ACRO.has(t.raw) || ACRO.has(t.raw.replace(/S$/, ""))) return;
        if (t.raw.length <= 4 && !mostlyAllCaps(sn)) return;
      } else if (/^[A-Z]/.test(t.raw) && !t.start && (!capsSent(sn) || nameLike(i - 1) || nameLike(i + 1))) return; // tên riêng (Nguyen Thi Lan, Le Loi)
      if (/^[A-Z]/.test(t.raw) && !t.start && (EXTRA.includes(t.raw) || NAMES.has(t.raw))) return;
      const parts = t.raw.replace(/’/g, "'").split("-");
      const bad = parts.some(p => { if (!p) return false; const base = p.replace(/'s$/i, ""); return !(okWord(base) || (typeof CONTR !== "undefined" && CONTR[p.toLowerCase()])); });
      if (bad) {
        const low = t.raw.toLowerCase(), form = x => allCaps ? x.toUpperCase() : /^[A-Z]/.test(t.raw) ? x[0].toUpperCase() + x.slice(1) : x;
        const sug = [...new Set(SP.suggest(allCaps || /^[A-Z]/.test(t.raw) ? low : t.raw).map(x => form(x)))].slice(0, 2);
        out.push({ i, j: i + 1, cat: "spell", fix: sug.join(" / "), msg: sug.length ? "Sai chính tả." : "Từ này không có trong từ điển. Kiểm tra lại chính tả.", key: "spell" });
      }
    });
    // viết hoa toàn bộ bài
    const letters = T.map(t => t.raw.replace(/[^A-Za-z]/g, "")).join(""), up = letters.replace(/[^A-Z]/g, "").length;
    if (letters.length >= 20 && up > letters.length * 0.6) { const k = T.findIndex(t => /^[A-Z]{2,}$/.test(t.raw)); if (k >= 0) out.push({ i: k, j: k + 1, cat: "cap", fix: null, msg: "Không viết hoa toàn bộ bài. Chỉ viết hoa chữ đầu câu, chữ I và tên riêng.", key: "allcaps" }); }
    return out;
  }
  // kiểm tra một gợi ý sửa có đúng chính tả không (khi đã tải từ điển)
  function validFix(fix) {
    if (!SP || !fix) return true;
    return fix.split(/[\s\/.,!?;:()]+/).filter(x => /[a-z]/i.test(x) && !NONASCII.test(x)).every(x => okWord(x.replace(/'s$/i, "")) || (typeof CONTR !== "undefined" && CONTR[x.toLowerCase()]) || /^(I|there)$/i.test(x));
  }
  function cleanFixes(issues) {
    issues.forEach(x => { if (!x.fix || x.cat === "spell") return;
      const alts = x.fix.split(" / "), ok = alts.filter(validFix);
      if (ok.length < alts.length) x.fix = ok.length ? ok.join(" / ") : null; });
    return issues;
  }

  /* ---------- Chống gian lận: lặp, nhồi từ khóa, chép văn bản, viết tiếng Việt ---------- */
  const words = s => (s.toLowerCase().normalize("NFC").match(/[a-z\u00C0-\u024F\u1E00-\u1EFF]+(?:'[a-z]+)?|\d+/g) || []);
  const grams = (ws, k) => { const r = []; for (let i = 0; i + k <= ws.length; i++) r.push(ws.slice(i, i + k).join(" ")); return r; };
  function integrity(text, T, opt) {
    const res = { flags: [], issues: [] }, ws = T.map(t => t.w), n = ws.length;
    const at = (k, msg, key) => { k = Math.max(0, Math.min(T.length - 1, k)); res.issues.push({ i: k, j: k + 1, cat: "word", fix: null, msg, key, glob: 1 }); res.flags.push(key); };
    if (!n) return res;
    // 1. viết bằng tiếng Việt
    const vi = T.filter(t => VI_RE.test(t.raw)).length;
    if (n >= 8 && vi > n * 0.4) { at(T.findIndex(t => VI_RE.test(t.raw)), "Bài viết cần viết bằng tiếng Anh, không viết bằng tiếng Việt.", "vietnamese"); return res; }
    // 2. lặp lại / nhồi từ khóa
    if (n >= 10) {
      const g4 = grams(ws, 4), seen = new Set(); let rep4 = 0, first = -1;
      g4.forEach((g, k) => { if (seen.has(g)) { rep4++; if (first < 0) first = k; } else seen.add(g); });
      const repR = g4.length ? rep4 / g4.length : 0, ttrAll = new Set(ws).size / n;
      const freq = {}; ws.forEach(x => { if (!STOP.has(x)) freq[x] = (freq[x] || 0) + 1; });
      const topW = Object.entries(freq).sort((a, b) => b[1] - a[1])[0] || ["", 0];
      const kwTok = new Set((opt.kw || []).flatMap(k => k.toLowerCase().split(/[\/\s]+/)).filter(Boolean));
      const ss = splitSent(T).map(([a, b]) => ws.slice(a, b)).filter(x => x.length);
      const kwSent = kwTok.size ? ss.filter(x => x.filter(y => kwTok.has(y)).length >= x.length * 0.75).length : 0;
      const dupSent = ss.length - new Set(ss.map(x => x.join(" "))).size;
      const stuffed = repR > 0.3 || (n >= 20 && ttrAll < 0.3) || (topW[1] >= 5 && topW[1] > n * 0.15) || (ss.length >= 2 && kwSent >= ss.length * 0.5) || (dupSent >= 2 && dupSent >= ss.length * 0.3);
      if (stuffed) at(first >= 0 ? first : 0, "Bài viết lặp lại từ/cụm từ hoặc chỉ liệt kê từ khóa, chưa phải câu văn thật. Hãy viết câu đầy đủ, mỗi câu một ý mới.", "stuffing");
    }
    // 3. chép lại văn bản có sẵn (bài đọc, bài mẫu)
    if (opt.refs && opt.refs.length && n >= 10) {
      const aw = words(text), ag = grams(aw, 5); const refG = new Set();
      opt.refs.forEach(r => grams(words(String(r || "")), 5).forEach(g => refG.add(g)));
      const hit = ag.filter(g => refG.has(g)).length;
      if (ag.length && hit / ag.length > 0.3) { const k = ag.findIndex(g => refG.has(g)); at(k, "Bài viết chép lại văn bản có sẵn. Hãy tự viết bằng lời của mình.", "copy"); res.copyRate = hit / ag.length; }
    }
    // 4. lạc đề: có opts.topic (đề + bài mẫu) mà bài gần như không dùng từ nào của chủ đề
    if (opt.topic) { const rv = relevance(text, opt.topic, opt.kw); res.relevance = rv;
      if (rv.off) at(0, rv.why === "generic" ? "Bài viết chưa bám sát đề bài: toàn câu chung chung, chưa nói cụ thể về nội dung đề hỏi." : "Bài viết chưa bám sát đề bài. Hãy viết đúng nội dung đề yêu cầu.", "offtopic"); }
    return res;
  }

  /* ---------- Dạng viết tắt → dạng đầy đủ (cho việc so từ khóa) ---------- */
  // trả về [nguyên bản, bản mở rộng 'd = would / 's = is, bản mở rộng 'd = had / 's = has]
  function expandC(t) {
    const base = String(t).replace(/[’‘]/g, "'"), sub = (x, d, s2) => x
      .replace(/\bwon't\b/gi, "will not").replace(/\bcan't\b/gi, "can not").replace(/\bcannot\b/gi, "can not").replace(/\bshan't\b/gi, "shall not")
      .replace(/\b([a-z]+)n't\b/gi, "$1 not").replace(/\b([a-z]+)'ve\b/gi, "$1 have").replace(/\b([a-z]+)'ll\b/gi, "$1 will")
      .replace(/\b([a-z]+)'re\b/gi, "$1 are").replace(/\b(i)'m\b/gi, "$1 am").replace(/\b([a-z]+)'d\b/gi, "$1 " + d)
      .replace(/\b(he|she|it|there|that|what|who|where|here|how|when|why)'s\b/gi, "$1 " + s2);
    const A = sub(base, "would", "is"), B = sub(base, "had", "has");
    return [...new Set([String(t), A, B])];
  }

  /* ---------- Bám sát đề: so từ nội dung của bài với đề + bài mẫu (opts.topic) ---------- */
  // từ chung chung, dùng được cho mọi đề → không tính là "bám đề"
  const GENERIC = new Set(W("think believe agree disagree people person thing way time make get go come good bad nice great important many much more most less also really very lot lots because however example instance opinion view conclusion first firstly second secondly third finally like want need know say tell see use day week year month life world new old big small best better worse problem reason idea fact case part kind sort number other another lot everyone everybody someone something anything nothing one two three four five six seven eight nine ten hundred thousand dear hello hi best wishes regards sincerely faithfully thanks thank please soon wait write writing email letter today tomorrow yesterday morning evening night always usually often sometimes never every still even well maybe perhaps quite rather sure true clear clearly arguably undoubtedly widely whereas conversely contrast said provided given taken together balance summary furthermore moreover addition admittedly critics opponents while although though therefore thus hope look forward feel happy sad love hate start begin end try keep give take put let help work able can will would could should might must may shall yes ok okay last next early late near far soon hot cold hard easy fine sorry see doing done talk speak ask answer place area thing stuff which what who whom whose where when why how there here"));
  const IRR_LEM = {}; Object.entries(PAST).forEach(([p, b]) => { IRR_LEM[p] = b; }); Object.entries(PP).forEach(([p, pp]) => { IRR_LEM[pp] = PAST[p] || IRR_LEM[pp] || pp; });
  Object.assign(IRR_LEM, { children: "child", people: "person", men: "man", women: "woman", feet: "foot", teeth: "tooth", mice: "mouse", better: "good", best: "good", worse: "bad", worst: "bad", is: "be", are: "be", was: "be", were: "be", been: "be", am: "be" });
  const lem = w => { w = w.toLowerCase().replace(/['’]s$/, ""); if (IRR_LEM[w]) return IRR_LEM[w];
    let x = w.replace(/ies$/, "y").replace(/(ss|sh|ch|x|z)es$/, "$1").replace(/([^su])s$/, "$1");
    if (x.length > 5) x = x.replace(/ing$|ed$/, "").replace(/([b-df-hj-np-tv-z])\1$/, "$1");
    if (x.length > 5) x = x.replace(/(i)?est$/, (m0, y) => y ? "y" : "");
    if (x.length > 6) x = x.replace(/(ation|ment|ness|ity|ally|ly|er|or|al|ful|ive|ous|ise|ize|ist|ism|ance|ence)$/, "");
    return x.replace(/e$/, "").replace(/y$/, "i"); };
  let GEN_L = null;
  // tên riêng (chữ hoa giữa câu, tên người/địa danh Việt) không tính: Sam, Nha Trang, Lan
  const lemSet = (t, ex) => { if (!GEN_L) GEN_L = new Set([...GENERIC].map(lem)); const out = new Set(); const re = /[A-Za-z]+(?:['’][a-z]+)?/g, str = String(t).normalize("NFC"); let m;
    while ((m = re.exec(str))) { const raw = m[0], x = raw.toLowerCase(), before = str.slice(Math.max(0, m.index - 3), m.index);
      if (x.length < 3 || STOP.has(x) || GENERIC.has(x) || ex.has(x) || /['’]/.test(x)) continue;
      if (/^[A-Z]/.test(raw) && (!/(^|[.!?:\n]\s*|^\s*)$/.test(before) && m.index > 0 || EXTRA.includes(raw) || NAMES.has(raw))) continue;
      const l = lem(x); if (l.length > 2 && !ex.has(l) && !GEN_L.has(l)) out.add(l); }
    return out; };
  // từ khóa chủ đề trong đề tiếng Việt → các từ tiếng Anh cùng chủ đề (để biết đề có cố định nội dung hay không)
  const VI_TOPIC = [
    ["gia đình", "family father mother brother sister parent child son daughter dad mom mum grandmother grandfather grandparent uncle aunt cousin husband wife baby"], ["tuổi", "age"], ["công việc|nơi làm việc|đi làm|công ty|làm việc", "job office company colleague boss mechanic engineer nurse doctor teacher driver farmer worker garage factory hospital customer fix repair salary shift"],
    ["đồ vật|trên bàn|trong túi", "desk table bag pen phone book key wallet laptop pencil notebook glass card"], ["con vật", "animal dog cat pet bird fish eye ear tail fur cute"], ["ngoại hình|màu sắc", "hair eye tall color black brown white long short small big beautiful"],
    ["mấy giờ dậy|từ sáng đến tối|giờ giấc|ngày bình thường", "breakfast lunch dinner o'clock bed school shower"], ["sinh nhật", "birthday party cake gift candle present"],
    ["mùa", "season summer winter spring autumn"], ["món ăn|đồ uống|món nên ăn", "food dish eat drink coffee tea rice noodle restaurant meal delicious pho bread soup chicken beef pork fish fruit vegetable juice milk beer cake sweet spicy salty taste"],
    ["nhà hàng|gọi món", "restaurant menu order waiter bill"], ["cửa hàng|mua một chiếc áo", "shop store buy shirt size price"], ["ngôi nhà|căn hộ", "house apartment room kitchen bedroom bathroom floor garden balcony"],
    ["chỉ đường", "turn left right street straight corner road pharmacy supermarket post bank market school opposite next behind between park light"], ["đi học|đi lại", "bus motorbike bike car taxi traffic walk"], ["bị ốm|xin nghỉ", "sick ill fever doctor headache cold sore throat cough flu medicine"],
    ["thời tiết", "weather rain sunny wind rainy cloudy windy cool hot cold warm temperature storm"], ["sở thích", "hobby free play swim guitar draw football game"], ["trang phục|đang mặc", "wear shirt dress jeans shoes clothes skirt trousers jacket hat"], ["quê", "hometown village countryside province rice field farm peaceful"],
    ["tuổi thơ", "childhood young child kid play village"], ["cuối tuần", "weekend saturday sunday"], ["tiếng anh", "english learn study practice vocabulary grammar word film club speak listen read exam ielts app lesson course teacher fluent"],
    ["tính cách", "kind friendly patient honest funny personality shy generous calm angry stubborn lazy polite rude cheerful quiet talkative selfish caring"], ["thói quen", "habit routine"], ["trải nghiệm", "experience"], ["thành phố", "city town street flood jam pollution noise housing crowded"],
    ["20 năm nữa", "future robot technology"], ["khách sạn|đặt phòng", "hotel room night booking reservation double single breakfast parking reception"], ["căng thẳng|mất ngủ", "stress sleep relax worry exercise"],
    ["quy định", "rule allow uniform"], ["phỏng vấn|xin việc", "interview job experience skill company"], ["phàn nàn", "complain refund broken damaged order delivery replace receive"],
    ["nghe máy|lời nhắn", "call message phone"], ["cuộc họp|tài liệu", "meeting attach document"], ["công thức|biết nấu", "cook recipe add ingredient cut put mix pour boil fry blend minute spoon salt sugar oil bowl pan"],
    ["môi trường", "environment pollution rubbish waste plastic air water tree flood noise drain smoke dust"], ["điện thoại|mạng an toàn", "phone internet password online link scam"],
    ["sản phẩm", "product made clay silk pottery handmade village traditional famous shape paint"], ["lễ hội", "festival tet celebrate lantern mooncake moon firework lucky pagoda"], ["quản lý tiền|tiết kiệm|chi tiêu", "money save spend salary budget"],
    ["tin tức|bản tin", "news report article source"], ["học trực tuyến", "online course class teacher internet"], ["bạn thân|tình bạn", "friend friendship classmate meet trust"],
    ["chuyển đến", "move"], ["truyền thuyết|giai thoại", "legend story king"], ["địa danh|địa điểm đẹp", "place famous visit tourist landscape lake river mountain forest beach sea island cave valley village view visitor"],
    ["thuyết trình", "presentation slide audience"], ["dự án|tiến độ", "project deadline progress team boss"], ["xe máy", "motorbike traffic"], ["cấm", "ban"],
    ["trung tâm", "center centre downtown"], ["ô tô", "car vehicle driver traffic"], ["áp lực", "pressure deadline stress"], ["trường học|ở trường", "school university"],
    ["sức khỏe", "health study research"], ["giá cả", "price cost spend inflation"], ["thách thức toàn cầu", "climate global warming"],
    ["mạng xã hội", "social media facebook tiktok online instagram post platform scroll"], ["chính sách", "policy"], ["du lịch", "tourism tourist travel trip visitor hotel homestay"], ["quảng cáo", "advertisement advert product brand customer claim"],
    ["trí tuệ nhân tạo", "artificial intelligence technology algorithm data machine robot"], ["chính phủ", "government regulate law rule regulation policy state authority"], ["rác thải|nhựa", "plastic waste rubbish trash bottle bag litter recycle bin straw"],
    ["chuyến đi", "trip travel visit holiday vacation beach hotel sea mountain stay"], ["sắp đến thăm|người bạn nước ngoài", "visit foreign"],
    ["kỹ năng|nghề thủ công", "skill practical craft cook repair"], ["học sinh", "student school"], ["thực tập", "internship intern position resume apply application degree experience skill"], ["vị trí", "position"],
    ["năm trước|ngày xưa", "ago before"], ["phim", "film movie subtitle"], ["lúc rảnh|thời gian rảnh", "hobby read book play sport music film movie game swim football badminton guitar draw"],
    ["công nghệ|giao tiếp", "technology phone internet online message call video social media communicate chat app smartphone"], ["quyết định", "decision decide choose choice"],
    ["ảnh hưởng", "influence teacher parent mentor"], ["giờ làm|học phí", "work tuition"]];
  const viRe = k => new RegExp("(^|[^\\p{L}])(" + k + ")(?=[^\\p{L}]|$)", "u");
  const VI_TOPIC_RE = VI_TOPIC.map(([k, en]) => [viRe(k), en]);
  // đề cho người viết tự chọn nội dung (một sản phẩm, một tin tức, một câu chuyện...): không kiểm tra lạc đề
  const OPEN_RE = viRe("một (sản phẩm|sự việc|chủ đề|tin tức|câu chuyện|lần|trải nghiệm|vấn đề|quyết định|thay đổi|sai lầm|quảng cáo|bài bình luận|nghiên cứu|thói quen|chính sách|tình huống|truyền thuyết|địa danh|địa điểm|lễ hội)|tưởng tượng|bất kỳ|tự chọn|hoặc địa điểm|đã đọc|từng đọc");
  // Chuẩn bị một đề: P = từ chủ đề lấy từ đề tiếng Việt (bỏ phần ví dụ trong ngoặc có "..."), Tp = P + mọi từ nội dung của đề và bài mẫu
  const prepTopic = (topic, ex) => { const all = Array.isArray(topic) ? topic.join("\n") : String(topic || "");
    const vi = all.normalize("NFC").toLowerCase().replace(/\([^)]*(\.\.\.|…)\s*\)/g, " ");
    const P = new Set(); VI_TOPIC_RE.forEach(([re, en]) => { if (re.test(vi)) en.split(" ").map(lem).forEach(x => { if (!ex.has(x)) P.add(x); }); });
    const Tp = lemSet(all, ex); P.forEach(x => Tp.add(x)); return { P, Tp, open: OPEN_RE.test(vi) }; };
  const overlap = (A, t) => { let hit = 0, hitP = 0; A.forEach(x => { if (t.Tp.has(x)) hit++; if (t.P.has(x)) hitP++; }); return { hit, hitP, rel: A.size ? hit / A.size : 1 }; };
  // ngân hàng đề của app (WRITING + EXAMS, nếu có): để biết bài có hợp với một đề KHÁC rõ hơn không
  let BANK = null;
  const bank = () => { if (BANK) return BANK; BANK = []; const none = new Set();
    try { if (typeof WRITING !== "undefined") Object.values(WRITING).forEach(w => BANK.push({ m: w[3], t: prepTopic(w[0] + "\n" + w[3], none) }));
      if (typeof EXAMS !== "undefined") Object.values(EXAMS).forEach(E => (E.write || []).forEach(w => BANK.push({ m: w[3], t: prepTopic(w[0] + " " + (w[4] || "") + "\n" + w[3], none) }))); } catch (e) { }
    return BANK; };
  // topic: chuỗi (đề + bài mẫu) hoặc mảng [đề, bài mẫu]
  function relevance(text, topic, kw) {
    const ex = new Set((kw || []).flatMap(k => k.toLowerCase().split(/[\/\s]+/)).filter(Boolean)); [...ex].forEach(x => ex.add(lem(x)));
    const t = prepTopic(topic, ex), A = lemSet(text, ex), o = overlap(A, t);
    // bước 1: thấp rõ so với đề (đề có chủ đề cố định ≥ 3 từ, bài đủ dài, gần như không dùng từ chủ đề)
    const low = !t.open && t.P.size >= 3 && A.size >= 8 && o.rel < 0.2 && o.hitP < Math.max(2, A.size * 0.06);
    // bước 2: nếu có ngân hàng đề, chỉ coi là lạc đề khi bài hợp với một đề khác rõ hơn hẳn (tránh gạch nhầm bài đúng đề nhưng dùng từ khác bài mẫu)
    const all = Array.isArray(topic) ? topic.join("\n") : String(topic || ""); let best = null;
    if (low) bank().forEach(b => { if (b.m && all.includes(b.m)) return; const r = overlap(A, b.t); if (!best || r.rel > best.rel) best = Object.assign(r, { m: b.m }); });
    const viaBank = low && (!best || best.rel >= Math.max(0.25, o.rel + 0.15));
    // bước 3 (không cần ngân hàng đề): bài dài mà gần như không có từ của chủ đề → lạc đề rõ ràng (bài học thuộc về đề khác, bóng đá cho đề cấm ô tô...)
    const fixed = !t.open && t.P.size >= 3, rel0 = A.size ? o.rel : 0;
    const strong = fixed && A.size >= 12 && (o.rel < 0.12 || o.hitP === 0 && o.rel < 0.2);
    // bước 4: bài "khuôn mẫu" chung chung: nhiều chữ nhưng rất ít từ nội dung, không có từ chủ đề nào
    const words = (String(text).match(/[A-Za-z]+(?:['’][a-z]+)?/g) || []).length, dens = words ? A.size / words : 0;
    const template = fixed && words >= 40 && o.hitP === 0 && rel0 < 0.2 && dens < 0.15;
    const off = viaBank || strong || template;
    return { hit: o.hit, hitP: o.hitP, n: A.size, p: t.P.size, open: t.open, rel: rel0, other: best ? best.rel : null, dens, off, why: off ? (template && !strong && !viaBank ? "generic" : "offtopic") : "" };
  }

  /* ---------- Câu trả lời nói/viết ngắn: có thành câu không, có nói về chủ đề không (cho app, ví dụ xsScore) ---------- */
  // answerCheck(text, topic, kw) → { rel 0..1, topicHits, n, words, verbs, clauses, sentence, generic }
  //   rel       : tỉ lệ từ nội dung của câu trả lời có trong chủ đề (topic = câu hỏi + bản dịch + gợi ý...; có thể là mảng)
  //   topicHits : số từ nội dung (đã đưa về gốc) trùng với chủ đề; n: số từ nội dung khác nhau (không tính từ chung chung, từ gợi ý kw)
  //   clauses   : số mệnh đề "chủ ngữ + động từ chia"; sentence = clauses ≥ 1 ("Football music movie." → false)
  //   generic   : tỉ lệ từ chức năng/từ chung chung trong câu (bài khuôn mẫu "there are good sides and bad sides..." → cao)
  const FIN = new Set(W("am is are was were be been do does did don't doesn't didn't have has had haven't hasn't can could will would should may might must shall can't cannot couldn't won't wouldn't shouldn't isn't aren't wasn't weren't"));
  function answerCheck(text, topic, kw) {
    const T = tokenize(String(text || "").normalize("NFC")), ex = new Set((kw || []).flatMap(k => k.toLowerCase().split(/[\/\s]+/)).filter(Boolean));
    const isVerb = t => { if (!t) return false; const x = t.w; return FIN.has(x) || /'(m|re|s|ve|ll|d)$/.test(x) || /n't$/.test(x) || !!THIRD[x] || !!PAST[x] || BASE_X.includes(x) || /[a-z]{3,}ed$/.test(x); };
    const isSubj = (k) => { const x = T[k].w; return SUBJ_PRON.includes(x) || /^(there|this|that|these|those|people|everyone|everybody|someone|nobody|who)$/.test(x) || NAMES.has(T[k].raw) || (k > 0 && DET.includes(T[k - 1].w) && !STOP.has(x)) || /^(i|you|he|she|it|we|they|there|that|what|who)'(m|re|s|ve|ll|d)$/.test(x); };
    let verbs = 0, clauses = 0;
    T.forEach((t, k) => { if (isVerb(t)) verbs++; if (!isSubj(k)) return; if (/'(m|re|s|ve|ll|d)$/.test(t.w)) { clauses++; return; }
      let j = k + 1; if (T[j] && /^(always|usually|often|sometimes|never|really|also|just|still|often|rarely|already|not)$/.test(T[j].w)) j++; if (T[j] && !T[j].start && isVerb(T[j])) clauses++; });
    const t = prepTopic(topic || "", ex), A = lemSet(text, ex), o = overlap(A, t);
    const gen = T.filter(x => STOP.has(x.w) || GENERIC.has(x.w)).length;
    return { rel: A.size ? +o.rel.toFixed(3) : 0, topicHits: o.hit, n: A.size, words: T.length, verbs, clauses, sentence: clauses >= 1, generic: T.length ? +(gen / T.length).toFixed(3) : 0 };
  }

  /* ---------- Rubric ---------- */
  const r5 = x => Math.max(0, Math.min(5, Math.round(x * 2) / 2));
  function score(text, T, issues, opt) {
    const n = T.length, min = opt.min || 0, kw = opt.kw || [];
    const hit1 = (t, a) => typeof kwHit === "function" ? kwHit(t, a) : (" " + t.toLowerCase() + " ").includes(a.toLowerCase());
    // dạng viết tắt và dạng đầy đủ đều được tính: should've = should have, I'd left = I had left, she's been = she has been
    const TV = expandC(text), kwHits = kw.filter(k => k.split("/").some(a => { const AV = expandC(a); return TV.some(t => AV.some(x => hit1(t, x))); }));
    const lenR = min ? Math.min(1, n / min) : 1, kwR = kw.length ? kwHits.length / kw.length : 1;
    let task = 5 * (0.5 * lenR + 0.5 * kwR); if (min && n < min * 0.5) task = Math.min(task, 2);
    const g = issues.filter(x => x.cat === "grammar").length, sp = issues.filter(x => x.cat === "spell").length, cp = issues.filter(x => x.cat === "cap" || x.cat === "punct").length, wd = issues.filter(x => x.cat === "word").length;
    const rate = (g + 0.6 * sp + 0.5 * wd + 0.4 * cp) / Math.max(n, 20) * 100;
    const gram = Math.max(0.5, 5 - rate * 0.45);
    // nhãn người nói trong hội thoại (Waiter: / Me:) không tính là từ vựng
    const isLabel = (t, k) => (k === 0 || /\n/.test(t.gap)) && T[k + 1] && /^\s*:/.test(T[k + 1].gap);
    const content = T.filter((t, k) => !isLabel(t, k)).map(t => t.w).filter(x => !STOP.has(x) && x.length > 2 && !/^\d/.test(x));
    const uniq = new Set(content), ttr = content.length ? uniq.size / content.length : 0;
    const adv = [...uniq].filter(x => typeof WMAP !== "undefined" && WMAP[x] && /^(b1|b2|c1)/.test(WMAP[x].lid)).length;
    const freq = {}; content.forEach(x => freq[x] = (freq[x] || 0) + 1);
    const rep = Object.values(freq).filter(v => v > Math.max(3, content.length / 12)).length;
    const vocab = Math.max(0.5, 1.6 + ttr * 2.2 + Math.min(1.2, adv / Math.max(1, uniq.size) * 6) - rep * 0.5 - (n < 15 ? 1 : 0));
    const low = text.toLowerCase();
    const linkTypes = new Set(T.map(t => t.w).filter(x => LINKERS.includes(x))); LINK2.forEach(l => { if (low.includes(l)) linkTypes.add(l); });
    const sents = (text.match(/[^.!?]+[.!?]+/g) || [text]).filter(s => s.trim().length > 1), avg = n / Math.max(1, sents.length);
    let coh = Math.min(2, linkTypes.size * 0.4) + (sents.length >= 3 || n < 30 ? 1 : 0.5) + (avg >= 6 && avg <= 28 ? 1 : 0.5) + (n >= 120 ? (/\n\s*\S/.test(text.trim()) ? 1 : 0.4) : 1);
    if (!/[.!?]["')]?\s*$/.test(text.trim())) coh -= 0.3;
    const crit = { task: r5(task), gram: r5(gram), vocab: r5(vocab), coh: r5(coh) };
    // bài quá ngắn (< 50% số từ yêu cầu): các tiêu chí khác cũng giảm theo tỉ lệ độ dài — 3 từ không thể được 5/5 ngữ pháp
    const short = !!(min && n < min * 0.5);
    if (short) { const capC = r5(5 * n / min); ["gram", "vocab", "coh"].forEach(k => crit[k] = Math.min(crit[k], capC)); }
    let total = Math.round((crit.task + crit.gram + crit.vocab + crit.coh) / 2 * 2) / 2;
    if (crit.gram <= 1) total = Math.min(total, 5); else if (crit.gram <= 2) total = Math.min(total, 6.5);
    if (crit.task <= 2) total = Math.min(total, 5);
    if (kw.length && kwHits.length < kw.length / 2) total = Math.min(total, 5); // chưa dùng tới một nửa nhóm từ khóa của đề
    if (short) total = Math.min(total, 2);
    const fl = opt.flags || [];
    if (fl.includes("stuffing")) { total = Math.min(total, 3); crit.vocab = Math.min(crit.vocab, 1); crit.coh = Math.min(crit.coh, 1); }
    if (fl.includes("copy")) { total = Math.min(total, 2); crit.task = Math.min(crit.task, 1); }
    if (fl.includes("offtopic")) { total = Math.min(total, 4); crit.task = Math.min(crit.task, 1); }
    if (fl.includes("vietnamese")) { total = 0; crit.task = crit.gram = crit.vocab = crit.coh = 0; }
    return { crit, total, n, short, flags: fl, kwHits, kwMiss: kw.filter(k => !kwHits.includes(k)), linkTypes: [...linkTypes], sents: sents.length, ttr };
  }

  /* ---------- Nhận xét của giáo viên ---------- */
  const CAT_TIP = { tense: "chia thì quá khứ khi kể chuyện", apos: "dấu nháy trong dạng viết tắt", sva: "chia động từ theo chủ ngữ (he/she/it + V-s/es)", be: "chia động từ to be", "be-v": "dùng to be trước động từ", modal: "động từ sau can/should/will", did: "động từ sau did/does/don't", pp: "quá khứ phân từ sau have/has", article: "mạo từ a/an", uncount: "danh từ không đếm được", plural: "danh từ số nhiều", spell: "chính tả", "cap-i": "viết hoa chữ I", "cap-start": "viết hoa đầu câu", "cap-name": "viết hoa tên riêng", comp: "so sánh", fixed: "cụm từ cố định", ving: "V-ing sau một số động từ", "for-since": "for / since", "if-will": "câu điều kiện", "although-but": "từ nối although/because", "because-so": "từ nối although/because", quant: "much / many", there: "there is / there are", "double-neg": "phủ định kép", very: "cách dùng very", repeat: "lặp từ", "double-subj": "lặp chủ ngữ", perfect: "thì hiện tại hoàn thành với since", "perfect-past": "hiện tại hoàn thành / quá khứ đơn", "to-inf": "to + động từ nguyên mẫu", "modal-have": "should have / could have", "ing-ed": "tính từ -ing / -ed", pronoun: "đại từ chủ ngữ", "used-to": "used to", stative: "động từ chỉ trạng thái", prep: "giới từ", despite: "despite / although", "because-of": "because / because of", such: "so / such", relative: "đại từ quan hệ who / which", inversion: "đảo ngữ", wish: "câu ước với wish" };
  function comment(sc, issues, opt) {
    const c = sc.crit, out = [], fl = sc.flags || [];
    if (fl.includes("vietnamese")) return "Bài viết cần viết bằng tiếng Anh. Hãy viết lại bằng tiếng Anh, có thể bắt đầu bằng những câu ngắn, đơn giản.";
    if (fl.includes("copy")) out.push("Bài viết chép lại văn bản có sẵn nên không được tính điểm cao. Hãy tự viết bằng lời của mình.");
    if (fl.includes("offtopic")) out.push("Bài viết chưa bám sát đề bài nên điểm tối đa là 4. Hãy đọc lại đề và viết đúng nội dung được hỏi.");
    if (fl.includes("stuffing")) out.push("Bài viết lặp lại từ/cụm từ hoặc chỉ liệt kê từ khóa, chưa phải đoạn văn thật nên bị giới hạn điểm.");
    if (sc.short) out.push(`Bài còn quá ngắn (${sc.n}/${opt.min} từ) nên chưa được chấm như một bài hoàn chỉnh. Hãy viết thêm ít nhất ${opt.min - sc.n} từ nữa với các ý và ví dụ cụ thể.`);
    else if (!fl.length) out.push(sc.total >= 8.5 ? "Bài viết rất tốt!" : sc.total >= 7 ? "Bài viết khá tốt." : sc.total >= 5 ? "Bài viết đạt yêu cầu cơ bản." : "Bài viết cần cải thiện thêm.");
    const names = { task: "hoàn thành yêu cầu đề bài", gram: "độ chính xác ngữ pháp", vocab: "vốn từ", coh: "sự mạch lạc" };
    const best = Object.keys(c).sort((a, b) => c[b] - c[a])[0], worst = Object.keys(c).sort((a, b) => c[a] - c[b])[0];
    if (c[best] >= 4 && !sc.short && !fl.length) out.push(`Điểm mạnh: ${names[best]}.`);
    const adv = { task: opt.min && sc.n < opt.min ? `Bài mới có ${sc.n}/${opt.min} từ, hãy viết thêm ý và ví dụ.` : "Hãy trả lời đủ các ý của đề và dùng thêm các cấu trúc gợi ý.", gram: "Hãy đọc lại từng câu, kiểm tra động từ đã chia đúng theo chủ ngữ và thì chưa.", vocab: "Hãy thay những từ lặp lại bằng từ đồng nghĩa và thử dùng từ mới đã học.", coh: "Hãy dùng thêm từ nối (first, however, because, as a result...) và chia ý thành các câu rõ ràng." };
    if (c[worst] < 4 && !sc.short) out.push(`Cần cải thiện ${names[worst]}: ${adv[worst]}`);
    const cnt = {}; issues.forEach(x => { const k = x.key; cnt[k] = (cnt[k] || 0) + 1; });
    const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).slice(0, 2).filter(k => CAT_TIP[k]);
    if (top.length) out.push("Lỗi hay gặp nhất: " + top.map(k => `${CAT_TIP[k]} (${cnt[k]} lỗi)`).join(", ") + ".");
    if (sc.kwMiss.length && opt.kw) out.push("Có thể dùng thêm: " + sc.kwMiss.map(k => "“" + (k.split("/")[0] === "ing" ? "-ing" : k.split("/")[0]) + "”").join(", ") + "." + (opt.kw.length && sc.kwHits.length < opt.kw.length / 2 ? " Bài chưa bám sát yêu cầu đề nên điểm tối đa là 5." : ""));
    if (!issues.length && sc.n >= (opt.min || 0) && !fl.length) out.push("Không phát hiện lỗi nào. Tuyệt vời!");
    return out.join(" ");
  }

  /* ---------- Hiển thị bài có gạch lỗi ---------- */
  function annotate(text, T, issues) {
    const keep = [], used = new Set();
    issues.slice().sort((a, b) => (b.glob || 0) - (a.glob || 0) || a.i - b.i || (b.j - b.i) - (a.j - a.i)).forEach(x => { for (let k = x.i; k < x.j; k++) if (used.has(k)) return; for (let k = x.i; k < x.j; k++) used.add(k); keep.push(x); });
    let html = "", pos = 0;
    keep.forEach((x, n) => { const s = T[x.i].s, e = T[x.j - 1].e; html += esc(text.slice(pos, s)) + `<mark class="m-${x.cat}" data-n="${n}" onclick="Grader.show(${n})">${esc(text.slice(s, e))}</mark>`; pos = e; });
    html += esc(text.slice(pos));
    return { html: html.replace(/\n/g, "<br>"), keep };
  }
  let LAST = [];
  function show(n) { const x = LAST[n], box = document.getElementById("errtip"); if (!x || !box) return; box.innerHTML = `<b>${esc(x.word)}</b>${x.fix ? ` → <b class="g">${esc(x.fix)}</b>` : x.fix === "" ? " → <b class=\"g\">(bỏ đi)</b>" : ""}<br>${esc(x.msg)}`; box.classList.add("on"); }

  async function grade(text, opt) {
    opt = opt || {};
    text = String(text || "").replace(/\r/g, "").normalize("NFC");
    await loadSpell();
    const T = tokenize(text);
    let issues = rules(text, T, opt).concat(spelling(T));
    // bỏ lỗi chính tả trùng chỗ với lỗi ngữ pháp
    const gpos = new Set(issues.filter(x => x.cat !== "spell").flatMap(x => Array.from({ length: x.j - x.i }, (_, k) => x.i + k)));
    issues = issues.filter(x => x.cat !== "spell" || !gpos.has(x.i));
    const lines = text.trim().split(/\n/), lastL = lines[lines.length - 1].trim(), signoff = (lines.length > 1 && lastL.split(/\s+/).length <= 4 && (/,\s*$/.test(lines[lines.length - 2]) || /^([A-ZĐ][^\s]*\s?){1,4}$/.test(lastL))) || /(regards|faithfully|sincerely|best wishes|thanks|cheers),[^.!?]{0,60}$/i.test(text.trim());
    if (text.trim() && !signoff && !/[.!?]["')]?\s*$/.test(text.trim()) && T.length) issues.push({ i: T.length - 1, j: T.length, cat: "punct", fix: T[T.length - 1].raw + ".", msg: "Câu cuối thiếu dấu chấm.", key: "punct" });
    cleanFixes(issues);
    const integ = integrity(text, T, opt);
    issues = integ.flags.includes("vietnamese") ? integ.issues : integ.issues.concat(issues);
    const sc = score(text, T, issues.filter(x => !x.glob), Object.assign({}, opt, { flags: integ.flags }));
    const ann = annotate(text, T, issues);
    LAST = ann.keep.map(x => Object.assign({ word: text.slice(T[x.i].s, T[x.j - 1].e) }, x));
    return Object.assign(sc, { issues: LAST, html: ann.html, comment: comment(sc, LAST, opt), spell: !!SP, relevance: integ.relevance || null, copyRate: integ.copyRate });
  }
  const LABEL = { grammar: "Ngữ pháp", spell: "Chính tả", cap: "Viết hoa", punct: "Dấu câu", word: "Dùng từ" };
  function report(r, opt) {
    const c = r.crit, row = (k, t, i) => `<div class="crit"><span><i class="ti ti-${i}"></i> ${t}</span><div class="bar grow"><span style="width:${c[k] * 20}%"></span></div><b>${c[k]}/5</b></div>`;
    const grp = {}; r.issues.forEach(x => (grp[x.cat] = grp[x.cat] || []).push(x));
    return `<div class="gradecard"><div class="gtop"><div class="gscore ${r.total >= 7 ? "hi" : r.total >= 5 ? "mid" : "lo"}"><b>${r.total}</b><small>/10</small></div><div class="grow"><p class="lab">Giáo viên nhận xét</p><p>${esc(r.comment)}</p></div></div>
    ${row("task", "Yêu cầu đề", "target")}${row("gram", "Ngữ pháp", "language")}${row("vocab", "Từ vựng", "vocabulary")}${row("coh", "Mạch lạc", "link")}
    <p class="lab">Bài của bạn · bấm vào chỗ gạch chân để xem cách sửa</p><div class="annot">${r.html || "<span class='muted'>(trống)</span>"}</div><div id="errtip" class="errtip"></div>
    ${r.issues.length ? `<details class="errlist"><summary>${r.issues.length} lỗi: ${Object.keys(grp).map(k => LABEL[k] + " " + grp[k].length).join(" · ")}</summary>${r.issues.map(x => `<p><span class="tagc m-${x.cat}">${LABEL[x.cat]}</span> <s>${esc(x.word)}</s>${x.fix ? " → <b>" + esc(x.fix) + "</b>" : x.fix === "" ? " → <b>(bỏ)</b>" : ""}<br><span class="sm muted">${esc(x.msg)}</span></p>`).join("")}</details>` : ""}
    ${r.spell ? "" : `<p class="sm muted">Chưa tải được từ điển chính tả, nên chưa kiểm tra chính tả.</p>`}
    <p class="sm muted">Máy chấm dựa trên tiêu chí của giáo viên: độ dài, cấu trúc, lỗi ngữ pháp thường gặp, chính tả, độ đa dạng từ và từ nối. Lỗi về ý tứ, văn phong sâu, hãy so thêm với bài mẫu.</p></div>`;
  }
  return { grade, report, show, loadSpell, tokenize, rules, validFix, ing, ed, relevance, answerCheck };
})();
