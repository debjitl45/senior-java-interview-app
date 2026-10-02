import type { Company } from '../../types';

export const GOOGLY: Company = {
  id: 'googly',
  name: 'Googly',
  kind: 'Product-based MNC',
  tagline: 'Organizing the world’s information. And your calendar. And your free lunch.',
  accent: 'sky',
  location: 'Bengaluru · Hybrid (3 days office)',
  stats: { wlb: 4, toxicity: 2, pay: 5, growth: 4, security: 3 },
  culture: [
    'Impact over hours — nobody counts your login time, everybody reads your design doc.',
    'Six-round interview loop, then a hiring committee, then "team matching".',
    'Free food, gym, nap pods. Performance reviews via a self-written "perf packet".',
    'Layoffs, when they happen, arrive by email. Sometimes at 2 AM.',
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
    intro:
      'Hi Sachin, I’m Arjun. Today is DS&A, Java internals and a bit of design. Think out loud — I care about the approach more than the answer.',
    tierLines: [
      'Let’s start simple.',
      'Okay, slightly harder now.',
      'Let’s talk trade-offs.',
      'Now let’s see how you think at scale.',
      'Last stretch. These separate L4 from L5.',
    ],
    onCorrect: [
      'Nice. That’s optimal.',
      'Good. Let’s raise the bar.',
      'Clean reasoning. Moving on.',
      'Correct — and the reasoning matters more than the answer.',
    ],
    onWrong: [
      'Hmm. Let’s revisit the constraints...',
      'Interesting approach. Not quite, though.',
      'Okay. We’ll come back to that. (We won’t.)',
      '*types something long into the feedback doc*',
    ],
    onTimeout: 'Time’s up. In a real loop, silence is the only truly wrong answer.',
  },
  ladder: ['8 LPA', '12 LPA', '16 LPA', '20 LPA', '24 LPA', '28 LPA', '32 LPA', '38 LPA', '44 LPA', '52 LPA'],
  invite: {
    from: 'Googly Recruiting',
    email: 'no-reply@googly.careers',
    subject: 'Interview invitation: Software Engineer II, Bengaluru',
    preview: 'Hi Sachin, thanks for your interest in Googly! We’d like to invite you to our technical loop...',
    body: [
      'Hi Sachin,',
      'Thanks for your interest in Googly! We’d like to invite you to the technical interview loop for Software Engineer II (Backend, Java).',
      'Format: 10 questions of increasing difficulty covering data structures & algorithms, Java internals and system design. You need 70% to move forward.',
      'Recruiter tip: think out loud, clarify constraints first, and always state the complexity of your answer.',
    ],
  },
  offer: {
    subject: '🎉 Your offer from Googly — Software Engineer II (L4)',
    role: 'Software Engineer II (L4), Backend',
    body: [
      'Hi Sachin,',
      'Congratulations! The hiring committee has reviewed your loop and approved an offer. We were impressed by how clearly you reasoned about trade-offs.',
    ],
    perks: ['RSUs vesting over 4 years', 'Free breakfast, lunch & dinner', 'Gym, nap pods, learning budget', '26 days of paid leave'],
    finePrint: '*Start date subject to team matching, which may take 2–4 months. Free food may cause weight gain.',
    signoff: 'Priyanka · Googly Recruiting',
  },
  rejection: {
    subject: 'Update on your Googly application',
    body: [
      'Hi Sachin,',
      'Thank you for the time you invested in our interview loop. After careful review, the hiring committee has decided not to move forward at this time.',
      'This decision is not a reflection of your potential. The bar is calibrated high, and many of our engineers interviewed more than once. You are welcome to reapply after 6 months.',
    ],
    signoff: 'Priyanka · Googly Recruiting',
  },
  reactions: {
    great: {
      mood: '\u{1F929}',
      headline: 'Did I just clear a Googly loop?!',
      thought:
        'Two heaps for a running median and I did not panic. Arjun even said “interesting” — the good kind, I think. Is there a good kind?',
      text: 'bhai googly ka interview mast gaya \u{1F525} free food here I come',
    },
    meh: {
      mood: '\u{1F62C}',
      headline: 'Borderline at Googly',
      thought:
        'Some answers were clean, some were... creative. And even if I clear it, team matching takes months. I will know by Diwali. Maybe.',
      text: '50-50 hai bhai. pray for me \u{1F64F}',
    },
    bad: {
      mood: '\u{1F480}',
      headline: 'Googly cooked me',
      thought:
        'He asked about the median of a stream and I found the median of my confidence instead. Reapply in 6 months, they say. Six months of LeetCode, I say.',
      text: 'bro I just got googled \u{1F62D}',
    },
  },
  epilogue:
    'Sachin joins Googly after a four-month team-match saga. He eats free sushi, writes design docs for features that get deprecated, and learns that “Googlyness” mostly means being kind in code reviews. Imposter syndrome: still on. Bank balance: much happier.',
};
