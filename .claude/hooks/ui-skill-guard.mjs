// UI/UX 스킬 강제 훅.
// roblox-ui-ux 스킬을 읽지 않은 상태에서 UI 코드를 쓰려고 하면 그 도구 호출을 막는다.
// 이벤트별 동작:
//   PostToolUse(Read|Skill)  스킬을 읽었으면 "읽음" 표식을 남긴다
//   PreToolUse               UI 코드인데 표식이 없으면 거부한다
//   UserPromptSubmit         UI 관련 요청이면 스킬을 읽으라고 알려준다
//   SessionStart(compact)    대화가 압축되면 스킬 내용도 사라지므로 표식을 지운다
// 훅 자체에 문제가 생기면 작업을 막지 않고 통과시킨다.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SKILL = "roblox-ui-ux";
const SKILL_PATH = ".claude/skills/roblox-ui-ux/SKILL.md";

// GUI 인스턴스·레이아웃 API 이름. 이 중 하나라도 코드에 있으면 UI 작업으로 본다.
const UI_CODE =
	/\b(ScreenGui|SurfaceGui|BillboardGui|StarterGui|PlayerGui|TextButton|ImageButton|TextLabel|ImageLabel|TextBox|ScrollingFrame|ViewportFrame|CanvasGroup|UDim2|UIListLayout|UIGridLayout|UIPageLayout|UITableLayout|UICorner|UIStroke|UIPadding|UIScale|UIGradient|UIFlexItem|UIAspectRatioConstraint|UISizeConstraint|UITextSizeConstraint)\b/;

// 사용자 요청에서 UI 작업을 짐작하게 하는 표현.
const UI_PROMPT =
	/(\bUI\b|\bUX\b|\bGUI\b|\bHUD\b|화면|버튼|메뉴|상점|인벤토리|모달|팝업|토스트|튜토리얼|레이아웃|디자인|꾸며|예쁘|깔끔|아이콘|폰트|글자\s*크기|애니메이션|트윈)/i;

function markerFile(input) {
	const dir = path.join(os.tmpdir(), "claude-roblox-ui-skill");
	const key = `${input.session_id ?? "unknown"}__${input.agent_id ?? "main"}`.replace(/[^\w.-]/g, "_");
	return { dir, file: path.join(dir, `${key}.read`) };
}

function hasRead(input) {
	return fs.existsSync(markerFile(input).file);
}

function markRead(input) {
	const { dir, file } = markerFile(input);
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(file, new Date().toISOString());
}

function clearRead(input) {
	fs.rmSync(markerFile(input).file, { force: true });
}

function isSkillFile(p) {
	return /roblox-ui-ux[\\/]+SKILL\.md$/i.test(String(p ?? ""));
}

function isUiToolCall(input) {
	const name = input.tool_name ?? "";
	const ti = input.tool_input ?? {};
	if (name === "Write" || name === "Edit") {
		// 로컬 파일은 Luau 소스만 검사한다(스킬 문서·기획 문서에는 API 이름이 그대로 나온다).
		if (!/\.(luau|lua)$/i.test(String(ti.file_path ?? ""))) return false;
		return UI_CODE.test(`${ti.content ?? ""}\n${ti.new_string ?? ""}`);
	}
	if (name.startsWith("mcp__Roblox_Studio__")) {
		return UI_CODE.test(JSON.stringify(ti));
	}
	return false;
}

function main() {
	const input = JSON.parse(fs.readFileSync(0, "utf8"));
	const event = input.hook_event_name;

	if (event === "PostToolUse") {
		const ti = input.tool_input ?? {};
		if (input.tool_name === "Read" && isSkillFile(ti.file_path)) markRead(input);
		if (input.tool_name === "Skill" && String(ti.skill ?? "").includes(SKILL)) markRead(input);
		return;
	}

	if (event === "SessionStart") {
		if (input.source === "compact") clearRead(input);
		return;
	}

	if (event === "UserPromptSubmit") {
		const prompt = String(input.prompt ?? "");
		if (prompt.trimStart().startsWith(`/${SKILL}`)) {
			markRead(input);
			return;
		}
		if (UI_PROMPT.test(prompt) && !hasRead(input)) {
			process.stdout.write(
				`[프로젝트 훅] 이 요청이 로블록스 UI/UX 작업을 포함한다면, 코드를 쓰기 전에 ${SKILL} 스킬을 먼저 읽어라` +
					` (Skill 도구 "${SKILL}" 또는 ${SKILL_PATH}). 읽지 않으면 UI 코드를 쓰는 도구 호출이 훅에 의해 거부된다.`,
			);
		}
		return;
	}

	if (event === "PreToolUse") {
		if (!isUiToolCall(input) || hasRead(input)) return;
		process.stdout.write(
			JSON.stringify({
				hookSpecificOutput: {
					hookEventName: "PreToolUse",
					permissionDecision: "deny",
					permissionDecisionReason:
						`UI 코드가 포함된 호출인데 이 세션에서 ${SKILL} 스킬을 아직 읽지 않았다. ` +
						`먼저 Skill 도구로 "${SKILL}"을 불러오거나 ${SKILL_PATH} 를 Read로 읽고, ` +
						`그 지침(토큰, 레이아웃, 모바일 기준, 상태, 모션)에 맞게 코드를 고친 뒤 다시 호출하라.`,
				},
			}),
		);
	}
}

try {
	main();
} catch {
	// 훅 오류로 작업이 막히지 않게 조용히 통과시킨다.
}
process.exit(0);
