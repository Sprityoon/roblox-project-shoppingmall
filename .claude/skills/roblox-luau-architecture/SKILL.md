---
name: roblox-luau-architecture
description: 로블록스(Roblox) 게임의 Luau 코드 구조, 서버-클라이언트 통신, 데이터 저장, 보안, 성능을 다루는 방법과 Roblox Studio MCP로 안전하게 작업하는 절차. 로블록스 게임의 스크립트를 새로 쓰거나 고칠 때, RemoteEvent/RemoteFunction, DataStore, ModuleScript 구조, 재화·구매·전투 같은 게임 로직, 핵 방지, 렉·메모리 문제, "스튜디오에 넣어줘/적용해줘" 같은 요청에는 반드시 이 스킬을 먼저 읽어라. 화면에 보이는 UI 작업이면 roblox-ui-ux 스킬도 함께 읽는다.
---

# Roblox Luau 구조와 작업 절차

1인 개발에서 가장 비싼 것은 나중에 구조를 뜯어고치는 일이다. 처음부터 아래 규칙을 지키면 기능이 늘어도 코드가 엉키지 않고, 핵 유저에게 재화를 털리지 않는다.

## 1. 어디에 무엇을 두는가

| 위치 | 내용 | 클라이언트가 볼 수 있나 |
|---|---|---|
| `ServerScriptService` | 서버 로직, 서비스 모듈 | 아니오 |
| `ServerStorage` | 서버 전용 에셋·데이터 | 아니오 |
| `ReplicatedStorage` | 양쪽이 쓰는 모듈, 설정 테이블, Remote, UI 컴포넌트 | 예 |
| `StarterPlayerScripts` | 클라이언트 컨트롤러(입력, 카메라, UI 제어) | 예 |
| `StarterGui` | 미리 배치한 ScreenGui(코드로 생성한다면 비워도 됨) | 예 |

- 진입점은 서버 `Script` 하나, 클라이언트 `LocalScript` 하나로 두고 나머지는 전부 `ModuleScript`로 만든다. 스크립트가 여러 개 흩어져 있으면 실행 순서를 알 수 없다.
- 기능 단위로 나눈다: 서버 `Services/CurrencyService`, `Services/ShopService`; 클라이언트 `Controllers/ShopController`. 서비스끼리는 `require`로 직접 부르고, 서버↔클라이언트만 Remote를 쓴다.
- 밸런스 수치(가격, 스탯, 확률)는 코드에 박지 말고 `ReplicatedStorage/Config/` 아래 데이터 테이블에 둔다. 수정이 쉽고 서버·클라이언트가 같은 값을 본다. 단, 클라이언트에 숨겨야 하는 값은 `ServerStorage`에 둔다.
- 새 모듈 첫 줄에 `--!strict`를 쓰고 공개 함수에 타입을 붙인다. 오타와 nil 실수를 실행 전에 잡아준다.

## 2. 클라이언트를 믿지 않는다

클라이언트 코드는 유저가 마음대로 바꿀 수 있고, Remote는 아무 인자로나 아무 때나 호출될 수 있다. 이것이 로블록스 보안의 전부다.

- 클라이언트는 **의도**만 보낸다("상품 A를 사고 싶다"). 결과("골드를 500으로 만들어라")를 보내게 하지 않는다. 가격·보유량·쿨다운·거리는 서버가 자기 데이터로 다시 계산한다.
- `OnServerEvent` 핸들러는 인자를 전부 검사한다: 타입(`typeof`), 범위, 테이블에 실제 존재하는 ID인지. 숫자는 NaN과 음수도 걸러낸다.
- Remote마다 플레이어별 호출 빈도를 제한한다.
- 서버에서 `RemoteFunction:InvokeClient`를 쓰지 않는다. 클라이언트가 응답하지 않으면 서버 스레드가 영원히 멈춘다.
- 중요한 게임 상태(재화, 인벤토리, 체력)는 서버가 보관하고 클라이언트에는 복제본만 보낸다.
- 클라이언트 쪽 즉시 반응(예측)은 연출에만 쓴다. 서버가 거부하면 되돌린다.

Remote는 `ReplicatedStorage/Remotes` 한 폴더에 모으고 이름을 `동사+대상`으로 짓는다(`RequestPurchase`, `InventoryUpdated`).

## 3. 데이터 저장

- 플레이어 데이터는 세션 동안 서버 메모리에 테이블로 들고 있다가, 접속 시 한 번 읽고 퇴장·주기적(수 분 간격)·서버 종료(`game:BindToClose`) 시 저장한다. 값이 바뀔 때마다 DataStore를 호출하면 요청 한도에 걸린다.
- DataStore 호출은 실패할 수 있으므로 `pcall`로 감싸고 재시도한다. **로드에 실패한 플레이어의 데이터는 저장하지 않는다.** 빈 기본값으로 기존 데이터를 덮어쓰는 것이 가장 흔한 데이터 유실 원인이다.
- 여러 서버에서 같은 플레이어 데이터를 동시에 쓰는 문제(세션 잠금)까지 직접 구현하기는 까다롭다. 검증된 오픈소스 모듈(ProfileStore 등)을 쓰는 것을 사용자에게 먼저 제안한다.
- 데이터 구조에 버전 번호를 넣고, 기본값 템플릿과 병합(reconcile)해서 필드가 추가돼도 옛 데이터가 깨지지 않게 한다.
- 로벅스 상품은 `MarketplaceService.ProcessReceipt`에서 지급을 처리하고, 지급이 저장된 것을 확인한 뒤에만 `PurchaseGranted`를 반환한다. 영수증 ID로 중복 지급을 막는다.
- Studio에서 DataStore를 테스트하려면 게임 설정에서 API 접근을 켜야 한다. 실제 데이터를 건드리지 않게 테스트용 키 접두사를 쓴다.

