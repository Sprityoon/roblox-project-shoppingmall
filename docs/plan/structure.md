# 프로젝트 구조

코드의 원본은 Roblox Studio 플레이스(이름 "테스트", placeId 83133799777417)다. 로컬 폴더에는 문서·스킬·설정만 있다.

## Studio 계층

```
Workspace
  Mall                    실내 쇼핑몰 맵 루트 (220×160 studs). 닫힌 공간이라 밖으로 나갈 수 없다
    Structure             바닥, 외벽, 천장(이름은 SkylightRoof지만 불투명), 2층 링 구조, 닫힌 입구 문(EntranceDoors)
                          높이: 바닥 윗면 Y=1, 2층 바닥 Y=24~25, 지붕 아랫면 Y=49
    Zones                 구역별 모델 (Plaza, Stage, PhotoZone, Mart, ToyShop, Community, Fashion, Arcade, Storage, PowerRoom)
    Triggers              Region/구역 진입·이벤트 트리거 파트
    Lights                조명 기구. 구역 id 이름의 폴더(속성 ZoneId)로 묶여 있다: plaza, stage, photo, entrance,
                          mart, toy_shop, community, fashion, arcade, storage, power_room, corridor
    NPCs                  NPC 7명. <npcId>(속성 NpcId, ZoneId, NpcRole) 아래 SpawnPad와 Character(R15 캐릭터).
                          Character.HumanoidRootPart에 ProximityPrompt, Character.Head에 이름표(NameTag)
    Customers             손님 NPC 6명(`customer_1~6`, R15 캐주얼 복장·웃는 얼굴, NameTag 없음, Persistent). 쇼핑백 배달 대상 [구현됨]
    Jobs                  알바 마커(`Stock/BoxSpawns` 4개, `Stock/ShelfSlots` 12개, `Delivery/BagSpawns` 2개) [구현됨]
    JobProps              (실행 중 생성, Persistent) 상자·쇼핑백·진열대 윤곽/상품·손님 대기 배지·바닥 원 컨테이너 [구현됨]

ReplicatedStorage
  Shared
    Loader            폴더의 모듈을 Init → Start 순서로 실행
    Net               Remote 창구. 사용 가능한 Remote 목록이 주석에 있다
    Types             플레이어 프로필, 상점 아이템, 구역, 소동 상태 공용 타입
    Config
      GameConfig      전역 수치 (맵 규격, 소동 공지 시간, 초기 코인 등)
      Npcs            NPC 연출 수치(동작 id, 인사 거리·간격, 눈 깜빡임)
      Carry           들고 나르기 수치(줍기 반경, 머리 위 높이, 방치 복귀 시간 등)
      Blackout        대정전 수치(인원 구간별 구역·칸 수, 차단기 좌표, 어두운 조명, 유도선)
      Events          소동 일정(첫 공지 90초, 간격 5분, 피날레 15초·집결 보너스 10, 결과 15초), 색종이 수치, 소동별 수치
      Zones           구역 표시 이름·대표 색(ZoneId → name/color), 복도 기본값, 운반 안내 문구 [구현됨]
      Jobs            알바 2종(진열·배달) 보상·리스폰·진열 재보충·배달 거리 단가·최소 운반 시간·5회 연속 보너스·연출 수치 [구현됨]
      Emotes          기본 이모트 4종(손 흔들기·환호·춤·웃음) R15 애니메이션 ID·색상·라벨 [구현됨]
    Util              공용 순수 로직
      NumberFormat    1.2K 축약, 쉼표, 분:초
      TableUtil       deepCopy, reconcile
      Validate        클라이언트 입력 검사
      RateLimiter     플레이어별 호출 빈도 제한
  UI                  테마, 모션, AutoScale, 공용 컴포넌트 [구현됨]
    Theme             UI 목업 v2 디자인 토큰(Colors, Font, Radius, Spacing, Layout, Style* 헬퍼)
    Motion            Spring/Quad 트윈, PopIn, PunchScale, Shake (ReducedMotionEnabled 대응)
    AutoScale         1280×720 기준 UIScale 자동 보정 (0.78~1.25, fullViewport 보정 포함)
    Components        공용 UI 컴포넌트
      Button          터치 최소 44px 보장, 프레스 스케일 애니메이션
      Modal           Scrim 배면 차단, Card 클릭 투과 방지, X/바깥 탭/Esc·B 닫기
      Toast           상단 중앙 토스트 배너 (종류별 배지·아이콘·자동 페이드)
  Remotes             RemoteEvent / RemoteFunction 인스턴스
  EventState          (실행 중 생성) 소동 상태가 속성으로 복제되는 Configuration

ServerScriptService
  Server
    Main              서버 진입점 (Script). Services를 Loader로 실행
    Services
      DataService     플레이어 데이터(Mall Coins, 보유/장착 아이템, 통계) 로드·저장 [구현됨]
      ZoneService     구역 감지(Player 속성 ZoneId), 구역 안 빈 바닥 지점 고르기 [구현됨]
      ShopService     상점 품목 구매 검증, 장착 처리
      NpcService      NPC 연출: `Mall.NPCs` 및 `Mall.Customers` 서 있는 동작, 눈 깜빡임, 인사, 감사 손 흔들기(`PlayWave`), 대정전 중 손님 대기 일시정지(`SetCustomersPaused`)·복구 [구현됨]
      CarryService    들고 나르기 공통 조작(닿으면 머리 위 부착 + `pickedAt` 기록, 목적지 전달, 10초 방치 시 복귀) [구현됨]
      JobService      알바 2종(마트 진열·쇼핑백 배달) 진행, 진열대 자동 빈칸 전환, 4초 텔레포트 방지, 5회 연속 +5 보너스, 소동 시작 10초 전 알바 중단·완료 시 재개방 [구현됨]
      EventService    소동 일정, 60초 전 공지, 인원별 목표 조정, 성공 시 15초 광장 피날레(색종이·집결 보너스), 기여 집계, 보상 지급 [구현됨]
    Events            소동별 모듈. 파일 이름 = 소동 id. Loader가 실행하지 않고 EventService가 불러 쓴다
      blackout        소동 1호 "쇼핑몰 대정전": 정전·손전등·유도선·배터리·구역별 차단기 복구·손님 6명 패닉 표정/말풍선/복도 배회 장애 [구현됨]
      dev_collect     (개발용) 틀 시험용 소동. 자동 일정에 나오지 않는다

ServerStorage
  MapArchive
    NPC_whitebox      교체 전의 NPC 표식(상자·공). 지우지 않고 보관. 필요 없으면 사용자 확인 뒤 삭제
    Storage           창고 입구를 막던 막대(RestrictedBar). 창고를 열면서 옮김

StarterPlayer.StarterPlayerScripts
  Client
    Main              클라이언트 진입점 (LocalScript). Controllers를 Loader로 실행
    Controllers
      ScreenController       공용 ScreenGui(`MallHubUI`), 모달 1개 스택, 상단 토스트, TopInset 계산 [구현됨]
      HudController          상시 HUD(구역·운반 배지, 코인·증감 팝업, 소동 예고/진행 배너, 결과 모달, 이모트 4종 도크) [구현됨]
      InteractionController  NPC·상점·포토존·오브젝트 상호작용
      EventController        소동 상태 읽기(GetState, OnChanged, OnResult) 및 HUD/모달 연동 (임시 채팅 알림 제거) [구현됨]
    Screens           화면별 UI 모듈
```

