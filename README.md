# Tiếng Anh Từ Số 0

Webapp học tiếng Anh toàn diện từ con số 0 đến sử dụng thành thạo, theo khung tham chiếu châu Âu **CEFR** (Chặng 0 → A1 → A2 → B1 → B2 → C1).

**116 bài · khoảng 2.450 từ · 56 chủ điểm ngữ pháp · 5 đề thi thử A1–C1 · 4 trò chơi**

**Học ngay:** https://cafecunghoai.github.io/hoc-tieng-anh/

## Tính năng

- **Lộ trình rõ ràng:** 116 bài từ Chặng 0 đến C1, bám danh sách từ Oxford 3000/5000. Đạt 80% mới mở bài tiếp theo; có bài thi qua chặng và bài kiểm tra đầu vào 22 câu.
- **Đủ 4 kỹ năng mỗi bài:** học từ có giọng đọc mẫu, ngữ pháp giải thích bằng tiếng Việt, nghe chọn từ, nghe chép câu, nói nhại theo (máy chấm phát âm trên Chrome), đọc hiểu, xếp câu, dịch câu, viết đoạn văn có kiểm tra từ khóa và bài mẫu.
- **Ngữ pháp riêng:** 56 chủ điểm từ A1 đến C1, mỗi chủ điểm có giải thích tiếng Việt và 8 câu luyện (chọn đáp án, điền từ, tìm lỗi sai, viết lại câu) kèm lời giải. Mỗi cấp có bài kiểm tra 15 câu.
- **Chấm như giáo viên:** bài viết và câu trả lời nói được chấm theo 4 tiêu chí (hoàn thành đề, ngữ pháp, từ vựng, mạch lạc), gạch chân từng lỗi kèm cách sửa: chính tả, viết hoa, dấu câu, chia động từ, thì, mạo từ, lỗi người Việt hay mắc.
- **Thi thử theo khung CEFR:** đề A1–C1 đủ 5 phần Nghe, Đọc, Ngữ pháp & Từ vựng, Viết, Nói; có giờ làm bài, giới hạn 2 lần nghe, đề trộn mỗi lần thi. Đạt từ 60% (không kỹ năng nào dưới 40%) thì nhận chứng nhận in được.
- **Ôn từ thông minh:** nhắc lại sau 1, 2, 4, 7, 15, 30, 60 ngày (lặp lại ngắt quãng).
- **Sửa lỗi:** câu sai quay lại cuối bài; sổ lỗi sai để luyện lại.
- **Trò chơi gợi nhớ:** Vườn từ vựng, Phiên chợ quê, Chuyến xe về quê (miền Tây, xuyên Việt), Lật thẻ hội chợ.
- **Động lực:** kế hoạch mỗi ngày, chuỗi ngày học, điểm XP, cấp độ, 20 huy hiệu.
- **Tiện dụng:** cài lên điện thoại như app, chạy được khi không có mạng, chế độ tối, sao lưu tiến độ ra tệp.

## Cấu trúc

```
index.html            Trang chính
css/style.css         Giao diện
js/data-core.js       Chặng 0, A1, bài kiểm tra đầu vào
js/data-a2.js         Chặng A2
js/data-b1.js         Chặng B1 (kèm đề viết)
js/data-b2.js         Chặng B2 (kèm đề viết)
js/data-c1.js         Chặng C1 (kèm đề viết)
js/writing.js         Đề viết đoạn văn và bài mẫu
js/grammar-a.js       Ngữ pháp A1–A2
js/grammar-b.js       Ngữ pháp B1–C1
js/exams.js           Đề thi thử A1–C1
js/grader.js          Bộ chấm bài viết kiểu giáo viên
js/study.js           Trang Ngữ pháp, Thi thử, chứng nhận
js/vendor/spell.js    Kiểm tra chính tả (nspell + từ điển Hunspell en_US)
js/app.js             Logic học, ôn tập, tiến độ
js/games.js           Trò chơi
js/icons.js           Bộ icon (Tabler Icons, MIT)
sw.js                 Chạy offline
```

## Thêm bài học

Mỗi bài trong `js/data-*.js` có dạng:

```js
{ t: "Tên bài",
  w: "word=nghĩa;word2=nghĩa 2",          // từ mới
  g: `<h4>Ngữ pháp</h4><p>...</p>`,         // giải thích
  s: ["English sentence.|Câu tiếng Việt."],  // câu mẫu
  r: { t: "Bài đọc...", q: ["Câu hỏi?|Đáp án đúng|Sai 1|Sai 2"] } }
```

## Chạy trên máy

Mở thư mục bằng một máy chủ tĩnh bất kỳ, ví dụ `python -m http.server`, rồi vào `http://localhost:8000`.

## Nguồn tham khảo

- Cambridge English – số giờ học có hướng dẫn cho từng trình độ CEFR.
- Oxford 3000 / 5000 – danh sách từ cốt lõi theo trình độ.
- Nghiên cứu về lặp lại ngắt quãng (spaced repetition) và kỹ thuật nói nhại (shadowing).

## Giấy phép bên thứ ba

- Tabler Icons – MIT.
- nspell – MIT.
- Từ điển dictionary-en (Hunspell en_US, SCOWL) – giấy phép MIT/BSD kèm trong gói.

## Kiểm tra chất lượng

Xem [docs/NHAT-KY-KIEM-TRA.md](docs/NHAT-KY-KIEM-TRA.md).
