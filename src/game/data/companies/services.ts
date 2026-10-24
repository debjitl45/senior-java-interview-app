import { defineCompany } from './define';

export const TIPRO = defineCompany({
  id: 'tipro',
  name: 'Tipro',
  kind: 'service',
  tier: 'B',
  tagline: 'Delivering excellence to our esteemed clients since 1945*. (*vegetable oil era)',
  accent: 'indigo',
  brand: { bg: '#0f172a', fg: '#c7d2fe', glyph: '' },
  location: 'Any Tipro campus · as per business needs',
  domain: 'tipro.co.in',
  stats: { wlb: 3, toxicity: 3, pay: 2, growth: 2, security: 5 },
  culture: [
    'The client is god. The client’s timezone is also god.',
    'Timesheets, compliance trainings and a 90-day notice period.',
    'Job security is excellent — the bench is comfortable and has free Wi-Fi.',
  ],
  reviews: [
    { stars: 3, text: 'Job security like a government job. Appraisal like one too.', by: 'Senior Software Engineer' },
    { stars: 4, text: 'Great place to learn processes. I now fill timesheets in my sleep.', by: 'Project Engineer' },
  ],
  vibe: ['Process', 'Bench life', 'Relocation'],
  interviewer: {
    name: 'R. Srinivasan',
    title: 'Delivery Manager · 19 yrs exp',
    avatar: '\u{1F468}\u{1F3FD}‍\u{1F9B3}',
    intro: 'Good morning Sachin. Kindly tell me about yourself... okay, okay, that is sufficient. We will proceed with the technical round as per the template.',
    quirks: ['Very good. Kindly also mention this in your timesheet.', 'Are you ready to relocate anywhere in India? Just asking. Continue.'],
  },
  ctc: [4.5, 6.5],
  epilogue:
    'Sachin joins Tipro and spends three weeks on the bench finishing a mandatory compliance course. Then he is posted to a banking client in Chennai. Job security: maximum. Excitement: buffering. He studies on weekends, and in 18 months he is ready for the next switch.',
  invite: { subject: 'Interview Schedule Intimation — Java Developer (Lateral) — Ref: TIP-JD-48213' },
});

export const TEACS = defineCompany({
  id: 'teacs',
  name: 'TeaCS',
  kind: 'service',
  tier: 'B',
  tagline: 'Tea & Coffee Services. Experience certainty — and 47 rounds of document verification.',
  accent: 'indigo',
  brand: { bg: '#1e3a8a', fg: '#fde68a', glyph: '☕' },
  location: 'Any of 52 offices · as per business needs',
  domain: 'teacs.co.in',
  stats: { wlb: 3, toxicity: 3, pay: 2, growth: 2, security: 5 },
  culture: [
    'One of the biggest employers in the country — your joining batch has 4,000 people.',
    'Initial training, then the famous bench.',
    'Rock-solid job security; appraisals arrive like the monsoon — late but certain.',
  ],
  reviews: [{ stars: 3, text: 'Job security like a government job. Hike also like a government job.', by: 'Assistant System Engineer' }],
  vibe: ['Job security', 'Bench', 'Mass hiring'],
  interviewer: {
    name: 'K. Raghavan',
    title: 'Delivery Manager · 24 yrs exp',
    avatar: '\u{1F468}\u{1F3FD}‍\u{1F9B3}',
    intro: 'Good morning. Kindly tell me about yourself in two minutes. Not more. Not less. Starting now.',
    quirks: ['Very nice. This question is from the standard template only.', 'Correct. Kindly maintain the same energy in the client call.'],
  },
  ctc: [4.2, 6],
  epilogue:
    'Sachin joins TeaCS with 3,999 other lateral hires. He gets a joining kit, a laminated ID card and a bench seat with great Wi-Fi. Within two months he’s on a stable banking project — and famous for making the best filter coffee on the floor.',
});

export const INFOSIS = defineCompany({
  id: 'infosis',
  name: 'Infosis',
  kind: 'service',
  tier: 'B',
  tagline: 'Navigate your next. After the twelve-week training, obviously.',
  accent: 'sky',
  brand: { bg: '#0369a1', fg: '#ffffff', glyph: 'i' },
  location: 'Mysuru training campus → Pune',
  domain: 'infosis.co.in',
  stats: { wlb: 3, toxicity: 2, pay: 2, growth: 3, security: 5 },
  culture: [
    'A training campus so big it has its own cinema and bus network.',
    'Thorough training and structured career paths.',
    'Founders’ values posters in every corridor.',
  ],
  reviews: [{ stars: 4, text: 'Best training in the industry. Hikes are modest, but the campus is unreal.', by: 'Senior Systems Engineer' }],
  vibe: ['Campus life', 'Training', 'Values'],
  interviewer: {
    name: 'Lavanya Krishnan',
    title: 'Technology Lead',
    avatar: '\u{1F469}\u{1F3FD}‍\u{1F4BB}',
    intro: 'Hello Sachin! Relax, we are a learning organisation. Let us start with fundamentals.',
    quirks: ['Nice. This will be useful in your twelve-week training.', 'Correct. You could teach this to freshers.'],
  },
  ctc: [4.5, 6.5],
  epilogue:
    'Sachin joins Infosis and spends his first weeks at a campus bigger than his hometown. The training is excellent, the food courts are endless, and he discovers he enjoys mentoring freshers. Steady, structured, sane.',
});

export const ACCENSHURE = defineCompany({
  id: 'accenshure',
  name: 'Accenshure',
  kind: 'service',
  tier: 'B',
  tagline: 'High performance. Delivered. Slides included.',
  accent: 'violet',
  brand: { bg: '#581c87', fg: '#e9d5ff', glyph: '>' },
  location: 'Bengaluru · Client location',
  domain: 'accenshure.co.in',
  stats: { wlb: 2, toxicity: 3, pay: 3, growth: 3, security: 4 },
  culture: [
    'Consulting energy: every problem gets a framework and a 2x2 matrix.',
    'Utilisation targets are watched closely.',
    'Great exposure to many clients and tech stacks.',
  ],
  reviews: [{ stars: 3, text: 'You will learn every tool and attend every meeting. Utilisation is life.', by: 'Application Development Analyst' }],
  vibe: ['Consulting', 'Utilisation', 'Frameworks'],
  interviewer: {
    name: 'Nikhil Arora',
    title: 'Senior Manager · Technology Consulting',
    avatar: '\u{1F9D1}\u{1F3FD}‍\u{1F4BC}',
    intro: 'Hi Sachin. Let’s keep this structured: situation, approach, outcome. Ready?',
    quirks: ['Love it. Let’s put that in a 2x2.', 'Great answer — very billable.'],
  },
  ctc: [6, 8.5],
  topics: { java: 3, web: 2, db: 2, process: 2, cloud: 1 },
  epilogue:
    'Sachin joins Accenshure and gets staffed on three clients in six months. He learns to build slides at the speed of thought, speaks fluent “synergy”, and genuinely levels up by touching every tech stack under the sun.',
});
