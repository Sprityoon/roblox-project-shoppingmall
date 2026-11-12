# D-01 공용 유틸 모듈

상태: 대기 → 진행은 `docs/log/NOW.md` 참고

## 만들 것

모두 `ReplicatedStorage.Shared.Util` 아래 `ModuleScript`. 순수 로직만(인스턴스 생성, 서비스 호출 없음. 단 RateLimiter는 `os.clock`만 사용). 첫 줄 `--!strict`, 공개 함수에 타입.

### NumberFormat

| 함수 | 동작 | 예 |
|---|---|---|
| `abbreviate(n: number): string` | 1000 미만은 정수 그대로, 이상은 소수 한 자리 축약(K, M, B). 소수가 0이면 생략. 반올림 말고 버림 | `999`→`"999"`, `1000`→`"1K"`, `1234`→`"1.2K"`, `1999`→`"1.9K"`, `1234567`→`"1.2M"`, `2000000000`→`"2B"` |
| `comma(n: number): string` | 세 자리마다 쉼표. 음수 지원. 정수로 내림 | `1234567`→`"1,234,567"`, `-1234`→`"-1,234"`, `12`→`"12"` |
| `duration(seconds: number): string` | 분:초(초는 두 자리). 음수는 0으로 | `65`→`"1:05"`, `5`→`"0:05"`, `600`→`"10:00"` |

### TableUtil

| 함수 | 동작 |
|---|---|
| `deepCopy<T>(value: T): T` | 중첩 테이블까지 복사. 테이블이 아니면 그대로 반환 |
| `reconcile(target: {[any]: any}, template: {[any]: any})` | `template`에 있고 `target`에 없는 키만 (깊은 복사로) 채운다. 양쪽 다 테이블이면 재귀. 이미 있는 값은 덮어쓰지 않는다. `target`을 직접 수정하고 반환 |

### Validate

클라이언트가 보낸 값을 서버에서 검사할 때 쓴다. 전부 `boolean` 반환, 오류를 던지지 않는다.

| 함수 | 참인 조건 |
|---|---|
| `isFiniteNumber(v: any)` | number이고 NaN·무한대가 아님 |
| `isIntegerInRange(v: any, min: number, max: number)` | 유한한 정수이고 min 이상 max 이하 |
| `isNumberInRange(v: any, min: number, max: number)` | 유한한 수이고 min 이상 max 이하 |
| `isStringWithMaxLength(v: any, maxChars: number)` | string이고, 유효한 UTF-8이며, 글자 수(`utf8.len`)가 maxChars 이하 |
| `isArrayOfLength(v: any, min: number, max: number)` | 테이블이고, 키가 1..n 연속 정수뿐이며, n이 min 이상 max 이하 |

### RateLimiter

플레이어별 Remote 호출 빈도 제한.

```lua
local limiter = RateLimiter.new(5, 10) -- 10초에 5번까지
if not limiter:check(player.UserId) then return end
limiter:remove(player.UserId) -- PlayerRemoving 때
```

- `RateLimiter.new(maxCalls: number, perSeconds: number)`
- `:check(key: number | string): boolean` 허용이면 true를 반환하고 호출 1회를 기록. 초과면 false(기록하지 않음). 슬라이딩 윈도우 방식.
- `:remove(key)` 해당 키의 기록 삭제.
- 시간은 `os.clock()`. 테스트를 위해 `new`의 세 번째 인자로 시계 함수 `() -> number`를 선택적으로 받을 수 있게 한다.

## 확인 방법

`handoff/README.md`의 방법으로 편집 모드에서 각 모듈을 `require`해, 위 표의 예와 아래 경우를 실제로 실행한 출력을 보고한다.

- `Validate.isFiniteNumber(0/0)` → false, `isIntegerInRange(1.5, 1, 2)` → false, `isStringWithMaxLength("한글네글", 4)` → true, 같은 문자열에 3 → false
- `Validate.isArrayOfLength({1, 2, x = 3}, 0, 5)` → false
- `reconcile({a = 1, n = {x = 1}}, {a = 9, b = 2, n = {x = 9, y = 2}})` → `{a = 1, b = 2, n = {x = 1, y = 2}}`, 그리고 채워진 테이블이 template과 같은 참조가 아닌지
- RateLimiter: 가짜 시계로 한도까지 true, 초과 false, 시간이 지나면 다시 true

## 하지 말 것

- 이 네 모듈 외의 스크립트 수정, 플레이 테스트 시작, 플레이스 저장.
