# Material DouDen Tool

采用 Material 设计的 bilibili 同传工具

## 使用介绍

左侧选择同传标识符，可用 Tab 键快捷切换。

右侧为同传弹幕输入框，回车即可发送，上下键可**循环**切换已发送弹幕，存在快捷短语时，按下快捷键可立即发送短语。

### 选择房间界面

多选情况可用于联动，会将同传弹幕发在多个直播间。

注：bilibili 限制了弹幕发送频率，多房间发送存在延迟。

### 歌词同传界面

左侧选择歌词标识符，右侧输入歌曲关键词，结果为网易与 QQ 共同搜索并过滤掉无词无轴歌曲，支持按歌曲名、歌手、语言轴排序。

点击歌曲即可切换到歌词页面。

鼠标移动到歌词上可显示跳转按钮，歌词滚动后，点击即可立即从当前滚动位置处的歌词开始同传。

+0.5s、-0.5s 可调整歌词轴。

复制此句为复制高亮部分到剪切板，如存在翻译，复制翻译部分，否则复制原文。

发送下句可立即切换到高亮部分下一句歌词。

### 快捷短语界面

可配置快捷短语，同传输入框钟按下快捷键即可立即发送该短语，使用替换符情况下，替换符将被替换成对于字符串。

### 标识符界面

可配置同传和歌曲的标识符

### 个人信息界面

将 bilibili 的 Cookie 信息输入后才可发送同传弹幕、选择房间等。

### 屏蔽词界面

设置屏蔽词语和对应处理结果，发送弹幕时会自动将屏蔽词替换为处理结果

### 主题色界面

配置工具主题色和切换亮色、暗色模式

## 后续功能

### 弹幕捕获

获取当前选择直播间弹幕，并提取关键词，支持关键词一键点击复制。

进度：功能已有，展示样式和交互方式还在设计，故目前尚未供使用

### 歌词替换符

替换符类型增加歌词部分

进度：同传输入框捕获歌词面板相关内容开发钟

### 弹幕颜色、模式

选择直播间弹幕颜色和位置模式

进度：多房间选择情况下存在每个房间可供选择的模式、颜色不同，考虑如何兼容中。（而且可直接在直播间完成设置不知道这个功能要不要加）

### 禁言用户

在弹幕捕获后，加入禁言该用户功能

进度：等待弹幕捕获样式完成设计后加入
