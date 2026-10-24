import type { Scenario } from '../../types';

/**
 * Prevention of sexual harassment (POSH). Sachin is always a colleague,
 * bystander or witness here; the right calls model what to actually do:
 * believe and support, point to the Internal Committee, protect
 * confidentiality, and never retaliate or gossip.
 */
export const POSH: Scenario[] = [
  {
    id: 'posh_training',
    category: 'posh',
    codename: 'OPERATION: CLICK NEXT',
    location: 'Learning portal · Mandatory training',
    briefing: 'The annual POSH training is due by Friday: a 45-minute module on the company’s policy against sexual harassment, how to report it, and who sits on the Internal Committee.',
    dialogue: [
      { who: 'rohit', line: 'Bro, just keep clicking Next. The quiz answers are all C. Done in four minutes.' },
      { who: 'pooja', line: '(email) Gentle reminder: completion is mandatory for everyone by Friday.', aside: true },
    ],
    prompt: 'How does Sachin do the training?',
    choices: [
      { id: 'pt-real', tone: 'Honest', verdict: 'best', text: 'Actually do it — and note down who is on the Internal Committee and how to reach them confidentially.', outcome: 'It takes 45 minutes. Two months later, when a colleague needs help, you know exactly where to point her.', lesson: 'Policy training feels boring until someone needs it. Know your Internal Committee before you need it.', effects: { reputation: 3, charisma: 2 }, setFlags: ['posh_aware'] },
      { id: 'pt-skim', tone: 'Passive', verdict: 'okay', text: 'Skim it, but read the summary card about how to report.', outcome: 'You pass the quiz and remember the basics.', lesson: 'Knowing the reporting path is the part that matters most.', effects: { reputation: 1 }, setFlags: ['posh_aware'] },
      { id: 'pt-key', tone: 'Evasive', verdict: 'bad', text: 'Use Rohit’s “answer key” and click Next 47 times.', outcome: 'The answers were not all C. You fail and have to retake the full module, now with a compliance reminder in your file.', lesson: 'Shortcuts through compliance training usually take longer.', effects: { reputation: -3 } },
      { id: 'pt-mock', tone: 'Savage', verdict: 'bad', text: 'Post in the team chat: “Mandatory boring training \u{1F634} who has the answer key?”', outcome: 'Neha and Tanvi read it. Nobody comments. Pooja sees a screenshot.', lesson: 'Mocking harassment training tells colleagues you won’t take their concerns seriously.', effects: { reputation: -8, network: -3 } },
    ],
    timeout: { outcome: 'Friday passes. The training doesn’t. HR escalates to Rakesh.', lesson: 'Mandatory means mandatory.', effects: { reputation: -4 } },
    minWeek: 2,
  },
  {
    id: 'posh_jokes',
    category: 'posh',
    codename: 'OPERATION: NOT FUNNY',
    location: 'Team WhatsApp group · 9:15 PM',
    briefing: 'Rohit forwards a meme mocking women engineers. Two people send laughing emojis. Rakesh reacts with \u{1F602}. Neha and Tanvi are both in the group.',
    dialogue: [
      { who: 'rohit', line: '(forwards meme) \u{1F602}\u{1F602}\u{1F602} so true' },
      { who: 'neha', line: '(typing...) (stops typing)', aside: true },
    ],
    prompt: 'The group goes quiet. What does Sachin do?',
    choices: [
      { id: 'pj-callout', tone: 'Assertive', verdict: 'best', text: 'Reply calmly in the group: “Not okay, guys — this targets colleagues who are right here. Let’s keep the group professional.” If it continues, raise it with HR or the Internal Committee.', outcome: 'Rohit deletes it with a grumpy “chill, it was a joke”. Neha messages you privately: “Thank you.” The memes stop.', lesson: 'Sexist “jokes” create a hostile workplace — which harassment policies cover. A calm bystander changes the culture of a group.', effects: { reputation: 4, charisma: 3, network: -2 } },
      { id: 'pj-dm', tone: 'Strategic', verdict: 'okay', text: 'Message Rohit privately and ask him to delete it.', outcome: 'He deletes it. The group never sees anyone object, though — so it may happen again.', lesson: 'Private nudges help; a visible response also tells the targets they aren’t alone.', effects: { reputation: 2 } },
      { id: 'pj-silent', tone: 'Passive', verdict: 'bad', text: 'Say nothing. It’s just a meme.', outcome: 'Neha leaves the group the next morning. Nobody asks why.', lesson: 'Silence from everyone else reads as approval to the people being targeted.', effects: { reputation: -2, sanity: -2 } },
      { id: 'pj-escalate', tone: 'Savage', verdict: 'bad', text: 'Reply with an even “funnier” meme.', outcome: 'A screenshot reaches the Internal Committee. Now you’re part of the complaint.', lesson: 'Joining in makes you part of the problem — on the record.', effects: { reputation: -12 } },
    ],
    timeout: { outcome: 'The message sits there with its laughing emojis. Morning comes.', lesson: 'Bystander silence is a choice.', effects: { sanity: -2 } },
    minWeek: 3,
  },
  {
    id: 'posh_confide',
    category: 'posh',
    codename: 'OPERATION: SAFE HARBOUR',
    location: 'Terrace, after lunch',
    briefing: 'Neha asks to talk privately. A senior manager from the Sales team keeps sending her late-night messages about her appearance, and hinted her appraisal could “go very well” if she met him for dinner.',
    dialogue: [
      { who: 'neha', line: 'I don’t know what to do. He’s close to the VP. If I complain, what happens to my rating? Maybe I’m overreacting...' },
    ],
    prompt: 'Neha is scared. What does Sachin do?',
    choices: [
      { id: 'pc-support', tone: 'Honest', verdict: 'best', text: 'Listen, and believe her. Tell her it isn’t her fault and isn’t an overreaction; that she can approach the Internal Committee confidentially and retaliation is prohibited; offer to go with her and to share anything you’ve seen. Then respect her decision and pace.', outcome: 'Neha decides to file with the Internal Committee, with her screenshots. She says having one person believe her made all the difference.', lesson: 'Believe, support, inform — then respect their choice. Complaints usually have to be made within three months of the incident, so knowing the path early matters.', effects: { network: 5, charisma: 3, reputation: 3 }, setFlags: ['posh_case'] },
      { id: 'pc-hr', tone: 'Diplomatic', verdict: 'okay', text: 'Suggest she talks to HR and the Internal Committee.', outcome: 'Good advice, a little distant. She files a complaint on her own a week later.', lesson: 'Pointing to the right channel matters — offering to stand beside her matters more.', effects: { charisma: 1 }, setFlags: ['posh_case'] },
      { id: 'pc-dismiss', tone: 'Evasive', verdict: 'bad', text: '“Maybe he’s just being friendly? Try ignoring him for a while.”', outcome: 'Neha goes quiet and doesn’t bring it up again. The messages continue.', lesson: 'Minimising someone’s experience teaches them not to speak up — and protects the harasser.', effects: { network: -6, sanity: -4 } },
      { id: 'pc-gossip', tone: 'Passive', verdict: 'bad', text: 'Ask Vikram for advice “in confidence”.', outcome: 'By evening, half the floor knows. Neha is mortified. Trust, once broken, doesn’t come back easily.', lesson: 'Never share someone’s disclosure without their consent. Confidentiality protects the person who spoke up.', effects: { network: -8, reputation: -6 } },
    ],
    timeout: { outcome: 'Sachin doesn’t know what to say and says nothing useful. Neha says “Forget it” and leaves.', lesson: 'You don’t need perfect words. “I believe you, and here’s how I can help” is enough.', effects: { network: -3, sanity: -3 } },
    minWeek: 6,
  },
  {
    id: 'posh_witness',
    category: 'posh',
    codename: 'OPERATION: STATEMENT',
    location: 'Internal Committee meeting room · Confidential',
    briefing: 'The Internal Committee is investigating Neha’s complaint and has asked Sachin for a statement: he saw the Sales manager corner her at the team offsite. Before the meeting, Rakesh stops by his desk.',
    dialogue: [
      { who: 'rakesh', line: 'Sachin... that Sales guy is close to the VP. Don’t get dragged into all this. Just say you don’t remember much.' },
    ],
    prompt: 'The committee is waiting. What does Sachin do?',
    choices: [
      { id: 'pw-truth', tone: 'Honest', verdict: 'best', text: 'Give a factual, truthful statement to the committee — and keep the matter confidential, including from Rakesh.', outcome: 'Your statement corroborates Neha’s account. The committee acts. When Rakesh hints at consequences, you calmly note that retaliating against witnesses is prohibited too. He drops it.', lesson: 'Truthful witnesses make workplaces safer. Confidentiality and protection from retaliation cover witnesses as well.', effects: { reputation: 5, sanity: 4, charisma: 2 } },
      { id: 'pw-soften', tone: 'Diplomatic', verdict: 'okay', text: 'Give a statement, but soften what you saw to avoid politics.', outcome: 'The committee notes your statement is vague. The case is harder to establish than it should have been.', lesson: 'Diluted testimony can sink a valid complaint. Facts, not filters.', effects: { reputation: 1, sanity: -4 } },
      { id: 'pw-decline', tone: 'Evasive', verdict: 'bad', text: '“I don’t want to get involved.”', outcome: 'Without your account, it’s her word against his. Neha finds out you declined.', lesson: 'Staying out of it isn’t neutral when you saw something.', effects: { network: -6, sanity: -6 } },
      { id: 'pw-leak', tone: 'Savage', verdict: 'bad', text: 'Share the details with the team “for transparency”.', outcome: 'You breach the committee’s confidentiality. Disciplinary action follows — against you.', lesson: 'Harassment inquiries are confidential by design. Leaking them harms the complainant and you.', effects: { reputation: -15, network: -5 } },
    ],
    timeout: { outcome: 'Sachin stalls. The committee records that the witness was “unable to recall”.', lesson: 'Hesitation can quietly become a decision against the person who needed you.', effects: { sanity: -5 } },
    requires: ['posh_case'],
    minWeek: 9,
    weight: 3,
  },
  {
    id: 'posh_offsite',
    category: 'posh',
    codename: 'OPERATION: AFTER PARTY',
    location: 'Annual offsite · Resort lawn · 11 PM',
    briefing: 'At the party, a senior from the Sales team keeps pushing Tanvi, a junior analyst, to dance and take “just one more” drink. She has said no twice and keeps glancing around for an exit.',
    dialogue: [
      { who: 'tanvi', line: 'I’m good, really. I think I should head back...' },
    ],
    prompt: 'Sachin is standing nearby. What does he do?',
    choices: [
      { id: 'po-exit', tone: 'Assertive', verdict: 'best', text: 'Step in casually — “Tanvi, the cab group is asking for you!” — and give her an exit. Later, check on her and mention the Internal Committee if she wants to report it.', outcome: 'Tanvi walks away with you, relieved. The next day she thanks you and decides to report it, with you as a witness.', lesson: 'Bystander intervention: distract, delegate, direct, follow up. Giving someone an easy exit is often the most effective move.', effects: { reputation: 5, charisma: 3, network: 2 } },
      { id: 'po-direct', tone: 'Diplomatic', verdict: 'okay', text: 'Tell the senior directly: “She said no. Let’s leave it.”', outcome: 'He backs off, annoyed. Tanvi leaves. A direct call-out works, though it can escalate with drunk people.', lesson: 'Directly naming the behaviour is valid; pair it with checking on the person afterwards.', effects: { reputation: 3, network: -1 } },
      { id: 'po-look', tone: 'Passive', verdict: 'bad', text: 'Look away. Not my business.', outcome: 'Tanvi eventually escapes on her own. She notices who looked away.', lesson: 'If you see someone uncomfortable and do nothing, the harasser learns that nobody will.', effects: { sanity: -4, reputation: -2 } },
      { id: 'po-cheer', tone: 'Savage', verdict: 'bad', text: 'Cheer along with the crowd.', outcome: 'Someone films it. The video reaches the Internal Committee, and you’re in it.', lesson: 'Cheering on unwanted advances makes you part of the harassment.', effects: { reputation: -12 } },
    ],
    timeout: { outcome: 'Sachin hesitates. By the time he looks again, Tanvi is gone — and so is the chance to help.', lesson: 'Bystander moments are short. Decide your move in advance: distract, delegate, direct.', effects: { sanity: -4 } },
    minWeek: 10,
  },
];
