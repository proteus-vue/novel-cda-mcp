# Changelog

本项目对重要变更做记录。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/spec/v2.0.0.html)。

## [Unreleased]

### 发布准备
- `package.json` 补齐发布元数据：`author` / `repository` / `homepage` / `bugs`、`files` 白名单（含 `dist/` + 运行时配置 + `docs/`，排除 test/CI/TS 源码）
- 构建钩子用 `prepare` 替代 `prepublishOnly`：`npm install` / `pack` / `publish` 前均自动构建 `bin`，实测干净 clone 打包含 11 个 js + 3 配置 + 11 篇文档
- README 加 CI/npm/node/license 徽章、npm 全局安装与 `npx` 用法、MCP 客户端配置示例
- 完成首次 git 提交（2 commits）；本地身份 `kags <kags@users.noreply.github.com>`（仓库级，未设全局）
- `.gitignore` 补 `coverage/` / `*.tgz` / `*.log` / `.DS_Store`
- 新增 `.github/workflows/publish.yml`：推 `v*` 标签自动发布到 npm（build/selfcheck/doctor/test 四道门禁 + `--provenance`），需仓库配置 `NPM_TOKEN` secret
- README 补维护者发布小节（Automation Token / 打标签流程）

### Added
- **doctor 全栈诊断 CLI**：`node dist/index.js --doctor`（`--json` 输出结构化报告），分层体检环境/配置/规则/判据/数据五层，逐项 pass|warn|fail + 可操作建议；主动识别损坏项目 JSON、旧版缺字段、`.tmp` 残留。退出码健康=0/异常=1，接入 CI。对齐 novel-review-mcp `--selfcheck` 与 proteus doctor 思路。
- **下游类型清理**：layers/facts/tools/prompts/store 中裸 `any` 全部消除（仅保留 MCP 动态 schema 入参的 `Record<string, any>` 兜底）；新增判据层/闭环层/卡片结构接口，类型收紧过程中暴露并修复了 3 处边界不一致（早退缺字段、evidence 类型、undefined 比较）。
- **配置 schema 类型**：新增 `types.ts` 定义 `RulesConfig`/`PlatformsConfig` 等编译期契约；`config.ts` 的 `loadYaml<T>` 泛型化、`rules.ts` 导出由 `any[]` 改为具体接口类型（消除 any 源头，strict 编译通过）。
- **vitest 回归测试**：`test/regression.test.ts` 8 项，把 P0/P1 修复固化为真断言——恶意 id 拦截、路径边界、原子写（含模拟 rename 中断清理 tmp）、规则一致性、枚举单一来源、形象名对外可见、L1 短路。`test` 脚本 = 单测 + 冒烟。

### Fixed
- **P0 路径穿越**：`project_id` 加 zod 正则 + `fileOf()` 二次路径边界断言，拒绝 `../` / 绝对路径注入（协议级实测：恶意 id 被 MCP 校验拦截，`/etc/evil.json` 未生成）。
- **P0 非原子写**：`saveProject` 改为同目录 `.tmp` + `renameSync` 原子替换，异常时清理临时文件，避免中断写坏项目 JSON（实测无 `.tmp` 残留）。

### Changed
- **枚举外置**：爽点五选一/反派三选一/情感契约五选一从 `tools.ts` 硬编码移到 `rules.yaml` 的 `positioning_enums`，缺配置明确报错不空跑；`CDA_CONFIG_DIR` 切换语言包即时生效（实测）。消除"规则全在 yaml"的口径矛盾。
- **规则一致性自检**：`ruleConsistency()` 校验评分档完整/max 合计 100/字数区间合法/红牌词上限/定位枚举非空，接入 `--selfcheck`（14 → 15 项）。
- 文档口径：工具注释 14 → 27；`docs/00` 加编者注说明"大禹"与"笼中跳舞"并存。
- 中文形象名定为「大禹」（取自大禹治水：堵不如疏、建笼立规，与 novel-review-mcp 的「獬豸」司评审形成"大禹司约束"的呼应）；「笼中跳舞」保留为方法论口号。同步到 README / package.json / `rules.yaml` meta / `index.ts` 注释，`list_profiles` 新增 `display_name` 与 `slogan` 字段。技术标识 `novel-cda-mcp` 不变。

## [0.2.0] - 2026-11-19

### Added
- **配置外置**：`rules.yaml` / `platforms.yaml` / `prompts.md` 从代码抽出，`config.ts` 统一加载（路径相对本文件、不依赖 cwd）；`CDA_CONFIG_DIR` 可整包切换语言包，缺文件明确报错不静默回退。
- **L1/L2 分层判据**（对齐 novel-review-mcp）：`layers.ts` 提供形态红线（fatal 毫秒级短路，不调 LLM）、关键词打分、单章自洽弱信号（时序倒退/数字互斥/称谓变体，只报 suspect + 证据）、节奏信号、伏笔通用抽取、事实契约校验；`review_chapter` 改为 L1 短路 → L2 打分 → 弱信号。
- **P1 闭环**：`extract_facts`（硬数据候选契约，跨章同单位多值 suspect）、`next_chapter_brief`（评审结论 + 未收伏笔 + 人设锚 → 下一章约束块，含 prompt）、`foreshadow_list` / `foreshadow_overdue` / `extract_foreshadow`。
- **工具 18 → 27**：新增 `check_redline` / `check_self_consistency` / `check_pacing` / `extract_facts` / `next_chapter_brief` / `foreshadow_list` / `foreshadow_overdue` / `list_profiles` / `extract_foreshadow`（保留全部旧工具名兼容）。
- **Prompts 3 → 4**：模板外置到 `prompts.md`，新增 `next_chapter_brief_prompt`；`build_system_prompt` 改由模板 + 项目卡片渲染。
- **自检**：`node dist/index.js --selfcheck` 14 项（规则加载/红线/短路/弱信号/闭环/平台/提示词）。
- **效率观测**：`review_chapter` / `check_redline` 返回 `timing.wall_ms`，L1 短路如实反映。

### Changed
- 规则单一来源：红牌词上限、字数区间、评分锚点、漂移回调、SOP 等全部从 yaml 读取；改规则只改配置不改代码。
- README 重写：形象名「笼中跳舞」由来、零基础接入话术、27 工具表、P1 闭环、效率观测、已知边界。

## [0.1.0] - 2026-11-19

### Added
- 初版：CDA 五层方法论落地为 MCP，18 工具 + 11 篇方法论资源 + 3 个评审 Prompt。
- 定位层/锁定层/结构层/执行层/质检层完整链路；否定式定义、金手指边界、伏笔编号台账、发布闸门等强制校验。
