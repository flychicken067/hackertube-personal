# HackerTube 个人放映室

一个纯静态的个人视频放映室。它合并公开数据：HackerTube 导出的 Hacker News 推荐视频、Andrej Karpathy 官方 YouTube 频道的公开列表，以及他个人官网列出的 featured talks 与 podcasts。相同 YouTube ID 会自动去重，再根据当前浏览器里的观看、点赞、不喜欢和话题偏好生成多路推荐。

在线使用：[https://flychicken067.github.io/hackertube-personal/](https://flychicken067.github.io/hackertube-personal/)

没有账号、后端或远程个人数据。视频使用 `youtube-nocookie.com` 嵌入，本项目不托管视频文件。

核心功能包括：完整 HN 评论、共同推荐视频、语义话题搜索、Browse 筛选与排序、代表性中段缩略图切换、Liked / History / Watch later、本地导入导出，以及独立的 37 条 Karpathy 视频专区。

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

`e2e/smoke.spec.ts` 和 `e2e/parity.spec.ts` 会用桌面和手机尺寸确认首页、语义搜索、完整评论、关联推荐、不喜欢、缩略图切换、导入导出、Karpathy 专区、快捷键与响应式布局，并收集页面与控制台错误。

## 更新 HackerTube 数据

1. 从 [HackerTube 数据页](https://hackertube.org/data) 下载新的官方压缩包。
2. 解压到项目内的 `data/hackertube-export/hackertube-data/`。这个目录已被 Git 忽略，原始导出不会提交。
3. 重新验证导出并生成评论分桶、关联索引和搜索索引：

```bash
npm run data:import
npm run data:build
npm run check:data
```

如果数据放在其他地方：

```bash
HACKERTUBE_SOURCE_DIR="/你的路径/hackertube-data" npm run data:import
HACKERTUBE_SOURCE_DIR="/你的路径/hackertube-data" npm run data:build
```

## 补充 YouTube 元数据

HackerTube 导出不包含 YouTube 时长、发布日期、播放量、点赞量、是否删除和是否允许嵌入。这些字段用于 Browse 的日期、时长、冷门佳作与播放量排序。当前目录已用 YouTube Data API v3 为 6,454 条 HN 视频补齐元数据；以后更新公开导出时，可按下述流程刷新。

创建密钥只需下面几步（免费，不需要信用卡）：

1. 打开 [Google Cloud Console](https://console.cloud.google.com/) 并创建一个项目。
2. 在 **APIs & Services → Library** 启用 **YouTube Data API v3**。
3. 在 **Credentials → Create credentials → API key** 创建密钥；建议把 API restrictions 限制为 YouTube Data API v3。
4. 只在当前终端设置环境变量并运行：

```bash
export YOUTUBE_API_KEY="你的密钥"
npm run data:youtube
npm run data:build
npm run check
```

脚本每次最多请求 50 个 ID，6,454 条视频约需 130 次请求。原始响应缓存在被 Git 忽略的 `data/youtube-meta.jsonl`；中断或配额用尽后再次运行会跳过已有 ID，从断点继续。API 密钥只从环境变量读取，不会写入日志、代码或前端数据。Google 默认每天提供 10,000 配额单位，`videos.list` 每批消耗 1 单位。

如果已经有缓存，只想重新合并到现有目录，也可以运行：

```bash
npm run data:youtube:apply
```

## 更新 Karpathy 数据

Karpathy 的独立数据文件是 `public/data/karpathy.json`，来源是他的[官方频道公开视频页](https://www.youtube.com/@AndrejKarpathy/videos)和[个人官网 featured talks](https://karpathy.ai/)。当前快照包含 17 条官方频道视频和 20 条官网精选播客/演讲，共 37 条；其中 16 条已存在于 HackerTube 数据里。浏览器加载时按视频 ID 合并，最终总目录为 6,475 条。

更新时对照官方频道公开视频列表与个人官网 featured talks，修改标题、来源、时长、观看量显示和发布时间显示，然后运行：

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

当前正式站使用 GitHub Pages。推送到 `main` 分支后，`.github/workflows/deploy-pages.yml` 会自动安装依赖、运行检查、构建并发布；发布记录可在仓库的 Actions 页面查看。默认域名自带 HTTPS，不需要服务器和密钥。

## 数据来源与许可

数据来自 Hacker News 评论、[HackerTube](https://hackertube.org/) 公开导出、[Andrej Karpathy 官方 YouTube 频道](https://www.youtube.com/@AndrejKarpathy/videos)和他的[个人官网精选清单](https://karpathy.ai/)。HackerTube 导出使用 [ODC-By 1.0](https://opendatacommons.org/licenses/by/1-0/)，使用时应署名 HackerTube 和 [open-index/hacker-news](https://huggingface.co/datasets/open-index/hacker-news)。评论、视频标题、频道名和缩略图归各自作者或平台所有。

界面参考 HackerTube 当前公开页面的布局与交互，但组件、样式和代码均在本项目中重新实现，没有复制其前端源码。

本项目与 YouTube、Google、Hacker News 及 Y Combinator 没有隶属关系。
