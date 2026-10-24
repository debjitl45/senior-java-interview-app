/**
 * Non-interview mails that drift into Sachin's inbox over the season.
 * Each one carries a small real-world lesson revealed when it's opened.
 */
export type MailTone = 'accent' | 'good' | 'bad' | 'warn' | 'neutral';

export interface FlavorMail {
  id: string;
  /** Arrives at the start of this week. */
  week: number;
  from: string;
  email: string;
  avatar: string;
  subject: string;
  preview: string;
  body: string[];
  tag: { label: string; tone: MailTone };
  tipTitle: string;
  tip: string;
}

export const FLAVOR_MAILS: FlavorMail[] = [
  {
    id: 'm-jobkart',
    week: 1,
    from: 'JobKart Alerts',
    email: 'alerts@jobkart.in',
    avatar: '\u{1F4BC}',
    subject: '47 recruiters viewed your profile this week!',
    preview: 'Upgrade to JobKart Premium to see who they are...',
    body: ['Hi Sachin,', '47 recruiters viewed your profile this week! Upgrade to JobKart Premium (₹1,499/month) to see who they are.', 'P.S. Your profile is 62% complete. Add your expected CTC to stand out!'],
    tag: { label: 'Promotions', tone: 'neutral' },
    tipTitle: 'Make your profile searchable',
    tip: 'Profile views are vanity metrics. A headline like “Java Backend Developer · 2 YOE · Spring Boot, Kafka, AWS” is what actually gets you found in recruiter searches.',
  },
  {
    id: 'm-mom',
    week: 1,
    from: 'Mom',
    email: 'mom@family.home',
    avatar: '\u{1F469}\u{1F3FD}',
    subject: 'Beta khana khaya?',
    preview: 'Sharma ji ka beta joined some big company in Bangalore...',
    body: ['Beta, khana khaya?', 'Sharma ji ka beta joined some big company in Bangalore. 40 lakh package. Just saying.', 'Also call Mama ji, he is asking about you. Take care. Wear a sweater.'],
    tag: { label: 'Family', tone: 'good' },
    tipTitle: 'Compete with yesterday’s you',
    tip: 'Comparison steals your sleep. Track your own progress — rounds cleared, concepts learned — not Sharma ji’s son’s package.',
  },
  {
    id: 'm-scam',
    week: 3,
    from: 'Global WFH Solutions',
    email: 'hr.selection.desk@quick-jobs-online.biz',
    avatar: '\u{1F911}',
    subject: 'CONGRATULATIONS!!! Selected for Work From Home – ₹45,000/week',
    preview: 'Pay only ₹2,999 registration fee to confirm your seat...',
    body: ['Dear Selected Candidate,', 'You are selected for Data Entry (Work From Home). Earn ₹45,000 per WEEK. No interview needed!!!', 'Pay only ₹2,999 refundable registration fee via UPI to confirm your seat. Offer valid for 2 hours only.'],
    tag: { label: 'Spam', tone: 'bad' },
    tipTitle: '\u{1F6A9} This is a scam',
    tip: 'Real employers never charge registration, training, laptop or “verification” fees, and never hire without an interview. Report it, block it, delete it.',
  },
  {
    id: 'm-linkedup',
    week: 5,
    from: 'LinkedUp',
    email: 'notifications@linkedup.social',
    avatar: '\u{1F517}',
    subject: 'You appeared in 9 searches this week',
    preview: 'Rohit endorsed you for Microsoft Word...',
    body: ['Hi Sachin,', 'You appeared in 9 searches this week.', 'Rohit endorsed you for: Microsoft Word.', 'Your ex-classmate posted: “Humbled and honoured to announce...”'],
    tag: { label: 'Social', tone: 'neutral' },
    tipTitle: 'Signal beats noise',
    tip: 'Endorsements are noise; projects with measurable outcomes are signal. Pin one project with a number in it — “cut p99 latency by 60%”.',
  },
  {
    id: 'm-otp',
    week: 7,
    from: 'Bank Alert Team',
    email: 'kyc-update@secure-banking-verify.co',
    avatar: '\u{1F3E6}',
    subject: 'URGENT: Your account will be BLOCKED in 24 hrs — update KYC now',
    preview: 'Share the OTP you receive to verify your identity...',
    body: ['Dear Customer,', 'Your KYC is pending and your account will be blocked in 24 hours.', 'To verify, reply with the OTP you receive in the next 5 minutes, or click the link below to update your details immediately.'],
    tag: { label: 'Spam', tone: 'bad' },
    tipTitle: '\u{1F6A9} Never share an OTP',
    tip: 'Banks never ask for OTPs, PINs or passwords by call, SMS or email. Urgency plus a link is the classic phishing pattern — contact your bank through its official app or number instead.',
  },
  {
    id: 'm-ananya',
    week: 9,
    from: 'Ananya (Senior Engineer)',
    email: 'ananya@infiniteloop.dev',
    avatar: '\u{1F469}\u{1F3FD}‍\u{1F4BB}',
    subject: 'heard you’re interviewing \u{1F440}',
    preview: 'Ping me if you want a mock system-design round...',
    body: ['Hey Sachin,', 'Heard you’re interviewing \u{1F440} Your secret is safe with me. Ping me if you want a mock system-design round this weekend.', 'And whatever happens: ALWAYS negotiate. The first number is never the last number.'],
    tag: { label: 'Work', tone: 'accent' },
    tipTitle: 'Negotiate — politely, with data',
    tip: 'First offers usually have room. Anchor with market data and competing offers, stay warm, and get the final numbers in writing.',
  },
  {
    id: 'm-ctc',
    week: 11,
    from: 'TalentHunt Consultants',
    email: 'priya.recruits@talenthunt-jobs.net',
    avatar: '\u{1F4C7}',
    subject: 'Kindly share current CTC + 3 payslips + Aadhaar + PAN for profile push',
    preview: 'Exciting opening with a leading MNC. Kindly share...',
    body: ['Hi Sachin,', 'Exciting opening with a “leading MNC” (cannot disclose name). Kindly share your current CTC, last three payslips, Aadhaar and PAN so I can push your profile today.'],
    tag: { label: 'Recruiter', tone: 'warn' },
    tipTitle: 'Share documents only when needed',
    tip: 'Early in a process, share your expected range — not payslips or identity documents. Send those only to a verified employer after an offer, through their official onboarding portal.',
  },
  {
    id: 'm-card',
    week: 13,
    from: 'BankOfEverything Cards',
    email: 'offers@bankofeverything.co',
    avatar: '\u{1F4B3}',
    subject: 'Pre-approved! Platinum credit card with ₹5 lakh limit',
    preview: 'Lifetime free* (*conditions apply)...',
    body: ['Dear Valued Customer,', 'Congratulations! You are pre-approved for a Platinum credit card with a ₹5,00,000 limit. Lifetime free*.', '*Annual fee waived on spends above ₹4 lakh. Interest 42% p.a.'],
    tag: { label: 'Promotions', tone: 'neutral' },
    tipTitle: 'Build the emergency fund first',
    tip: 'Before a new salary upgrades your lifestyle, park six months of expenses in an emergency fund. Layoffs and gaps between jobs are part of the corporate weather.',
  },
  {
    id: 'm-timesheet',
    week: 15,
    from: 'Infinite Loop HR Ops',
    email: 'hr-ops@infiniteloop.dev',
    avatar: '⏰',
    subject: 'REMINDER: Timesheet not filled for 3 days',
    preview: 'Please fill your timesheet by EOD to avoid salary processing delays...',
    body: ['Dear Associate,', 'Our records show your timesheet has not been filled for 3 working days. Please fill it by EOD to avoid salary processing delays.', 'This is an automated reminder. Please do not reply.'],
    tag: { label: 'Work', tone: 'warn' },
    tipTitle: 'Boring admin is real money',
    tip: 'Timesheets, leave records and tax declarations cause real money problems when ignored. Batch them every Friday — future you will be grateful.',
  },
  {
    id: 'm-pf',
    week: 18,
    from: 'Provident Fund Updates',
    email: 'passbook@pf-updates.mail',
    avatar: '\u{1F3DB}️',
    subject: 'Your PF contribution for this month has been credited',
    preview: 'Employer and employee contributions credited to your account...',
    body: ['Dear Member,', 'Employer and employee contributions for this month have been credited to your provident fund account.'],
    tag: { label: 'Finance', tone: 'good' },
    tipTitle: 'Take your PF with you',
    tip: 'When you switch jobs, give your new employer your UAN and transfer the old PF balance instead of leaving it behind or withdrawing it early.',
  },
  {
    id: 'm-gang',
    week: 21,
    from: 'College Gang',
    email: 'batch-of-2024@groups.mail',
    avatar: '\u{1F393}',
    subject: 'Reunion plan?? + who’s hiring (asking for a friend)',
    preview: 'Guys, Goa plan is ON. Also, is anyone’s company hiring...',
    body: ['Guys, Goa plan is ON for December. No excuses this time.', 'Also, is anyone’s company hiring? Asking for a friend. The friend is me.', '— Sent from my phone (EMI 7 of 24)'],
    tag: { label: 'Friends', tone: 'good' },
    tipTitle: 'Your network is your net worth',
    tip: 'Many good roles are filled through referrals. Stay in touch with ex-colleagues and batchmates before you need something — not only when you do.',
  },
  {
    id: 'm-insurance',
    week: 24,
    from: 'Infinite Loop Benefits Desk',
    email: 'benefits@infiniteloop.dev',
    avatar: '\u{1FA7A}',
    subject: 'Reminder: group health cover ends on your last working day',
    preview: 'If you are serving notice, please plan your health cover...',
    body: ['Dear Associate,', 'Please note that group health insurance ends on your last working day. If you are serving notice, kindly plan accordingly.'],
    tag: { label: 'Work', tone: 'warn' },
    tipTitle: 'Have your own health cover',
    tip: 'Corporate insurance disappears the day you leave. A personal health policy (plus a top-up) protects you in the gap between jobs.',
  },
];

const BY_ID: Record<string, FlavorMail> = Object.fromEntries(FLAVOR_MAILS.map((m) => [m.id, m]));

export const getFlavorMail = (id: string): FlavorMail | undefined => BY_ID[id];
