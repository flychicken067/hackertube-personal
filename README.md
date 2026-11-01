# HackerTube 个人放映室

一个纯静态的个人视频放映室。它合并两份公开数据：HackerTube 导出的 Hacker News 推荐视频，以及 Andrej Karpathy 官方 YouTube 频道的公开列表。相同 YouTube ID 会自动去重，再根据当前浏览器里的观看、点赞和话题偏好排序。

没有账号、后端或远程个人数据。视频使用 `youtube-nocookie.com` 嵌入，本项目不托管视频文件。

## 本地启动

需要 Node.js 22 或更高版本。

```bash
cd "/Users/ivan/Documents/ChatGPT/炽光/hackertube-personal"
npm install
npm run dev
```

终端会显示一个本地地址，通常是 `http://localhost:5173/`。在浏览器打开即可。

## 自动检查

```bash
npm run check
```

这会检查：

- 数据文件可读，视频 ID 不重复，话题引用没有断裂。
- 推荐、搜索、本地存储、数据转换和图片回退的单元测试。
- TypeScript 类型检查和生产构建。

需要真实浏览器的页面检查（使用电脑已安装的 Chrome）：

```bash
npm run build
npm run e2e
```

`e2e/smoke.spec.ts` 会用桌面和手机尺寸确认首页能打开、数据能加载、搜索和快捷键可用、页面没有横向溢出，并收集页面与控制台错误。

## 更新 HackerTube 数据

1. 从 [HackerTube 数据页](https://hackertube.org/data) 下载新的官方压缩包。
2. 解压到项目相邻的 `../source-data/hackertube-data/hackertube-data/`。
3. 重新生成前端数据：

```bash
npm run data:build
npm run check:data
```

如果数据放在其他地方：

```bash
HACKERTUBE_SOURCE_DIR="/你的路径/hackertube-data" npm run data:build
```

## 可选：补充时长和播放状态

HackerTube 导出不包含 YouTube 时长、是否删除和是否允许嵌入。没有这些数据时，页面会显示“时长未知”并提供 YouTube 原链接。

如需补齐，先在 Google Cloud 启用 **YouTube Data API v3** 并创建只限该 API 的密钥，然后在当前终端运行：

```bash
export YOUTUBE_API_KEY="你的密钥"
npm run data:youtube
npm run data:build
```

密钥只从环境变量读取，不会写入代码或前端数据。请不要把密钥放进 `.env` 以外的可提交文件。

## 更新 Karpathy 数据

Karpathy 的独立数据文件是 `public/data/karpathy.json`，来源是他的[官方频道公开视频页](https://www.youtube.com/@AndrejKarpathy/videos)。当前快照包含 17 条公开视频，其中 6 条已存在于 HackerTube 数据里；浏览器加载时按视频 ID 合并，最终总目录为 6,465 条。

更新时只需对照官方频道公开视频列表，修改标题、时长、观看量显示和发布时间显示，然后运行：

```bash
npm run check:data
npm run check
```

不需要 YouTube 密钥，也不要爬取或绕过站点限制。

## 生产构建与部署

```bash
npm run build
```

可部署文件在 `dist/` 目录。这是纯静态站点，可直接放到 Cloudflare Pages、GitHub Pages、Netlify、Vercel 或普通 Nginx 上。路由使用 URL Hash，不需要配置服务器重写规则。

阶段 5 再根据“只在本机”还是“放到公网”选择具体部署方案。

## 数据来源与许可

数据来自 Hacker News 评论、[HackerTube](https://hackertube.org/) 公开导出和 [Andrej Karpathy 官方 YouTube 频道](https://www.youtube.com/@AndrejKarpathy/videos)。HackerTube 导出使用 [ODC-By 1.0](https://opendatacommons.org/licenses/by/1-0/)，使用时应署名 HackerTube 和 [open-index/hacker-news](https://huggingface.co/datasets/open-index/hacker-news)。评论、视频标题、频道名和缩略图归各自作者或平台所有。

界面参考 HackerTube 当前公开页面的布局与交互，但组件、样式和代码均在本项目中重新实现，没有复制其前端源码。

本项目与 YouTube、Google、Hacker News 及 Y Combinator 没有隶属关系。
