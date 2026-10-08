# 手动安装说明

本文面向有定制需求或希望手动操作的高级用户，介绍如何手动安装 Antigravity 中文界面补丁。

> **强烈建议**：除非有特殊调试需求，请优先使用根目录下的 `install.bat` 或 `node install.js`。内置的纯内存流引擎仅需 30ms 即可完成操作，且自带完整安全备份与回滚机制。

---

## 适配版本

* **补丁版本**：`v6.0.0`
* **适用客户端**：Antigravity `2.21.1+`（兼容 2.0.11 ~ 2.21.1+ 各主流版本）
* **定位**：**优先翻译 UI，严格沙箱隔离代码、终端与 AI 对话正文。**

---

## 核心运行原理

本补丁采用 **Electron Preload 原生预加载热注入** 方案：

```text
resources/app.asar
└── dist/
    └── preload.js  <--- 补丁直接追加至 preload.js 末尾，伴随渲染进程初始化即时执行
```

与旧版在 `utils.js` 监听 `did-finish-load` 延迟注入的方式相比：
1. **零延迟**：页面渲染伊始即已完成词条映射，彻底杜绝首屏英文闪烁；
2. **纯离线**：依赖内嵌的 744+ 离线词库与动态模板引擎，完全不发起任何外部网络请求；
3. **绿色纯净**：无需外部 `.vbs` 或 `.js` 启动器中转，直接启动 `Antigravity.exe` 即可生效。

---

## 手动安装步骤

### 方案 A：使用内置命令行工具（推荐手动方式）

无需打开图形批处理，直接调用 `install.js`：

1. **执行安装注入**：
   ```bash
   node install.js
   ```
2. **运行环境诊断（Doctor）**：
   ```bash
   node install.js --doctor
   ```
3. **一键还原官方原版**：
   ```bash
   node install.js --restore
   ```

---

### 方案 B：纯手动解包注入（传统方式）

如果你希望自行审查或修改注入代码：

1. **定位并备份核心文件**：
   找到 Antigravity 安装目录中的 `app.asar`（通常位于 `%LOCALAPPDATA%\Programs\antigravity\resources\app.asar`），先复制一份为 `app.asar.bak`。
2. **解包 ASAR 文件**：
   ```bash
   npx @electron/asar extract app.asar app-extracted
   ```
3. **注入补丁代码**：
   将本仓库 `patches/translate-inject.js` 中的完整内容，复制并追加到 `app-extracted/dist/preload.js` 文件的最末尾。
4. **重新打包封包**：
   ```bash
   npx @electron/asar pack app-extracted app.asar
   ```
5. **替换生效**：
   将新打包的 `app.asar` 覆盖回 `resources/app.asar`。
6. **重启验证**：
   彻底退出 Antigravity 进程并重新启动客户端，或在客户端界面中按 `Ctrl + R` 强制刷新。
