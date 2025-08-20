---
title: 夹带私货--简单文件隐写
published: 2025-08-20
description: 使用cat以及binwalk进行简单的文件隐写，偷摸夹带私货
tags: [explore]
category: explore
draft: false
---
# 简单介绍

懒得写了： https://zhuanlan.zhihu.com/p/590378572

## 实现

### 隐写

使用 `cat a.zip >> b.png`命令实现将pdf追加到png后面

效果为主图没有变化，只是文件大小上变大了
<p align="center">
    <img src="https://ipfs.pinellia.uk/ipfs/QmTMVbJQhP77CQm4bT5BEudQBCEbExLsDT2ybNQFHTTzGZ" alt="" width="40%" />
    <br/>
    <img src="https://ipfs.pinellia.uk/ipfs/QmXrvW7ob9uXPcmQcdCFBXXX7hbnH6KeXin3kXtyXdcJLZ" alt="" width="40%" />
</p>

### 拆解

这里借用 `binwalk`命令进行拆解，也可以使用其他的，建议参考上面的知乎。

使用 `binwalk b.png`查看文件结构：
![](https://ipfs.pinellia.uk/ipfs/QmaJNcm8N1shbqZRBbURjCsLh5WfQ9Tc4yLbBPMxr93S5G)
可以看到，被识别为了一个正常图像以及一个压缩包文件

使用 `binwalk -e b.png`将文件提取出来
![](https://ipfs.pinellia.uk/ipfs/QmcY28Q3CDDAEphWpiNH7gYr85r6oXFE3TiC8gp8Vn4unp)
可以看到，提取出的文件夹如下，在以zip文件开始地址命名的文件夹下直接解出了压缩包内的文件
![](https://ipfs.pinellia.uk/ipfs/QmasDZYXmVZMc14CeqJChtWjiMfTa1mviaSLT3c1GGFRUt)
![](https://ipfs.pinellia.uk/ipfs/QmbqUQSSxruM84e4qZTswg9KbaD4YD5ZbLipGmGXDJHd2J)

## TIPS
建议将文件打压缩包后再进行隐写，因为例如word文档以及pdf本身就是一个文件集合，这样会导致binwalk无法正确的识别文件类型并提取。
![](https://ipfs.pinellia.uk/ipfs/QmddebmCSkKv33jM7X1BVrZPP3QwKyeWp3KaqJrH6r5Cv4)
> 当然，这样加密效果会更好，而且知道文件开始结束位置可以使用dd命令手动提取。