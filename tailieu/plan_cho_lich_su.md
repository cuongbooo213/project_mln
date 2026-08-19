# 🏪 KẾ HOẠCH TRIỂN KHAI: CHỢ LỊCH SỬ
# Chuyển đổi từ "Mật Mã Lịch Sử" → "Chợ Lịch Sử"

> **Tóm tắt:** Game multiplayer dạng đấu giá + giải đố lịch sử. Host là "Chủ Chợ" điều hành phiên đấu giá. 9 đội × 7 người dùng Xu để mua thông tin, trao đổi hàng hóa, và cuối cùng ghép nối dữ kiện để giải nhiệm vụ lịch sử.

---

## 📊 PHÂN TÍCH CODE HIỆN TẠI (Tái sử dụng được)

### ✅ Giữ nguyên (không cần sửa):
| File | Lý do |
|------|-------|
| `firebase/config.js` | Firebase Realtime DB đã setup sẵn |
| `firebase/timeSync.js` | Đồng bộ thời gian server - cần cho đấu giá realtime |
| `contexts/AudioContext.jsx` | Hệ thống âm thanh |
| `components/RoomCode.jsx` | Hiển thị mã phòng |
| `pages/Home.jsx` | Chỉ cần thêm 1 cột mới cho "Chợ Lịch Sử" |
| `pages/MillionaireGame.jsx` | Game cũ, không liên quan |

### 🔄 Sửa đổi lớn:
| File | Thay đổi |
|------|----------|
| `App.jsx` | Thêm routes mới cho Chợ Lịch Sử |
| `services/roomService.js` | Sửa `createRoom` cho 9 đội × 7 người + Xu |
| `services/gameService.js` | Viết lại hoàn toàn → `marketService.js` |
| `pages/CreateRoom.jsx` | Thêm cấu hình Chợ (Xu khởi điểm, số vòng...) |
| `pages/Lobby.jsx` | Hiển thị 9 đội + chọn đội |
| `pages/Game.jsx` | Viết lại hoàn toàn → Giao diện Chợ |
| `pages/Result.jsx` | Sửa công thức tính điểm cuối |

### 🆕 File mới cần tạo:
| File | Mô tả |
|------|-------|
| `data/market_items.json` | Dữ liệu hàng hóa + nhiệm vụ |
| `services/marketService.js` | Logic đấu giá, mua bán, giao dịch |
| `services/auctionService.js` | Logic phiên đấu giá realtime |
| `components/AuctionPanel.jsx` | Giao diện đấu giá cho người chơi |
| `components/TeamInventory.jsx` | Kho hàng của đội |
| `components/TradePanel.jsx` | Giao diện trao đổi giữa các đội |
| `components/MissionSolver.jsx` | Giao diện giải nhiệm vụ cuối |
| `components/MarketChat.jsx` | Chat nội bộ đội (upgrade từ TeamChat) |
| `components/HostMarketDashboard.jsx` | Dashboard Host |

---

## 🗂️ FIREBASE DATABASE SCHEMA

