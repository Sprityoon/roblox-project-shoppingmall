# T-105 상점과 아이템

## 목적

코인을 쓸 곳을 만든다. 상점 NPC에게 말을 걸면 상점 화면이 열리고, 꾸미기를 사서 달고, 간식을 사서 바로 쓴다. 파는 것은 **모델링 없이 로블록스 기본 기능으로 만들 수 있고 남에게 바로 보이는 것**이다. 근거: design-details.md 7~8번, 화면은 `docs/mockups/ui_mockup_v2.html`의 상점 창.

## 지금 상태

- `DataService`: `GetProfile(player)`, `AddCoins(player, amount, reason?)`, `IncrementStat(player, stat, amount)`. 프로필은 `{ version, coins, ownedItems: {string}, equipped: {[분류]: itemId}, stats }`이고 바뀌면 `ProfileChanged`로 클라이언트에 보낸다. 코인을 **빼는** 함수와 아이템을 주는 함수는 아직 없다.
- `ShopService`, `InteractionController`: 내용 없는 틀(11줄)이다.
- `Types.ItemCategory`는 옛 값(`"costume" | "prop" | "emote"`)이다.
- UI 기반: `ReplicatedStorage.UI`의 `Theme`, `Motion`, `AutoScale`, `Components.(Button, Modal, Toast)`. 모달은 `ScreenController:OpenModal(options)`로 띄운다(소스를 읽고 내용물을 넣는 방법을 확인).
- NPC의 `ProximityPrompt`는 `Workspace.Mall.NPCs/<npcId>/Character/HumanoidRootPart`에 있다. 상점 NPC: `mart_npc`, `toy_npc`, `fashion_npc`.
- Studio에서는 저장(API 접근)이 꺼져 있어 접속할 때마다 코인 100으로 시작한다.

## 만들 것

| 경로 | 할 일 |
|---|---|
| `Shared.Types` | 분류와 아이템 타입 변경 |
| `Shared.Config.ShopItems` (신규) | 품목 표 |
| `Server.Services.DataService` | `SpendCoins`, `GrantItem`, `OwnsItem`, `SetEquipped` 추가. Studio 전용 디버그 스위치 |
| `Server.Services.ShopService` | 구매·장착·간식 사용 검증과 처리 |
| `Server.Services.CosmeticService` (신규) | 장착한 꾸미기를 캐릭터에 붙인다. 간식 효과 |
| `Server.Events.blackout` | 손전등 색만: Player 속성 `FlashlightColor`가 있으면 그 색으로 |
| `ReplicatedStorage.Remotes.ShopRequest` (RemoteFunction, 신규) | `Net` 주석 표에 추가 |
| `Client.Screens.ShopScreen` (신규) | 상점 화면 |
| `Client.Controllers.InteractionController` | NPC 말 걸기 처리 |

## 데이터 모양

```lua
export type ItemCategory = "balloon" | "trail" | "aura" | "title" | "flashlight" | "consumable"
export type ShopId = "toy_shop" | "fashion" | "mart"          -- 구역 id와 같다
export type ShopItem = {
	id: string, shop: ShopId, category: ItemCategory,
	name: string, description: string, price: number,
	color: Color3?, color2: Color3?,       -- 풍선·발자취·반짝이·손전등의 색
	material: Enum.Material?, scale: number?,   -- 풍선
	text: string?,                         -- 칭호
	effect: string?, percent: number?, seconds: number?,   -- 간식: "speed" | "jump" | "glow"
	notForSale: boolean?,                  -- 상점에 나오지 않는 보상용(T-117의 환영 풍선 등)
}
```

- `equipped`는 분류마다 하나: `equipped.balloon = "balloon_red"`. 간식은 장착하지 않는다.
- `PROFILE_VERSION`은 1 그대로 둔다(옛 분류로 저장된 데이터가 없다).
- 분류와 탭은 뒤에 늘어난다(T-127이 `uniform` 분류와 "내 직업" 탭을, T-128이 나눠 먹는 간식을 더한다). 분류 이름이나 탭 수를 코드 곳곳에 박아 두지 말고 표 하나에서 읽게 만든다.
- 가격은 반드시 `ShopService:GetPrice(itemId)` 한 곳을 거치게 한다. 나중에 "오늘의 특가"(T-118)가 여기에 할인을 넣는다. **특가 배지와 할인은 이 카드에서 만들지 않는다.**

## 처음 넣을 품목 (Config.ShopItems)

가격 사다리: 간식 20~40 / 첫 꾸미기 150 / 일반 300~600 / 고급 1,200~2,500 / 자랑용 5,000 이상.

