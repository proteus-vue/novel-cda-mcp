# Contributing

欢迎贡献规则、平台档案、提示词、测试用例与文档。

## 开发环境

```bash
pnpm install
pnpm build
node dist/index.js --selfcheck
pnpm test
```

## 修改约定

1. **规则调整改 `src/rules.yaml`**，提示词改 `src/prompts.md`，平台档案改 `src/platforms.yaml`——不要在引擎里硬编码阈值（单一来源）。
2. **新增判据**：形态红线放 `rules.yaml` 的 `hard_reject`（fatal 会短路），词表类放 `classifier`，弱信号放 `self_consistency` / `pacing_signals`。形态判据优先于枚举黑名单。
3. **弱信号铁律**：新增机器层信号只报 `suspect` + 原文证据，**绝不判 fatal/reject**；是否构成否决留给 L3 语义层或人工。
4. **评分口径**：参与加权的分数一律百分制（0–100）；新增维度必须同步更新 `rules.yaml` 的 `rubric.score_map` 与 `prompts.md` 顶部口径说明。评分只报命中档，不报感觉分。
5. **新增平台**在 `src/platforms.yaml` 加档案；无公开标准时用占位并注明，未知平台回退通用档并标 `_fallback`，不会因空配置空跑。
6. **新增配置文件**必须经 `src/config.ts` 的 `CONFIG_DIR` 加载，保持相对路径，不依赖 cwd。
7. **新增工具**在 `tools.ts` 用 `tool()` 注册（薄入口，只转调），docstring 中文说明作用；`index.ts` 保持只做注册 + selfcheck + main。

## 提交前检查

```bash
pnpm build
node dist/index.js --selfcheck   # 14 项全 true
pnpm test                        # 端到端冒烟全 PASS
```
