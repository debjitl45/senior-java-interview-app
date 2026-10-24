import { defineCompany } from './define';

export const JHA2 = defineCompany({
  id: 'jha2',
  name: 'Jha2 Infotech',
  kind: 'lala',
  tier: 'C',
  tagline: 'ISO 9001:2015 Certified*. Web · App · SEO · Tally · Printer repair.',
  accent: 'amber',
  brand: { bg: '#7f1d1d', fg: '#fcd34d', glyph: 'J2' },
  location: 'Laxmi Nagar, above Sharma Sweets, 2nd floor (lift not working)',
  domain: 'gmail.com',
  stats: { wlb: 2, toxicity: 4, pay: 1, growth: 1, security: 2 },
  culture: [
    '“We are like a family here.” Jha ji is the father. Salary is the pocket money.',
    'Six-day week. Saturday is “half day” until 8 PM.',
    'You will learn everything: Java, PHP, SEO, Tally and how to restart the router.',
  ],
  reviews: [
    { stars: 2, text: 'Sir is very nice. Salary is very late.', by: 'Software Developer' },
    { stars: 1, text: 'Joined as Java developer. Now I manage the office Wi-Fi and Jha ji’s Facebook page.', by: 'Full Stack Developer' },
  ],
  vibe: ['Family business', 'Service bond', 'Printer duty'],
  interviewer: {
    name: 'Mr. Jha (Jha ji)',
    title: 'Founder, MD & Chief Everything Officer',
    avatar: '\u{1F474}\u{1F3FD}',
    intro:
      'Aao beta, baitho. Chai piyoge? ...Haan ek minute, phone aa raha hai — haan bolo, nahi nahi, payment kal karenge. Haan, so beta, you know Java, PHP, Android, Photoshop, Tally — all, na?',
    quirks: ['Accha, you can also fix printer?', '*picks up a second phone* Haan, haan, GST kal file karenge.'],
  },
  ctc: [18, 28],
  payUnit: 'month',
  payNote: 'in-hand (approx)',
  epilogue:
    'Sachin joins Jha2 Infotech. On day one he fixes the printer; by week two he is “Head of IT, Web, App and SEO”. Salary arrives on the 19th. He learns resilience, jugaad and how to spot red flags from orbit — lessons that make his next switch the smartest one of his career.',
  invite: {
    from: 'Jha2 Infotech HR',
    email: 'jha2.infotech.hr@gmail.com',
    subject: 'INTERVIEW CALL!!! URGENT JOINING!!! (JAVA/PHP/ANDROID/TALLY)',
    body: [
      'Dear Candidate,',
      'You are selected for interview. Come tomorrow 10 AM with all ORIGINAL documents. Salary: as per company norms. Joining: IMMEDIATE.',
      'Address: Laxmi Nagar, above Sharma Sweets, 2nd floor (lift not working, please use stairs, mind the cylinder).',
      'Interview will be taken by Jha ji (owner) himself. 10 questions only. 70% passing. Very easy.',
      'Regards, HR (Jha ji’s nephew)',
    ],
    redFlags: 'Free email domain, “URGENT JOINING”, salary “as per norms”, and a request for ORIGINAL documents. Go — but keep your eyes open.',
  },
  offer: {
    subject: 'APPOINTMENT LETTER (URGENT) — JHA2 INFOTECH PVT. LTD.',
    role: 'Software Developer cum IT Executive cum SEO Expert',
    body: ['Dear Sachin,', 'Congratulations!!! You are appointed in Jha2 Infotech Pvt. Ltd. You must join from Monday. Bring all original certificates for safe keeping.'],
    perks: ['Diwali sweets box (1 kg)', 'Free chai (2 times daily)', 'Learning opportunity in ALL technologies', 'Family environment'],
    finePrint: '*2-year service bond. Saturday working. Salary credited between the 7th and “whenever client pays”. Leave is a privilege, not a right.',
    signoff: 'Jha ji · Founder & MD',
  },
  rejection: {
    subject: 'Regarding Interview',
    body: [
      'Dear Sachin,',
      'Thank you for coming. We are going ahead with Jha ji’s cousin’s son, who has agreed to work for ₹9k and also knows Tally.',
      'Best of luck for future. Keep in touch, we may call you for printer issue.',
    ],
    signoff: 'HR (Jha ji’s nephew)',
  },
  reactions: {
    great: {
      mood: '\u{1F605}',
      headline: 'Jha ji loves me?!',
      thought: 'He took four phone calls, asked if I can fix the printer, and called me “beta” eleven times. He said “you are hired, almost”. I do not know what “almost” means.',
      text: 'jha ji ne chai pilaayi aur bola almost hired \u{1F605}',
    },
    meh: {
      mood: '\u{1FAE0}',
      headline: 'What just happened?',
      thought: 'Half the interview was Java, half was whether I can do Tally. His nephew sat in and played Candy Crush. I think I passed. I think I want to fail.',
      text: 'bhai ye interview tha ya family function? \u{1FAE0}',
    },
    bad: {
      mood: '\u{1F921}',
      headline: 'Rejected by Jha2?!',
      thought: 'Jha ji said even his nephew knows these answers. His nephew is the CTO. Life is a circus and today I am the clown.',
      text: 'jha2 infotech ne bhi reject kar diya \u{1F921}',
    },
  },
});
