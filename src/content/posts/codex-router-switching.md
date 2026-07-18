---
title: Codex 官方模型与 AiMaMi 智能路由切换指南
published: 2026-07-18
description: 使用 Codex Profile 或 Shell 脚本，在官方模型与 AiMaMi 智能路由之间安全切换，并通过 SSH 反向隧道连接远端环境。
tags: [codex, ai, shell, ssh, tooling]
category: 环境与系统
draft: false
aigc: Codex
---

在 Codex 中接入自定义模型提供方后，一个很常见的需求是：平时使用官方模型，需要时切换到本地中转或智能路由，而且不希望每次都手工修改 `~/.codex/config.toml`。

本文以 AiMaMi 智能路由为例，整理两条可落地的路线：

1. 使用 Codex Profile，在启动 CLI 时选择配置层；
2. 使用 Shell 脚本，原地启用或禁用全局配置块，并按需关闭 `app-server` 使配置生效。

两条路线解决的是同一个问题，但适用范围不同：Profile 更干净，适合 CLI；脚本会修改全局配置，更适合 Codex 桌面 App 或常驻 `app-server`。

> [!WARNING]
> 不要使用 `cc-switch-cli` 切换本文涉及的 Codex 配置。它可能改写或接管配置状态，导致不同 Codex 进程读取到不一致的配置，最终出现会话不同步。本文只使用 Codex 原生 Profile 或定向开关脚本；会话记录同步则单独使用 `codex-provider-sync`。

## 配置结构与切换边界

智能路由的开关配置位于 `~/.codex/config.toml` 顶部：

```toml
# >>> aimami-relay codex-router top start (DO NOT EDIT MANUALLY)
# Codex 智能路由：使用 HTTP-only 自定义 provider，避开内建 openai WebSocket 路径
# 菜单模型来自 model_catalog_json；官方 / 中转分流由本地 proxy 决定
# 在 AiMaMi 里关闭智能路由开关后，本段会被自动移除
model_provider = "aimai1"
model_catalog_json = "/sdc/home/niuhongkai/.codex/model-catalogs/codex_router_catalog.json"
# <<< aimami-relay codex-router top end
```

具体的自定义 Provider 可以继续放在公共配置中：

```toml
[model_providers.aimai1]
name = "AiMaMi 智能路由"
base_url = "http://127.0.0.1:25123/codex/router/v1"
wire_api = "responses"
requires_openai_auth = true
supports_websockets = false
```

这里要区分两类配置：

- `[model_providers.aimai1]` 只是定义 Provider，可以长期保留；
- 顶层的 `model_provider` 和 `model_catalog_json` 决定本次使用哪个 Provider 和模型目录，是实际需要切换的部分。

> [!IMPORTANT]
> `config.toml` 是 TOML 文件，不是 Shell 脚本。`model_catalog_json = "$HOME/..."` 或 `model_catalog_json = "$CODEX_HOME/..."` 通常不会展开环境变量，应填写真实绝对路径。

## 建立 SSH 反向转发

在服务器上的 Codex 访问本地 AiMaMi 路由之前，需要把服务器的 `127.0.0.1:25123` 反向转发到本机的 `127.0.0.1:25817`：

```text
服务器 Codex
    ↓ 127.0.0.1:25123
SSH 反向隧道
    ↓
本机 AiMaMi：127.0.0.1:25817
```

以下两种配置方式二选一即可。

### 直接执行 SSH 命令

在运行 AiMaMi 的本机执行：

```bash
ssh -N -R 127.0.0.1:25123:127.0.0.1:25817 服务器
```

参数含义如下：

- `-N`：只建立隧道，不在服务器执行远程命令；
- `-R`：创建反向端口转发；
- `127.0.0.1:25123`：服务器侧监听地址；
- `127.0.0.1:25817`：本机 AiMaMi 服务地址；
- `服务器`：SSH 主机名、别名或 `user@host`。

该命令需要保持运行。终端断开或 SSH 进程退出后，转发也会消失。

### 写入 SSH Config

也可以把转发规则持久化到本机的 `~/.ssh/config`：

```text
Host codex-relay-server
    HostName 服务器地址
    User 登录用户名
    RemoteForward 127.0.0.1:25123 127.0.0.1:25817
    ExitOnForwardFailure yes
    ServerAliveInterval 30
    ServerAliveCountMax 3
```

然后执行：

