# 更新日志

## [6.0.0] - 2026-10-08

### Added
- **纯原生内存流 ASAR 极速修补引擎**（`lib/asar-patcher.js`）：无需解压 1000+ 文件，直接在内存 Buffer 中解析 ASAR Header，自动重算偏移与校验和，30ms 毫秒级写入，彻底杜绝 Windows 文件占用与磁盘碎文件。
- **Preload 预加载原生热注入**：注入目标转为 Electron 原生的 `dist/preload.js`，随渲染进程启动即行执行，首屏 0 延迟、0 英文闪烁。
- **744+ 海量静态精校离线词典**（`lib/dictionary.json` 与内嵌模块）：覆盖菜单栏、设置全项（全局权限、计划审阅策略、安全预设、本地权限等）、模型配额、用量明细、版本对比、终端面板与侧边栏 `Automations`。
- **彻底根治机翻与专有名词误伤**：以官方原版 `app.asar.bak` 为纯净底包，彻底剔除旧版残留的 `utils.js` 钩子及 Google 翻译接口，彻底消除将 `CodexWorkspace` 机翻为「法典工作区」、将 `Ubuntu` 机翻等失控现象。
- **`formatQuotaDuration` 紧凑时间算法**：彻底修复官方个人用量/额度刷新倒计时在窄屏幕下被截断成 `wee...` 的排版顽疾。
- **动态计时与状态计数实时汉化**：支持思考时长（`Thinking for 2.5s`）、工作耗时、文件变更数、子智能体数量等多类动态 UI 模板。
- **环境诊断与体检系统**（`install.js --doctor` / `install.bat -doctor`）：快速输出操作系统、Node 环境、客户端版本、ASAR 注入状态及备份健康报告。
- **官方原版一键回滚**（`install.js --restore` / `install.bat -restore`）：快速安全恢复官方未修改二进制。

### Changed
- 重构 `install.js` 与 `install.bat`，全面优化为绿色便携安装体系，一键无损极速写入。
- 升级 DOM TreeWalker 与 MutationObserver 引擎，支持 Shadow DOM 动态穿透与 `requestIdleCallback` 状态回弹微扫。

### Removed
- **彻底移除外部在线翻译 API 依赖**（Google/MyMemory），消除因网络延迟或服务波动导致的界面白字与闪烁，达成 100% 纯离线中文化。
- **彻底移除旧版脆弱的启动器文件依赖**（`translate-launcher.js` / `translate-launcher.vbs`），不再向安装目录投放易被清理的外部中间文件，从根源上终结「官方静默升级后桌面快捷方式报 WSH 找不到文件」的顽疾。
- **坚决杜绝任何流氓开机启动项与后台常驻进程**，规避杀毒软件（卡巴斯基、火绒等）主动防御 PDM 拦截，保持 100% 绿色安全。

## 2026-10-08 运维记录（Agent 执行报错排查）

- 现象：汉化补丁恢复后界面可正常使用，但每次发送消息都报 `Agent execution terminated due to error`，Error ID `42aaeff3-afc9-4ac1-997f-fc8732cbdafa-2`。
- 日志定位（`%APPDATA%\Antigravity\logs\language_server.log`）：
  - Error ID 是 trajectory_id，消息本身已送达（`SEND_USER_CASCADE_MESSAGE_LATENCY ... status:OK`），报错发生在轨迹执行阶段。
  - 真正的报错行：`agent executor error: generating and executing: FAILED_PRECONDITION (code 400): User location is not supported for the API use.`；「对话标题生成」报同一个错，说明与具体请求无关。
