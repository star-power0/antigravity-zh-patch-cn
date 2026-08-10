# 手动安装说明

本文说明如何手动安装 Antigravity 中文界面补丁。

## 适配版本

当前补丁版本：`v5.0.3`

已确认适配：

```text
Antigravity 2.0.11
```

## 重要提醒

不要照抄作者本机路径。每个人的真实安装位置可能不同。

文档中的路径只用于帮助你开始排查，**不是保证所有机器都生效的固定答案**。

你需要找到自己机器上 **真正被程序加载** 的目标资源位置。

请先记住这个原则：

> **补丁必须打在程序真实启动后实际加载的那套文件里。改错目录，即使文件结构看起来正确，也不会生效。**

本补丁的最小闭环是：

```text
translate-inject.js  # 界面翻译脚本本体
utils.js             # 负责把翻译脚本注入页面
```

缺少任意一个，补丁都不会生效。

> 当前版本定位：**优先翻译 UI，不翻译用户与 AI 对话正文。**

## 先看这个：5 条避坑清单

1. **不要只看“目录像不像说明”，要看改完是否真的生效。**
2. **不要把 `Antigravity.exe` 所在目录当成补丁文件落点。** 真正要改的是程序实际加载的资源。
3. **不要只复制 `translate-inject.js` 不改 `utils.js`。** 脚本本体和注入入口缺一不可。
4. **不要只解包不回包。** 如果你的版本实际吃 `app.asar`，改完临时解包目录还不够，必须重新打包回去。
5. **不要只关窗口就算重启。** 一定要彻底退出 Antigravity 进程后再重新打开。

## 第一步：判断你的安装形态

常见有两种情况。

### 情况 A：运行时解包目录
目标目录通常形如：

```text
app-extracted/dist
```

只要这个目录里存在 `utils.js`，它就值得作为候选目标目录。

有些安装形态下，这个候选目录里还会同时看到：

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

例如 Windows 常见启动入口：

```text
C:\Users\<你的用户名>\AppData\Local\Programs\antigravity\Antigravity.exe
```

这时真正要改的可能不是某个候选 `app-extracted/dist`，而是 `app.asar` 里的 `dist/utils.js`。

## 第二步：找到候选目标目录或资源包

优先查找以下目标：

### 候选目录 1

```text
app-extracted/dist
```

### 候选资源包 2

```text
resources/app.asar
```

### 如何判断找得对不对

不要只凭“名字像”。

先看是否存在：

```text
utils.js
```

然后按下面顺序判断：

1. 确认这个位置里的 `utils.js` 和 `translate-inject.js` 是否构成完整补丁闭环
2. 确认程序当前版本实际是不是加载这套资源
3. **补丁必须打在程序真实启动后实际加载的那套文件上**
4. 最终以**改完并完全重启后是否真的生效**作为判断标准

如果你改了 `app-extracted/dist` 这一路仍不生效，就继续排查 `resources/app.asar`。

如果你需要更系统地排查，请继续看：

- [docs/troubleshooting.md](troubleshooting.md)

## 第三步：备份原文件

### 如果你要改的是 `app-extracted/dist`
在目标目录中，把：

```text
utils.js
```

复制一份，命名为：

```text
utils.js.bak
```

### 如果你要改的是 `resources/app.asar`
请先备份：

```text
resources/app.asar
```

例如备份为：

```text
resources/app.asar.bak
```

如果后续需要卸载或回滚，可以直接恢复这个备份。

## 第四步：复制翻译脚本

把本项目中的：

```text
patches/translate-inject.js
```

复制到你的目标 `dist` 目录中。

### 情况 A：如果你改的是 `app-extracted/dist`
复制到：

```text
app-extracted/dist/translate-inject.js
```

### 情况 B：如果你改的是 `app.asar`
先解包 `app.asar`，再把脚本复制到解包后的：

```text
dist/translate-inject.js
```

复制完成后，目标目录中应该同时存在：

```text
utils.js
translate-inject.js
```

## 第五步：修改 utils.js

打开目标目录中的：

