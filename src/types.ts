/**
 * 配置 schema 类型：rules.yaml / platforms.yaml 的编译期契约。
 * 让配置错误在进入工具层之前暴露，而不是散落成运行时的 undefined。
 * 说明：YAML 顶层字段可选（兼容外部语言包只覆盖部分字段），由 ruleConsistency() 做"必填且合法"的强校验。
 */

export interface PatternRule {
  id: string;
  pattern: string;
  limit?: number;
}

export interface ClassifierRule {
  id: string;
  desc?: string;
  level?: string;
  red_words?: string[];
  red_word_limit_per_chapter?: number;
  greasy_words?: string[];
  keywords?: string[];
  patterns?: PatternRule[];
}

export interface HardRejectRule {
  id: string;
  pattern: string;
  action: "reject" | "flag";
  level: "fatal" | "serious" | "minor";
  hint: string;
}

export interface DriftCallback {
  type: string;
  keywords: string[];
  symptom: string;
  callback: string;
}

export interface PersonaSignal {
  id: string;
  desc: string;
  pattern: string;
  level: string;
}

export interface AntiDriftConfig {
  persona_signals?: PersonaSignal[];
  callbacks?: DriftCallback[];
}

export interface TimeAnchorConfig {
  patterns?: string[];
  unordered_words?: string[];
  max_backward_jumps?: number;
}

export interface NumericConflictConfig {
  unit_pattern?: string;
  contradiction_words?: string[];
  window_chars?: number;
}

export interface EntityAliasConfig {
  patterns?: string[];
  min_occurrences?: number;
}

export interface SelfConsistencyConfig {
  enabled?: boolean;
  time_anchor?: TimeAnchorConfig;
  numeric_conflict?: NumericConflictConfig;
  entity_alias?: EntityAliasConfig;
}

export interface PacingConfig {
  enabled?: boolean;
  payoff_words?: string[];
  conflict_words?: string[];
  hook_words?: string[];
  payoff_per_2000_warn?: number;
  conflict_per_1000_warn?: number;
  hook_per_1000_warn?: number;
}

export interface RubricDimension {
  id: string;
  name: string;
  weight: number;
  max: number;
}

export interface RubricConfig {
  dimensions?: RubricDimension[];
  grades?: Record<string, string>;
  score_map?: Record<string, Record<string, number>>;
  verdict?: { pass?: number; revise?: number; fatal_overrides?: boolean };
  compliance_items?: string[];
}

export interface SopStep {
  step: number;
  name: string;
  tool: string;
  checks: string[];
}

export interface FactExtractConfig {
  enabled?: boolean;
  unit_pattern?: string;
  label_chars?: number;
  min_occurrences?: number;
  max_anchors?: number;
}

export interface ChapterBriefConfig {
  enabled?: boolean;
  max_avoid?: number;
  max_foreshadow?: number;
  overdue_chapters?: number;
}

export interface RulesMeta {
  name?: string;
  display_name?: string;
  slogan?: string;
  stages?: string[];
  note?: string;
}

/** rules.yaml 顶层结构 */
export interface RulesConfig {
  version?: string;
  meta?: RulesMeta;
  platforms?: Record<string, unknown>;
  hard_reject?: HardRejectRule[];
  classifier?: ClassifierRule[];
  anti_drift?: AntiDriftConfig;
  self_consistency?: SelfConsistencyConfig;
  pacing_signals?: PacingConfig;
  positioning_enums?: Record<string, string[]>;
  word_bands?: Record<string, Record<string, [number, number]>>;
  rubric?: RubricConfig;
  cool_points?: string[];
  event_rotation?: string[];
  sop?: { steps?: SopStep[] };
  fact_extract?: FactExtractConfig;
  chapter_brief?: ChapterBriefConfig;
}

// ---------------- 项目卡片结构（cards 存的是用户填入的 JSON，字段宽松但常用项具名）----------------

export interface CharacterCard {
  name: string;
  forbidden?: string[];
  traits?: string[];
  drift_signals?: string[];
  [k: string]: unknown;
}