```
rooms/
  {roomCode}/
    gameState: "waiting" | "market" | "mission" | "finished"
    hostId: "host_xxx"
    createdAt: timestamp
    
    # Cấu hình phòng
    config/
      numTeams: 9
      playersPerTeam: 7
      startingXu: 1000
      numRounds: 3           # Số vòng chợ
      auctionTimer: 15       # Giây cho mỗi phiên đấu giá
      missionTimer: 120      # Giây cho nhiệm vụ cuối
    
    # Danh sách đội
    teams/
      team_0/
        name: "Đội Cách Mạng"
        emoji: "🟥"
        xu: 1000              # Số Xu hiện tại
        score: 0              # Điểm nhiệm vụ
        players/
          {playerId}: true
        inventory/             # Kho hàng đã mua
          {itemId}:
            type: "date" | "person" | "place" | "document" | "clue" | "rare" | "fake"
            content: "..."
            boughtAt: timestamp
            price: 200
      team_1/
        ...
    
    # Danh sách người chơi
    players/
      {playerId}/
        name: "Tên"
        isHost: false
        teamId: "team_0"
    
    # Vòng chợ hiện tại
    currentRound: 0
    rounds/
      0/
        mission/               # Nhiệm vụ cuối vòng
          title: "Tìm sự kiện lịch sử"
          description: "Ghép các dữ kiện để tìm ra sự kiện..."
          correctAnswer: "Hội nghị thành lập Đảng 1930"
          bonusPoints: 500
        items/                 # Tất cả hàng hóa của vòng này
          item_0:
            type: "date"
            label: "📅 Mốc thời gian"
            content: "1930"    # NỘI DUNG ẨN - chỉ đội mua mới thấy
            hint: "Một con số quan trọng..." # MÔ TẢ CÔNG KHAI
            startPrice: 100
            isFake: false
            isRevealed: false  # Host đã đưa ra bán chưa
            soldTo: null       # teamId đã mua
            soldPrice: 0
          item_1:
            type: "person"
            label: "👤 Nhân vật"
            content: "Nguyễn Ái Quốc"
            hint: "Một nhân vật kiệt xuất..."
            startPrice: 150
            isFake: false
          item_fake:
            type: "clue"
            label: "🔎 Manh mối"
            content: "Sự kiện diễn ra tại Tokyo" # SAI!
            hint: "Một thông tin về địa điểm..."
            startPrice: 80
            isFake: true       # HÀNG GIẢ
    
    # Phiên đấu giá đang diễn ra
    auction/
      isActive: false
      itemId: "item_0"
      currentBid: 200
      currentBidder: "team_2"
      startTime: timestamp
      endTime: timestamp
      bids/                    # Lịch sử bid
        {bidId}:
          teamId: "team_2"
          amount: 200
          timestamp: xxx
    
    # Giao dịch trao đổi giữa các đội
    trades/
      {tradeId}/
        fromTeam: "team_0"
        toTeam: "team_3"
        offeredItem: "item_2"
        requestedXu: 150       # Hoặc requestedItem
        status: "pending" | "accepted" | "rejected"
    
    # Thông báo từ Host
    broadcasts/
      {msgId}/
        text: "Hãy chú ý món hàng tiếp theo!"
        timestamp: xxx
        type: "info" | "warning" | "bonus"
    
    # Chat nội bộ đội (giữ nguyên cấu trúc cũ)
    teams/{teamId}/chat/
      {msgId}: { playerId, playerName, text, timestamp }
```

---

## 🎮 LUỒNG GAME (GAME FLOW)

```
┌─────────────────────────────────────────────────┐
│  1. TẠO PHÒNG (Host)                           │
│     → Chọn số đội, Xu khởi điểm, số vòng       │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│  2. PHÒNG CHỜ (Lobby)                          │
│     → 63 người join + chọn đội                  │
│     → Host bấm "Mở Chợ"                         │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│  3. PHIÊN CHỢ (Market Phase) — Lặp lại N vòng  │
│                                                 │
│  3a. Host chọn món hàng → Đưa ra bán            │
│  3b. PHIÊN ĐẤU GIÁ (15-30s)                    │
│      → Các đội đặt giá (+50, +100, Custom)      │
│      → Đếm ngược 5s khi không ai trả thêm      │
│      → 🔨 Đội cao nhất thắng!                   │
│  3c. Đội thắng trả Xu, nhận nội dung hàng       │
│  3d. Host chọn món tiếp theo...                  │
│  3e. (Tùy chọn) Cho phép trao đổi giữa đội     │
│                                                 │
│  Lặp lại cho đến khi Host quyết định kết thúc   │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│  4. NHIỆM VỤ (Mission Phase) — Mỗi vòng 1 lần │
│                                                 │
│  → Host công bố nhiệm vụ lịch sử               │
│  → Các đội dùng hàng đã mua để ghép đáp án     │
│  → Thảo luận nội bộ qua Chat                    │
│  → Bỏ phiếu + Chốt đáp án                      │
│  → Đội đúng nhận điểm nhiệm vụ                  │
│  → Bonus: Hàng giả bị phát hiện = +50 điểm     │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│  5. KẾT QUẢ (Result)                           │
│                                                 │
│  Điểm cuối = Xu còn lại                         │
│            + Điểm nhiệm vụ                      │
│            + Bonus phát hiện hàng giả            │
│            + Bonus giao dịch thành công          │
└─────────────────────────────────────────────────┘
```