```text
utils.js
```

找到 `createWindow(url)` 函数里的这行：

```js
void win.loadURL(url);
```

在它前面加入下面这段注入逻辑：

```js
// 自动翻译注入 — 页面加载完成后执行翻译脚本
win.webContents.on('did-finish-load', () => {
    const injectPath = path_1.default.join(__dirname, 'translate-inject.js');
    try {
        const script = fs.readFileSync(injectPath, 'utf-8');
        void win.webContents.executeJavaScript(script);
    }
    catch (e) {
        console.error('Failed to inject translate script:', e);
    }
});
```

保存文件。

## 第六步：如果你修改的是 app.asar，需要重新打包

如果你走的是 `resources/app.asar` 这一路，那么“解包目录里改好了”还不够。

你还需要把修改后的内容：

1. 重新打包为新的 `app.asar`
2. 覆盖回安装目录中的原始 `resources/app.asar`

否则程序不会自动使用你的临时解包目录。

## 第七步：完全重启 Antigravity

完全退出 Antigravity，然后重新打开。

注意：

- 只关闭窗口不一定够
- 要确保整个进程都退出了

当前版本定位是 **优先翻译 UI**。因此判断成功时，请重点观察菜单、设置、按钮、输入区提示等界面文案，而不是期待用户或 AI 对话正文被自动替换成中文。

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

- [docs/troubleshooting.md](troubleshooting.md)

## 卸载 / 回滚

### 情况 A：你改的是 `app-extracted/dist`

#### 有备份时
关闭 Antigravity。

删除目标目录里的：

```text
utils.js
```

把备份文件：

```text
utils.js.bak
```

改回：

```text
utils.js
```

然后删除：

```text
translate-inject.js
```

重新打开 Antigravity 即可。

#### 没有备份时
关闭 Antigravity。

打开目标目录里的：

```text
utils.js
```

删除包含以下内容的注入代码块：

```text
did-finish-load
translate-inject.js
executeJavaScript
```

然后删除：

```text
translate-inject.js
```

保存后重新打开 Antigravity。

### 情况 B：你改的是 `resources/app.asar`

#### 有备份时
关闭 Antigravity。

把备份文件：

```text
resources/app.asar.bak
```

改回或覆盖回：

```text
resources/app.asar
```

重新打开 Antigravity 即可。

#### 没有备份时
你需要重新获取原始 `app.asar`，或重新安装对应版本客户端恢复。

## 常见问题

### 找不到 app-extracted/dist 怎么办？

先搜索 `utils.js`。如果某个目录同时包含 `utils.js`、`preload.js`、`constants.js`，它就值得作为候选目标目录。

同时别忘了继续排查：

```text
resources/app.asar
```

### 改了 `app-extracted/dist` 还是不生效怎么办？

先不要急着怀疑脚本本身。

这通常意味着你的当前安装形态很可能实际吃的是：

```text
resources/app.asar
```

某些安装形态下，候选 `app-extracted/dist` 可能位于某个用户目录下，但这不是判断标准。

请继续沿着 `app.asar` 这一路排查。

更详细的排障步骤见：

- [docs/troubleshooting.md](troubleshooting.md)

### 更新后失效怎么办？

Antigravity 更新后可能覆盖：

- `utils.js`
- `resources/app.asar`

所以补丁可能需要重新安装。

### 翻译不生效怎么办？

请检查：

1. `translate-inject.js` 是否放在 `utils.js` 同一目录
2. `utils.js` 是否已经加入注入逻辑
3. 如果你改的是 `app.asar`，是否已经重新打包覆盖回去
4. 是否已经完全重启 Antigravity
5. 当前版本是否已经把固定 UI 文案翻译为中文

如果以上都确认无误，再去看：

- [docs/troubleshooting.md](troubleshooting.md)

### 会不会翻译用户消息或 AI 回复正文？

当前版本不会。

当前版本定位是**中文界面补丁**，优先翻译菜单、设置、按钮、输入提示等固定 UI 文案，不主动翻译用户消息正文，也不主动翻译 AI 回复正文。
