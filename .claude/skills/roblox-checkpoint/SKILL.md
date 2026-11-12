---
name: roblox-checkpoint
description: 이 프로젝트의 Git/GitHub 커밋·풀·푸시 절차. 사용자가 "푸시해줘", "깃에 올려", "깃허브 백업", "커밋하자", "체크포인트", "깃 처리", "풀 푸시"라고 할 때 사용. 커밋 전 문서 동기화 점검(NOW.md·tasks.md·월별 로그·structure.md) → 민감 정보 및 Junction 중복 방지 → 컨벤션 커밋 → 리베이스/푸시 순서로 진행한다.
---

# Roblox Checkpoint — Git/GitHub 커밋·푸시 절차

## 1. 사전 점검

1. `git status -sb` + `git log --oneline -5`로 현재 브랜치·원격 추적 상태를 확인한다.
   - `No commits yet on main`이거나 원격 저장소가 비어 있으면 최초 커밋 뒤 `git push -u origin main`으로 업스트림을 먼저 연결한다(커밋 전에는 `git pull`/`git push` 모두 실패한다).
   - 내가 만들지 않은 예상 밖 변경이 있으면 목록을 사용자에게 보여주고 포함 여부를 확인한다.
2. **문서 동기화 점검** — 기능·맵·규칙 변경이 포함되면 커밋 전에 확인한다:
   - [docs/log/NOW.md](../../../docs/log/NOW.md): 끝난 작업 줄을 지웠는가
   - [docs/plan/tasks.md](../../../docs/plan/tasks.md): 완료 항목 `[x]` 체크 및 날짜·담당·검증 상태가 반영됐는가
   - `docs/log/YYYY-MM.md`: 한 일, 변경 위치, 확인 결과, 미확인 사항이 맨 아래에 추가됐는가
   - [docs/plan/structure.md](../../../docs/plan/structure.md) / [docs/plan/game-design.md](../../../docs/plan/game-design.md): 구조 변경이나 사용자 승인 기획 변경이 반영됐는가
   - 누락이 있으면 커밋 전에 채운다.
3. **Roblox Studio 플레이스 백업 구분**:
   - 로컬 Git에는 문서·스킬·설정만 들어 있고, Studio 플레이스(`테스트`, placeId `83133799777417`)의 스크립트·맵 변경은 Git에 자동 포함되지 않는다.
   - 플레이스 자체 백업이 필요하면 사용자 요청 시 Studio 클라우드 저장(`save_place`) 또는 `.rbxl` 내보내기 여부를 따로 안내한다.

## 2. 저장소 특유의 함정

- **`.agents/skills` Junction 중복 금지**: 스킬 원본은 `.claude/skills/`이고 `.agents/skills/`는 Windows Directory Junction이다. Windows `core.symlinks=false` 환경에서 `.agents/`를 추적하면 스킬이 2벌 복제되므로 `.gitignore`의 `.agents/` 제외를 유지한다(새 PC에서는 `cmd /c mklink /J .agents\skills ..\.claude\skills`로 복구).
- **에이전트 설정·토큰 파일 추적 금지**: 현재 `.mcp.json`은 토큰 없이 `StudioMCP.exe` 실행 명령만 포함하므로 공유 가능하지만, 새 에이전트/IDE가 만드는 `.cursor/mcp.json`, `.codex/`, `.gemini/`, `.claude/settings.local.json` 등에 인증 정보가 섞일 수 있다. `git status`에 이런 경로가 뜨면 절대 커밋하지 않는다.
- **한글 경로 인용**: 작업 루트가 `c:\minho\로블`이므로 쉘 명령에서 경로 인자는 큰따옴표(`"..."`)로 감싸고 UTF-8 인코딩을 유지한다.

## 3. 커밋

- 메시지 컨벤션: `feat:` / `fix:` / `docs:` / `chore:` 접두사 + 한 줄 요약 (예: `docs: T-115, T-108 완료 기록 및 대정전 구조 반영`).
- 관련 파일만 명시적으로 `git add` 한다(전체 `git add -A`는 `.gitignore`를 확인했거나 사용자가 전체 백업을 요청했을 때만 사용).
- 훅이나 서명 우회 옵션(`--no-verify` 등)은 쓰지 않는다.

## 4. 풀 · 푸시

1. 원격에 `origin/main`이 이미 있으면 푸시 전 `git fetch origin`으로 원격 변경을 확인하고, 필요 시 `git pull --rebase origin main`을 먼저 실행한다(멀티 PC/에이전트 환경에서 `docs/`가 동시에 바뀔 수 있음).
2. `docs/plan/tasks.md`, `docs/log/*.md`, `docs/plan/game-design.md`, `docs/plan/structure.md`에서 충돌이 나면 한쪽을 덮어쓰지 말고 **양쪽 항목을 모두 보존**하는 방향으로 병합한다.
3. 첫 푸시이거나 업스트림이 없으면 `git push -u origin main`, 이후에는 `git push`를 실행한다.
4. 푸시 후 `git status -sb`, `git branch -vv`, `git log --oneline -3`으로 결과를 확인해 보고한다.