---

## 📦 CHI TIẾT TỪNG PHASE TRIỂN KHAI

---

### PHASE 1: Data Layer + Room Setup (Nền móng)

#### [NEW] `src/data/market_items.json`
Dữ liệu hàng hóa cho 3 vòng chợ. Mỗi vòng có ~8-12 món hàng + 1 nhiệm vụ.

```json
[
  {
    "roundId": "round_01",
    "mission": {
      "title": "Sự ra đời của Đảng",
      "description": "Hãy ghép các dữ kiện để xác định: Sự kiện gì? Diễn ra khi nào? Ở đâu? Ai chủ trì?",
      "correctAnswer": "Hội nghị thành lập Đảng CSVN, 3/2/1930, Hương Cảng, Nguyễn Ái Quốc",
      "acceptableAnswers": ["1930", "hội nghị thành lập đảng"],
      "bonusPoints": 500
    },
    "items": [
      {
        "id": "r1_date",
        "type": "date",
        "label": "📅 Mốc thời gian",
        "content": "Ngày 3 tháng 2 năm 1930",
        "hint": "Một con số gắn liền với sự khởi đầu...",
        "startPrice": 100,
        "isFake": false
      },
      {
        "id": "r1_person",
        "type": "person",
        "label": "👤 Nhân vật",
        "content": "Nguyễn Ái Quốc - Người chủ trì hội nghị hợp nhất",
        "hint": "Một nhân vật vĩ đại trong lịch sử dân tộc...",
        "startPrice": 150,
        "isFake": false
      },
      {
        "id": "r1_place",
        "type": "place",
        "label": "📍 Địa điểm",
        "content": "Cửu Long, Hương Cảng (Hong Kong)",
        "hint": "Không phải trên đất Việt...",
        "startPrice": 120,
        "isFake": false
      },
      {
        "id": "r1_doc",
        "type": "document",
        "label": "📜 Văn kiện",
        "content": "Chánh cương vắn tắt, Sách lược vắn tắt - Cương lĩnh chính trị đầu tiên",
        "hint": "Nền tảng tư tưởng được thông qua...",
        "startPrice": 180,
        "isFake": false
      },
      {
        "id": "r1_clue1",
        "type": "clue",
        "label": "🔎 Manh mối A",
        "content": "Sự kiện hợp nhất 3 tổ chức cộng sản: An Nam CSĐ, Đông Dương CSĐ, Đông Dương CS Liên Đoàn",
        "hint": "Liên quan đến sự thống nhất...",
        "startPrice": 100,
        "isFake": false
      },
      {
        "id": "r1_clue2",
        "type": "clue",
        "label": "🔎 Manh mối B",
        "content": "Đánh dấu sự ra đời của chính đảng tiên phong của giai cấp công nhân Việt Nam",
        "hint": "Một bước ngoặt lịch sử...",
        "startPrice": 90,
        "isFake": false
      },
      {
        "id": "r1_rare",
        "type": "rare",
        "label": "💎 Thông tin đặc biệt",
        "content": "⭐ Ngày 3/2 hàng năm được chọn làm ngày kỷ niệm thành lập Đảng",
        "hint": "Thông tin hiếm, có thể mang lại bonus...",
        "startPrice": 250,
        "isFake": false
      },
      {
        "id": "r1_fake1",
        "type": "clue",
        "label": "🔎 Manh mối C",
        "content": "Sự kiện diễn ra tại Quảng Châu, Trung Quốc vào năm 1925",
        "hint": "Thông tin về địa điểm và thời gian...",
        "startPrice": 80,
        "isFake": true
      },
      {
        "id": "r1_fake2",
        "type": "person",
        "label": "👤 Nhân vật liên quan",
        "content": "Phan Bội Châu là người triệu tập hội nghị",
        "hint": "Một nhân vật lịch sử nổi tiếng...",
        "startPrice": 120,
        "isFake": true
      }
    ]
  }
]
```

