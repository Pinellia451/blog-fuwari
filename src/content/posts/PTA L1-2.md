---
title: PTA天梯赛L1刷题总结（二）10分题型
published: 2025-02-26
description: PTA 刷题记录-第二部分
tags: [OI,]
category: OI
draft: false
---

> **从这里开始，题目通常都是先给N，然后给出N行数据，虽然题目中看上去输出样例是一起输出，但是我们在编译器里可以是针对每一个样例给出结果（不用把示例都输入后再输出结果），意味着不需要用数组储存（或者使用结构体），可以节省代码量。**
>
> **一般情况下，题目还会要求行尾不能有空格，那么我们可以在输出时分两种情况，如if(i==n)时 输出xxx, else 输出xxx 以及空格。** **测试时注意使用英文的标点符号** **最好在变量需要时再进行初始化，这样也比较方便（但是好像Code Blocks不支持这样操作，需要一开始就定义变量）。** **在计数时注意赋初始值( 一般为0)，否则该变量数值不确定**

**接下来说说10分题出现的题型（旁边是题号）**

1. **给一个整数，输出每一位上的数字 7**

> **L1-007 念数字 (10分)** **输入一个整数，输出每个数字对应的拼音。当整数为负数时，先输出fu字。**

* **如果是过去的思维，通常会采用C语言的switch-case结构，先读入整数，再获取每一位上的数字，用switch-case结构来读出每一位的拼音**
* **如果是用更聪明的想法，其实数字和拼音是****存在一个一一映射的关系(hash)**，那么可以用读入字符串的方式读入输入示例。如果是char型数组的话，可以用二维数组char[m](http://blog.pinellia.uk/2025/02/ptal110.html#)定义，因为二维数组中的每个一维数组都存储着拼音，当然如果使用string数组就更方便了。或者使用STL容器的map来做也很快（后面大题再说）。

**下面以三种做法为例进行对比** **1）读入整型法** **这里涉及到如何获取每一位的数字的做法。很容易理解，以106为例，106%10，余数为6，即个位，然后106/10后再取余，循环的终止条件在于/10之后为0。这样依次获取的数字是从右往左读的，所以在输出时需注意。在这里我的做法是把获取的每一位数存入数组，在倒序输出。**

```cpp
#include <stdio.h>
#include <stdlib.h>

void num(int s)
{
switch (s)
{
case 1:
printf("yi");break;
case 2:
printf("er");break;
case 3:
printf("san");break;
case 4:
printf("si");break;
case 5:
printf("wu");break;
case 6:
printf("liu");break;
case 7:
printf("qi");break;
case 8:
printf("ba");break;
case 9:
printf("jiu");break;
case 0:
printf("ling");break;
}
}
int main()
{
int n,i,j;
int a[100]={0};
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
       if(j==0) num(a[j]);
       else
      {
           num(a[j]);
           printf(" ");
      }
  }
return 0;
}
```

**2）二维数组法** **len = strlen(s);获取字符数组的长度 **s[i]-'0'获得的就是该字符对应的整数**** **如'6'-'0'=6** **另外在if-else如果只有两种情况（****非此即彼）**，那么就可用xxx?a:b xxx表示判断条件，**如果满足则执行a,否则执行b。这样来简化写法**

```cpp
#include <iostream>
#include<cstring>
#include<cstdio>
using namespace std;
int main() {
   char a[10][10] = {"ling", "yi", "er", "san", "si", "wu", "liu", "qi", "ba", "jiu"};
   char s[1000];
   scanf("%s",s);
   int len=strlen(s);
   int flag = s[0] == '-' ? 1 : 0;
   if(flag == 1)
      printf("fu");
   for(int i = flag; i < len; i++)
  {
       if(i == 0)
      {
           printf("%s",a[s[i]-'0']);
           continue;
      }
       
       printf(" %s",a[s[i]-'0']);
  }
   return 0;
}
```

**3）string数组法** **在很多题目中，我们会采用标志位flag来标记，通常初始化为0，如果满足某条件标记为1，这样可以容易地判断是否满足某一条件。在这道题中，如果a[0]=='-'，就说明这个数是负数，输出"fu"，注意在读入string类型的a时，应该用的是英文的单引号''，而非双引号.**

```cpp
#include <iostream>
#include <string>

using namespace std;

int main()
{
   string s[10]={"ling","yi","er","san","si","wu","liu","qi","ba","jiu"};
   string a;
   int h;
   int i,flag;
   flag=0;
   cin>>a;
   if(a[0]=='-')
  {
       flag=1;
       cout<<"fu ";
  }
   for(int i=flag;a[i]!='\0';i++)
  {
        h = a[i]-'0';
       if(i<a.length()-1)
           cout<<s[h]<<" ";
       else
            cout<<s[h];
  }

   return 0;
}

```

**2.排序 10**

> **具体排序方法有很多，这里介绍STL容器中的sort,注意要加头文件 #include < algorithm >基本用法是定义了数组之后，sort(数组的起始位置，结束的****下一个位置**,cmp)，第三个参数不加时默认时从小到大排序，否则需要自定义一个cmp函数，规定排序的顺序

* **L1-010 比较大小 (10分)** **要求将输入的任意3个整数从小到大输出。**

```cpp
#include <iostream>
#include <algorithm>
using namespace std;

int main()
{
   int a[3];
   cin>>a[0]>>a[1]>>a[2];
   sort(a,a+3);
   for(int i=0;i<3;i++)
  {
       if(i<2)
           cout<<a[i]<<"->";
       else cout<<a[i];
  }
   return 0;
}

```

**3.格式化输出 不足补充 靠右 8 18 37（分类讨论）**

> **关于格式化输出，在上一节已作讨论，在这里来说以下靠右的做法，例如** **左对齐-%10d **右对齐%10d。数字宽度为10，若不足10，在左边补足空格****

* **以L1-008 求整数段和 (10分)为例** **首先顺序输出从A到B的所有整数，每5个数字占一行，每个数字占5个字符宽度，向右对齐。最后在一行中按Sum = X的格式输出全部数字的和X。**

**这道题需要特别注意的是换行，可以用一个变量cnt来递增，若cnt%5==0说明此时该换行，另外一个测试点在于如果最后一个数不 是在最后一行最后一个位置，不需要换行**

```cpp
#include <iostream>
#include <cstdio>

using namespace std;

int main()
{
   int m,n,flag,sum;
   cin>>m>>n;
   sum=flag=0;
   for(int i=m;i<=n;i++)
  {
       printf("%5d",i);
       flag++;
       if(flag%5==0&&i!=n)
           printf("\n");
       sum+=i;
  }
   cout<<endl;
   cout<<"Sum = "<<sum;
   return 0;
}

```

**4.简单计算 阶乘计算（嵌套循环） 13 31 40**

> **以L1-031 到底是不是太胖了 (10分)为例** **说此题的原因在于** **abs(x) 要加头文件 #include x必须为整数 **浮点型用math.h下的fabs()**** **注意在if 的时候不要把公共部分放在else中，否则不会输出公共内容**

```cpp
#include <iostream>
#include <math.h>
using namespace std;

int main()
{
   int n,W,w,H;
   cin>>n;
   while(n--)
  {
       cin>>H>>W;
       w=(H-100)*1.8;
       if(fabs(W-w)<w*0.1)
           cout<<"You are wan mei!"<<endl;
       else if(W>w)
           cout<<"You are tai pang le!"<<endl;
       else
           cout<<"You are tai shou le!"<<endl;
  }
   return 0;
}

```

**5.简单题 22 47 53 61** **不多说** **6.判断素数 28** **判断素数****需要用到sqrt()求平方根缩小循环的范围**，否则可能会超时，注意加上头文件<math.h> **L1-028 判断素数 (10分)**

```cpp
#include <iostream>
#include <math.h>
#include <cstdio>
using namespace std;

int main()
{
   int i,j,n,m;
   cin>>n;
   for(i=0;i<n;i++)
  {
        int flag=0;
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
           else if(flag==0)
               cout<<"Yes"<<endl;      
  }
   return 0;
}
```

**7.达到某条件即break 41** **一般达到某条件则用break退出循环**

> **L1-041 寻找250 (10分)** **输入在一行中给出不知道多少个绝对值不超过1000的整数** **在一行中输出第一次出现的"250"是对方扔过来的第几个数字（计数从1开始）**

**这样的情况就是不能够知道到底扔来多少数，这时候就可以用while(1)不断接收数字，一旦满足此数为250即退出循环**

```cpp
#include <iostream>
#include <string>
#define N 10010
using namespace std;

int main()
{
   int i;
   int m=0;
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

   return 0;
}

```

**8.根据题意求解 55 63**

> **以L1-055 谁是赢家 (10分)为例** **每次安排两位艺人表演，他们的胜负由观众投票和 3名评委投票两部分共同决定。如果一位艺人的观众票数高，且得到至少 1名评委的认可，该艺人就胜出；或艺人的观众票数低，但得到全部评委的认可，也可以胜出。数字 0 代表投票给 a，数字 1 代表投票给** **b，其间以一个空格分隔。** **这题思路不难，用几个变量存储一下观众和评委得票数，根据题意进行描述即可**

```cpp
#include <iostream>
#include <cstdio>
using namespace std;

int main()
{
   int i,pa,pb,a,b,c,qa,qb;
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
   return 0;
}
```
