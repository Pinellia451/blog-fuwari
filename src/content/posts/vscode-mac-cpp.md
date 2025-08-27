---
title: vscode mac c++ 环境配置
published: 2025-08-27
description: 配置 vscode mac c++ 运行调试环境
tags: [环境配置, vscode]
category: 环境配置
draft: false
---
# 使用的插件

C++系列，code runner

# 配置文件

1. tasks/launch 文件用来完善f5调试
2. settings 文件主要用来完善cpp代码万能头，以及 code runner 运行参数

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
