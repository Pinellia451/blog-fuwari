---
title: pta天梯赛l1刷题总结（三）15分题型
published: 2025-02-26
description: PTA 刷题记录-第三部分
tags: [OI,]
category: OI
draft: false
---
**首先对20道题进行一个分类吧~**

**目录**

[一、哈希映射问题](http://blog.pinellia.uk/2025/02/ptal115.html#%E4%B8%80%E3%80%81%E5%93%88%E5%B8%8C%E6%98%A0%E5%B0%84%E9%97%AE%E9%A2%98)

[二、结构体问题](http://blog.pinellia.uk/2025/02/ptal115.html#%E4%BA%8C%E3%80%81%E7%BB%93%E6%9E%84%E4%BD%93%E9%97%AE%E9%A2%98)

[三、简单题（按题意要求写就行，部分题给出代码）](http://blog.pinellia.uk/2025/02/ptal115.html#%E4%B8%89%E3%80%81%E7%AE%80%E5%8D%95%E9%A2%98%EF%BC%88%E6%8C%89%E9%A2%98%E6%84%8F%E8%A6%81%E6%B1%82%E5%86%99%E5%B0%B1%E8%A1%8C%EF%BC%8C%E9%83%A8%E5%88%86%E9%A2%98%E7%BB%99%E5%87%BA%E4%BB%A3%E7%A0%81%EF%BC%89)

[四、字符串处理](http://blog.pinellia.uk/2025/02/ptal115.html#%E5%9B%9B%E3%80%81%E5%AD%97%E7%AC%A6%E4%B8%B2%E5%A4%84%E7%90%86)

[五、矩阵处理](http://blog.pinellia.uk/2025/02/ptal115.html#%E4%BA%94%E3%80%81%E7%9F%A9%E9%98%B5%E5%A4%84%E7%90%86)

---

#### *一、哈希映射问题*

***L1-003 个位数统计***

**此题中N是一个不超过 1000 位的正整数，遇到这样的问题一般采用字符串遍历的方式解决。（超出了整型的范围）。题目要求对 N 中每一种不同的个位数字，以 D:M 的格式在一行中输出该位数字 D 及其在 N 中出现的次数 M。要求按 D 的升序输出。**

> **回顾一下int类型和long long类型有多少位 **
>
> **int类型 -2**31~2**31 -1 【int类型在C语言中占4个字节，即32个二进制位，最高位为符号位】**
>
> **long long类型  −2**63,2**63−1【long long类型在C语言中占8个字节，即64个二进制位】**
>
> **int*********只能表示到10^9，而long long 可以表示到10^18*******。******根据不同的情况需定义不同的数据类型。**

**思路：**

**根据题目的要求，第一想到的是用哈希表来存储每位数字对应的次数，这个是一一映射的关系。每一位上就是0到9十个数字，用一个长度为10的整型数组就行。对于出现次数为0的，就不用输出了。这里加个判断就可以。**

**对于字符串问题，首先先读入每一个字符，遇到一个字符，则对应出现次数+1。最后输出时如果映射的值不为0，则按照格式输出即可。**

**本题有两个注意点**

**1） memset(s,0,sizeof(s)); 是关键，对数组初始化都设置为0，否则会出错。用到这个时需要加上头文件 #include <string.h>**

**2） 注意遍历时str[i]是一个字符，要str[i]-'0'来转化为int类型**

```cpp
#include <iostream>
#include <string>
#include <string.h>

using namespace std;

int main()
{
   string str;
   int s[10];
   int i;
   cin>>str;
   memset(s,0,sizeof(s)); //关键，对数组初始化都设置为0，否则会出错
   for(i=0;i<str.length();i++)
  {
       s[str[i]-'0']++;    //注意str[i]是一个字符，要str[i]-'0'来转化为int类型
  }
   for(i=0;i<10;i++)
  {
       if(s[i]!=0)
           cout<<i<<":"<<s[i]<<endl;
  }
   return 0;
}
```

**下面给出****第二种方法**，博主去刷力扣时的常用方法。我们可以利用map来解决这个哈希数组问题。

> **这种方法有几个学习点**
>
> **1）定义map的时候记得****加上头文件#include **`<map>`****
>
> ** 如map<string,int>就是代表从string类型到int类型的映射，且****map默认是按key值从小到大排序。**
>
> **2）访问map容器内元素方法，一个是通过访问下标，比如下方的mp[c-’0’]，还有一种就是通过迭代器（如map<int, int>::iterator it）。通过it->first访问键，it->second访问值。**
>
> **下边的写法可以这么写**
>
> **for(map<int,int>::iterator it = mp.begin();it!=mp.end();it++)**
>
> **{**
>
> **    cout << it->first << ":" << it->second << endl;**
>
> **}**
>
> **3）for(char c:str)这是for循环的一个简便写法，遍历字符串str的每一个字符就是c，也就是方法一中的str[i]，比方法一的遍历要方便很多对吧。**

```cpp
#include <iostream>
#include <string>
#include <string.h>
#include <map>

using namespace std;

int main()
{
   string str;
   cin>>str;
   map<int,int> mp;
   for(char c:str)
  {
       mp[c-'0']++;
  }
   map<int, int>::iterator it = mp.begin();

while (it != mp.end()) {
cout << it->first << ":" << it->second << endl;
it++;
}

   return 0;
}
```

#### 二、结构体问题

***L1-005 考试座位号***

**针对本题，题目的要求是对应每个需要查询的试机座位号码，在一行中输出对应考生的准考证号和考试座位号码，中间用 1 个空格分隔。**

**思路：**

**    考虑到每个人是有准考证号、试机座位号、考场座位号的。这时候考虑用结构体代表每个学生。****特别是在不同数据类型的变量或数组组合在一起的时候应用结构体能够便于存储。**

> **比如struct studentInfo{int id; char gender; string name;}Bob,stu[10];**
>
> **其中studentInfo是结构体名，Bob是结构体变量，stu[10]是结构体数组（包含了10个学生的信息）。访问结构体可以通过.或者->**

**实现：**

**准考证号是16位数字，可以考虑用string类型来存储。首先遍历给定的N个学生的信息。再依次读入试机号，遍历结构体中是否有相同的试机号，相同则输出其准考证号和考试座位号。**

**当遍历的次数和循环的内容没有关系时，可以用while(m--)作循环**

```cpp
#include <iostream>
#include <cstdio>
#define N 100000
using namespace std;

struct node
{
   string z;
   int s,k;
}stu[N];
int main()
{
   int i,m,n,l;
   cin>>n;
   for(i=0;i<n;i++)
  {
      cin>>stu[i].z>>stu[i].s>>stu[i].k;
  }
   cin>>m;
   while(m--)
  {
       cin>>l;
       for(i=0;i<n;i++)
      {
           if(stu[i].s==l)
               cout<<stu[i].z<<" "<<stu[i].k<<endl;
      }
  }
   return 0;
}
```

**或者我们可以优化一下，建立试机号到结构体（准考证号，座位号）的映射。下面给出****第二种方法**。

```cpp
#include <iostream>
#include <cstdio>
#include <map>
#define N 100000
using namespace std;

struct node
{
   string z;//准考证号
   int k; //考场座位号
}stu;

int main()
{
   int i,m,n,l;
   map<int,node> mp;
   cin>>n;
   int s;
   for(i=0;i<n;i++)
  {
      cin>>stu.z>>s>>stu.k;
      mp[s] = stu;
  }
   cin>>m;
   while(m--)
  {
       cin>>l;
       cout<<mp[l].z<<" "<<mp[l].k<<endl;
  }
   return 0;
}
```

***L1-030 一帮一***

**    得到全班学生的排名后，在当前尚未分组的学生中，将名次最靠前的学生与名次最靠后的*****异性***学生分为一组。每行输出一组两个学生的姓名。小组的输出顺序按照前面学生的名次从高到低排列。

**思路：**

**因为这道题我们不仅要存这个学生排名、姓名、还要存性别。****考虑用结构体来代表每一个学生。**

**输入已经按照名次大小排列了，那遍历的边界在哪里呢？是n/2。要不然再后面差一点的学生就排到前面去了。**

**因为要和异性组队，那么是不是有可能出现第一名和最后一名同学是同性，于是第一名和倒数第二名同学组队了，那第二名和最后一名是异性，他们组队。那这时候就得****考虑有个标志位来记录这个同学是不是组过队了。**

**实现：**

**结构体我们上面已经说了，可以定义一个大小为N的结构体数组，在头部宏定义#define N 10000**

**在输入第i个学生的性别和姓名时，****初始化是否组队的标记位为0。**

**在输出时，按照名词顺序，用两重循环，外层循环先输出名次高的同学名字，再嵌套一个循环，从j=n-1开始，若不满足j>i则跳出。如果这个同学之前未匹配并且和名次高的同学性别不同，则匹配成功，输出这个同学姓名，并置标记位为1。否则break（****只会跳出这一层循环！**）

```cpp
#include <iostream>
#define N 10000
using namespace std;
struct node
{
   int x,f;
   string m;
}s[N];
int main()
{
   int i,j,n;
   cin>>n;
   for(i=0;i<n;i++)
  {
       cin>>s[i].x>>s[i].m;
       s[i].f=0;
  }
   for(i=0;i<n/2;i++)
  {
       for(j=n-1;j>i;j--)
      {
           if(s[i].x!=s[j].x&&s[j].f!=1)
          {
               cout<<s[i].m<<" "<<s[j].m<<endl;
               s[j].f=1;
               break;
          }
      }
  }
   return 0;
}
```

#### 三、简单题（按题意要求写就行，部分题给出代码）

***L1-015 跟奥巴马一起画方块***

**题目要求是输入在一行中给出正方形边长N****，**输出由给定字符C画出的正方形，且输出的行数实际上是列数的50%（四舍五入取整）。

**双重循环，外层代表多少行，内层代表多少列。要求行数是列数的50%。给定的边长其实就是列数，那行数是四舍五入求整。**

**本题比较简单，****注意点:****int类型除法是向下取整**，如果要做到四舍五入的话应写为l=(n+1)/2;

***L1-016 查验身份证***

**定义两个数组，一个存储权重，一个存储校验码，按题意对比取模后对应校验码的值是否与身份证最后一位相同即可。为了便于核对，可用字符串类型存储身份证。**

***L1-017 到底有多二***

**输入第一行给出一个的整数N。一个整数“*****犯二的程度***”定义为该数字中包含2的个数与其位数的比值。如果这个数是负数，则程度增加0.5倍；如果还是个偶数，则再增加1倍。

**思路：**

**首先依题意N不超过50位，考虑用字符串类型定义N。遍历字符串记录2的个数。**

**注意位数需要排除符号位**，如果首位是负号，用一个flag位标记是否*1.5（增加0.5倍）那么长度为s.length(）-1（可以用l-flag表示位数）。

**看末位是否能被2整除，如果是结果*2。**

**注意点：**小数点后保留两位  printf("%.2f",b);。**比值要转为double类型**。

```cpp
#include <iostream>
#include <cstdio>
using namespace std;

int main()
{
   string s;
   double b;
   int i,cnt=0;
   cin>>s;
   int flag=0;
   if(s[0]=='-') flag=1;
   int l = s.length();
   for(i=flag;i<s.length();i++)
  {
       if(s[i]-'0'==2)
           cnt++;
  }
   b = (double)cnt/(l-flag)*100;
   if(flag==1)
       b*=1.5;
   if((s[l-1]-'0')%2==0)
       b*=2;
   printf("%.2f",b);
   cout<<"%";
   return 0;
}
```

***L1-019 谁先倒***

**思路：**

**这题关键点在于判断谁赢谁输。比如甲输的条件是什么？注意同输是进入下一轮的，不喝酒。因此if中有两个判断条件。谁输了谁喝的杯数+1。**

**在for循环中我们每次遍历都看看是不是有人已经到达他的酒量了。有人倒下就终止（喝的杯数>酒量），输出输家和赢家喝的杯数，用break跳出循环。**

**注意点：**

**输入的时候用到getchar();  目的是清空回车符，从标准输入流读取一个字符，读回车符时退出**

**最好定义的变量名能够很好的体现含义，特别这题一行四个变量，要避免后面写乱了。**

```cpp
#include <iostream>
#include <cstdio>
using namespace std;

int main()
{
   int a,b,n,i,yf,jf,yh,jh,ma,mb;
   ma=mb=0;
   cin>>a>>b;
   getchar();  //不用也可以，目的是清空回车符，从标准输入流读取一个字符，读回车符时退出
   cin>>n;
   for(i=0;i<n;i++)
  {
       cin>>jh>>jf>>yh>>yf;
       if(jf==jh+yh&&yf!=jh+yh)
           ma++;
       if(yf==jh+yh&&jf!=jh+yh)
           mb++;
       if(ma>a||mb>b)
      {
         if(mb>b)
          {
               cout<<"B"<<endl;
               cout<<ma;
          }
          if(ma>a)
          {
              cout<<"A"<<endl;
              cout<<mb;
          }
          break;
      }

  }

   return 0;
}
```

***L1-062 幸运彩票***

**用字符串保存字符串，再依题意判断输出即可。**

***L1-069 胎压监测***

**思路：**

**    这题可以用数组存储各个轮胎的值。求数组中最大值可以用到max()。注意读题内容准确，遍历每个轮胎，看最大值与此轮胎气压差大于阈值或者这个轮胎气压值小于最低气压时，轮胎异常数+1，并且标记轮胎编号。对于异常轮胎个数用一个变量表示，最后根据轮胎异常数为0,1还是>1的情况分别输出结果。**

```cpp
#include <cstdio>
#include <iostream>
#include <cmath>
using namespace std;

int main()
{
   int a[4];
   int yu,ya;
   scanf("%d %d %d %d",&a[0],&a[1],&a[2],&a[3]);
   scanf("%d %d",&ya,&yu);
   
   int maxY = 0,cnt =0,index,i;
   for(i=0;i<4;i++)
  {
       maxY = max(maxY,a[i]);
  }
   for(i=0;i<4;i++)
  {
       if(maxY-a[i]>yu||a[i]<ya)
      {
           cnt++;
           index = i;
      }
  }
   if(cnt==0) cout<<"Normal";
   else if(cnt==1) printf("Warning: please check #%d!",index+1);
   else cout<<"Warning: please check all the tires!";
   return 0;
}
```

***L1-077 大笨钟的心情***

**这道题也是不知道有多少行输入的，在遇到非法数据（不在[0,23]区间）时停止。那就把while循环()里内容改为while(cin>>n&&n>=0&&n<=23)。****注意格式正确。**

#### 四、字符串处理

**1、字符串转化为整型**

***L1-025 正整数A+B***

**A和B都在区间[1,1000] A、B有时候可能是超出范围的数字、负数、带小数点的实数、甚至是一堆乱码。把输入中出现的第1个空格认为是A和B的分隔。**

**思路：**

**    首先A、B不一定都是整数，可能是乱码，因此采用字符串来存储A、B。读入A之后一定要加getchar()读入缓冲区中的空格，getline(cin,str)读入整行字符串B。**

**    对于不符合条件的数字用?代替，只要加法的任一加数为？，结果均为？ **

**    我们只对符合条件的两个加数进行计算。由于A、B都是[1,1000]的数，因此我们可以把他们转化为整型再相加获得结果，这里可以****专门写一个函数来实现字符串到整型的转换**。如果返回值为-1，表示这个数不符合条件，否则返回转化为整型的值。最后以规定的格式输出等式。

**    输出结果时有四种可能：一是两个都是整数，第二、三种是A或B满足条件，另一个不符合条件，第四种是A、B都不符合条件。可用if进行判断。**

**实现：**

**    那么这个函数要怎么写呢？我们将字符串和字符串长度作为参数传入（只传一个字符串也没有关系）。遍历这个字符串，如果出现这个字符<’0’且>’9’就说明这个字符串不符合条件了，这时直接返回-1，别继续遍历了。否则，****sum=sum10+a[i]-'0';** 想想是不是这样。最后返回这个sum，也就是转化的结果。

```cpp
#include <iostream>
#include <cstdio>
#include <string>
using namespace std;

int pan(string a,int len)
{
   int i,sum=0;
   for(i=0;i<len;i++)
  {
       if(a[i]<'0'||a[i]>'9')
           return -1;
       else
           sum=sum*10+a[i]-'0';
  }

   return sum;
}
int main()
{
   string a,b;
   cin>>a;
   getchar();
   getline(cin,b);
   int lena = a.length();
   int lenb = b.length();
   int A = pan(a,lena);
   int B = pan(b,lenb);
   if((A>0&&A<=1000)&&(B>0&&B<=1000))
       cout<<A<<" + "<<B<<" = "<<A+B;
   if((A>0&&A<=1000)&&(B<1||B>1000))
       cout<<A<<" + ? = ?";
   if(B>0&&B<=1000&&(A<1||A>1000))
       cout<<"? + "<<B<<" = ?";
   if((A<1||A>1000)&&(B<1||B>1000))
       cout<<"? + ? = ?";
   return 0;
}
```

**2、提取整数的每一位数字**

***L1-033 出生年***

**    输入在一行中给出出生年份y和目标年份中不同数字的个数n，其中y在[1, 3000]之间。根据输入，输出x和能达到要求的年份。数字间以1个空格分隔，行首尾不得有多余空格。注意不足4位的年份要在前面补零**

**思路：**

**题目已经说了****所谓“n个数字都不相同”是指不同的数字正好是n个。**

**考虑到set不会存放相同的元素**，可以把当前年份所含的数字insert()加入到集合中，如果集合中数字个数==n就break退出。返回年龄和当前年份（注意输出格式！）。起始值为出生年份，循环到能找到这个年份为止（年份一年一年往上加）。

**实现：**

**    这里就和上题不同的是，不需将年份转化为字符串，而是需要将整型的一位位取出来。怎么取呢？假设当前处理的年份是n，这里****也不需要按顺序来存**，所以每次把n%10添加到set中（取出当前数的末位数字），再n/10。循环多少次呢?因为y在[1, 3000]，**保证是个4位数**。设置j的起始值为4就可以了。

> **while(j--)**
>
> **{    s.insert(n%10);**
>
> **     n/=10;**
>
> **}**

**注意这时候n的值已经发生改变，用一个变量来保存一下它。**

```cpp
#include <iostream>
#include <cstring>
#include <cstdio>
#include <set>
using namespace std;

int main()
{
   int y,n,m;
   cin>>y>>n;
   m = y;
   
   while(1)
  {
      int h = m;
      set<int> s;   //注意定义的位置
      int j=4;
      while(j--)
      {
          s.insert(h%10);
          h/=10;
      }
       if(s.size()==n) break;
       m++;
  }
   printf("%d %04d",m-y,m);
   return 0;
}
```

**3、遇到某个特定字符串停止输入（不知道循环多少次的情况）**

**还有种情况就是给一行字符串，我们使用****getline(cin,str)后用s.length()就知道字符串的长度**，便可以用for循环遍历整个字符串了。（如58题）

***L1-035 情人节***

**输入按照点赞的先后顺序给出不知道多少个点赞的人名，每个人名占一行，为不超过10个英文字母的非空单词，以回车结束。一个英文句点.标志输入的结束。若存在第2个人A和第14个人B，则输出“A and B are inviting you to dinner...”；若只有A没有B，则输出“A is the only one for you...”；若连A都没有，则输出“Momo... No one is for you ...”。**

**思路：**

**输入时注意条件是不知道多少个点赞的人名（可用字符串表示），这时候就可以用while循环，特别是题目说了用英文句点.标志输入的结束。倘若读入的字符串是’.’，就可以跳出循环。**

**因为要输出第2和第14个人名，因此需要存储人名。****可以用字符串数组，也可以单纯存放第2个和第14个人名。**

**这题在输出的时候考虑如题所示的三种情况。如果人数>=14,输出…… 如果人数>=2且<14，需要输出……如果人数<2,输出…… 这时候还需要一个变量来标记点赞人数（有多少次循环）**

**第一种方法是用字符串数组来存储人名，****用while(1)循环**，直到遇到‘.’break跳出循环。

```cpp
#include <iostream>
#define N 10000
using namespace std;

int main()
{
   string s[N];
   int i=0;
   while(1)
  {
       cin>>s[i];
       if(s[i][0]=='.')
           break;
       i++;

  }
   if(i>1&&i<=13)
           cout<<s[1]<<" is the only one for you...";
   if(i<=1)
       cout<<"Momo... No one is for you ...";
   if(i>13)
           cout<<s[1]<<" and "<<s[13]<<" are inviting you to dinner...";
   return 0;
}
```

**第二种方法**是用字符串数组来存储人名，用**while(****cin>>s&&s!="."**)**（注意是双引号！）**来看是否进入循环。

```cpp
#include <iostream>
#define N 10000
using namespace std;

int main()
{
   string s,A,B;
   int i=0;
   while(cin>>s&&s!=".")
  {
       i++;
       if(i==2) A = s;
       if(i==14) B = s;

  }
   if(i>1&&i<=13)
           cout<<A<<" is the only one for you...";
   else if(i<=1)
       cout<<"Momo... No one is for you ...";
   else
        cout<<A<<" and "<<B<<" are inviting you to dinner...";
   return 0;
}
```

***L1-044 稳赢***

**根据对方的出招，给出对应的赢招。需要每隔K次就让一个平局。**

**思路：**

**这题石头剪刀布有个很巧的方法，我们不要专门设一个函数，比如传入参数为剪刀，返回石头；出石头，返回布……而是可以用一个字符串数组的方法，比如string s[3]={"ChuiZi","JianDao","Bu"};比如锤子，我们用布来对。布就用剪刀。****（规律：差2 再对三取模）**s[(i+2)%3]就是本局要赢对应的划拳。

**因此对于输入的字符串我们可以遍历下字符串数组，看当前的字符串在字符串数组的索引i（一个个比较是否相等）。**

**其次注意K是间隔次数，每隔K局就输出一个和输入的字符串相同的划拳。（比如k=2，前两局赢了，我第三局就要平局）这时就要用一个变量表示局数（初始化为1），如果局数%(k+1)==0就说明这句要平局。**

**输入到End就退出循环，这个方法和上一题一样，就不再赘述。**

```cpp
#include <iostream>

using namespace std;

int main()
{
   string s[3]={"ChuiZi","JianDao","Bu"};
   string str;
   int n,i;
   cin>>n;
   int c=1;
   while(1)
  {
       cin>>str;
       if(str=="End")
           break;
       for(i=0;i<3;i++)
      {
           if(str==s[i])
          {
               if(c%(n+1)!=0)
                   cout<<s[(i+2)%3]<<endl;
               else cout<<s[i]<<endl;
          }
      }
        c++;
  }

   return 0;
}
```

***L1-058 6翻了***

**从左到右扫描输入的句子：如果句子中有超过 3 个连续的 6，则将这串连续的 6 替换成 9；但如果有超过 9 个连续的 6，则将这串连续的 6 替换成 27。其他内容不受影响，原样输出。**

**这道题的难点就在于如何看有多少个连续的6，以及把连续的6替换为对应数字。**

**实现：**

**首先 用getline(cin,s)读入这行句子。**

**考虑用string类型中的replace()函数， **

> **str.replace(pos,len,str2);表示用str2替换str中从pos位置开始长度为len的子串。**

```cpp
#include <iostream>

using namespace std;

int main()
{
    string s;
   int i,j,n;
   getline(cin,s);
   for(i=0;i<s.length();i++)
  {
       for(j=0;i+j<s.size()&&s[i+j]=='6';j++);//记得这里有个分号，只是这样求一串6的长度
if(j>9) s.replace(i,j,"27");//j就是一串6的长度
else if(j>3) s.replace(i,j,"9");  
  }
   cout<<s;
   return 0;
}
```

**4、字符串包含问题（是否包含某一子串）**

***L1-070 吃火锅***

**自动检查你朋友给你发来的信息里有没有 chi1 huo3 guo1。输入每行给出一句不超过 80 个字符的、以回车结尾的朋友信息。当读到某一行只有一个英文句点 . 时，输入结束，此行不算在朋友信息里。**

**首先在一行中输出朋友信息的总条数。然后对朋友的每一行信息，检查其中是否包含 chi1 huo3 guo1，并且统计这样厉害的信息有多少条。在第二行中首先输出第一次出现 chi1 huo3 guo1 的信息是第几条（从 1 开始计数），然后输出这类信息的总条数，其间以一个空格分隔。题目保证输出的所有数字不超过 100。**

**如果朋友从头到尾都没提 chi1 huo3 guo1 这个关键词，则在第二行输出一个表情 -_-#。**

**思路：**

**首先要看看朋友到底发了多少条信息。这里每行就是一条，看有多少行。**

> **注意二者区别   cin>>str：遇到空格将停止输入 getline()：获得完整一行字符串**

**怎么体现遇到chi1 huo3 guo1呢？输入的这一行字符串包含这个字符串即可。这里插入一个知识点：**

> **在string类型中有一个find()函数，str.find(str2)，如果str包含str2，就返回在str中第一次出现str2的位置，否则返回string::npos。**

**注意用一个变量来存储第一次出现“chi1 huo3 guo1”的行数以及出现”chi1 huo3 guo1”的条数。**

**注意是****提到次数为0**时而不是行数为0时输出表情！这个在定义变量的时候做好区分。

```cpp
#include <cstdio>
#include <iostream>
#include <string>

using namespace std;
int main()
{
   string s;
   string str = "chi1 huo3 guo1";
   int cnt = 0,ans = 0,first = 0,flag=0 ;
   while(getline(cin,s)&&s!=".")
  {
       cnt++;
       if(s.find(str)!=string::npos)
      {
           ans++;
           if(ans == 1)  first = cnt;    
      }
  }
   cout<<cnt<<endl;
   if(ans ==0)  cout<<"-_-#";
else cout<<first<<" "<<ans;
return 0;
}
```

***L1-078 吉老师的回归***

**这题看题目很长的样子，简单来说就是某行字符串里有 qiandao 或者 easy*****（区分大小写）***的话，吉老师会跳过不做这题。

**输入表示本次天梯赛有 N 道题目，吉老师现在做完了 M 道。在一行中输出吉老师当前正在做的题目对应的题面（即做完了 M 道题目后，吉老师正在做哪个题）。如果吉老师已经把所有他打算做的题目做完了，输出一行 Wo AK le。**

**思路（本题脑子清醒比较重要）：**

**如果吉老师没把想做的题目做完，就输出吉老师正在做哪题（第m+1个不包含qiandao 或者 easy的题面）。如果吉老师都做完了，就输出指定内容。**

**这里就需要遍历完每一行的题面，看看究竟有多少题吉老师要完成的（与M比对是否已做完）。这就需要一个变量来记录吉老师做的题数，不包含：题数+1。**

**当题数==M+1时，输出第M+1个不包含qiandao 或者 easy的题面。(****注意在判断时二者是&&关系**)。字符串包含的问题上题已说明。

**什么情况下吉老师做完所有题目呢？ t<=m 也就是已完成的题数>=需要做的题数的情况**

**注意：**此题的输入  要么cin>>n>>m;之后跟上一个getchar()接收一下回车 再接着循环存储题面。要么就是scanf("%d %d\n",&n,&m);进行输入。否则会出错！

```cpp
#include <iostream>
#include <cstdio>
#include <string>

using namespace std;

int main()
{
   int n,m,t=0;
   cin>>n>>m;
   //scanf("%d %d\n",&n,&m);
   getchar();
   string s;
   for(int i=0;i<n;i++)
  {
       getline(cin,s);
       //if(s.find("qiandao")==string::npos&&s.find("easy")==string::npos)
       if(s.find("qiandao")==-1&&s.find("easy")==-1)    //也可以用-1表示string::npos，虽然会显示等号两边类型不匹配的warning
      {
           t++;
      }
       if(t==m+1)
      {
          cout<<s;
          break;
      }
  }
   if(t<=m) cout<<"Wo AK le"<<endl;
   return 0;
}
```

**5、规律题**

***L1-050 倒数第N个字符串***

**给定一个完全由小写英文字母组成的字符串等差递增序列，该序列中的每个字符串的长度固定为 L，从 L 个 a 开始，以 1 为步长递增。对于任意给定的 L，本题要求你给出对应序列倒数第 N 个字符串。**

**给定一个完全由小写英文字母组成的字符串等差递增序列，该序列中的每个字符串的长度固定为 L，从 L 个 a 开始，以 1 为步长递增。对于任意给定的 L，本题要求你给出对应序列倒数第 N 个字符串。**

**思路：**

**倒数第N个字符串，转化为正数第M个字符串来解决。L个字母会产生26^L个字符串，用函数表示就是pow(26,l);**

**感觉过去像是个找规律的问题，比如说aaaa、aaab…aaaz、aaba、aabb、aabc……zzzz。就好比满26了向前进1。可以看出到第28个（第一个记为0）时，把28%26的值为当前最低位（‘a’+2），接着28/26为1，对26求余为1，也就是倒数第二位。然后不断把这个值/26再对26求模（循环l次），就可以从最后一位往前推当前位的字符，结果是aabc。最后逆序逐个输出每一位上的字符。(这题对我来说还挺难想的…）**

```cpp
#include <iostream>
#include <math.h>
#define N 10
using namespace std;

int main()
{
   int l,n,m,i,t;
   char r[N];
   cin>>l>>n;
   t = pow(26,l);
   m = t-n;
   for(i=l-1;i>=0;i--)
  {
       r[i] ='a'+m%26;
       m/=26;
  }
   for(i=0;i<l;i++)
       cout<<r[i];
   
   return 0;
}
```

#### 五、矩阵处理

**1、矩阵相乘**

***L1-048 矩阵A乘以B***

**思路：**

**输入先后给出两个矩阵A和B。对于每个矩阵，首先在一行中给出其行数R和列数C。只有Ca与Rb相等时，两个矩阵才能相乘。**

**若输入的两个矩阵的规模是匹配的，则按照输入的格式输出乘积矩阵AB，否则输出Error: Ca != Rb**

**可以在草稿纸上模拟一下矩阵相乘有什么特点。首先结果是Ra×Cb大小的矩阵c。比如c**[i](http://blog.pinellia.uk/2025/02/ptal115.html#)的结果为a的第i行分别与b的第j列元素相乘结果再相加。

**实现：**

**首先输入两个矩阵，用二维数组a和b来存储（在输入矩阵a的行数和列数时就创建符合大小的二维数组）。存入数组元素也不难，双重循环读入每个位置元素就可以了。**

**其次对Ca和Rb进行比较，不相等直接输出Error，就不要进行矩阵相乘了。可以用个if-else判断**

**实现起来是不是a**[i](http://blog.pinellia.uk/2025/02/ptal115.html#)*c[k](http://blog.pinellia.uk/2025/02/ptal115.html#)。这个k的范围就是a的列数，即b的行数。因此设置三层循环，最里层计算sum+=a[i](http://blog.pinellia.uk/2025/02/ptal115.html#)*b[k](http://blog.pinellia.uk/2025/02/ptal115.html#);  第二层循环需要更新sum=0;

**注意！**行首尾没有多余的空格。可用一个变量来标记此时是这一行第几个元素（若初始化为0）

**非每行末尾元素，我们输出结果时再加一个空格。如果当前计数==Cb-1 就输出结果并换行即可。**

```cpp
#include <iostream>
#include <cstdio>
#include <cstring>
using namespace std;

int main()
{
   int i,j,k,ra,ca,rb,cb,sum;
   cin>>ra>>ca;
   int a[ra][ca];
   for(i=0;i<ra;i++)
  {
       for(j=0;j<ca;j++)
           cin>>a[i][j];
  }
   cin>>rb>>cb;
   int b[rb][cb];
   for(i=0;i<rb;i++)
  {
       for(j=0;j<cb;j++)
           cin>>b[i][j];
  }
   if(ca!=rb) printf("Error: %d != %d",ca,rb);
   else
  {
       cout<<ra<<" "<<cb<<endl;
       for(i=0;i<ra;i++)
      {
           for(j=0;j<cb;j++)
          {
                int sum=0;
                for(k=0;k<rb;k++)
                   sum+=a[i][k]*b[k][j];
               if(j==cb-1) cout<<sum<<endl;
               else  cout<<sum<<" ";
          }
      }    
  }
   return 0;
}
```

**2、倒置矩阵**

***L1-054 福到了***

**读入字符和网格规模，输出倒置的网格，如样例所示。但是，如果这个字正过来倒过去是一样的，就先输出bu yong dao le，然后再用输入指定的字符将其输出。**

**思路：**

**看到这题想法是应该用一个二维数组/字符串数组来存储这个网格。然后创建一个同样大小的网格把原始网格倒置存储。但是怎么判断这是一个不用倒了的网格呢？是判断每个有字符的地方都处于它对应的位置吗？****比如在原始NN网格中一个元素位置是a[i](http://blog.pinellia.uk/2025/02/ptal115.html#)，那么倒置之后它的位置在a[n-i-1](http://blog.pinellia.uk/2025/02/ptal115.html#)，**注意用给定字符替代。

**但是，或许我们根本不需要再额外花费空间来存储倒后的元素，可以直接输出呢？**

**实现：**

**注意：**读入字符和规模N之后要getchar();（上文L1-078中已说过类似问题）再接着进行网格内容输入。可以用字符串数组来输入，一行就是getline(cin,s[i]);

**因为如果不用倒了，就说明这个网格是对称的，那它倒过来的时候元素对应位置一定是有字符的。一旦发现倒置后位置没有字符，就用置标志位flag为1（初始化为0），然后break跳出循环。根据flag的值判断是否需要输出“不用倒了”。**

**在输出的时候，通过判断它（要输出的网格）倒置的位置（也就是原来的网格规模）是否有元素决定输出的地方是输出空格还是指定字符，注意到达每行尾部时换行。**

```cpp
#include <iostream>
#include <cstdio>
#define N 1000
using namespace std;

int main()
{
   char c;
   int n,i,j;
   int flag=0;
   cin>>c>>n;
   getchar();
   string s[N];
   char m[n][n];
   for(i=0;i<n;i++)
  {
       getline(cin,s[i]);
  }
   for(i=0;i<n;i++)
  {
       for(j=0;j<n;j++)
      {
           if(s[i][j]!=s[n-i-1][n-j-1])
              {
                 flag=1;
                 break;
              }
      }
  }
   if(!flag) cout<<"bu yong dao le"<<endl;
   for(i=0;i<n;i++)
  {
       for(j=0;j<n;j++)
          {
               if(s[n-1-i][n-1-j]!='@')
                   cout<<" ";
               else cout<<c;
          }
       cout<<endl;
  }
   return 0;
}
```
