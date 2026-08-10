# Antigravity 中文界面补丁

这是一个面向 Windows 的 Antigravity 中文界面补丁，为 Antigravity 客户端提供 UI 层面的中文化支持。

> 本项目只翻译应用界面，不翻译用户消息和 AI 对话正文。

## 项目来源与许可证

本项目基于开源项目 [myzane678/antigravity-zh-patch](https://github.com/myzane678/antigravity-zh-patch) 进行二次开发。

上游项目作者：`ROG`

本项目保留上游项目的 MIT License 和版权声明，并在此基础上维护当前版本的启动器、ASAR 处理、安装流程、故障排查和界面翻译逻辑。使用、转载或继续修改本项目时，请保留 `LICENSE` 文件及上游项目来源信息。

## 当前版本

- 版本：`v5.1.0`
- 适配版本：Antigravity `2.0.11`
- 平台：Windows
- 发布类型：公开开源版本

## 本次二次开发内容

相较于上游版本，本版本重点完成了以下改动：

- 修复启动器注入 `utils.js` 时误删 `return win;` 和函数闭合括号的问题，避免主进程出现 `SyntaxError: Unexpected end of input`。
- 增加纯 Node.js 实现的离线 ASAR 解包和打包工具，减少对 `npx` 和网络环境的依赖。
- 重新打包 `app.asar` 时保留 `chrome-devtools-mcp` 的 unpacked 目录，避免运行时依赖路径失效。
- 增加临时文件打包、文件大小校验和安全替换流程，失败时保留原始资源包。
- 增强启动器的自动修补和客户端更新后的自愈能力。
- 更新安装说明、手动安装流程、故障排查文档和变更日志。
- 优化 UI 静态词典、设置页在线翻译范围、项目名称保护和翻译缓存清理逻辑。

## 功能

- 翻译菜单、设置项、按钮和常用固定 UI 文案。
- 翻译 `placeholder`、`title` 和 `aria-label` 中的固定界面文案。
- 对套餐名、预算百分比等少量动态 UI 文案进行规则翻译。
- 使用本地静态词典优先匹配，未命中时在设置区域进行在线翻译补漏。
- 在线翻译优先使用 Google Translate，失败后切换 MyMemory 备用接口。
- 使用 LocalStorage 缓存已经成功翻译的设置项文案。
- 跳过 `translate="no"` 区域、项目名、文件名、路径、URL、代码标识符和用户聊天正文。

## 安装

### 一键安装（推荐）

1. 下载或克隆本仓库。
2. 双击根目录下的 `install.bat`。
3. 安装脚本会复制启动器和翻译脚本到 Antigravity 安装目录，并创建桌面快捷方式 `Antigravity (汉化启动)`。
4. 以后通过该快捷方式启动 Antigravity。

当 Antigravity 更新覆盖了 `resources/app.asar` 后，再次运行安装脚本或使用汉化启动器，启动器会自动重新应用补丁。

### 手动安装

详细步骤请参阅：

- [docs/manual-install.md](docs/manual-install.md)
- [docs/troubleshooting.md](docs/troubleshooting.md)

## 安全与回滚

启动器不会直接修改原始资源包，而是按以下流程处理：

1. 备份原始 `app.asar`。
2. 解包到临时目录。
3. 注入翻译脚本并修改 `utils.js`。
4. 将 `chrome-devtools-mcp` 保持为 unpacked 依赖。
5. 对临时 ASAR 执行大小校验。
6. 校验通过后再替换正式 `app.asar`。

如果需要恢复官方版本，可以使用安装目录中的 `resources/app.asar.bak` 覆盖 `resources/app.asar`，然后重新启动客户端。

## 已知限制

- Antigravity 更新后可能覆盖补丁，需要重新运行安装脚本。
- 在线翻译依赖网络连接；静态词典翻译不受网络影响。
- 不同 Antigravity 版本的内部文件结构可能变化，未确认适配的版本需要先备份再测试。
- 本项目不包含 Antigravity 官方程序、安装包、二进制文件或原应用资源。

## 目录结构

```text
patches/
  translate-inject.js       # 页面翻译脚本
  translate-launcher.js     # 自动修补与启动器
  translate-launcher.vbs    # Windows 启动入口
lib/
  asar.js                   # 离线 ASAR 解包/打包工具
install.js                  # 安装脚本
install.bat                 # Windows 一键安装入口
docs/
  manual-install.md         # 手动安装说明
  troubleshooting.md        # 故障排查
  release-assets.md         # 发布资源说明
```

## 免责声明

本项目仅用于本地界面定制和学习研究。请遵守 Antigravity 的相关使用条款，并自行承担修改客户端资源可能带来的风险。

## License

本项目采用 [MIT License](LICENSE)。
