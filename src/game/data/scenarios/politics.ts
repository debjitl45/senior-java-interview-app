import type { Scenario } from '../../types';

/** Office politics: lists, favourites, promotions, layoffs and paper trails. */
export const POLITICS: Scenario[] = [
  {
    id: 'reorg_rumor',
    category: 'politics',
    codename: 'OPERATION: THE LIST',
    location: 'Rakesh’s cabin · door closed',
    briefing: 'Layoff rumours have been everywhere for a week. Rakesh calls Sachin in, closes the door and lowers his voice.',
    dialogue: [
      { who: 'rakesh', line: 'This stays between us. Leadership wants a “criticality ranking” of the team. Help me rank everyone — who could we... do without?' },
    ],
    prompt: 'Sachin is being asked to rank his friends. What does he do?',
    choices: [
      { id: 'rr-objective', tone: 'Diplomatic', verdict: 'best', text: 'Offer an objective skills-and-coverage matrix instead — who owns which systems, where the single points of failure are — and keep the conversation confidential.', outcome: 'Rakesh uses the matrix in his discussion with Meera; it shapes decisions around real risk instead of favourites. Nobody ever learns you were asked.', lesson: 'When asked to judge people, steer toward objective criteria. And keep confidential conversations confidential.', effects: { reputation: 5, charisma: 2, sanity: -2 } },
      { id: 'rr-decline', tone: 'Honest', verdict: 'okay', text: 'Politely decline to rank your peers.', outcome: 'Rakesh respects it, a little disappointed. He makes the list without you.', lesson: 'Declining is principled; offering a better alternative is more useful.', effects: { reputation: 1 } },
      { id: 'rr-revenge', tone: 'Savage', verdict: 'bad', text: 'Rank Rohit last. For the caching layer.', outcome: 'Petty and permanent. When the list leaks months later, your fingerprints are on it.', lesson: 'Never use power over someone’s livelihood to settle scores.', effects: { reputation: -6, sanity: -5 } },
      { id: 'rr-leak', tone: 'Evasive', verdict: 'bad', text: 'Tell the team at lunch that “a list exists”.', outcome: 'Panic. Two people start interviewing immediately. Rakesh knows exactly who leaked it.', lesson: 'Leaking confidential information destroys trust in both directions.', effects: { reputation: -10, network: 2 } },
    ],
    timeout: { outcome: 'Sachin mumbles “let me think about it”. Rakesh finishes the list without him — with less information.', lesson: 'Avoiding hard asks rarely makes them go away.', effects: { sanity: -3 } },
    minWeek: 10,
  },
  {
    id: 'favoritism',
    category: 'politics',
    codename: 'OPERATION: TEACHER’S PET',
    location: 'Sprint planning · Monday',
    briefing: 'For the third time in a row, Rohit gets the high-visibility project. Rakesh and Rohit play cricket every Sunday. Sachin gets the bug backlog.',
    dialogue: [
      { who: 'rakesh', line: 'Rohit will lead the new partner integration. Sachin, can you take care of the bug backlog? You’re so good at it.' },
    ],
    prompt: 'Sachin wants better work. What’s his move?',
    choices: [
      { id: 'fv-ask', tone: 'Assertive', verdict: 'best', text: 'In his next 1:1, ask Rakesh directly for the next high-visibility project — with a specific proposal, his track record, and “what would you need to see from me?”', outcome: 'Rakesh admits he “didn’t know you wanted it”. Next month, you lead the reporting revamp.', lesson: 'Managers aren’t mind-readers. Ask for the work you want, specifically, with evidence.', effects: { reputation: 6, charisma: 3 } },
      { id: 'fv-cricket', tone: 'Strategic', verdict: 'okay', text: 'Start joining the Sunday cricket.', outcome: 'You bond with Rakesh over a dropped catch. It helps — a bit — and costs your Sundays.', lesson: 'Relationships matter, but they work better alongside a direct ask.', effects: { network: 4, reputation: 2, energy: -6 } },
      { id: 'fv-sulk', tone: 'Passive', verdict: 'bad', text: 'Sulk and quietly disengage.', outcome: 'Your output drops. Rakesh concludes he was right not to give you the big projects.', lesson: 'Disengagement confirms the bias you’re upset about.', effects: { reputation: -5, sanity: -6 } },
      { id: 'fv-hr', tone: 'Emotional', verdict: 'bad', text: 'Complain to HR about favouritism, with no examples.', outcome: 'Pooja asks for specifics. You don’t have any written down. It goes nowhere — except to Rakesh.', lesson: 'Concerns need evidence. Without it, they read as grievances.', effects: { reputation: -6 } },
    ],
    timeout: { outcome: 'The bug backlog it is. Again.', lesson: 'Unclaimed opportunities go to whoever asks.', effects: { sanity: -3 } },
    minWeek: 4,
  },
  {
    id: 'promo_packet',
    category: 'politics',
    codename: 'OPERATION: SELF-PROMOTION',
    location: 'Promotion cycle · Rakesh’s message',
    briefing: 'Promotion nominations are due Friday. Rakesh has 14 reports and no time.',
    dialogue: [
      { who: 'rakesh', line: 'Sachin, write your own promotion case. I’ll just review and sign it. Keep it short, I’m swamped.' },
    ],
    prompt: 'Sachin has one shot at his promotion case.',
    choices: [
      { id: 'pp-evidence', tone: 'Strategic', verdict: 'best', text: 'Write a crisp, evidence-backed packet: impact with numbers, scope beyond his role, two peer quotes — and ask Ananya to review it before sending.', outcome: 'The calibration panel calls it “the easiest case of the cycle”. The promotion goes through, with a bump.', lesson: 'Promotion cases are won with specific evidence. Keep a brag document all year so this takes an hour, not a weekend.', effects: { reputation: 8, charisma: 3, money: 15 } },
      { id: 'pp-modest', tone: 'Passive', verdict: 'okay', text: 'Write a modest one-pager. Don’t want to sound arrogant.', outcome: 'It gets lost among stronger packets. “Next cycle,” says Rakesh.', lesson: 'Modesty in a promotion packet reads as lack of impact. State facts plainly.', effects: { reputation: 1 } },
      { id: 'pp-template', tone: 'Evasive', verdict: 'bad', text: 'Paste a generic template from the internet and fill in the blanks.', outcome: 'The panel has read that template eleven times this cycle.', lesson: 'Generic claims are invisible. Specifics stand out.', effects: { reputation: -3 } },
      { id: 'pp-exaggerate', tone: 'Savage', verdict: 'bad', text: 'Go big: “Single-handedly saved the company.”', outcome: 'Someone on the panel worked on the same project. Your credibility takes a hit for the next two cycles.', lesson: 'Overclaiming is easy to disprove — and hard to recover from.', effects: { reputation: -6 } },
    ],
    timeout: { outcome: 'The deadline passes. Rakesh submits a two-line case on your behalf.', lesson: 'If you don’t tell your story, nobody else will tell it well.', effects: { reputation: -2 } },
    minWeek: 14,
  },
  {
    id: 'layoff_survivor',
    category: 'politics',
    codename: 'OPERATION: LAST ONE STANDING',
    location: 'Team call · 10 AM · Vikram’s icon is grey',
    briefing: 'The layoffs happened. Vikram was let go this morning. Rakesh, visibly tired, has an announcement for the survivors.',
    dialogue: [
      { who: 'rakesh', line: 'Sachin, you’ll take over all of Vikram’s modules. Same deadlines. And... there’s no budget for adjustments this year.' },
    ],
    prompt: 'Sachin’s workload just doubled. What does he do?',
    choices: [
      { id: 'ls-prioritise', tone: 'Strategic', verdict: 'best', text: 'Accept a prioritised handover: ask which of Vikram’s work can be dropped or deferred, document everything — and check on Vikram and refer him to openings he’d fit.', outcome: 'Half of Vikram’s backlog gets formally deprioritised. And three weeks later, Vikram lands a job through your referral. He sends you a very long voice note.', lesson: 'More work with the same hours means explicit prioritisation. And look after the people who leave — the industry is small.', effects: { network: 6, reputation: 4, sanity: -2 }, setFlags: ['gone:vikram'] },
      { id: 'ls-comp', tone: 'Assertive', verdict: 'okay', text: 'Ask for a compensation adjustment or a title change for the extra scope.', outcome: 'Not now, says Rakesh — but it’s noted for the next cycle. Fair ask, bad timing.', lesson: 'It’s reasonable to ask for recognition of bigger scope; just expect timing to matter.', effects: { reputation: 1 }, setFlags: ['gone:vikram'] },
      { id: 'ls-absorb', tone: 'Passive', verdict: 'bad', text: 'Take everything on silently.', outcome: 'You work two jobs for one salary. Three months later, your sanity is in the red.', lesson: 'Absorbing a layoff silently sets a new baseline of overwork.', effects: { sanity: -12, energy: -10 }, setFlags: ['gone:vikram'] },
      { id: 'ls-ghost', tone: 'Evasive', verdict: 'bad', text: 'Avoid Vikram to dodge the awkwardness.', outcome: 'Vikram notices who reached out and who didn’t.', lesson: 'Silence toward a laid-off friend feels like abandonment, even when it’s awkwardness.', effects: { network: -6 }, setFlags: ['gone:vikram'] },
    ],
    timeout: { outcome: 'Sachin says nothing. The call ends. The modules are his now, with no discussion.', lesson: 'Unnegotiated scope becomes permanent scope.', effects: { sanity: -8 }, setFlags: ['gone:vikram'] },
    minWeek: 18,
    excludes: ['gone:vikram'],
  },
  {
    id: 'pip_threat',
    category: 'politics',
    codename: 'OPERATION: PAPER TRAIL',
    location: 'Rakesh’s cabin · Friday, 5:45 PM',
    briefing: 'Sachin has declined weekend work twice this quarter, and his standing with Rakesh has slipped. Today’s 1:1 is short and cold.',
    dialogue: [
      { who: 'rakesh', line: 'I’m not happy with your commitment lately. If this continues, I may have to put you on a performance improvement plan.' },
    ],
    prompt: 'The word “PIP” is now on the table. What does Sachin do?',
    choices: [
      { id: 'pip-paper', tone: 'Strategic', verdict: 'best', text: 'Ask calmly for specific, written expectations and timelines. Summarise the 1:1 in an email, keep a log of deliverables, and involve the HR business partner if expectations stay vague.', outcome: 'Faced with writing specifics, Rakesh lists three reasonable goals. You hit all three. The PIP talk never comes back.', lesson: 'Vague threats shrink in writing. Ask for measurable expectations and document everything.', effects: { reputation: 6, sanity: 2 } },
      { id: 'pip-weekends', tone: 'Passive', verdict: 'okay', text: 'Start working weekends to avoid the PIP.', outcome: 'The threat fades. So does your weekend life.', lesson: 'Buying safety with unpaid overtime works short-term and teaches your manager it works.', effects: { reputation: 4, sanity: -10, energy: -8 } },
      { id: 'pip-threat', tone: 'Emotional', verdict: 'bad', text: '“If you put me on a PIP, I’ll resign.”', outcome: 'Rakesh writes down “employee threatened to resign”. Now it is in your file.', lesson: 'Emotional threats hand the other side documentation against you.', effects: { reputation: -8 } },
      { id: 'pip-ignore', tone: 'Evasive', verdict: 'bad', text: 'Ignore it and hope it blows over.', outcome: 'It doesn’t. A formal PIP arrives two weeks later.', lesson: 'Performance concerns don’t evaporate; address them early and in writing.', effects: { reputation: -10, sanity: -4 } },
    ],
    timeout: { outcome: 'Sachin nods and leaves. Nothing was clarified; everything was implied.', lesson: 'Leave every hard 1:1 with something concrete in writing.', effects: { reputation: -5, sanity: -4 } },
    minWeek: 10,
    maxStats: { reputation: 45 },
    weight: 2,
  },
];
