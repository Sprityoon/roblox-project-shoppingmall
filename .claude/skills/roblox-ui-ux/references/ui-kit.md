# UI Kit 뼈대 (Luau)

프로젝트에 UI 기반이 없을 때 `ReplicatedStorage/UI/` 아래에 그대로 만들어 쓰는 출발점이다. 값(색, 크기)은 게임 분위기에 맞게 바꾸되 구조는 유지한다.

목차
1. Theme: 디자인 토큰
2. Motion: 트윈 헬퍼
3. AutoScale: 뷰포트 대응 스케일
4. Button: 상태를 가진 버튼
5. Panel + Modal: 열고 닫는 창
6. Toast: 짧은 알림
7. 화면 조립 예시

배치 구조:

```
ReplicatedStorage/UI/
  Theme            (ModuleScript)
  Motion           (ModuleScript)
  AutoScale        (ModuleScript)
  Components/
    Button, Panel, Modal, Toast
StarterPlayer/StarterPlayerScripts/
  UIController     (LocalScript: 화면 생성·전환 담당)
```

## 1. Theme

```lua
--!strict
local Theme = {}

Theme.Color = {
	Bg = Color3.fromRGB(18, 20, 26),
	Surface = Color3.fromRGB(28, 31, 40),
	SurfaceHi = Color3.fromRGB(40, 44, 56),
	Stroke = Color3.fromRGB(62, 67, 82),
	Text = Color3.fromRGB(240, 242, 247),
	TextDim = Color3.fromRGB(160, 166, 180),
	Primary = Color3.fromRGB(88, 140, 255),
	OnPrimary = Color3.fromRGB(255, 255, 255),
	Success = Color3.fromRGB(72, 199, 142),
	Warning = Color3.fromRGB(255, 184, 76),
	Danger = Color3.fromRGB(240, 84, 84),
}

Theme.Space = { XS = 4, S = 8, M = 12, L = 16, XL = 24, XXL = 32 }
Theme.Radius = { S = 8, M = 12, L = 16 }
Theme.TextSize = { Display = 40, Title = 28, Body = 20, Label = 16 }
Theme.Font = {
	Regular = Font.fromEnum(Enum.Font.BuilderSans),
	Bold = Font.fromEnum(Enum.Font.BuilderSansBold),
}
Theme.Time = { Fast = 0.1, Base = 0.2, Slow = 0.3 }

return Theme
```

한글이 원하는 굵기로 나오는지는 Studio에서 직접 확인한다. 폰트에 한글 글리프가 없으면 대체 폰트로 그려져 굵기가 달라 보일 수 있다.

## 2. Motion

```lua
--!strict
local GuiService = game:GetService("GuiService")
local TweenService = game:GetService("TweenService")
local Theme = require(script.Parent.Theme)

local Motion = {}

local function info(duration: number, style: Enum.EasingStyle?, direction: Enum.EasingDirection?)
	return TweenInfo.new(duration, style or Enum.EasingStyle.Quad, direction or Enum.EasingDirection.Out)
end

-- 일반 속성 전환. 반환된 Tween의 Completed로 후속 처리를 건다.
function Motion.to(instance: Instance, goal: { [string]: any }, duration: number?): Tween
	local tween = TweenService:Create(instance, info(duration or Theme.Time.Base), goal)
	tween:Play()
	return tween
end

-- 이동·확대처럼 "움직이는" 연출. 모션 줄이기 설정이면 즉시 적용한다.
function Motion.move(instance: Instance, goal: { [string]: any }, duration: number?, style: Enum.EasingStyle?): Tween?
	if GuiService.ReducedMotionEnabled then
		for prop, value in goal do
			(instance :: any)[prop] = value
		end
		return nil
	end
	local tween = TweenService:Create(instance, info(duration or Theme.Time.Base, style), goal)
	tween:Play()
	return tween
end

return Motion
```

## 3. AutoScale

오프셋 값은 1920×1080 기준으로 디자인하고, 각 ScreenGui 루트에 `UIScale`을 달아 실제 뷰포트에 맞춘다.

```lua
--!strict
local AutoScale = {}

local REFERENCE = Vector2.new(1920, 1080)
local PHONE_HEIGHT = 500 -- 이보다 낮은 뷰포트는 휴대폰으로 본다
local PHONE_BOOST = 1.8 -- 휴대폰에서 터치 타겟을 확보하기 위한 배율

function AutoScale.attach(screenGui: ScreenGui): UIScale
	local uiScale = Instance.new("UIScale")
	uiScale.Parent = screenGui

	local camera = workspace.CurrentCamera :: Camera
	local function update()
		local v = camera.ViewportSize
		local scale = math.min(v.X / REFERENCE.X, v.Y / REFERENCE.Y)
		if v.Y <= PHONE_HEIGHT then
			scale *= PHONE_BOOST
		end
		uiScale.Scale = math.clamp(scale, 0.5, 1.5)
	end

	camera:GetPropertyChangedSignal("ViewportSize"):Connect(update)
	update()
	return uiScale
end

return AutoScale
```

