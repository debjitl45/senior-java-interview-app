import type { Company, CompanyId, CompanyKind, Tier } from '../../types';
import { AMAZIN, BASEBOOK, GOOGLY, MACROSOFT, NETFLUX } from './faang';
import { ENVYDIA, HPACKET, OOBER, PEAR, SALESFARCE } from './product';
import { BARCLAZE, GOLDMINE, JPMOREGAIN, KITTIBANK, MORTGAGE, WELLSCARGO } from './banks';
import { ACCENSHURE, INFOSIS, TEACS, TIPRO } from './services';
import { FLOPKART, PAYTYM, TWIGGY } from './startups';
import { AIRTELL, JIYO } from './telecom';
import { JHA2 } from './lala';

const ALL: Company[] = [
  GOOGLY,
  MACROSOFT,
  AMAZIN,
  BASEBOOK,
  NETFLUX,
  PEAR,
  ENVYDIA,
  GOLDMINE,
  OOBER,
  HPACKET,
  SALESFARCE,
  JPMOREGAIN,
  MORTGAGE,
  KITTIBANK,
  BARCLAZE,
  WELLSCARGO,
  TWIGGY,
  FLOPKART,
  PAYTYM,
  TIPRO,
  TEACS,
  INFOSIS,
  ACCENSHURE,
  AIRTELL,
  JIYO,
  JHA2,
];

export const COMPANIES = Object.fromEntries(ALL.map((c) => [c.id, c])) as Record<CompanyId, Company>;

/** Every company id, in job-portal order (dream companies first). */
export const COMPANY_IDS: CompanyId[] = ALL.map((c) => c.id);

export const getCompany = (id: CompanyId): Company => COMPANIES[id];

export const KIND_LABEL: Record<CompanyKind, string> = {
  product: 'Product',
  bank: 'Bank',
  service: 'Service',
  startup: 'Start-up',
  telecom: 'Telecom',
  lala: 'Lala',
};

export const TIER_LABEL: Record<Tier, string> = {
  S: 'Dream',
  A: 'Top',
  B: 'Solid',
  C: 'Easy',
};
