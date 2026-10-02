import type { Company } from '../../types';

export const TIPRO: Company = {
  id: 'tipro',
  name: 'Tipro',
  kind: 'Service-based IT giant',
  tagline: 'Delivering excellence to our esteemed clients since 1945*. (*vegetable oil era)',
  accent: 'indigo',
  location: 'Any Tipro campus · as per business needs',
  stats: { wlb: 3, toxicity: 3, pay: 2, growth: 2, security: 5 },
  culture: [
    'The client is god. The client’s timezone is also god.',
    'Timesheets, compliance trainings and a 90-day notice period.',
    'Job security is excellent — the bench is comfortable and has free Wi-Fi.',
    'Appraisals arrive on time. The hike arrives “in line with budget”.',
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
    intro:
      'Good morning Sachin. Kindly tell me about yourself... okay, okay, that is sufficient. We will proceed with the technical round as per the template.',
    tierLines: [
      'Basic question first, as per template.',
      'Now some theory.',
      'Practical question now. Client scenario.',
      'Now advanced level, as mentioned in JD.',
      'Final question from my side... and maybe one more.',
    ],
    onCorrect: [
      'Very good. Process-oriented answer.',
      'Correct. This is what the client expects.',
      'Good, good. Next question as per template.',
      'Excellent. You will do well on the bench — I mean, in the project.',
    ],
    onWrong: [
      'Hmm. This is basic, Sachin.',
      'Not correct. Freshers also know this.',
      'Kindly revisit your fundamentals.',
      '*writes “Average” in the evaluation sheet*',
    ],
    onTimeout: 'Time is over. Client also does not wait, Sachin.',
  },
  ladder: ['2.5 LPA', '3 LPA', '3.25 LPA', '3.5 LPA', '3.75 LPA', '4 LPA', '4.5 LPA', '5 LPA', '5.5 LPA', '6.5 LPA'],
  invite: {
    from: 'Tipro Talent Acquisition',
    email: 'ta-noreply@tipro.co.in',
    subject: 'Interview Schedule Intimation — Java Developer (Lateral) — Ref: TIP-JD-48213',
    preview: 'Dear Candidate, Greetings from Tipro Limited! You have been shortlisted for the Technical Interview...',
    body: [
      'Dear Candidate,',
      'Greetings from Tipro Limited! You have been shortlisted for the Technical Interview for the position of Project Engineer (Java).',
      'Kindly carry: 2 passport-size photographs, Aadhaar, all mark sheets (self-attested photocopies) and a black pen. Reporting time: 9:00 AM sharp. The process may take the full day.',
      'The technical round has 10 questions with increasing difficulty. A minimum of 70% is required to proceed.',
    ],
  },
  offer: {
    subject: 'Offer Letter — Project Engineer — Ref: TIP/HR/2026/0047831',
    role: 'Project Engineer (Java)',
    body: [
      'Dear Sachin,',
      'With reference to your interview, we are pleased to offer you the position of Project Engineer at Tipro Limited, subject to background verification.',
    ],
    perks: ['Variable pay of “up to” 15%', 'Group medical insurance', 'Training at a sprawling campus with 9 food courts', 'Free transport (shift-based)'],
    finePrint: '*Location: any Tipro campus as per business needs. Notice period: 90 days. Joining date subject to project allocation.',
    signoff: 'Talent Acquisition Team · Tipro Limited',
  },
  rejection: {
    subject: 'Status of your candidature — Ref: TIP-JD-48213',
    body: [
      'Dear Candidate,',
      'Thank you for your interest in Tipro Limited. We regret to inform you that your profile has not been shortlisted for the next round.',
      'Your details will be retained in our database for future opportunities. This is a system-generated email; please do not reply.',
    ],
    signoff: 'Talent Acquisition Team · Tipro Limited',
  },
  reactions: {
    great: {
      mood: '\u{1F60E}',
      headline: 'Too easy?',
      thought:
        'Final, finally, finalize — I have been answering that since second year of engineering. He looked impressed. Then he said “package as per company norms” and I felt my soul leave my body.',
      text: 'cleared tipro \u{1F60E} ab koi 3.5 LPA wala joke mat maarna',
    },
    meh: {
      mood: '\u{1F610}',
      headline: 'Process: complete',
      thought:
        'It went... as per process. He asked “Are you ready to relocate anywhere in India?” I said yes. I do not know why I said yes.',
      text: 'interview hua. relocation ke liye haan bol diya \u{1F643}',
    },
    bad: {
      mood: '\u{1F635}',
      headline: 'Fumbled the fundamentals',
      thought:
        'I blanked on basics I teach juniors. Mr. Srinivasan wrote one word on his sheet. Upside down, it looked a lot like “NO”.',
      text: 'bhai fundamentals pe hi phisal gaya \u{1F972}',
    },
  },
  epilogue:
    'Sachin joins Tipro and spends three weeks on the bench finishing a mandatory compliance course. Then he is posted to a banking client in Chennai. Job security: maximum. Excitement: buffering. He studies on weekends, and in 18 months he is ready for the next switch.',
};
