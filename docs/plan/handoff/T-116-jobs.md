# T-116 알바 2종 (마트 진열, 쇼핑백 배달)

## 목적

소동과 소동 사이 5분 동안 할 일을 만든다. 물건을 들어 나르면 코인을 번다. 혼자서도 되고, 시작·종료 버튼이 없다(**물건에 다가가면 시작**). 근거: design-details.md 6번.

## 지금 상태

- `CarryService`(들고 나르기)가 있다. 물건에 3.5 studs 안으로 다가가면 머리 위에 붙고, 목적지 원 안에 들어가면 콜백이 불린다. 10초 멈춰 있으면 물건이 제자리로 돌아간다.

  ```lua
  local item = CarryService:AddItem(part, "box", 1)        -- part: Workspace 안의 파트. kind 문자열로 종류를 구분
  local remove = CarryService:AddDropoff(position, radius, { "box" }, function(player, item)
      return true   -- true: 받는다(물건 파트가 지워진다) / false: 받지 않는다(계속 들고 있다)
  end)
  CarryService:RemoveItem(item)   -- 목록에서 뺀다(파트는 직접 Destroy)
  ```

- HUD는 Player 속성 `Carrying`을 읽어 안내 배지를 보여 준다. `Config.Zones.CarryLabels`에 `box`, `bag` 문구가 이미 있다.
- 창고는 열린 구역이다. NPC 연출은 `NpcService`가 `Workspace.Mall.NPCs`만 훑는다.

## 만들 것

| 경로 | 할 일 |
|---|---|
| `ReplicatedStorage.Shared.Config.Jobs` (신규) | 아래 수치 전부 |
| `ServerScriptService.Server.Services.JobService` (신규) | 알바 로직 |
| `ServerScriptService.Server.Services.CarryService` | `Item`에 `pickedAt: number`(든 시각, `os.clock()`) 추가. `attach`에서 채운다 |
| `ServerScriptService.Server.Services.NpcService` | `Workspace.Mall.Customers`의 캐릭터도 같은 연출(서 있기, 눈 깜빡임, 돌아보기)을 하게 확장 |
| `Workspace.Mall.Jobs` (신규 폴더) | 위치 표식(아래) |
| `Workspace.Mall.Customers` (신규 폴더) | 손님 NPC 6명 |

위치는 코드에 좌표로 쓰지 말고 **Workspace의 표식 파트**로 둔다(사람이 Studio에서 옮길 수 있게). 표식은 `Transparency = 1`, `CanCollide/CanTouch/CanQuery = false`, `Anchored = true`인 작은 파트이고 `JobService`가 `Init`에서 읽는다.

```
Workspace.Mall.Jobs
  Stock
    BoxSpawns/      상자가 놓이는 자리 (창고)
    ShelfSlots/     진열 칸 (마트). 속성 ShelfName
  Delivery
    BagSpawns/      쇼핑백이 놓이는 자리 (장난감 가게, 패션 상점)
```

## 알바 1: 마트 진열

- **상자**: 창고 안 표식 4곳에 상자(2×2×2, 골판지 색, 재질 `Cardboard`)가 놓인다. 하나를 들면 그 자리에 3초 뒤 새 상자가 생긴다. 종류 `"box"`.
  - 추천 자리(창고 바닥 윗면 Y=1.2, 문은 북쪽 벽 x −96~−86): `(-84, 2.3, 58)`, `(-84, 2.3, 62)`, `(-80, 2.3, 58)`, `(-80, 2.3, 62)`. 기존 상자 더미(`CrateA/B/Top`)와 겹치지 않게 하고, 그 아래에 팔레트 모양 받침을 하나 둔다.
- **진열 칸**: 마트 진열대 3개(`Shelf_1~3`, 각 16×4.5×3, x −96~−80, z = −9 / 0 / 9, 윗면 Y=6.3)마다 칸 4개, 모두 12칸. 칸의 x는 −94, −90, −86, −82.
  - 칸은 **비어 있음 / 차 있음** 두 상태다.
  - 비어 있을 때: 진열대 위 그 자리에 빛나는 윤곽(네온, 반투명)과, 진열대 남쪽 통로 바닥에 빛나는 원. 원의 중심은 `(칸 x, 4, 진열대 z + 3.2)`, 반지름 2.2. 이 원이 `AddDropoff` 위치다.
  - 차 있을 때: 진열대 위에 상품 블록 3~4개(색 무작위). 윤곽과 원은 없다.
  - 차 있는 칸은 `40~70초`(무작위) 뒤 다시 빈다. 서버가 시작할 때 절반이 비어 있다. 빈 칸이 2개 미만이 되면 가장 오래된 칸 하나를 바로 비운다(일거리가 끊기지 않게).
