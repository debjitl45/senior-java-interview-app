import { defineCompany } from './define';

export const AIRTELL = defineCompany({
  id: 'airtell',
  name: 'Airtell',
  kind: 'telecom',
  tier: 'B',
  tagline: 'The smartphone network. Smartest after the third restart.',
  accent: 'rose',
  brand: { bg: '#dc2626', fg: '#ffffff', glyph: 'A' },
  location: 'Gurugram · Hybrid',
  domain: 'airtell.careers',
  stats: { wlb: 3, toxicity: 3, pay: 3, growth: 3, security: 4 },
  culture: [
    'A 25-year-old telco racing to become a tech company.',
    'Billions of records a day: calls, data sessions, recharges.',
    'Big-brand stability with pockets of start-up energy.',
  ],
  reviews: [{ stars: 4, text: 'Real scale, decent pay, a lot of legacy. Your family will ask you to fix their network.', by: 'Senior Engineer' }],
  vibe: ['Scale', 'Legacy', 'Recharges'],
  interviewer: {
    name: 'Rahul Malhotra',
    title: 'Engineering Manager · Digital Platforms',
    avatar: '\u{1F9D1}\u{1F3FD}‍\u{1F4BC}',
    intro: 'Hi Sachin. Half the country recharges on our app. Let’s see if your answers have full signal.',
    quirks: ['You are in a no-network zone. Kidding. Continue.', 'Data balance remaining: 0.2 GB. Hurry.'],
  },
  ctc: [14, 22],
  topics: { design: 3, java: 2, cloud: 2, db: 2 },
  epilogue:
    'Sachin joins Airtell Digital and helps move a telco’s legacy systems to the cloud while hundreds of millions of customers keep recharging. He becomes the family’s official network-complaint hotline. Permanently.',
});

export const JIYO = defineCompany({
  id: 'jiyo',
  name: 'Jiyo',
  kind: 'telecom',
  tier: 'B',
  tagline: 'Jiyo jee bhar ke. Free data, priceless on-call.',
  accent: 'sky',
  brand: { bg: '#1e40af', fg: '#ffffff', glyph: 'J' },
  location: 'Navi Mumbai · Office-first',
  domain: 'jiyo.careers',
  stats: { wlb: 2, toxicity: 3, pay: 3, growth: 4, security: 3 },
  culture: [
    'Built a network for hundreds of millions of people in record time.',
    'Huge ambition: payments, retail, streaming — all at once.',
    'Big campus, bigger expectations, weekend launches.',
  ],
  reviews: [{ stars: 3, text: 'Enormous scale and ambition. Expect office-first and weekend launches.', by: 'Lead Engineer' }],
  vibe: ['Disruption', 'Free data', 'Launches'],
  interviewer: {
    name: 'Sunil Patil',
    title: 'Head of Platform Engineering',
    avatar: '\u{1F468}\u{1F3FD}‍\u{1F4BC}',
    intro: 'Namaste Sachin. We launch to tens of millions of users on day one. So — how fast can you think?',
    quirks: ['Bilkul sahi. Free data for that answer.', 'That would crash on launch day. Next.'],
  },
  ctc: [15, 24],
  topics: { design: 3, cloud: 3, java: 2, concurrency: 2 },
  epilogue:
    'Sachin joins Jiyo Platforms and lives through three launches in one year — each to tens of millions of users on day one. He sleeps less, learns more, and can now explain backpressure to his grandmother.',
});
