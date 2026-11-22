---
title: 都什么年代了还在用 CC Switch？无桌面服务器部署 Magpie，直连与 Mac 反向隧道双通道实战
published: 2026-11-22
description: 记录在无可视化桌面的远程 Linux GPU 服务器上部署 Magpie（TUI + Serve）并联动本机 Mac 聚合网关的完整实战：涵盖直连中转优先 + SSH 反向隧道回退架构、模型列表裁剪、接入 Codex 与 Claude Code、对比 CC Switch 后台机制，以及 Mac 端桌面版 Codex（ChatGPT.app）与 CLI 模型列表/Fast 模式/自动审批一致性问题的深度排障。
tags: [magpie, claude-code, codex, ssh, linux, macos, ai, tooling]
category: 环境与系统
draft: false
aigc: Gemini 4 Neon
device: Linux
---

在远程 Linux GPU 服务器上跑 Claude Code、Codex 这类 CLI Agent 时，最头疼的往往不是工具本身，而是**模型与上游通道的管理**：一部分常用模型有稳定的公网中转站，另一部分本地独占通道（比如跑在个人 Mac 上的本地 CLI 桥接或聚合订阅）又只能在笔记本上用。如果每次切模型都要手改 `~/.claude/settings.json` 或 `~/.codex/config.toml`，很容易留下历史残留字段，维护成本极高。