| 상점 | 분류 | 품목 (가격) |
|---|---|---|
| 장난감 가게 | 풍선 | 빨강·노랑·하늘·분홍·민트·보라 (각 150), 반짝이 풍선: 네온 재질 (400), 왕풍선: 1.5배 크기 (600) |
| 장난감 가게 | 손전등 색 | 하늘빛·분홍빛·연두빛 (각 300), 금빛 (500) |
| 패션 상점 | 발자취 | 별가루: 흰색→노랑 (300), 분홍 리본 (300), 무지개 (600), 금빛 길 (1,200) |
| 패션 상점 | 반짝이 | 은은한 반짝임 (400), 하트 빛: 분홍 (600), 별빛 오라: 금색, 양 많음 (1,500) |
| 패션 상점 | 칭호 | "단골손님" (150), "쇼핑왕" (500), "알바왕" (1,200), "몰의 전설" (5,000) |
| 마트 | 간식 | 에너지 젤리: 달리기 +20% 60초 (30), 점프 사탕: 점프 +30% 60초 (30), 반짝 음료: 몸에서 빛 60초 (20) |

id는 `balloon_red`, `trail_star`, `aura_soft`, `title_regular`, `flashlight_sky`, `snack_speed`처럼 `분류_이름`으로 짓는다.

## 서버 동작

**ShopRequest(action, itemId) → (ok: boolean, code: string)** — 클라이언트가 부르는 유일한 창구.

| action | 검사 | 처리 |
|---|---|---|
| `"buy"` | 인자가 문자열인지, 품목이 있고 `notForSale`이 아닌지, 호출 빈도(`Util.RateLimiter`), 플레이어가 그 상점 구역 안인지(`ZoneService:GetZone(player) == item.shop`), 이미 가졌는지(간식 제외), 코인이 충분한지 | 코인 차감 → 꾸미기는 보유 목록에 넣고 **바로 장착**, 간식은 **바로 효과 적용**(보관하지 않는다) |
| `"equip"` | 품목이 있고 가졌는지 | 그 분류에 장착 |
| `"unequip"` | 품목이 있는지 | 그 분류 장착 해제 |

- `code`: `"ok"`, `"not_found"`, `"not_in_shop"`, `"already_owned"`, `"not_enough_coins"`, `"not_owned"`, `"rate_limited"`, `"no_profile"`. 화면이 이 값으로 문구를 고른다.
- 코인 차감과 아이템 지급은 한 함수 안에서 연달아 하고, 중간에 실패하면 아무것도 바뀌지 않게 한다.
- `DataService`에 넣을 것: `SpendCoins(player, amount, reason): boolean`(부족하면 false, 음수·NaN 거부), `GrantItem(player, itemId): boolean`, `OwnsItem(player, itemId): boolean`, `SetEquipped(player, category, itemId: string?)`. 모두 끝에 `ProfileChanged`를 보낸다.
- Studio 전용 디버그: `ServerStorage.DebugGrantCoins`(BindableEvent) `:Fire(player, amount)`. `RunService:IsStudio()`일 때만 만든다(`EventService`의 `DebugEventControl`과 같은 방식).

**CosmeticService** — 캐릭터가 생길 때와 장착이 바뀔 때 다시 붙인다. 붙인 것에는 이름 앞에 `Cosmetic_`을 달아 한 번에 지울 수 있게 한다.

| 분류 | 만드는 법 |
|---|---|
| 풍선 | 공 모양 파트(지름 2.2, `scale` 배)를 `HumanoidRootPart` 기준 `(1.4, 4.6, 0.4)`에 `WeldConstraint`로 붙이고, 손 쪽 어태치먼트와 `Beam`으로 줄을 그린다. `Massless`, `CanCollide/CanQuery/CanTouch = false` |
| 발자취 | `HumanoidRootPart`에 어태치먼트 2개(위아래 1 stud)와 `Trail`. `Lifetime` 0.8, 색은 `color → color2`, 끝으로 갈수록 투명 |
| 반짝이 | `HumanoidRootPart`에 `ParticleEmitter`. 기본 반짝임 텍스처(`rbxasset://textures/particles/sparkles_main.dds`), 초당 5~12개, 몸 주위에서 천천히 위로 |
| 칭호 | 머리 위 글자(`BillboardGui`). 이름표와 겹치지 않는 높이. 글자색·테두리는 `Theme` 값. 문구는 Config의 고정 문자열이라 필터가 필요 없다 |
| 손전등 색 | Player 속성 `FlashlightColor`(Color3)를 넣는다. `blackout` 모듈의 손전등 생성 부분이 이 속성이 있으면 그 색을 쓴다 |

**간식 효과**

- `speed`: `Humanoid.WalkSpeed`를 기본값 × 1.2로. `jump`: 점프(`JumpHeight` 또는 `JumpPower`, 캐릭터가 쓰는 쪽)를 × 1.3. `glow`: 몸에 `PointLight`와 약한 반짝이.
- 같은 효과를 다시 먹으면 **시간만 다시 60초**가 된다(곱해지지 않는다). 다른 효과는 함께 걸린다.
- 리스폰해도 남은 시간 동안 유지한다. 끝나면 정확히 원래 값으로 되돌린다.
- 끝나는 시각을 Player 속성 `BoostSpeedUntil`, `BoostJumpUntil`, `BoostGlowUntil`(`Workspace:GetServerTimeNow()` 기준, 없으면 0)로 복제한다. 시작과 끝에 토스트("달리기 +20% · 60초", "달리기 효과가 끝났어요").
- 이모트는 팔지 않는다(기본 4종을 모두가 쓴다).

