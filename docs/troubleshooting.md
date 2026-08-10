# 故障排查

本文专门用于处理“为什么补丁没生效”“为什么改了目录还是没反应”这类问题。

如果你还没看过安装步骤，请先看：

- [manual-install.md](manual-install.md)

## 先确认当前版本定位

当前补丁版本 `v5.0.3` 的定位是：

> **优先翻译 UI，不翻译用户与 AI 对话正文。**

所以请不要用“用户消息是否被翻译”“AI 回复是否被翻译”为成功标准。

当前版本成功的标志应该是：

- 菜单变中文
- 设置项变中文
- 按钮文案变中文
- 输入区提示文案变中文

例如：

```text
New Conversation -> 新建对话
Settings -> 设置
Permissions -> 权限
Ask anything, @ to mention, / for actions -> 提出任何问题，@提及，/采取行动
```

---

## 问题 1：我改了 `app-extracted/dist`，为什么不生效？

这是最常见的问题之一。

### 原因
并不是所有安装形态都真正加载某个候选：

```text
app-extracted/dist
```

有些机器虽然存在这种目录结构，但程序实际吃的是安装目录中的：

```text
resources/app.asar
```

### 你应该怎么判断
不要只看“这个目录里有 `utils.js`”。

正确判断标准是：

1. 这个位置是否包含候选目标文件
2. 你是否已经把 `translate-inject.js` 放进去
3. `utils.js` 是否已经加入注入逻辑
4. **改完并完全重启后是否真的生效**

如果某个候选 `app-extracted/dist` 改完还是没效果，就继续排查：

```text
resources/app.asar
```

---

## 问题 2：为什么 `Antigravity.exe` 所在目录不是补丁落点？

因为：

- `Antigravity.exe` 是启动入口
- 但真正前端资源通常在运行时解包目录，或 `resources/app.asar` 里

不要把：

```text
C:\Users\<你的用户名>\AppData\Local\Programs\antigravity\Antigravity.exe
```

误当成“脚本文件就应该直接放这里”。

真正要找的是程序实际加载的资源位置。

---

## 问题 3：我已经把脚本放进去了，为什么还是没用？

请逐项检查：

### 1. 是否同时具备这两个文件

```text
utils.js
translate-inject.js
```

### 2. `utils.js` 是否真的加了注入逻辑

应当至少能搜到：

```text
translate-inject.js
executeJavaScript
did-finish-load
```

### 3. 是否放在同一目录

`translate-inject.js` 必须和被修改的 `utils.js` 在同一个目标 `dist` 目录里。

### 4. 是否改对了那一套资源

如果你改的是某个候选 `app-extracted/dist`，但程序实际吃的是 `app.asar`，那就不会生效。

---

## 问题 4：为什么我解包后改了文件，程序还是没变化？

因为你可能只做了“解包和修改”，但没有做“回包”。

如果你的安装形态实际吃的是：

```text
resources/app.asar
```

那么流程必须是：

1. 解包 `app.asar`
2. 修改解包目录中的 `dist/utils.js`
3. 放入 `dist/translate-inject.js`
4. **重新打包为新的 `app.asar`**
5. 覆盖回安装目录中的 `resources/app.asar`

如果你只是改了临时解包目录，程序不会自动读取那套改动。

---

## 问题 5：为什么我关掉窗口再打开，还是没生效？

因为只关窗口不一定代表整个程序进程已经退出。

Electron 类应用经常会：

- 关闭窗口
- 但进程继续驻留后台

这时重新打开窗口，程序可能还在用旧资源。

### 正确做法
要确保：

- Antigravity 整个进程已经退出
- 然后再重新启动 `Antigravity.exe`

---

## 问题 6：怎么快速判断当前版本更可能吃哪一套资源？

可以按这个顺序判断：

### 先看候选目录 A

```text
app-extracted/dist
```

如果这里存在：

```text
utils.js
preload.js
constants.js
```

它值得优先尝试。

### 再看候选资源包 B

```text
resources/app.asar
```

如果你改了候选目录 A 不生效，就优先怀疑当前安装形态更可能吃的是候选资源包 B。

### 最终判断原则
**永远以“改完并完全重启后是否真的生效”为准。**

---

## 问题 7：更新后为什么又失效了？

因为 Antigravity 更新时，可能覆盖这些文件：

- `utils.js`
- `resources/app.asar`

也就是说：

- 你之前加进去的注入逻辑没了
- 或你改过的资源包被新版覆盖了

### 这时该怎么办
重新走一遍安装流程：

1. 判断当前版本吃哪套资源
2. 重新放置 `translate-inject.js`
3. 重新修改 `utils.js`
4. 如果是 `app.asar` 路线，再重新回包

---

## 问题 8：怎么做最小自检？

如果你只想花 30 秒快速判断，可按这个顺序：

1. 目标目录里有：

```text
utils.js
translate-inject.js
```

2. `utils.js` 里能搜到：

```text
translate-inject.js
executeJavaScript
did-finish-load
```

3. 如果走的是 `app.asar` 路线，确认已重新打包覆盖回去
4. 完全退出并重启 Antigravity
5. 看固定 UI 是否变中文，而不是看对话正文

---

## 问题 9：为什么现在不翻译 AI 回复正文了？

这是当前版本的**有意设计**。

原因很简单：

- AI 回复本来通常会跟随用户语言
- 正文里包含大量代码、命令、路径、术语、报错原文
- 自动翻译正文更容易误伤内容

所以从 `v3.0.1` 开始，补丁定位收缩为：

> **优先翻译 UI，不翻译用户与 AI 对话正文。**

这样更稳，也更容易维护。

---

## 问题 10：如果还是不生效，我该先怀疑什么？

优先按这个顺序怀疑：

1. 改错了资源路径
2. `translate-inject.js` 和 `utils.js` 不在同一目录
3. `utils.js` 根本没注入成功
4. 如果走的是 `app.asar` 路线，只解包没回包
5. 没有彻底退出程序就重开
6. 更新覆盖了之前的修改

通常前 4 条就能解释绝大多数问题。
