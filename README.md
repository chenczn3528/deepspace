# 💫 恋与深空抽卡模拟器

> 一个基于 **React + Vite** 的非官方《恋与深空》抽卡模拟器，复刻真实抽卡体验，支持动画演出、概率实验、素材缓存与离线播放。  
> 所有数据均来自公开的 [恋与深空 WIKI](https://wiki.biligame.com/lysk/%E9%A6%96%E9%A1%B5)，素材版权归叠纸游戏所有。


## 更新日志

#### 2026-02-01
1. 新增workflow手动更新
2. 修改视频网址和对应逻辑
3. 修复选择卡池后无法勾选大小保底的错误

#### 2026-01-09
1. 修改歌曲爬虫逻辑，从bs4改为网易云官方API
2. 修改歌曲界面布局
3. 增加网页更新策略，用户访问网站总是获取最新数据

#### 2025-12-24
1. 重写 `update_cards.py` 的卡池汇总生成逻辑，修改卡池筛选页面的显示逻辑，并增加选中卡名的显示
2. 在抽卡记录页面增加筛选功能


## 🚀 在线体验

- [🔗 抽卡模拟器](https://chenczn3528.github.io/deepspace/)
- 备用域名：[https://deepspace.chenczn3528.dpdns.org/](https://deepspace.chenczn3528.dpdns.org/)


## ✨ 项目特色

### 🎴 抽卡系统
- 复刻官方抽卡逻辑：支持大小保底、角色定向、三星可选与历史记录。  
- 动态抽卡演出：原声原画、出金动画、视频与音效完整还原。  
- 抽卡记录存档：可查看过往结果与星级分布，支持稀有度筛选。  

### 🧠 概率模拟
- 模拟上百次抽卡统计出金率。  
- 分析保底触发情况与星级概率波动。  

### 🖼️ 图鉴系统
- 自动从 WIKI 获取完整思念卡数据。  
- 支持按照角色、稀有度、星谱、位置等条件筛选。  
- 拥有/未拥有状态区分与高清图全屏查看。  

### 🎧 音乐与素材缓存
- 集成网易云音乐歌单，可切换背景音乐。  
- IndexedDB + Service Worker 实现视频等素材缓存。  
- 支持断点续传、缓存统计、手动清理。  
- 弱网下仍能流畅播放动画与音效。  



## 🧰 技术栈

| 模块 | 技术 |
|------|------|
| 前端框架 | React 19 + Vite 6 |
| 样式系统 | Tailwind CSS 4 |
| 状态与路由 | React Router 6 |
| 数据存储 | IndexedDB（idb-keyval）、LocalStorage |
| PWA | 自定义 Service Worker（素材缓存） |
| 爬虫与脚本 | Python 3、Requests、BeautifulSoup4、mwclient、Selenium |



## ⚙️ 快速开始

### 1️⃣ 环境准备
- Node.js ≥ 18  
- Python ≥ 3.9  

```bash
npm install
````

### 2️⃣ 本地开发

```bash
npm run dev
```

在浏览器访问终端输出的本地地址（默认：[http://localhost:5173）](http://localhost:5173）)

### 3️⃣ 构建与预览

```bash
npm run build
npm run preview
```

构建产物位于 `dist/`，默认 `homepage` 为 `/deepspace/`（适配 GitHub Pages 部署）。

### 4️⃣ 代码检查

```bash
npm run lint
```



## 🧾 数据与素材维护

| 功能     | 脚本                           | 说明                                                      |
| ------ | ---------------------------- | ------------------------------------------------------- |
| 更新卡牌数据 | `python src/update_cards.py` | 从恋与深空 WIKI 抓取卡片名称、星级、图片与视频链接，写入 `src/assets/cards.json` |
| 更新歌曲列表 | `python src/update_songs.py` | 通过 Selenium 获取网易云歌单并写入 `src/assets/songs.json`          |
| 扫描素材体积 | `python src/scan_assets.py`  | 扫描音视频资源并生成配置文件，用于素材缓存工具                                 |

> 💡 所有依赖列于 `requirements.txt`，运行脚本前执行：
>
> ```bash
> pip install -r requirements.txt
> ```
>
> 使用 `update_songs.py` 时需确保系统可启动 Chrome/Chromium。



## 🔒 离线缓存机制（PWA）

* 首次访问时需手动缓存抽卡动画、音效、背景等资源。
* 设置面板中的「素材缓存」入口提供断点续传与完整性校验。
* 若部署到非 `/deepspace/` 路径，请同步修改 `public/service_worker.js` 中的缓存列表。



## 🌐 浏览器兼容性

| 浏览器           | 状态      | 说明           |
| ------------- | ------- | ------------ |
| Chrome | ✅ 推荐    | 音视频加载完整 |
| Edge | ✅ 推荐    | 音视频加载完整 |
| Safari | ✅ 推荐    | 音视频加载完整 |
| QQ 浏览器 | ✅ 推荐    | 音视频加载完整 |
| 小米浏览器 | ✅ 推荐    | 音视频加载完整 |
| 夸克 / UC | ❌ 不推荐   | 强制播放模式 |



## 📚 数据与版权说明

| 类型             | 来源                                                             | 许可                                                                                |
| -------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 卡牌数据与图像        | [恋与深空 WIKI](https://wiki.biligame.com/lysk/%E9%A6%96%E9%A1%B5) | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans) |
| 官方素材（图像、视频、音效） | [恋与深空官网](https://deepspace.papegames.com/home)                 | 版权所有 © 叠纸游戏                                                                       |

> 本项目仅用于 **学习与非商业展示**。
> 
> 所有权利归原作者及游戏开发商所有。
> 
> 请在转载或修改时注明来源：
> 
> **恋与深空 WIKI · 恋与深空抽卡模拟器**


## 👥 贡献

欢迎通过 **Issue** 或 **Pull Request** 提交改进意见、Bug 反馈与功能提案！


## ⚖️ 协议与声明

本项目为 **玩家自制的非商业实验项目**，与叠纸游戏、Bilibili 无任何隶属关系。
素材与数据引用遵循 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 协议。
请勿用于商业目的。

> **署名示例：**
> 数据来源：恋与深空 WIKI（CC BY-NC-SA 4.0）
> 
> 素材版权：© 叠纸游戏
> 
> 本项目：恋与深空抽卡模拟器 by chenczn3528