## 화면

`roblox-ui-ux` 스킬을 먼저 읽는다. 목업 v2의 상점 창을 따른다.

- **여는 법**: 상점 NPC의 `ProximityPrompt`를 누르면 그 상점 탭이 열린 채로 뜬다. 탭 3개(장난감 가게 / 패션 상점 / 마트)로 옮겨 다닐 수 있지만, **구매는 그 상점 구역 안에서만** 된다. 다른 상점 탭에서는 버튼이 "○○에서 살 수 있어요"(비활성)로 보인다. 장착·해제는 어느 탭에서나 된다.
- **상품 카드**: 아이콘 + 이름 + 한 줄 설명 + 버튼 하나. 버튼 상태:
  - 가진 것, 장착 중 → "장착 중"(누르면 해제)
  - 가진 것 → "장착"
  - 안 가진 것, 코인 충분 → "구매 · 320"
  - 코인 부족 → "80 부족"(누르면 카드가 살짝 흔들리고 토스트)
  - 간식 → 늘 "구매 · 30"
- **아이콘**: 이미지 에셋 없이 그린다. 풍선은 품목 색의 원, 발자취는 색이 번지는 막대(`UIGradient`), 반짝이는 색 점 여러 개, 칭호는 그 글자, 손전등 색은 색 원과 빛줄기, 간식은 이모지 한 글자. 이모지·기호는 실제로 보이는지 확인한다(HUD 작업 때 `✕`, `✓`가 네모로 나온 적이 있다).
- **반응**: 버튼을 누르면 즉시 "처리 중" 상태가 되고, 서버 응답이 오면 확정하거나 되돌린다. 연타해도 요청이 한 번만 가게 한다.
- **격자**: `UIGridLayout` + 스크롤. 휴대폰 가로에서 한 줄에 3장 안팎, 버튼 높이 44px 이상.
- 상단에 내 코인. 닫기는 X, 바깥 탭, Esc/B.
- **다른 NPC**: 화면을 새로 만들지 않고 토스트 한 줄로 답한다.
  - 몰 안내원: "소동이 벌어지면 광장으로 모여요!"
  - 이벤트 MC: `EventState`를 읽어 "다음 소동까지 약 N분" 또는 "지금 소동 중이에요!"
  - 커뮤니티 매니저: "게시판은 준비 중이에요"
  - 아케이드 매니저: "아케이드는 곧 열어요!"

## 건드리지 않는 것

- `HudController`의 기존 HUD(코인 표시는 `ProfileChanged`로 알아서 바뀐다).
- 오늘의 특가, 스탬프 보상 아이템, 로벅스 상품.
- `PROFILE_VERSION`.

## 확인 방법

1. 장난감 가게 NPC에게 말을 걸면 그 탭으로 열리는지. PC와 Device Simulator 휴대폰 가로에서 캡처(버튼 44px 이상, 조이스틱·점프 버튼과 겹치지 않음, 긴 이름이 넘치지 않음).
2. 빨강 풍선 구매: 코인 100 → 부족("50 부족"). `DebugGrantCoins`로 코인을 준 뒤 구매 → 코인이 150 줄고, 버튼이 "장착 중", 캐릭터에 풍선이 달리는지. 다른 클라이언트에서도 보여야 하므로 서버 데이터모델에서 캐릭터 아래에 파트가 있는지 확인한다.
3. 같은 것을 또 사려는 요청을 서버에 직접 보내면 `already_owned`이고 코인이 줄지 않는지.
4. 상점 구역 밖에서 `buy` 요청을 보내면 `not_in_shop`인지.
5. 잘못된 인자(숫자, nil, 없는 id, 아주 긴 문자열)를 보내도 오류 없이 거부하는지. 빠르게 20번 보내면 `rate_limited`가 나오는지.
6. 분류마다 하나씩 사서 달아 보고(풍선, 발자취, 반짝이, 칭호) 캡처. 해제하면 사라지는지. 캐릭터를 리셋해도 다시 달리는지.
7. 손전등 색을 장착하고 대정전을 강제로 시작하면 손전등이 그 색인지.
8. 에너지 젤리: 걷는 속도가 19.2가 되고 60초 뒤 16으로 돌아오는지. 효과 중에 또 먹으면 남은 시간만 60초가 되는지(속도는 19.2 그대로). 효과 중 리셋해도 유지되는지.
9. 다른 NPC 4명의 토스트.
10. 콘솔 오류가 없는지.

## 물어볼 것

- 품목 이름과 색은 위 표를 따르되, 화면에서 구별이 안 되는 색은 조정하고 보고한다.
- 풍선이 캐릭터나 카메라를 가려 거슬리면 위치를 조정하고 보고한다.
