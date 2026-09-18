---
title: 机器学习环境配置
published: 2025-10-28
updated: 2026-09-17
description: 在无 root 权限的服务器上使用 micromamba 配置隔离、轻量且可复现的机器学习环境，并接入远程 VS Code 的 Python 环境管理。
tags: [conda, micromamba, python, ml, linux, vscode, env-setup]
category: 环境与系统
draft: false
device: Windows
---
## 为什么选择 micromamba

`micromamba` 是使用 `conda-forge` channel 的 Conda 兼容环境管理器。相比完整 Conda，它更适合无 root 权限的服务器和需要控制安装体积的场景：

1. 使用静态链接的 C++ 可执行文件，安装后可以直接运行；
2. 默认使用 `conda-forge` channel，软件包覆盖范围较广；
3. 不需要 root 权限，安装和卸载都在用户目录中完成；
4. 安装体积较小，适合服务器环境。

`micromamba` 也可以管理 JDK、Node.js 和 CUDA 等 Conda 包。是否使用这些包，仍应根据项目需求决定。

> [!TIP]
> 现在可以使用conda进行jdk,node,甚至cuda的安装管理以及隔离

## 安装 micromamba

> [!NOTE]
> 下面使用官方安装脚本，不依赖 Homebrew。

官方指导：[link](https://mamba.readthedocs.io/en/latest/installation/micromamba-installation.html "点击跳转")

mac, linux, windows git bash:

```shell
"${SHELL}" <(curl -L micro.mamba.pm/install.sh)
```

自动升级：

```shell
micromamba self-update
```

## 在远程 VS Code 中使用 micromamba

安装 **Python** 与 **Python Environments** 扩展后，可以让远程 VS Code 将 `micromamba` 作为 Conda 兼容的环境管理器使用。

## 远程主机设置

通过 Remote SSH 连接服务器后，打开命令面板，执行 `Preferences: Open Remote Settings (JSON)`。对应的远程配置文件通常位于：

```text
~/.vscode-server/data/Machine/settings.json
```

加入以下配置：

```json
{
  "python-envs.defaultEnvManager": "ms-python.python:conda",
  "python.condaPath": "~/micromamba/micromamba"
}
```

其中 `python.condaPath` 必须指向远程服务器上的 `micromamba` 可执行文件。如果安装位置不同，可以先执行以下命令确认：

```shell
command -v micromamba
```

> [!IMPORTANT]
> 示例使用 `~` 表示当前用户的 home 目录，避免在共享配置、截图或文章中暴露真实用户名。请不要直接写入 `/home/<username>/...` 或其他包含个人账号的绝对路径。

## 项目设置

在项目根目录创建或编辑 `.vscode/settings.json`：

```json
{
  "python-envs.pythonProjects": [
    {
      "path": ".",
      "envManager": "ms-python.python:conda",
      "packageManager": "ms-python.python:conda"
    }
  ]
}
```

这里将当前目录声明为 Python 项目，并指定使用 Conda 兼容的环境与包管理器；实际执行程序由远程主机设置中的 `python.condaPath` 指向 `micromamba`。

> [!NOTE]
> `python.condaPath` 属于远程主机级设置，不要提交到项目的 `.vscode/settings.json`。这样既能避免泄露服务器目录结构，也能让不同开发者分别配置自己的安装路径。

保存后执行 `Developer: Reload Window`，再通过 `Python: Select Interpreter` 或侧边栏的 Python Environments 视图选择环境。若环境未出现，可执行 `Python Environments: Refresh All Environment Managers` 后重试。

## 按目录自动加载 Conda 环境

> 使用bashrc自动加载(**仅在终端创建时自动**)文件夹的 conda 环境
>
> 可使用man命令来加载最合适的环境(未指定则用父文件夹的)

```shell collapse={5-100}
<!-- ~/.zshrc -->
# --- 自动按路径激活 micromamba 环境（从 ~/.conda_map.ini 读取） ---
_load_auto_map() {
    local file="$HOME/.conda_map.ini"
    typeset -gA AUTO_ACTIVATE_MAP
    [[ -f "$file" ]] || return
    local line key val
    while IFS= read -r line || [[ -n "$line" ]]; do
        # 删除注释（# 或 ;）和首尾空白
        line="${line%%[#;]*}"
        line="${line#"${line%%[![:space:]]*}"}"
        line="${line%"${line##*[![:space:]]}"}"
        [[ -z "$line" ]] && continue
        if [[ "$line" == *=* ]]; then
            key="${line%%=*}"
            val="${line#*=}"
            key="${key#"${key%%[![:space:]]*}"}"; key="${key%"${key##*[![:space:]]}"}"
            val="${val#"${val%%[![:space:]]*}"}"; val="${val%"${val##*[![:space:]]}"}"
            AUTO_ACTIVATE_MAP[$key]="$val"
        fi
    done < "$file"
}

_find_env_for_dir() {
    local pwd="$PWD"
    local best_prefix=""
    local best_env=""
    local prefix
    for prefix in "${(@k)AUTO_ACTIVATE_MAP}"; do
        # 确保以目录前缀匹配（支持不带斜杠的写法）
        if [[ "${pwd%/}" == "${prefix%/}"* ]]; then
            if (( ${#prefix} > ${#best_prefix} )); then
                best_prefix="$prefix"
                best_env="${AUTO_ACTIVATE_MAP[$prefix]}"
            fi
        fi
    done
    printf '%s' "$best_env"
}

_auto_activate_on_cd() {
    _load_auto_map
    local target_env cur_env
    target_env="$(_find_env_for_dir)"

    cur_env="${CONDA_DEFAULT_ENV:-}"
    if [[ -z "$cur_env" && -n "$CONDA_PREFIX" ]]; then
        cur_env="$(basename "$CONDA_PREFIX")"
    fi

    if [[ -n "$target_env" ]]; then
        if [[ "$cur_env" != "$target_env" ]]; then
            conda activate "$target_env" >/dev/null 2>&1 || true
        fi
    else
        if [[ -n "$cur_env" && "$cur_env" != "base" ]]; then
            conda deactivate >/dev/null 2>&1 || true
        fi
    fi
}
_auto_activate_on_cd
alias ac=_auto_activate_on_cd
# ac 来手动激活对应环境（前缀匹配激活，子文件夹都可用）
# --- 结束 自动激活 ---
```

```shell collapse={5-100}
<!-- ~/.bashrc -->
# --- 自动按路径激活 micromamba 环境（从 ~/.conda_map.ini 读取） ---
_load_auto_map() {
    local file="$HOME/.conda_map.ini"
    # 使用全局关联数组
    declare -gA AUTO_ACTIVATE_MAP=()
    [[ -f "$file" ]] || return
    local line key val
    while IFS= read -r line || [[ -n "$line" ]]; do
        # 删除注释（# 或 ;）和首尾空白
        line="${line%%[#;]*}"
        line="${line#"${line%%[![:space:]]*}"}"
        line="${line%"${line##*[![:space:]]}"}"
        [[ -z "$line" ]] && continue
        if [[ "$line" =~ ^([^=]+)=(.+)$ ]]; then
            key="${BASH_REMATCH[1]}"
            val="${BASH_REMATCH[2]}"
            key="${key#"${key%%[![:space:]]*}"}"; key="${key%"${key##*[![:space:]]}"}"
            val="${val#"${val%%[![:space:]]*}"}"; val="${val%"${val##*[![:space:]]}"}"
            AUTO_ACTIVATE_MAP["$key"]="$val"
        fi
    done < "$file"
}

_find_env_for_dir() {
    local pwd="$PWD"
    local best_prefix=""
    local best_env=""
    local prefix
    for prefix in "${!AUTO_ACTIVATE_MAP[@]}"; do
        # 确保以目录前缀匹配（支持不带斜杠的写法）
        if [[ "${pwd%/}" == "${prefix%/}"* ]]; then
            if (( ${#prefix} > ${#best_prefix} )); then
                best_prefix="$prefix"
                best_env="${AUTO_ACTIVATE_MAP[$prefix]}"
            fi
        fi
    done
    printf '%s' "$best_env"
}

_auto_activate_on_cd() {
    _load_auto_map
    local target_env cur_env
    target_env="$(_find_env_for_dir)"

    cur_env="${CONDA_DEFAULT_ENV:-}"
    if [[ -z "$cur_env" && -n "$CONDA_PREFIX" ]]; then
        cur_env="$(basename "$CONDA_PREFIX")"
    fi

    if [[ -n "$target_env" ]]; then
        if [[ "$cur_env" != "$target_env" ]]; then
            conda activate "$target_env" >/dev/null 2>&1 || true
        fi
    else
        if [[ -n "$cur_env" && "$cur_env" != "base" ]]; then
            conda deactivate >/dev/null 2>&1 || true
        fi
    fi
}
_auto_activate_on_cd
alias ac=_auto_activate_on_cd
# ac 来手动激活对应环境（前缀匹配激活，子文件夹都可用）
# --- 结束 自动激活 ---
```

## 验收结果

1. 无 root 权限或希望减少安装体积时，推荐使用 `micromamba` 管理 Conda 环境。
2. 远程 VS Code 中，将 `python.condaPath` 指向 `micromamba`，并为项目设置 Conda 环境管理器，即可完成环境发现、选择和包管理。
3. 主机相关路径应放在远程 Machine 设置中，项目配置只保留可共享内容，避免暴露用户名和服务器目录结构。
