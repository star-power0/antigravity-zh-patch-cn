# Antigravity 中文界面补丁

这是一个用于 Antigravity 本地客户端的中文界面补丁。

它会在页面加载完成后注入脚本，把常见英文界面文案翻译为中文，优先解决界面可用性问题，而不是替代通用正文翻译器。

> 当前版本定位：**优先翻译 UI，不翻译用户与 AI 对话正文。**

## 当前版本

- 补丁版本：`v5.0.3`
- 已确认适配：Antigravity `2.0.11`
- 核心文件：
  - `patches/translate-inject.js`（翻译脚本核心）
  - `patches/translate-launcher.js` 与 `translate-launcher.vbs`（自动修补启动器）
  - `install.js` 与 `install.bat`（一键安装脚本）

## 功能

- 翻译固定英文 UI 文案
- 翻译页面中新增的固定 UI 文本节点
- 翻译 `placeholder`、`title`、`aria-label` 中的固定 UI 文案
- 轻量处理少量动态 UI 文案（如套餐名、预算百分比）
- 跳过 `translate="no"` 标记区域
- 不翻译用户消息正文
- 不翻译 AI 回复正文
- 采用混合翻译：本地静态字典/缓存 0 延迟，新词条自动在线翻译补漏
- 支持直连备用接口：网络受限时自动切换国内可用翻译接口 MyMemory
- 精准防误伤机制：首字母小写及 slug 结构（项目/文件路径）自动跳过翻译
- 隔离防护机制：仅在设置与弹窗区域中启用在线翻译，不污染主界面及聊天

## v5.0.3 更新重点

- **优化首字母小写过滤规则**：修复了长句因为超链接拆分导致后半句以小写字母开头、误触发首字母小写规则被跳过翻译的问题。现在只过滤“不包含空格”的纯小写标识符/文件名，含有空格的短语与长句允许正常在线翻译。
- **优化路径与命令过滤规则**：修复了当英文长句/短语中包含斜杠 `/`（例如 `/browser` 命令）时，会被路径过滤规则误判为系统路径而直接跳过翻译的问题。现在斜杠与反斜杠过滤规则仅在“不包含空格”的纯路径/端点下生效，使包含空格的长句文案能够正常进行在线翻译。
- **项目目录保护**：在设置侧边栏中增加了项目名称的 DOM 树边界识别，凡是位于“项目/Projects”下方的自定义项目文件夹名（如 `codexworkspace` 等）均会强制跳过翻译并保持英文原名，即使已被写入本地翻译缓存也会强制以原名渲染。
- **严格限制在线翻译和缓存范围**：去除了对普通弹出菜单、悬浮窗（如主页的 `+` 加号下拉菜单）的在线翻译支持，确保只有在 Class 或 ID 中包含 `settings` 或 `preferences` 的真实“设置界面”中才会调用 Google 翻译及读取 LocalStorage 缓存。主页面与其他非设置界面的 UI 元素仅允许通过静态字典 `UI_TEXT_MAP` 进行匹配汉化，彻底杜绝翻译缓存污染主界面和非设置区。
- **完善静态 UI 字典**：针对主页面的 `+` 加号下拉菜单，在本地静态字典中添加了 `Add Context` (添加上下文)、`Media` (媒体)、`Mentions` (提及)、`Actions` (行动)、`Browser` (浏览器) 的静态映射。

## v5.0.2 更新重点

- **清除 utils.js 重复注入事件**：修复启动器在重复安装时会往 `utils.js` 重复追加多个 `did-finish-load` 监听器导致多线程注入冲突的 bug，新增注入前自动正则清理旧监听器的机制。
- **修复大小写导致的字典匹配失效**：增加了对首字母大写的 `Gemini Models` 和 `Claude and GPT Models` 的字典映射，并加塞了启动时自动擦除旧错误翻译缓存的逻辑。

## v5.0.1 更新重点

- **模型配额及翻译偏误修正**：修正在线翻译中把“Model Quota”和“Gemini models”误翻译为“型号配额”和“双子座模特”的问题，增加精确的本地静态字典映射，翻译为“模型额度”与“Gemini 模型”。

## v5.0.0 更新重点

