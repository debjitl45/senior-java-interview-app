import { defineCompany } from './define';

export const GOOGLY = defineCompany({
  id: 'googly',
  name: 'Googly',
  kind: 'product',
  tier: 'S',
  tagline: 'Organizing the world’s information. And your calendar. And your free lunch.',
  accent: 'sky',
  brand: { bg: '#ffffff', fg: '#4285f4', glyph: 'G' },
  location: 'Bengaluru · Hybrid (3 days office)',
  domain: 'googly.careers',
  stats: { wlb: 4, toxicity: 2, pay: 5, growth: 4, security: 3 },
  culture: [
    'Impact over hours — nobody counts your login time, everybody reads your design doc.',
    'A long loop, then a hiring committee, then “team matching”.',
    'Free food, gym, nap pods. Layoffs, when they happen, arrive by email.',
  ],
  reviews: [
    { stars: 4, text: 'Great food, great pay, smartest people I have worked with. Promotions are a marathon.', by: 'SWE III' },
    { stars: 3, text: 'You will write a 12-page design doc for a button. The button will be deprecated.', by: 'SWE II' },
  ],
  vibe: ['Free food', 'Imposter syndrome', 'Hiring committee'],
  interviewer: {
    name: 'Arjun Iyer',
    title: 'Staff Software Engineer · L6',
    avatar: '\u{1F9D1}\u{1F3FD}‍\u{1F4BB}',
    intro: 'Hi Sachin, I’m Arjun. Today is DS&A, Java internals and a bit of design. Think out loud — I care about the approach more than the answer.',
    quirks: ['Interesting. Can we do better than that?', 'What’s the complexity? Always say the complexity.'],
  },
  ctc: [32, 52],
  payNote: '+ RSUs',
  topics: { dsa: 4, design: 3 },
  epilogue:
    'Sachin joins Googly after a four-month team-match saga. He eats free sushi, writes design docs for features that get deprecated, and learns that “Googlyness” mostly means being kind in code reviews. Imposter syndrome: still on. Bank balance: much happier.',
  offer: {
    subject: '\u{1F389} Your offer from Googly — Software Engineer II (L4)',
    role: 'Software Engineer II (L4), Backend',
    perks: ['RSUs vesting over 4 years', 'Free breakfast, lunch & dinner', 'Gym, nap pods, learning budget'],
    finePrint: '*Start date subject to team matching, which may take 2–4 months. Free food may cause weight gain.',
    signoff: 'Priyanka · Googly Recruiting',
  },
  rejection: {
    body: [
      'Hi Sachin,',
      'Thank you for the time you invested in our interview loop. After careful review, the hiring committee has decided not to move forward at this time.',
      'This decision is not a reflection of your potential. The bar is calibrated high, and many of our engineers interviewed more than once. You are welcome to reapply after a cooldown.',
    ],
    signoff: 'Priyanka · Googly Recruiting',
  },
  reactions: {
    great: {
      mood: '\u{1F929}',
      headline: 'Did I just clear a Googly loop?!',
      thought: 'I stated the complexity every single time. Arjun even said “interesting” — the good kind, I think. Is there a good kind?',
      text: 'bhai googly ka interview mast gaya \u{1F525} free food here I come',
    },
    bad: {
      mood: '\u{1F480}',
      headline: 'Googly cooked me',
      thought: 'He asked one follow-up about complexity and I found the complexity of my own feelings instead.',
      text: 'bro I just got googled \u{1F62D}',
    },
  },
});

export const MACROSOFT = defineCompany({
  id: 'macrosoft',
  name: 'Macrosoft',
  kind: 'product',
  tier: 'S',
  tagline: 'Empowering every person on the planet to restart their computer.',
  accent: 'cyan',
  brand: { bg: '#0f172a', fg: '#38bdf8', glyph: '⊞' },
  location: 'Hyderabad · Hybrid',
  domain: 'macrosoft.careers',
  stats: { wlb: 4, toxicity: 2, pay: 4, growth: 4, security: 4 },
  culture: [
    '“Growth mindset” appears in every performance review, including yours.',
    'Calls about calls, scheduled through the company’s own chat app.',
    'Genuine work-life balance; Friday afternoons are mysteriously quiet.',
  ],
  reviews: [{ stars: 4, text: 'Good balance, great benefits. Re-orgs every 18 months like clockwork.', by: 'SDE II' }],
  vibe: ['Growth mindset', 'Stable', 'Calls about calls'],
  interviewer: {
    name: 'Sanjana Reddy',
    title: 'Principal Software Engineer',
    avatar: '\u{1F469}\u{1F3FD}‍\u{1F4BB}',
    intro: 'Hi Sachin! I’m Sanjana. We value a growth mindset here, so if you get stuck, just tell me what you’d try next.',
    quirks: ['Let me share my screen... can you see it? How about now?', 'Have you tried turning that answer off and on again?'],
  },
  ctc: [28, 46],
  payNote: '+ stock awards',
  topics: { design: 3, java: 3, dsa: 3 },
  epilogue:
    'Sachin joins Macrosoft and discovers the joy of a job that actually ends at 6 PM. He spends his first month in onboarding videos and his first year building something used by millions of people in offices that will never know his name.',
});

