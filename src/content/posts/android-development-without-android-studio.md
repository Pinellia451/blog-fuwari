---
title: 不安装 Android Studio 也能开发 Android
published: 2026-07-20
description: 使用 JDK、Android SDK Command-line Tools、Gradle Wrapper 和 ADB，完成 Android 项目的构建、测试与真机安装。
tags: [android, kotlin, gradle, adb, env-setup]
category: 环境与系统
draft: false
aigc: Codex
device: MacBook Pro
---

Android Studio 不是 Android 开发的必需品。真正参与构建的只有：

- JDK；
- Android SDK；
- Gradle Wrapper；
- ADB。

编辑代码可以使用 VS Code、Neovim 或任何文本编辑器。本文参考一个 Kotlin 原生 Android 项目的实际配置，使用项目内工具链完成测试、打包和真机安装。

## 准备环境

以 `compileSdk = 35` 的项目为例，需要：

- JDK 17；
- Android SDK Command-line Tools；
- Platform 35；
- Build-Tools 35.0.0；
- Platform-Tools。

下载 Command-line Tools 后，将其放入项目目录：

```text
.android-toolchain/sdk/cmdline-tools/latest/
```

然后安装 SDK 组件：

```bash
export ANDROID_SDK_ROOT="$PWD/.android-toolchain/sdk"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export ANDROID_USER_HOME="$PWD/.android-user-home"
export GRADLE_USER_HOME="$PWD/.gradle-user-home"

SDKMANAGER="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager"

yes | "$SDKMANAGER" --sdk_root="$ANDROID_SDK_ROOT" --licenses
"$SDKMANAGER" --sdk_root="$ANDROID_SDK_ROOT" \
  "platforms;android-35" \
  "build-tools;35.0.0" \
  "platform-tools"
```

在项目根目录创建不提交到 Git 的 `local.properties`：

```properties
sdk.dir=/absolute/path/to/project/.android-toolchain/sdk
```

## 构建与测试

项目应提交 Gradle Wrapper，因此无需全局安装 Gradle：

```bash
./gradlew testDebugUnitTest assembleDebug
```

生成的 Debug APK 位于：

```text
app/build/outputs/apk/debug/app-debug.apk
```

只需要打包时执行：

```bash
./gradlew assembleDebug
```

## 安装到真机

在手机上启用“开发者选项”和“USB 调试”，连接后确认设备已授权：

```bash
.android-toolchain/sdk/platform-tools/adb devices -l
```

覆盖安装 APK：

```bash
.android-toolchain/sdk/platform-tools/adb install -r \
  app/build/outputs/apk/debug/app-debug.apk
```

看到 `Success` 即安装完成。

## 最后两个注意点

1. 将 `.android-toolchain/`、`.android-user-home/`、`.gradle-user-home/`、`local.properties` 和构建目录加入 `.gitignore`。
2. Debug APK 不需要额外签名；发布 APK 或 AAB 时，仍需使用 `keytool` 创建 keystore 并配置 Release 签名。

至此，从写代码、运行测试、生成 APK 到安装真机，整个流程都不需要 Android Studio。
