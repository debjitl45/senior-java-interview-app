import type { Scenario } from '../../types';
import { ACT_ONE } from './act1';
import { ACT_TWO } from './act2';

export const SCENARIOS: Scenario[] = [...ACT_ONE, ...ACT_TWO];

const BY_ID: Record<string, Scenario> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

export const getScenario = (id: string): Scenario | undefined => BY_ID[id];

/** All variants for one story slot. */
export const scenariosForSlot = (slot: number): Scenario[] => SCENARIOS.filter((s) => s.slot === slot);
