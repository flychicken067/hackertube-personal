# HackerTube Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 在保留 Karpathy 专区和纯静态部署的同时，补齐 HackerTube 公开版的数据深度、推荐、搜索、视频详情和设置功能。

**Architecture:** 将 HackerTube 公开导出在构建期转换为适合 GitHub Pages 的紧凑静态索引。首页只加载目录和推荐所需数据，完整评论按 YouTube ID 分桶懒加载。个人化继续由 localStorage 完成，不增加服务端。

**Tech Stack:** React 19、TypeScript、Vite、Vitest、Testing Library、Playwright、GitHub Pages、HackerTube ODC-By 1.0 公开导出。

**Spec:** docs/specs/hackertube-parity.md

## Global Constraints

- 不复制 hackertube.org 的源码、CSS 或文案。
- 不爬取；只读取公开数据导出和官方 YouTube Data API。
- 密钥只通过 YOUTUBE_API_KEY 环境变量提供。
- 保留 GitHub Pages、HashRouter 和 Karpathy 数据源。
- 每项行为先看见失败测试，再做最小实现。
- 生成数据必须验证计数、重复、缺失字段和引用完整性。

## Review Focus

- 损坏的导入状态不得覆盖有效 localStorage；由 Task 5 测试。
- YouTube ID 含连字符和下划线时评论分桶必须路径安全；由 Task 2 测试。
- 评论分桶缺失时视频仍能播放并显示友好提示；由 Task 3 测试。
- 关联索引含无效视频 ID 时必须忽略；由 Task 4 测试。
- YouTube API 配额用尽时必须保留缓存进度；由 Task 8 测试。

---

### Task 1: 公开导出入库和清单验证

**Files:**
- Modify: .gitignore
- Create: scripts/import-hackertube-export.ts
- Create: scripts/import-hackertube-export.test.ts
- Create: public/data/parity-manifest.json
- Modify: scripts/check-data.ts
- Modify: scripts/check-data.test.ts

**Interfaces:**
- Consumes: videos.jsonl, mentions.jsonl, related.jsonl, taxonomy.json, embedding_ids.json。
- Produces: importHackertubeExport(inputDir, outputDir) 和后续任务所需静态索引。

- [ ] 写失败测试：正确计数、损坏 JSONL、重复 ID、无效引用。
- [ ] 运行目标测试，确认因导入器缺失而失败。
- [ ] 实现流式 JSONL 读取、计数和 manifest；忽略原始 zip 与解压目录。
- [ ] 运行目标测试和 npm run check:data。
- [ ] 提交 feat: import HackerTube parity data。

### Task 2: 评论分桶和懒加载

**Files:**
- Create: src/lib/comments.ts
- Create: src/lib/comments.test.ts
- Create: public/data/comments 分桶文件
- Modify: src/lib/types.ts
- Modify: scripts/import-hackertube-export.ts

**Interfaces:**
- Consumes: Task 1 的 mentions 记录。
- Produces: commentBucket(vid), loadVideoComments(vid)。

- [ ] 写失败测试：普通 ID、连字符和下划线 ID、空记录、缺失分桶。
- [ ] 运行测试并确认接口缺失。
- [ ] 按 ID 首字符生成最多 64 个 URL-safe 分桶，视频页访问时才 fetch。
- [ ] 验证 39,834 条评论全部可达。
- [ ] 提交 feat: add lazy HN comment shards。

### Task 3: 完整 HN 评论视频页

**Files:**
- Create: src/components/HnComments.tsx
- Create: src/components/HnComments.test.tsx
- Modify: src/pages/VideoPage.tsx
- Modify: src/styles.css

**Interfaces:**
- Consumes: Task 2 的 loadVideoComments。
- Produces: HnComments 组件。

- [ ] 写失败测试：加载、全部评论、立场、故事标题、HN 链接、空列表和加载失败。
- [ ] 确认测试因组件缺失而失败。
- [ ] 实现评论列表并保留摘要卡。
- [ ] 运行组件、App 和完整测试。
- [ ] 提交 feat: show all Hacker News comments。

### Task 4: 关联推荐和多路首页

**Files:**
- Create: src/lib/related.ts
- Create: src/lib/related.test.ts
- Create: src/lib/feed.ts
- Create: src/lib/feed.test.ts
- Create: src/lib/browse.ts
- Create: src/lib/browse.test.ts
- Create: src/components/RecommendationReason.tsx
- Create: src/pages/BrowsePage.tsx
- Modify: src/App.tsx
- Modify: src/lib/recommendation.ts
- Modify: src/pages/HomePage.tsx
- Modify: src/pages/VideoPage.tsx
- Modify: src/components/VideoCard.tsx

**Interfaces:**
- Consumes: Task 1 的 related 索引和 LibraryState。
- Produces: getRelatedVideos、buildHomeFeed 和 filterAndSortVideos。