#### [MODIFY] `src/services/roomService.js`
- Sửa `createRoom()`: Thêm tham số `startingXu`, `numRounds`, `auctionTimer`, `missionTimer`.
- Tên đội mặc định 9 đội: Cách Mạng, Tiên Phong, Độc Lập, Thống Nhất, Niềm Tin, Quyết Tâm, Lịch Sử, Việt Nam, Chiến Thắng.
- Mỗi đội khởi tạo có `xu: startingXu` và `inventory: {}`.
- Giữ nguyên `joinRoom()` và `joinTeam()`.

#### [NEW] `src/services/marketService.js`
Các hàm chính:
- `startMarketRound(roomCode, roundData)` — Host bắt đầu vòng chợ
- `revealItem(roomCode, itemId)` — Host đưa món hàng ra
- `buyItemDirect(roomCode, teamId, itemId, price)` — Mua trực tiếp (không đấu giá)
- `adjustTeamXu(roomCode, teamId, amount)` — Host thưởng/phạt Xu
- `sendBroadcast(roomCode, text, type)` — Host gửi thông báo
- `startMissionPhase(roomCode)` — Chuyển sang pha nhiệm vụ
- `submitMissionAnswer(roomCode, teamId, answer)` — Đội nộp đáp án nhiệm vụ

#### [NEW] `src/services/auctionService.js`
Các hàm chính:
- `startAuction(roomCode, itemId, startPrice, duration)` — Host mở phiên đấu giá
- `placeBid(roomCode, teamId, amount)` — Đội đặt giá
- `endAuction(roomCode)` — Kết thúc phiên (tự động hoặc thủ công)
- `cancelAuction(roomCode)` — Host hủy phiên

---

### PHASE 2: Giao Diện Host (Chủ Chợ Dashboard)

#### [MODIFY] `src/pages/CreateRoom.jsx`
Thêm các trường cấu hình:
- Xu khởi điểm (mặc định: 1000)
- Số vòng chợ (mặc định: 3)
- Thời gian đấu giá (mặc định: 15s)
- Thời gian nhiệm vụ (mặc định: 120s)
- Số đội (mặc định: 9), Số người/đội (mặc định: 7)

#### [NEW] `src/components/HostMarketDashboard.jsx`
Giao diện Host chia thành 3 khu vực:

**Khu vực 1: Bảng tổng quan đội**
```
🟥 Cách Mạng  820 Xu  | 3 món | ✅ Đã nộp
🟦 Tiên Phong  650 Xu  | 2 món | ⏳ Đang làm
🟩 Độc Lập    910 Xu  | 1 món | ❌ Chưa nộp
...
```

**Khu vực 2: Quầy hàng (Item Queue)**
- Danh sách tất cả hàng hóa của vòng hiện tại
- Mỗi món có nút: [Bán Trực Tiếp] [Đấu Giá] [Tặng Miễn Phí]
- Hàng đã bán có dấu ✓ và tên đội đã mua
- Hàng giả được đánh dấu riêng (chỉ Host thấy)

**Khu vực 3: Bảng điều khiển**
- [📢 Phát Thông Báo] — gửi text tới tất cả đội
- [⏭️ Chuyển Sang Nhiệm Vụ] — kết thúc pha chợ
- [🎁 Thưởng Xu] — chọn đội + số Xu
- [⚡ Sự Kiện Bất Ngờ] — giảm giá 50%, sale flash...
- [⏸️ Tạm Dừng]

