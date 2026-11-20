# 大禹 · CDA 约束驱动创作 MCP（novel-cda-mcp）

[![CI](https://github.com/proteus-vue/novel-cda-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/proteus-vue/novel-cda-mcp/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/novel-cda-mcp)](https://www.npmjs.com/package/novel-cda-mcp)
[![node](https://img.shields.io/node/v/novel-cda-mcp)](https://nodejs.org/)
[![license](https://img.shields.io/npm/l/novel-cda-mcp)](./LICENSE)

**仓库**：[GitHub](https://github.com/proteus-vue/novel-cda-mcp) · [GitCode（国内镜像）](https://gitcode.com/proteus-vue/novel-cda-mcp)（`git@gitcode.com:proteus-vue/novel-cda-mcp.git`）

> **名字由来**：取自中国神话「大禹治水」。洪水滔天，鲧用堵而败，大禹改**疏**——
> 顺水性把它引入九条河道、划定九州、铸九鼎立规矩，终化水患为水利。
> 这正是 CDA 的隐喻：AI 的创作力如洪水，**堵不如导**——先建笼子（立规矩、定边界），
> 再让 AI 在规矩里跳舞。「大禹」是神话形象，「笼中跳舞」是方法论口号（见总纲）；技术标识 `novel-cda-mcp` 不变。
> 定位层定生死、锁定层建笼子、结构层外包记忆、执行层保落地、质检层定放行——
> **不教 AI 怎么写，只告诉 AI 不能怎么写。**

把《AI 小说工业化方法论》（CDA，00–10 号文件）落地为独立 MCP Server：五层约束 + L1/L2 分层判据 + P1 评审回流，用确定性规则与可计算指标让「80 分的作品稳定量产」。形象与 [novel-review-mcp（獬豸）](https://github.com/proteus-vue/novel-review-mcp) 呼应——**獬豸辨是非、司评审；大禹治洪水、司约束**；工程风格也一并对齐：配置外置、形态判据优先、弱信号不判死、评审变写稿护栏。

> 方法论的诚实边界（00 号）：CDA 保证**质量下限**，不保证**艺术上限**；神作仍需人类判断。本工具只做可计算的规则/表格/记忆/锚点，语义判断留给 LLM prompt 与人。

## 它解决什么

| 诉求 | 机制 |
|---|---|
| 长篇不崩、人设不跑偏 | 否定式定义（人设禁止项 ≥5 强制）、金手指边界优先（≥2 + 三条腿）、调性对立面定义、伏笔编号台账 |
| 百万字记忆外包 | 伏笔编号 F#/L#/C# + 埋设/回收章 + 硬数据表 + 章纲施工图，项目间隔离防串味 |
| 反 AI 味 / 反机械感 | 红牌词 ≤1/章、油腻词一票否决、字数分层浮动区间、章名分层、TTS 三轨分离 |
| 评审不空跑 | **L1 形态红线毫秒级 fatal 短路**（不调 LLM）→ L2 打分 → L3 语义 prompt；弱信号只报 suspect + 原文证据 |
| 写稿不跑偏 | P1 闭环：`extract_facts` → `foreshadow_*` 台账 → `next_chapter_brief` → 喂给写稿 Agent → 再评审 |
| 规则可迭代 / 可移植 | `rules.yaml` + `prompts.md` + `platforms.yaml` 全部外置，`CDA_CONFIG_DIR` 可整包切换语言包，改规则不改代码 |

**设计原则**：形态/结构判据优先于枚举黑名单；可复现技术细节用结构识别；词表扫不出叙述声音与逻辑断链，这两类必须进 L3 语义评审。

## 零基础接入：把这段话发给你的 AI

> 前提：你的 AI 助手支持 MCP（能挂外部 stdio 进程）。本工具**不依赖外部大模型端点**——L1/L2 与弱信号全是本地确定性计算；需要 L3 语义评审时，把 `chapter_review_prompt` 交给你的 AI 即可。

### A. 一次性接入话术（复制发给 AI）

```text
我想用一个叫「大禹」的小说创作约束工具（寓意大禹治水：先建笼子、再让 AI 在规矩里跳舞），它是个 MCP Server（技术标识 novel-cda-mcp）。我不懂技术，这一步由你来做，做完告诉我结果：
1. 在 /workspace/novel-cda-mcp 目录执行 pnpm install && pnpm build。
2. 把它挂成 MCP server：协议 stdio，command 用 node 的绝对路径，args 是 dist/index.js 的绝对路径。
3. 运行 node dist/index.js --selfcheck，全部为 true 才算成功。
4. 数据会写到 ~/.cda-mcp（可用 CDA_MCP_DATA 环境变量改路径）。
做完用一句话告诉我"可以用了"，并把 dist/index.js 的绝对路径记下来。
以后我发小说设定给你，你先用 init_project + save_card 建笼子，再写正文。
```

### B. 日常最简话术

```text
我接下来写一部小说。请先帮我建好创作约束：填定位决策卡、建人设禁止项和金手指边界、定调性对立面。
写完几章后，用 review_chapter 逐章评审，每章告诉我 verdict（通过/打回/禁止发布）、问题清单和最该改的三点。
```

### C. 进阶闭环话术（写稿不跑偏）

```text
在上面基础上再做四件事：
1. 用 extract_facts 从正文抽硬数据候选，列出来让我确认后再固化，别把没核对的数字当设定。
2. 用 foreshadow_register 风格的 add_foreshadow / resolve_foreshadow 维护伏笔台账。
3. 用 next_chapter_brief 把评审结论转成下一章写作约束，以后写第 N+1 章必须遵守。
4. 发布前用 release_gate 走锚点制评分闸门；发现漂移用 drift_callback 查回调方案，问题用 log_issue 反馈到规则层。
```

## 安装与运行

需要 Node.js 18+。调用侧不限语言（MCP stdio / JSON-RPC），返回纯 JSON。

### 方式 A：npm 安装（推荐，开箱即用）

```bash
npm i -g novel-cda-mcp
novel-cda-mcp --selfcheck   # 15 项判据自检
novel-cda-mcp --doctor      # 五层健康诊断
npx novel-cda-mcp           # 不安装也能跑（stdio）
```

MCP 客户端配置（command 可用 `novel-cda-mcp` 或 `npx -y novel-cda-mcp`）：

```json
{
  "mcpServers": {
    "novel-cda": {
      "command": "npx",
      "args": ["-y", "novel-cda-mcp"],
      "env": { "CDA_MCP_DATA": "/长期保留/无中文无空格/目录" }
    }
  }
}
```

### 方式 B：源码构建（改规则/二次开发）

```bash
cd novel-cda-mcp
pnpm install
pnpm build
node dist/index.js --selfcheck      # 自检：判据信号，15 项全 true
node dist/index.js --doctor         # 全栈健康诊断，人可读
node dist/index.js --doctor --json  # 同上，JSON 输出（供 CI/脚本消费）
node dist/index.js                  # stdio 模式，供写稿 Agent 挂载
pnpm test                           # 单测（vitest 11 项）+ 端到端冒烟
```

源码方式下，改 `src/rules.yaml` / `prompts.md` / `platforms.yaml` 后重新 `pnpm build` 即生效；也可用 `CDA_CONFIG_DIR` 指向外部语言包整包切换，无需重建。

客户端配置：

```json
{
  "mcpServers": {
    "novel-cda": {
      "command": "node",
      "args": ["/绝对路径/novel-cda-mcp/dist/index.js"],
      "env": { "CDA_MCP_DATA": "/长期保留/无中文无空格/目录" }
    }
  }
}
```

## MCP 工具（27 个）

| 工具 | 作用 |
|---|---|
| `init_project` | 定位决策卡（缺性别向/情感契约/爽点类型/反派类型直接报错，补丁1-3） |
| `sop_status` / `advance_sop` / `log_issue` | 7 步开新书 SOP 顺序锁 + 问题回调规则层 |
| `save_card` | 锁定层四卡：人设（禁止项 ≥5 强制）/ 金手指（边界 ≥2 + 三条腿）/ 调性对照（对立面定义）/ 硬数据 |
| `add_foreshadow` / `resolve_foreshadow` / `touch_foreshadow` | 伏笔台账：编号登记 / 回收（凭空回收 = 一票否决）/ 长线呼吸记录 |
| `foreshadow_health` / `foreshadow_list` / `foreshadow_overdue` | 回收率 / 台账查看 / 超期未收提醒（无章序不臆断） |
| `plan_chapter` / `save_outline` / `check_title` | 章纲施工图（字数分层区间）+ 章名合规（可见 ≥5 字、总长 ≤15、感叹号规则） |
| `check_ai_flavor` / `check_format` | AI 味（红牌词/油腻词/句式/升华）+ TTS 格式（数字可读化/一人一段/引号闭合…） |
| `check_redline` | **L1 形态红线**，毫秒级 fatal 短路，不调 LLM |
| `check_self_consistency` | 单章内部自洽弱信号：时序倒退/数字互斥/称谓变体，只报 suspect + 证据 |
| `check_pacing` | 节奏：爽点/冲突/钩子密度 + 荒漠预警（机器层，去 LLM 桩） |
| `extract_facts` | P1：抽硬数据生成候选事实契约（fact_check 兼容），跨章同单位多值标 suspect |
| `extract_foreshadow` | 零 LLM 通用抽取伏笔候选（无编号也能识别悬念） |
| `review_chapter` | 每章过程评审：L1 短路 → L2 打分 → AI 味/格式/章名/暗爽点 + 弱信号 + 真实耗时 |
| `release_gate` | 发布闸门：合规一票否决 + 锚点制百分制（只报命中档，不报感觉分） |
| `drift_callback` | 6 类漂移回调方案匹配 |
| `next_chapter_brief` | P1：评审结论 + 未收伏笔 + 人设锚 → 下一章写作约束块（含 prompt） |
| `query_method` | 检索 11 篇方法论文档片段 |
| `list_profiles` | 列出平台档案、规则版本、提示词维度 |

**资源**：11 篇方法论文档（`cda://docs/...`）
**Prompts**：`build_system_prompt`（按项目卡片拼写作铁律）、`chapter_review_prompt`、`periodic_audit_prompt`、`next_chapter_brief_prompt`

## AI 写小说闭环（P1）

```
建笼子：init_project → save_card(character/goldfinger/tone/harddata) → prompt build_system_prompt
   ↓ 写给写稿 Agent
写完 N 章 → review_chapter（L1 短路 + L2 + 弱信号）→ 评审报告
         → extract_facts(N章) 得候选契约（人工复核后固化）
         → add_foreshadow/resolve_foreshadow 维护台账
         → next_chapter_brief(报告, 契约, 人设) 得第 N+1 章约束块
         → 把约束块的 prompt 喂给写稿 Agent → 写完再评审（闭环）
```

- `extract_facts` 只产出**候选契约**（带 evidence + suspect），必须人工/LLM 复核后当正式契约，不冒充确认设定。
- `next_chapter_brief` 是评审结论的确定性转写，不新增判断；上轮是桩模式/无判定时明确标注，不拿空判定当约束。
- 机器层弱信号只报嫌疑，最终仍需 L3 语义层或人工复核。

## 效率观测

`review_chapter` / `check_redline` 返回 `timing.wall_ms`，把"评审快"从估算变成可核对的事实。L1 硬拒短路如实反映为毫秒级返回与更少的后续检查。本工具链全部本地确定性计算，无 LLM 调用/token 账本；需要语义评审时由调用方 AI 承担。

## 健康诊断（doctor）

`--selfcheck` 只回答"判据信号还活着吗"，`--doctor` 回答"整套工具能不能放心用"——分五层逐项体检，每项给 `[OK]/[!]/[X]` 与可操作建议：

| 层 | 检查项 |
|---|---|
| 环境 | Node ≥18、数据目录可读写/可创建 |
| 配置 | 三份配置文件齐全、规则版本、平台档案、提示词模板数量 |
| 规则 | 评分锚点合计/档位、字数区间、红牌词上限、定位枚举的内在一致性 |
| 判据 | 复用 9 项真实判据（L1 短路/弱信号/词表加载…），非仅"字段存在" |
| 数据 | 每个项目 JSON 可解析、必需字段齐全、无 `.tmp` 残留 |

退出码分级：**全绿 = 0，含 `[X]` = 1**（`[!]` 提醒不影响），可直接进 CI。`--doctor --json` 输出结构化报告供脚本消费。项目文件损坏（半截 JSON / 旧版缺字段）会在这里被主动揪出——配合原子写，构成"写入不坏 + 启动能查"的双保险。

## 配置

| 文件 | 作用 |
|---|---|
| `src/rules.yaml` | 红线/L1/L2/定位枚举（爽点/反派/情感契约）/字数区间/评分锚点/漂移回调/SOP/反漂移/节奏/事实抽取，全部外置 |
| `src/platforms.yaml` | 平台档案（番茄/七猫/起点/晋江 + 未知回退通用档） |
| `src/prompts.md` | 4 个 L3 提示词模板，按 `## key` 拆分，输出严格 JSON |
| `docs/` | 11 篇 CDA 方法论原文档（注册为 MCP resources） |

**语言包整包切换**：设 `CDA_CONFIG_DIR=/path/to/my-pack`，目录内放同名 `rules.yaml` / `platforms.yaml` / `prompts.md` 即可整包替换规则/平台/提示词，不改代码。缺文件明确报错，**不会静默回退到默认规则**。

## 多风格预设（preset）

`CDA_CONFIG_DIR` 不只是"语言包"，它是**整包风格切换**——同一套 MCP 引擎，换一份配置就是另一种创作约束。仓库内置三个可运行的样例，且刻意做成强对比：

| preset | 说明 | 适用 |
|---|---|---|
| [古言权谋](./presets/guyan-quanmou/README.md) | 禁现代词/阿拉伯数字，半文半白、权谋有代价 | 古代言情、宫廷、权谋 |
| [硬科幻](./presets/hard-scifi/README.md) | 鼓励精确数据，禁玄学/伪科学/技术万能，重科学自洽 | 硬科幻、太空歌剧、近未来 |
| [轻喜剧](./presets/qing-xiju/README.md) | 禁苦情虐心/强行煽情，笑点靠反差、吐槽对事不对人 | 轻喜剧、日常搞笑、轻松向 |

```bash
export CDA_CONFIG_DIR=/绝对路径/novel-cda-mcp/presets/qing-xiju   # 或 guyan-quanmou / hard-scifi
node dist/index.js --doctor --json   # 显示 大禹·轻喜剧 / 0.2.0-xiju.1 / healthy=true
node dist/index.js                   # stdio 挂载，评审自动按所选风格规则
```

实测四包对同一批文本的**交叉反向差异**（证明是真·整包行为切换，不是换皮）：

| 文本 | 默认包 | 古言包 | 硬科幻包 | 轻喜剧包 |
|---|---|---|---|---|
| 玄学词（真气/金丹/筑基） | 通过 | 通过 | fatal（`xianxia_leak`） | 通过 |
| 精确数据（137.5米/0.3%） | 通过 | 数字泄漏 | 通过 | 通过 |
| 现代词（手机/微信/186） | 通过 | fatal（`modern_word_leak`） | 通过 | 通过 |
| 苦情（吐血/生离死别） | 通过 | 通过 | 通过 | fatal（`melodrama_leak`） |

已固化为 17 个自动化断言（古言 5 + 硬科幻 6 + 轻喜剧 6），`pnpm test` 28 单元 + smoke 全绿。

> **多风格的方法论**：重活儿不在"采集大量作品训练模型"（大禹无权重可训练），而在"把风格翻译成可计算判据 + 用小样本验收规则"——可计算的进 `rules.yaml`，扫不出的叙事声音进 `prompts.md` 交 L3 语义判。新增风格见 [preset README](./presets/guyan-quanmou/README.md#如何新增一个风格-preset)。

## 多语言边界（诚实说明）

评审内容目前是中文网文规则。要评审其它语种，不需要改代码——另备一套同名配置文件（保持 stage key 与 JSON schema 一致），指向它即可。工具调用侧不限语言。

## 已知边界

1. 本工具只做可计算部分；"读完想不想看第 4 章"、灵气、神作上限仍需 L3 prompt + 人类判断。
2. 平台规则为公开资料整理，时效性需自行核对官方最新公告；未知平台回退通用档并标 `_fallback`。
3. 单章内部自洽是弱信号（suspect + 证据），不判 fatal/reject，必须复核。
4. `extract_facts` 的候选契约覆盖有限且可能误报，禁止直接当确认设定。
5. 机器层检测（红牌词/油腻词/形态红线）是枚举与结构识别，词表漏变得快，形态判据优先；新玩法需更新 `rules.yaml`。
6. 伏笔超期基于章序差值；无章序信息时不臆断，返回空。

## 维护者：发布到 npm

发布由 GitHub Actions 自动完成，本地无需 npm 登录。一次性准备：

1. 在 npm 生成 **Automation Token**（npm → Access Tokens → Generate New Token → Automation），
   填入仓库 **Settings → Secrets and variables → Actions → New repository secret**，名为 `NPM_TOKEN`。
2. 更新版本号（`package.json` 的 `version` 与 `CHANGELOG.md`），走常规提交推到主分支。
3. 打标签并推送，即触发 `.github/workflows/publish.yml`：

```bash
git tag v0.2.0
git push origin v0.2.0
```

工作流会先跑 build / selfcheck / doctor / test 四道门禁，全过才 `npm publish --provenance`。
`npm publish` 前 `prepare` 钩子自动构建 `dist/`，无需手动预构建。

## License

MIT — 见 `LICENSE`。
