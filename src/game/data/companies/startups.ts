import { defineCompany } from './define';

export const TWIGGY = defineCompany({
  id: 'twiggy',
  name: 'Twiggy',
  kind: 'startup',
  tier: 'A',
  tagline: '10-minute biryani. 10-minute standups. 10-hour days.',
  accent: 'orange',
  brand: { bg: '#fc5c11', fg: '#ffffff', glyph: 't' },
  location: 'HSR Layout, Bengaluru · Office-first',
  domain: 'twiggy.app',
  stats: { wlb: 1, toxicity: 3, pay: 4, growth: 5, security: 2 },
  culture: [
    '“We move fast and fix things.” Mostly in production.',
    'You own everything: backend, DevOps, on-call and sometimes the office plants.',
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
    intro: 'Yo Sachin! We’re building the fastest food-delivery stack in India — biryani in 10 minutes. Let’s jam on some real problems. No LeetCode nonsense, promise.',
    quirks: ['Bro, think IPL-final traffic.', 'Our customers would be eating cold biryani with that. Kidding. Maybe.'],
  },
  ctc: [20, 30],
  payNote: '+ ESOPs',
  topics: { web: 3, design: 3, db: 2, cloud: 2 },
  epilogue:
    'Sachin joins Twiggy. In six months he ships 40 features, survives an on-call shift during the IPL final, and learns more than in the previous two years combined. His ESOPs are worth “a lot, on paper”. Sleep: optional.',
  invite: {
    from: 'Kabir @ Twiggy',
    email: 'kabir@twiggy.app',
    subject: 'yo Sachin — let’s build the future of food \u{1F680}\u{1F354}',
    body: [
      'Hey Sachin!',
      'Saw your GitHub (the Redis caching thing \u{1F525}). We’re hiring backend engineers who love shipping and don’t panic when PagerDuty sings.',
      'Quick 10-question jam with me and our CEO — real problems from our stack, getting harder as we go — then a vibe check. Clear 70% and we talk offers the same week.',
      'P.S. We have a ping-pong table. And a nap room nobody has ever used.',
    ],
  },
  rejection: {
    body: [
      'Hey Sachin,',
      'Loved the vibe, honestly. But for this role we’re optimising for folks who have already handled crazy scale, and we didn’t see enough signal there yet.',
      'Stay hungry! Here’s code SACHIN50 for 50% off your next order. No hard feelings, only soft biryani.',
    ],
    signoff: 'Kabir · Co-founder & CTO, Twiggy',
  },
});

export const FLOPKART = defineCompany({
  id: 'flopkart',
  name: 'Flopkart',
  kind: 'startup',
  tier: 'A',
  tagline: 'Big Billion Days. Bigger on-call rotations.',
  accent: 'amber',
  brand: { bg: '#2563eb', fg: '#facc15', glyph: 'F' },
  location: 'Bengaluru · Office-first',
  domain: 'flopkart.careers',
  stats: { wlb: 2, toxicity: 3, pay: 4, growth: 5, security: 3 },
  culture: [
    'Sale season is war season. Code freezes are sacred.',
    'Huge scale with very Indian problems: cash on delivery, pincodes, returns.',
    'A strong engineering culture with a start-up hangover.',
  ],
  reviews: [{ stars: 4, text: 'Big sale prep is like an exam you take every year. Worth it.', by: 'SDE II' }],
  vibe: ['Sale season', 'Scale', 'Code freeze'],
  interviewer: {
    name: 'Pranav Kulkarni',
    title: 'Engineering Manager · Checkout',
    avatar: '\u{1F9D1}\u{1F3FD}‍\u{1F4BB}',
    intro: 'Hey Sachin! During our sale, 10x traffic hits checkout in one second. Every question today is about that second.',
    quirks: ['Added to cart. I mean — correct.', 'Would that survive midnight on sale day?'],
  },
  ctc: [22, 34],
  payNote: '+ ESOPs',
  topics: { design: 4, db: 3, web: 2, concurrency: 2 },
  epilogue:
    'Sachin joins Flopkart just before the big sale. He survives his first code freeze, watches the order graph go vertical at midnight, and celebrates with the team at 4 AM over cold pizza. It’s the most alive he has ever felt at work.',
});

export const PAYTYM = defineCompany({
  id: 'paytym',
  name: 'Paytym',
  kind: 'startup',
  tier: 'B',
  tagline: 'Paytym karo. Then wait for the cashback.',
  accent: 'sky',
  brand: { bg: '#0c4a6e', fg: '#38bdf8', glyph: '₹' },
  location: 'Noida · Office-first',
  domain: 'paytym.jobs',
  stats: { wlb: 2, toxicity: 4, pay: 3, growth: 4, security: 2 },
  culture: [
    'Fintech speed with banking-level regulation.',
    'UPI traffic spikes on festival days are legendary.',
    'Founder-led, fast decisions, frequent pivots.',
  ],
  reviews: [{ stars: 3, text: 'You will learn payments end to end. Expect pivots and late-night war rooms.', by: 'Senior Software Engineer' }],
  vibe: ['UPI', 'Cashback', 'Pivots'],
  interviewer: {
    name: 'Mohit Agarwal',
    title: 'Tech Lead · Payments Gateway',
    avatar: '\u{1F9D4}\u{1F3FD}',
    intro: 'Hello Sachin. Every second, thousands of payments flow through us. One bug and someone’s rent payment disappears. Let’s talk.',
    quirks: ['Correct! You’ve won ₹2 cashback. Just kidding.', 'Payment pending... pending... Next question.'],
  },
  ctc: [14, 22],
  payNote: '+ ESOPs',
  topics: { finance: 3, web: 3, db: 2, design: 2 },
  epilogue:
    'Sachin joins Paytym’s payments gateway team. He learns UPI flows inside out, survives a record-breaking festival-day traffic spike, and never again trusts the words “payment pending”.',
});
