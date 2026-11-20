# 大禹 · 古言权谋风格预设（guyan-quanmou）

一个**可运行的风格 preset 样例**，验证大禹「多风格 = 整包配置切换，不改代码、不训练模型」的机制。

> 核心结论：多风格的"重活儿"不在采集语料训练模型，而在**把风格翻译成可计算判据 + 用小样本验收规则**。本 preset 就是这套方法的落地样板。

## 它改了什么（相对默认包）

| 配置面 | 默认包（网文爽文） | 古言权谋包 |
|---|---|---|
| `meta.display_name` | 大禹 | 大禹·古言权谋 |
| 红线 `hard_reject` | 可复现命令/内部标注 | **追加** 现代词泄漏、阿拉伯数字入正文、章名感叹号、真实朝代影射 |
| `classifier` | AI 味/油腻词 | **追加** 古言语域跑偏（现代口语/直白抒情） |
| `anti_drift` | 冷感/炸裂漂移 | 改为 失智/恋爱脑/计谋无代价/天降救兵 |
| `pacing_signals` | 成交/打脸/震惊 | 通用词 **+** 收网/落子/反将/翻案/廷争/构陷 |
| `positioning_enums` | 打脸碾压/解谜智性… | 布局收网/智性博弈/隐忍反击/借力打力/身份反转 |
| `word_bands` | 冷感/炸裂/通用 | **+** 权谋档（慢热，字数偏大；保留通用档做回退） |
| `rubric` | 人设30/结构25/连续20/文字25 | 人设30/**权谋逻辑30**/连续20/古言语域20 |
| `cool_points` | 每章明爽点/打脸 | 每章信息差变化/小收网/棋局摊牌 |
| `prompts.md` | 网文写作铁律 | 半文半白、谋略有代价、对手有反制、情感在立场对立中推进 |

## 能力边界（诚实说明）

风格体征分三类，本 preset 按类施策：

| 风格体征 | 归属 | 例子 |
|---|---|---|
| 可计算 | L1/L2 规则（本包 rules.yaml） | 现代词泄漏、阿拉伯数字、油腻词、感叹号、信息差密度、字数分层 |
| 半可计算 | 弱信号（suspect + 证据） | 时序倒退、称谓混用、直白抒情句式 |
| 只能语义 | L3 prompt（本包 prompts.md，交调用方 AI） | 权谋逻辑自洽、叙事声音像不像古言、情感含蓄是否到位 |

**规则扫不出"那味儿"** —— 这是大禹一贯的边界，多风格也不会越界。

## 怎么用

`CDA_CONFIG_DIR` 在**进程启动时**读取（模块顶层加载），所以要在启动命令前设置：

```bash
pnpm build
export CDA_CONFIG_DIR=/绝对路径/novel-cda-mcp/presets/guyan-quanmou
node dist/index.js --doctor --json    # 应显示 大禹·古言权谋 / 0.2.0-guyan.1 / healthy=true
node dist/index.js                     # stdio 模式，供写稿 Agent 挂载
```

`--doctor` 输出应见：

```
display_name: 大禹·古言权谋
rule_version: 0.2.0-guyan.1
config_dir: .../presets/guyan-quanmou
```

不设 `CDA_CONFIG_DIR` 即用回默认网文包，两者互不影响。

### MCP 客户端配置示例

```json
{
  "mcpServers": {
    "novel-cda-guyan": {
      "command": "node",
      "args": ["/绝对路径/novel-cda-mcp/dist/index.js"],
      "env": {
        "CDA_CONFIG_DIR": "/绝对路径/novel-cda-mcp/presets/guyan-quanmou",
        "CDA_MCP_DATA": "/长期保留/无中文无空格/目录"
      }
    }
  }
}
```

## 验证

`test/regression.test.ts` 的 `多风格 preset` 测试块固化了 5 个断言：

1. preset 三件套齐全
2. 加载后 display_name/版本切换、规则一致性通过、4 个 prompt key 齐全
3. preset 的 doctor 健康（fail=0）
4. **行为差异**：同一段「手机/微信/186」文本，默认包 `fatal=false`、古言包 `fatal=true`（命中 `modern_word_leak` + `arabic_numeral_leak`）
5. 切回默认包不被污染

跑法：`pnpm test`（16 单元 + smoke 全绿）。

## 如何新增一个风格 preset

1. `cp -r presets/guyan-quanmou presets/<新风格>`（以差异最大的现成包为骨架，比从零写省事）。
2. 改三件套：
   - `rules.yaml`：先**保留通用基准判据**（`reproducible_command`、内部标注泄漏、红牌词表、`pacing_signals` 的通用基准词——doctor 的自检样本依赖它们），再叠加风格专属判据。
   - `word_bands` 必须保留 `通用` 键（`init_project` 的 tone 回退默认值）。
   - `rubric` 各维度 `score_map.A` 必须等于 `max`，`max` 合计 100，A/B/C/D 四档齐全。
   - `prompts.md`：**只能改内容，不能改 `## key` 和占位符**（key 缺一个就报错禁止空跑）。
3. 跑 `CDA_CONFIG_DIR=<新包> node dist/index.js --doctor` 确认 `healthy=true`。
4. 在 `test/regression.test.ts` 追加该风格的行为差异断言（照抄古言块）。
5. 写这个小 README。

### 三个坑（已踩过，别再踩）

- **别删通用基准判据**：医生自检用硬编码样本测 `reproducible_command` 和 `pacing_not_stub`，删了或改了基准词会导致 doctor `healthy=false`。
- **别删 `word_bands.通用`**：`createProject` 里 `JSON.parse(JSON.stringify(bands[tone]))`，tone 回退到"通用"，缺键直接崩。
- **别改 prompt key/占位符**：`renderPrompt` 缺 key 明确报错（设计如此，禁止空跑）。
