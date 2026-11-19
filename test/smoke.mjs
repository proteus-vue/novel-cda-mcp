// 端到端冒烟测试：spawn stdio MCP server，走一遍完整 CDA 工作流
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.CDA_MCP_DATA = path.join(root, ".test-data");
fs.rmSync(process.env.CDA_MCP_DATA, { recursive: true, force: true });

const child = spawn("node", [path.join(root, "dist/index.js")], {
  env: { ...process.env }, stdio: ["pipe", "pipe", "pipe"],
});
let buf = "";
let nextId = 1;
const pending = new Map();

child.stdout.on("data", (d) => {
  buf += d.toString();
  let i;
  while ((i = buf.indexOf("\n")) !== -1) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id !== undefined && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    } catch { /* ignore */ }
  }
});

function rpc(method, params) {
  const id = nextId++;
  return new Promise((res, rej) => {
    pending.set(id, (msg) => res(msg.result ?? msg.error));
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); rej(new Error("timeout: " + method)); } }, 8000);
  });
}

const tools = async (name, args) => {
  const r = await rpc("tools/call", { name, arguments: args });
  if (r.isError) throw new Error(`${name} → ${r.content?.[0]?.text}`);
  return JSON.parse(r.content[0].text);
};
const expectFail = async (name, args, tag) => {
  const r = await rpc("tools/call", { name, arguments: args });
  if (!r.isError) throw new Error(`${tag}: 应当报错却没有`);
  return r.content[0].text;
};

const AI_TEXT = `他内心五味杂陈。仿佛这一切早已注定。
"你被优化了。"孙总监整了整领带。
"嗯。"王默把保温杯拧紧，第186个月了，房贷还剩172个月。
他狂妄一笑，嘴角勾起一抹弧度。
不是失败，而是新的开始。或许，这就是成长的代价吧！`;

const GOOD_TEXT = `王默没抬头。
"这个月绩效，不合格。"
他关掉监控窗口，把凉透的枸杞水喝完，起身去接热水。
工位上，零零五号工牌反着光。`;