- **보상**: 상자를 빈 칸에 놓으면 `StockPay = 5` 코인. `DataService:AddCoins(player, 5, "job:stock")`, `DataService:IncrementStat`으로 `jobsDone`과 `stockDone`을 1씩 올린다(직업별 횟수는 T-127의 숙련도가 쓴다).

## 알바 2: 쇼핑백 배달

- **쇼핑백**: 표식 2곳에 쇼핑백(1.6×2×0.8 몸통 + 손잡이, 가게 대표색)이 놓인다. 하나를 들면 4초 뒤 새로 생긴다. 종류 `"bag"`.
  - 장난감 가게: `ToyCounter` 위 `(75, 5.6, 7)`.
  - 패션 상점: 포장대를 새로 만든다. 문(x −10~10)을 막지 않게 서쪽 벽 조각 뒤 `(-14, 2.7, -63.5)`에 5×3×3 탁자, 그 위에 쇼핑백.
- **손님**: `Workspace.Mall.Customers`에 손님 NPC 6명이 서 있다. 그중 **2명이 "기다리는 중"**이다.
  - 기다리는 손님: 머리 위에 떠 있는 쇼핑백 모양 표식(네온)과 발밑의 빛나는 원. 원의 반지름 3. 이 원이 `AddDropoff` 위치다.
  - 쇼핑백을 기다리는 손님 누구에게나 가져가면 된다. 받으면 그 손님은 손을 흔들고(기본 R15 손 흔들기 `rbxassetid://507770239`) 표식이 사라진다. 2초 뒤 다른 손님(방금 받은 손님 제외, 무작위)이 기다리기 시작한다.
  - 추천 자리(주 바닥 윗면 Y=1): `(-22, 14)`, `(22, -8)`, `(14, 44)`, `(-10, 62)`, `(-52, 30)`, `(52, -30)` (x, z). 놓기 전에 레이캐스트로 바닥과 주변 3 studs가 비었는지 확인한다. 대정전 차단기 자리(`Config.Blackout.Breakers`)와 5 studs 이상 떨어뜨린다.
- **보상**: 쇼핑백이 놓여 있던 자리(`item.home`)에서 손님까지의 수평 거리로 정한다. `clamp(반올림(거리 / 12), 6, 10)` 코인. `"job:delivery"`, `jobsDone`과 `deliveryDone`을 1씩 올린다.

### 손님 NPC 만드는 법

직원 NPC와 같은 방식이다(2026-11-12 로그 "맵 1차 다듬기" 참고).

1. 편집 모드에서 `Players:CreateHumanoidModelFromDescription(desc, Enum.HumanoidRigType.R15)`. `desc.HairAccessory`에 아래 id 하나, `BodyTypeScale = 0`, `ProportionScale = 0`, `HeightScale` 0.9~1.05.
2. 리그 안의 `Animate`(LocalScript)와 `Body Colors`를 지운다. 파트 색을 직접 칠한다(피부, 윗옷, 바지, 신발). 직원과 구별되게 유니폼 색이 아닌 평상복 색을 쓰고 앞치마·배지는 달지 않는다.
3. `HumanoidRootPart.Anchored = true`, `Humanoid.DisplayDistanceType = None`, `HealthDisplayType = AlwaysOff`, `EvaluateStateMachine = false`.
4. 얼굴: `Head.FaceControls`의 `LeftLipCornerPuller`/`RightLipCornerPuller`를 0.7로(웃는 얼굴).
5. 구조는 `Workspace.Mall.Customers/<customerId>/Character`. 이름표는 달지 않는다.

검증된 머리 액세서리 id(모두 Roblox 제작): `63690008`, `376524487`, `451221329`, `62234425`, `16630147`, `376548738`, `13477818`, `80922154`, `398672920`, `301818806`. 직원이 쓰는 것과 겹쳐도 된다.

## 공통 규칙

