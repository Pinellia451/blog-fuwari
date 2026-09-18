---
title: PTA 天梯赛 L1 刷题总结（二）：10 分题型
published: 2025-02-26
description: 总结 PTA 天梯赛 L1 阶段常见的 10 分题型、输入输出规律与精简代码思路。
tags: [algorithm, pta, cpp, note]
category: 编程与算法
draft: false
device: Windows
---

这组 10 分题主要考查输入输出、基础分支、循环和 STL 的直接使用。题目通常按样例逐组处理，不必为了“最后统一输出”而额外保存全部输入。

需要反复检查的细节有三项：计数变量初始化、行尾空格和换行位置。

## 1. 数字与拼音映射

### L1-007 念数字

输入一个整数，逐位输出对应拼音；负数先输出 `fu`。数字与拼音是一一映射关系，直接按字符串读取可以保留原始顺序，也能自然处理负号。

下面保留三种实现用于比较。第一种按整数取模，需要逆序保存各位数字：

```cpp
#include <stdio.h>
#include <stdlib.h>

void num(int s)
{
switch (s)
{
case 1:
printf("yi");break;
case 2:
printf("er");break;
case 3:
printf("san");break;
case 4:
printf("si");break;
case 5:
printf("wu");break;
case 6:
printf("liu");break;
case 7:
printf("qi");break;
case 8:
printf("ba");break;
case 9:
printf("jiu");break;
case 0:
printf("ling");break;
}
}
int main()
{
int n,i,j;
int a[100]={0};
scanf("%d",&n);
if(n<0)
  {
       printf("fu ");
       n*=(-1);
  }
   i=0;
   while(n/10)
  {
       a[i++]=n%10;
       n/=10;
  }
   a[i]=n;
   for(j=i;j>=0;j--)
  {
       if(j==0) num(a[j]);
       else
      {
           num(a[j]);
           printf(" ");
      }
  }
return 0;
}
```

### 二维字符数组

`strlen(s)` 获取字符串长度，`s[i] - '0'` 将数字字符转换为对应整数。只有两种分支时，可以使用条件运算符简化标志位初始化：

```cpp
#include <iostream>
#include<cstring>
#include<cstdio>
using namespace std;
int main() {
   char a[10][10] = {"ling", "yi", "er", "san", "si", "wu", "liu", "qi", "ba", "jiu"};
   char s[1000];
   scanf("%s",s);
   int len=strlen(s);
   int flag = s[0] == '-' ? 1 : 0;
   if(flag == 1)
      printf("fu");
   for(int i = flag; i < len; i++)
  {
       if(i == 0)
      {
           printf("%s",a[s[i]-'0']);
           continue;
      }

       printf(" %s",a[s[i]-'0']);
  }
   return 0;
}
```

### `string` 数组

使用 `flag` 记录起始下标。若首字符为 `'-'`，先输出 `fu`，再从下标 1 开始查表：

```cpp
#include <iostream>
#include <string>

using namespace std;

int main()
{
   string s[10]={"ling","yi","er","san","si","wu","liu","qi","ba","jiu"};
   string a;
   int h;
   int i,flag;
   flag=0;
   cin>>a;
   if(a[0]=='-')
  {
       flag=1;
       cout<<"fu ";
  }
   for(int i=flag;a[i]!='\0';i++)
  {
        h = a[i]-'0';
       if(i<a.length()-1)
           cout<<s[h]<<" ";
       else
            cout<<s[h];
  }

   return 0;
}

```

## 2. 排序

### L1-010 比较大小

`std::sort(first, last)` 默认升序排列左闭右开区间。数组有三个元素时，范围写作 `sort(a, a + 3)`；需要其他顺序时再提供比较函数：

```cpp
#include <iostream>
#include <algorithm>
using namespace std;

int main()
{
   int a[3];
   cin>>a[0]>>a[1]>>a[2];
   sort(a,a+3);
   for(int i=0;i<3;i++)
  {
       if(i<2)
           cout<<a[i]<<"->";
       else cout<<a[i];
  }
   return 0;
}

```

## 3. 格式化输出

### L1-008 求整数段和

`printf("%5d", value)` 将整数按 5 个字符宽度右对齐。用计数器控制每 5 个数换行，同时避免在最后一个数后多输出空行：

```cpp
#include <iostream>
#include <cstdio>

using namespace std;

int main()
{
   int m,n,flag,sum;
   cin>>m>>n;
   sum=flag=0;
   for(int i=m;i<=n;i++)
  {
       printf("%5d",i);
       flag++;
       if(flag%5==0&&i!=n)
           printf("\n");
       sum+=i;
  }
   cout<<endl;
   cout<<"Sum = "<<sum;
   return 0;
}

```

## 4. 分类计算

### L1-031 到底是不是太胖了

整数绝对值可使用 `abs`，浮点数使用 `fabs`。公共输出逻辑不要误放进某个 `else` 分支：

```cpp
#include <iostream>
#include <math.h>
using namespace std;

int main()
{
   int n,W,w,H;
   cin>>n;
   while(n--)
  {
       cin>>H>>W;
       w=(H-100)*1.8;
       if(fabs(W-w)<w*0.1)
           cout<<"You are wan mei!"<<endl;
       else if(W>w)
           cout<<"You are tai pang le!"<<endl;
       else
           cout<<"You are tai shou le!"<<endl;
  }
   return 0;
}

```

## 5. 素数判断

### L1-028 判断素数

试除范围只需到 `sqrt(n)`。计数从 2 开始，并单独处理 1 不是素数的边界：

```cpp
#include <iostream>
#include <math.h>
#include <cstdio>
using namespace std;

int main()
{
   int i,j,n,m;
   cin>>n;
   for(i=0;i<n;i++)
  {
        int flag=0;
        cin>>m;
       for(j=2;j<=sqrt(m);j++)
      {
           if(m%j==0)
          {
               flag=1;
               break;
          }
      }
           if(flag==1||m==1)
               cout<<"No"<<endl;
           else if(flag==0)
               cout<<"Yes"<<endl;
  }
   return 0;
}
```

## 6. 满足条件后退出

### L1-041 寻找 250

输入数量未知时持续读取；第一次遇到 250 就输出位置并用 `break` 结束循环：

```cpp
#include <iostream>
#include <string>
#define N 10010
using namespace std;

int main()
{
   int i;
   int m=0;
   do
  {
       cin>>i;
       if(i==250)
      {
           cout<<m+1;
           break;
      }
       m++;
  }while(1);

   return 0;
}

```

## 7. 按规则判断

### L1-055 谁是赢家

分别记录观众票数和三名评委的投票，再直接翻译题目的获胜条件。重点是确认 0、1 分别代表哪位选手：

```cpp
#include <iostream>
#include <cstdio>
using namespace std;

int main()
{
   int i,pa,pb,a,b,c,qa,qb;
   cin>>pa>>pb;
   qa=qb=0;
   for(i=0;i<3;i++)
  {
        cin>>a;
        a==0?qa++:qb++;
  }
   if((pa>pb&&qa>=1)||(pa<pb&&qa==3))
       cout<<"The winner is "<<"a"<<": "<<pa<<" + "<<qa;
   else
       cout<<"The winner is "<<"b"<<": "<<pb<<" + "<<qb;
   return 0;
}
```
