/**
 * 规则适配层：所有常量从 rules.yaml 读取（规则是"可迭代的代码"，不是死的 TS 常量）。
 * 保留原导出名，工具层无感切换；修改规则只改 yaml，不改代码。
 */
import { RULES } from "./config.js";
import type {
  ClassifierRule, HardRejectRule, DriftCallback, PersonaSignal,
  SopStep, RubricConfig,
} from "./types.js";

const cls = (id: string): ClassifierRule =>
  (RULES.classifier || []).find((c) => c.id === id) || { id };

const ai = cls("ai_flavor");
export const RED_WORDS: string[] = ai.red_words || [];
export const GREASY_WORDS: string[] = ai.greasy_words || [];
export const RED_WORD_LIMIT: number = ai.red_word_limit_per_chapter ?? 1;
export const SENTENCE_PATTERNS = {
  notButA: { label: '"不是A，而是B"', limit: (ai.patterns || []).find((p) => p.id === "not_a_but_b")?.limit ?? 2 },
  thisIsX: { label: '"这，就是XX"', limit: (ai.patterns || []).find((p) => p.id === "this_is_x")?.limit ?? 1 },
};

export const POSITIONING_ENUMS: Record<string, string[]> = RULES.positioning_enums || {};
export const WORD_BANDS: Record<string, Record<string, [number, number]>> = RULES.word_bands || {};
export const HARD_REJECT: HardRejectRule[] = RULES.hard_reject || [];
export const CLASSIFIER: ClassifierRule[] = RULES.classifier || [];
export const ANTI_DRIFT = RULES.anti_drift || {};
export const DRIFT_TYPES: DriftCallback[] = ANTI_DRIFT.callbacks || [];
export const PERSONA_SIGNALS: PersonaSignal[] = ANTI_DRIFT.persona_signals || [];
export const SELF_CONSISTENCY = RULES.self_consistency || {};
export const PACING = RULES.pacing_signals || {};

const rubric: RubricConfig = RULES.rubric || {};
export const SCORE_ANCHORS: Record<string, Record<string, number>> = rubric.score_map || {};
export const GRADE_LABELS: Record<string, string> = rubric.grades || {};
export const COMPLIANCE_ITEMS: string[] = rubric.compliance_items || [];
export const SOP_STEPS: SopStep[] = RULES.sop?.steps || [];
export const COOL_POINT_RULES: string[] = RULES.cool_points || [];
export const EVENT_ROTATION: string[] = RULES.event_rotation || [];
export const RUBRIC_VERDICT: NonNullable<RubricConfig["verdict"]> = rubric.verdict || {};