export const AMAZIN = defineCompany({
  id: 'amazin',
  name: 'Amazin',
  kind: 'product',
  tier: 'S',
  tagline: 'Earth’s most customer-obsessed company. Also metric-obsessed.',
  accent: 'orange',
  brand: { bg: '#111827', fg: '#ff9900', glyph: 'a' },
  location: 'Bengaluru · Office-first',
  domain: 'amazin.jobs',
  stats: { wlb: 2, toxicity: 3, pay: 5, growth: 5, security: 3 },
  culture: [
    'Sixteen leadership principles — expect questions on every one of them.',
    'Six-page memos instead of slides, read in silence at the start of meetings.',
    'Frugality is a principle. So is the 2 AM pager.',
  ],
  reviews: [{ stars: 3, text: 'You learn ownership fast. You also learn what “high bar” means at 11 PM.', by: 'SDE I' }],
  vibe: ['Day 1 mindset', 'Bar raiser', 'Pager'],
  interviewer: {
    name: 'Ravi Shankar',
    title: 'Senior SDE · back from Seattle',
    avatar: '\u{1F9D4}\u{1F3FD}‍♂️',
    intro: 'Hey Sachin. I’ll mix technical questions with leadership principles. Tell me about a time you... just kidding, technical first.',
    quirks: ['Which leadership principle does that answer show? Kidding. Mostly.', 'Customer obsession, Sachin. Always work backwards from the customer.'],
  },
  ctc: [30, 50],
  payNote: '+ RSUs (back-loaded)',
  topics: { design: 4, dsa: 3, cloud: 2 },
  epilogue:
    'Sachin joins Amazin. He writes his first six-page doc, learns that “disagree and commit” is both a principle and a lifestyle, and gets paged during his own farewell party at Infinite Loop. The growth is real; so is the pager.',
});

export const BASEBOOK = defineCompany({
  id: 'basebook',
  name: 'Basebook',
  kind: 'product',
  tier: 'S',
  tagline: 'Move fast and connect things. Now part of parent company Beta.',
  accent: 'indigo',
  brand: { bg: '#1d4ed8', fg: '#ffffff', glyph: 'b' },
  location: 'Bengaluru · Hybrid',
  domain: 'basebook.careers',
  stats: { wlb: 3, toxicity: 3, pay: 5, growth: 4, security: 2 },
  culture: [
    '“Done is better than perfect” is painted on one wall; “Year of efficiency” on the other.',
    'Bootcamp: you pick your team after six weeks.',
    'Perf reviews are intense; the free food is excellent.',
  ],
  reviews: [{ stars: 4, text: 'Insane scale, smart people. Layoff anxiety comes free with the snacks.', by: 'Software Engineer' }],
  vibe: ['Move fast', 'Graphs', 'Perf season'],
  interviewer: {
    name: 'Kunal Bhatia',
    title: 'Staff Engineer · News Feed',
    avatar: '\u{1F9D1}\u{1F3FD}‍\u{1F4BB}',
    intro: 'Hey! I work on the feed — three billion people, one ranking system, zero pressure. Let’s go.',
    quirks: ['Cool, cool. Now imagine it’s for three billion users.', 'Move fast — but don’t break this one.'],
  },
  ctc: [32, 54],
  payNote: '+ RSUs',
  topics: { dsa: 4, design: 4 },
  epilogue:
    'Sachin joins Basebook and ships a feature to 200 million people in his third week. He learns graph algorithms, A/B tests and the art of surviving perf season. His parents finally understand his job: “Like Facebook, but Basebook.”',
});

export const NETFLUX = defineCompany({
  id: 'netflux',
  name: 'Netflux',
  kind: 'product',
  tier: 'S',
  tagline: 'Freedom and responsibility. Mostly responsibility.',
  accent: 'rose',
  brand: { bg: '#000000', fg: '#e50914', glyph: 'N' },
  location: 'Mumbai · Hybrid',
  domain: 'netflux.jobs',
  stats: { wlb: 3, toxicity: 2, pay: 5, growth: 4, security: 2 },
  culture: [
    'The “keeper test”: would your manager fight to keep you? Ask yourself weekly.',
    'Top-of-market pay, no bonus games.',
    'Context, not control. They break their own systems on purpose to stay resilient.',
  ],
  reviews: [{ stars: 4, text: 'Best pay and the most autonomy I’ve ever had. Also the most pressure.', by: 'Senior Software Engineer' }],
  vibe: ['Keeper test', 'Chaos engineering', 'Top of market'],
  interviewer: {
    name: 'Aisha Khan',
    title: 'Senior Engineer · Streaming Platform',
    avatar: '\u{1F469}\u{1F3FD}‍\u{1F4BB}',
    intro: 'Hi Sachin. We practise chaos engineering — we break our own systems on purpose. So: how do you handle things breaking?',
    quirks: ['Are you still watching? Just checking.', 'Skip intro. Next question.'],
  },
  ctc: [38, 60],
  topics: { design: 4, cloud: 3, concurrency: 2 },
  epilogue:
    'Sachin joins Netflux on a top-of-market salary. He spends his days making sure 4K streams don’t buffer on Friday nights, survives the keeper test, and finally has a legitimate reason to binge-watch: “It’s research.”',
});