- 최소 시간 검사에 걸려 코인을 못 받은 배달은 횟수(`jobsDone` 등)에도 넣지 않는다.
- **최소 시간**: 든 뒤 `MinCarrySeconds = 4`초가 지나기 전에 놓으면 물건은 받되 코인과 연속 횟수를 주지 않는다(순간이동 방지). 정상 플레이의 최단 시간은 7초쯤이다.
- **연속 보너스**: 코인을 받은 배달이 5번 이어질 때마다 `StreakBonus = 5`를 더 준다. 물건이 제자리로 돌아가거나(방치), 마지막 배달 뒤 `StreakWindowSeconds = 90`초가 지나면 0으로 돌아간다. 알바 종류는 섞여도 된다.
- **알림**: 코인을 받으면 `Net.event("Notify")`로 짧은 토스트("진열 완료 +5", "배달 완료 +8", 연속 보너스는 "5연속! +5"). `kind`는 `UI.Components.Toast`가 받는 값 중에서 고른다(소스를 읽고 확인).
- **소동과의 관계**: `ReplicatedStorage.EventState`의 `Phase`와 `EndsAt`을 본다.
  - `notice` 진입 뒤 남은 시간이 `EventCutoffSeconds = 10`초 초과일 때는 평소처럼 알바를 계속 진행한다.
  - `notice` 남은 시간이 `10`초 이하가 되면(디버그 `skip` 없이 자연 대기 시 시작 10초 전): 새 상자·쇼핑백이 생기지 않고, 바닥에 놓인 것은 치운다. **이미 들고 있는 것은 놓아서 코인을 받을 수 있다.** 모두에게 토스트 `"소동 10초 전! 소동이 끝날 때까지 알바가 잠시 쉬어요"`.
  - `active`가 되면: 들고 있는 알바 물건도 모두 치우고(`CarryService:RemoveItem` 뒤 파트 `Destroy`), 빈 칸 표시와 손님 표식을 숨긴다.
  - `idle`로 돌아오면: 다시 연다.
- 대정전의 배터리(`"battery"`)와 종류가 달라 서로 섞이지 않는다.

## Config.Jobs에 둘 수치

`StockPay 5`, `BoxRespawnSeconds 3`, `SlotRestockMinSeconds 40`, `SlotRestockMaxSeconds 70`, `MinEmptySlots 2`, `SlotDropoffRadius 2.2`, `DeliveryPayMin 6`, `DeliveryPayMax 10`, `DeliveryStudsPerCoin 12`, `BagRespawnSeconds 4`, `WaitingCustomers 2`, `CustomerDropoffRadius 3`, `NextCustomerDelaySeconds 2`, `MinCarrySeconds 4`, `StreakEvery 5`, `StreakBonus 5`, `StreakWindowSeconds 90`, `EventCutoffSeconds 10`.

목표 수입은 분당 약 20코인이다. 확인 때 실제로 재서 보고한다(맞추는 것은 T-111).

## 건드리지 않는 것

- `EventService`, 소동 모듈.
- UI: 새 화면을 만들지 않는다. 토스트와 기존 운반 배지만 쓴다.

## 확인 방법

1. 플레이 테스트 시작 직후: 창고에 상자 4개, 마트에 빈 칸 6개(윤곽과 바닥 원), 쇼핑백 2개, 기다리는 손님 2명이 보이는지(캡처).
2. 상자에 다가가면 머리 위에 붙고 HUD에 "상품 상자 운반 중" 배지가 뜨는지. 3초 뒤 그 자리에 새 상자가 생기는지.
3. 빈 칸 원에 들어가면: 코인 +5, 칸에 상품이 놓이고 윤곽이 사라지는지. 찬 칸의 자리에서는 놓이지 않는지.
4. 쇼핑백을 기다리는 손님에게 가져가면: 거리에 맞는 코인, 손님이 손을 흔들고 표식이 다른 손님으로 옮겨 가는지. 기다리지 않는 손님에게는 놓이지 않는지.
5. 캐릭터를 순간이동시켜 4초 안에 놓으면 코인이 오르지 않는지.
6. 5번 연속 배달 때 +5가 붙는지. 들고 10초 서 있으면 물건이 돌아가고 연속이 끊기는지.
7. 소동을 강제로 시작해서: 공지 때 놓인 물건이 사라지고 들고 있던 것은 놓으면 코인을 받는지, 진행이 시작되면 전부 사라지는지, 소동이 끝나고 `idle`이 되면 다시 열리는지.
8. 찬 칸이 40~70초 뒤 다시 비는지(`skip`은 소동용이라 여기엔 못 쓴다. 시험할 때만 Config 값을 줄였다가 되돌린다).
9. 실제로 걸어서 2분 동안 알바를 해 보고 번 코인을 적는다(진열만, 배달만 각각).
10. 콘솔 오류가 없는지.

## 물어볼 것

- 추천 좌표에 놓을 수 없으면(겹침, 통로 막힘) 옮긴 좌표를 보고한다. 구역 자체를 바꾸지는 않는다.
