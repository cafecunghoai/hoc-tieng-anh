"use strict";
/* ================== Chấm bài viết như giáo viên ==================
   - Chính tả: Hunspell (nspell + từ điển en_US), chấp nhận cả cách viết Anh – Anh
   - Ngữ pháp: bộ luật bắt các lỗi người Việt hay mắc
   - Rubric 4 tiêu chí (0–5): Hoàn thành yêu cầu, Ngữ pháp & chính tả, Từ vựng, Mạch lạc → thang 10 */
const Grader = (() => {
  let SP = null, loading = null;
  const EXTRA = "Vietnam Vietnamese Hanoi Saigon Hue Hoi An Danang Nang Da Lat Dalat Can Tho Mekong Ben Tre Vung Tau Nha Trang Ha Long Sapa Fansipan Giang Ninh Binh Phu Quoc Mui Ne Tet pho banh mi chung ao dai dong Nguyen Tran Le Pham Hoang Huynh Phan Vu Vo Dang Bui Do Ho Ngo Duong Ly Lan Mai Hoa Minh Nam Tuan Hung Linh Trang Thao Huong Long Hai Duc Phong Vy Khoa Quan Hanh Thu Tam Chau Ha Huy Kenji Emma Tom Anna IELTS TOEIC CV Cai Rang Ca Mau Kien Quang Thanh Duong Binh Dinh Tay Ninh Hai Phong Bac un mis al ise ize dis inter enquire enquiry enquiries cosy maths café cafe rebook reframe robusta utopian hominem unaffordable unconfident homestay homestays app apps email emails online offline website smartphone laptop TikTok YouTube Facebook Zalo okay OK Wi-Fi wifi internet e-commerce selfie vlog blog".split(" ");
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
  const BASE = W("go do have like love want need work live play study watch eat drink make take get know think say come see look use find give tell feel try leave call help start finish teach speak read write run walk sleep cook buy sell open close travel visit enjoy hate prefer believe remember understand learn hope agree wash miss fly cry carry stay pay wait ask answer change move bring send spend win lose meet sit stand drive ride swim sing dance listen talk decide become begin");
  const third = v => ({ go: "goes", do: "does", have: "has" })[v] || (/(s|sh|ch|x|z|o)$/.test(v) ? v + "es" : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + "ies" : v + "s");
  const THIRD = {}; BASE.forEach(v => THIRD[third(v)] = v);
  const PAST = { went: "go", did: "do", had: "have", made: "make", took: "take", got: "get", knew: "know", thought: "think", said: "say", came: "come", saw: "see", found: "find", gave: "give", told: "tell", felt: "feel", left: "leave", taught: "teach", spoke: "speak", wrote: "write", ran: "run", slept: "sleep", bought: "buy", sold: "sell", ate: "eat", drank: "drink", understood: "understand", flew: "fly", paid: "pay", brought: "bring", sent: "send", spent: "spend", won: "win", lost: "lose", met: "meet", sat: "sit", stood: "stand", drove: "drive", rode: "ride", swam: "swim", sang: "sing", became: "become", began: "begin", broke: "break", chose: "choose", forgot: "forget", fell: "fall", grew: "grow", threw: "throw", wore: "wear", woke: "wake", stole: "steal" };
  ["liked", "loved", "wanted", "needed", "worked", "lived", "played", "studied", "watched", "cooked", "visited", "enjoyed", "started", "finished", "helped", "called", "walked", "talked", "listened", "travelled", "traveled", "decided", "stayed", "moved", "changed", "tried", "learned", "learnt", "opened", "closed", "waited", "asked", "answered"].forEach(p => { const b = p.replace(/ied$/, "y").replace(/lled$/, "l").replace(/ed$/, "").replace(/(lov|liv|mov|chang|clos|decid|lik)$/, "$1e"); PAST[p] = b === "learnt" ? "learn" : b; });
  const PP = { went: "gone", came: "come", saw: "seen", ate: "eaten", did: "done", wrote: "written", took: "taken", gave: "given", broke: "broken", spoke: "spoken", began: "begun", drank: "drunk", drove: "driven", ran: "run", swam: "swum", knew: "known", flew: "flown", grew: "grown", threw: "thrown", chose: "chosen", forgot: "forgotten", fell: "fallen", rode: "ridden", sang: "sung", stole: "stolen", woke: "woken", wore: "worn", became: "become" };
  const MODALS = W("can could should must will would may might shall 'll");
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

  /* ---------- Tách từ ---------- */
  function tokenize(text) {
    const toks = []; const re = /\d+(?:st|nd|rd|th|s)?|[A-Za-zÀ-ÿ]+(?:[-'’][A-Za-zÀ-ÿ]+)*/g; let m;
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
  function rules(text, T) {
    const out = [], add = (i, j, cat, fix, msg, key) => out.push({ i, j, cat, fix, msg, key: key || cat });
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
      const nounSg = (SING_N.includes(a) || (a.length > 2 && !/s$/.test(a) && !STOP.has(a) && !PL_IRR.includes(a) && !BASE.includes(a) && !COMP.includes(a) && !ADJ.includes(a) && !/(ly|ing|ed|est|er|ful|ous|ive|al|ic|ble)$/.test(a))) && DET.includes(prev) && !PREP.includes(w(i - 2)) && b !== "like";
      const sentTxt = (() => { let s0 = i; while (s0 > 0 && !T[s0].start) s0--; let e0 = i + 1; while (e0 < T.length && !T[e0].start) e0++; return T.slice(s0, e0).map(t => t.w).join(" "); })();
      const subjunctive = prev === "that" && /\b(insist|suggest|recommend|demand|essential|important|vital|propose|request|require|crucial)/.test(sentTxt);
      const subj3 = (["he", "she", "it"].includes(a) || nounSg) && !subjunctive;
      if (subj3 && !AUX_BEFORE.includes(prev) && !(nounSg && AUX_BEFORE.includes(w(i - 2)))) {
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
      if (["everyone", "everybody", "nobody", "someone", "somebody", "anyone"].includes(a) && ["are", "were", "have"].includes(b)) add(i + 1, i + 2, "grammar", { are: "is", were: "was", have: "has" }[b], `${T[i].raw} đi với động từ số ít.`, "sva");
      if (a === "people" && ["is", "was", "has"].includes(b)) add(i + 1, i + 2, "grammar", { is: "are", was: "were", has: "have" }[b], "People là số nhiều.", "sva");
      // to be + động từ nguyên mẫu
      if (["am", "is", "are", "was", "were", "'m", "'s", "'re"].includes(a) || /'(m|re)$/.test(a)) {
        if (b === "agree") add(i, i + 2, "grammar", (prev || "I") === "i" ? "agree" : "agree", "Agree là động từ: nói 'I agree', không nói 'I am agree'.", "be-v");
        else if (BE_V.includes(b) && w(i + 2) !== "to") add(i, i + 2, "grammar", b + "ing / " + b, "Sau to be không dùng động từ nguyên mẫu. Dùng V-ing (đang làm) hoặc bỏ to be.", "be-v");
      }
      // modal
      if (MODALS.includes(a) || a.endsWith("'ll")) {
        if (b === "to" && BASE.includes(c)) add(i + 1, i + 2, "grammar", "", `Sau ${T[i].raw} không dùng 'to'.`, "modal");
        else if (THIRD[b] || PAST[b] || (b.endsWith("ing") && BASE.includes(b.replace(/ing$/, "")))) add(i + 1, i + 2, "grammar", THIRD[b] || PAST[b] || b.replace(/ing$/, ""), `Sau ${T[i].raw} dùng động từ nguyên mẫu.`, "modal");
      }
      // did/does/do not + quá khứ hoặc -s
      if (["didn't", "doesn't", "don't", "did", "does"].includes(a) || (["did", "does", "do"].includes(a) && b === "not")) {
        const k = b === "not" ? i + 2 : i + 1, v = w(k);
        if (PAST[v] && !["did", "had"].includes(v)) add(k, k + 1, "grammar", PAST[v], `Sau ${a}${b === "not" ? " not" : ""} dùng động từ nguyên mẫu: ${PAST[v]}.`, "did");
        else if (THIRD[v] && !["does", "has", "is"].includes(v) && ["didn't", "doesn't", "don't"].includes(a)) add(k, k + 1, "grammar", THIRD[v], `Sau ${a} dùng động từ nguyên mẫu: ${THIRD[v]}.`, "did");
      }
      // have + quá khứ đơn
      if (["have", "has", "had", "'ve", "haven't", "hasn't"].includes(a) || /'ve$/.test(a)) {
        if (PP[b]) add(i + 1, i + 2, "grammar", PP[b], `Sau have/has/had dùng quá khứ phân từ (V3): ${PP[b]}.`, "pp");
      }
      // so sánh kép
      if (a === "more" && COMP.includes(b)) add(i, i + 1, "grammar", "", `${T[i + 1].raw} đã là so sánh hơn, bỏ 'more'.`, "comp");
      if (a === "most" && SUP.includes(b)) add(i, i + 1, "grammar", "", `${T[i + 1].raw} đã là so sánh nhất, bỏ 'most'.`, "comp");
      if (a === "very" && ["like", "love", "enjoy", "want", "hate", "likes", "loves", "enjoys"].includes(b)) add(i, i + 2, "word", "really " + b, "Không dùng 'very' trước động từ. Dùng 'really like' hoặc 'like ... very much'.", "very");
      // a / an
      const proper = /^A/.test(T[i].raw) && !T[i].start && T[i].raw !== "A" ? true : (T[i].raw === "An" || T[i].raw === "A") && !T[i].start;
      if (!proper) {
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
      if (a === "there" && b === "are" && ["a", "an", "one"].includes(c)) add(i + 1, i + 2, "grammar", "is", "Một vật → There is.", "there");
      // cụm cố định
      const two = a + " " + b, three = two + " " + c;
      const FIX2 = { "discuss about": ["discuss", "Discuss không đi với about."], "discussed about": ["discussed", "Discuss không đi với about."], "married with": ["married to", "Kết hôn với: married to."], "depend of": ["depend on", "Depend on."], "depends of": ["depends on", "Depend on."], "despite of": ["despite", "Despite không đi với of (hoặc dùng in spite of)."], "listen music": ["listen to music", "Listen to + danh từ."], "explain me": ["explain to me", "Explain to sb."], "say me": ["tell me", "Say không có tân ngữ người; dùng tell me."], "said me": ["told me", "Say không có tân ngữ người; dùng told me."], "every days": ["every day", "Every + danh từ số ít."], "borrow me": ["lend me", "Cho ai mượn: lend sb."], "according me": ["in my opinion", "Nói ý kiến mình: In my opinion."], "arrive to": ["arrive in / arrive at", "Arrive in + thành phố, arrive at + địa điểm."], "arrived to": ["arrived in / arrived at", "Arrive in + thành phố, arrive at + địa điểm."], "go to home": ["go home", "Home không cần to: go home."], "went to home": ["went home", "Home không cần to: went home."], "make homework": ["do homework", "Collocation đúng: do homework."], "make exercise": ["do exercise", "Collocation đúng: do exercise."], "make research": ["do research", "Collocation đúng: do research."], "do mistakes": ["make mistakes", "Collocation đúng: make mistakes."], "do a mistake": ["make a mistake", "Collocation đúng: make a mistake."], "did a mistake": ["made a mistake", "Collocation đúng: make a mistake."], "do a decision": ["make a decision", "Collocation đúng: make a decision."], "make a photo": ["take a photo", "Chụp ảnh: take a photo."], "make photos": ["take photos", "Chụp ảnh: take photos."] };
      const FIX3 = { "in the other": ["on the other", "Cụm đúng: on the other hand."], "according to me": ["in my opinion", "Không nói 'according to me'; dùng In my opinion."], "although it but": null };
      if (FIX2[two] && sameSent(i, i + 1)) add(i, i + 2, two.startsWith("make") || two.includes("mistake") || two.includes("decision") || two.includes("photo") ? "word" : "grammar", FIX2[two][0], FIX2[two][1], "fixed");
      if (FIX3[three] && sameSent(i, i + 2)) add(i, i + 3, "grammar", FIX3[three][0], FIX3[three][1], "fixed");
      if (["look", "looking", "looks"].includes(a) && b === "forward" && c === "to" && BASE.includes(w(i + 3))) add(i + 3, i + 4, "grammar", w(i + 3) + "ing", "Look forward to + V-ing.", "ving");
      if (["enjoy", "enjoys", "avoid", "avoids", "finish", "finished", "mind", "suggest", "suggested"].includes(a) && b === "to" && BASE.includes(c)) add(i + 1, i + 3, "grammar", c + "ing", `${T[i].raw} + V-ing.`, "ving");
      if (a === "since" && /^\d+$/.test(b) && +b < 100 && ["years", "months", "days", "weeks", "hours"].includes(c)) add(i, i + 1, "grammar", "for", "Khoảng thời gian dùng for, mốc thời gian dùng since.", "for-since");
      if (a === "for" && /^(19|20)\d\d$/.test(b)) add(i, i + 1, "grammar", "since", "Mốc thời gian (năm) dùng since.", "for-since");
      if (a === "if" && ["i", "you", "he", "she", "it", "we", "they"].includes(b) && c === "will") add(i + 2, i + 3, "grammar", "", "Mệnh đề if (điều kiện loại 1) không dùng will.", "if-will");
      if (/n't$|^not$/.test(a) && ["nothing", "nobody", "nowhere", "never"].includes(b)) add(i + 1, i + 2, "grammar", { nothing: "anything", nobody: "anybody", nowhere: "anywhere", never: "ever" }[b], "Tiếng Anh không dùng hai từ phủ định trong cùng một câu.", "double-neg");
      if (a === b && !["that", "had", "very", "really", "so"].includes(a)) add(i + 1, i + 2, "grammar", "", `Lặp từ '${T[i].raw}'.`, "repeat");
    }
    // thì quá khứ: câu kể có mốc quá khứ mà động từ chia hiện tại
    const sents = splitSent(T); let pastCtx = false;
    const toPast = v => { for (const k in PAST) if (PAST[k] === v && !/ed$/.test(k)) return k; return /e$/.test(v) ? v + "d" : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + "ied" : v + "ed"; };
    sents.forEach(([s0, e0]) => {
      const txt = T.slice(s0, e0).map(t => t.fixw || t.w).join(" ");
      if (PRES_MARK.test(txt) || /\b(am|is|are)\b/.test(txt)) pastCtx = false; else if (PAST_MARK.test(txt)) pastCtx = true;
      if (!pastCtx) return;
      for (let i = s0; i < e0 - 1; i++) {
        const a = wv(i), b = wv(i + 1), prev = wv(i - 1);
        const subj = ["i", "you", "we", "they", "he", "she", "it"].includes(a) || (DET.includes(prev) && (SING_N.includes(a) || /s$/.test(a)) && !STOP.has(a));
        if (!subj || AUX_BEFORE.includes(prev) || ["that", "who"].includes(prev)) continue;
        const base = BASE.includes(b) ? b : THIRD[b];
        const dup = out.find(x => x.i === i + 1);
        if (dup && dup.key === "sva" && base) { dup.fix = toPast(base); dup.msg = `Đoạn này kể chuyện đã qua → dùng quá khứ đơn: ${toPast(base)}.`; dup.key = "tense"; continue; }
        if (base && STATE_V.includes(base)) continue;
        if (base && !["have", "do", "has", "does", "is"].includes(b) && !dup) add(i + 1, i + 2, "grammar", toPast(base), `Đoạn này kể chuyện đã qua → dùng quá khứ đơn: ${toPast(base)}.`, "tense");
      }
    });
    // although ... but / because ... so trong cùng câu
    sents.forEach(([s, e]) => {
      const ws = T.slice(s, e).map(t => t.w);
      const ia = ws.findIndex(x => x === "although" || x === "though" || x === "even"), ib = ws.indexOf("but");
      if (ia >= 0 && ib > ia && (ws[ia] !== "even" || ws[ia + 1] === "though")) add(s + ib, s + ib + 1, "grammar", "", "Đã có although thì không dùng but trong cùng câu.", "although-but");
      const ic = ws.indexOf("because"), is = ws.indexOf("so");
      if (ic >= 0 && is > ic && !["much", "many", "that"].includes(ws[is + 1])) add(s + is, s + is + 1, "grammar", "", "Đã có because thì không dùng so trong cùng câu.", "because-so");
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
    T.forEach((t, i) => {
      if (/^\d/.test(t.w) || t.raw.length < 2 || t.skip) return;
      const ov = OVER[t.raw.toLowerCase()];
      if (ov) { out.push({ i, j: i + 1, cat: "grammar", fix: /^[A-Z]/.test(t.raw) ? ov[0].toUpperCase() + ov.slice(1) : ov, msg: /ed$/.test(t.raw.toLowerCase()) ? "Động từ bất quy tắc, không thêm -ed." : /(tion|vice|ture|work|gage|ment|ledge)s$/.test(t.raw.toLowerCase()) ? "Danh từ không đếm được, không thêm -s." : "Danh từ số nhiều bất quy tắc.", key: "irreg" }); return; }
      if (/^[A-Z]/.test(t.raw) && !t.start) return; // tên riêng
      const parts = t.raw.replace(/’/g, "'").split("-");
      const bad = parts.some(p => { if (!p) return false; const base = p.replace(/'s$/i, ""); return !(okWord(base) || (typeof CONTR !== "undefined" && CONTR[p.toLowerCase()])); });
      if (bad) { const sug = SP.suggest(t.raw).slice(0, 2); out.push({ i, j: i + 1, cat: "spell", fix: sug.join(" / "), msg: sug.length ? "Sai chính tả." : "Từ này không có trong từ điển. Kiểm tra lại chính tả.", key: "spell" }); }
    });
    return out;
  }

  /* ---------- Rubric ---------- */
  const r5 = x => Math.max(0, Math.min(5, Math.round(x * 2) / 2));
  function score(text, T, issues, opt) {
    const n = T.length, min = opt.min || 0, kw = opt.kw || [];
    const kwHits = kw.filter(k => k.split("/").some(a => typeof kwHit === "function" ? kwHit(text, a) : text.toLowerCase().includes(a.toLowerCase())));
    const lenR = min ? Math.min(1, n / min) : 1, kwR = kw.length ? kwHits.length / kw.length : 1;
    let task = 5 * (0.5 * lenR + 0.5 * kwR); if (min && n < min * 0.5) task = Math.min(task, 2);
    const g = issues.filter(x => x.cat === "grammar").length, sp = issues.filter(x => x.cat === "spell").length, cp = issues.filter(x => x.cat === "cap" || x.cat === "punct").length, wd = issues.filter(x => x.cat === "word").length;
    const rate = (g + 0.6 * sp + 0.5 * wd + 0.4 * cp) / Math.max(n, 20) * 100;
    const gram = Math.max(0.5, 5 - rate * 0.45);
    const content = T.map(t => t.w).filter(x => !STOP.has(x) && x.length > 2 && !/^\d/.test(x));
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
    let total = Math.round((crit.task + crit.gram + crit.vocab + crit.coh) / 2 * 2) / 2;
    if (crit.gram <= 1) total = Math.min(total, 5); else if (crit.gram <= 2) total = Math.min(total, 6.5);
    if (crit.task <= 2) total = Math.min(total, 5);
    return { crit, total, n, kwHits, kwMiss: kw.filter(k => !kwHits.includes(k)), linkTypes: [...linkTypes], sents: sents.length, ttr };
  }

  /* ---------- Nhận xét của giáo viên ---------- */
  const CAT_TIP = { tense: "chia thì quá khứ khi kể chuyện", apos: "dấu nháy trong dạng viết tắt", sva: "chia động từ theo chủ ngữ (he/she/it + V-s/es)", be: "chia động từ to be", "be-v": "dùng to be trước động từ", modal: "động từ sau can/should/will", did: "động từ sau did/does/don't", pp: "quá khứ phân từ sau have/has", article: "mạo từ a/an", uncount: "danh từ không đếm được", plural: "danh từ số nhiều", spell: "chính tả", "cap-i": "viết hoa chữ I", "cap-start": "viết hoa đầu câu", "cap-name": "viết hoa tên riêng", comp: "so sánh", fixed: "cụm từ cố định", ving: "V-ing sau một số động từ", "for-since": "for / since", "if-will": "câu điều kiện", "although-but": "từ nối although/because", "because-so": "từ nối although/because", quant: "much / many", there: "there is / there are", "double-neg": "phủ định kép", very: "cách dùng very", repeat: "lặp từ" };
  function comment(sc, issues, opt) {
    const c = sc.crit, out = [];
    out.push(sc.total >= 8.5 ? "Bài viết rất tốt!" : sc.total >= 7 ? "Bài viết khá tốt." : sc.total >= 5 ? "Bài viết đạt yêu cầu cơ bản." : "Bài viết cần cải thiện thêm.");
    const names = { task: "hoàn thành yêu cầu đề bài", gram: "độ chính xác ngữ pháp", vocab: "vốn từ", coh: "sự mạch lạc" };
    const best = Object.keys(c).sort((a, b) => c[b] - c[a])[0], worst = Object.keys(c).sort((a, b) => c[a] - c[b])[0];
    if (c[best] >= 4) out.push(`Điểm mạnh: ${names[best]}.`);
    const adv = { task: opt.min && sc.n < opt.min ? `Bài mới có ${sc.n}/${opt.min} từ, hãy viết thêm ý và ví dụ.` : "Hãy trả lời đủ các ý của đề và dùng thêm các cấu trúc gợi ý.", gram: "Hãy đọc lại từng câu, kiểm tra động từ đã chia đúng theo chủ ngữ và thì chưa.", vocab: "Hãy thay những từ lặp lại bằng từ đồng nghĩa và thử dùng từ mới đã học.", coh: "Hãy dùng thêm từ nối (first, however, because, as a result...) và chia ý thành các câu rõ ràng." };
    if (c[worst] < 4) out.push(`Cần cải thiện ${names[worst]}: ${adv[worst]}`);
    const cnt = {}; issues.forEach(x => { const k = x.key; cnt[k] = (cnt[k] || 0) + 1; });
    const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).slice(0, 2).filter(k => CAT_TIP[k]);
    if (top.length) out.push("Lỗi hay gặp nhất: " + top.map(k => `${CAT_TIP[k]} (${cnt[k]} lỗi)`).join(", ") + ".");
    if (sc.kwMiss.length && opt.kw) out.push("Có thể dùng thêm: " + sc.kwMiss.map(k => "“" + k.split("/")[0] + "”").join(", ") + ".");
    if (!issues.length && sc.n >= (opt.min || 0)) out.push("Không phát hiện lỗi nào. Tuyệt vời!");
    return out.join(" ");
  }

  /* ---------- Hiển thị bài có gạch lỗi ---------- */
  function annotate(text, T, issues) {
    const keep = [], used = new Set();
    issues.slice().sort((a, b) => a.i - b.i || (b.j - b.i) - (a.j - a.i)).forEach(x => { for (let k = x.i; k < x.j; k++) if (used.has(k)) return; for (let k = x.i; k < x.j; k++) used.add(k); keep.push(x); });
    let html = "", pos = 0;
    keep.forEach((x, n) => { const s = T[x.i].s, e = T[x.j - 1].e; html += esc(text.slice(pos, s)) + `<mark class="m-${x.cat}" data-n="${n}" onclick="Grader.show(${n})">${esc(text.slice(s, e))}</mark>`; pos = e; });
    html += esc(text.slice(pos));
    return { html: html.replace(/\n/g, "<br>"), keep };
  }
  let LAST = [];
  function show(n) { const x = LAST[n], box = document.getElementById("errtip"); if (!x || !box) return; box.innerHTML = `<b>${esc(x.word)}</b>${x.fix ? ` → <b class="g">${esc(x.fix)}</b>` : x.fix === "" ? " → <b class=\"g\">(bỏ đi)</b>" : ""}<br>${esc(x.msg)}`; box.classList.add("on"); }

  async function grade(text, opt) {
    opt = opt || {};
    text = String(text || "").replace(/\r/g, "");
    await loadSpell();
    const T = tokenize(text);
    let issues = rules(text, T).concat(spelling(T));
    // bỏ lỗi chính tả trùng chỗ với lỗi ngữ pháp
    const gpos = new Set(issues.filter(x => x.cat !== "spell").flatMap(x => Array.from({ length: x.j - x.i }, (_, k) => x.i + k)));
    issues = issues.filter(x => x.cat !== "spell" || !gpos.has(x.i));
    const lines = text.trim().split(/\n/), lastL = lines[lines.length - 1].trim(), signoff = (lines.length > 1 && lastL.split(/\s+/).length <= 4 && (/,\s*$/.test(lines[lines.length - 2]) || /^([A-ZĐ][^\s]*\s?){1,4}$/.test(lastL))) || /(regards|faithfully|sincerely|best wishes|thanks|cheers),[^.!?]{0,60}$/i.test(text.trim());
    if (text.trim() && !signoff && !/[.!?]["')]?\s*$/.test(text.trim()) && T.length) issues.push({ i: T.length - 1, j: T.length, cat: "punct", fix: T[T.length - 1].raw + ".", msg: "Câu cuối thiếu dấu chấm.", key: "punct" });
    const sc = score(text, T, issues, opt);
    const ann = annotate(text, T, issues);
    LAST = ann.keep.map(x => Object.assign({ word: text.slice(T[x.i].s, T[x.j - 1].e) }, x));
    return Object.assign(sc, { issues: LAST, html: ann.html, comment: comment(sc, LAST, opt), spell: !!SP });
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
  return { grade, report, show, loadSpell, tokenize, rules };
})();
