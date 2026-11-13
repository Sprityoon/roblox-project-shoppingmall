# 작업 지시서 (handoff)

다른 AI 에이전트가 **이 폴더의 카드만 읽고** 작업할 수 있게 쓴 지시서다. 카드에 없는 것을 임의로 정하지 않는다.

## 지금 맡길 작업 (2026-11-13 사용자 결정)

위에서 아래 순서로 한다. 한 카드가 끝나면 확인 결과를 사용자에게 보고하고 다음으로 넘어간다.

| 순서 | 카드 | 내용 | 선행 | 크기 |
|---|---|---|---|---|
| 1 | [T-126](T-126-plaza-finale.md) | 광장 피날레: 소동 성공 뒤 광장 집결 카운트다운과 보너스 | 없음 | 작음 |
| 2 | [T-116](T-116-jobs.md) | 알바 2종: 마트 진열, 쇼핑백 배달 | 없음 | 중간 |
| 3 | [T-105](T-105-shop.md) | 상점과 아이템: 품목, 구매·장착, 꾸미기 표시, 상점 화면 | 없음 | 큼 |
| 4 | [T-117](T-117-first-visit.md) | 첫 접속 흐름: 환영 선물, 첫 알바 안내 | T-116, T-105 | 작음 |
| 5 | [T-127](T-127-job-ranks.md) | 알바 숙련도("직업"): 단계, 칭호와 유니폼 해금, "내 직업" 탭 | T-116, T-105 | 중간 |
| 6 | [T-128](T-128-social-actions.md) | 말 없이 하는 교류: 같이 일하기 보너스, 간식 나눠 주기, 하이파이브 | T-116, T-105 | 중간 |
| 7 | [T-120](T-120-decor.md) | 맵 2차 꾸미기: 정리, 상점 천장, 간판, 상품·소품 | A·B·C 부분은 언제든 가능 | 큼 |
| 8 | [T-109](T-109-cart-chase.md) | 소동 2호 "도망치는 쇼핑카트" | T-126 | 중간 |
| 9 | [T-129](T-129-event-twists.md) | 소동 변주("오늘의 변수"): 대정전 4개, 카트 3개 | T-126 (카트 쪽은 T-109) | 중간 |

5·6·9번은 2026-11-13에 추가됐다(만족 요소 검토 뒤 사용자가 세 방향을 모두 채택). 배경은 [../design-details.md](../design-details.md) 20번.

완료된 카드: [D-01](D-01-util.md) 공용 유틸 모듈.

## 2026-11-13에 사용자가 정한 것

| 항목 | 결정 |
|---|---|
| 작업 범위 | 위 9장 전부 |
| 꾸미기 재료 | 기본 파트 + **무료 에셋** + **Studio의 AI 생성 도구**를 함께 쓴다. 규칙은 T-120 카드 |
| 상점 천장 | 마트·장난감 가게·창고·전기실에 **천장을 덮는다** |
| 정리 | 기본 `Baseplate`와 `ServerStorage.MapArchive`를 **지운다**(문 밖에는 작은 바닥만 둔다) |

그 전에 정해진 것(이름 "소동", 알바 추가, 상점 품목, 소동 간격 5분 등)은 [../game-design.md](../game-design.md)와 [../design-details.md](../design-details.md)에 있다.

## 시작 전에 읽을 것

1. 프로젝트 루트 `AGENTS.md`
2. [../structure.md](../structure.md): Studio 계층, 규칙, 소동 추가 방법, 조명 구성
3. [../design-details.md](../design-details.md): 수치의 근거. 카드와 다르면 **카드가 우선**이다(카드가 더 나중에 쓰였다)
4. `.agents/skills/roblox-luau-architecture/SKILL.md` (모든 카드)
5. `.agents/skills/roblox-ui-ux/SKILL.md` (화면에 보이는 것을 만드는 카드: T-126, T-105, T-117, T-127, T-128, T-129. Claude Code에서는 훅이 강제한다)
6. `docs/mockups/ui_mockup_v2.html`, `ui_mockup_v2.md` (UI가 있는 카드)

## 공통 규칙