```bash
ssh -N codex-relay-server
```

如果服务器上的 AiMaMi Provider 通过该反向隧道连接本机，对应地址应使用：

```toml
base_url = "http://127.0.0.1:25123/codex/router/v1"
```

本机直接访问 AiMaMi 时则使用：

```toml
base_url = "http://127.0.0.1:25817/codex/router/v1"
```

建立隧道之后，再从下面两种 Codex 配置切换方案中选择一种。

## 方案 A：使用 Codex Profile

### Profile 如何工作

Profile 是 Codex 启动时加载的配置覆盖层。执行：

```bash
codex --profile aimami-router
```

Codex 会先读取：

```text
~/.codex/config.toml
```

再叠加：

```text
~/.codex/aimami-router.config.toml
```

因此，公共配置保留在主配置中，只有存在差异的字段才需要写进 Profile。

从 Codex 0.134.0 开始，每个 Profile 应使用独立文件，并通过 `--profile` 指定，不再推荐写成 `config.toml` 中的 `[profiles.xxx]` 表，也不能通过顶层 `profile = "xxx"` 自动选择。

### 调整主配置

从 `~/.codex/config.toml` 顶部移除以下两个选择项：

```toml
model_provider = "aimai1"
model_catalog_json = "/sdc/home/niuhongkai/.codex/model-catalogs/codex_router_catalog.json"
```

Provider 定义仍然保留：

```toml
[model_providers.aimai1]
name = "AiMaMi 智能路由"
base_url = "http://127.0.0.1:25123/codex/router/v1"
wire_api = "responses"
requires_openai_auth = true
supports_websockets = false
```

这样主配置只保存公共设置，不再强制所有 Codex 实例经过智能路由。

### 创建官方模型 Profile

创建 `~/.codex/official.config.toml`：

```toml
model_provider = "openai"
model = "gpt-5.6-sol"
model_reasoning_effort = "high"
```

交互式启动：

```bash
codex --profile official
```

非交互任务也可以使用相同 Profile：

```bash
codex exec --profile official "检查当前代码改动"
```

### 创建智能路由 Profile

创建 `~/.codex/aimami-router.config.toml`：

```toml
model_provider = "aimai1"
model_catalog_json = "/sdc/home/niuhongkai/.codex/model-catalogs/codex_router_catalog.json"
model = "gpt-5.6-sol"
model_reasoning_effort = "high"
```

启动方式相同：

```bash
codex --profile aimami-router
codex exec --profile aimami-router "检查当前代码改动"
```

### 添加便捷别名

可以在 `~/.bashrc` 或 `~/.zshrc` 中加入：

```bash
alias codex-official='codex --profile official'
alias codex-router='codex --profile aimami-router'
```

以后直接执行：

```bash
codex-official
codex-router
```

### Profile 的优缺点

优点：

- 不需要反复修改主配置；
- 不同终端可以同时运行不同 Profile；
- 切换只影响新启动的 Codex 进程；
- 适合 CLI 和 `codex exec` 自动化任务。

限制：

- Profile 是 CLI 启动参数，不等于修改桌面 App 的全局配置；
- 已经运行的 Codex 进程不会自动切换；
- 每次启动必须指定 `--profile`，或者使用别名封装。

## 方案 B：使用脚本切换全局配置

如果主要使用 Codex 桌面 App，或者希望所有新会话统一切换到同一条路由，可以直接修改全局 `config.toml`。

这里不删除配置块，而是给块内有效 TOML 行添加专用注释：

```toml
# aimami-router-disabled: model_provider = "aimai1"
# aimami-router-disabled: model_catalog_json = "/sdc/home/niuhongkai/.codex/model-catalogs/codex_router_catalog.json"
```

重新开启时，脚本只移除 `# aimami-router-disabled: ` 前缀。原有说明注释、块标记和块外配置都不会被修改。

### 完整 Linux 脚本

将下面的内容保存为 `~/codex-switch.sh`：

