import React from 'react';
import type { GameState } from '../types';
import type { GameActions } from '../useGame';
import { Lobby } from './interview/Lobby';
import { TechRound } from './interview/TechRound';
import { HrRound } from './interview/HrRound';

/** Interview day: reception, two technical rounds, then HR. */
export const InterviewScreen: React.FC<{ game: GameState; actions: GameActions }> = ({ game, actions }) => {
  const s = game.interview;
  if (!s) return null;
  if (s.stage === 'lobby') return <Lobby session={s} actions={actions} />;
  if (s.stage === 'tech') return <TechRound key={s.mailId} session={s} actions={actions} />;
  return <HrRound key={s.mailId} game={game} session={s} actions={actions} />;
};
