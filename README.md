# Antigravity 中文界面补丁

[![Release](https://img.shields.io/badge/Release-v6.0.0-blue.svg)](https://github.com/star-power0/antigravity-zh-patch-cn/releases)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20(x64)-lightgrey.svg)]()
[![Compatible](https://img.shields.io/badge/Antigravity-2.21.1%2B-orange.svg)]()

面向 Google Antigravity 智能体客户端的现代、纯净、无损的中文界面本地化补丁。

> **设计哲学**：只翻译应用界面与面板控件，严格沙箱隔离代码编辑器、终端控制台、命令执行与 AI 对话正文。绝不篡改用户项目名、工作区目录与系统环境变量。

---

## 🌟 v6.0.0 核心突破与特性

相较于早期社区方案，v6.0.0 带来了架构级的重大重构，彻底解决历史遗留痛点：

### 1. 纯原生内存流 ASAR 极速修补引擎
* **自主研发**：内置轻量级纯原生 Node.js ASAR 二进制流解析与重构引擎（[`lib/asar-patcher.js`](lib/asar-patcher.js)）。
* **毫秒级写入**：无需解包 1000+ 磁盘碎片文件，直接在内存 Buffer 中解析 ASAR Header，自动重算数据段偏移与 SHA256 校验块，**30 毫秒极速原地热修补**。
* **彻底告别文件锁死**：无需复杂的外部打包工具，彻底根治 Windows 下文件被占用无法覆盖的顽疾。

### 2. Preload 预加载原生热注入
* **原生架构集成**：抛弃旧版在 `utils.js` 监听 `did-finish-load` 延迟注入脚本的方式，改为直接植入 Electron 原生 `dist/preload.js`。
* **首屏零延迟**：随渲染器进程启动即刻执行，**首屏 0 延迟、0 英文白字闪烁**。

### 3. 744+ 词全量离线精校词库（100% 纯本地）
* **超高覆盖率**：全量精校词库扩充至 744+ 词条，完整覆盖菜单栏、设置全项（全局权限、计划审阅策略、安全预设、本地权限等）、模型配额、用量明细、版本对比、终端面板与侧边栏 `Automations`。
* **彻底铲除在线机翻**：**100% 纯本地离线运行，彻底剔除外部在线翻译 API（Google/MyMemory）**，0 网络请求。
* **零误伤保证**：严格限定界面 UI 元素，绝不将自定义工作区（如 `CodexWorkspace`）误翻为荒唐的「法典工作区」，绝不破坏 `Ubuntu` 等系统环境专有名词。

### 4. 独家 `formatQuotaDuration` 防截断排版算法
* **告别显示截断**：内置紧凑时间解析器，彻底根治官方额度面板倒计时因英文过长在窄窗口下被截断成 `wee...` 的排版顽疾。
* **动态状态自然汉化**：智能匹配思考时长（`Thinking for 2.5s`）、工作耗时、文件变更数、活动子智能体计数等动态 UI 模板。

### 5. 100% 绿色纯净 · 零杀毒软件误报
* **无任何可疑脚本**：彻底铲除旧版投放的 `.vbs` 外部启动器与常驻守护，直接启动官方主程序即为中文版。
* **拒绝流氓行为**：坚决杜绝任何开机自启、计划任务挂接或后台隐藏常驻进程，彻底杜绝卡巴斯基、火绒等杀毒软件的 PDM 启发式拦截。

### 6. 内置体检诊断与官方原版秒级还原
* **一键体检**：自带 `--doctor` 诊断体系，秒级输出客户端版本、ASAR 注入状态及备份健康报告。
* **官方原版秒级回滚**：自带 `--restore` 一键回退机制，随时随地一键还原 100% 官方原版未修改状态。

---

## 🚀 快速上手

### 运行要求
* 操作系统：Windows 10 / Windows 11 (x64)
* 客户端版本：Antigravity `2.21.1+`（向下兼容主流版本）
* 运行环境：[Node.js](https://nodejs.org/) (推荐 v18 及以上)

### 方式一：一键自动安装（推荐）

1. 下载或克隆本仓库到本地：
   ```bash
   git clone https://github.com/star-power0/antigravity-zh-patch-cn.git
   cd antigravity-zh-patch-cn
   ```
2. **双击运行 `install.bat`**（或在终端执行 `node install.js`）。
3. 安装器会在 **30 毫秒内** 自动备份官方原版并完成热注入。
4. 打开桌面上的 **`Antigravity (汉化版)`**（或重启运行中的客户端按 `Ctrl + R` 刷新），即可体验完整中文界面！

---

## 🛠️ 工具箱与快捷命令

本项目内置了完善的运维命令，可通过命令行或批处理运行：

| 快捷命令 | 说明 |
| :--- | :--- |
| `install.bat` 或 `node install.js` | **一键安装汉化补丁**（自动检测路径并完成注入） |
| `install.bat --doctor` 或 `node install.js --doctor` | **环境健康体检**（检测客户端版本、ASAR 大小及备份状态） |
| `install.bat --restore` 或 `node install.js --restore` | **一键秒级还原**（恢复官方原版未修改客户端） |

---

## 📁 目录结构说明

```text
antigravity-zh-patch/
├── docs/                       # 详细文档库
│   ├── manual-install.md       # 手动安装与高级操作说明
│   ├── troubleshooting.md      # 故障排查与常见问题解答
│   └── release-assets.md       # 发版资产与版本记录
├── lib/
│   ├── asar-patcher.js         # 纯原生 Node.js 内存流 ASAR 极速注入引擎
│   └── dictionary.json         # 744+ 词条全量精校离线词典源数据
├── patches/
│   └── translate-inject.js     # 注入至 Preload 的纯离线语言引擎与动态解析器
├── CHANGELOG.md                # 遵循 Keep a Changelog 规范的更新日志
├── install.bat                 # Windows 一键快速安装入口
├── install.js                  # 跨平台一键安装、诊断与还原核心脚本
├── LICENSE                     # MIT 开源许可证
└── README.md                   # 项目中文主文档
```

---

## ❓ 常见问题排查

遇到问题时，请优先运行 `install.bat --doctor` 进行环境自检：

1. **官方客户端自动升级后汉化失效了？**
   * Antigravity 官方静默升级时会重写 `app.asar`。只需再次双击运行 `install.bat`，30 毫秒即可重新打好汉化补丁。
2. **为什么我的工作区名字或代码没有被翻译？**
   * 本补丁仅翻译应用界面 UI，严格隔离用户项目名、工作区路径、代码内容与 AI 生成正文，确保智能体编码体验 100% 原汁原味。
3. **更多疑难解答**：请查阅 [`docs/troubleshooting.md`](docs/troubleshooting.md)。

---

## 📜 开源声明与协议

* 本项目基于 MIT 许可证开源，详情参见 [LICENSE](LICENSE)。
* 本项目衍生自开源项目 [`myzane678/antigravity-zh-patch`](https://github.com/myzane678/antigravity-zh-patch)（原作者：ROG），并经过架构重构与离线词库全面扩充升级。感谢开源社区前人的探索！
