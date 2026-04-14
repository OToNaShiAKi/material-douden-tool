# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Project overview
- Desktop app built with Electron 13, Vue 2, Vuetify 2 via vue-cli-plugin-electron-builder.
- Two renderer bundles:
  - index: main compact UI (src/pages/index)
  - support: full-screen utility window (src/pages/support)
- Main process entry: src/background.js. Interacts with renderers via IPC (src/ipc.js).
- App integrates with Bilibili Live APIs and WebSockets, plus a small external backend (see src/plugins/headers.js).

Common commands
- Install deps (use Yarn):
  - yarn
- Start app in development (Electron + Vue dev server):
  - yarn serve
- Lint code (ESLint + eslint-plugin-vue):
  - yarn lint
- Build distributables with electron-builder:
  - yarn build
- Tests: no test script is configured in package.json.

How the app is structured
1) Main process (Electron)
- src/background.js
  - Registers custom app:// protocol and creates BrowserWindow instances via CreateWindow(page, options).
  - Tracks windows by name in AllWindows (Map): keys include "index" and on-demand pages (e.g., "support").
  - In dev, loads process.env.WEBPACK_DEV_SERVER_URL + page and opens DevTools; in prod, loads app://./<page>.html.
  - Auto-updater runs in production via electron-updater.
  - Sets a global Referer for requests via session.webRequest.onBeforeSendHeaders to mimic https://live.bilibili.com.
- src/ipc.js
  - Central IPC hub using ipcMain for:
    - Window management: "WindowSize" resizes the frameless main window; "OtherWindow" lazily creates named windows (e.g., support).
    - Cross-window messaging: "Channel" forwards messages to the support window if present (creates it optionally).
    - Auth & session: "BilibiliLogin" (QR login flow), "Cookie" (sets Bilibili/Login/API cookies & WBI; triggers CheckLogin and subscribes shields).
    - Bilibili data: search users/rooms, follow list, medal wall, room mode, room info, dynamic comments, live info & websocket setup.
    - Moderation: silent user add/list/remove; shared shield words publish/subscribe.
    - File I/O: "SaveFiles" save dialog (single file or folder batch); "WriteComment" streamed append of structured logs per room.
  - Exports streams (Map) to track open write streams and closes them on app will-quit.

2) HTTP clients & API wrappers
- src/plugins/headers.js defines axios instances and interceptors:
  - Bilibili: https://api.live.bilibili.com with strict code checks; attaches origin/referer/user-agent.
  - Login: https://passport.bilibili.com for QR login polling.
  - Music: https://music.163.com/api for lyric search.
  - API: external backend at http://pp_backend_2023_3.commonwind.top/ for shared features (shield words, login stats, room trace).
- src/plugins/axios.js wraps endpoint calls:
  - Room/user info, search (live and user), follow counts, medals, danmaku config, live play info.
  - Login flow helpers (GetQRCode, GetLoginInfo, CheckLogin) and WBI signing support (GetRID from util/wbi.js).
  - Live websocket bootstrap (GetWebSocket) composes host/token/history/admin state.
  - Shared backend flows: LoginStatistics plus PubShield/SubShield/AddRoomTrace. Operations that depend on successful login stats await LoginFirst (a deferred Promise).

3) Live WebSocket handling (renderer)
- src/plugins/socket.js
  - Manages Bilibili live WebSocket: connection, certification payload, periodic heartbeats, auto-reconnect.
  - Decodes frames via util/Verify.js (Brotli decompression, message framing) and normalizes events to comment objects.
  - Supported commands include DANMU_MSG (comments/emotes), SUPER_CHAT_MESSAGE, GUARD_BUY, SEND_GIFT, LIVE start.
  - Persists logs by sending "WriteComment" to main if AutoWriteComment (localStorage) is enabled.
  - Uses util/Verify Colors/Ships to render guard badges and styles.
- src/util/Verify.js implements:
  - Certification and HeartBeat packet builders, Brotli decode, frame parser (HandleMessage), and style/color constants.

4) Renderer apps
- index app (src/pages/index)
  - Entry: main.js; Router: router.js; Store: store.js (Vuex). Vuetify configured via src/plugins/vuetify.js.
  - router.beforeEnter enforces login by checking localStorage "cookie" and redirects to /cookie when missing.
  - router.afterEach sends "WindowSize" IPC with route-specific heights to resize the compact desktop window.
- support app (src/pages/support)
  - Entry: main.js; Router: router.js (routes: Video, Candy, Silent, Anime, Lyric, Sponsor). Opened on demand via IPC "OtherWindow" from main.
- Shared UI: Vuetify theme primary color is read from localStorage (plugins/vuetify.js).

5) Exporting & utilities
- src/util/ExportFile.js
  - ExportWord: builds a .docx document capturing selected fields, embeds thumbnails via html2canvas, and optionally totals durations.
  - ExportExcel: initializes a workbook/sheet for selected columns (extend as needed).
  - ASS lyric utilities: ReadLyric, ExportAegisub, SaveLyric, ConvertLyric for karaoke timing and bilingual lines.
  - DomToImage/ExportCandy: render DOM snippets to images and batch-generate from Excel rows.
- Other helpers:
  - src/util/Translate.js: token function used by a translation feature.
  - src/util/wbi.js: WBI signing helpers (imported by axios wrappers).
  - src/util/Stacks.js, src/util/SendComment.js, src/util/Format.js: queueing, sending, and formatting helpers used throughout (see imports where referenced).

Notes for working in this repo
- Prefer Yarn for dependency changes (yarn add/remove). The project uses vue-cli-service via vue-cli-plugin-electron-builder.
- In development, the main process loads pages by name ("index", "support"). index is created on app ready; other pages are created lazily via the "OtherWindow" IPC.
- Many features require Bilibili cookies present in localStorage (router enforces /cookie). The "Cookie" IPC handler sets axios defaults and derives additional cookies and WBI data.
- Some moderation/shield features await LoginStatistics (see axios.js: LoginFirst). If you add flows that depend on that backend, follow the same pattern.
- When adding:
  - New IPC handlers: src/ipc.js is the central place.
  - New Bilibili/API calls: add to src/plugins/axios.js using the existing axios instances and interceptors.
  - New support views: register routes in src/pages/support/router.js and open via "OtherWindow".
  - New compact views: add under src/pages/index and update src/pages/index/router.js; set route meta.height for window resizing.

Build & packaging
- electron-builder is invoked by yarn build via vue-cli-service electron:build. It produces platform-specific artifacts under dist/ (defaults from the plugin unless configured elsewhere).
- postinstall/postuninstall hooks install native app deps for Electron via electron-builder.

Security & behavior considerations
- The main process disables webSecurity for BrowserWindow to accommodate cross-origin requests; be mindful when introducing new web content.
- Axios interceptors in headers.js enforce expected API codes; keep these consistent when extending API usage.
- The main process sets a Referer header to live.bilibili.com for all requests; ensure additional requests comply with target service requirements.
