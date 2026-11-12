# 위임 작업 카드

범위가 좁고 명세가 정해진 구현 작업이다. 어떤 에이전트든 카드 하나를 읽고 그대로 수행할 수 있게 썼다.

## 수행 규칙

1. 시작 전에 프로젝트 루트의 `AGENTS.md`, `docs/plan/structure.md`, `.agents/skills/roblox-luau-architecture/SKILL.md`를 읽는다.
2. `docs/log/NOW.md`에 작업을 잡는다(하위 에이전트로 실행된 경우 부모가 대신 기록한다).
3. 카드의 "만들 것"에 적힌 경로만 만들거나 고친다. 다른 스크립트, `ReplicatedStorage.UI`, `Client.Screens`는 건드리지 않는다.
4. Studio는 편집 모드에서만 작업한다. 플레이 테스트를 시작하거나 플레이스를 저장하지 않는다(다른 담당과 충돌한다).
5. 카드의 "확인 방법"을 실제로 실행하고 결과를 보고한다. 실행하지 못한 확인은 못 했다고 적는다.
6. 명세가 모호하거나 구조를 바꿔야 할 것 같으면 임의로 정하지 말고 보고한다.

## 편집 모드에서 모듈 테스트하는 법

`execute_luau`(datamodel_type `Edit`)에서 모듈을 복제해 `require`하면 캐시 없이 최신 소스를 실행할 수 있다.

```lua
local m = require(game.ReplicatedStorage.Shared.Util.NumberFormat:Clone())
return m.abbreviate(1234)
```

## 카드 목록

| 카드 | 내용 | 선행 |
|---|---|---|
| [D-01](D-01-util.md) | 공용 유틸 모듈 (완료) | 없음 |