- **混合在线翻译与备用直连接口**：本地未命中时异步翻译。首选谷歌，并在失败时秒级自动切换至国内直连备用接口 MyMemory，全面防封防墙。
- **本地持久化缓存**：新汉化词条自动保存至 `localStorage`，下次加载直接秒开，0 网络延迟，不被限流。
- **isInsideSettings 隔离判定**：在线翻译仅作用于 Settings 菜单、命令面板、dialog、modal 等弹窗和遮罩区，保护主界面与聊天不被污染。
- **强大的首字母小写与 Slug 过滤**：以小写字母开头的串及连字符小写词（如 `elegant-darwin`、`src`、`main.js`）完全不翻译，彻底解决自定义项目名、变量、方法、路径被汉化的问题。
- **安全事务性打包与大小验证**：重构 `app.asar` 打包逻辑，使用 `temp-app.asar` 文件过渡，并严格加入“大于 1MB”的大小校验。即便失败也绝不会对用户原有的健康客户端程序包造成物理损坏。
- **force-patch.flag 强刷同步**：一键安装更新补丁时自动写入标识，令自愈启动器在下次启动时强制重新解包并压入最新汉化核心，修复脚本升级不同步的 bug。

## v4.0.0 更新重点

- 扩充顶部菜单、窗口菜单、项目菜单等固定 UI 文案映射
- 扩充账户、自定义、浏览器、应用、模型等设置页固定 UI 文案映射
- 新增 2 条轻量规则替换，用于处理动态套餐文案和动态预算百分比文案
- 将 DOM 变更翻译从“逐次即时处理”调整为“下一帧批量处理”，降低动态界面翻译延迟
- 增加父子节点去重逻辑，减少重复扫描同一子树带来的性能损耗
- 强化“必须修改程序真实启动后实际加载的资源”这一安装判断原则

## v3.0.1 更新重点

- 产品定位收缩为“中文界面补丁”，优先翻译 UI，不翻译对话正文
- 移除正文自动翻译与在线翻译请求逻辑，降低误翻译风险
- 继续强化 `app-extracted/dist` 与 `resources/app.asar` 两种安装形态说明
- 增加更明确的安装成功自检清单
- 新增独立排障文档 `docs/troubleshooting.md`
- 按类别整理 `UI_TEXT_MAP`，降低后续维护成本

## v3.0.0 更新重点

- 新增 `containsProtectedQuotedContent()` 函数，识别引号中的技术文本
- 反引号 `` `code` `` 包裹的内容自动跳过翻译
- 双引号/单引号中的技术内容（文件名、命令行、路径、URL、代码片段、标识符等）跳过翻译
- 12 条检测规则覆盖：文件名、CLI 命令、路径、URL、IP、代码片段、camelCase/snake_case 标识符、命令行 flag、技术缩写等

## 本项目不包含什么

本项目不包含 Antigravity 原应用代码、资源文件或二进制文件。

本项目只提供：

- 翻译注入脚本
- 手动安装说明
- 本地补丁使用说明

请不要把自己的 `app-extracted`、`dist`、安装包、二进制文件或原应用资源提交到本仓库。

## 安装方式

当前版本提供一键自动安装以及手动安装两种方式（强烈推荐一键自动安装，支持自动汉化自愈功能）。

### 方式一：一键自动安装（推荐）

1. 下载本仓库，双击运行仓库根目录下的 `install.bat`。
2. 脚本会自动复制核心文件至您的 Antigravity 安装目录，并在您的桌面上创建一个名为 **`Antigravity (汉化启动)`** 的快捷方式。
3. 以后只需双击桌面上的该快捷方式启动即可！若客户端自动更新导致汉化失效，启动器会在启动时自动完成修补。

### 方式二：手动安装

详细步骤见：

- [docs/manual-install.md](docs/manual-install.md)
- [docs/troubleshooting.md](docs/troubleshooting.md)

## 先看这个：5 条避坑清单

1. **不要只看“目录像不像说明”，要看改完是否真的生效。**
2. **不要把 `Antigravity.exe` 所在目录当成补丁文件落点。** 真正要改的是程序实际加载的资源。
3. **不要只复制 `translate-inject.js` 不改 `utils.js`。** 脚本本体和注入入口缺一不可。
4. **不要只解包不回包。** 如果你的版本实际吃 `app.asar`，改完临时解包目录还不够，必须重新打包回去。
5. **不要只关窗口就算重启。** 一定要彻底退出 Antigravity 进程后再重新打开。

