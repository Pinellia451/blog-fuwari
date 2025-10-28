---
title: 机器学习 环境配置
published: 2025-10-28
description: 如何在无root权限的服务器上进行初步环境配置？ conda 隔离一切
tags: [conda, python,环境配置]
category: 环境配置
draft: false
---
# conda->micromamba

`micromamba ` 是一个使用 `conda-forge`  channel 的 conda 替代品，优势如下：

1. 为静态链接的 C++ 可执行文件，速度快
2. 默认采用 `conda-forge` channel 更新更全
3. 非root环境下易于安装卸载，同时占用空间极小
4. 拥有更全面的提示以及进度条
5. 没有conda的环境嵌套激活问题，用着放心

> [!TIP]
> 现在可以使用conda进行jdk,node,甚至cuda的安装管理以及隔离

## how 2 install

> [!TIP]
> 鉴于 homebrew 下载较为臃肿，不建议使用 homebrew

官方指导：[link](https://mamba.readthedocs.io/en/latest/installation/micromamba-installation.html "点击跳转")

mac, linux, windows git bash:

```shell
"${SHELL}" <(curl -L micro.mamba.pm/install.sh)
```

自动升级：

```shell
micromamba self-update
```

# conda 环境自动加载

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

# 总结

1. 推荐使用 `Miniconda`，日常使用稳定，缺点是环境构建稍慢。
2. 可尝试 `conda-forge + mamba`，但部分 forge channel 可能体验一般。
