import type { HrQuestion } from '../types';

/**
 * The culture-fit round. These don't decide the 70% cut-off, but they move
 * the interviewer's impression — which sets the package and Sachin's stats.
 * "{co}" is replaced with the company name.
 */
export const HR_QUESTIONS: HrQuestion[] = [
  {
    id: 'hr-intro',
    q: 'Let’s start easy. Tell me about yourself.',
    choices: [
      { id: 'a', verdict: 'okay', text: 'I’m Sachin, I finished my B.Tech in 2022, then joined Infinite Loop as a Java developer.', reply: 'Okay... and? Tell me what you actually built.' },
      { id: 'b', verdict: 'best', text: 'I’m a backend developer with two years at Infinite Loop. I built a caching layer that cut latency by 60%, and now I want bigger scale and more ownership — which is why this role excites me.', reply: 'Crisp. Present, past, future — I like that.' },
      { id: 'c', verdict: 'bad', text: 'So, I was born in Indore. My father is a bank manager, my mother is a teacher, and in class 4...', reply: 'Let’s maybe fast-forward a couple of decades.' },
      { id: 'd', verdict: 'best', requires: { stat: 'charisma', min: 60 }, text: 'Open with a 20-second story about debugging production at 3 AM — then connect it to why you want this job.', reply: 'Okay, that’s the most memorable intro I’ve heard all week.' },
    ],
  },
  {
    id: 'hr-leave',
    q: 'Why do you want to leave your current company?',
    choices: [
      { id: 'a', verdict: 'bad', text: 'My manager is toxic and the company is going nowhere.', reply: 'Hmm. Would you say the same about us in two years?' },
      { id: 'b', verdict: 'okay', text: 'Honestly? Mainly the money.', reply: 'Fair. I hope it isn’t the only reason, though.' },
      { id: 'c', verdict: 'best', text: 'I’ve learned a lot there, but I want bigger scale and more ownership than my current team can offer.', reply: 'Growth-focused. Good answer.' },
      { id: 'd', verdict: 'bad', text: 'No particular reason, just exploring the market.', reply: 'So even with an offer, you might still be “just exploring”?' },
    ],
  },
  {
    id: 'hr-5years',
    q: 'Where do you see yourself in five years?',
    choices: [
      { id: 'a', verdict: 'bad', text: 'In your chair, haha.', reply: '...I’ve heard that one before. Several times today.' },
      { id: 'b', verdict: 'best', text: 'Leading the design of a critical system and mentoring a few engineers — ideally growing here.', reply: 'Ambitious and realistic. Nice.' },
      { id: 'c', verdict: 'okay', text: 'Honestly, I haven’t planned that far ahead.', reply: 'Okay. Something worth thinking about.' },
      { id: 'd', verdict: 'bad', text: 'Probably doing an MBA abroad.', reply: 'So we’d be a two-year pit stop?' },
    ],
  },
  {
    id: 'hr-ctc',
    q: 'What’s your expected CTC?',
    choices: [
      { id: 'a', verdict: 'bad', text: 'Whatever you think is right.', reply: 'Great — we’ll keep it... modest.' },
      { id: 'b', verdict: 'okay', text: 'Current plus 30%, as per the market norm.', reply: 'Fine. Let’s see what we can do.' },
      { id: 'c', verdict: 'best', text: 'Based on market data for this role and my experience, I’m looking at a researched range — and I’m open to discussing the full structure.', reply: 'Well researched. We can work with that.' },
      { id: 'd', verdict: 'bad', text: 'Double my current. Non-negotiable.', reply: 'Noted. With a raised eyebrow.' },
      { id: 'e', verdict: 'best', requires: { stat: 'charisma', min: 65 }, text: 'Flip it: “I’d love to understand the band for this role first — I’m confident we’ll find a number that works.”', reply: 'Ha, smooth. The band is wider than you’d think.' },
    ],
  },
  {
    id: 'hr-weakness',
    q: 'What is your biggest weakness?',
    choices: [
      { id: 'a', verdict: 'bad', text: 'I’m a perfectionist.', reply: 'Everyone says that. Everyone.' },
      { id: 'b', verdict: 'okay', text: 'I can be impatient with slow processes.', reply: 'Okay — we do have a few of those.' },
      { id: 'c', verdict: 'bad', text: 'I don’t really have any.', reply: 'Interesting. Self-awareness might be one, then.' },
      { id: 'd', verdict: 'best', text: 'I used to struggle to say no to extra work. Now I time-box requests and flag the trade-offs to my manager early.', reply: 'A real weakness with a real fix. Nice.' },
    ],
  },
  {
    id: 'hr-conflict',
    q: 'Tell me about a conflict with a teammate.',
    choices: [
      { id: 'a', verdict: 'best', text: 'We disagreed on a design. We wrote down the decision criteria, spiked both options for a day and went with the data. We still work well together.', reply: 'Textbook STAR. Love it.' },
      { id: 'b', verdict: 'okay', text: 'I usually let my manager decide.', reply: 'Hmm. And when your manager isn’t around?' },
      { id: 'c', verdict: 'bad', text: 'My teammate was wrong, so I escalated it.', reply: '...Okay.' },
      { id: 'd', verdict: 'bad', text: 'I’ve never had a conflict with anyone.', reply: 'Never? Not even once?' },
    ],
  },
  {
    id: 'hr-whyus',
    q: 'Why do you want to join {co}?',
    choices: [
      { id: 'a', verdict: 'okay', text: 'It’s a great brand and the pay is good.', reply: 'True — but that’s every company’s pitch.' },
      { id: 'b', verdict: 'bad', text: 'Well, you called me, so...', reply: 'Right. We did.' },
      { id: 'c', verdict: 'best', text: 'The scale, the engineering culture and the specific problems this team solves — I read your engineering blog post about it.', reply: 'You did your homework. Rare!' },
      { id: 'd', verdict: 'bad', text: 'A friend works here and says the food is amazing.', reply: 'The food IS amazing. But still.' },
    ],
  },
  {
    id: 'hr-notice',
    q: 'Your notice period is 90 days, and we need someone in 30. Can you join early?',
    choices: [
      { id: 'a', verdict: 'bad', text: 'No problem — I’ll just stop going after 30 days.', reply: 'Absconding? That shows up in background verification.' },
      { id: 'b', verdict: 'best', text: 'I’ll request early release and check the buyout option. Realistically I can commit to 45–60 days, and I’ll confirm within a week.', reply: 'Honest and practical. We can plan around that.' },
      { id: 'c', verdict: 'okay', text: 'I’ll try my best.', reply: 'We’ll need something a bit more concrete.' },
      { id: 'd', verdict: 'bad', text: 'Ninety days. Take it or leave it.', reply: 'Hmm. Noted.' },
    ],
  },
  {
    id: 'hr-questions',
    q: 'Do you have any questions for us?',
    choices: [
      { id: 'a', verdict: 'bad', text: 'No, nothing.', reply: 'Okay then. That’s... all.' },
      { id: 'b', verdict: 'okay', text: 'What’s the work-from-home policy?', reply: 'Fair question. Hybrid — three days in office.' },
      { id: 'c', verdict: 'bad', text: 'How soon can I get promoted?', reply: 'Let’s get you hired first.' },
      { id: 'd', verdict: 'best', text: 'What does success look like in the first 90 days for this role?', reply: 'Great question. Let me tell you.' },
    ],
  },
  {
    id: 'hr-failure',
    q: 'Describe a failure you’re not proud of.',
    choices: [
      { id: 'a', verdict: 'best', text: 'I pushed a config change without a rollback plan and caused a 20-minute outage. I wrote the postmortem, added a checklist, and it hasn’t happened since.', reply: 'Owning it and fixing the process. That’s what we want.' },
      { id: 'b', verdict: 'okay', text: 'I once missed a deadline because the requirements kept changing.', reply: 'Okay — but what did you learn?' },
      { id: 'c', verdict: 'bad', text: 'I don’t think I’ve really failed at anything.', reply: 'Hmm.' },
      { id: 'd', verdict: 'bad', text: 'A release failed because our QA team was terrible.', reply: 'So... not your failure, then?' },
    ],
  },
  {
    id: 'hr-pressure',
    q: 'How do you handle tight deadlines?',
    choices: [
      { id: 'a', verdict: 'okay', text: 'I just work harder and longer.', reply: 'Is that sustainable, though?' },
      { id: 'b', verdict: 'best', text: 'I break the work down, flag risks early, agree on must-haves versus nice-to-haves, and protect focus time.', reply: 'Structured. Good.' },
      { id: 'c', verdict: 'bad', text: 'I panic first, then I code.', reply: 'Honest... alarmingly so.' },
      { id: 'd', verdict: 'bad', text: 'Deadlines are more like suggestions.', reply: 'Not here, they aren’t.' },
    ],
  },
  {
    id: 'hr-others',
    q: 'Are you interviewing anywhere else?',
    choices: [
      { id: 'a', verdict: 'okay', text: 'No, only here.', reply: 'Hmm, okay.' },
      { id: 'b', verdict: 'best', text: 'Yes, I’m talking to a couple of companies — but this role is my top choice because of the team and the problems.', reply: 'Thanks for being transparent.' },
      { id: 'c', verdict: 'bad', text: 'Yes, and I have three offers. Match the highest or I walk.', reply: 'Bold. Very bold.' },
      { id: 'd', verdict: 'best', requires: { stat: 'charisma', min: 60 }, text: '“I have an offer in hand, but I’d rather be here — help me make the decision easy.”', reply: 'Okay, now I want to close you. Let me talk to the team.' },
    ],
  },
];

const BY_ID: Record<string, HrQuestion> = Object.fromEntries(HR_QUESTIONS.map((q) => [q.id, q]));

export const getHrQuestion = (id: string): HrQuestion | undefined => BY_ID[id];