## 조명 구성

- 천장이 막혀 있지만 건물 껍데기(천장, 외벽, 2층 바닥)는 그림자를 드리우지 않게 해 두었다. 해(`Lighting.Brightness` 0.8)가 실내 전체의 은은한 바탕 빛이 되고, 그 위에 `Mall.Lights`의 기구(약 56개, 전부 그림자 없음)가 얹힌다.
- 바탕이 흰 바닥이라 쉽게 하얗게 날아간다. 기구를 더 달면 화면 캡처로 밝기를 확인한다.
- 대정전 때는 해와 Ambient를 낮추고 구역 폴더 단위로 기구를 켠다.

## 규칙

- **진입점은 둘뿐이다.** 새 `Script`/`LocalScript`를 만들지 않는다. 서버 로직은 `Services`에, 클라이언트 로직은 `Controllers`에 `ModuleScript`로 추가하면 Loader가 자동으로 실행한다.
- **모듈 형태**: 테이블을 반환하고, 필요하면 `:Init()`(자기 초기화만)과 `:Start()`(다른 모듈 사용 가능)를 둔다. 첫 줄은 `--!strict`.
- **서버↔클라이언트트는 `Net`으로만.** Remote를 추가하면 `ReplicatedStorage.Remotes`에 인스턴스를 만들고 `Net` 주석 표에 한 줄 적는다. 클라이언트는 의도(예: `BuyItem(itemId)`)만 보내고 서버가 가격·재화·보유 여부를 전부 검증한다.
- **수치는 `Config`에.** 코드에 숫자를 직접 쓰지 않는다.
- **역할 분리**: `Shared.Util`은 서버·클라이언트 어디서 불러도 되는 순수 로직(인스턴스·서비스 접근 없음)만 둔다.

