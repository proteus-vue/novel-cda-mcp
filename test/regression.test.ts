/**
 * 回归测试：把 P0/P1 修复固化为自动化断言（对齐 novel-review-mcp 的 selfcheck 思路，但用真断言而非 console.log）。
 * 覆盖：路径穿越拦截、路径边界纵深防御、原子写、规则一致性、枚举单一来源、形象名对外可见、L1 短路。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const TMP = path.join(os.tmpdir(), `cda-regression-${process.pid}`);

/** 用隔离数据目录重新加载 store/config（模块加载时读取 env，故需 resetModules） */
async function freshModules(cfgDir?: string) {
  process.env.CDA_MCP_DATA = TMP;
  if (cfgDir) process.env.CDA_CONFIG_DIR = cfgDir;
  else delete process.env.CDA_CONFIG_DIR;
  vi.resetModules();
  const store = await import("../src/store.js");
  const config = await import("../src/config.js");
  return { store, config };
}

beforeEach(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });
});
afterEach(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
  delete process.env.CDA_MCP_DATA;
  delete process.env.CDA_CONFIG_DIR;
});

describe("P0 · 路径穿越防护", () => {
  it("assertSafeId 拒绝 ../ / 绝对路径 / 空 / 超长", async () => {
    const { store } = await freshModules();
    for (const bad of ["../../etc/evil", "/etc/passwd", "a/b", "", "x".repeat(65), "a b"]) {
      expect(() => store.assertSafeId(bad), `应拒绝: ${bad}`).toThrow();
    }
    for (const good of ["默者", "book-01", "Test_书", "a1"]) {
      expect(() => store.assertSafeId(good), `应允许: ${good}`).not.toThrow();
    }
  });

  it("loadProject 对恶意 id 抛错，且不越界读取文件系统", async () => {
    const { store } = await freshModules();
    expect(() => store.loadProject("../../etc/passwd")).toThrow(/非法项目 ID/);
  });
});

describe("P0 · 原子写", () => {
  it("saveProject 写入后目标是合法 JSON 且无 .tmp 残留", async () => {
    const { store } = await freshModules();
    const p = store.createProject("原子书", {}, {});
    p.cards.hardData = { 银子: "500两" };
    store.saveProject(p);
    const dir = path.join(TMP, "projects");
    const files = fs.readdirSync(dir);
    expect(files).toContain("原子书.json");
    expect(files.some((f) => f.endsWith(".tmp"))).toBe(false);
    expect(JSON.parse(fs.readFileSync(path.join(dir, "原子书.json"), "utf8")).cards.hardData).toEqual({ 银子: "500两" });
  });

  it("rename 失败时清理临时文件、保留原文件不损坏", async () => {
    const { store } = await freshModules();
    const p = store.createProject("持久书", {}, {});
    const dir = path.join(TMP, "projects");
    const target = path.join(dir, "持久书.json");
    const before = fs.readFileSync(target, "utf8");

    const renameSpy = vi.spyOn(fs, "renameSync").mockImplementation(() => { throw new Error("模拟中断"); });
    try {
      expect(() => store.saveProject(p)).toThrow("模拟中断");
      expect(fs.readFileSync(target, "utf8")).toBe(before); // 原文件完好
      expect(fs.readdirSync(dir).some((f) => f.endsWith(".tmp"))).toBe(false); // tmp 已清理
    } finally {
      renameSpy.mockRestore();
    }
  });
});