**구조**
- 진입점은 둘뿐이다(`Server.Main`, `Client.Main`). 새 `Script`/`LocalScript`를 만들지 않는다. 서버는 `Server.Services`, 클라이언트는 `Client.Controllers`에 `ModuleScript`를 넣으면 Loader가 `Init` → `Start` 순으로 실행한다. `Start` 안에서 무한 반복을 돌릴 때는 `task.spawn`으로 감싼다.
- 첫 줄은 `--!strict`. 수치는 전부 `ReplicatedStorage.Shared.Config` 아래 모듈에 둔다.
- 서버와 클라이언트 사이는 `Shared.Net`으로만 통신한다. Remote를 추가하면 `ReplicatedStorage.Remotes`에 인스턴스를 만들고 `Net`의 주석 표에 한 줄 적는다.
- 계속 유지되는 상태는 속성으로 복제하고(예: `EventState`, Player 속성 `ZoneId`, `Carrying`), 한 번 지나가는 알림만 Remote로 보낸다.
- 클라이언트는 의도만 보낸다. 가격, 재화, 보유 여부, 위치는 서버가 다시 검사한다.
- UI는 `ReplicatedStorage.UI`의 `Theme`, `Motion`, `AutoScale`, `Components`를 쓴다. 색·간격·글자 크기를 화면 코드에 직접 쓰지 않는다. 화면은 `ScreenController`를 거쳐 띄운다.

**Studio에서 작업할 때**
- 기존 스크립트는 읽고 나서 고친다. 통째로 덮어쓰지 않는다.
- 편집은 편집 모드에서 한다. 플레이 테스트를 멈춘 직후의 첫 수정이 사라진 적이 있다. 멈춘 뒤 3초쯤 기다리고, 수정한 값이 남았는지 다시 읽어 확인한다.
- 플레이 테스트(`start_stop_play`)는 해도 된다. 끝나면 반드시 멈춘다. 사용자가 플레이 중이면 멈추기 전에 묻는다.
- 인스턴스를 지우는 것은 카드에 "지운다"고 적힌 것만 한다. 그 밖의 삭제는 사용자에게 묻는다.
- `save_place`는 사용자가 요청할 때만 한다. Git 커밋·푸시도 사용자가 요청할 때 `roblox-checkpoint` 스킬로 한다.
- 화면 캡처(`screen_capture`)는 Studio 창이 보일 때만 된다. 시간 초과가 나면 한 번 더 시도한다.

**소동을 시험하는 법** (플레이 테스트 중 서버에서 `execute_luau`)

```lua
game.ServerStorage.DebugEventControl:Fire("start", "blackout") -- 바로 공지 시작
game.ServerStorage.DebugEventControl:Fire("skip")              -- 지금 단계의 남은 시간 건너뛰기
```

`execute_luau`에서 서비스를 `require`하면 실행 중인 것과 다른 복사본이 온다. 실행 중인 서비스의 상태를 바꾸려면 위처럼 BindableEvent를 쓰거나, 속성·인스턴스를 직접 읽는다.

**기록**
- 시작할 때 `docs/log/NOW.md`에 한 줄, 끝나면 지우고 `docs/log/YYYY-MM.md` 맨 아래에 기록, `docs/plan/tasks.md` 체크, 구조가 바뀌었으면 `docs/plan/structure.md` 갱신.
- 확인한 것과 확인하지 못한 것을 나눠 적는다. 실행하지 않은 확인을 했다고 쓰지 않는다.
- 요청받지 않은 기능은 만들지 않고 `docs/ideas/ideas.md`에 적는다.
- `docs/plan/game-design.md`는 사용자가 승인한 내용만 고친다.

**막히면**
- 카드의 명세가 모호하거나, 구조를 바꿔야 하거나, 카드의 좌표가 실제 맵과 맞지 않으면 임의로 정하지 말고 사용자에게 묻는다. 각 카드 끝의 "물어볼 것"도 참고한다.

## 보고 형식

카드 하나가 끝나면 아래를 사용자에게 알린다.

1. 만든 것과 고친 것 (Studio 경로)
2. 카드의 "확인 방법" 항목별 결과 (통과 / 실패 / 못 함)
3. 카드와 다르게 한 것과 이유
4. 사용자가 직접 봐야 하는 것

## 사용자가 직접 해야 하는 것 (AI가 할 수 없다)

- Studio 게임 설정 > 보안 > "Studio의 API 서비스 접근" 켜기: 코인과 아이템이 저장되는지 확인하려면 필요하다. 지금은 꺼져 있어 접속할 때마다 초기화된다.
- 서버 최대 인원을 16명으로 바꾸기(지금 60). 게임 설정에서 한다.
- 2명 이상 테스트(Studio의 테스트 > 로컬 서버 2인, 또는 지인과): 인원별 목표, MVP, 동시에 물건을 집는 경우.
- 실제 휴대폰에서 터치 조작과 속도 확인.

## 편집 모드에서 모듈을 시험하는 법

`execute_luau`(datamodel_type `Edit`)에서 모듈을 복제해 `require`하면 캐시 없이 최신 소스를 실행할 수 있다. 서비스에 의존하지 않는 순수 로직에만 쓴다.

```lua
local m = require(game.ReplicatedStorage.Shared.Util.NumberFormat:Clone())
return m.abbreviate(1234)
```
