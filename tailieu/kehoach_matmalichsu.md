# Kế hoạch Phát triển Game: MẬT MÃ LỊCH SỬ

## 1. Tổng quan Dự án (Project Overview)
- **Tên Game**: Mật Mã Lịch Sử
- **Thể loại**: Multiplayer Historical Detective / Logic Puzzle
- **Mục tiêu**: Xây dựng một game giải đố nhiều người chơi về Lịch sử Đảng, tập trung vào kỹ năng làm việc nhóm, giao tiếp, tư duy logic và kiến thức lịch sử.

## 2. Gameplay Cơ bản (Core Gameplay Loop)
Cách chơi được thiết kế xoay quanh sự tương tác và suy luận nhóm:
1. **Tham gia phòng**: Nhiều người cùng vào một phòng thông qua mã phòng (Room Code).
2. **Chia đội**: Người chơi được chia thành các đội khác nhau (ví dụ: Đội Đỏ, Đội Xanh...).
3. **Nhận nhiệm vụ**: Game đưa ra các câu đố và manh mối lịch sử.
4. **Phân phối thông tin (Core Mechanic)**: Mỗi thành viên trong đội nhận được các mảnh thông tin **khác nhau**.
   - *Ví dụ: Người A biết Mốc thời gian, người B biết Nhân vật, người C biết Địa điểm, người D biết Văn kiện.*
5. **Trao đổi & Suy luận**: 
   - Các thành viên bắt buộc phải giao tiếp, chat và trao đổi thông tin với nhau.
   - Ghép nối dữ kiện: `Thời gian + Nhân vật + Địa điểm + Văn kiện -> Sự kiện lịch sử`.
6. **Trả lời & Tính điểm**: 
   - Đội giải đúng và nhanh nhất sẽ nhận được điểm cao nhất (Có hệ thống điểm thưởng/phạt dựa trên thời gian, số lần dùng gợi ý...).
7. **Kết thúc**: Sau nhiều vòng chơi, đội có tổng điểm cao nhất sẽ chiến thắng.

## 3. Kiến trúc Kỹ thuật (Technical Architecture)
Dựa trên yêu cầu Multiplayer realtime đã phân tích:
- **Frontend**: React + Vite.
- **State Management**: Zustand (quản lý trạng thái game phức tạp ở client).
- **Backend / Database**: 
  - **Firebase Realtime Database**: Dùng cho dữ liệu thay đổi liên tục (trạng thái phòng, danh sách người chơi, chat nội bộ đội, điểm số realtime, bộ đếm thời gian).
  - **Firebase Firestore**: Dùng cho dữ liệu ít thay đổi (kho câu đố lịch sử, hồ sơ người chơi, lịch sử ván đấu).
  - **Firebase Auth**: Quản lý đăng nhập (cho phép Anonymous Login để người chơi join phòng nhanh bằng Tên).
- **Styling**: Tailwind CSS (xây dựng UI nhanh, linh hoạt).
- **Deploy**: Vercel.

## 4. Lộ trình Triển khai (Roadmap)
Dự án nên được phát triển theo các giai đoạn (Phases) để đảm bảo tính khả thi:

- **Phase 1: Foundation (Nền tảng)**
  - Khởi tạo project React + Vite.
  - Setup Firebase, cấu trúc thư mục chuẩn cho dự án, routing.
- **Phase 2: Room System (Hệ thống Phòng - Milestone quan trọng nhất)**
  - Flow Tạo phòng (Host) & Join phòng (Players) bằng Room Code.
  - Màn hình Sảnh chờ (Lobby), cơ chế chia đội.
  - Đồng bộ trạng thái người chơi realtime.
- **Phase 3: Game Engine (Cơ chế Multiplayer)**
  - Quản lý trạng thái vòng chơi (Round state), Thời gian (Timer), Điểm số (Score).
  - Phân phối manh mối (Clues) riêng biệt cho từng người chơi.
  - Tích hợp khung Chat để các thành viên trao đổi thông tin.
- **Phase 4: Hệ thống Puzzle (Logic giải đố)**
  - Xây dựng các component UI cho thao tác giải đố (Kéo thả, điền đáp án, suy luận).
  - Thuật toán kiểm tra tính đúng đắn và cộng trừ điểm.
- **Phase 5: Content (Nội dung Lịch sử Đảng)**
  - Chuẩn bị dữ liệu: Các sự kiện, nhân vật, văn kiện, mốc thời gian.
  - Thiết kế thành các Puzzle logic, đảm bảo tính chính xác về mặt lịch sử.
- **Phase 6: Hoàn thiện & Testing**
  - Màn hình tổng kết (Leaderboard, Game Over).
  - Test tải với 10-20 người/phòng, xử lý các luồng ngắt kết nối (disconnect/reconnect).

## 5. Nguyên tắc Thiết kế (Key Principles)
- **Code Core System Trước**: Bắt buộc phải hoàn thiện hệ thống Room và Realtime State trước khi đổ dữ liệu câu đố vào. Khi nền móng chắc, việc thêm các dạng Puzzle mới rất dễ dàng.
- **Giữ MVP Đơn giản**: Ở phiên bản đầu tiên, KHÔNG nên tham lam làm các tính năng quá phức tạp (như Voice Chat, gọi Video, Mobile App Native, hệ thống xếp hạng phức tạp). Tập trung làm mượt luồng: `Vào phòng -> Nhận manh mối -> Chat -> Trả lời -> Tính điểm`.
