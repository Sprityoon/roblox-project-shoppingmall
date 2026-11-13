# T-126 광장 피날레

## 목적

소동을 성공하면 바로 결과로 넘어가지 않고, **모두 광장으로 모이는 15초**를 둔다. 끝나는 순간 광장에 있는 사람은 집결 보너스를 받고 색종이가 터진다. 소동마다 모두가 한 화면에 모이는 순간을 만드는 것이 목적이다(게임의 "어울리는 공간" 성격). 근거: design-details.md 5번 "광장 피날레".

## 지금 상태

- `EventService`의 흐름: `idle → notice → active → result → idle`. 목표를 채우면 곧바로 보상을 주고 `result`로 간다.
- 소동 모듈 훅: `GetGoal`, `StartNotice`, `StopNotice`, `Start`, `Stop`.
- 클라이언트: `EventController`가 `ReplicatedStorage.EventState` 속성을 읽어 `HudController`에 전달한다. `HudController`가 예고·진행 배너와 결과 모달을 그린다.

## 만들 것

| 경로 | 할 일 |
|---|---|
| `ReplicatedStorage.Shared.Config.Events` | `Schedule`에 `FinaleSeconds = 15`, `GatherBonus = 10`, `GatherZoneId = "plaza"` 추가 |
| `ReplicatedStorage.Shared.Types` | `EventPhase`에 `"finale"` 추가. `EventResult`에 `gatherBonus: number` 추가 |
| `ServerScriptService.Server.Services.EventService` | 아래 "서버 동작" |
| `Client.Controllers.EventController`, `HudController` | 아래 "화면" |
| `ReplicatedStorage.Shared.Net` | 주석 표의 `EventState` 설명에 `finale` 단계 추가 |

## 서버 동작

1. `active`가 **성공**(진행도 ≥ 목표)으로 끝나면, 지금처럼 소동 모듈의 `Stop(ctx, true)`를 부르고 `ctx.folder`를 지운다(대정전이면 이때 불이 전부 들어온다).
2. 그다음 `Phase = "finale"`로 바꾸고 `FinaleSeconds` 동안 기다린다(`waitPhase`를 써서 `EndsAt`이 복제되고 디버그 건너뛰기도 듣게 한다).
3. 피날레가 끝나는 순간 `ZoneService:PlayersInZone(GatherZoneId)`에 있는 **모든 플레이어**(기여가 없어도)에게 `GatherBonus` 코인을 준다.
4. 광장 분수 위에서 색종이를 터뜨린다: 임시 파트 몇 개에 `ParticleEmitter`를 달아 `Emit`하고 4초 뒤 지운다. 에셋 없이 기본 파티클과 색(파스텔 여러 색)으로 만든다. 수치는 Config에 둔다.
5. 그 뒤에 기존 보상 계산과 `EventResult` 전송, `result` 단계로 간다. `EventResult.coins`는 집결 보너스를 **포함한** 합계, `gatherBonus`는 0 또는 `GatherBonus`.
6. **실패**했을 때는 피날레가 없다. 지금처럼 바로 `result`.
7. 집결 보너스는 기여가 0인 사람도 받는다. 이 경우 그 사람의 `EventResult.coins`는 `gatherBonus`와 같다.

## 화면

- `finale` 단계의 상단 중앙 배너: 예고 배너와 같은 모양으로 "광장으로 모여요!"와 남은 초를 보여 준다. 색은 `Theme`의 성공색 계열. 진행 배너는 숨긴다.
- 결과 모달: `gatherBonus > 0`이면 보상 줄에 "광장 집결 +10"을 더한다.
- 새 화면 요소를 만들지 말고 `HudController`의 기존 배너 코드를 재사용한다. `roblox-ui-ux` 스킬을 먼저 읽는다.

## 건드리지 않는 것

- 소동 모듈(`Server.Events.blackout` 등): 이 카드에서는 고치지 않는다.
- 보상 수치(`participation`, `clear`, `mvp`).

## 확인 방법

플레이 테스트에서 개발용 소동으로 확인한다(`dev_collect`는 반짝이에 닿으면 진행도가 오른다. 1인 목표 6).

1. `DebugEventControl:Fire("start", "dev_collect")` → `Fire("skip")`로 공지를 넘기고, 반짝이 6개를 모은다(캐릭터를 반짝이 위치로 옮겨도 된다).
2. 목표 달성 직후 `EventState.Phase == "finale"`이고 `EndsAt`이 약 15초 뒤인지.
3. 캐릭터를 광장 안(예: `(0, 4, 20)`)에 두고 피날레가 끝나면: 코인이 `참여 20 + 성공 40 + 집결 10 = 70` 늘고, 결과 모달에 "광장 집결 +10"이 보이는지.
4. 한 번 더 해서 이번에는 광장 밖(예: 마트 안)에 있으면: 60만 늘고 집결 줄이 없는지.
5. 시간 초과로 실패시키면(`skip`을 진행 중에 한 번 더) 피날레 없이 `result`로 가는지.
6. 피날레 중 배너가 보이는지: PC 화면과 Device Simulator 휴대폰 가로에서 캡처.
7. 콘솔에 오류가 없는지. 색종이 파트가 4초 뒤 남아 있지 않은지.

## 물어볼 것

- 없음. 색종이의 모양과 양은 재량으로 하되 3초 안에 끝나게 한다.
