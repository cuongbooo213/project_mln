# 🎮 Kế Hoạch Nâng Cấp Game "Mật Mã Lịch Sử" - Phiên Bản Lớp Học

> **Mục tiêu:** Biến game từ trạng thái "giải đố + chat" đơn giản thành một trải nghiệm tương tác sâu giữa các thành viên trong nhóm VÀ giữa Host (Giáo viên/Quản trò) với các đội chơi.

---

## 📋 Phân Tích Hiện Trạng

### Những gì đã có:
- ✅ Hệ thống phòng, chia đội, chọn đội thủ công
- ✅ Manh mối riêng biệt cho từng người
- ✅ Chat nội bộ đội (text)
- ✅ Ô chốt đáp án chung cho đội
- ✅ Host chỉ quan sát (không chơi)
- ✅ Đồng bộ thời gian bằng Firebase Server Time

### Vấn đề cần cải thiện:
- ❌ Tương tác trong đội còn thụ động (chỉ có chat text)
- ❌ Host không có công cụ nào để can thiệp hay "khuấy động" lớp học
- ❌ Chưa có cơ chế buộc mọi người PHẢI trao đổi (có thể 1 người giải hết)
- ❌ Thiếu yếu tố cạnh tranh trực tiếp giữa các đội
- ❌ Game chạy tự động hoàn toàn, Host chỉ ngồi xem

---

## 🚀 Các Tính Năng Nâng Cấp (Ưu Tiên Theo Mức Độ)

---

### 🔥 NHÓM A: Tương Tác Nội Bộ Đội (Ưu Tiên Cao Nhất)

#### A1. Hệ Thống "Bỏ Phiếu Trước Khi Chốt" (Vote Before Submit)
**Vấn đề giải quyết:** Hiện tại bất kỳ ai cũng có thể nhập đáp án và bấm Gửi mà không cần hỏi ý kiến đồng đội.

**Cách hoạt động:**
1. Khi một thành viên muốn chốt đáp án, họ nhập đáp án vào ô và bấm **"Đề Xuất Đáp Án"** (thay vì "Gửi").
2. Đáp án đề xuất sẽ hiện lên trên màn hình của **tất cả thành viên** trong đội.
3. Mỗi người sẽ bấm **Đồng Ý ✅** hoặc **Phản Đối ❌**.
4. Nếu **quá bán** (hơn 50%) thành viên đồng ý → Đáp án được gửi chính thức.
5. Nếu bị phản đối → Đáp án bị hủy, đội phải thảo luận lại.

**Lợi ích cho lớp học:**
- Buộc cả đội phải trao đổi chứ không phải 1 người "cân" hết.
- Tạo ra các cuộc tranh luận thú vị (Ai đó đề xuất "1945" nhưng có người phản đối vì biết manh mối khác).

**Files cần sửa:**
- `SubmissionArea.jsx`: Thêm trạng thái "Đề xuất" và giao diện bỏ phiếu.
- `gameService.js`: Thêm hàm `proposeAnswer()`, `voteOnProposal()`.
- `Game.jsx`: Hiển thị thanh bỏ phiếu khi có đề xuất.

---

#### A2. Hệ Thống "Manh Mối Bị Khóa" (Locked Clues)
**Vấn đề giải quyết:** Người chơi có thể copy manh mối dán vào chat ngay lập tức mà không cần suy nghĩ.

**Cách hoạt động:**
1. Mỗi manh mối ban đầu sẽ bị **ẩn đi một phần** (Ví dụ: "Sự kiện diễn ra tại ███████, Hương Cảng").
2. Để mở khóa toàn bộ manh mối, người chơi phải trả lời đúng **1 câu hỏi nhỏ liên quan** (Mini Quiz).
3. Khi trả lời đúng → Manh mối hiện đầy đủ → Giờ mới có thể chia sẻ cho đồng đội qua chat.

**Lợi ích cho lớp học:**
- Tăng lượng kiến thức lịch sử mỗi người phải tự suy nghĩ.
- Ngăn chặn tình trạng "gửi nguyên văn manh mối" mà không đọc kỹ.

**Files cần sửa:**
- `cases.json`: Bổ sung trường `miniQuiz` cho mỗi clue.
- `Game.jsx`: Thêm lớp UI mở khóa manh mối.
- Tạo component mới `ClueCard.jsx`.

---

#### A3. Bảng Ghi Chú Chung Của Đội (Shared Notepad)
**Vấn đề giải quyết:** Chat text bị cuộn mất, khó tổng hợp thông tin.

**Cách hoạt động:**
1. Bên cạnh khung Chat, thêm một tab **"Bảng Ghi Chú"**.
2. Đây là một ô text lớn mà **tất cả thành viên** trong đội có thể cùng chỉnh sửa (realtime collaborative editing).
3. Thành viên có thể ghi lại: "Manh mối A nói về Hong Kong", "Manh mối B nói về 3 tổ chức"...
4. Khi ghép đủ, cả đội đọc lại Bảng Ghi Chú để ra đáp án.