## 路径说明

不要照抄作者本机路径。

文档中的路径只用于帮助你开始排查，**不是保证所有机器都生效的固定答案**。

你需要找到自己机器上 **真正被程序加载** 的资源位置。常见情况有两种：

### 情况 A：运行时解包目录
目标目录通常形如：

```text
app-extracted/dist
```

判断标准之一是里面存在：

```text
utils.js
```

有些安装形态下，这个候选目录里还可能看到：

```text
preload.js
constants.js
```

请在你自己的机器上寻找**实际被程序加载**的那一份 `app-extracted/dist`，不要把某个具体上级目录理解为固定答案。

### 情况 B：安装目录里的 `resources/app.asar`
有些安装形态下，程序实际加载的是安装目录中的：

```text
resources/app.asar
```

这时需要：

1. 先解包 `app.asar`
2. 在解包后的 `dist/` 中放入 `translate-inject.js`
3. 修改同目录 `utils.js` 加入注入逻辑
4. 再重新打包覆盖回 `app.asar`

### 如何判断哪种情况适合你
不要只凭“看起来像目标目录”就直接修改。

正确原则是：

- 先找包含 `utils.js` 的候选目录
- 再确认程序实际是不是吃这套资源
- **补丁必须打在程序真实启动后实际加载的那套文件上**
- **最终以“改完并重启后是否生效”为准**

如果你改了 `app-extracted/dist` 不生效，就应该继续排查 `resources/app.asar`。

## 安装成功自检清单

安装完成后，请至少检查以下几项：

1. 目标 `dist` 目录里同时存在：

```text
utils.js
translate-inject.js
```

2. `utils.js` 中能搜到：

```text
translate-inject.js
executeJavaScript
did-finish-load
```

3. 如果你走的是 `app.asar` 路线，确认修改后的内容已经**重新打包覆盖回**：

```text
resources/app.asar
```

4. 已经**完全退出并重新打开** Antigravity，而不是只关闭窗口。

5. 重启后，以下固定 UI 文案能看到中文，例如：

```text
New Conversation -> 新建对话
Settings -> 设置
Permissions -> 权限
Ask anything, @ to mention, / for actions -> 提出任何问题，@提及，/采取行动
```

如果以上检查都没问题但仍不生效，请继续看：

- [docs/troubleshooting.md](docs/troubleshooting.md)

## 更新后如何快速重装补丁

Antigravity 更新后，补丁可能因为以下文件被覆盖而失效：

- `utils.js`
- `resources/app.asar`

这时建议按最小流程重新操作：

1. 先判断当前版本更可能吃 `app-extracted/dist` 还是 `resources/app.asar`
2. 重新放置 `translate-inject.js`
3. 重新确认 `utils.js` 中仍有注入逻辑
4. 如果你走的是 `app.asar` 路线，重新打包覆盖回 `resources/app.asar`
5. 完全退出并重启 Antigravity

如果你不确定当前版本吃哪套资源，请先看：

- [docs/troubleshooting.md](docs/troubleshooting.md)

## 本机实测补充

至少有一种安装形态下，虽然存在某个形如：

```text
app-extracted/dist
```

的候选目录，但它**不是主生效路径**。

实测有效的是：

```text
C:\Users\<你的用户名>\AppData\Local\Programs\antigravity\resources\app.asar
```

也就是说：

- `Antigravity.exe` 是启动入口
- `resources/app.asar` 可能才是真正需要修改的主资源包

所以如果你按某个候选 `app-extracted/dist` 路径安装后不生效，不要立刻怀疑脚本本身有问题，先排查当前版本是否实际吃 `app.asar`。

## 卸载

如果安装前备份了原文件，恢复备份即可。

详细卸载步骤见：

- [docs/manual-install.md#卸载--回滚](docs/manual-install.md#卸载--回滚)

## 风险说明

这是一个本地补丁工具，会修改你本机已安装应用的资源文件。

使用前请注意：

- 安装前务必备份原文件（`utils.js` 或 `app.asar`）
- Antigravity 更新后补丁可能失效
- 自动翻译仅针对固定 UI 文案，不保证覆盖所有界面文本
- 不保证适配所有版本或所有安装形态

## 版本记录

见 [CHANGELOG.md](CHANGELOG.md)。

## License

MIT License
