项目文档：Silent Reader (v0.3.0)

版本号: v0.3.0

日期: 2023-10-27

状态: 开发预览版 (Alpha)

第一部分：产品需求文档 (PRD)

1. 产品概述

Silent Reader 是一个专注于沉浸式体验的 Web 端交互式漫画阅读平台。与传统条漫或翻页阅读器不同，本项目通过 Web 技术模拟真实的纸张物理翻页效果，并结合动态环境氛围（迷雾、音效），为读者提供独特的“视听读”一体化体验。
v0.3.0 版本标志着产品从“单一漫画展示页”向“漫画阅读平台”架构的转型，支持多部漫画管理及用户本地内容预览。

2. 用户画像

读者: 追求高质量阅读体验，喜欢恐怖/悬疑/氛围感强的视觉小说或漫画用户。

创作者 (UGC): 希望在发布前预览自己作品在沉浸式环境中的效果的漫画作者。

3. 功能架构 (v0.3.0)

3.1 核心模块

系统分为四个主要视图（View）：

Library (书架/首页)

Cover (封面/前言)

Reader (沉浸式阅读器)

Creator (创作中心)

3.2 详细功能需求

模块

功能点

详细描述

优先级

书架

漫画列表展示

以卡片形式展示所有可用漫画的封面、标题、副标题。卡片具备 3D 悬浮微动效。

P0

书架

新增入口

提供显眼的“Upload New Comic”卡片，点击跳转至创作中心。

P0

创作中心

表单配置

支持输入主标题、副标题。

P0

创作中心

图片上传

支持批量选择本地图片文件。支持上传后的图片预览（缩略图）。

P0

创作中心

预览生成

将本地图片转换为临时 Blob URL，生成新的漫画卡片存入书架（非持久化存储）。

P0

封面

详情展示

展示选中漫画的高清标题、副标题。背景应用动态迷雾效果。

P1

封面

返回书架

提供左上角返回按钮，回到 Library 视图。

P1

阅读器

3D 拟真翻页

核心功能。模拟纸张厚度、阴影、惯性翻转。支持左翻（下一页）和右翻（上一页）。

P0

阅读器

交互控制

支持多种交互方式：



1. 触摸/鼠标拖拽 (Swipe)：模拟真实滑动手势。



2. 键盘：方向键/空格键翻页。

P0

阅读器

氛围系统

全局 BGM 播放/暂停控制（默认静音或小音量，需交互激活）。屏幕覆盖动态 CSS 迷雾层。

P1

阅读器

进度管理

底部胶囊式进度条，指示当前页码位置。

P1

阅读器

图片下载

右上角提供下载按钮，支持将当前浏览的单页图片保存到本地。

P2

阅读器

新手引导

首次进入阅读器显示“滑动”手势动画引导，操作一次后消失。

P2

阅读器

重读功能

翻至封底后，提供“Replay”按钮一键回到第一页。

P2

4. 非功能需求

响应式设计: 必须同时适配移动端（竖屏单手操作）和桌面端（宽屏展示）。

性能: 翻页动画需保持 60fps 流畅度，避免卡顿。

视觉风格: 保持“寂静岭”式的暗黑、迷雾、极简 UI 风格 (Tailwind Neutral/Black 色系)。

第二部分：技术开发文档

1. 技术栈

核心框架: React 18+ (Functional Components, Hooks)

构建工具: Vite (推荐) 或 CRA

样式库: Tailwind CSS (原子化 CSS, 负责布局、响应式、特效)

图标库: lucide-react (轻量级 SVG 图标)

部署环境: 静态托管 (Vercel / Netlify / Cloudflare Pages)

2. 数据结构设计

2.1 Comic 对象

在 v0.3.0 中，数据存储在内存中（React State），尚未接入后端数据库。

interface Comic {
  id: string;           // 唯一标识符 (默认: 'default-silenthill', 新增: timestamp)
  title: string;        // 主标题
  subtitle: string;     // 副标题
  images: string[];     // 图片地址数组 (URL string 或 Blob URL)
  bgm: string;          // 背景音乐地址
}


