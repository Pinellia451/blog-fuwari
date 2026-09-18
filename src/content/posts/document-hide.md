---
title: 夹带私货：简单文件隐写
published: 2025-08-20
description: 使用 cat 拼接文件，并通过 binwalk 检测和提取隐藏内容，演示一种简单的文件隐写方法。
tags: [security, steganography, file]
category: Web 与工具
draft: false
device: Windows
---
这是一种利用文件格式解析差异实现的简单隐藏方式：把 ZIP 数据追加到图片末尾。图片查看器通常仍按图片格式显示文件，`binwalk` 等工具则能识别并提取后面的压缩包。

参考：[文件隐写示例](https://zhuanlan.zhihu.com/p/590378572)。

> [!WARNING]
> 这不是加密。任何知道文件结构的人都可以扫描并提取追加内容，不适合保护敏感数据。

## 操作过程

### 隐写

先把待隐藏内容打包为 `a.zip`，再追加到 `b.png`：

```shell
cat a.zip >> b.png
```

图片外观不变，但文件大小会增加。
<p align="center">
    <img src="https://ipfs.pinellia.uk/ipfs/QmTMVbJQhP77CQm4bT5BEudQBCEbExLsDT2ybNQFHTTzGZ" alt="" width="40%" />
    <br/>
    <img src="https://ipfs.pinellia.uk/ipfs/QmXrvW7ob9uXPcmQcdCFBXXX7hbnH6KeXin3kXtyXdcJLZ" alt="" width="40%" />
</p>

### 拆解

这里借用 `binwalk`命令进行拆解，也可以使用其他的，建议参考上面的知乎。

使用 `binwalk b.png` 查看文件结构：
![](https://ipfs.pinellia.uk/ipfs/QmaJNcm8N1shbqZRBbURjCsLh5WfQ9Tc4yLbBPMxr93S5G)
输出中应同时识别出图片和 ZIP 数据。

使用 `binwalk -e b.png` 提取文件：
![](https://ipfs.pinellia.uk/ipfs/QmcY28Q3CDDAEphWpiNH7gYr85r6oXFE3TiC8gp8Vn4unp)
提取目录会以 ZIP 数据的起始偏移命名，其中包含解压后的文件。
![](https://ipfs.pinellia.uk/ipfs/QmasDZYXmVZMc14CeqJChtWjiMfTa1mviaSLT3c1GGFRUt)
![](https://ipfs.pinellia.uk/ipfs/QmbqUQSSxruM84e4qZTswg9KbaD4YD5ZbLipGmGXDJHd2J)

## 注意事项

建议先把待隐藏文件打包。Word 和 PDF 等格式本身可能包含多个数据结构，直接追加会增加 `binwalk` 判断和提取的难度。
![](https://ipfs.pinellia.uk/ipfs/QmddebmCSkKv33jM7X1BVrZPP3QwKyeWp3KaqJrH6r5Cv4)
> 如果自动提取失败，可以根据起止偏移使用 `dd` 手动截取。打包只会改善识别和组织方式，不会提供加密保护。
