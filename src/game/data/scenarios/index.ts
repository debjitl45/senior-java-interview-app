import type { Scenario, ScenarioCategory } from '../../types';
import { CLASSIC } from './classic';
import { CONFLICT } from './conflict';
import { IMPACT } from './impact';
import { COMMS } from './comms';
import { ROMANCE } from './romance';
import { POSH } from './posh';
import { WFO } from './wfo';
import { POLITICS } from './politics';
import { CAREER } from './career';

/** Every office scenario. One plays at the end of each in-game week. */
export const SCENARIOS: Scenario[] = [
  ...CLASSIC,
  ...CONFLICT,
  ...IMPACT,
  ...COMMS,
  ...ROMANCE,
  ...POSH,
  ...WFO,
  ...POLITICS,
  ...CAREER,
];

const BY_ID: Record<string, Scenario> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

export const getScenario = (id: string): Scenario | undefined => BY_ID[id];

export const CATEGORY_META: Record<ScenarioCategory, { label: string; emoji: string }> = {
  conflict: { label: 'Conflict resolution', emoji: '\u2694\uFE0F' },
  impact: { label: 'Impact vs busywork', emoji: '\u{1F3AF}' },
  comms: { label: 'Cross-team chaos', emoji: '\u{1F4E1}' },
  romance: { label: 'Office romance', emoji: '\u{1F498}' },
  posh: { label: 'POSH & safety', emoji: '\u{1F6E1}\uFE0F' },
  wfo: { label: 'Work from office', emoji: '\u{1F3E2}' },
  politics: { label: 'Office politics', emoji: '\u265F\uFE0F' },
  career: { label: 'Career crossroads', emoji: '\u{1F9ED}' },
};
