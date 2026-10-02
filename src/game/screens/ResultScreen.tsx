import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Inbox, Trophy } from 'lucide-react';
import { COMPANY_IDS, type GameState } from '../types';
import { getCompany } from '../data/companies';
import { SACHIN } from '../data/cast';
import { PASS_MARK, correctCount } from '../engine';
import { Avatar, Btn, CompanyMark } from '../kit';
import type { GameActions } from '../useGame';
import { celebrate } from '../../components/ui';
import { Letter } from './Letter';

export const ResultScreen: React.FC<{ game: GameState; actions: GameActions }> = ({ game, actions }) => {
  const company = game.active!;
  const co = getCompany(company);
  const correct = correctCount(game.runs[company]);
  const offer = correct >= PASS_MARK;
  const isLast = game.completed.length + 1 >= COMPANY_IDS.length;
  const inviteIncoming = game.completed.length + 2 < COMPANY_IDS.length;

  const [opened, setOpened] = useState(false);
  const celebrated = useRef(false);

  const open = () => {
    setOpened(true);
    actions.readMail(`result-${company}`);
    if (offer && !celebrated.current) {
      celebrated.current = true;
      celebrate('big');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-10 md:p-7" data-accent={co.accent}>
      {!opened ? (
        <div className="space-y-5 pt-4 md:pt-10">
          <div className="flex flex-col items-center text-center">
            <Avatar emoji={SACHIN.avatar} size={76} ring="rgba(232,121,249,0.5)" className="float" />
            <h2 className="font-display mt-4 text-2xl font-bold text-white">The verdict is here</h2>
            <p className="mt-1 max-w-sm text-[13px] text-[var(--muted)]">
              Sachin’s hands are shaking. Refresh. Refresh. Refresh. Then — a notification.
            </p>
          </div>

          <motion.button
            onClick={open}
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.5 }}
            className="card card-hover glow flex w-full items-center gap-3 p-4 text-left"
          >
            <CompanyMark id={company} size={46} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-fuchsia-300">📩 New mail · just now</div>
              <div className="truncate text-[14px] font-bold text-white">{co.invite.from}</div>
              <div className="truncate text-[12.5px] text-[var(--muted)]">Re: Your interview at {co.name}</div>
            </div>
            <span className="shrink-0 rounded-full bg-fuchsia-500 px-3.5 py-1.5 text-[11px] font-bold text-white">Open</span>
          </motion.button>
        </div>
      ) : (
        <>
          <Letter company={company} correct={correct} />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card flex items-center gap-3 p-4"
          >
            <Avatar emoji={SACHIN.avatar} size={44} ring={offer ? 'rgba(52,211,153,0.6)' : 'rgba(251,113,133,0.6)'} />
            <p className="text-[13px] leading-relaxed text-[var(--text)]">
              {offer
                ? 'LET’S GOOO! \u{1F389} Sachin does a tiny victory dance at his desk. Rohit looks suspicious.'
                : 'Sachin stares at “we regret to inform you” for a full minute. Then he opens LeetCode. \u{1F4AA}'}
            </p>
          </motion.div>

          <Btn onClick={actions.finishResult} className="w-full py-4">
            {isLast ? (
              <>
                <Trophy className="h-4 w-4" /> See the season finale
              </>
            ) : (
              <>
                <Inbox className="h-4 w-4" /> Back to the inbox
                {inviteIncoming && <span className="text-white/75">· a new invite just landed</span>}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Btn>
        </>
      )}
    </div>
  );
};
