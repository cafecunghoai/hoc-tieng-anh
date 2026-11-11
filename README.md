# Tiếng Anh Từ Số 0

Webapp học tiếng Anh toàn diện từ con số 0 đến sử dụng thành thạo, theo khung tham chiếu châu Âu **CEFR** (Chặng 0 → A1 → A2 → B1 → B2 → C1).

**Học ngay:** https://cafecunghoai.github.io/hoc-tieng-anh/

## Tính năng

- **Lộ trình rõ ràng:** 54 bài (Chặng 0, A1, A2), khoảng 1.250 từ theo danh sách Oxford 3000. Đạt 80% mới mở bài tiếp theo.
- **Đủ 4 kỹ năng mỗi bài:** học từ có giọng đọc mẫu, ngữ pháp giải thích bằng tiếng Việt, nghe chọn từ, nghe chép câu, nói nhại theo (máy chấm phát âm trên Chrome), đọc hiểu, xếp câu, dịch câu, viết đoạn văn có kiểm tra từ khóa và bài mẫu.
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
js/writing.js         Đề viết đoạn văn và bài mẫu
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