---

### PHASE 3: Giao Diện Người Chơi (Thành viên đội)

#### [NEW] `src/components/AuctionPanel.jsx`
Hiển thị khi Host mở phiên đấu giá:
- Tên món hàng + Loại (📅📍👤📜🔎💎)
- Mô tả công khai (hint) — KHÔNG hiện nội dung thực
- Giá hiện tại + Đội đang dẫn đầu
- Nút: [+50 Xu] [+100 Xu] [+200 Xu] [Nhập Giá]
- Đồng hồ đếm ngược
- Hiệu ứng: Khi có đội bid → số nhảy lên + animation

#### [NEW] `src/components/TeamInventory.jsx`
Kho hàng của đội:
- Liệt kê tất cả món đã mua
- Hiển thị nội dung đầy đủ (chỉ đội mình mới thấy)
- Mỗi món có nút: [🔄 Đề Xuất Trao Đổi] — mở TradePanel
- Có tag "⚠️ Có thể là hàng giả" để đội cảnh giác

#### [NEW] `src/components/TradePanel.jsx`
Giao diện trao đổi hàng giữa các đội:
- Chọn đội muốn trao đổi
- Chọn món hàng muốn đưa
- Nhập số Xu yêu cầu (hoặc chọn món muốn nhận)
- Gửi đề nghị → Đội kia nhận notification
- Đội kia bấm [Chấp Nhận] hoặc [Từ Chối]

#### [NEW] `src/components/MissionSolver.jsx`
Giao diện giải nhiệm vụ cuối vòng:
- Hiển thị đề bài nhiệm vụ từ Host
- Kho hàng của đội hiện bên cạnh để tham khảo
- Ô nhập đáp án + Bỏ phiếu đội (giữ cơ chế Vote)
- Đồng hồ đếm ngược

#### [MODIFY] `src/components/MarketChat.jsx` (upgrade từ TeamChat)
- Giữ nguyên chat nội bộ đội
- Thêm hiển thị tin nhắn từ Host (📢 màu vàng nổi bật)
- Thêm notification tự động: "Đội bạn vừa mua 📅 Mốc thời gian với giá 200 Xu"

---

### PHASE 4: Game Page (Tổng hợp)

#### [MODIFY] `src/pages/Game.jsx`
Viết lại hoàn toàn. Chia thành 2 chế độ:

**Nếu là Host (`playerId === hostId`):**
→ Render `<HostMarketDashboard />`

**Nếu là Player:**
Layout chia 3 cột (desktop) hoặc tab (mobile):

```
┌──────────────────┬──────────────────┬──────────────────┐
│                  │                  │                  │
│  🏪 QUẦY HÀNG    │  📦 KHO HÀNG     │  💬 CHAT ĐỘI     │
│                  │                  │                  │
│  AuctionPanel    │  TeamInventory   │  MarketChat      │
│                  │                  │                  │
│  (Phiên đấu giá │  (Món đã mua)    │  (Trao đổi nội   │
│   hoặc "Chờ     │                  │   bộ)            │
│   Host mở       │  TradePanel      │                  │
│   hàng...")      │  (Trao đổi)      │                  │
│                  │                  │                  │
└──────────────────┴──────────────────┴──────────────────┘

Header: [💰 820 Xu] [📦 3 món] [⏱️ 45s] [🏆 Vòng 1/3]
```

Khi chuyển sang Mission Phase:
→ Render `<MissionSolver />` thay thế AuctionPanel

#### [MODIFY] `src/pages/Result.jsx`
Công thức tính điểm mới:
```
Điểm cuối = Xu còn lại
           + Điểm nhiệm vụ (0 hoặc 500)
           + Bonus phát hiện hàng giả (50/món)
           + Bonus giao dịch thành công (30/giao dịch)
           + Bonus hàng hiếm (100 nếu có 💎)
```