2.2 View 状态枚举

应用主要通过 view 状态控制页面路由：
type ViewState = 'library' | 'create' | 'cover' | 'read';

3. 核心算法与逻辑实现

3.1 3D 翻页逻辑 (CSS Transform)

这是项目的核心体验，通过计算每一页的 zIndex 和 transform 属性实现。

状态: currentPage (当前页索引 0 ~ N)

渲染逻辑: 遍历 images 数组渲染所有页面。

翻转判定: const isFlipped = index < currentPage;

Z-Index 堆叠算法:

未翻页 (右侧堆叠): zIndex = total - index (底层页码大，在下)

已翻页 (左侧堆叠): zIndex = index (新翻过去的页码大，在上)

CSS 变换:

rotateY: 未翻页 0deg, 已翻页 -180deg。

translateZ: 为防止 Z-fighting 并模拟厚度，根据索引乘以系数 (e.g., 0.5px) 进行微调。

贝塞尔曲线: cubic-bezier(0.645, 0.045, 0.355, 1.000) 模拟纸张重量感。

3.2 手势识别 (Swipe/Drag)

为了统一移动端和 PC 端的体验，实现了一套通用的拖拽逻辑：

Start: 记录 startX (Touch 或 MouseDown)。设置 isDragging = true。

Move: 更新 currentX。

End:

计算 distance = startX - currentX。

设置阈值 minSwipeDistance = 50px。

判定:

distance > 50: 手指左滑 (Next Page)。

distance < -50: 手指右滑 (Prev Page)。

重置状态。

3.3 本地图片预览 (Blob URL)

在 Creator 视图中，不实际上传文件到服务器，而是生成浏览器本地链接：

const handleFileChange = (e) => {
  const files = Array.from(e.target.files);
  // 生成生命周期仅限于当前页面会话的 URL
  const previews = files.map(file => URL.createObjectURL(file));
  setPreviews(previews);
};


注意: 页面刷新后，blob: 链接会失效，数据会丢失（v0.3.0 特性）。

4. 组件结构图

App (Main Container)
├── State: view, library, activeComic, currentPage
│
├── FogLayer (Component)
│   └── 全局背景迷雾动画 (CSS Keyframes)
│
├── [View: Library]
│   ├── Header
│   └── Grid List
│       ├── "Upload New" Card
│       └── Comic Card (3D Hover Effect)
│
├── [View: Creator]
│   └── CreateComicForm (Component)
│       ├── Input: Title/Subtitle
│       ├── Input: File (Multiple)
│       └── Preview Area
│
├── [View: Cover]
│   ├── Back Button
│   ├── Title/Subtitle Display
│   └── "ENTER" Button
│
└── [View: Reader]
    ├── TopBar (Back, Title, Download, Audio Toggle)
    ├── Tutorial Overlay (Hand Animation)
    ├── 3D Book Container
    │   └── Page Items (Front/Back Faces)
    └── Bottom Progress Bar


5. 样式系统 (Tailwind)

主要使用了以下高级特性：

Perspective: perspective-camera, perspective-1000 用于构建 3D 空间。

Transform Style: preserve-3d 确保子元素保留 3D 属性。

Backface Visibility: hidden 用于处理纸张的正反面显示。

Glassmorphism: backdrop-blur, bg-white/5 用于现代化 UI 组件。

Blend Modes: mix-blend-screen, mix-blend-overlay 用于迷雾和纹理融合。

6. 后续规划 (v0.4.0+)

持久化存储: 接入 Firebase 或 Supabase，实现漫画数据的云端存储。

多章节支持: 漫画数据结构升级，支持 Chapter 列表。

性能优化: 实现图片的懒加载 (Lazy Loading)，避免一次性加载过多大图。

移动端优化: 增加双指缩放 (Pinch to Zoom) 功能支持查看细节。