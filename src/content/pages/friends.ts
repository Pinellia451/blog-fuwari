// 友链配置文件
export interface FriendLink {
  name: string;
  url: string;
  description: string;
  avatar: string;
}

export const friendsData: FriendLink[] = [
  {
    name: "HK's Blog",
    url: "http://blog.212676.xyz/",
    description: "城南旧事",
    avatar: "http://blog.212676.xyz/img/icon1.svg",
  },
  {
    name: "Pinellia's blog --google",
    url: "http://blog.pinellia.uk/",
    description: "碎碎念",
    avatar: "http://blog.pinellia.uk/favicon.ico",
  },
  {
    name: "AcoFork Blog",
    url: "https://2x.nz/",
    description: "二叉树树",
    avatar: "https://q2.qlogo.cn/headimg_dl?dst_uin=2726730791&spec=5",
  }

];
