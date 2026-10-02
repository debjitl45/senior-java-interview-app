import type { Company, CompanyId } from '../../types';
import { GOOGLY } from './googly';
import { TIPRO } from './tipro';
import { TWIGGY } from './twiggy';
import { JHA2 } from './jha2';

export const COMPANIES: Record<CompanyId, Company> = {
  googly: GOOGLY,
  tipro: TIPRO,
  twiggy: TWIGGY,
  jha2: JHA2,
};

export const getCompany = (id: CompanyId): Company => COMPANIES[id];
