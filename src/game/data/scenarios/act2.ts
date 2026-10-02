import type { Scenario } from '../../types';

/** Story beats 3 and 4: appraisal politics, then the endgame of a job switch. */
export const ACT_TWO: Scenario[] = [
  // ------------------------------------------------------------- slot 2
  {
    id: 'appraisal',
    slot: 2,
    codename: 'OPERATION: MEETS EXPECTATIONS',
    location: 'Meeting room “Synergy” · Appraisal 1:1',
    briefing:
      'Sachin shipped the caching layer, mentored the intern and covered six on-call weekends. The appraisal letter says: “Meets Expectations. Hike: 4%.”',
    dialogue: [
      { who: 'rakesh', line: 'So Sachin, overall a good year. “Meets Expectations” is actually a very good rating.' },
      { who: 'pooja', line: 'And 4% is in line with the budget this year. The market is tough, you know.' },
    ],
    prompt: 'Sachin’s rent just went up 10%. What does he say?',
    choices: [
      {
        id: 'appraisal-ultimatum',
        tone: 'Savage',
        text: 'Match 20% or I resign. Today.',
        verdict: 'bad',
        outcome:
          'With no offer in hand, it’s a bluff. Pooja calmly says, “We respect your decision.” Now everyone knows you’re leaving — and you aren’t, yet.',
        lesson: 'Never issue an ultimatum you can’t execute. Leverage is an offer letter, not a threat.',
        effects: { manager: -15, hr: -10, sanity: -5 },
      },
      {
        id: 'appraisal-data',
        tone: 'Strategic',
        text: 'Thanks. Help me understand the gap: I delivered the caching project, cut latency 60% and covered six on-call weekends. What would “Exceeds” have needed — and can we put those goals in writing for a mid-year review?',
        verdict: 'best',
        outcome:
          'Rakesh doesn’t really have an answer. Pooja writes it down. You leave with written goals and a mid-year review date — leverage now, and evidence for later.',
        lesson: 'Bring receipts, ask for criteria, and turn a disappointing number into a written plan with dates.',
        effects: { manager: 5, hr: 10, sanity: 5 },
      },
      {
        id: 'appraisal-levers',
        tone: 'Diplomatic',
        text: 'Understood. If the budget is fixed, can we look at other levers — a certification budget, a title change or an extra WFH day?',
        verdict: 'okay',
        outcome:
          'Pooja approves a certification budget. Nice — but you never challenged the rating itself, so next year’s hike starts from the same “Meets”.',
        lesson: 'Non-cash levers are worth asking for, but fix the rating first — it compounds into every future hike.',
        effects: { hr: 5, sanity: 5 },
      },
      {
        id: 'appraisal-feelings',
        tone: 'Emotional',
        text: 'This is so unfair. I gave my weekends to this company!',
        verdict: 'bad',
        outcome:
          'All true. But “unfair” gives them nothing to act on. Pooja notes “Employee was emotional” in the file.',
        lesson: 'Feelings are valid; data is persuasive. Convert frustration into specific facts and asks.',
        effects: { manager: -5, hr: -10, sanity: -5 },
      },
    ],
    timeout: {
      outcome: 'Sachin says nothing. Rakesh: “Great, so we’re aligned!” Pooja closes the file. Next year’s budget assumes you’ll accept 4% again.',
      lesson: 'Silent acceptance is read as satisfaction. Even one calm question changes the conversation.',
      effects: { manager: 5, sanity: -15 },
    },
  },
  {
    id: 'skip_level',
    slot: 2,
    codename: 'OPERATION: SAFE SPACE',
    location: 'Cafeteria corner · Skip-level 1:1',
    briefing:
      'Meera Bansal, Rakesh’s boss, is meeting every engineer one-on-one. Rumour says Rakesh’s promotion depends on “team feedback”.',
    dialogue: [
      { who: 'meera', line: 'Sachin, this is a safe space. How’s the team doing? And how is Rakesh as a manager?' },
      { who: 'meera', line: 'Be honest with me. I’m hearing mixed things about late-night calls.' },
    ],
    prompt: 'Sachin has exactly one shot at this.',
    choices: [
      {
        id: 'skip-perfect',
        tone: 'Evasive',
        text: 'Everything is perfect! Rakesh is honestly the best manager ever.',
        verdict: 'okay',
        outcome:
          'Meera can tell it’s rehearsed. Nothing changes, and the 10 PM calls continue. Safe — and completely useless.',
        lesson: 'Playing it safe has a cost: you waste the one channel built to fix problems.',
        effects: { manager: 5, sanity: -10 },
      },
      {
        id: 'skip-trash',
        tone: 'Savage',
        text: 'Honestly? He micromanages, takes credit and calls us at 10 PM. Everyone hates it.',
        verdict: 'bad',
        outcome:
          'Some of it is true. All of it reaches Rakesh within a week — safe spaces have thin walls. Your next sprint is entirely bug fixes.',
        lesson: 'Personal attacks travel fast and land badly. Describe behaviours and impact, not character.',
        effects: { manager: -20, team: 5, sanity: -5 },
      },
      {
        id: 'skip-gossip',
        tone: 'Evasive',
        text: 'I don’t want to say anything, but... Vikram says Rohit says Rakesh is leaving?',
        verdict: 'bad',
        outcome:
          'Meera’s face goes blank. You’ve just become “the source” of a rumour, and Vikram is not pleased.',
        lesson: 'Never trade gossip with leadership. It costs you credibility and burns your allies.',
        effects: { manager: -10, team: -10 },
      },
      {
        id: 'skip-constructive',
        tone: 'Diplomatic',
        text: 'Rakesh is great at unblocking us with the client. One thing that would help: fewer calls after 7 PM — non-urgent items could go into a morning sync.',
        verdict: 'best',
        outcome:
          'Meera writes it down. Two weeks later there’s a new rule: no meetings after 7 PM unless it’s a P0. Nobody knows it was you. Everyone benefits.',
        lesson: 'Upward feedback: start with something genuinely positive, then a specific behaviour, its impact and a suggested fix.',
        effects: { manager: 5, team: 10, sanity: 10 },
      },
    ],
    timeout: {
      outcome: 'Sachin shrugs: “All good.” Meera nods politely and moves on to the next engineer.',
      lesson: 'Skip-levels are rare chances to fix things. Walk in with one specific, constructive point.',
      effects: { sanity: -5 },
    },
  },
  // ------------------------------------------------------------- slot 3
  {
    id: 'retention',
    slot: 3,
    codename: 'OPERATION: KAJU KATLI',
    location: 'HR cabin · “Just a casual chat”',
    briefing:
      'Word got out that Sachin is interviewing. HR has scheduled a “casual chat”. There is a box of kaju katli on the table. This is not casual.',
    dialogue: [
      { who: 'pooja', line: 'Sachin, we value you so much. We’re a family here.' },
      { who: 'rakesh', line: 'Stay with us and I’ll make sure you’re promoted next cycle. Plus a 15% correction. Verbal commitment from my side.' },
    ],
    prompt: 'Kaju katli or career? What does Sachin say?',
    choices: [
      {
        id: 'retention-yes',
        tone: 'Passive',
        text: 'Okay sir, I’ll stay! I’ll cancel my interviews.',
        verdict: 'bad',
        outcome:
          'Next cycle: “budget constraints”. The promotion moves to the next-next cycle — and you’re now tagged a flight risk in every planning meeting.',
        lesson: 'Verbal promises are worth the paper they’re written on. Counter-offers often fix the money, rarely the reason you wanted to leave.',
        effects: { manager: 5, hr: 5, sanity: -20 },
      },
      {
        id: 'retention-burn',
        tone: 'Savage',
        text: 'Family? Families don’t give 4% hikes. I’m done here.',
        verdict: 'bad',
        outcome:
          'Deeply satisfying for about a minute. The industry is smaller than you think, and your next background check calls Pooja.',
        lesson: 'Never burn bridges on the way out. Reference checks and old managers follow you for years.',
        effects: { manager: -15, hr: -20, sanity: 10 },
      },
      {
        id: 'retention-writing',
        tone: 'Strategic',
        text: 'Thank you, I genuinely appreciate it. Could you share the revised compensation and promotion criteria in writing, with a timeline? I want to compare all my options fairly.',
        verdict: 'best',
        outcome:
          'Pooja promises a letter “by Friday”. It arrives with 10%, not 15%, and no promotion date. Now you have a real number to compare — and total clarity.',
        lesson: 'Stay warm, get it in writing, then decide with real numbers. Vague promises shrink when written down.',
        effects: { manager: 5, hr: 10, sanity: 5 },
      },
      {
        id: 'retention-decline',
        tone: 'Diplomatic',
        text: 'Thank you, but I’ve decided to move on for growth. I’ll make sure the handover is smooth.',
        verdict: 'okay',
        outcome:
          'Professional and clean — Pooja respects it. But you declined before seeing anything in writing, and left negotiation leverage on the table.',
        lesson: 'Graceful exits are great. Just make sure you’re deciding on written numbers, not on vibes.',
        effects: { hr: 5, sanity: 10 },
      },
    ],
    timeout: {
      outcome: 'Sachin eats a kaju katli and says nothing. Pooja: “I’ll take that as a yes!”',
      lesson: 'If you don’t state your position, someone else will state it for you.',
      effects: { hr: 5, sanity: -10 },
    },
  },
  {
    id: 'friday_deploy',
    slot: 3,
    codename: 'OPERATION: FRIDAY DEPLOY',
    location: 'Team stand-up · Friday, 5:30 PM',
    briefing:
      'The client demo is Monday at 9 AM. The new checkout feature has zero tests, and staging has been broken since Wednesday.',
    dialogue: [
      { who: 'rakesh', line: 'We push to production tonight. The client wants to see it live on Monday.' },
      { who: 'ananya', line: 'Rakesh — no tests, no staging. If it breaks, it breaks on a weekend.' },
      { who: 'rakesh', line: 'Sachin, you built it. You’re confident, right? Just say yes.' },
    ],
    prompt: 'Production doesn’t care about confidence. What does Sachin say?',
    choices: [
      {
        id: 'deploy-yes',
        tone: 'Passive',
        text: 'Yes sir, 100% confident. Ship it!',
        verdict: 'bad',
        outcome:
          'It breaks at 2 AM Saturday. Real customers are charged twice. You spend the weekend writing refund scripts.',
        lesson: 'Saying yes to unmanaged risk doesn’t make it go away — it just makes it yours.',
        effects: { manager: -10, team: -10, sanity: -25 },
      },
      {
        id: 'deploy-flag',
        tone: 'Strategic',
        text: 'Let’s ship it behind a feature flag — on only for the client’s demo account — with one-click rollback. I’ll add smoke tests for the happy path tonight; two hours.',
        verdict: 'best',
        outcome:
          'A bug does show up on Saturday — but only the demo account sees it, and you flip the flag off in 30 seconds. Monday’s demo goes perfectly.',
        lesson: 'Don’t just say yes or no to risk — shrink it. Feature flags, canaries and rollbacks turn “we can’t” into “here’s how”.',
        effects: { manager: 10, team: 10, sanity: -5 },
      },
      {
        id: 'deploy-no',
        tone: 'Assertive',
        text: 'No. I won’t deploy untested code. Period.',
        verdict: 'okay',
        outcome:
          'Principled — but Rakesh hears “Sachin blocks things” and asks Rohit to deploy instead. It breaks. Somehow, you’re still in the RCA.',
        lesson: 'A hard no protects quality but loses the room. Pair every no with a safer yes.',
        effects: { manager: -10, team: 5, sanity: -5 },
      },
      {
        id: 'deploy-malicious',
        tone: 'Savage',
        text: 'Sure. I’ll deploy and put my phone on airplane mode.',
        verdict: 'bad',
        outcome:
          'It breaks at 2 AM. The on-call rota says... Sachin. 23 missed calls and a very awkward Monday.',
        lesson: 'Malicious compliance always comes back to you. Raise the risk clearly, then own the plan.',
        effects: { manager: -15, team: -10, sanity: -10 },
      },
    ],
    timeout: {
      outcome: 'Rakesh: “Silence means yes! Deploying at 8.” Ananya sighs and starts writing the rollback plan nobody asked for.',
      lesson: 'If you see a risk, name it — out loud, with a mitigation. Silence makes you co-owner of the outcome.',
      effects: { sanity: -15 },
    },
  },
];