```sh
#!/bin/sh

set -eu

START_MARKER='# >>> aimami-relay codex-router top start (DO NOT EDIT MANUALLY)'
END_MARKER='# <<< aimami-relay codex-router top end'
DISABLED_PREFIX='# aimami-router-disabled: '

CONFIG_FILE=${AIMAMI_CODEX_CONFIG:-"$HOME/.codex/config.toml"}
ACTION=toggle
ASSUME_YES=0

usage() {
    printf '%s\n' \
        "用法: $(basename "$0") [-y] [on|off|toggle|status]" \
        '' \
        "默认配置: $CONFIG_FILE" \
        '也可通过 AIMAMI_CODEX_CONFIG 指定其他 config.toml。' \
        '-y：修改后不询问，直接关闭 Codex app-server。'
}

ACTION_SET=0
for ARG in "$@"; do
    case "$ARG" in
        -y|--yes)
            ASSUME_YES=1
            ;;
        on|off|toggle|status)
            if [ "$ACTION_SET" -eq 1 ]; then
                printf '错误: 只能指定一个操作。\n' >&2
                usage >&2
                exit 2
            fi
            ACTION=$ARG
            ACTION_SET=1
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            printf '错误: 未知参数: %s\n' "$ARG" >&2
            usage >&2
            exit 2
            ;;
    esac
done

if [ ! -f "$CONFIG_FILE" ]; then
    printf '错误: 配置文件不存在: %s\n' "$CONFIG_FILE" >&2
    exit 1
fi

get_state() {
    awk -v start="$START_MARKER" -v end="$END_MARKER" -v prefix="$DISABLED_PREFIX" '
        $0 == start {
            starts++
            if (inside) bad = 1
            inside = 1
            next
        }
        $0 == end {
            ends++
            if (!inside) bad = 1
            inside = 0
            next
        }
        inside {
            if (index($0, prefix) == 1) disabled++
            else if ($0 !~ /^[[:space:]]*($|#)/) active++
        }
        END {
            if (inside || starts != 1 || ends != 1 || bad) {
                print "错误: 路由块的起止标记缺失、重复或顺序错误" > "/dev/stderr"
                exit 1
            }
            if (active && disabled) {
                print "错误: 路由块同时含有启用和禁用的配置行" > "/dev/stderr"
                exit 1
            }
            if (disabled) print "off"
            else if (active) print "on"
            else print "empty"
        }
    ' "$CONFIG_FILE"
}

STATE=$(get_state)

if [ "$ACTION" = status ]; then
    printf 'aimami-relay codex-router: %s\n' "$STATE"
    exit 0
fi

if [ "$ACTION" = toggle ]; then
    case "$STATE" in
        on) ACTION=off ;;
        off) ACTION=on ;;
        *)
            printf '错误: 路由块中没有可切换的配置行\n' >&2
            exit 1
            ;;
    esac
fi

if [ "$ACTION" = "$STATE" ]; then
    printf 'aimami-relay codex-router 已经是 %s，无需修改。\n' "$STATE"
    exit 0
fi

TEMP_FILE=$(mktemp "${CONFIG_FILE}.tmp.XXXXXX")
trap 'rm -f "$TEMP_FILE"' EXIT HUP INT TERM

awk -v start="$START_MARKER" -v end="$END_MARKER" \
    -v prefix="$DISABLED_PREFIX" -v action="$ACTION" '
    $0 == start { inside = 1; print; next }
    $0 == end { inside = 0; print; next }
    inside && action == "off" && $0 !~ /^[[:space:]]*($|#)/ {
        print prefix $0
        next
    }
    inside && action == "on" && index($0, prefix) == 1 {
        print substr($0, length(prefix) + 1)
        next
    }
    { print }
' "$CONFIG_FILE" > "$TEMP_FILE"

if ! FILE_MODE=$(stat -c '%a' "$CONFIG_FILE" 2>/dev/null); then
    printf '错误: 无法读取配置文件权限: %s\n' "$CONFIG_FILE" >&2
    exit 1
fi
chmod "$FILE_MODE" "$TEMP_FILE"
mv "$TEMP_FILE" "$CONFIG_FILE"
trap - EXIT HUP INT TERM

printf 'aimami-relay codex-router 已切换为 %s。\n' "$ACTION"

SHOULD_STOP=0
if [ "$ASSUME_YES" -eq 1 ]; then
    SHOULD_STOP=1
else
    printf '是否关闭 Codex app-server 以使配置生效？[y/N] '
    if ! read -r ANSWER; then
        ANSWER=
    fi
    case "$ANSWER" in
        y|Y|yes|YES|Yes) SHOULD_STOP=1 ;;
    esac
fi

if [ "$SHOULD_STOP" -eq 1 ]; then
    if pkill -u "$(id -u)" -TERM -f '[c]odex.*app-server'; then
        printf '已向 Codex app-server 发送 TERM 信号。\n'
    else
        printf '未找到正在运行的 Codex app-server。\n'
    fi
else
    printf '已保留当前 Codex app-server。\n'
fi
```