- [ ] 写失败测试：关联排名、无效 ID、点赞相似、共同推荐、经典、冷门、近期、未探索、每日稳定，以及年代、类型、时长、特征和六种排序方式。
- [ ] 确认当前单一分数排序无法满足测试。
- [ ] 实现去重多路 feed，每项携带可见推荐理由；新增查询参数驱动的 BrowsePage，对齐原版公开筛选器。
- [ ] 视频页增加“HN 用户也推荐”，首页卡片增加理由。
- [ ] 运行推荐测试和完整检查，提交 feat: match HackerTube recommendation mix。

### Task 5: 本地反馈模型和状态迁移

**Files:**
- Modify: src/lib/types.ts
- Modify: src/lib/storage.ts
- Modify: src/lib/storage.test.ts
- Modify: src/lib/LibraryContext.tsx
- Modify: src/pages/VideoPage.tsx
- Modify: src/pages/SettingsPage.tsx

**Interfaces:**
- Consumes: 现有 v1 localStorage。
- Produces: 向后兼容的 v2 LibraryState，含 dislikes 和 useVideoFrames。

- [ ] 写失败测试：v1 到 v2、点赞与不喜欢互斥、损坏导入保护、导出完整性。
- [ ] 确认测试因 v2 字段与迁移缺失而失败。
- [ ] 实现迁移、不喜欢操作和缩略图偏好。
- [ ] 运行存储、组件和完整测试。
- [ ] 提交 feat: add dislikes and thumbnail preference。

### Task 6: 中段帧和默认缩略图切换

**Files:**
- Modify: src/components/Thumbnail.tsx
- Modify: src/components/Thumbnail.test.tsx
- Modify: src/components/VideoCard.tsx
- Modify: src/pages/SettingsPage.tsx

**Interfaces:**
- Consumes: Task 5 的 useVideoFrames。
- Produces: Thumbnail mode 参数。

- [ ] 写失败测试：frame、upload 和图片失败回退。
- [ ] 确认现有组件不接受 mode 而失败。
- [ ] 实现切换和设置说明。
- [ ] 运行缩略图与完整测试，提交 feat: toggle representative video frames。

### Task 7: 语义话题搜索

**Files:**
- Create: src/lib/searchIndex.ts
- Create: src/lib/searchIndex.test.ts
- Modify: src/lib/search.ts
- Modify: src/lib/search.test.ts
- Modify: src/pages/SearchPage.tsx
- Modify: scripts/import-hackertube-export.ts

**Interfaces:**
- Consumes: taxonomy 描述、summary、why、tags、categories。
- Produces: 带命中原因的加权 searchVideos。

- [ ] 写失败测试：标题不含查询原词的同义话题、多词权重和空查询。
- [ ] 确认当前 substring 搜索失败。
- [ ] 实现 taxonomy 扩展、字段权重和相似度排序。
- [ ] 添加 Playwright 主题查询回归并运行完整检查。
- [ ] 提交 feat: add semantic topic search。

### Task 8: YouTube 元数据管线

**Files:**
- Modify: scripts/fetch-youtube-meta.ts
- Modify: scripts/fetch-youtube-meta.test.ts
- Create: scripts/apply-youtube-meta.ts
- Create: scripts/apply-youtube-meta.test.ts
- Modify: scripts/build-catalog.ts
- Modify: README.md

**Interfaces:**
- Consumes: YOUTUBE_API_KEY、视频 ID、已有缓存。
- Produces: 可断点续跑的 metadata JSON 和合并后的 duration、views、published 字段。

- [ ] 写失败测试：50 ID 分批、缓存跳过、配额错误保留进度、无密钥提示、元数据合并。
- [ ] 确认当前脚本不满足断点和合并契约。
- [ ] 实现安全、可重跑的 API 流程，日志不输出密钥。
- [ ] 无密钥时完成代码后再向用户给出最短创建步骤；获得密钥后更新全部视频。
- [ ] 运行脚本和完整测试，提交 feat: enrich videos with YouTube metadata。

### Task 9: 端到端一致性验收和文档

**Files:**
- Modify: e2e/smoke.spec.ts
- Create: e2e/parity.spec.ts
- Modify: README.md
- Modify: HUMAN-UI-EVAL.md

- [ ] 写失败 E2E：多路首页、同义搜索、完整评论、关联视频、不喜欢、缩略图开关、导入导出、Karpathy。
- [ ] 逐项修正到测试通过。
- [ ] 运行 npm run check 和 npm run e2e，并检查桌面与手机宽度。
- [ ] 更新许可、数据更新、API 密钥和部署文档。
- [ ] 提交 test: verify HackerTube feature parity。

### Task 10: 上线和线上逐项确认

**Files:**
- Modify only if needed: .github/workflows/deploy-pages.yml

- [ ] 运行 npm run check、npm run e2e 和 git diff --check。
- [ ] 推送 main 并等待 GitHub Pages 成功。
- [ ] 在线检查规格 10 项、控制台、断图和手机布局。
- [ ] 确认本地 HEAD、远端 main 与部署 SHA 一致。
- [ ] 汇报一致项和本项目特有扩展，完成持续目标。