describe("P1 · 配置单一来源与一致性", () => {
  it("ruleConsistency 对默认配置返回空（一致）", async () => {
    const { config } = await freshModules();
    expect(config.ruleConsistency()).toEqual([]);
  });

  it("定位枚举来自 yaml：外部语言包切换即时生效，不改代码", async () => {
    const pack = path.join(TMP, "pack");
    fs.mkdirSync(pack, { recursive: true });
    for (const f of ["rules.yaml", "platforms.yaml", "prompts.md"]) {
      fs.copyFileSync(path.join(process.cwd(), "src", f), path.join(pack, f));
    }
    const rulesPath = path.join(pack, "rules.yaml");
    const yaml = fs.readFileSync(rulesPath, "utf8").replace(
      /爽点类型: \[[^\]]*\]/, "爽点类型: [测试爽点甲, 测试爽点乙]"
    );
    fs.writeFileSync(rulesPath, yaml, "utf8");

    const { config } = await freshModules(pack);
    const rules = await import("../src/rules.js");
    expect(rules.POSITIONING_ENUMS["爽点类型"]).toEqual(["测试爽点甲", "测试爽点乙"]);
    expect(config.listProfiles().display_name).toBeTruthy();
  });

  it("形象名对外可见：display_name=大禹、slogan=笼中跳舞", async () => {
    const { config } = await freshModules();
    const prof = config.listProfiles();
    expect(prof.display_name).toBe("大禹");
    expect(prof.slogan).toBe("笼中跳舞");
  });
});

describe("判据层不退化", () => {
  it("L1 形态红线毫秒级 fatal 短路", async () => {
    const layers = await import("../src/layers.js");
    const hits = layers.l1_check("他执行了 rm -rf /var/log/archive 改数据库");
    expect(hits.some((h) => h.id === "reproducible_command")).toBe(true);
    expect(layers.hasHardReject(hits)).toBe(true);
  });
});

describe("doctor 全栈诊断", () => {
  it("健康态：默认配置下无 fail，summary.healthy=true", async () => {
    await freshModules();
    const { doctor } = await import("../src/doctor.js");
    const report = doctor();
    expect(report.summary.fail).toBe(0);
    expect(report.summary.healthy).toBe(true);
    expect(report.display_name).toBe("大禹");
    expect(report.items.some((i) => i.group === "数据")).toBe(true);
  });

  it("能识别损坏的项目 JSON 并判为不健康", async () => {
    await freshModules();
    const projectsDir = path.join(TMP, "projects");
    fs.mkdirSync(projectsDir, { recursive: true });
    fs.writeFileSync(path.join(projectsDir, "坏书.json"), "{bad json", "utf8");
    const { doctor } = await import("../src/doctor.js");
    const report = doctor();
    expect(report.summary.fail).toBeGreaterThan(0);
    expect(report.summary.healthy).toBe(false);
    expect(report.items.some((i) => i.group === "数据" && i.level === "fail" && i.name.includes("坏书"))).toBe(true);
  });

  it("formatDoctor 输出含汇总行且无 emoji", async () => {
    await freshModules();
    const { doctor, formatDoctor } = await import("../src/doctor.js");
    const text = formatDoctor(doctor());
    expect(text).toMatch(/汇总:.*通过.*提醒.*失败/);
    expect(text).toContain("健康");
    expect(/[\u{1F300}-\u{1FAFF}]/u.test(text)).toBe(false);
  });
});

describe("多风格 preset · CDA_CONFIG_DIR 整包切换", () => {
  const PRESET = path.resolve(__dirname, "../presets/guyan-quanmou");

  it("古言 preset 存在且三件套齐全", () => {
    for (const f of ["rules.yaml", "platforms.yaml", "prompts.md"]) {
      expect(fs.existsSync(path.join(PRESET, f)), `缺 ${f}`).toBe(true);
    }
  });

  it("加载 preset 后 display_name/版本切换，且规则一致性通过", async () => {
    const { config } = await freshModules(PRESET);
    expect(config.RULES.meta?.display_name).toBe("大禹·古言权谋");
    expect(config.RULE_VERSION).toMatch(/guyan/);
    expect(config.CONFIG_DIR).toBe(PRESET);
    expect(config.ruleConsistency()).toEqual([]);
    expect(Object.keys(config.PROMPTS).sort()).toEqual(
      ["build_system_prompt", "chapter_review_prompt", "next_chapter_brief_prompt", "periodic_audit_prompt"]
    );
  });

  it("古言 preset 的 doctor 健康（fail=0）", async () => {
    await freshModules(PRESET);
    const { doctor } = await import("../src/doctor.js");
    const report = doctor();
    expect(report.summary.fail).toBe(0);
    expect(report.summary.healthy).toBe(true);
    expect(report.display_name).toBe("大禹·古言权谋");
  });

  it("行为差异：现代词在古言包下 fatal，默认包下不 fatal", async () => {
    const modernText = "他掏出手机看了眼微信，见有186条未读。";
    // 默认包
    await freshModules();
    const def = await import("../src/layers.js");
    const defFatal = def.hasHardReject(def.l1_check(modernText));
    // 古言包
    await freshModules(PRESET);
    const gy = await import("../src/layers.js");
    const gyHits = gy.l1_check(modernText);
    const gyFatal = gy.hasHardReject(gyHits);
    expect(defFatal).toBe(false);
    expect(gyFatal).toBe(true);
    expect(gyHits.map((h: { id: string }) => h.id)).toContain("modern_word_leak");
    expect(gyHits.map((h: { id: string }) => h.id)).toContain("arabic_numeral_leak");
  });

  it("切回默认包后不被 preset 污染", async () => {
    await freshModules(PRESET);
    const { config } = await freshModules();
    expect(config.RULES.meta?.display_name).toBe("大禹");
    expect(config.RULE_VERSION).not.toMatch(/guyan/);
    expect(config.ruleConsistency()).toEqual([]);
  });
});