## 소동 추가 방법

1. `ReplicatedStorage.Shared.Config.Events`의 `Events` 표에 항목을 추가한다(이름, 설명, 진행 시간, 목표, 보상).
2. 같은 id의 `ModuleScript`를 `ServerScriptService.Server.Events`에 만든다.
   - `Start(ctx)`: 진행이 시작될 때 불린다. 만든 물건은 전부 `ctx.folder` 아래에 넣는다(끝나면 통째로 지워진다).
   - `Stop(ctx, success)`: (선택) 끝날 때 불린다.
   - `ctx.AddProgress(player, amount)`로 진행도를 올린다. `player`를 넘겨야 그 사람의 기여로 잡혀 보상을 받는다.
   - `ctx.goal`(인원에 맞춰 계산된 목표), `ctx.IsActive()`, `ctx.GetProgress()`, `ctx.RandomPoint(zoneId, 반지름)`(구역 안 빈 바닥)을 쓸 수 있다.
3. 시간, 목표 도달 판정, 보상 지급, 상태 복제는 `EventService`가 한다. 소동 모듈에서 따로 만들지 않는다.

**Studio에서 시험하기** (플레이 테스트 중 서버에서):

```lua
game.ServerStorage.DebugEventControl:Fire("start", "dev_collect") -- 바로 공지 시작
game.ServerStorage.DebugEventControl:Fire("skip")                 -- 지금 단계의 남은 시간 건너뛰기
```

**상태 복제 규칙**: 계속 유지되는 상태(소동 상태, 플레이어의 현재 구역)는 인스턴스 속성으로 복제하고, 한 번 지나가는 알림(결과, 토스트)만 Remote로 보낸다. 목록은 `Shared.Net` 주석에 있다.

## 검증 상태

- 2026-11-12 플레이 테스트: 구역 감지(광장·마트·스테이지·복도), 소동 공지 → 진행 → 성공/실패 → 결과, 코인 지급(100 → 160)을 확인. 콘솔 오류 없음.
- 2026-11-12 맵 수정 뒤 플레이 테스트: 서쪽 계단으로 2층 도달, 입구 유리문 통과 불가(걷기·점프)를 확인. 맵의 외형은 아직 아무도 눈으로 보지 못했다.
- 2026-11-12 1차 다듬기 뒤: 화면 캡처로 조명·재질·NPC 외형을 확인. 플레이 테스트에서 NPC의 서 있는 동작, 손님 쪽으로 돌기, 손 흔들기(클라이언트에서 손 높이 변화 측정), 눈 깜빡임을 확인.
- 2026-11-12 UI 기반 및 상시 HUD(T-104, T-106) 플레이 테스트: PC(`1422×753`) 및 Studio Device Simulator `iPhone 14` 가로(`844×390`, 실뷰포트 `749×388`, 배율 `0.78`)에서 TopBar·조이스틱·점프 버튼 회피, 터치 버튼 `>= 44px`, 코인·구역·운반·소동 예고/진행 배너·결과 모달·토스트·R15 이모트 4종 로드를 확인. 콘솔 Lua 오류 없음.
- 2026-11-13 광장 피날레(T-126) 플레이 테스트: `dev_collect`로 성공 시 `finale` 15초 배너(PC·iPhone 14 캡처)·광장 집결 +10 포함(`+70 C` / `"🎉 광장 집결 +10"`)·광장 밖 미지급(`+60 C` / 집결 줄 없음)·실패 시 `finale` 생략·색종이 3기점 분출 및 4초 뒤 정리 확인. 콘솔 오류 없음.
- 2026-11-13 알바 2종(T-116) 플레이 테스트: 마트 진열(4상자·6빈칸/6진열칸·40~70초 자동 비워짐·3초 상자 리스폰·진열칸 거절), 쇼핑백 배달(장난감/패션 2스폰·손님 2/6 대기·거리 비례 6~10C·인사 507770239 재생·2초 뒤 다음 손님), 4초 미만 텔레포트 방지(물건 소비/코인·횟수 미지급), 5회 연속 +5 보너스 및 10초 방치 시 연속 초기화, `dev_collect` 공지/진행/대기 전환 및 보행 속도 실측 확인. 콘솔 오류 없음.
- 미확인: 데이터 저장(Studio의 API 접근이 꺼져 있어 임시 프로필로만 동작), 여러 명일 때의 목표 조정과 MVP, 실제 모바일/태블릿 기기 터치 체감.