**Lợi ích cho lớp học:**
- Rèn kỹ năng tổng hợp thông tin.
- Tạo ra sản phẩm hợp tác rõ ràng (bảng ghi chú cuối cùng).

**Files cần sửa:**
- Tạo component mới `SharedNotepad.jsx`.
- `gameService.js`: Thêm hàm `updateNotepad()`.
- `Game.jsx`: Thêm tab chuyển đổi giữa Chat và Notepad.

---

### 🎯 NHÓM B: Công Cụ Tương Tác Cho Host (Ưu Tiên Cao)

#### B1. Host Gửi Gợi Ý / Thông Báo (Host Hints)
**Vấn đề giải quyết:** Host (Giáo viên) hoàn toàn bị "câm" trong lúc game diễn ra.

**Cách hoạt động:**
1. Trên giao diện Quản trò, thêm các nút:
   - **📢 Phát Thông Báo (Broadcast):** Gửi một thông điệp tới TẤT CẢ các đội. (VD: "Còn 30 giây!", "Hãy chú ý đến nhân vật!")
   - **💡 Gợi Ý Riêng (Private Hint):** Chọn 1 đội cụ thể và gửi gợi ý riêng cho đội đó. (VD: Gợi ý cho Đội Đỏ đang bí: "Hãy nghĩ đến thập niên 30 của thế kỷ 20.")
2. Tin nhắn từ Host sẽ xuất hiện đặc biệt trong khung Chat của đội (có biểu tượng 👑 và màu vàng nổi bật).

**Lợi ích cho lớp học:**
- Giáo viên chủ động can thiệp, điều phối tiến độ lớp học.
- Có thể hỗ trợ đội yếu mà không ảnh hưởng đội mạnh.

**Files cần sửa:**
- `gameService.js`: Thêm hàm `sendHostBroadcast()`, `sendHostHint()`.
- `Game.jsx` (Host view): Thêm form gửi broadcast/hint.
- `TeamChat.jsx`: Hiển thị tin nhắn từ Host với style đặc biệt.

---

#### B2. Host Điều Khiển Nhịp Game (Game Flow Control)
**Vấn đề giải quyết:** Game tự chuyển vòng bằng timer, Host không có quyền quyết định.

**Cách hoạt động:**
1. Host có thể bấm **⏸️ Tạm Dừng (Pause)** để freeze timer cho tất cả.
2. Host có thể bấm **⏭️ Chuyển Vụ Án** thủ công thay vì chờ auto.
3. Host có thể bấm **⏱️ Thêm Thời Gian (+30s)** nếu thấy các đội cần thêm thời gian thảo luận.
4. Host có thể bấm **🔓 Mở Thêm Gợi Ý** để tung ra 1 manh mối bổ sung cho tất cả các đội (tự tạo hoặc chọn từ danh sách gợi ý có sẵn).

**Lợi ích cho lớp học:**
- Giáo viên hoàn toàn kiểm soát được nhịp game phù hợp với tốc độ tiếp thu của lớp.
- Có thể dừng game để giải thích kiến thức, sau đó tiếp tục.

**Files cần sửa:**
- `gameService.js`: Thêm hàm `pauseGame()`, `resumeGame()`, `addExtraTime()`, `revealBonusClue()`.
- `Game.jsx` (Host view): Thêm thanh điều khiển.
- `Game.jsx` (Player view): Lắng nghe trạng thái pause.

---

#### B3. Host Thưởng/Phạt Điểm Nhanh (Quick Points)
**Vấn đề giải quyết:** Host muốn thưởng điểm cho đội trả lời nhanh trong các tình huống ngoài game.

**Cách hoạt động:**
1. Trên dashboard, mỗi thẻ đội sẽ có 2 nút nhỏ: **+100** và **-50**.
2. Host bấm để cộng/trừ điểm cho đội.
3. Một notification sẽ hiện lên trên màn hình đội được thưởng/phạt: "👑 Host đã thưởng cho đội bạn +100 điểm!"

**Lợi ích cho lớp học:**
- Giáo viên có thể thưởng cho đội trật tự, hợp tác tốt.
- Phạt đội vi phạm luật (VD: xem bài đội khác).
- Tạo động lực ngoài game.

**Files cần sửa:**
- `gameService.js`: Thêm hàm `adjustTeamScore()`.
- `Game.jsx` (Host view): Thêm nút +/- điểm cho mỗi đội.
- `Game.jsx` (Player view): Hiển thị notification khi được thưởng/phạt.

---

### 🏆 NHÓM C: Cạnh Tranh Giữa Các Đội (Ưu Tiên Trung Bình)