## 4. 성능과 정리

- 대기는 `task.wait`, `task.spawn`, `task.delay`를 쓴다(옛 `wait`, `spawn`, `delay`는 쓰지 않는다).
- `while true do` 폴링 대신 이벤트에 연결한다(`GetPropertyChangedSignal`, `ChildAdded`, 어트리뷰트 변경 시그널).
- 연결(`:Connect`)은 대상이 사라질 때 끊는다. 플레이어별 상태 테이블은 `PlayerRemoving`에서 지운다. 안 지우면 서버가 오래 돌수록 메모리가 샌다.
- 매 프레임 도는 코드(`Heartbeat`, `RenderStepped`) 안에서 인스턴스 생성·`FindFirstChild` 반복·테이블 할당을 피한다.
- 자주 생성·삭제되는 것(투사체, 이펙트, 데미지 숫자)은 풀에서 재사용한다.
- 많은 유닛·몹은 서버에서 수치로만 시뮬레이션하고 보이는 모델·애니메이션은 클라이언트가 그리게 하면 서버 부하와 네트워크 사용량이 크게 줄어든다.
- 체감 문제가 생기면 추측하지 말고 Studio의 MicroProfiler와 Developer Console(F9)의 메모리·네트워크 탭으로 측정부터 한다.

## 5. Roblox Studio MCP로 작업할 때

Studio MCP는 열려 있는 플레이스를 직접 바꾼다. 파일 저장소처럼 git으로 되돌릴 수 없으므로 순서를 지킨다.

0. **Studio를 고른다.** 대부분의 도구가 `studio_id`를 요구한다. `list_roblox_studios`로 열린 Studio를 확인하고 `get_studio_state`로 편집/플레이 상태를 본다.
1. **먼저 본다.** `search_game_tree`와 `inspect_instance`로 수정하려는 위치의 현재 계층을, `script_search`/`script_grep`/`script_read`로 기존 스크립트를 읽는다. 스크립트 수정은 `multi_edit`, 인스턴스 생성·속성 변경은 `execute_luau`로 한다. 도구 구성은 Studio 버전에 따라 바뀔 수 있으니 목록에 없는 이름을 추측해서 부르지 않는다.
   Studio 쪽에도 Roblox가 제공하는 스킬이 있다. `list_skills`로 확인하고 해당하는 것을 `skill`로 불러온 뒤 작업한다: API가 확실하지 않으면 `rbx-docs-search`, 버그 추적은 `rbx-debug`, 성능은 `rbx-perf-profiling`, 권한 오류는 `rbx-permissions`.
2. **기존 것을 존중한다.** 같은 역할의 모듈이 이미 있으면 새로 만들지 말고 그것을 고친다. 스크립트를 통째로 덮어쓰기 전에 내용을 읽고, 사용자가 손으로 만든 부분이 사라지지 않는지 확인한다.
3. **작게 바꾸고 확인한다.** 한 번에 한 기능을 넣고, `start_stop_play`로 플레이 테스트를 돌린 뒤 `get_console_output`으로 오류를 확인하고(화면은 `screen_capture`) 다음으로 넘어간다. 테스트가 끝나면 플레이를 멈춘다. `save_place`는 사용자가 요청했을 때만 한다.
4. **지우기 전에 묻는다.** 인스턴스 삭제, 대량 이름 변경, 워크스페이스 구조 변경은 되돌리기 어렵다. 무엇을 지울지 말하고 확인을 받는다.
5. **결과를 정확히 보고한다.** 무엇을 어디에 만들었는지 경로로 알려주고, 플레이 테스트로 확인한 것과 확인하지 못한 것을 구분해 말한다.

Studio가 꺼져 있거나 MCP가 연결되지 않았으면 도구가 동작하지 않는다. 그럴 때는 코드를 로컬 `.luau` 파일로 작성해 두고 사용자에게 연결 상태를 알린다.

## 6. 흔한 실수

- `game.Workspace.Part` 같은 경로를 클라이언트에서 바로 접근: 아직 복제되지 않았을 수 있다. `WaitForChild`를 쓴다(서버에서는 불필요).
- `Players.PlayerAdded`만 연결: 스크립트가 늦게 실행되면 이미 들어온 플레이어를 놓친다. 연결 후 `Players:GetPlayers()`도 한 번 순회한다.
- 캐릭터에 상태 저장: 리스폰하면 사라진다. 플레이어 단위 상태는 서버 테이블이나 `Player` 어트리뷰트에 둔다.
- 서버에서 UI 조작, 클라이언트에서 재화 변경: 역할이 뒤바뀐 것이다.
- `Instance.new("Part", parent)`처럼 생성과 동시에 부모 지정: 속성을 다 설정한 뒤 마지막에 `Parent`를 지정해야 불필요한 복제·재계산이 줄어든다.