---

### PHASE 5: Polish & Hiệu Ứng

- 🔨 Animation búa đập khi kết thúc đấu giá
- 💰 Animation Xu bay khi mua/bán
- 📢 Toast notification cho broadcast từ Host
- 🎵 Âm thanh: tiếng búa, tiếng xu, tiếng chuông đấu giá
- 📱 Responsive cho điện thoại (63 người dùng điện thoại vào chơi)
- ⚡ Tối ưu Firebase listeners (chỉ lắng nghe node cần thiết)

---

## 📋 BẢNG TỔNG HỢP FILES

### Files mới cần tạo (8 files):
| # | File | Kích thước ước tính |
|---|------|-------------------|
| 1 | `src/data/market_items.json` | ~200 dòng |
| 2 | `src/services/marketService.js` | ~150 dòng |
| 3 | `src/services/auctionService.js` | ~120 dòng |
| 4 | `src/components/HostMarketDashboard.jsx` | ~350 dòng |
| 5 | `src/components/AuctionPanel.jsx` | ~200 dòng |
| 6 | `src/components/TeamInventory.jsx` | ~120 dòng |
| 7 | `src/components/TradePanel.jsx` | ~180 dòng |
| 8 | `src/components/MissionSolver.jsx` | ~150 dòng |

### Files cần sửa (7 files):
| # | File | Mức độ sửa |
|---|------|-----------|
| 1 | `src/App.jsx` | Nhỏ (thêm routes) |
| 2 | `src/pages/Home.jsx` | Nhỏ (thêm cột) |
| 3 | `src/pages/CreateRoom.jsx` | Trung bình (thêm config) |
| 4 | `src/services/roomService.js` | Trung bình (sửa createRoom) |
| 5 | `src/pages/Lobby.jsx` | Trung bình (9 đội) |
| 6 | `src/pages/Game.jsx` | Lớn (viết lại) |
| 7 | `src/pages/Result.jsx` | Trung bình (công thức mới) |

---

## ⏱️ LỘ TRÌNH TRIỂN KHAI

| Phase | Nội dung | Ước tính |
|-------|----------|----------|
| **Phase 1** | Data + Services (market_items.json, marketService, auctionService, roomService) | Sprint 1 |
| **Phase 2** | Host Dashboard (HostMarketDashboard, CreateRoom, Lobby 9 đội) | Sprint 2 |
| **Phase 3** | Player UI (AuctionPanel, TeamInventory, TradePanel, MarketChat) | Sprint 3 |
| **Phase 4** | Mission + Game Page (MissionSolver, Game.jsx, Result.jsx) | Sprint 4 |
| **Phase 5** | Polish (Animation, Sound, Responsive, Optimization) | Sprint 5 |

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Không xóa game cũ:** "Mật Mã Lịch Sử" và "Ai Là Triết Gia" vẫn giữ nguyên. "Chợ Lịch Sử" sẽ là chế độ chơi thứ 4 trên trang chủ.

2. **Firebase Realtime DB:** Với 63 người cùng lắng nghe + ghi dữ liệu đấu giá realtime, cần tối ưu:
   - Chỉ lắng nghe `/rooms/{code}/auction` thay vì toàn bộ room.
   - Dùng `transaction()` cho bid để tránh race condition.
   - Giới hạn chat history (chỉ giữ 50 tin nhắn gần nhất).

3. **Responsive Mobile:** 63 người sẽ dùng điện thoại → giao diện PHẢI hoạt động tốt trên màn hình nhỏ. Dùng tab thay vì chia cột trên mobile.

4. **Hàng giả (Fake items):** Đây là cơ chế hay nhất của game. Khi mua hàng giả, đội sẽ KHÔNG biết nó là giả cho đến khi giải nhiệm vụ. Điều này buộc đội phải kiểm chứng chéo thông tin.
