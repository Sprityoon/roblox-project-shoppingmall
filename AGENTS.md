# 에이전트 안내

이 폴더는 1인 개발 로블록스(Roblox) 게임 프로젝트다. 어떤 AI 에이전트든(Claude Code, Codex, Cursor, Gemini CLI, Copilot 등) 작업을 시작하기 전에 아래 스킬 중 해당하는 것을 먼저 읽고 따른다.

## 작업 기록 (docs/)

여러 에이전트와 사용자가 번갈아 작업하므로, 작업 전후에 `docs/`를 읽고 쓴다. 자세한 규칙은 `docs/README.md`.

1. 시작 전: `docs/log/NOW.md`(진행 중인 작업)와 `docs/plan/tasks.md`(할 일)를 읽는다.
2. 시작할 때: `docs/log/NOW.md`에 자기 작업을 한 줄 적는다. 다른 담당자가 잡은 범위는 건드리지 않는다.
3. 끝나면: `NOW.md`에서 자기 줄을 지우고, 이번 달 로그(`docs/log/YYYY-MM.md`) 맨 아래에 기록하고, `tasks.md`를 체크한다.
4. 요청받지 않은 기능은 구현하지 말고 `docs/ideas/ideas.md`에 적는다. 거기 있는 아이디어는 사용자가 채택하기 전에는 구현하지 않는다.
5. `docs/plan/game-design.md`는 사용자가 승인한 내용만 반영한다.

간단한 질문에 답하는 정도면 기록하지 않아도 된다. 파일이나 Studio 플레이스를 바꿨으면 기록한다.

## 스킬

스킬 원본은 `.claude/skills/`에 있고, `.agents/skills/`는 같은 폴더를 가리키는 링크다(어느 경로로 읽어도 같은 파일). 수정은 한 곳에서만 하면 된다.

| 스킬 | 언제 읽는가 | 경로 |
|---|---|---|
| roblox-ui-ux | 화면에 보이는 것(HUD, 메뉴, 상점, 버튼, 모달, 토스트, 튜토리얼)을 만들거나 고칠 때. 모바일 대응, 애니메이션, 입력 반응 포함 | `.agents/skills/roblox-ui-ux/SKILL.md` |
| roblox-luau-architecture | Luau 스크립트 구조, 서버-클라이언트 통신, 데이터 저장, 보안, 성능을 다룰 때. Roblox Studio MCP로 플레이스를 수정할 때 | `.agents/skills/roblox-luau-architecture/SKILL.md` |
| roblox-checkpoint | Git/GitHub 커밋·풀·푸시("푸시해줘", "깃에 올려", "체크포인트", "백업")를 할 때 | `.agents/skills/roblox-checkpoint/SKILL.md` |

각 `SKILL.md`가 본문이고, 같은 폴더의 `references/`는 본문에서 가리킬 때만 읽는 상세 자료다. UI 작업은 두 스킬을 모두 읽는다.

**UI 코드를 쓰기 전에 roblox-ui-ux 스킬을 읽는 것은 선택이 아니다.** Claude Code에서는 훅(`.claude/hooks/ui-skill-guard.mjs`)이 스킬을 읽지 않은 세션의 UI 코드 작성을 거부한다. 훅이 없는 다른 에이전트도 같은 규칙을 스스로 지킨다.

## Roblox Studio MCP

`.mcp.json`에 `Roblox_Studio` 서버가 등록돼 있다(Roblox Studio가 실행 중이어야 동작). 다른 MCP 클라이언트에서 쓰려면 같은 `command`/`args`를 그 클라이언트의 MCP 설정에 넣는다. Roblox가 배포한 `mcp.bat`는 이 PC의 한글 사용자 폴더 경로 때문에 실행에 실패하므로 `.mcp.json`의 명령을 그대로 쓴다.

Studio MCP에는 Roblox가 제공하는 자체 스킬이 있다. `list_skills`로 목록을 보고 `skill`로 불러온다. 자주 쓸 것:

- `rbx-device-simulator-lua`: 기기별 UI 확인(휴대폰·태블릿·PC)
- `rbx-docs-search`: API가 확실하지 않을 때 공식 문서 조회
- `rbx-debug`, `rbx-unit-test`, `rbx-perf-profiling`: 디버깅, 테스트, 성능 측정

## 공통 규칙

- 사용자는 한국어로 소통한다.
- Studio의 플레이스는 git으로 되돌릴 수 없다. 기존 스크립트를 읽지 않고 덮어쓰거나, 묻지 않고 인스턴스를 지우지 않는다.
- 확인하지 못한 것(기기 테스트, 플레이 테스트)은 확인했다고 말하지 않는다.
