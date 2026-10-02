import React from 'react';
import { Check } from 'lucide-react';
import type { CompanyId } from '../types';
import { getCompany } from '../data/companies';
import { PASS_MARK, ROUND_LENGTH, packageFor } from '../engine';
import { CompanyWordmark } from '../kit';

const today = () =>
  new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

/** The offer or rejection letter, rendered as a sheet of paper. */
export const Letter: React.FC<{ company: CompanyId; correct: number }> = ({ company, correct }) => {
  const co = getCompany(company);
  const offer = correct >= PASS_MARK;
  const body = offer ? co.offer.body : co.rejection.body;

  return (
    <article className="paper tilt-in relative overflow-hidden p-5 md:p-8">
      <div className="flex items-start justify-between gap-3 border-b paper-rule pb-4">
        <div>
          <CompanyWordmark id={company} onPaper className="text-2xl md:text-3xl" />
          <div className="paper-muted mt-1 text-[11px]">{co.location}</div>
        </div>
        <div className="paper-muted text-right text-[11px] leading-relaxed">
          <div>{today()}</div>
          <div>To: Sachin</div>
        </div>
      </div>

      <h3 className="mt-4 text-[15px] font-bold md:text-base" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: 0 }}>
        {offer ? co.offer.subject : co.rejection.subject}
      </h3>

      <div className="mt-3 space-y-3 text-[13.5px] leading-relaxed">
        {body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {offer ? (
        <>
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 rounded-xl border paper-rule bg-white/70 p-4 text-[13px] sm:grid-cols-2">
            <div>
              <dt className="paper-muted text-[11px] font-semibold uppercase tracking-wide">Role</dt>
              <dd className="font-semibold">{co.offer.role}</dd>
            </div>
            <div>
              <dt className="paper-muted text-[11px] font-semibold uppercase tracking-wide">Package</dt>
              <dd className="text-lg font-black text-emerald-700">{packageFor(company, correct)}</dd>
            </div>
            <div>
              <dt className="paper-muted text-[11px] font-semibold uppercase tracking-wide">Interview score</dt>
              <dd className="font-semibold">
                {correct}/{ROUND_LENGTH}
              </dd>
            </div>
            <div>
              <dt className="paper-muted text-[11px] font-semibold uppercase tracking-wide">Joining</dt>
              <dd className="font-semibold">As per mutual agreement</dd>
            </div>
          </dl>

          <ul className="mt-4 space-y-1.5 text-[13px]">
            {co.offer.perks.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {p}
              </li>
            ))}
          </ul>

          <p className="paper-muted mt-4 text-[11.5px] leading-relaxed italic">{co.offer.finePrint}</p>
        </>
      ) : (
        <p className="paper-muted mt-4 rounded-xl border paper-rule bg-white/60 p-3 text-[12px]">
          Interview score: <strong className="text-gray-800">{correct}/{ROUND_LENGTH}</strong> · needed {PASS_MARK} to clear.
        </p>
      )}

      <div className="mt-6 flex items-end justify-between gap-3">
        <div className="text-[13px]">
          <div className="paper-muted text-[11px]">Regards,</div>
          <div className="font-semibold">{offer ? co.offer.signoff : co.rejection.signoff}</div>
        </div>
        <span
          className="stamp text-xs md:text-sm"
          style={offer ? { color: '#15803d', borderColor: '#15803d' } : undefined}
          aria-hidden
        >
          {offer ? 'OFFER' : 'REJECTED'}
        </span>
      </div>
    </article>
  );
};