export interface GoldfingerCard {
  name?: string;
  ability?: string;
  boundaries?: string[];
  legs?: unknown[];
  [k: string]: unknown;
}

export interface ToneCard {
  is?: string;
  isNot?: string;
  dimensions?: unknown[];
  [k: string]: unknown;
}

// ---------------- 判据层 / 闭环层返回结构 ----------------

/** L2 打分命中项 */
export interface L2Hit {
  id: string;
  desc?: string;
  level?: string;
  hits: number;
  counts: Record<string, number>;
  overLimit: boolean;
}

/** 弱信号嫌疑项（suspect，不判 fatal/reject） */
export interface Suspect {
  type: string;
  level: "suspect";
  evidence: string;
  note?: string;
  count?: number;
}

/** 节奏信号 */
export interface DensitySignal {
  count: number;
  per_2000?: number;
  per_1000?: number;
  warn_below?: number;
}
export interface PacingSignals {
  enabled: boolean;
  payoff?: DensitySignal;
  conflict?: DensitySignal;
  hook?: DensitySignal;
}

/** 事实契约校验冲突 */
export interface FactConflict {
  rule: string;
  type: "must_not" | "must_missing";
  pattern: string;
  note: string;
}

/** 事实抽取锚点 */
export interface FactAnchor {
  chapter_id: string;
  raw: string;
  value: number;
  unit: string;
  label: string;
  evidence: string;
}

/** 事实抽取的同单位多值冲突（专用结构，evidence 为多条原文证据） */
export interface FactSuspect {
  unit: string;
  value_set: number[];
  level: "suspect";
  evidence: string[];
  note: string;
}

/** 事实契约候选规则 */
export interface ContractRule {
  name: string;
  must_not: string[];
  must: string[];
  note: string;
}

/** extract_facts 返回 */
export interface FactExtraction {
  enabled: boolean;
  anchors: FactAnchor[];
  contract: { rules: ContractRule[] };
  conflicts: FactSuspect[];
  note?: string;
}

/** 事实契约输入（fact_check 用） */
export interface FactContract {
  rules?: ContractRule[];
}

/** 下一章约束块返回 */
export interface ChapterBrief {
  enabled: boolean;
  must_avoid: string[];
  must_include: string[];
  foreshadow_to_touch?: string[];
  stub_warning?: string | null;
  prompt: string;
  note?: string;
}

/** 伏笔超期提醒项 */
export interface OverdueItem {
  id: string;
  content: string;
  plantedAt: number;
  age: number;
  note: string;
}

/** 单章评审条目（批次报告中的一章） */
export interface ChapterReviewEntry {
  overall?: { verdict?: string; vetoes?: (string | { reason?: string; type?: string })[]; stub?: boolean };
  stages?: {
    red_team?: { attack_points?: { level?: string; suggestion?: string; type?: string }[] };
    second_review?: { issues?: { level?: string; suggestion?: string }[] };
  };
  problems?: string[];
  stub?: boolean;
  _single?: boolean;
  [k: string]: unknown;
}

/** 评审报告（next_chapter_brief 输入，结构松散，字段可选） */
export interface ReviewReport {
  chapter?: number | string;
  verdict?: string;
  problems?: string[];
  stub?: boolean;
  chapters?: Record<string, ChapterReviewEntry>;
  [k: string]: unknown;
}

/** 下一章约束选项 */
export interface BriefOptions {
  foreshadow?: string[];
  persona?: string;
  profile?: string;
}

/** 章节输入（extract_facts 用） */
export interface ChapterInput {
  id?: string | number;
  chapter_id?: string | number;
  text?: string;
}

export interface PlatformProfile {
  name: string;
  unsigned_traffic?: string;
  exclusive?: string;
  genres?: string[];
  patience?: string;
  title_min_chars?: number;
  daily_words?: [number, number];
  golden_window?: { conflict: number; golden_finger: number; payoff: number };
  [k: string]: unknown;
}

/** platforms.yaml 顶层结构 */
export interface PlatformsConfig {
  platforms: Record<string, PlatformProfile>;
}
