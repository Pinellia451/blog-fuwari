---
title: VS Code macOS C++ 环境配置
published: 2025-08-27
description: 在 macOS 上配置 VS Code 的 C++ 编译、运行与调试环境，并整理常用插件和设置。
tags: [vscode, cpp, macos, env-setup]
category: 环境与系统
draft: false
device: Windows
---
这套配置用于在 macOS 的 VS Code 中编译、运行和调试单文件 C++ 程序。编译器使用系统 Clang，调试器使用 LLDB。

## 扩展

安装以下扩展：

- C/C++ 语言支持；
- CodeLLDB；
- Code Runner（仅用于快速运行，不代替调试配置）。

## 配置文件

- `tasks.json` 定义编译任务；
- `launch.json` 定义 F5 调试入口；
- `settings.json` 配置头文件关联和 Code Runner 参数。

```json
<!-- launch.json -->
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug C++",
            "type": "lldb",
            "request": "launch",
            "program": "${fileDirname}/bin/${fileBasenameNoExtension}",
            "args": [],
            "cwd": "${workspaceFolder}",
            "preLaunchTask": "build",
            "console": "integratedTerminal"
        }
    ]
}
```

```json
<!-- tasks.json -->
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "build",
            "type": "shell",
            "command": "mkdir",
            "args": [
                "-p",
                "${fileDirname}/bin",
                "&&",
                "g++",
                "-std=c++17",
                "-g",
                "${file}",
                "-o",
                "${fileDirname}/bin/${fileBasenameNoExtension}"
            ],
            "group": "build",
            "problemMatcher": [
                "$gcc"
            ]
        }
    ]
}
```

```
<!--settings.json ->
{
    // C++扩展配置
    "C_Cpp.default.includePath": [
        "${workspaceFolder}/cpp_includes",
        "${workspaceFolder}/**"
    ],
    "C_Cpp.default.compilerPath": "/usr/bin/g++",
    "C_Cpp.default.cppStandard": "c++17",
    "C_Cpp.default.intelliSenseMode": "macos-gcc-arm64",

    // Code Runner配置 - 与C++扩展保持一致的头文件路径
    "code-runner.executorMap": {
        "cpp": "cd$workspaceRoot && mkdir -p bin && g++ -std=c++17 -O2 -g -I cpp_includes $fullFileName -o ./bin/$fileNameWithoutExt && ./bin/$fileNameWithoutExt"
    },
    "code-runner.runInTerminal": true,
    "code-runner.saveFileBeforeRun": true,
    "code-runner.clearPreviousOutput": false,
    "code-runner.preserveFocus": false,
    "code-runner.showExecutionMessage": true,

    // 文件关联
    "files.associations": {
        "*.h": "cpp",
        "*.hpp": "cpp",
        "*.cpp": "cpp",
        "*.cc": "cpp",
        "*.cxx": "cpp"
    }
}
```
