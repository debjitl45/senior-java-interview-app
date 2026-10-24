import type { Scenario } from '../../types';

/** Career crossroads: on-call, onsite offers, AI tools and side hustles. */
export const CAREER: Scenario[] = [
  {
    id: 'pager_3am',
    category: 'career',
    codename: 'OPERATION: 3 AM PAGER',
    location: 'Sachin’s bedroom · 3:04 AM',
    briefing: 'The pager screams. Database CPU at 100%, checkout timing out. Sachin is on call. Ananya, the usual escalation, isn’t picking up.',
    dialogue: [
      { who: 'rakesh', line: '(incident channel) Who’s on this? Client is already emailing.', aside: true },
    ],
    prompt: 'Half-asleep, what does Sachin do?',
    choices: [
      { id: 'pg-runbook', tone: 'Strategic', verdict: 'best', text: 'Follow the runbook: find and kill the runaway query, shift reads to the replica, post status updates every 15 minutes, escalate to the backup on-call, and write a short summary before sleeping.', outcome: 'Checkout recovers in 25 minutes. Your status updates are so clear that Rakesh forwards them to the client as-is.', lesson: 'In incidents: mitigate, communicate, escalate, document. Clear status updates calm everyone down.', effects: { reputation: 7, skill: 3, energy: -10 } },
      { id: 'pg-restart', tone: 'Passive', verdict: 'okay', text: 'Restart services until something works.', outcome: 'The fourth restart works. Nobody knows why, including you. It happens again next week.', lesson: 'Restarts treat symptoms. Find the cause, or at least note what you saw.', effects: { reputation: 2, energy: -10 } },
      { id: 'pg-snooze', tone: 'Evasive', verdict: 'bad', text: 'Snooze the pager. Surely it’ll auto-resolve.', outcome: 'It doesn’t. A two-hour outage, and your name is on the on-call schedule.', lesson: 'On-call is a promise. If you can’t keep it, hand it over before your shift — not during the incident.', effects: { reputation: -12, sanity: -4 } },
      { id: 'pg-panic', tone: 'Emotional', verdict: 'bad', text: 'Call the entire team, one by one, in a panic.', outcome: 'Five tired engineers fix it together. Four of them will remember being woken up for a runbook problem.', lesson: 'Escalate deliberately, along the defined path — not by waking everyone.', effects: { network: -4, energy: -8 } },
    ],
    timeout: { outcome: 'Sachin stares at the alert, frozen, until the backup on-call takes over.', lesson: 'Practise incident response when it’s calm, so 3 AM-you knows what to do.', effects: { reputation: -6, sanity: -4 } },
    minWeek: 3,
  },
  {
    id: 'onsite_offer',
    category: 'career',
    codename: 'OPERATION: LONDON CALLING',
    location: 'Meera’s cabin · Thursday',
    briefing: 'The UK client wants someone onsite in London for six months. The allowance is generous. Sachin is also in the middle of a job hunt.',
    dialogue: [
      { who: 'meera', line: 'They asked for you by name, Sachin. Six months in London. Think about it and tell me by Monday.' },
    ],
    prompt: 'What does Sachin do with the onsite offer?',
    choices: [
      { id: 'oo-terms', tone: 'Strategic', verdict: 'best', text: 'Ask for the terms in writing — allowance, role, accommodation, return plan — check how it fits his goals and family, then decide.', outcome: 'The written terms are good, and the role is genuinely senior. Whatever you decide, you decide with clear eyes — and Meera notes how professionally you handled it.', lesson: 'Big opportunities deserve written terms and a deliberate decision, not an on-the-spot yes.', effects: { reputation: 5, charisma: 2, money: 25 } },
      { id: 'oo-decline', tone: 'Honest', verdict: 'okay', text: 'Politely decline — the timing isn’t right.', outcome: 'Meera understands. The opportunity goes to someone else.', lesson: 'Declining is fine. Just make it a decision, not a reflex.', effects: { sanity: 2 } },
      { id: 'oo-yes', tone: 'Passive', verdict: 'bad', text: 'Say yes immediately, before knowing the allowance or the role.', outcome: 'The allowance turns out to be tiny for London. You spend six months eating meal deals.', lesson: 'Never accept anything — onsite, offer or promotion — before seeing the terms.', effects: { money: 5, sanity: -6 } },
      { id: 'oo-leverage', tone: 'Savage', verdict: 'bad', text: '“Match the London money here, or I’ll take an outside offer.”', outcome: 'Meera withdraws the onsite offer. Leverage without tact is just a threat.', lesson: 'Use opportunities as information, not as weapons.', effects: { reputation: -8 } },
    ],
    timeout: { outcome: 'Monday comes. Someone else is going to London.', lesson: 'Deadlines on opportunities are real.', effects: {} },
    minWeek: 10,
  },
  {
    id: 'ai_leak',
    category: 'career',
    codename: 'OPERATION: COPY-PASTE',
    location: 'Sachin’s laptop · 11:20 PM',
    briefing: 'Sachin has been stuck on a bug for three hours. A public AI chatbot is one paste away — but the file contains customer data and an API key, and company policy forbids sharing either externally.',
    dialogue: [
      { who: 'rohit', line: '(chat) Just paste it in the AI, bro. Who’s going to know?', aside: true },
    ],
    prompt: 'What does Sachin do?',
    choices: [
      { id: 'ai-safe', tone: 'Strategic', verdict: 'best', text: 'Use the company-approved AI tool, or reproduce the bug in a tiny anonymised snippet with no data or secrets.', outcome: 'The minimal reproduction makes the bug obvious within ten minutes. You didn’t even need the AI in the end.', lesson: 'Never paste secrets or customer data into external tools. A minimal reproduction is often the fix itself.', effects: { skill: 4, reputation: 2 } },
      { id: 'ai-ask', tone: 'Honest', verdict: 'okay', text: 'Message Ananya and ask for a quick look tomorrow.', outcome: 'She spots it in five minutes the next morning. You lose a night, but nothing leaks.', lesson: 'Asking a colleague is safe and often fastest.', effects: { skill: 2, network: 2 } },
      { id: 'ai-paste', tone: 'Evasive', verdict: 'bad', text: 'Paste the whole file, API key and all.', outcome: 'The security team’s monitoring flags it. The key is rotated, and you’re in a very long meeting.', lesson: 'Data leaks are career-defining in the wrong way. Policy exists because the risk is real.', effects: { reputation: -15, sanity: -5 } },
      { id: 'ai-quit', tone: 'Passive', verdict: 'bad', text: 'Give up for the night, frustrated.', outcome: 'You sleep badly and start tomorrow already behind.', lesson: 'Stuck is normal. Ask for help instead of stewing.', effects: { sanity: -3 } },
    ],
    timeout: { outcome: 'Sachin stares at the screen until 2 AM.', lesson: 'Time-box being stuck. After an hour, change approach or ask someone.', effects: { energy: -6, sanity: -3 } },
    minWeek: 4,
  },
  {
    id: 'moonlighting',
    category: 'career',
    codename: 'OPERATION: SIDE HUSTLE',
    location: 'WhatsApp · College friend',
    briefing: 'A friend offers Sachin a freelance project: ₹80,000 for six weekends of work. His employment contract says outside work needs written approval.',
    dialogue: [
      { who: 'vikram', line: 'Bro, everyone moonlights. Just don’t tell anyone.', aside: true },
    ],
    prompt: 'Easy money or clean record?',
    choices: [
      { id: 'ml-ask', tone: 'Honest', verdict: 'best', text: 'Read the contract, ask HR whether a non-competing side project can be approved — and decline if it can’t.', outcome: 'HR approves it in writing because it doesn’t compete with any client. You do it on weekends with a clean conscience.', lesson: 'Check your contract and get written approval for outside work. Hidden moonlighting has ended many careers.', effects: { reputation: 3, money: 40, energy: -8 } },
      { id: 'ml-oss', tone: 'Strategic', verdict: 'okay', text: 'Decline, and contribute to open source on weekends instead.', outcome: 'No money, but your GitHub looks great and you learn a lot.', lesson: 'Skills compound too — open source is allowed almost everywhere.', effects: { skill: 3, network: 3 } },
      { id: 'ml-office', tone: 'Evasive', verdict: 'bad', text: 'Do it secretly — on the office laptop.', outcome: 'IT flags the unknown repository on a company device. Now it’s a disciplinary matter.', lesson: 'Never use company devices or time for private work.', effects: { reputation: -15, money: 20 } },
      { id: 'ml-secret', tone: 'Passive', verdict: 'bad', text: 'Do it secretly on your personal laptop at night.', outcome: 'You get the money and the exhaustion — and a constant fear of being found out.', lesson: 'Undisclosed moonlighting is a risk you carry every day.', effects: { money: 80, energy: -14, sanity: -8 } },
    ],
    timeout: { outcome: 'The friend gives the project to someone else.', lesson: 'Not deciding is deciding.', effects: {} },
    minWeek: 8,
  },
  {
    id: 'farewell',
    category: 'career',
    codename: 'OPERATION: LAST DAY',
    location: 'Cafeteria · 4 PM · Farewell cake',
    briefing: 'It’s Sachin’s last week at Infinite Loop. The team ordered a cake that says “All the best Sachine” (they misspelled it). Rakesh hands him the mic.',
    dialogue: [
      { who: 'rakesh', line: 'Sachin, a few words? Keep it short — we have a 5 PM call.' },
      { who: 'ananya', line: '(whispering) Be nice. The industry is small.', aside: true },
    ],
    prompt: 'Thirty people holding paper plates are waiting. What does Sachin say?',
    choices: [
      { id: 'fw-gracious', tone: 'Diplomatic', verdict: 'best', text: 'Thank people by name for specific things, credit the team for what he learned, share his number — and point everyone to the detailed handover doc he wrote.', outcome: 'A few people tear up. Rakesh shakes his hand and says “Door’s always open.” Two colleagues ask for referrals within a month — and you happily give them.', lesson: 'Leave the way you want to be remembered. Farewells and handover docs are how your reputation outlives your badge.', effects: { reputation: 6, network: 8, sanity: 4 } },
      { id: 'fw-short', tone: 'Honest', verdict: 'okay', text: '“Thanks for everything, everyone. I’ll miss you all.” Cake.', outcome: 'Short, warm, done. Nobody will remember the speech, but nobody will remember it badly either.', lesson: 'Simple is fine — a specific thank-you would have gone further.', effects: { network: 2 } },
      { id: 'fw-roast', tone: 'Savage', verdict: 'bad', text: 'Roast Rakesh’s 10 PM calls in front of everyone.', outcome: 'Huge laughs, one very red manager. Six months later, a reference check calls Rakesh.', lesson: 'Your last day is still a work day. Roasts age badly in reference checks.', effects: { reputation: -10, network: -4, sanity: 4 } },
      { id: 'fw-ghost', tone: 'Evasive', verdict: 'bad', text: 'Skip the farewell and leave early — with no handover doc.', outcome: 'Your modules break the following week. Your old team now tells new joiners about you, and not fondly.', lesson: 'A missing handover is the last impression you leave — and it lasts.', effects: { reputation: -8, network: -6 } },
    ],
    timeout: { outcome: 'Sachin mumbles “thank you” and stares at the cake until people start eating.', lesson: 'Prepare three sentences for big moments. It’s enough.', effects: { network: 1 } },
    requires: ['last_week'],
    weight: 30,
  },
];