#### C1. Hệ Thống "Cướp Đáp Án" (Steal Mechanic)
**Cách hoạt động:**
1. Khi một đội chốt đáp án **SAI**, một thông báo sẽ hiện lên cho các đội còn lại: "🚨 Đội Đỏ đã trả lời SAI!"
2. Các đội khác sẽ có một khoảng thời gian ngắn (15 giây) để bấm nút **"Cướp Đáp Án"**.
3. Đội cướp thành công được 50% số điểm (thay vì 100%).
4. Nếu cướp sai → mất 50 điểm.

**Lợi ích:** Tạo kịch tính, hồi hộp. Đội sai vẫn tạo cơ hội cho đội khác.

---

#### C2. Hiển Thị Thanh Tiến Độ Của Đội Khác (Progress Bar)
**Cách hoạt động:**
1. Trên thanh header của game, hiển thị một dải nhỏ cho thấy trạng thái của các đội khác (Không hiện chi tiết, chỉ hiện: "Đội Xanh: Đang thảo luận..." hoặc "Đội Vàng: Đã chốt đáp án!").
2. Tạo áp lực tâm lý tự nhiên → thúc đẩy trao đổi nhanh hơn.

**Lợi ích:** Tạo không khí cạnh tranh hào hứng mà không lộ đáp án.

---

#### C3. Vòng Bonus: "Đối Đầu Trực Tiếp" (Face-Off Round)
**Cách hoạt động:**
1. Sau mỗi 2-3 vụ án thường, Host có thể kích hoạt vòng **Đối Đầu**.
2. Trong vòng này, KHÔNG có manh mối chia nhỏ. Thay vào đó, một câu hỏi lịch sử sẽ hiện lên cho TẤT CẢ đội.
3. Đội nào bấm **Buzzer (Chuông)** trước sẽ được quyền trả lời.
4. Trả lời đúng: +500 điểm. Trả lời sai: -200 điểm và quyền trả lời chuyển cho đội bấm chuông tiếp theo.

**Lợi ích:** Phá vỡ nhịp game đều đều, tạo cao trào cho lớp học.

---

## 📊 Lộ Trình Triển Khai (Đề Xuất)

| Giai Đoạn | Tính Năng | Độ Phức Tạp | Ưu Tiên |
|-----------|-----------|-------------|---------|
| **Sprint 1** | B1. Host Gợi Ý / Thông Báo | Thấp | ⭐⭐⭐ |
| **Sprint 1** | B2. Host Điều Khiển Nhịp Game | Trung bình | ⭐⭐⭐ |
| **Sprint 1** | B3. Host Thưởng/Phạt Điểm | Thấp | ⭐⭐⭐ |
| **Sprint 2** | A1. Bỏ Phiếu Trước Khi Chốt | Trung bình | ⭐⭐⭐ |
| **Sprint 2** | C2. Thanh Tiến Độ Đội Khác | Thấp | ⭐⭐ |
| **Sprint 3** | A3. Bảng Ghi Chú Chung | Trung bình | ⭐⭐ |
| **Sprint 3** | C1. Cướp Đáp Án | Cao | ⭐⭐ |
| **Sprint 4** | A2. Manh Mối Bị Khóa | Cao | ⭐ |
| **Sprint 4** | C3. Vòng Đối Đầu | Cao | ⭐ |

> **Ghi chú:** Sprint 1 (Công cụ Host) nên làm trước vì nó giúp Giáo viên có quyền kiểm soát lớp học ngay lập tức, và độ phức tạp thấp nhất.

---

## 💡 Tổng Kết

Sau khi triển khai đầy đủ, luồng chơi của một vụ án trong lớp học sẽ trông như sau:

1. 🎓 **Host** bấm Bắt Đầu → Hiện vụ án mới.
2. 🔒 Mỗi người nhận **manh mối bị khóa** → phải trả lời mini quiz để mở.
3. 💬 Mở xong → nhắn tin hoặc **ghi vào Bảng Ghi Chú Chung** cho cả đội đọc.
4. 📢 Host thấy đội nào bí → **gửi gợi ý riêng** cho đội đó.
5. ⏱️ Host thấy cả lớp cần thêm thời gian → bấm **+30s**.
6. 🗳️ Một bạn đề xuất đáp án "1930" → Cả đội **bỏ phiếu** đồng ý/phản đối.
7. ✅ Quá bán đồng ý → Đáp án được gửi!
8. 🚨 Đội Xanh trả lời sai → Đội Đỏ có cơ hội **cướp đáp án**!
9. 🏆 Hết vụ án → Host **thưởng +100** cho đội hợp tác tốt nhất.
10. 🔥 Sau 2 vụ án → Host kích hoạt vòng **Đối Đầu Buzzer** cho thêm phần kịch tính!