describe("多风格 preset · 硬科幻（hard-scifi）", () => {
  const PRESET = path.resolve(__dirname, "../presets/hard-scifi");
  const GUYAN = path.resolve(__dirname, "../presets/guyan-quanmou");

  it("硬科幻 preset 存在且三件套齐全", () => {
    for (const f of ["rules.yaml", "platforms.yaml", "prompts.md"]) {
      expect(fs.existsSync(path.join(PRESET, f)), `缺 ${f}`).toBe(true);
    }
  });

  it("加载后 display_name/版本切换，一致性通过，prompt key 齐全", async () => {
    const { config } = await freshModules(PRESET);
    expect(config.RULES.meta?.display_name).toBe("大禹·硬科幻");
    expect(config.RULE_VERSION).toMatch(/scifi/);
    expect(config.CONFIG_DIR).toBe(PRESET);
    expect(config.ruleConsistency()).toEqual([]);
    expect(Object.keys(config.PROMPTS).sort()).toEqual(
      ["build_system_prompt", "chapter_review_prompt", "next_chapter_brief_prompt", "periodic_audit_prompt"]
    );
  });

  it("硬科幻 preset 的 doctor 健康（fail=0）", async () => {
    await freshModules(PRESET);
    const { doctor } = await import("../src/doctor.js");
    const report = doctor();
    expect(report.summary.fail).toBe(0);
    expect(report.summary.healthy).toBe(true);
    expect(report.display_name).toBe("大禹·硬科幻");
  });

  it("行为差异：玄学词在硬科幻包下 fatal，默认/古言包下通过", async () => {
    const mysticText = "他运转真气结成金丹，终于突破筑基期，意念移物不在话下。";
    await freshModules();
    const def = await import("../src/layers.js");
    expect(def.hasHardReject(def.l1_check(mysticText))).toBe(false);
    await freshModules(GUYAN);
    const gy = await import("../src/layers.js");
    expect(gy.hasHardReject(gy.l1_check(mysticText))).toBe(false);
    await freshModules(PRESET);
    const sf = await import("../src/layers.js");
    const sfHits = sf.l1_check(mysticText);
    expect(sf.hasHardReject(sfHits)).toBe(true);
    expect(sfHits.map((h: { id: string }) => h.id)).toContain("xianxia_leak");
  });

  it("反向差异：阿拉伯数字数据在古言包命中，硬科幻包合法", async () => {
    const dataText = "飞船长137.5米，推力2.4兆牛，轨道高度400公里，误差0.3%。";
    await freshModules(GUYAN);
    const gy = await import("../src/layers.js");
    expect(gy.l1_check(dataText).map((h: { id: string }) => h.id)).toContain("arabic_numeral_leak");
    await freshModules(PRESET);
    const sf = await import("../src/layers.js");
    expect(sf.l1_check(dataText).map((h: { id: string }) => h.id)).not.toContain("arabic_numeral_leak");
    expect(sf.hasHardReject(sf.l1_check(dataText))).toBe(false);
  });

  it("两风格互不污染：硬科幻包后切回古言包仍是古言规则", async () => {
    await freshModules(PRESET);
    const { config } = await freshModules(GUYAN);
    expect(config.RULES.meta?.display_name).toBe("大禹·古言权谋");
    expect(config.RULE_VERSION).toMatch(/guyan/);
    expect(config.ruleConsistency()).toEqual([]);
  });
});