배율 숫자는 출발점이다. 기준 해상도에서 주요 버튼 높이를 64~72로 잡으면 작은 휴대폰에서 대략 42~47px이 된다. Device Emulator에서 실제 크기를 보고 `PHONE_BOOST`를 조정한다. `UIScale`은 ScreenGui 바로 아래가 아니라 그 안의 루트 Frame에 달아도 된다(전체 화면 배경은 스케일에서 빼고 싶을 때).

## 4. Button

```lua
--!strict
local Theme = require(script.Parent.Parent.Theme)
local Motion = require(script.Parent.Parent.Motion)

export type Props = {
	Text: string,
	Variant: ("Primary" | "Secondary" | "Danger")?,
	Size: UDim2?,
	OnActivated: () -> (),
}

local Button = {}

local function lighten(color: Color3, amount: number): Color3
	return color:Lerp(Color3.new(1, 1, 1), amount)
end

function Button.new(props: Props): TextButton
	local variant = props.Variant or "Primary"
	local base = if variant == "Primary"
		then Theme.Color.Primary
		elseif variant == "Danger" then Theme.Color.Danger
		else Theme.Color.SurfaceHi
	local hover = lighten(base, 0.12)

	local button = Instance.new("TextButton")
	button.Name = "Button"
	button.AutoButtonColor = false
	button.Size = props.Size or UDim2.fromOffset(240, 64)
	button.BackgroundColor3 = base
	button.BorderSizePixel = 0
	button.FontFace = Theme.Font.Bold
	button.TextSize = Theme.TextSize.Body
	button.TextColor3 = if variant == "Secondary" then Theme.Color.Text else Theme.Color.OnPrimary
	button.Text = props.Text

	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, Theme.Radius.M)
	corner.Parent = button

	local scale = Instance.new("UIScale")
	scale.Parent = button

	button.MouseEnter:Connect(function()
		if button.Active then
			Motion.to(button, { BackgroundColor3 = hover }, Theme.Time.Fast)
		end
	end)
	button.MouseLeave:Connect(function()
		Motion.to(button, { BackgroundColor3 = base }, Theme.Time.Fast)
		Motion.to(scale, { Scale = 1 }, Theme.Time.Fast)
	end)
	button.InputBegan:Connect(function(input)
		local t = input.UserInputType
		if button.Active and (t == Enum.UserInputType.MouseButton1 or t == Enum.UserInputType.Touch) then
			Motion.to(scale, { Scale = 0.96 }, Theme.Time.Fast)
		end
	end)
	button.InputEnded:Connect(function(input)
		local t = input.UserInputType
		if t == Enum.UserInputType.MouseButton1 or t == Enum.UserInputType.Touch then
			Motion.to(scale, { Scale = 1 }, Theme.Time.Fast)
		end
	end)

	button.Activated:Connect(function()
		if button.Active then
			props.OnActivated()
		end
	end)

	return button
end

-- 비활성/처리 중 표시. 서버 응답을 기다리는 동안 연타를 막는 데도 쓴다.
function Button.setEnabled(button: TextButton, enabled: boolean)
	button.Active = enabled
	button.BackgroundTransparency = if enabled then 0 else 0.5
	button.TextTransparency = if enabled then 0 else 0.5
end

return Button
```

## 5. Panel + Modal

```lua
--!strict
local Theme = require(script.Parent.Parent.Theme)
local Motion = require(script.Parent.Parent.Motion)

local Modal = {}

-- content를 담을 Frame과 open/close 함수를 돌려준다.
function Modal.new(parent: ScreenGui, size: UDim2)
	-- 뒤 화면을 어둡게 하고, 바깥 탭으로 닫히게 하는 배경
	local dim = Instance.new("TextButton")
	dim.Name = "Dim"
	dim.AutoButtonColor = false
	dim.Text = ""
	dim.Size = UDim2.fromScale(1, 1)
	dim.BackgroundColor3 = Color3.new(0, 0, 0)
	dim.BackgroundTransparency = 1
	dim.BorderSizePixel = 0
	dim.Visible = false
	dim.Parent = parent

	local panel = Instance.new("CanvasGroup")
	panel.Name = "Panel"
	panel.AnchorPoint = Vector2.new(0.5, 0.5)
	panel.Position = UDim2.fromScale(0.5, 0.5)
	panel.Size = size
	panel.BackgroundColor3 = Theme.Color.Surface
	panel.BorderSizePixel = 0
	panel.GroupTransparency = 1
	panel.Parent = dim

	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, Theme.Radius.L)
	corner.Parent = panel

	local stroke = Instance.new("UIStroke")
	stroke.Color = Theme.Color.Stroke
	stroke.Thickness = 1
	stroke.Parent = panel

	local padding = Instance.new("UIPadding")
	padding.PaddingTop = UDim.new(0, Theme.Space.XL)
	padding.PaddingBottom = UDim.new(0, Theme.Space.XL)
	padding.PaddingLeft = UDim.new(0, Theme.Space.XL)
	padding.PaddingRight = UDim.new(0, Theme.Space.XL)
	padding.Parent = panel

	local scale = Instance.new("UIScale")
	scale.Scale = 0.92
	scale.Parent = panel

	local isOpen = false

	local function open()
		if isOpen then return end
		isOpen = true
		dim.Visible = true
		Motion.to(dim, { BackgroundTransparency = 0.45 })
		Motion.to(panel, { GroupTransparency = 0 })
		scale.Scale = 0.92
		Motion.move(scale, { Scale = 1 }, Theme.Time.Base, Enum.EasingStyle.Back)
	end

	local function close()
		if not isOpen then return end
		isOpen = false
		Motion.to(dim, { BackgroundTransparency = 1 }, Theme.Time.Fast)
		local tween = Motion.to(panel, { GroupTransparency = 1 }, Theme.Time.Fast)
		tween.Completed:Once(function()
			if not isOpen then
				dim.Visible = false
			end
		end)
	end

	dim.Activated:Connect(close)

	return { Panel = panel, Open = open, Close = close }
end

return Modal
```