最近在远程无桌面 Ubuntu 服务器上落地了 [Magpie](https://github.com/yetone/magpie)，把「公网直连中转」和「本机 Mac 上的 Magpie 聚合网关」统一收口到了服务器本地的 `127.0.0.1:3425`。这篇文章从架构演进讲起，完整复盘安装、SSH 反向隧道打通、模型精细化裁剪、接入 Codex 与 Claude Code、排查「为什么 CC Switch 不用起后台而 Magpie 需要」，以及最后解决 **Mac 本机桌面端 Codex（`ChatGPT.app`）与 Codex CLI 不一致**（模型列表不同步、Fast 切换缺失、无账号登录态下自动审批）的全过程。

::github{repo="yetone/magpie"}

## 一、架构思路演进：从「绕本机聚合」到「直连优先 + 本机互补」

一开始的想法很直觉：既然本机 Mac 上已经装好了 Magpie 桌面版，里面聚合了多套上游模型，那远程服务器也装一个 Magpie，主力走 SSH 反向隧道连回 Mac 的 Magpie API，再配一个自建 Sub4API（类似 Sub2API 中转站）作为次要备份。

动手前细想了一层，发现这个顺序其实绕了弯路：**本机 Mac 的 Magpie 背后本身也接了同一个 Sub4API 站点**。如果服务器上的高频主力模型先通过 SSH 隧道传回 Mac，再由 Mac 转发给 Sub4API，会带来两个明显问题：

1. **平白多出一跳网络延迟**：服务器本来就能公网直连中转站，绕一圈本地笔记本反而变慢；
2. **单点依赖本机在线**：Mac 一旦合盖休眠、切网络或断开 SSH，服务器上的主力模型也会跟着中断。

因此把架构反转并整理成了最终落地的**双通道结构**：

```text
远程 Linux 服务器 (无桌面)
┌──────────────────────────────────────────────────────────┐
│  Claude Code / Codex                                     │
│        │  http://127.0.0.1:3425 (Token: magpie)          │
│        ▼                                                 │
│  远端 Magpie Gateway (magpie serve)                      │
│   ├──► Provider: sub4  ──► 公网直连 Sub4API（主力优先）  │
│   └──► Provider: mac   ──► 127.0.0.1:13425               │
└──────────────────────────────▲───────────────────────────┘
                               │ SSH Reverse Tunnel
                               │ (-R 127.0.0.1:13425:127.0.0.1:3425)
┌──────────────────────────────┴───────────────────────────┐
│  本机 MacBook Pro                                        │
│  本地 Magpie App ([::]:3425，开启 Caller Key)            │
│   ├──► agy-cli (Gemini / Claude 等本地独占通道)          │
│   ├──► OpenCode Go (DeepSeek 等)                         │
│   └──► 其他上游（必要时亦可作为 sub4 的回退链路）        │
└──────────────────────────────────────────────────────────┘
```

- **高频主力直连**：服务器上的 `sub4` Provider 直接连公网中转站，零额外跳数，Mac 关机也不受影响；
- **独占能力穿透**：只有 Mac 上才有的本地桥接通道（如 `agy-cli`、`opencode-go`），通过 SSH 反向隧道映射到远端 `127.0.0.1:13425`，以 `remote-magpie` 预设接入远端 Magpie；
- **按需顺序回退**：需要高可用时，还可以用 Magpie 的 Routing Group 配 `routing=order`，实现 `sub4` 优先、异常自动切 `mac` 回退。

## 二、无桌面 Linux 服务器安装与运行形态

远程计算节点通常既没有图形界面，也不方便动系统级目录。Magpie 提供了静态链接的 Linux `x86_64` 单文件二进制，直接放在 `~/.local/bin/magpie` 即可免 root 运行。

安装后确认 PATH 包含 `~/.local/bin` 并检查版本：

```bash
export PATH="$HOME/.local/bin:$PATH"
which magpie
magpie --version
```

在没有桌面环境的服务器上，Magpie 的使用形态和 macOS 上略有不同，主要靠以下三种模式组合：

| 命令 | 定位 | 适用场景 |
| --- | --- | --- |
| `magpie serve` | 纯本地代理网关（默认 `127.0.0.1:3425`） | 放入 `screen` / `tmux` 或 `systemd` 后台常驻 |
| `magpie tui` | 终端交互界面（若无网关运行会临时附带启动） | SSH 终端内快速查看状态、切模型、调配置 |
| `magpie web` / `magpie serve --web` | 浏览器版完整面板（默认 `127.0.0.1:3430`） | 配合 SSH 本地端口转发，在本机浏览器里可视化管理 |

> [!TIP]
> 即使完全不使用 GUI，Magpie 的 CLI 本身也非常完整，从 Provider 管理、模型过滤、路由组配置到接管 Claude Code / Codex，都可以纯命令行完成。

## 三、打通本机 Mac Magpie：Caller Key 与 SSH 反向隧道

要让远程服务器上的 Magpie 安全地调用本机 Mac 上的 Magpie，只需两步：

### 1. 本机 Mac 开启 Caller Key

本机 Mac 上运行的 Magpie 默认监听 `[::]:3425`（可在 `~/.config/magpie/gateway.json` 确认）。在 Magpie 设置里生成一枚用于外部调用的 **Caller Key**（开启局域网/远程调用权限，对应保存在本机 `~/.config/magpie/caller-keys.json`），记下生成的密钥字符串。

### 2. 建立 SSH 反向隧道

由于远程服务器自己的 Magpie 也要占用 `127.0.0.1:3425`，反向隧道在远端必须换一个端口，这里选用 `13425`：

```bash
# 临时后台建立反向隧道：远端 127.0.0.1:13425 -> 本机 127.0.0.1:3425
ssh -fN \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -o ExitOnForwardFailure=yes \
  -R 127.0.0.1:13425:127.0.0.1:3425 \
  gpu-server
```

如果习惯直接随常用 SSH 会话一起打通，也可以写进本机 `~/.ssh/config`：

```ssh-config
Host gpu-server
    HostName <server-ip-or-host>
    User <username>
    RemoteForward 127.0.0.1:13425 127.0.0.1:3425
```

在远端服务器上确认 `13425` 已经监听并能拿到本机模型列表：

```bash
ss -tlnp | grep 13425
curl -sS -H "Authorization: Bearer <MAC_CALLER_KEY>" http://127.0.0.1:13425/v1/models | head -c 300
```

## 四、配置双 Provider 与精细化裁剪模型列表

### 1. 添加 `mac` 与 `sub4` 两个 Provider

Magpie 内置了专门面向「另一台电脑的 Magpie」的 `remote-magpie` 预设（可通过 `magpie presets` 看到），能够自动把 `chat`、`responses`、`anthropic`、`decide` 四个协议端点全部指向反向隧道地址：

```bash
# 添加本机 Mac Magpie 聚合通道（经 127.0.0.1:13425）
magpie provider add remote-magpie <MAC_CALLER_KEY> \
  id=mac \
  name="Mac Magpie" \
  url=http://127.0.0.1:13425/v1

# 添加公网直连的 Sub4API 中转站
magpie provider add sub4 \
  url=https://sub-api.example.com \
  key=<SUB4_API_KEY>
```

添加完成后，用 `magpie providers` 可以看到两者的联通与模型拉取情况：

```text
Mac Magpie   mac   127.0.0.1:13425      ● ...  49 models
sub4 custom  sub4  sub-api.example.com  ● ...  14 models
```

### 2. 自动分组（Auto Groups）与模型列表过长的噪音问题

两个 Provider 都接上后，马上遇到了一个非常现实的体验问题：

- `mac` 侧一次性拉回了 **49 个模型**（包含 Mac 上本身的 `auto/*` 组、`opencode-go/*` 一堆免费/测试模型、`codex/*`、`agy-cli/*` 等）；
- `sub4` 侧拉回了 **14 个模型**；
- 更麻烦的是，因为 `sub4` 和 `mac` 里有大量同名模型，Magpie 默认还会自动聚合出一批 `auto-*` 路由组。结果打开 Agent 的模型选择器时，列表里塞满了重复项和根本不会点开的模型。

> [!NOTE]
> 如果确实需要同名模型自动主备切换，可以保留或手动创建 Routing Group（例如 `magpie group add "GPT-6.2 Sol" models=sub4/gpt-6.2-sol,mac/auto/gpt-6.2-sol routing=order`），并给分组加上 `listed=no` 隐藏底层的重复裸模型。在本次配置里，我更倾向于让选择器直白可控，所以先关闭了自动分组，直接按通道精选暴露的模型。

### 3. 精细化裁剪：63 个模型压缩到 11 个主力模型

调整目标非常明确：

1. 关闭冗余的自动发现分组（`magpie group auto off`，对应 `~/.config/magpie/providers.json` 中的 `"noAutoGroups": true`）；
2. **`mac` 通道只留 Mac 独占精品（6 个，隐藏其余 43 个）**：
   - `opencode-go` 组只留主力 DeepSeek Flash；
   - `agy-cli` 组只留主力 Gemini 4 系列及 Claude Opus / Sonnet；
3. **`sub4` 通道只留高频直连主力（5 个，隐藏其余 9 个）**。

Magpie 支持直接通过 `magpie provider models <id> +<model>` / `-<model>` 动态增减暴露列表，也可以整理 `~/.config/magpie/providers.json` 的 `models` 字段（完整拉取列表保留在 `pickedFrom` 中，随时可恢复）。精简后的 `providers.json` 核心结构如下（敏感字段已脱敏）：

```json
{
  "providers": [
    {
      "id": "mac",
      "name": "Mac Magpie",
      "icon": "magpie",
      "preset": "remote-magpie",
      "key": "<MAC_CALLER_KEY>",
      "chat": "http://127.0.0.1:13425/v1",
      "responses": "http://127.0.0.1:13425/v1",
      "anthropic": "http://127.0.0.1:13425",
      "decide": "http://127.0.0.1:13425/v1",
      "models": [
        "opencode-go/deepseek-v4.1-flash",
        "agy-cli/gemini-4-neon",
        "agy-cli/gemini-4-argon",
        "agy-cli/gemini-4-hydrogen",
        "agy-cli/claude-opus-5-5",
        "agy-cli/claude-sonnet-5-5"
      ]
    },
    {
      "id": "sub4",
      "name": "sub4",
      "key": "<SUB4_API_KEY>",
      "chat": "https://sub-api.example.com",
      "models": [
        "gpt-6-luna",
        "gpt-6.2-astra",
        "gpt-6.2-astra-pro",
        "gpt-6.2-sol",
        "codex-auto-review"
      ]
    }
  ],
  "noAutoGroups": true
}
```

调整后执行 `magpie models`，整个远端网关对外只展示清清爽爽的 **11 个模型**，选型零干扰。

## 五、接入 Codex 与 Claude Code，并做端到端实测

### 1. 接入 Codex

一条命令切换模型和推理强度，Magpie 会自动维护 `~/.codex/config.toml`：

```bash
magpie codex sub4/gpt-6.2-sol
magpie codex effort high
```

写入后的 `~/.codex/config.toml` 核心片段如下（后续也可以在 Codex 内直接切到 `mac/agy-cli/...` 等任意已暴露模型）：

```toml
model_provider = "magpie"
model = "sub4/gpt-6.2-sol"
model_reasoning_effort = "high"
disable_response_storage = true
model_catalog_json = "/sdc/home/<username>/.codex/magpie-models.json"
openai_base_url = "http://127.0.0.1:3425/backend-api/codex"

[model_providers.magpie]
name = "magpie"
base_url = "http://127.0.0.1:3425/v1"
wire_api = "responses"
experimental_bearer_token = "magpie"
http_headers = { "x-openai-actor-authorization" = "magpie" }
```

### 2. 接入 Claude Code

动手前先给原有配置留一份备份，再执行接入命令：

```bash
cp ~/.claude/settings.json ~/.claude/settings.json.bak.pre-magpie
magpie claude sub4/gpt-6.2-sol
```

实际查看生成的 `~/.claude/settings.json`，Magpie 做得比预期细致得多：

- **自动清理历史脏字段**：此前其他中转工具写入的旧 `ANTHROPIC_BASE_URL` 以及一堆冗余的 `*_MODEL_NAME`、`CLAUDE_CODE_SUBAGENT_MODEL` 字段都被干净替换；
- **自动同步 `modelPicker`**：刚裁剪好的 11 个模型全部自动写入 `modelPicker.options`，在 Claude Code 里敲 `/model` 就能直接切换 `sub4` 和 `mac` 两侧的模型；
- **自动声明模型能力**：通过 `CLAUDE_CODE_MODEL_CAPABILITIES` 为每个模型写入对应的 `effort` / `xhigh_effort` / `max_effort` 支持矩阵，并配置好上下文窗口与自动压缩阈值。

生成的配置节选如下：

```json
{
  "modelPicker": {
    "options": [
      {
        "description": "via magpie",
        "label": "Claude Sonnet 5.5 · Antigravity (local agy CLI) · Mac Magpie",
        "model": "mac/agy-cli/claude-sonnet-5-5[1m]"
      },
      {
        "description": "via magpie",
        "label": "GPT-6.2 Sol · sub4",
        "model": "sub4/gpt-6.2-sol"
      }
    ]
  },
  "model": "sonnet",
  "env": {
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:3425",
    "ANTHROPIC_AUTH_TOKEN": "magpie",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "sub4/gpt-6.2-sol",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "sub4/gpt-6.2-sol",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "sub4/gpt-6.2-sol",
    "ANTHROPIC_SMALL_FAST_MODEL": "sub4/gpt-6.2-sol",
    "CLAUDE_CODE_MAX_CONTEXT_TOKENS": "922000",
    "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "272000",
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "128000"
  }
}
```

### 3. 双通道端到端实测

配置完别只看 `magpie ls`，直接跑两次 `claude -p` 实测两条物理链路（直连 `sub4` 与隧道回 `mac`）：

```bash
# 测试 1：默认模型走 sub4 公网直连
claude -p "Reply with exactly: OK_SUB4" --no-session-persistence --output-format text

# 测试 2：指定模型走 SSH 反向隧道回本机 Mac Magpie
claude -p "Reply with exactly: OK_MAC" \
  --model "mac/agy-cli/claude-sonnet-5-5" \
  --no-session-persistence --output-format text
```

两条命令分别返回 `OK_SUB4` 和 `OK_MAC`，证明远端网关、协议转换、公网直连与反向隧道全线跑通。

## 六、后台常驻方案，以及为什么 CC Switch 不用起后台？

验证完毕后，我停掉了临时调试用的 `tmux` 会话，改用自己顺手的 `screen` 来常驻 `magpie serve`：

```bash
# 推荐带会话名启动，后续排查日志方便直接 screen -r magpie
screen -dmS magpie magpie serve
```

三步确认服务健康：

```bash
# 1. 确认 screen 会话在运行
screen -ls
# 2. 确认 3425（远端网关）和 13425（Mac 反向隧道）均处于 LISTEN
ss -tlnp | grep -E "3425"
# 3. 确认网关接口可正常返回模型清单
curl -sS -m 5 -H "Authorization: Bearer magpie" http://127.0.0.1:3425/v1/models | head -c 300
```

### 为什么服务器上的 CC Switch 平时「不用管」，Magpie 却必须挂后台？

做到这里产生了一个很自然的疑问：同一台服务器上之前也装了 `cc-switch`，为什么平时从来没手动拉起过它的进程，它是不是自带开机自启？为什么 Magpie 不行？

上服务器实际查了一圈进程、`cc-switch daemon status`、`~/.config/systemd/user`、`/etc/systemd/system` 和 `crontab`，结果发现：**服务器上的 `cc-switch` 根本没有任何后台进程，也没有配置开机自启**（shell 配置里只有一条自动补全脚本）。

两者的差异其实来自**架构定位完全不同**：

| 对比项 | CC Switch（普通模式） | CC Switch（Daemon 模式） | Magpie（`magpie serve`） |
| --- | --- | --- | --- |
| 工作机制 | 静态配置文件切换器 | 本地代理 + 故障转移守护进程 | 本地统一协议网关 + 路由调度 |
| 写入配置的目标地址 | 直接写远端上游 URL 与真实 Key | 写本地代理端口 | 统一写 `http://127.0.0.1:3425` |
| 是否需要常驻进程 | **不需要**（写完配置即退出） | 需要 | **必须常驻** |
| 支持跨协议转换 / 模型聚合 | 否（依赖上游本身兼容） | 有限支持 | 原生支持（Responses / Anthropic / Chat） |

简而言之，普通模式下 `cc-switch` 只是帮你改完配置文件就下班了，后续 Claude Code / Codex 直接连远端 API，所以看起来像“永远在线”；而 Magpie 是流量必经的本地网关，所有协议转换、模型裁剪、双通道分流和用量统计都在 `127.0.0.1:3425` 上实时完成，因此 `magpie serve` 必须常驻。

### 无桌面服务器想给 Magpie 做开机自启，怎么配？

顺带踩了一脚 `magpie autostart on` 的坑：这个子命令是给带桌面环境的登录会话（例如 macOS `LaunchAgents` 菜单栏自启）设计的，在无桌面 Linux 服务器上直接执行并不生效。

如果希望服务器重启后自动拉起 Magpie，且不依赖人工开 `screen`，有两种标准 Linux 做法：

#### 方案 A：`systemd --user` + `Linger`（推荐，带崩溃自动重启）

新建 `~/.config/systemd/user/magpie.service`：

```ini
[Unit]
Description=Magpie Local AI Gateway
After=network-online.target

[Service]
Type=simple
ExecStart=%h/.local/bin/magpie serve
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
```

启用服务，并**务必检查当前用户的 `Linger` 状态**：

```bash
systemctl --user daemon-reload
systemctl --user enable --now magpie.service

# 检查 Linger 状态
loginctl show-user "$USER" -p Linger
```

> [!IMPORTANT]
> 如果输出是 `Linger=no`，意味着一旦你断开所有 SSH 会话，用户级 `systemd` 进程树会被系统回收，Magpie 也会跟着停掉。执行一次 `loginctl enable-linger "$USER"` 即可实现真正的开机自启与断连常驻。

#### 方案 B：`crontab` 的 `@reboot`（无 Linger 权限时的轻量兜底）

如果服务器没有开启 `enable-linger` 的权限，可以用用户级 `crontab -e` 补一条开机拉起：

```text
@reboot /usr/bin/screen -dmS magpie /home/<username>/.local/bin/magpie serve
```

缺点是进程异常退出后不会像 `systemd` 那样自动重启，日常使用还是 `systemd --user` 或按需手动维护 `screen` 更直观。

## 七、Mac 端排障实录：解决桌面端 Codex 与 CLI 的一致性问题

远端服务器打通之后，回到本机 Mac 上日常使用时，又踩到了一个很隐蔽的跨端一致性坑：**同一份 `~/.codex/config.toml`、同一个本机 Magpie 网关，Codex CLI 已经一切正常，但统一桌面端 `/Applications/ChatGPT.app`（`com.openai.codex`）却表现不同步**。顺藤摸瓜排查下来，把桌面端模型列表不同步、Fast / Normal 开关缺失，以及无官方登录态下的自动审批（Guardian）三个问题一次连根拔起。

### 1. 现象与排雷：桌面端 `ChatGPT.app` 模型列表为何与 CLI 不同步？

- **现象**：Codex CLI 已经正常识别并展示 Magpie 暴露的全部 19 个模型（涵盖 `auto/*`、`sub4/*`、`opencode-go/*`、`agy-cli/*`）与 Fast 选项；但打开 Mac 上的 `/Applications/ChatGPT.app` 后，模型选择器里显示的依然是已登录 ChatGPT 账号自带的模型列表，仿佛完全忽略了 Magpie。
- **先排除的「假嫌疑」**：
  1. 检查桌面端拉起的内置 `codex app-server`，其生效配置完全正确，包含了：
     - `openai_base_url = "http://127.0.0.1:3425/backend-api/codex"`
     - `model_catalog_json = "/Users/<username>/.codex/magpie-desktop-models.json"`
  2. 带着 `CODEX_INTERNAL_ORIGINATOR_OVERRIDE="Codex Desktop"` 直接调用内置二进制的 `model/list`，也能稳定返回全部 19 个 Magpie 模型，并不受 `~/.codex/models_cache.json` 缓存污染。
  3. 桌面端前端本地过滤逻辑在 `model_catalog_json` 非空时也会正常放行自定义模型。

既然底层 `app-server` 和本地模型目录全都是对的，问题就只能出在桌面端前端的**模式路由与接口选择**上。检查 `/Applications/ChatGPT.app/Contents/Resources/app.asar` 与本地日志（`~/Library/Logs/com.openai.codex/`）后，定位到两层根因：

1. **主因：`auth_mode: "chatgpt"` 叠加 `conversationDetailMode = "STEPS_PROSE"`，绕过了本地模型目录**
   - 本机 `~/.codex/auth.json` 当前处于 ChatGPT 账号登录态（`auth_mode: "chatgpt"`），而 `~/.codex/config.toml` 中 `[desktop]` 原本配置的是 `conversationDetailMode = "STEPS_PROSE"`。
   - 桌面端前端会把 `"STEPS_PROSE"` 映射为 `everyday` 模式（`entryPoint: "chatgpt"`），只有 `"STEPS_COMMANDS"` 才会映射为 `coding` 模式（`entryPoint: "codex"`）。
   - 在 ChatGPT 登录态的 `everyday` / 共享首页（`usesSharedHome` + `merged_picker`）下，模型选择器会直接请求 `https://chatgpt.com/backend-api/models`（Work 默认项走 `/wham/work/settings`），压根不走本地 `openai_base_url` 与 `model_catalog_json`。
2. **次因：多 Host 视角下的作用域隔离**
   - 如果 `ChatGPT.app` 同时连着远端 SSH Host（如 `remote-ssh-discovered:<server>`）或 Cloud（`hostId=durable`），选中 Chat、Cloud 或远端 SSH Host 时，会各自查询对应 Host 侧的 `model/list`，并不会读取本机的 `~/.codex/magpie-desktop-models.json`。

### 2. 解决方案与安全重启姿势

根据是否需要保留桌面端内的 ChatGPT 账号登录态，有两种解法：

#### 方案 A：保留 ChatGPT 登录态（修改 `[desktop]` 模式，实测生效）

修改 `~/.codex/config.toml`，将 `[desktop]` 下的 `conversationDetailMode` 切换为 `STEPS_COMMANDS`：

```toml
[desktop]
conversationDetailMode = "STEPS_COMMANDS"
```

保存后**干净重启** `/Applications/ChatGPT.app`，切换到 **Work / Codex + Local** 视图，桌面端模型列表即刻与 Codex CLI 保持一致。

> [!NOTE]
> 保留 ChatGPT 登录态期间，Chat 标签页与 `merged_picker` 共享首页仍然会展示 ChatGPT 账号侧的模型列表，这是预期行为。

#### 方案 B：追求桌面端与 CLI 100% 统一（退出 ChatGPT 登录态）

如果希望桌面端所有选择器彻底屏蔽云端账号模型，可以直接在 `ChatGPT.app` 内退出 ChatGPT 账号登录（改用 API Key / 非 `chatgpt` 鉴权模式）。此时前端会强制进入 `coding` 模式，关闭 `usesSharedHome` 与 `/backend-api/models`，所有模型选择器统一从本地 `app-server` 的 `model/list` 拉取。

#### 重启 `ChatGPT.app` 避坑：千万别用 `pkill -f Codex`

改完配置后需要重启桌面端，但这里踩了一个非常容易中招的 macOS 进程坑：

- **参数大小写**：macOS 下 `pkill -f` 才是按命令行匹配，大写 `-F` 是读取 PID 文件；
- **杀不掉主进程**：`/Applications/ChatGPT.app` 主进程的路径是 `/Applications/ChatGPT.app/Contents/MacOS/ChatGPT`，里面根本不含 `Codex` 字样。执行 `pkill -f Codex` 只会杀掉 Renderer、GPU 和内置 `codex app-server` 等子进程，主进程依然存活，无法完成干净重启；
- **会误伤无关程序**：`pgrep -fl Codex` 容易顺带命中 `CodexBarWidget`、`SkyComputerUseService` 等工具；若写成小写 `pkill -f codex`，甚至会把终端里正在干活的 Codex CLI 会话一锅端。

正确的重启方式如下：

```bash
# 优雅重启 ChatGPT.app（推荐）
osascript -e 'tell application "ChatGPT" to quit' && sleep 1 && open -a /Applications/ChatGPT.app

# 界面卡死时仅精准强杀主进程并重启
pkill -x ChatGPT && open -a /Applications/ChatGPT.app
```

### 3. 联动修复：让桌面端与 CLI 自动出现 Fast / Normal 切换选项

解决完模型列表同步后，还顺手查清了另一个困扰：中转站明明支持 Codex 快速模式，但此前无论桌面端还是 CLI 都没有自动出现 **Fast / Normal** 切换选项，总不想每次都手改 `~/.codex/magpie-desktop-models.json`。

直接请求上游接口 `GET https://sub-api.example.com/v1/models?client_version=0.169.1` 实测发现，上游已经返回了完整的 Codex 原生模型定义（包含 `service_tiers`、`additional_speed_tiers: ["fast"]` 等字段）。排查 Magpie 源码后，发现是两个环节叠加导致的：

1. **供应商没配 `responses` 端点，跳过了 Codex 原生目录拉取**：此前 `~/.config/magpie/providers.json` 里只给中转站配了 `chat`（`baseAPI: "chat"`）。而在 Magpie 的模型拉取逻辑（`internal/provider/models.go`）中，只有 `proto == Responses` 才会触发 `codexEntries()` 去拉带 `?client_version=...` 的 Codex 原生目录；只配 `chat` 时只会请求普通 `/v1/models`，缓存里所有模型的 `Codex` 字段都是空的。
2. **兜底条目缺少 `additional_speed_tiers`**：当缓存里没有原生 `Codex` 定义时，Magpie 会走 `internal/codexcat/codexcat.go` 的兜底构造——它虽然会写入 `service_tiers: [{"id": "priority", ...}]`，但**不会生成 `additional_speed_tiers`**。只有保留上游原生 `Codex` 定义时，才会原样透传 `additional_speed_tiers: ["fast"]`，客户端也才会渲染出 Fast / Normal 开关。

修复方法非常干脆：

1. 在 `~/.config/magpie/providers.json` 中为对应中转站补上 `responses` 端点，并将 `baseAPI` 设为 `"responses"`：

```json
{
  "id": "sub4",
  "name": "sub4",
  "chat": "https://sub-api.example.com",
  "responses": "https://sub-api.example.com",
  "baseAPI": "responses",
  "bestInFamily": true
}
```

2. 强制刷新一次该供应商的模型缓存：

```bash
magpie provider models sub4
```

刷新后 `~/.cache/magpie/models/sub4.json` 直接从 `7 KB` 涨到了 `206 KB`，完整写入了原生 Codex 模型定义；随即检查 `~/.codex/magpie-desktop-models.json` 与 `codex app-server` 的 `model/list`，可以看到 `sub4/gpt-6.2-sol`、`sub4/gpt-6.2-astra` 都已带上 `additional_speed_tiers: ["fast"]` 和 `service_tiers: ["priority"]`，重启桌面端或 CLI 后 Fast / Normal 开关自动出现。

> [!TIP]
> 如果刷新后发现只有部分模型带快速开关，不必紧张：一是取决于上游接口是否对该模型返回了 `additional_speed_tiers: ["fast"]`（部分老版本模型会因 `"bestInFamily": true` 被自动隐藏）；二是 `auto/*` 路由组条目属于 Magpie 兜底生成，只含 `service_tiers`，默认不包含 `additional_speed_tiers`。

### 4. 补全无官方登录态下的 AutoApprove（Guardian）审核链路

如果按前面「方案 B」退出了官方 ChatGPT 账号，或者在无登录态的远程 Linux 服务器上跑 Codex，依然可以正常使用 **AutoApprove / ApproveForMe（Guardian）**——从 `openai/codex` 源码可以确认，`guardian_approval` 默认开启且不强依赖官方账号登录。

唯一需要注意的是：经由 Magpie 网关且未登录官方账号时，如果模型目录没有指定 `auto_review_model_override`，Codex 会直接请求裸模型名 `codex-auto-review`，Magpie 无法自动匹配到具体中转站，容易报错或回退。只需在 Codex 与 Magpie 两端各配一行即可打通：

1. **Codex 侧**（`~/.codex/config.toml`）：

```toml
approval_policy = "on-request"
approvals_reviewer = "guardian_subagent"
```

2. **Magpie 侧**（`~/.config/magpie/settings.json`）：

```json
{
  "codexAutoReview": "sub4/codex-auto-review"
}
```

- 填写 `"sub4/codex-auto-review"` 时，Magpie 会在导出的每条 Codex 模型定义中自动注入 `auto_review_model_override: "sub4/codex-auto-review"`，把审核请求精准路由到中转站的专用审核模型；
- 如果中转站不提供 `codex-auto-review`，也可以把值填成 `"session"`，Magpie 会让每条模型的审核请求直接复用当前会话正在使用的模型。

## 八、常用运维命令速查

| 目标 | 命令 |
| --- | --- |
| 查看所有 Agent 接入状态 | `magpie ls` |
| 查看 Provider 与通道状态 | `magpie providers` |
| 查看当前对外暴露的模型清单 | `magpie models` |
| 刷新指定供应商模型缓存（拉取 Codex 原生目录） | `magpie provider models <id>` |
| 动态暴露 / 隐藏某个模型 | `magpie provider models <id> +<model>` / `-<model>` |
| 切换 Claude Code / Codex 模型 | `magpie claude <provider/model>` / `magpie codex <provider/model>` |
| 彻底还原某个 Agent 的原生配置 | `magpie claude default` / `magpie codex default` |
| 在无桌面环境下打开终端面板 | `magpie tui` |
| 在线升级远端 Magpie | `magpie update` |
| macOS 优雅重启 `ChatGPT.app` | `osascript -e 'tell application "ChatGPT" to quit' && sleep 1 && open -a /Applications/ChatGPT.app` |

如果排查 Codex 桌面端模型目录字段是否同步到位，还可以直接用一段轻量 Python 快速检查 `~/.codex/magpie-desktop-models.json`：

```bash
python3 - <<'PY'
import json, pathlib
p = pathlib.Path.home() / ".codex/magpie-desktop-models.json"
d = json.loads(p.read_text())
for m in d.get("models", []):
    slug = m.get("slug", "")
    if slug.startswith(("sub4/", "auto/")):
        print(
            slug,
            "speed:", m.get("additional_speed_tiers"),
            "tiers:", [t.get("id") for t in m.get("service_tiers", [])],
            "auto_review:", m.get("auto_review_model_override"),
        )
PY
```