describe("多风格 preset · 轻喜剧（qing-xiju）", () => {
  const PRESET = path.resolve(__dirname, "../presets/qing-xiju");
  const GUYAN = path.resolve(__dirname, "../presets/guyan-quanmou");
  const SCIFI = path.resolve(__dirname, "../presets/hard-scifi");

  it("轻喜剧 preset 存在且三件套齐全", () => {
    for (const f of ["rules.yaml", "platforms.yaml", "prompts.md"]) {
      expect(fs.existsSync(path.join(PRESET, f)), `缺 ${f}`).toBe(true);
    }
  });

  it("加载后 display_name/版本切换，一致性通过，prompt key 齐全", async () => {
    const { config } = await freshModules(PRESET);
    expect(config.RULES.meta?.display_name).toBe("大禹·轻喜剧");
    expect(config.RULE_VERSION).toMatch(/xiju/);
    expect(config.CONFIG_DIR).toBe(PRESET);
    expect(config.ruleConsistency()).toEqual([]);
    expect(Object.keys(config.PROMPTS).sort()).toEqual(
      ["build_system_prompt", "chapter_review_prompt", "next_chapter_brief_prompt", "periodic_audit_prompt"]
    );
  });

  it("轻喜剧 preset 的 doctor 健康（fail=0）", async () => {
    await freshModules(PRESET);
    const { doctor } = await import("../src/doctor.js");
    const report = doctor();
    expect(report.summary.fail).toBe(0);
    expect(report.summary.healthy).toBe(true);
    expect(report.display_name).toBe("大禹·轻喜剧");
  });

  it("苦情文本只在轻喜剧包 fatal，其余三包通过", async () => {
    const sadText = "他吐血倒地，心如刀绞，她泪如雨下，两人就此生离死别。";
    await freshModules();
    const def = await import("../src/layers.js");
    expect(def.hasHardReject(def.l1_check(sadText))).toBe(false);
    await freshModules(GUYAN);
    const gy = await import("../src/layers.js");
    expect(gy.hasHardReject(gy.l1_check(sadText))).toBe(false);
    await freshModules(SCIFI);
    const sf = await import("../src/layers.js");
    expect(sf.hasHardReject(sf.l1_check(sadText))).toBe(false);
    await freshModules(PRESET);
    const xj = await import("../src/layers.js");
    const xjHits = xj.l1_check(sadText);
    expect(xj.hasHardReject(xjHits)).toBe(true);
    expect(xjHits.map((h: { id: string }) => h.id)).toContain("melodrama_leak");
  });

  it("网络口语在古言包 fatal、轻喜剧包合法", async () => {
    const oralText = "他掏出手机看了眼微信，见有186条未读，直呼好家伙。";
    await freshModules(GUYAN);
    const gy = await import("../src/layers.js");
    expect(gy.hasHardReject(gy.l1_check(oralText))).toBe(true);
    await freshModules(PRESET);
    const xj = await import("../src/layers.js");
    expect(xj.hasHardReject(xj.l1_check(oralText))).toBe(false);
  });

  it("三风格互不污染：轻喜剧包后切回硬科幻包仍是硬科幻规则", async () => {
    await freshModules(PRESET);
    const { config } = await freshModules(SCIFI);
    expect(config.RULES.meta?.display_name).toBe("大禹·硬科幻");
    expect(config.RULE_VERSION).toMatch(/scifi/);
    expect(config.ruleConsistency()).toEqual([]);
  });
});
