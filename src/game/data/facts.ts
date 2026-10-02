import type { FactCard } from '../types';

/** Shown at the start of every new game: half trivia, half advice you can use on Monday. */
export const FACTS: FactCard[] = [
  {
    id: 'f-oak',
    kind: 'fact',
    emoji: '\u{1F333}',
    title: 'Java was almost called Oak',
    body: 'Java’s first name was Oak, after a tree outside James Gosling’s office. The name was already trademarked, so after a long brainstorm the team settled on Java — reportedly inspired by coffee.',
  },
  {
    id: 'f-moth',
    kind: 'fact',
    emoji: '\u{1F98B}',
    title: 'The first “bug” was a real moth',
    body: 'In 1947, engineers working on Harvard’s Mark II found a moth stuck in a relay and taped it into the logbook as the “first actual case of bug being found”.',
  },
  {
    id: 'f-backrub',
    kind: 'fact',
    emoji: '\u{1F50D}',
    title: 'Google started life as BackRub',
    body: 'Before it was Google, Larry Page and Sergey Brin’s search engine was called BackRub — named after the way it analysed the web’s back-links.',
  },
  {
    id: 'f-oil',
    kind: 'fact',
    emoji: '\u{1F33B}',
    title: 'Wipro began by selling vegetable oil',
    body: 'Wipro was founded in 1945 as Western India Vegetable Products and only moved into IT decades later. Pivots are not just a start-up thing.',
  },
  {
    id: 'f-pizza',
    kind: 'fact',
    emoji: '\u{1F355}',
    title: 'The two-pizza team',
    body: 'Amazon’s rule of thumb: a team should be small enough to be fed by two pizzas. Smaller teams mean fewer meetings and much clearer ownership.',
  },
  {
    id: 'f-replyall',
    kind: 'fact',
    emoji: '\u{1F4E7}',
    title: 'Reply-all can take down a company',
    body: 'In 1997 a Microsoft mailing list called “Bedlam DL3” set off a reply-all storm big enough to overwhelm the company’s email servers. BCC exists for a reason.',
  },
  {
    id: 'f-infosys',
    kind: 'fact',
    emoji: '\u{1F4A1}',
    title: 'Infosys started with ₹10,000',
    body: 'Seven engineers founded Infosys in 1981 with roughly ₹10,000 — money N. R. Narayana Murthy borrowed from Sudha Murty.',
  },
  {
    id: 'f-ctrlaltdel',
    kind: 'fact',
    emoji: '⌨️',
    title: 'Ctrl+Alt+Del was for developers only',
    body: 'IBM engineer David Bradley created the three-key combo as a quick reboot for developers. It was never meant to become something everyone on Earth would learn.',
  },
  {
    id: 't-writing',
    kind: 'tip',
    emoji: '✍️',
    title: 'An offer only counts in writing',
    body: 'Joining bonus, hike, “promotion next cycle” — verbal promises are not offers. Get every number into the offer letter before you resign.',
  },
  {
    id: 't-ctc',
    kind: 'tip',
    emoji: '\u{1F4B8}',
    title: 'CTC is not your in-hand salary',
    body: 'CTC bundles fixed pay, variable pay, PF, gratuity, insurance and sometimes ESOPs. Ask for the breakup and work out your monthly in-hand before you celebrate.',
  },
  {
    id: 't-star',
    kind: 'tip',
    emoji: '⭐',
    title: 'Answer behavioural questions with STAR',
    body: 'Situation, Task, Action, Result — and end with a number. “Cut latency by 60%” beats “made it faster” every single time.',
  },
  {
    id: 't-scam',
    kind: 'tip',
    emoji: '\u{1F6A9}',
    title: 'Nobody legit charges you to get hired',
    body: 'Any “company” asking for registration, training, laptop or verification fees is running a scam. Real recruiters never ask you to pay.',
  },
  {
    id: 't-brag',
    kind: 'tip',
    emoji: '\u{1F4D2}',
    title: 'Keep a brag document',
    body: 'Note your wins, metrics and kind words every week. At appraisal time you walk in with receipts instead of vague memories.',
  },
  {
    id: 't-notice',
    kind: 'tip',
    emoji: '⏳',
    title: 'Plan around your notice period',
    body: 'Know your notice period and buy-out rules before you start interviewing, and tell recruiters upfront. A 90-day notice changes which offers are realistic.',
  },
  {
    id: 't-ask',
    kind: 'tip',
    emoji: '\u{1F64B}',
    title: 'Always ask a question at the end',
    body: '“What does success look like in the first 90 days?” shows intent — and the answer tells you whether the role is real or chaos.',
  },
  {
    id: 't-docs',
    kind: 'tip',
    emoji: '\u{1F5C2}️',
    title: 'Guard your paperwork',
    body: 'Keep payslips, offer letters, relieving and experience letters safe in the cloud. Background verification will ask for them — sometimes years later.',
  },
];

const BY_ID: Record<string, FactCard> = Object.fromEntries(FACTS.map((f) => [f.id, f]));

export const getFact = (id: string): FactCard | undefined => BY_ID[id];