添加执行权限：

```bash
chmod +x ~/codex-switch.sh
```

### 使用方法

```bash
# 查看当前状态
~/codex-switch.sh status

# 开启、关闭或反转智能路由
~/codex-switch.sh on
~/codex-switch.sh off
~/codex-switch.sh toggle
```

修改后，脚本会询问是否结束当前用户的 Codex `app-server`：

```text
是否关闭 Codex app-server 以使配置生效？[y/N]
```

在自动化脚本中，可以使用 `-y` 跳过确认：

```bash
~/codex-switch.sh -y on
~/codex-switch.sh -y off
~/codex-switch.sh -y toggle
```

实际执行的结束命令是：

```bash
pkill -u "$(id -u)" -TERM -f '[c]odex.*app-server'
```

它只匹配当前用户的 Codex `app-server`，并发送 `TERM` 信号。当前会话可能因此中断，所以执行前应保存尚未完成的工作。

如需操作其他配置文件，可以临时指定：

```bash
AIMAMI_CODEX_CONFIG=/path/to/config.toml ~/codex-switch.sh status
```

### 脚本的安全边界

脚本包含几项保护：

- 起止标记必须各出现一次且顺序正确；
- 不允许块内同时出现启用和禁用的配置行；
- 使用同目录临时文件生成结果，再原子替换原配置；
- 保留原配置文件权限；
- 只处理标记块内的有效 TOML 行；
- `status` 不修改配置，也不结束服务；
- 重复执行同一状态不会再次修改文件或结束服务。

> [!NOTE]
> 该版本使用 GNU `stat -c`，面向 Linux，不兼容 macOS/BSD。

## 同步会话记录

Provider 配置切换与会话记录同步是两个独立操作：

- 配置切换：使用 Codex Profile 或 `codex-switch.sh`；
- 记录同步：使用 `codex-provider-sync`；
- 不要使用 `cc-switch-cli` 代替上述任一流程。

首次使用时，通过 npm 从 GitHub 全局安装：

```bash
npm install -g git+https://github.com/Dailin521/codex-provider-sync.git
```

需要同步记录时执行：

```bash
codex-provider sync
```

推荐的完整顺序是：

1. 使用 `codex --profile ...` 启动所需 Profile，或者用 `codex-switch.sh` 切换全局配置；
2. 如果使用脚本方案，按提示关闭旧的 `app-server`，再重新启动 Codex；
3. 执行 `codex-provider sync` 同步会话记录。

这样可以让配置切换和记录同步各自使用专门工具，避免其他切换器额外改写 Codex 状态。

## 如何选择

| 使用场景 | 推荐方案 | 原因 |
| --- | --- | --- |
| Codex CLI 交互使用 | Profile | 启动时选择，不修改全局状态 |
| `codex exec` 自动化任务 | Profile | 命令中可以显式声明运行环境 |
| 两个终端同时使用不同路由 | Profile | 每个进程拥有独立配置层 |
| Codex 桌面 App | 开关脚本 | 桌面 App 主要读取全局配置 |
| 希望所有新会话统一切换 | 开关脚本 | 直接改变全局 `config.toml` |
| 无人值守切换并刷新服务 | 开关脚本配合 `-y` | 可修改配置并结束旧 `app-server` |

简单来说：主要使用 CLI 时优先选择 Profile；主要依赖桌面 App 或常驻服务时，使用脚本更直接。

## 最终目录结构

采用 Profile 方案时：

```text
~/.codex/
├── config.toml
├── official.config.toml
├── aimami-router.config.toml
└── model-catalogs/
    └── codex_router_catalog.json
```

采用脚本方案时：

```text
~/.codex/
├── config.toml
└── model-catalogs/
    └── codex_router_catalog.json

~/codex-switch.sh
```

## 参考资料

- [Codex Advanced Configuration：Profiles](https://learn.chatgpt.com/docs/config-file/config-advanced#profiles)
- [Codex Configuration Reference](https://learn.chatgpt.com/docs/config-file/config-reference)
- [Codex Environment Variables](https://learn.chatgpt.com/docs/config-file/environment-variables)