패널 안쪽 클릭이 배경으로 새서 닫히는 일이 없게, 패널 내용물은 패널의 자식으로 두고 패널 자체는 `Active = true`로 둔다(필요 시). Esc/게임패드 B로 닫기는 `ContextActionService:BindAction`으로 열릴 때 묶고 닫힐 때 푼다.

## 6. Toast

```lua
--!strict
local Theme = require(script.Parent.Parent.Theme)
local Motion = require(script.Parent.Parent.Motion)

local Toast = {}

-- container: 상단 중앙에 고정된 Frame. UIListLayout(세로, Padding S)을 달아 여러 개가 쌓이게 한다.
function Toast.show(container: Frame, message: string, kind: ("Info" | "Success" | "Danger")?)
	local accent = if kind == "Success"
		then Theme.Color.Success
		elseif kind == "Danger" then Theme.Color.Danger
		else Theme.Color.Primary

	local toast = Instance.new("CanvasGroup")
	toast.AutomaticSize = Enum.AutomaticSize.XY
	toast.BackgroundColor3 = Theme.Color.SurfaceHi
	toast.BorderSizePixel = 0
	toast.GroupTransparency = 1

	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, Theme.Radius.S)
	corner.Parent = toast

	local stroke = Instance.new("UIStroke")
	stroke.Color = accent
	stroke.Thickness = 1
	stroke.Parent = toast

	local padding = Instance.new("UIPadding")
	padding.PaddingTop = UDim.new(0, Theme.Space.M)
	padding.PaddingBottom = UDim.new(0, Theme.Space.M)
	padding.PaddingLeft = UDim.new(0, Theme.Space.L)
	padding.PaddingRight = UDim.new(0, Theme.Space.L)
	padding.Parent = toast

	local label = Instance.new("TextLabel")
	label.AutomaticSize = Enum.AutomaticSize.XY
	label.BackgroundTransparency = 1
	label.FontFace = Theme.Font.Regular
	label.TextSize = Theme.TextSize.Label
	label.TextColor3 = Theme.Color.Text
	label.Text = message
	label.Parent = toast

	toast.Parent = container
	Motion.to(toast, { GroupTransparency = 0 })

	task.delay(2.5, function()
		local tween = Motion.to(toast, { GroupTransparency = 1 })
		tween.Completed:Once(function()
			toast:Destroy()
		end)
	end)
end

return Toast
```

같은 메시지가 연달아 뜨면 새로 쌓지 말고 기존 토스트의 시간을 연장하는 편이 깔끔하다. 동시에 3개를 넘기지 않는다.

## 7. 화면 조립 예시

```lua
--!strict
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local UI = ReplicatedStorage:WaitForChild("UI")
local Theme = require(UI.Theme)
local AutoScale = require(UI.AutoScale)
local Button = require(UI.Components.Button)

local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui")

local gui = Instance.new("ScreenGui")
gui.Name = "HUD"
gui.ResetOnSpawn = false
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
gui.DisplayOrder = 0
gui.Parent = playerGui
AutoScale.attach(gui)

-- 우상단 버튼 묶음: 좌표 대신 리스트 레이아웃으로 정렬
local topRight = Instance.new("Frame")
topRight.Name = "TopRight"
topRight.AnchorPoint = Vector2.new(1, 0)
topRight.Position = UDim2.new(1, -Theme.Space.L, 0, Theme.Space.L)
topRight.AutomaticSize = Enum.AutomaticSize.XY
topRight.BackgroundTransparency = 1
topRight.Parent = gui

local list = Instance.new("UIListLayout")
list.FillDirection = Enum.FillDirection.Horizontal
list.Padding = UDim.new(0, Theme.Space.S)
list.SortOrder = Enum.SortOrder.LayoutOrder
list.Parent = topRight

local shop = Button.new({
	Text = "상점",
	Variant = "Secondary",
	Size = UDim2.fromOffset(120, 64),
	OnActivated = function()
		-- 상점 모달 열기
	end,
})
shop.Parent = topRight
```
