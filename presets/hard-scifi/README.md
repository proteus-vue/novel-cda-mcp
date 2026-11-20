# 大禹 · 硬科幻风格预设（hard-scifi）

第二个**可运行的风格 preset 样例**，与 [古言权谋](../guyan-quanmou/README.md) 构成强对比，进一步验证大禹「多风格 = 整包配置切换，不改代码、不训练模型」的机制。

> 选硬科幻是因为它和古言权谋在「现代词/阿拉伯数字」上判定**完全相反**：古言禁现代词和数字入正文，硬科幻恰恰鼓励精确数据。这种反向差异最能证明 preset 是真·行为切换，不是换皮。

## 它改了什么（相对默认包与古言包）

| 配置面 | 默认包（网文爽文） | 古言权谋包 | 硬科幻包 |
|---|---|---|---|
| `meta.display_name` | 大禹 | 大禹·古言权谋 | 大禹·硬科幻 |
| 红线 `hard_reject` | 可复现命令/内部标注 | **追加** 现代词泄漏、阿拉伯数字、感叹号章名、真实朝代影射 | **追加** 玄学词泄漏（`xianxia_leak` fatal）、伪科学滥用 |
| 阿拉伯数字 | 合法 | 禁（serious，`arabic_numeral_leak`） | **合法且鼓励**（精确数据是硬科幻命脉） |
| `classifier` | AI 味/油腻词 | + 古言语域跑偏 | + 技术万能/设定崩坏/玄学漂移/术语堆砌 |
| `anti_drift` | 冷感/炸裂漂移 | 失智/恋爱脑/计谋无代价/天降救兵 | 技术万能/设定失守/玄学化/科普注水/巧合解围 |
| `pacing_signals` | 成交/打脸/震惊 | + 收网/落子/廷争/构陷 | + 验证/校准/点火/对接/故障/失控/悖论 |
| `positioning_enums` | 打脸碾压/解谜智性… | 布局收网/智性博弈… | 技术碾压/硬核解谜/绝境求生/工程奇迹 |
| `rubric` | 人设30/结构25/连续20/文字25 | 人设30/权谋逻辑30/连续20/古言语域20 | 人设20/**科学自洽30**/连续20/硬核质感30 |
| `cool_points` | 每章明爽点/打脸 | 每章信息差变化/小收网 | 每章认知刷新/技术验证（须付代价） |
| `prompts.md` | 网文写作铁律 | 半文半白、谋略有代价、对手有反制 | 科学自洽、技术有代价边界、反玄学反万能、数据精确 |

## 能力边界（诚实说明）

| 风格体征 | 归属 | 例子 |
|---|---|---|
| 可计算 | L1/L2 规则（本包 rules.yaml） | 玄学词泄漏、伪科学句式、技术万能套话、术语堆砌、数据单位冲突 |
| 半可计算 | 弱信号（suspect + 证据） | 科普注水、纯情绪决策、天降黑科技、设定边界疑似冲突 |
| 只能语义 | L3 prompt（本包 prompts.md，交调用方 AI） | 科学自洽是否成立、设定说服力、技术代价是否合理、人性温度是否到位 |

**规则扫不出"科学设定是否真站得住"** —— 这是大禹一贯的边界。L1 能守住"别写成玄幻"，但"这套技术推演有没有说服力"必须交给 L3 语义评审与人类判断。

## 怎么用

`CDA_CONFIG_DIR` 在**进程启动时**读取（模块顶层加载），要在启动命令前设置：

```bash
pnpm build
export CDA_CONFIG_DIR=/绝对路径/novel-cda-mcp/presets/hard-scifi
node dist/index.js --doctor --json    # 应显示 大禹·硬科幻 / 0.2.0-scifi.1 / healthy=true
node dist/index.js                     # stdio 模式，供写稿 Agent 挂载
```

`--doctor` 输出应见：

```
display_name: 大禹·硬科幻
rule_version: 0.2.0-scifi.1
config_dir: .../presets/hard-scifi
```

不设 `CDA_CONFIG_DIR` 即用回默认网文包；指向别家 preset 互不影响。

### MCP 客户端配置示例

```json
{
  "mcpServers": {
    "novel-cda-scifi": {
      "command": "node",
      "args": ["/绝对路径/novel-cda-mcp/dist/index.js"],
      "env": {
        "CDA_CONFIG_DIR": "/绝对路径/novel-cda-mcp/presets/hard-scifi",
        "CDA_MCP_DATA": "/长期保留/无中文无空格/目录"
      }
    }
  }
}
```

## 验证

`test/regression.test.ts` 的 `多风格 preset · 硬科幻` 测试块固化了 6 个断言（含**双向反向验证**）：

1. preset 三件套齐全
2. 加载后 display_name/版本切换、规则一致性通过、4 个 prompt key 齐全
3. preset 的 doctor 健康（fail=0）
4. **玄学词差异**：「真气/金丹/筑基/意念移物」文本在默认包、古言包均通过，硬科幻包 `fatal=true`（`xianxia_leak`）
5. **反向数字差异**：「137.5米/2.4兆牛/0.3%」文本在古言包命中 `arabic_numeral_leak`，硬科幻包合法且非 fatal
6. 两风格互不污染：硬科幻包后切回古言包仍是古言规则

三包对同一批文本的判定矩阵：

| 文本 | 默认包 | 古言包 | 硬科幻包 |
|---|---|---|---|
| 玄学词（真气/金丹/筑基） | 通过 | 通过 | **fatal** |
| 精确数据（137.5米/0.3%） | 通过 | 命中数字泄漏 | 通过 |
| 现代词（手机/微信/186） | 通过 | **fatal** | 通过 |

跑法：`pnpm test`（22 单元 + smoke 全绿）。

## 设计要点（相对古言包的经验复用）

1. **保留通用基准判据**：`reproducible_command`、`internal_marker_leak`、`pacing_signals` 通用基准词、`word_bands.通用` 全部保留——doctor 自检样本依赖它们（古言包踩过删判据导致 fail 的坑）。
2. **玄学词必须放 L1 fatal，不能只放 L2 classifier**：最初把玄学词放在 `classifier.scifi_register`，结果只报 suspect、不 fatal；移到 `hard_reject.xianxia_leak` 后才真正硬拒。
3. **反向差异比单向差异更有说服力**：古言禁数字、硬科幻鼓励数字，这种"同一文本两包相反判定"是验证整包切换的最强证据。
4. **rubric 权重随风格重排**：古言把权重压在"权谋逻辑 30"，硬科幻压在"科学自洽 30 + 硬核质感 30"——权重分配本身就是风格宣言。

新增风格仍见 [主 README 的多风格章节](../../README.md#多风格预设preset) 与 [古言 preset README 的「如何新增」](../guyan-quanmou/README.md#如何新增一个风格-preset)。
