import type { Company } from '../../types';

export const TWIGGY: Company = {
  id: 'twiggy',
  name: 'Twiggy',
  kind: 'Funded start-up',
  tagline: '10-minute biryani. 10-minute standups. 10-hour days.',
  accent: 'orange',
  location: 'HSR Layout, Bengaluru · Office-first',
  stats: { wlb: 1, toxicity: 3, pay: 4, growth: 5, security: 2 },
  culture: [
    '“We move fast and fix things.” Mostly in production.',
    'You own everything: backend, DevOps, on-call and sometimes the office plants.',
    'ESOPs that are worth a lot. On paper. After the IPO. Probably.',
    '“Unlimited leave” that nobody takes, plus a very competitive ping-pong table.',
  ],
  reviews: [
    { stars: 4, text: 'Learned more in one year than in four years of college. Also slept less.', by: 'Backend Engineer' },
    { stars: 2, text: 'Every Friday is a deploy. Every Saturday is an incident.', by: 'SDE II' },
  ],
  vibe: ['Hustle', 'ESOPs', 'On-call'],
  interviewer: {
    name: 'Kabir Mehta',
    title: 'Co-founder & CTO · 27',
    avatar: '\u{1F9E2}',
    intro:
      'Yo Sachin! We’re building the fastest food-delivery stack in India — biryani in 10 minutes. Let’s jam on some real problems. No LeetCode nonsense, promise.',
    tierLines: [
      'Warm-up, quick-fire!',
      'Okay, real-world stuff now.',
      'Let’s talk production.',
      'Scale time. Think IPL-final traffic.',
      'Boss level. This is what breaks start-ups.',
    ],
    onCorrect: [
      'Let’s gooo! \u{1F680}',
      'That’s the energy we need at 2 AM on-call.',
      'Ship it! \u{1F525}',
      'Bro, you’d crush our Friday deploys.',
    ],
    onWrong: [
      'Oof. That would take prod down during the IPL final.',
      'Hmm, our customers would be eating cold biryani.',
      'Not quite — but we value learning fast!',
      'That’s a P0 incident waiting to happen.',
    ],
    onTimeout: 'Clock’s out! At a start-up, “I’ll think about it” is also an answer. The wrong one.',
  },
  ladder: [
    '6 LPA',
    '8 LPA',
    '10 LPA',
    '12 LPA',
    '14 LPA',
    '17 LPA',
    '20 LPA + ESOPs',
    '23 LPA + ESOPs',
    '26 LPA + ESOPs',
    '30 LPA + ESOPs',
  ],
  invite: {
    from: 'Kabir @ Twiggy',
    email: 'kabir@twiggy.app',
    subject: 'yo Sachin — let’s build the future of food \u{1F680}\u{1F354}',
    preview: 'Hey Sachin! Saw your GitHub (the Redis caching thing \u{1F525}). We’re hiring backend engineers who love shipping...',
    body: [
      'Hey Sachin!',
      'Saw your GitHub (the Redis caching thing \u{1F525}). We’re hiring backend engineers who love shipping and don’t panic when PagerDuty sings.',
      'Quick 10-question jam with me — real problems from our stack, getting harder as we go. Clear 70% and we talk offers the same day.',
      'P.S. We have a ping-pong table. And a nap room nobody has ever used.',
    ],
  },
  offer: {
    subject: '\u{1F680} Welcome to the rocket ship, Sachin!',
    role: 'Backend Engineer (SDE II)',
    body: [
      'Sachin!!',
      'The team loved you. We want you on board ASAP — like, yesterday. Here’s the deal:',
    ],
    perks: ['ESOPs: 4-year vesting, 1-year cliff', 'Unlimited leave*', 'Free Twiggy credits every month', 'MacBook + standing desk'],
    finePrint: '*Unlimited leave subject to sprint deadlines. On-call rotation: weekly. Funding runway: “comfortable”.',
    signoff: 'Kabir · Co-founder & CTO, Twiggy',
  },
  rejection: {
    subject: 'Not this time \u{1F494}',
    body: [
      'Hey Sachin,',
      'Loved the vibe, honestly. But for this role we’re optimizing for folks who have already handled crazy scale, and we didn’t see enough signal there yet.',
      'Stay hungry! Here’s code SACHIN50 for 50% off your next order. No hard feelings, only soft biryani.',
    ],
    signoff: 'Kabir · Co-founder & CTO, Twiggy',
  },
  reactions: {
    great: {
      mood: '\u{1F680}',
      headline: 'Start-up energy: unlocked',
      thought:
        'Kabir said “bro, you get it” three times. I’m 80% sure I’ll be on-call in week one and 100% sure I want those ESOPs.',
      text: 'twiggy CTO literally said I get it \u{1F680}\u{1F680}',
    },
    meh: {
      mood: '\u{1F914}',
      headline: 'Vibe check: pending',
      thought:
        'They want backend plus DevOps plus “a bit of product sense”. I said I’m a fast learner. Everyone says that. I said it faster.',
      text: 'start-up interview was a vibe. result? no idea \u{1F937}',
    },
    bad: {
      mood: '\u{1F972}',
      headline: 'Not rocket-ship material?',
      thought:
        'One of my answers would have melted their servers on IPL final night. Kabir’s face looked exactly like a 2 AM PagerDuty alert.',
      text: 'I think I just caused a hypothetical outage \u{1F480}',
    },
  },
  epilogue:
    'Sachin joins Twiggy. In six months he ships 40 features, survives an on-call shift during the IPL final, and learns more than in the previous two years combined. His ESOPs are worth “a lot, on paper”. Sleep: optional.',
};
