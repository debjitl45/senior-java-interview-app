import type { Scenario } from '../../types';

/**
 * Story beats 1 and 2: Sachin is still at Infinite Loop Solutions while he
 * interviews. Each slot has two variants so replays differ.
 */
export const ACT_ONE: Scenario[] = [
  // ------------------------------------------------------------- slot 0
  {
    id: 'dentist',
    slot: 0,
    codename: 'OPERATION: ROOT CANAL',
    location: 'Infinite Loop Solutions · Bay 4B · 10:12 AM',
    briefing:
      'Sachin has taken three “dentist appointments” this month. Each one lined up suspiciously well with an interview. Rakesh has noticed. Rakesh always notices.',
    dialogue: [
      { who: 'rakesh', line: 'Sachin, quick one. Third dentist visit this month? Your teeth must be in really bad shape.' },
      { who: 'rakesh', line: 'Also, your LinkedIn photo suddenly got very... professional. Anything you want to tell me?' },
      { who: 'vikram', line: '(whispering) Bro. He knows.', aside: true },
    ],
    prompt: 'Rakesh is fishing. How does Sachin respond?',
    choices: [
      {
        id: 'dentist-lie',
        tone: 'Evasive',
        text: 'Root canal, sir. Very complicated case. Might need two more sittings.',
        verdict: 'bad',
        outcome:
          'Rakesh’s wife is a dentist. He asks which clinic. You say “the one near the metro”. There are four metro stations nearby. The silence is deafening.',
        lesson: 'Elaborate lies need maintenance. Vague-but-true beats detailed-but-false.',
        effects: { manager: -15, sanity: -10 },
      },
      {
        id: 'dentist-honest',
        tone: 'Honest',
        text: 'Okay, honestly? I’m exploring a few opportunities outside.',
        verdict: 'okay',
        outcome:
          'Rakesh says “Thanks for telling me.” The next morning you are quietly moved off the new client project “to reduce delivery risk”.',
        lesson: 'Honesty is a virtue; timing is a skill. Disclosing before you hold a signed offer can sideline you.',
        effects: { manager: -10, sanity: 10 },
      },
      {
        id: 'dentist-pro',
        tone: 'Diplomatic',
        text: 'I’ve had a few personal commitments lately. My sprint work is on track, and I’ll flag it early if anything affects the team.',
        verdict: 'best',
        outcome:
          'Rakesh nods slowly. He may suspect, but you gave him nothing to act on — plus a delivery promise he can’t argue with.',
        lesson: 'You don’t owe anyone your job search before a signed offer. Redirect to what they actually care about: delivery.',
        effects: { manager: 5, sanity: 5 },
      },
      {
        id: 'dentist-savage',
        tone: 'Savage',
        text: 'Sir, my teeth are fine. It’s the 4% appraisal that hurts.',
        verdict: 'bad',
        outcome:
          'Vikram chokes on his chai. Rakesh smiles the smile of a man updating your “attitude” column for the next three appraisal cycles.',
        lesson: 'Sarcasm feels great for three seconds and lives in your manager’s memory for three appraisals.',
        effects: { manager: -20, team: 10, sanity: 5 },
      },
    ],
    timeout: {
      outcome: 'Sachin stares at his monitor and says nothing. Rakesh: “Hmm. Okay.” The silence said more than any answer.',
      lesson: 'Silence under questioning reads as guilt. Have a calm, true, short answer ready before you start interviewing.',
      effects: { manager: -10, sanity: -5 },
    },
  },
  {
    id: 'weekend',
    slot: 0,
    codename: 'OPERATION: FRIDAY 6:55 PM',
    location: 'Teams call · Friday, 6:55 PM',
    briefing:
      'Sachin’s bag is packed. His sister’s engagement is tomorrow in Jaipur and his train leaves at 9:40 PM. Then Teams rings.',
    dialogue: [
      { who: 'rakesh', line: 'Sachin! Good, you’re still online. Client escalation — the payment report is failing for their US team.' },
      { who: 'rakesh', line: 'I need you Saturday and Sunday. You’re the only one who knows that module. Team player, right?' },
    ],
    prompt: 'The train leaves in 2 hours 45 minutes. What does Sachin say?',
    choices: [
      {
        id: 'weekend-yes',
        tone: 'Passive',
        text: 'Of course, Rakesh. I’ll cancel my plans.',
        verdict: 'bad',
        outcome:
          'You fix it in three hours on Saturday. The client never says thanks. Your sister’s engagement photos have a gap where you should be.',
        lesson: 'Always-available quickly becomes always-expected. Boundaries are part of being a professional.',
        effects: { manager: 10, sanity: -20 },
      },
      {
        id: 'weekend-deal',
        tone: 'Strategic',
        text: 'I can’t do the weekend — family function, planned for months. But I’ll spend the next hour on a fix, write a runbook, and be reachable 10–11 AM Saturday.',
        verdict: 'best',
        outcome:
          'Rakesh pauses, then: “Okay, that works.” You push a hotfix by 8:15, hand Rohit a runbook, and make the train with four minutes to spare.',
        lesson: 'A “no” with an alternative is a negotiation; a “no” without one is a conflict. Offer scope, a time-box and a handover.',
        effects: { manager: 10, team: 5, sanity: 5 },
      },
      {
        id: 'weekend-no',
        tone: 'Assertive',
        text: 'Sorry, I’m on leave from now. Please ask someone else.',
        verdict: 'okay',
        outcome:
          'Technically fair. Rakesh tells his boss that “Sachin isn’t taking ownership”. Rohit gets the weekend — and all the visibility.',
        lesson: 'Protecting your time is right. Doing it without offering any path forward costs you trust you’ll need later.',
        effects: { manager: -15, team: -5, sanity: 10 },
      },
      {
        id: 'weekend-ghost',
        tone: 'Evasive',
        text: '*Switches the phone to airplane mode and boards the train.*',
        verdict: 'bad',
        outcome:
          'The client escalates on Monday. Rakesh has 14 missed calls to you in his log. “Network issue” fools nobody.',
        lesson: 'Going dark is the worst of both worlds: you lose trust and still get dragged in later.',
        effects: { manager: -20, team: -10, sanity: 5 },
      },
    ],
    timeout: {
      outcome: 'Sachin hesitates a second too long. Rakesh: “Great, I’ll put you down for Saturday then!” *Call ends.*',
      lesson: 'In corporate life, silence is consent. Decide your boundary before the call, not during it.',
      effects: { manager: 5, sanity: -15 },
    },
  },
  // ------------------------------------------------------------- slot 1
  {
    id: 'credit',
    slot: 1,
    codename: 'OPERATION: CREDIT HEIST',
    location: 'Town hall · Main conference room · 4:00 PM',
    briefing:
      'Sachin spent two weeks building a Redis caching layer that cut API latency by 60%. Today’s town-hall demo is presented by... Rohit.',
    dialogue: [
      { who: 'rohit', line: '...so I designed this caching layer and latency dropped 60%. Honestly, it took a lot of late nights.' },
      { who: 'rakesh', line: 'Fantastic work, Rohit! This is exactly the ownership we need. Any questions before we move on?' },
      { who: 'vikram', line: '(whispering) Bro. Isn’t that literally your code?', aside: true },
    ],
    prompt: 'Rakesh is about to move to the next slide. Sachin has a few seconds.',
    choices: [
      {
        id: 'credit-rage',
        tone: 'Emotional',
        text: 'Excuse me — that’s MY code. Rohit didn’t build any of it!',
        verdict: 'bad',
        outcome:
          'You’re right, and it doesn’t matter. The room only remembers the outburst. HR books a “quick chat about communication”.',
        lesson: 'Being right loudly in public often costs more than it earns. Accusations make everyone pick a side.',
        effects: { manager: -10, hr: -10, team: -5, sanity: 5 },
      },
      {
        id: 'credit-silent',
        tone: 'Passive',
        text: '*Says nothing. Vents to Vikram over chai later.*',
        verdict: 'bad',
        outcome: 'Vikram tells four people. Rohit wins the Spot Award. You win a samosa.',
        lesson: 'Complaining privately changes nothing and leaks anyway. Speak up in the room, or document it.',
        effects: { team: -5, sanity: -15 },
      },
      {
        id: 'credit-email',
        tone: 'Strategic',
        text: '*Later, emails Rakesh the PR links and design doc — no drama, just facts.*',
        verdict: 'okay',
        outcome:
          'Rakesh replies “Thanks, noted \u{1F44D}”. It’s on record, which helps at appraisal time — but the town-hall moment is gone forever.',
        lesson: 'Documentation protects you; visibility promotes you. You need both.',
        effects: { manager: 5, sanity: -5 },
      },
      {
        id: 'credit-depth',
        tone: 'Assertive',
        text: '*Raises hand* Glad it worked out! Happy to take questions on the eviction strategy and cache invalidation I built — that was the trickiest part.',
        verdict: 'best',
        outcome:
          'Rakesh asks two follow-ups. You nail both. The room quietly does the math. Afterwards you tell Rohit, “Let’s credit everyone next time.” He agrees, sheepishly.',
        lesson: 'Claim credit by adding depth, not by accusing. Then fix it privately with the person.',
        effects: { manager: 10, team: 10 },
      },
    ],
    timeout: {
      outcome: 'The moment passes. Rakesh: “Great, next agenda item.” Rohit’s LinkedIn post about “his” caching layer goes live 20 minutes later.',
      lesson: 'Credit is claimed in the moment. Prepare a one-line, positive way to show ownership before demos.',
      effects: { team: -5, sanity: -10 },
    },
  },
  {
    id: 'blame',
    slot: 1,
    codename: 'OPERATION: BLAME GAME',
    location: 'War-room bridge call · 11:47 PM',
    briefing:
      'Production is down. Orders have been failing for 40 minutes. The bad deploy was Rohit’s — but it touched a config file Sachin wrote last month.',
    dialogue: [
      { who: 'rakesh', line: 'Folks, the client’s VP has joined the bridge. What happened?' },
      { who: 'rohit', line: 'So... the failure is in the config module. Sachin owns that one, I think?' },
      { who: 'ananya', line: '(on chat) Logs show the 11:05 deploy changed the timeout. Your call, Sachin.', aside: true },
    ],
    prompt: 'Everyone unmutes. All eyes on Sachin.',
    choices: [
      {
        id: 'blame-calm',
        tone: 'Diplomatic',
        text: 'Let’s restore first — I can roll back the 11:05 deploy right now, which should fix it in five minutes. Then a blameless RCA tomorrow with the full timeline.',
        verdict: 'best',
        outcome:
          'Rollback done in four minutes. Orders recover. The VP says “Good call.” In the RCA, the timeline speaks for itself — nobody has to point a finger.',
        lesson: 'In an incident: mitigate first, explain later. Facts and timelines win arguments without you having to.',
        effects: { manager: 15, team: 10, sanity: -5 },
      },
      {
        id: 'blame-attack',
        tone: 'Savage',
        text: 'Excuse me, Rohit’s deploy broke it. Maybe check the logs before blaming me?',
        verdict: 'bad',
        outcome:
          'True. But the VP just watched two engineers fight while orders failed. Recovery takes 25 more minutes.',
        lesson: 'Blame during an outage burns time and trust. Customers don’t care whose fault it is — they care that it’s fixed.',
        effects: { manager: -10, team: -10 },
      },
      {
        id: 'blame-fall',
        tone: 'Passive',
        text: 'Sorry, it’s probably my config. I’ll look into it.',
        verdict: 'bad',
        outcome:
          'You spend two hours debugging the wrong thing. The RCA says “config issue (Sachin)”. Rohit sends you a \u{1F64F} in DMs.',
        lesson: 'Owning your mistakes is great. Owning other people’s isn’t humility — it’s inaccuracy, and it delays the fix.',
        effects: { manager: -5, team: -5, sanity: -15 },
      },
      {
        id: 'blame-dm',
        tone: 'Strategic',
        text: '*Privately messages Rakesh: “FYI, it was Rohit’s 11:05 deploy.”*',
        verdict: 'okay',
        outcome:
          'Rakesh reads it but still asks you to investigate on the call. The rollback happens 20 minutes later than it could have.',
        lesson: 'Getting the facts to the right person is good; letting the fix wait for politics is not.',
        effects: { manager: 5, sanity: -5 },
      },
    ],
    timeout: {
      outcome: 'Dead air on a war-room bridge. The VP: “Is anyone driving this?” Ananya unmutes and rolls back the deploy. She gets the credit — fairly.',
      lesson: 'In a crisis, whoever proposes a clear next step leads. Say the mitigation out loud.',
      effects: { manager: -10, sanity: -5 },
    },
  },
];
