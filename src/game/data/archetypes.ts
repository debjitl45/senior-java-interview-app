import type { Company, CompanyKind, Persona, Reaction, ReactionBucket, Topic } from '../types';

/**
 * Shared voice for each kind of company. A company seed only states what
 * makes it unique; everything else (mails, bar raiser, HR, reactions)
 * comes from its archetype and can still be overridden per company.
 */
export interface Archetype {
  label: string;
  tierLines: [string, string, string, string, string];
  onCorrect: string[];
  onWrong: string[];
  onTimeout: string;
  barRaisers: (Persona & { intro: string })[];
  hrs: Persona[];
  topics: Partial<Record<Topic, number>>;
  invite: (name: string, domain: string) => Company['invite'];
  offer: (name: string) => Company['offer'];
  rejection: (name: string) => Company['rejection'];
  reactions: (name: string) => Record<ReactionBucket, Reaction>;
}

const lower = (s: string) => s.toLowerCase().replace(/\s+/g, '');

export const ARCHETYPES: Record<CompanyKind, Archetype> = {
  product: {
    label: 'Product company',
    tierLines: [
      'Let’s start simple.',
      'Okay, slightly harder now.',
      'Let’s talk trade-offs.',
      'Now let’s see how you think at scale.',
      'Last stretch. These separate L4 from L5.',
    ],
    onCorrect: ['Nice. That’s optimal.', 'Good. Let’s raise the bar.', 'Clean reasoning. Moving on.', 'Correct — and the reasoning matters more than the answer.'],
    onWrong: ['Hmm. Let’s revisit the constraints...', 'Interesting approach. Not quite, though.', 'Okay. We’ll come back to that. (We won’t.)', '*types something long into the feedback doc*'],
    onTimeout: 'Time’s up. In a real loop, silence is the only truly wrong answer.',
    barRaisers: [
      { name: 'Dr. Lakshmi Rao', title: 'Principal Engineer · Bar raiser', avatar: '\u{1F469}\u{1F3FD}‍\u{1F52C}', intro: 'I’m the bar raiser. I don’t care if you get it right — I care if you can defend it.' },
      { name: 'Vivek Menon', title: 'Senior Staff Engineer · Bar raiser', avatar: '\u{1F9D4}\u{1F3FD}', intro: 'Let’s go deeper. Assume everything you just said is on fire at 10x scale.' },
    ],
    hrs: [
      { name: 'Ishita Kapoor', title: 'Recruiter · Hiring committee', avatar: '\u{1F469}\u{1F3FD}‍\u{1F4BC}' },
      { name: 'Daniel Fernandes', title: 'People Partner', avatar: '\u{1F9D1}\u{1F3FD}‍\u{1F4BC}' },
    ],
    topics: { dsa: 3, java: 2, concurrency: 2, design: 3, db: 1, web: 1 },
    invite: (name, domain) => ({
      from: `${name} Recruiting`,
      email: `careers@${domain}`,
      subject: `Interview invitation: Software Engineer II at ${name}`,
      body: [
        'Hi Sachin,',
        `Thanks for your interest in ${name}! We’d like to invite you to our interview loop for Software Engineer II (Backend, Java).`,
        'Format: a technical screen and a bar-raiser deep dive (10 questions, increasing difficulty), then a culture-fit conversation. You need 70% in the technical rounds to move forward.',
        'Recruiter tip: think out loud and always state the complexity of your answer.',
      ],
    }),
    offer: (name) => ({
      subject: `\u{1F389} Your offer from ${name}`,
      role: 'Software Engineer II, Backend',
      body: ['Hi Sachin,', `Congratulations! The hiring committee at ${name} has approved an offer. We were impressed by how clearly you reasoned about trade-offs.`],
      perks: ['RSUs vesting over 4 years', 'Health cover for you and your family', 'Learning budget and conference passes'],
      finePrint: '*Start date subject to team matching and background verification.',
      signoff: `${name} Recruiting`,
    }),
    rejection: (name) => ({
      subject: `Update on your ${name} application`,
      body: [
        'Hi Sachin,',
        'Thank you for the time you invested in our interview loop. After careful review, the hiring committee has decided not to move forward at this time.',
        'The bar is calibrated high, and many of our engineers interviewed more than once. You are welcome to reapply in the future.',
      ],
      signoff: `${name} Recruiting`,
    }),
    reactions: (name) => ({
      great: {
        mood: '\u{1F929}',
        headline: `Did I just clear ${name}?!`,
        thought: 'The bar raiser actually nodded. Twice. I explained trade-offs better than I do in my own sprint reviews.',
        text: `bhai ${name} ka loop mast gaya \u{1F525}`,
      },
      meh: {
        mood: '\u{1F62C}',
        headline: `Borderline at ${name}`,
        thought: 'Some answers were clean, some were... creative. Now begins the most stressful activity known to engineers: waiting for a hiring committee.',
        text: '50-50 hai bhai. pray for me \u{1F64F}',
      },
      bad: {
        mood: '\u{1F480}',
        headline: `${name} cooked me`,
        thought: 'The bar raiser asked one follow-up and my brain returned a 503. LeetCode, my old friend, here I come.',
        text: `bro I just got ${lower(name)}-ed \u{1F62D}`,
      },
    }),
  },

  bank: {
    label: 'Bank / fintech giant',
    tierLines: [
      'Let us begin with fundamentals.',
      'Now, a little deeper.',
      'Here is a production scenario from our trading desk.',
      'Regulators will ask about this one.',
      'Final question. This is the one that moves money.',
    ],
    onCorrect: ['Precisely. That is how we do it here.', 'Correct. Audit would approve.', 'Good. Risk is managed.', 'Excellent. No regulatory fine today.'],
    onWrong: ['That would fail an audit, Sachin.', 'Hmm. Somebody would lose money with that answer.', 'Not quite. Compliance is frowning.', '*makes a note in a very formal template*'],
    onTimeout: 'Time is up. Markets don’t wait, and neither do we.',
    barRaisers: [
      { name: 'Rajiv Khanna', title: 'Executive Director · Technology', avatar: '\u{1F468}\u{1F3FD}‍\u{1F4BC}', intro: 'I run systems that settle billions a day. My questions are about what happens when things go wrong.' },
      { name: 'Sarah D’Souza', title: 'Managing Director · Engineering', avatar: '\u{1F469}\u{1F3FD}‍\u{1F4BC}', intro: 'Correctness first, speed second, opinions last. Shall we?' },
    ],
    hrs: [{ name: 'Nandini Iyer', title: 'Talent Acquisition · Lateral hiring', avatar: '\u{1F469}\u{1F3FD}‍\u{1F4BC}' }],
    topics: { java: 3, concurrency: 2, db: 2, finance: 4, design: 1, dsa: 1 },
    invite: (name, domain) => ({
      from: `${name} Talent Acquisition`,
      email: `ta@${domain}`,
      subject: `Interview invitation — Java Developer (Associate) — ${name}`,
      body: [
        'Dear Sachin,',
        `Thank you for your interest in ${name} Technology. We are pleased to invite you to interview for the role of Java Developer (Associate).`,
        'The process has two technical rounds (10 questions; a minimum of 70% is required) followed by an HR discussion. Please keep a valid photo ID ready.',
      ],
    }),
    offer: (name) => ({
      subject: `Offer of employment — Associate, Technology — ${name}`,
      role: 'Associate, Technology (Java)',
      body: ['Dear Sachin,', `We are delighted to offer you the position of Associate in ${name} Technology, subject to background verification and regulatory checks.`],
      perks: ['Annual performance bonus', 'Comprehensive medical cover', 'Subsidised home-loan rates'],
      finePrint: '*Strict information-security policy. Personal trading needs pre-clearance. Office-first culture.',
      signoff: `${name} Human Resources`,
    }),
    rejection: (name) => ({
      subject: `Your application with ${name}`,
      body: [
        'Dear Sachin,',
        'Thank you for taking the time to interview with us. After careful consideration, we will not be proceeding with your application at this time.',
        'We will retain your profile for suitable future openings.',
      ],
      signoff: `${name} Human Resources`,
    }),
    reactions: (name) => ({
      great: {
        mood: '\u{1F60E}',
        headline: `${name}: approved`,
        thought: 'They asked about money, rounding and audit trails, and I answered like someone who has never once stored currency in a double.',
        text: 'banking interview cleared \u{1F4BC} ab main “finance wala” hoon',
      },
      meh: {
        mood: '\u{1F610}',
        headline: 'Pending compliance review',
        thought: 'It went okay. Every answer felt like it needed four approvals. Now my fate sits in an inbox behind a regulatory deadline.',
        text: 'bank interview done. result: “under review” \u{1FAE0}',
      },
      bad: {
        mood: '\u{1F635}',
        headline: 'Audit failed',
        thought: 'The Managing Director asked a question about money and my answer would have made a risk officer faint.',
        text: 'bank interview mein double use kar diya \u{1F480}',
      },
    }),
  },

  service: {
    label: 'IT services giant',
    tierLines: [
      'Basic question first, as per template.',
      'Now some theory.',
      'Practical question now. Client scenario.',
      'Now advanced level, as mentioned in the JD.',
      'Final question from my side... and maybe one more.',
    ],
    onCorrect: ['Very good. Process-oriented answer.', 'Correct. This is what the client expects.', 'Good, good. Next question as per template.', 'Excellent. You will do well on the bench — I mean, in the project.'],
    onWrong: ['Hmm. This is basic, Sachin.', 'Not correct. Freshers also know this.', 'Kindly revisit your fundamentals.', '*writes “Average” in the evaluation sheet*'],
    onTimeout: 'Time is over. Client also does not wait, Sachin.',
    barRaisers: [
      { name: 'S. Venkatesh', title: 'Senior Delivery Manager · 22 yrs exp', avatar: '\u{1F468}\u{1F3FD}‍\u{1F9B3}', intro: 'Now I will ask some advanced questions. Kindly answer as per standard practices only.' },
      { name: 'Anita Deshmukh', title: 'Practice Head · Java', avatar: '\u{1F469}\u{1F3FD}‍\u{1F3EB}', intro: 'Our clients are Fortune 500. Let us see if your answers are Fortune 500.' },
    ],
    hrs: [{ name: 'Priyanka Rao', title: 'HR Executive', avatar: '\u{1F469}\u{1F3FD}‍\u{1F4BC}' }],
    topics: { basics: 3, java: 3, db: 2, process: 2, web: 1 },
    invite: (name, domain) => ({
      from: `${name} Talent Acquisition`,
      email: `ta-noreply@${domain}`,
      subject: `Interview Schedule Intimation — Java Developer (Lateral) — ${name}`,
      body: [
        'Dear Candidate,',
        `Greetings from ${name}! You have been shortlisted for the Technical Interview for the position of Project Engineer (Java).`,
        'Kindly carry 2 passport-size photographs, a government ID and self-attested copies of all mark sheets. Reporting time: 9:00 AM sharp.',
        'The technical rounds have 10 questions of increasing difficulty. A minimum of 70% is required to proceed to HR.',
      ],
    }),
    offer: (name) => ({
      subject: `Offer Letter — Project Engineer — ${name}`,
      role: 'Project Engineer (Java)',
      body: ['Dear Sachin,', `With reference to your interview, we are pleased to offer you the position of Project Engineer at ${name}, subject to background verification.`],
      perks: ['Variable pay of “up to” 15%', 'Group medical insurance', 'Training at a sprawling campus with many food courts'],
      finePrint: '*Location: any campus as per business needs. Notice period: 90 days. Joining date subject to project allocation.',
      signoff: `Talent Acquisition Team · ${name}`,
    }),
    rejection: (name) => ({
      subject: `Status of your candidature — ${name}`,
      body: [
        'Dear Candidate,',
        `Thank you for your interest in ${name}. We regret to inform you that your profile has not been shortlisted for the next round.`,
        'Your details will be retained in our database for future opportunities. This is a system-generated email; please do not reply.',
      ],
      signoff: `Talent Acquisition Team · ${name}`,
    }),
    reactions: (name) => ({
      great: {
        mood: '\u{1F60E}',
        headline: 'Too easy?',
        thought: 'Final, finally, finalize — I have been answering that since second year. Then they said “package as per company norms” and my soul left my body.',
        text: `cleared ${name} \u{1F60E} ab koi 3.5 LPA wala joke mat maarna`,
      },
      meh: {
        mood: '\u{1F610}',
        headline: 'Process: complete',
        thought: 'It went... as per process. They asked “Are you ready to relocate anywhere in India?” I said yes. I do not know why I said yes.',
        text: 'interview hua. relocation ke liye haan bol diya \u{1F643}',
      },
      bad: {
        mood: '\u{1F635}',
        headline: 'Fumbled the fundamentals',
        thought: 'I blanked on basics I teach juniors. The interviewer wrote one word on his sheet. Upside down, it looked a lot like “NO”.',
        text: 'bhai fundamentals pe hi phisal gaya \u{1F972}',
      },
    }),
  },

  startup: {
    label: 'Funded start-up',
    tierLines: [
      'Warm-up, quick-fire!',
      'Okay, real-world stuff now.',
      'Let’s talk production.',
      'Scale time. Think festival-sale traffic.',
      'Boss level. This is what breaks start-ups.',
    ],
    onCorrect: ['Let’s gooo! \u{1F680}', 'That’s the energy we need at 2 AM on-call.', 'Ship it! \u{1F525}', 'Bro, you’d crush our Friday deploys.'],
    onWrong: ['Oof. That would take prod down during the sale.', 'Hmm, our customers would be very loud on Twitter.', 'Not quite — but we value learning fast!', 'That’s a P0 incident waiting to happen.'],
    onTimeout: 'Clock’s out! At a start-up, “I’ll think about it” is also an answer. The wrong one.',
    barRaisers: [
      { name: 'Aditi Rao', title: 'Co-founder & CEO', avatar: '\u{1F469}\u{1F3FD}‍\u{1F680}', intro: 'I’m the CEO, but I wrote the first version of our backend. Don’t make me regret hiring myself.' },
      { name: 'Zaid Khan', title: 'Head of Engineering', avatar: '\u{1F9D1}\u{1F3FD}‍\u{1F527}', intro: 'I’ll ask about scale and failure. Everything here breaks on sale day.' },
    ],
    hrs: [{ name: 'Meghna', title: 'Head of People (and office DJ)', avatar: '\u{1F469}\u{1F3FD}‍\u{1F3A4}' }],
    topics: { web: 3, db: 2, design: 2, cloud: 2, java: 1, concurrency: 1 },
    invite: (name, domain) => ({
      from: `Hiring @ ${name}`,
      email: `jobs@${domain}`,
      subject: `yo Sachin — let’s build something big at ${name} \u{1F680}`,
      body: [
        'Hey Sachin!',
        `We’re hiring backend engineers who love shipping and don’t panic when PagerDuty sings. We think you’d fit right in at ${name}.`,
        'Quick 10-question jam with the team — real problems from our stack, getting harder as we go — then a vibe check. Clear 70% and we talk offers the same week.',
      ],
    }),
    offer: (name) => ({
      subject: '\u{1F680} Welcome to the rocket ship, Sachin!',
      role: 'Backend Engineer (SDE II)',
      body: ['Sachin!!', `The team loved you. We want you on board at ${name} ASAP — like, yesterday. Here’s the deal:`],
      perks: ['ESOPs: 4-year vesting, 1-year cliff', 'Unlimited leave*', 'MacBook + standing desk'],
      finePrint: '*Unlimited leave subject to sprint deadlines. On-call rotation: weekly. Funding runway: “comfortable”.',
      signoff: `Founders · ${name}`,
    }),
    rejection: () => ({
      subject: 'Not this time \u{1F494}',
      body: [
        'Hey Sachin,',
        'Loved the vibe, honestly. But for this role we’re optimising for folks who have already handled crazy scale, and we didn’t see enough signal there yet.',
        'Stay hungry — we’ll be hiring again after the next funding round.',
      ],
      signoff: 'The founding team',
    }),
    reactions: (name) => ({
      great: {
        mood: '\u{1F680}',
        headline: 'Start-up energy: unlocked',
        thought: 'The founder said “bro, you get it” three times. I’m 80% sure I’ll be on-call in week one and 100% sure I want those ESOPs.',
        text: `${lower(name)} founders literally said I get it \u{1F680}\u{1F680}`,
      },
      meh: {
        mood: '\u{1F914}',
        headline: 'Vibe check: pending',
        thought: 'They want backend plus DevOps plus “a bit of product sense”. I said I’m a fast learner. Everyone says that. I said it faster.',
        text: 'start-up interview was a vibe. result? no idea \u{1F937}',
      },
      bad: {
        mood: '\u{1F972}',
        headline: 'Not rocket-ship material?',
        thought: 'One of my answers would have melted their servers on sale day. The founder’s face looked exactly like a 2 AM PagerDuty alert.',
        text: 'I think I just caused a hypothetical outage \u{1F480}',
      },
    }),
  },

  telecom: {
    label: 'Telecom giant',
    tierLines: [
      'Simple one to begin.',
      'Now — our network handles millions of users...',
      'A real incident from last quarter.',
      'Scale question: think a billion requests.',
      'Final one. This keeps the country connected.',
    ],
    onCorrect: ['Correct. Full signal!', 'Good, good. Five bars.', 'Right. That is carrier-grade thinking.', 'Excellent. The network survives another day.'],
    onWrong: ['Hmm. Call dropped on that one.', 'That would trend as #NetworkDown.', 'Not quite. Too much latency in that answer.', '*signal-weakening noises*'],
    onTimeout: 'Time out. Like a call in a lift.',
    barRaisers: [
      { name: 'Harpreet Singh', title: 'VP · Network Platforms', avatar: '\u{1F473}\u{1F3FD}‍♂️', intro: 'Our systems talk to half the country. Small mistakes become national news. Let’s see how you think.' },
    ],
    hrs: [{ name: 'Sneha Joshi', title: 'Talent Partner', avatar: '\u{1F469}\u{1F3FD}‍\u{1F4BC}' }],
    topics: { design: 3, cloud: 2, java: 2, concurrency: 1, db: 1, web: 1 },
    invite: (name, domain) => ({
      from: `${name} Careers`,
      email: `careers@${domain}`,
      subject: `Interview invite — Backend Engineer (Java) — ${name} Digital`,
      body: [
        'Hi Sachin,',
        `${name} Digital builds platforms used by hundreds of millions of customers, and we’d like to talk to you about a Backend Engineer role.`,
        'Two technical rounds (10 questions, increasing difficulty; 70% to proceed) and a short HR conversation.',
      ],
    }),
    offer: (name) => ({
      subject: `Offer letter — Backend Engineer — ${name} Digital`,
      role: 'Backend Engineer (Java), Digital Platforms',
      body: ['Dear Sachin,', `We are happy to offer you the role of Backend Engineer at ${name} Digital. Your experience with Spring Boot and Kafka impressed the panel.`],
      perks: ['Unlimited data plan (obviously)', 'Performance bonus', 'Health insurance including parents'],
      finePrint: '*Hybrid: 4 days in office. On-call during big cricket matches is mandatory.',
      signoff: `${name} Talent Team`,
    }),
    rejection: (name) => ({
      subject: `Your interview with ${name}`,
      body: [
        'Hi Sachin,',
        'Thank you for your time. We have decided to move forward with candidates whose experience more closely matches our current requirements.',
        'We wish you the best — and full signal.',
      ],
      signoff: `${name} Talent Team`,
    }),
    reactions: (name) => ({
      great: {
        mood: '\u{1F4F6}',
        headline: 'Full signal!',
        thought: 'They asked how to survive a billion requests and I didn’t panic. I might actually build systems my parents use every day.',
        text: `${lower(name)} interview cleared \u{1F4F6} full network`,
      },
      meh: {
        mood: '\u{1F4F3}',
        headline: 'Signal fluctuating',
        thought: 'Some answers had five bars, some said “Emergency calls only”. Waiting for the result like waiting for a page to load on 2G.',
        text: 'telecom interview: 3 bars out of 5 \u{1F4F6}',
      },
      bad: {
        mood: '\u{1F4F5}',
        headline: 'Call dropped',
        thought: 'The VP asked about scale and I described a system that would SMS-bomb the entire country.',
        text: 'interview mein call drop ho gaya \u{1F4F5}',
      },
    }),
  },

  lala: {
    label: 'Lala company (owner-run)',
    tierLines: ['Simple question, beta.', 'Okay, now one more simple one.', 'Now my nephew’s question.', 'Now our client’s question.', 'Last question. Then salary... later.'],
    onCorrect: ['Waah! Very good.', 'Sahi hai beta.', 'Correct! You can also fix printer?', 'Good, good.'],
    onWrong: ['Arey beta, this is basic.', 'Galat. Never mind, we will train you. Unpaid.', 'Hmm. *picks up another phone call*', 'Not correct, but you seem obedient.'],
    onTimeout: 'Beta, time over. Jaldi bolo.',
    barRaisers: [{ name: 'Bunty Jha', title: 'Nephew · “CTO” · 19 yrs old', avatar: '\u{1F466}\u{1F3FD}', intro: 'Bhaiya, I am the CTO. I will ask advanced questions. I learnt them from YouTube yesterday.' }],
    hrs: [{ name: 'Mrs. Jha', title: 'HR & Accounts & Canteen', avatar: '\u{1F475}\u{1F3FD}' }],
    topics: { lala: 5, basics: 2, career: 2 },
    invite: (name, domain) => ({
      from: `${name} HR`,
      email: `hr@${domain}`,
      subject: 'INTERVIEW CALL!!! URGENT JOINING!!!',
      body: ['Dear Candidate,', `You are selected for interview at ${name}. Come tomorrow 10 AM with all ORIGINAL documents.`],
    }),
    offer: (name) => ({
      subject: `APPOINTMENT LETTER (URGENT) — ${name.toUpperCase()}`,
      role: 'Software Developer cum IT Executive',
      body: ['Dear Sachin,', 'Congratulations!!! You must join from Monday.'],
      perks: ['Diwali sweets box', 'Free chai (2 times daily)'],
      finePrint: '*Service bond applicable. Saturday working.',
      signoff: 'Owner',
    }),
    rejection: () => ({
      subject: 'Regarding Interview',
      body: ['Dear Sachin,', 'We are going with another candidate. Best of luck for future.'],
      signoff: 'HR',
    }),
    reactions: () => ({
      great: { mood: '\u{1F605}', headline: 'They loved me?!', thought: 'They called me “beta” eleven times.', text: 'almost hired \u{1F605}' },
      meh: { mood: '\u{1FAE0}', headline: 'What just happened?', thought: 'Half Java, half Tally.', text: 'ye interview tha ya family function? \u{1FAE0}' },
      bad: { mood: '\u{1F921}', headline: 'Rejected?!', thought: 'Life is a circus.', text: 'reject ho gaya \u{1F921}' },
    }),
  },
};
