# Material DouDen Tool

采用 Material 设计的 bilibili 同传工具

任何使用问题、bug、功能需求可以提 issue。

右侧 release 中下载 exe 即可，因为没有 mac 设备所以没法打包 mac 版本，如有需要可阅读 development.md 自行打包。

## 使用介绍

左侧选择同传标识符，可用 Tab 键快捷切换。

右侧为同传弹幕输入框，回车即可发送，上下键可切换已发送弹幕，存在快捷短语时，按下快捷键可立即发送短语。

当字符长度或发送频率超过 b 站限制时，将自动延迟并切割弹幕。

### 弹幕捕获界面

因为界面大小原因，一次只能展示一个房间的弹幕捕获，多直播间同时播的联动情况可选择展示自己传的 v 的直播间。

获取当前选择直播间弹幕和 Super Chat，同时可或许历史十条弹幕与房间权限，房间权限为房管时对于捕获到弹幕的用户可以一键禁言。

自动翻译非中文弹幕，如权限为房管可快速一键禁言用户，支持用户名、弹幕内容、弹幕翻译一键点击复制。

### 选择房间界面

支持添加、单选或多选房间。并配置直播间弹幕颜色和位置模式。

多选情况可用于联动，会将同传弹幕发在多个直播间。

注：bilibili 限制了弹幕发送频率，约 1s 内之内发送一条，多房间发送存在延迟。

### 歌词同传界面

左侧选择歌词标识符，右侧输入歌曲关键词，结果为网易与 QQ 共同搜索并过滤掉无词无轴歌曲，支持按歌曲名、歌手、语言轴排序。

点击歌曲即可切换到歌词页面。

鼠标移动到歌词上可显示跳转按钮，歌词滚动后，点击即可立即从当前滚动位置处的歌词开始同传。

+0.5s、-0.5s 可调整歌词轴。

重置播放即停止播放后重置歌词播放轴到开始部分。

发送下句可立即切换到高亮部分下一句歌词。

### 快捷短语界面

可配置快捷短语，同传输入框中按下快捷键即可立即发送该短语，使用替换符情况下，替换符将被替换成对应字符串。

### 标识符界面

可配置同传和歌曲的标识符

### 个人信息界面

可用 Bilibili 扫码登陆，也可将发送直播间弹幕时的请求 Cookie 输入登陆。

成功后发送同传弹幕、选择房间等。同时实时监听 Cookie 状态（是否过期）。

### 屏蔽词界面

设置屏蔽词语和对应处理结果，发送弹幕时会自动将屏蔽词替换为处理结果。

被屏蔽的同传弹幕将会保存在安装目录下的 forbidden-words.txt 中。

### 设置界面

配置工具主题色和切换亮色、暗色模式

可开启自动抽红包功能，自动抽红包时会占用 1 条弹幕时间，可能会将当前同传弹幕延迟 1s。

可配置捕获界面的过滤弹幕，被过滤弹幕将不会展示。

## 其它功能

### 直播追帧

以低延迟、多线程并用对直播画面进行播放，当出现网络卡顿情况恢复后会以 1.5 倍速播放到当前帧而非像 b 站直接跳转，如果网络掉线太久则会重连到最新帧。

可以选择播放的直播界面，并在直播期间将可记录的点输出。

### 导出棉花糖

将棉花糖图片导出，支持单独导出中文、翻译、合并样式，且合并样式支持横排、竖排、反向横排和反向竖排。

可复制文本于棉花糖图片内导出；也可传入 Excel 文件导出，但请确保 Excel 文件中含有中文和日文两项列标题，将会把对应列内容导出。

并且可以自定义棉花糖卡片样式，如熟悉相关 HTML 和 CSS 可打开控制台修改。

### 禁言列表界面

自动查询房间界面中，所有拥有房管权限的直播间已被禁言用户，可撤销禁言。

### 导出视频鉴赏

将 Bilibili 某动态下评论里的视频推荐捕获，筛选过后导出 Excel 或 Word 文档

### 反馈

任何使用问题、功能需求、bug 可在该项目下提 issue。