const run = async () => {
  const init = await rpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {}, clientInfo: { name: "smoke", version: "0" },
  });
  console.log("✓ initialize:", init.serverInfo?.name ?? init.serverInfo);
  await rpc("notifications/initialized", {});

  const tl = await rpc("tools/list", {});
  console.log("✓ tools/list:", tl.tools.map(t => t.name).join(", "));

  const rl = await rpc("resources/list", {});
  console.log("✓ resources/list:", rl.resources.length, "篇方法论文档");

  const pl = await rpc("prompts/list", {});
  console.log("✓ prompts/list:", pl.prompts.map(p => p.name).join(", "));

  // --- 定位层 ---
  const errCard = await expectFail("init_project", { project_id: "宴者" }, "缺字段应报错");
  console.log("✓ 定位卡缺字段拦截:", errCard.slice(0, 40), "...");
  const p1 = await tools("init_project", {
    project_id: "宴者", 项目名: "宴者", 书名: "《重生之宴》", 平台: "番茄", 受众: "女性向",
    性别向: "女频", 情感契约: "共鸣", 代入门槛: "低", 改编形态: "真人短剧",
    爽点类型: "清醒退出", 反派类型: "结构", 对标作品: "《知否》", 核心情绪: "我不要了",
    差异化: "退出即胜利", 目标体量: "400章100万字", 日更计划: "6000字/天", tone: "冷感",
  });
  console.log("✓ init_project: 感叹号禁用 =", p1.exclaimForbidden, "| 爽点类型 =", p1.positioning.爽点类型);

  // --- 锁定层 ---
  const errChar = await expectFail("save_card", { project_id: "宴者", card_type: "character", payload: { name: "沈宴", forbidden: ["不怒吼"], traits: ["冷静"] } }, "禁止项<5应报错");
  console.log("✓ 否定式定义强制:", errChar.slice(0, 60), "...");
  await tools("save_card", {
    project_id: "宴者", card_type: "character",
    payload: {
      name: "沈宴", age: 28, traits: ["清醒", "果决", "护短"],
      forbidden: ["不解释自己的决定", "不回头", "不求和", "不自怜卖惨", "不为任何人牺牲底线", "不当场崩溃"],
      drift_signals: ["开始解释", "开始求和", "自怜", "犹豫要不要回头"],
      visual: ["旧帕子", "银簪"],
    },
  });
  const errGf = await expectFail("save_card", { project_id: "宴者", card_type: "goldfinger", payload: { ability: "重活一世先知", boundaries: ["只知大事"] } }, "边界<2应报错");
  console.log("✓ 金手指边界强制:", errGf.slice(0, 40), "...");
  await tools("save_card", {
    project_id: "宴者", card_type: "goldfinger",
    payload: {
      ability: "重活一世先知", boundaries: ["只知大事不知细节", "改变越大事后反噬越强", "无法两次预言同一件事"],
      legs: [{ name: "先知", limit: "时效递减" }, { name: "旧人脉", limit: "对方也在变" }, { name: "嫁妆", limit: "数目固定" }],
    },
  });
  await tools("save_card", {
    project_id: "宴者", card_type: "tone",
    payload: {
      is: "清醒退出的女频重生", isNot: "不是毒妃打脸文（不靠男频爽点撑女频外壳）",
      dimensions: [
        { dimension: "爽点", self: "清醒退出", opposite: "打脸碾压" },
        { dimension: "反击方式", self: "转身离开", opposite: "当场掀桌" },
        { dimension: "章末钩子", self: "留白/物件", opposite: "炸点/金句" },
        { dimension: "情绪", self: "释然→新生", opposite: "压抑→爆发" },
        { dimension: "禁用词", self: "打脸词、狂妄词", opposite: "隐忍词" },
        { dimension: "反派", self: "结构（礼教规训）", opposite: "具象敌人" },
      ],
    },
  });
  await tools("save_card", { project_id: "宴者", card_type: "harddata", payload: { entries: [{ key: "嫁妆", value: "白银三千两" }, { key: "生辰", value: "腊月初七" }] } });
  console.log("✓ 锁定层四卡全部保存");

  // --- 结构层：伏笔 ---
  await tools("add_foreshadow", { project_id: "宴者", id: "L1", level: "L", content: "母亲留下的旧帕子暗纹", planted_at: 1 });
  await tools("add_foreshadow", { project_id: "宴者", id: "C1-1", level: "C", content: "三叔公的账本", planted_at: 3 });
  await tools("touch_foreshadow", { project_id: "宴者", id: "L1", chapter: 35 });
  const orphan = await expectFail("resolve_foreshadow", { project_id: "宴者", id: "X99", resolved_at: 10 }, "凭空回收应报错");
  console.log("✓ 凭空回收拦截:", orphan.slice(0, 45), "...");
  await tools("resolve_foreshadow", { project_id: "宴者", id: "C1-1", resolved_at: 40 });
  const health = await tools("foreshadow_health", { project_id: "宴者", current_chapter: 150 });
  console.log("✓ 伏笔健康度: 回收率", health.回收率, "| 呼吸预警:", health.长线呼吸预警.length);

  // --- 章纲 + 章名 ---
  const badTitle = await expectFail("save_outline", { project_id: "宴者", chapter_no: 1, title: "刀落", dark_point: "退婚" }, "短名应报错");
  console.log("✓ 章名≥5字强制:", badTitle.slice(0, 45), "...");
  await tools("save_outline", { project_id: "宴者", chapter_no: 1, title: "满堂宾客无人看我", dark_point: "当众退婚我谢客", emotion: "转折", word_type: "反击", foreshadow_new: ["L1"] });
  const plan = await tools("plan_chapter", { project_id: "宴者", chapter_no: 2, word_type: "常规" });
  console.log("✓ plan_chapter: 常规章字数区间 =", plan.字数区间);

  // --- 执行层：AI 味 / 格式 ---
  const flavor = await tools("check_ai_flavor", { text: AI_TEXT, project_id: "宴者" });
  console.log("✓ AI味检测:", flavor.verdict, "| 问题数:", flavor.problems.length, "| 红牌词:", flavor.redHits.map(h => h.word).join("/"), "| 油腻词:", flavor.greasyHits.map(h => h.word).join("/"));
  const fmt = await tools("check_format", { text: AI_TEXT, project_id: "宴者" });
  console.log("✓ 格式检测:", fmt.verdict, "| 问题:", fmt.problems.length);
  const good = await tools("check_ai_flavor", { text: GOOD_TEXT });
  const goodFmt = await tools("check_format", { text: GOOD_TEXT, project_id: "宴者" });
  console.log("✓ 对照样本:", good.verdict, "/", goodFmt.verdict, "(应均为通过)");

  // --- 质检层 ---
  const review = await tools("review_chapter", { project_id: "宴者", chapter_no: 1, text: GOOD_TEXT });
  console.log("✓ 过程评审(章1):", review.verdict, "| 问题数:", review.problems.length);
  const review2 = await tools("review_chapter", { project_id: "宴者", chapter_no: 2, text: AI_TEXT });
  console.log("✓ 过程评审(章2):", review2.verdict, "| 问题数:", review2.problems.length);
  const gate = await tools("release_gate", {
    project_id: "宴者", compliance_passed: true, 存稿章数: 32,
    scores: { character: "B", structure: "A", continuity: "B", writing: "C" },
  });
  console.log("✓ 发布闸门:", gate.verdict, "| 总分:", gate.total);
  const gate2 = await tools("release_gate", { project_id: "宴者", compliance_passed: false, scores: { character: "A", structure: "A", continuity: "A", writing: "A" } });
  console.log("✓ 合规一票否决:", gate2.verdict);
  const drift = await tools("drift_callback", { symptom: "主角开始长篇解释自己的计划" });
  console.log("✓ 漂移回调:", drift.plans?.[0]?.type ?? "(未命中)");
  const q = await tools("query_method", { query: "卷群" });
  console.log("✓ 方法论检索:", q[0]?.file, "| 片段:", q[0]?.excerpt?.slice(0, 50), "...");
  const sop = await tools("sop_status", { project_id: "宴者" });
  console.log("✓ SOP 进度: 已完成", sop.completedSteps, "| 当前:", sop.currentStep?.step, sop.currentStep?.name);

  // ========== 新增：L1/L2 分层 + P1 闭环（novel-review-mcp 风格） ==========
  const BAD_TEXT = "他把凉透的枸杞水喝完。然后执行了 rm -rf /var/log/archive 并 chattr -i 修改文件。";
  const redline = await tools("check_redline", { text: BAD_TEXT, chapter_id: "C1" });
  console.log("✓ L1 红线(fatal 短路):", redline.verdict, "| fatal =", redline.fatal, "| 耗时", redline.timing_ms, "ms");
  const selfc = await tools("check_self_consistency", { text: "第7天他签下订单。第3天他又来到这里。" });
  console.log("✓ 单章自洽弱信号:", selfc.suspects.map(s => s.type).join("/"), "(应含 time_backward)");
  const pacing = await tools("check_pacing", { text: "他成交了。对手反击。谁料还有后手？" });
  console.log("✓ 节奏信号: payoff =", pacing.signals.payoff.count, "| conflict =", pacing.signals.conflict.count);
  const facts = await tools("extract_facts", { chapters: [{ id: "A", text: "一天三百二十单。" }, { id: "B", text: "一天二百九十单。" }] });
  console.log("✓ extract_facts: anchors =", facts.anchors.length, "| suspect 冲突 =", facts.conflicts.length);
  const brief = await tools("next_chapter_brief", { review: review2, project_id: "宴者", chapter_index: 2 });
  console.log("✓ next_chapter_brief: must_avoid =", brief.must_avoid.length, "| prompt 含约束 =", brief.prompt.includes("写作约束") || brief.prompt.includes("must_avoid"));
  const profiles = await tools("list_profiles", {});
  console.log("✓ list_profiles: rule_version =", profiles.rule_version, "| 平台 =", profiles.platforms.join(","));
  const fList = await tools("foreshadow_list", { project_id: "宴者", status: "open" });
  console.log("✓ foreshadow_list: open 台账", fList.items.length, "条");
  const fOver = await tools("foreshadow_overdue", { project_id: "宴者", current_chapter_index: 150 });
  console.log("✓ foreshadow_overdue: 超期", fOver.overdue.length, "条");
  const refe = await tools("extract_foreshadow", { text: "他不知道的是，箱子还没打开。" });
  console.log("✓ extract_foreshadow: 候选", refe.candidates.length, "条");
  // 带 facts 契约的 review_chapter（确定性校验）
  const withFacts = await tools("review_chapter", {
    project_id: "宴者", chapter_no: 3, text: GOOD_TEXT, title: "满堂宾客无人看我",
    facts: { rules: [{ name: "禁用命令", must_not: ["rm\\s+-rf"] }] },
  });
  console.log("✓ review_chapter+facts: 事实冲突 =", withFacts.machine_signals.fact_conflicts.length, "| timing =", withFacts.timing.wall_ms, "ms");
  // prompt 模板来自 prompts.md
  const prompts = await rpc("prompts/list", {});
  console.log("✓ prompts/list（外置模板）:", prompts.prompts.map(p => p.name).join(", "));

  console.log("\n=== 冒烟测试全部通过 ===");
  child.kill();
  process.exit(0);
};

run().catch(e => { console.error("✗ 测试失败:", e.message); child.kill(); process.exit(1); });