- 网络取证：
  - 本机存在国内分流。国内站点（myip.ipip.net）走真实宽带直出 `113.58.74.21`（中国海南海口/联通），国外站点（含 Google）一律走 `23.237.50.27/.28`（US，`FDCservers.net LLC`，机房/托管 ASN）。
  - 出口链路健康：Tun 下 `www.google.com/generate_204` → 204，源地址 `172.18.0.1`；`daily-cloudcode-pa.googleapis.com` 返回 404（可达，仅无路径）；`generativelanguage.googleapis.com` 403（缺 key，属预期）。**不是网络不通，是出口 IP 被 Google 拒**。
  - IPv6 假设已排除：`singbox_tun` 只有 IPv4 默认路由，IPv6 经 WLAN 出，实测 `connect ... failed: Bad access`，Google 走不通 IPv6，故不存在 IPv6 泄漏导致的误判。
  - 为何必须开 Tun：Antigravity 的语言服务器是 Go 进程，只读 `HTTP(S)_PROXY` 环境变量，不读 Windows 注册表里的系统代理（`127.0.0.1:10808`），因此无 Tun 时它无法出网。
- 同类案例（已验证，非本机个案）：
  - [router-for-me/CLIProxyAPI#3999](https://github.com/router-for-me/CLIProxyAPI/issues/3999)：判别因素纯粹是出口 IP，**机房/托管 IP 即使归属地为支持地区也会被拒；换成住宅/边缘 IP 出口后 generateContent 与 streamGenerateContent 均 200 OK**；官方桌面客户端能用是因为它跑在住宅 IP 上。Claude/GPT 系模型不受此门禁影响。
  - [Google AI 论坛：东京 IDC Frontier 付费客户被误判](https://discuss.ai.google.dev/t/paid-gemini-api-customer-blocked-by-incorrect-ip-geolocation-user-location-is-not-supported-from-a-tokyo-japan-datacenter-ip/183984)：服务器在东京（支持地区），但 IP 属 IDC Frontier 机房段，Google 的 GeoIP 不认，Tier 2 付费用户同样被 400 拒。
  - [Google AI 论坛：How to fix the 400 API location error](https://discuss.ai.google.dev/t/how-to-fix-the-400-api-location-error/142028)：其中一条解法是把 `daily-cloudcode-pa.googleapis.com` 加进路由规则（企业 VPN 拦了该域名）；本机该域名可达，不适用。
  - [Reddit：User location is not supported](https://www.reddit.com/r/google_antigravity/comments/1wo0ckz/failed_precondition_code_400_user_location_is_not/)：换 Google 看到的 IP 后恢复。
- 结论：**本地无可修项，根因是 sing-box 的海外出口落在 FDCservers 机房段，被 Google Cloud Code / Gemini API 的地域门禁拦截**。与汉化补丁无关，重装客户端、关开 Tun、换账号均无效。
- 解法（按优先级）：
  1. 给 `googleapis.com`（尤其 `daily-cloudcode-pa.googleapis.com`）单独指定**住宅/家宽 IP 出口**，这是唯一被验证有效的做法。
  2. 短期绕过：Antigravity 里把模型从 Gemini 系换成 Claude / GPT——两者不走该地域门禁。当前默认的 `Gemini 3.8 Flash Medium` 正好是受害模型。
  3. 不建议优先尝试：自带 Gemini API Key。多数案例显示 Key 方式同样吃 IP 门禁。

### 当日解决记录（续）

- 丞相操作后恢复正常：`Gemini 3.8 Flash High` 可正常完成对话，界面完整，无 `Agent execution terminated` 复现。
- 出口 IP 实测已由 `23.237.50.28`（US，FDCservers.net，机房段）变为 `203.10.99.11`（JP，GSL Networks）。机制与上述判断一致——**判定因素是出口 IP 本身，与汉化补丁、Tun、账号均无关，换节点即恢复**。
- 需注意：GSL Networks 同为托管/机房 ASN，却能通过门禁。说明判别不是「住宅 vs 机房」的二元规则，而是 Google 侧逐 IP/ASN 的信誉判定。因此下次复现时不要执着于找「家宽节点」，直接逐个换节点试探更快。
- 复现判据（供下次排查）：`language_server.log` 出现 `FAILED_PRECONDITION (code 400): User location is not supported for the API use.` → 先 `curl -s --noproxy '*' https://api.ipify.org` 看出口，换节点，别去动补丁和账号。

## 2026-10-08 运维记录

- Antigravity 自动升级至 `2.21.1`，第六次复发（同前：WSH 报找不到 `translate-launcher.vbs`）。客户端更新清空了安装目录下的启动器四件套，桌面快捷方式遂失效；`app.asar` 亦回退为官方原版（4643502 字节，sha256 `d075e5d9…`），未留下 `app.asar.bak`。
- 补充确认（本次新增，前五次未验证）：`2.21.1` 的 `dist/utils.js` 结构未变，注入锚点 `void win.loadURL(url);` 与严格正则（连同 `return win;` 与函数闭合括号）均命中，缩进仍为 4 空格，补丁逻辑无需改动。
- 已从本仓库源码重新部署四件套（`install.js` → `translate-inject-backup.js` / `translate-launcher.js` / `translate-launcher.vbs` / `lib/asar.js` + `force-patch.flag`），运行启动器重打 `app.asar`。
- 校验：新 `app.asar`（4599043 字节）与原 `app.asar.bak` 逐文件 SHA256 比对，1048 个原文件零丢失、零改动，仅 `dist/utils.js` 变更并新增 `dist/translate-inject.js`；`node --check` 语法通过，`return win;` 与函数闭合括号完好；`app.asar.unpacked` 内 293 个 unpacked 条目（chrome-devtools-mcp）完整保留。
- 实机验证：客户端可正常启动（主窗口标题 `Antigravity`，6 个进程），截图确认菜单栏、侧边栏、输入框提示均已中文化，如「文件 / 视图 / 窗口」「新建对话」「对话历史」「自定义」「设置」「提出任何问题，@提及，/采取行动」。
- 遗留缺口：侧边栏新增项 `Automations` 未汉化——该文本只存在于静态词典判定范围之外的主界面元素，静态词典未收录、非设置区不触发在线翻译。下次迭代可在 `translate-inject.js` 的 `UI_TEXT_MAP` 中补 `Automations → 自动化`。
- 结论不变：客户端每次自动更新都会清掉非官方文件，出现 WSH 报错时重跑 `install.bat` 即可恢复。

## 2026-09-22 运维记录

- Antigravity 升级至 `2.15.1`，第五次复发（同前：WSH 报找不到 `translate-launcher.vbs`）。客户端更新清空了安装目录下的启动器四件套与 `app.asar.bak`。
- 已从本仓库源码重新部署四件套（`install.js` → `translate-inject-backup.js` / `translate-launcher.js` / `translate-launcher.vbs` / `lib/asar.js` + `force-patch.flag`），运行启动器重打 `app.asar`。
- 校验：新 `app.asar`（4525923 字节）与原包逐文件 SHA256 比对，1042 个原文件零丢失，仅 `dist/utils.js` 变更并新增 `dist/translate-inject.js`；`node --check` 语法通过，`return win;` 与函数闭合括号完好；`app.asar.unpacked`（chrome-devtools-mcp）保持 unpacked；客户端正常启动，主窗口可见。
- 结论不变：客户端每次自动更新都会清掉非官方文件，出现 WSH 报错时重跑 `install.bat` 即可恢复。
- 文档同步：`README.md` 与 `docs/manual-install.md` 的「适配版本」由 `2.0.11` 更新为 `2.15.1`；`docs/manual-install.md` 与 `docs/troubleshooting.md` 的「当前补丁版本」由 `v5.0.3` 对齐到 `v5.1.0`（与 `README.md` 一致）。

## 2026-09-16 运维记录

- Antigravity 手动升级至 `2.14.0`，第四次复发（同 09-09 症状：WSH 报找不到 translate-launcher.vbs）。重跑 `install.js` + 启动器自动重打 `app.asar`，marker 校验通过，`2.14.0` 打补丁正常，客户端可正常启动汉化版。
- 附带确认：`2.14.0` 的 `--cloud_code_endpoint` 仍为 `https://daily-cloudcode-pa.googleapis.com`，该端点是官方默认架构，并非异常配置。
- 同期排查：客户端聊天报 `FAILED_PRECONDITION (400) User location is not supported for the API use`。已排除——出口 IP（实测美国洛杉矶）、账号地区（美国）、年龄验证（已通过）、代理分流（Tun 模式 + 系统代理例外已加 `127.0.0.0/8`）。同出口下 Gemini Web 正常、AI Studio 同样被拒，判定为 Google 对机场共用落地 IP 的 API 通道风控，本地无可修项。

## 2026-09-09 运维记录

- Antigravity 客户端自动更新至 `2.12.2`，第三次复发：启动器四件套（vbs/launcher.js/汉化脚本/asar 工具）与 `app.asar.bak` 被清空，桌面快捷方式报「Windows Script Host 无法找到脚本文件 translate-launcher.vbs」。
- 已从本仓库源码重新部署四件套（`translate-inject.js` 部署为 `translate-inject-backup.js`），运行启动器重打 `app.asar`，marker 校验通过、`app.asar.bak` 重新生成，客户端正常启动。
- 结论不变：客户端每次自动更新都会清掉非官方文件，出现 WSH 报错时重跑 `install.bat` 即可恢复。

## 2026-08-28 运维记录

- Antigravity 客户端自动更新至 `2.11.0`（NSIS 静默安装会清空安装目录下的启动器文件与 `app.asar.bak`），已重新执行 `install.js` 并由启动器重打 `app.asar`，验证客户端可正常启动。
- 结论：客户端每次后台自动更新后都会复发「WSH 找不到 translate-launcher.vbs」，重跑 `install.bat` 即可恢复。
- 修复桌面快捷方式白色空白图标：`install.js` 原先写入的 `IconLocation` 带有多余引号（`"exe路径", 0`）且 `TargetPath` 使用未限定的 `wscript.exe`，客户端更新交换文件期间图标缓存被污染。已改为干净的 `exe路径,0` 格式与 `wscript.exe` 全路径，并刷新图标缓存，验证 Shell 已解析出正常 Antigravity 图标。

## 衍生版本：启动器稳定性修复

### 修复
- 修复启动器注入 `utils.js` 时误删 `return win;` 和函数闭合括号的问题，避免 Antigravity 主进程出现 `SyntaxError: Unexpected end of input`。
- 重新打包前从健康备份恢复原始资源，避免在损坏的 `app.asar` 上重复修补。
- 增加内置离线 ASAR 解包/打包工具，减少对网络依赖。

### 来源
- 本版本基于同学 `ROG` 的开源项目 [myzane678/antigravity-zh-patch](https://github.com/myzane678/antigravity-zh-patch) 修改和二次开发。
- 继续遵循原项目 MIT 许可证并保留原作者署名。

## v5.0.3

适配版本：Antigravity `2.0.11`

### 修复
- **优化首字母小写过滤规则**：修复了当页面中整句英文长句/短语因为超链接拆分（如把 `Google Chrome` 作为超链接，导致后半句 `to be installed...` 独立成为一个文本节点且以小写开头）而触发首字母小写规则被误跳过翻译的问题。现在只过滤“不包含空格”的纯小写标识符/文件名，含有空格的短语与长句允许正常在线翻译。
- **优化路径与命令过滤规则**：修复了当英文长句/短语中包含斜杠 `/`（例如 `/browser` 命令）时，会被路径过滤规则误判为系统路径而直接跳过翻译的问题。现在斜杠与反斜杠过滤规则仅在“不包含空格”的纯路径/端点下生效，使包含空格的长句文案能够正常进行在线翻译。
- **项目目录保护**：在设置侧边栏中增加了项目名称的 DOM 树边界识别，凡是位于“项目/Projects”下方的自定义项目文件夹名（如 `codexworkspace` 等）均会强制跳过翻译并保持英文原名，即使已被写入本地翻译缓存也会强制以原名渲染。
- **严格限制在线翻译和缓存范围**：去除了对普通弹出菜单、悬浮窗（如主页的 `+` 加号下拉菜单）的在线翻译支持，确保只有在 Class 或 ID 中包含 `settings` 或 `preferences` 的真实“设置界面”中才会调用 Google 翻译及读取 LocalStorage 缓存。主页面与其他非设置界面的 UI 元素仅允许通过静态字典 `UI_TEXT_MAP` 进行匹配汉化，彻底杜绝翻译缓存污染主界面和非设置区。
- **完善静态 UI 字典**：针对主页面的 `+` 加号下拉菜单，在本地静态字典中添加了 `Add Context` (添加上下文)、`Media` (媒体)、`Mentions` (提及)、`Actions` (行动)、`Browser` (浏览器) 的静态映射。

## v5.0.2

适配版本：Antigravity `2.0.11`

### 修复
- **清除 utils.js 重复注入事件**：修复启动器在重复安装时会往 `utils.js` 重复追加多个 `did-finish-load` 监听器导致多线程注入冲突的 bug，新增注入前自动正则清理旧监听器的机制。
- **修复大小写导致的字典匹配失效**：增加了对首字母大写的 `Gemini Models` 和 `Claude and GPT Models` 的字典映射，并加塞了启动时自动擦除旧错误翻译缓存的逻辑。

## v5.0.1

适配版本：Antigravity `2.0.11`

### 修复
- **模型翻译偏误修正**：修正在线翻译中“Model Quota”和“Gemini models”被误翻译为“型号配额”和“双子座模特”的问题，增加精确的本地静态字典映射，翻译为“模型额度”与“Gemini 模型”。

## v5.0.0

适配版本：Antigravity `2.0.11`

### 新增
- **混合在线翻译机制**：本地静态字典匹配失败时，异步请求在线翻译。采用 Google Translate，并自动在失败时切换至国内直连备用的 MyMemory 接口，解决客户端更新带来的新 UI 汉化缺失问题。
- **本地 LocalStorage 持久化缓存**：在线翻译成功后，新词条自动存入 `localStorage`，以后再次访问时 0 延迟秒开，避免重复请求和接口限流。
- **弹窗与设置区域定向翻译**：通过 `isInsideSettings` 判定算法，仅在 Settings 菜单、命令面板、dialog、modal 等弹窗区域内才执行异步在线翻译，防止污染主界面和对话正文。
- **强力安全过滤器**：首字母小写文本（如项目名、文件名、方法名）及全小写 slug 格式文本（如 `elegant-darwin`）自动跳过在线翻译，绝不误伤用户自定义的项目或文件。
- **安全事务性打包机制 (Safe Transactional Packing)**：打包 `app.asar` 时使用临时文件过渡，并加入“大于 1MB”的物理大小校验。只有通过校验才会通过重命名原子覆盖原资源包。如果提取/打包失败，客户端主程序绝对不会受到任何物理损坏。
- **强修补标志机制**：重构 `install.js` 及启动器，当使用 `install.bat` 更新补丁时自动写入 `force-patch.flag`，让启动器在下次开机时自动强制重包，解决旧版启动器忽略脚本更新的 bug。

### 优化
- 补充 `'to navigate'`、`'to select'`、`'to close'` 等小写 UI 提示文本至本地静态字典。

## v4.0.1

适配版本：Antigravity `2.0.11`

### 新增
- 新增自动汉化自愈启动器（`patches/translate-launcher.js`、`patches/translate-launcher.vbs`），完美支持在客户端后台更新覆盖后，启动时自动重新完成补丁安装。
- 新增一键安装脚本（`install.js`、`install.bat`），可全自动识别系统桌面（包括 OneDrive 桌面重定向路径）部署核心文件并创建带有官方图标的静默桌面快捷方式。

### 优化
- 检测修复机制重构为完全的环境变量与通用路径，确保其可在任何 Windows 用户电脑上正常运行。
- 更新了安装文档，补充了启动器这一更省心的安装与使用方案。

## v4.0.0

适配版本：Antigravity `2.0.11`

### 新增

- 扩充顶部菜单、窗口菜单、项目菜单等固定 UI 文案映射。
- 扩充账户、自定义、浏览器、应用、模型等设置页固定 UI 文案映射。
- 新增 2 条轻量规则替换，用于处理动态套餐文案和动态预算百分比文案。

### 调整

- 将 DOM 变更翻译从“逐次即时处理”调整为“下一帧批量处理”，降低动态界面翻译延迟。
- 增加父子节点去重逻辑，减少重复扫描同一子树带来的性能损耗。
- 继续保持“优先翻译 UI，不翻译用户与 AI 对话正文”的产品定位。

### 文档

- 更新 README，将当前版本提升为 `v4.0.0`，补充本版能力说明。
- 更新手动安装说明，进一步强调“必须修改程序真实启动后实际加载的资源”这一判断原则。

## v3.0.1

适配版本：Antigravity `2.0.11`

### 调整

- 产品定位收缩为“中文界面补丁”，优先翻译固定 UI，不再翻译用户与 AI 对话正文。
- 移除正文自动翻译与在线翻译请求逻辑，降低误翻译与维护复杂度。
- 将 `UI_TEXT_MAP` 按类别整理，便于后续补充和维护。

### 文档

- 更新 README，明确当前版本定位、两种安装形态和 `app.asar` 路线。
- 更新手动安装说明，强化路径判断、回包要求与安装成功自检清单。
- 新增 `docs/troubleshooting.md`，集中说明“不生效怎么排查”。
- 增加“更新后重装补丁”的判断思路：更新可能覆盖 `utils.js` 或 `resources/app.asar`，需按当前安装形态重新安装。

### 说明

- 当前版本不再依赖在线翻译接口，核心目标是提升中文界面可用性与稳定性。
- 本项目仍不包含 Antigravity 原应用文件、二进制文件、安装包或解包后的 `dist` 目录。

## v3.0.0

适配版本：Antigravity `2.0.11`

### 新增

- 新增 `containsProtectedQuotedContent()` 函数，检测文本中不应翻译的引号内容。
- 反引号 `` `code` `` 包裹的内容自动跳过翻译（Markdown 行内代码）。
- 双引号/单引号中包裹的技术内容跳过翻译，包括：
  - 文件名（带扩展名）、命令行、路径、URL、IP 地址
  - 代码片段（含括号、等号等特殊字符）
  - 驼峰命名标识符（camelCase）、下划线命名标识符（snake_case）
  - 命令行 flag 参数（`--xxx`、`-x`）
  - 技术特殊字符开头（`@`、`#`、`$`）
  - 全大写技术缩略词（`API`、`DOM` 等）

### 说明

- 检测逻辑遵循"宁可不译，不可乱译"原则：一旦文本节点中包含技术引号内容，整句跳过翻译。
- 本项目仍不包含 Antigravity 原应用文件、二进制文件、安装包或解包后的 `dist` 目录。

## v2.0.0

适配版本：Antigravity `2.0.11`

### 新增

- 扩充固定 UI 文案映射。
- 新增对 `placeholder`、`title`、`aria-label` 固定文案的翻译处理。
- 新增 `translate="no"` 跳过翻译支持。
- 新增更完整的不可翻译文本识别规则，包括邮箱、URL、域名、IP、localhost、文件路径、文件名、命令行片段、用户名、标签、代码标识符等。
- 新增助手消息识别逻辑，用于在用户要求英文回答时只跳过助手回复翻译。

### 调整

- 用户明确要求英文回答时，不再全局跳过所有翻译，而是只跳过助手回复自动翻译。
- 固定 UI 文案映射仍然可以继续生效。
- 更新 README 和手动安装说明，明确补丁核心文件是 `translate-inject.js` 和目标应用中的 `utils.js` 注入逻辑。

### 说明

- 本项目仍不包含 Antigravity 原应用文件、二进制文件、安装包或解包后的 `dist` 目录。
- 使用前请备份目标应用中的 `utils.js`。

## v1.0.0

### 初始版本

- 提供 `translate-inject.js` 自动翻译脚本。
- 提供手动安装说明。
- 支持常见 UI 文案映射和英文文本自动翻译。
