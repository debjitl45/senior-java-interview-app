import type { Ending, EndingId, RomanceOutcome } from '../types';

/**
 * Every way Sachin's season can end. Which one you get depends on the
 * offer you accept (if any) and the stats you finish with.
 */
export const ENDINGS: Record<EndingId, Ending> = {
  dream: {
    id: 'dream',
    emoji: '\u{1F31F}',
    title: 'Dream Job, Dream Life',
    tone: 'great',
    text: 'Sachin walks into his new job rested, respected and genuinely excited. He left Infinite Loop on great terms, negotiated well, and still has the energy to enjoy his weekends. Somewhere, a LinkedIn “I’m happy to share” post is being drafted — and for once, he means it.',
    hint: 'Accept a Dream or Top-tier offer with sanity 65+ and reputation 50+.',
  },
  golden: {
    id: 'golden',
    emoji: '\u{1F512}',
    title: 'Golden Handcuffs',
    tone: 'mixed',
    text: 'The offer letter says big numbers. Sachin’s reflection says he hasn’t slept properly in months. He joins, the money is great, and the first thing he searches on his new laptop is “how to deal with burnout”. A win on paper; a lesson in pacing.',
    hint: 'Accept a Dream or Top-tier offer while your sanity is below 35.',
  },
  bigtech: {
    id: 'bigtech',
    emoji: '\u{1F3E2}',
    title: 'Big Tech Badge',
    tone: 'good',
    text: 'Free food, internal tools with names like “Hyperion”, and a laptop sticker that makes strangers at airports nod at him. Sachin is now a small but proud cog in a very large machine — and his mom finally stops forwarding Sharma ji’s son’s achievements.',
    hint: 'Join a product company.',
  },
  wallstreet: {
    id: 'wallstreet',
    emoji: '\u{1F4C8}',
    title: 'Wall Street Wolf (of Bengaluru)',
    tone: 'good',
    text: 'Sachin joins the bank’s tech division. He learns that money is never a double, that “T+1 settlement” is a lifestyle, and that every release needs four approvals and one prayer. The pay is solid, the job is stable, and his parents tell relatives he works “in a bank, but the computer side”.',
    hint: 'Join one of the banks.',
  },
  rocket: {
    id: 'rocket',
    emoji: '\u{1F680}',
    title: 'Rocket Ship Rider',
    tone: 'good',
    text: 'Sachin joins the start-up and immediately owns three services, the CI pipeline and the office plant. He learns more in six months than in the last two years. His ESOPs are worth “a lot, on paper”. Sleep remains optional.',
    hint: 'Join a start-up.',
  },
  service: {
    id: 'service',
    emoji: '\u{1F3DB}️',
    title: 'Steady Service Life',
    tone: 'mixed',
    text: 'Sachin joins the services giant: a big campus, bigger processes, and a client in a timezone that hates him. The job is stable and the bench is comfortable. He keeps grinding on weekends — because this time, the next switch will be on his terms.',
    hint: 'Join a services giant.',
  },
  telecom: {
    id: 'telecom',
    emoji: '\u{1F4F6}',
    title: '5G Speed Career',
    tone: 'good',
    text: 'Sachin now builds systems that half a billion phones talk to. A two-second outage makes national news, so he learns resilience the hard way — and becomes the guy who actually understands rate limiting at a scale most engineers never see.',
    hint: 'Join a telecom company.',
  },
  lala: {
    id: 'lala',
    emoji: '\u{1F3EA}',
    title: 'Lala Land',
    tone: 'mixed',
    text: 'Sachin joins Jha2 Infotech. On day one he fixes the printer; by week two he is “Head of IT, Web, App and SEO”. Salary arrives on the 19th. He learns jugaad, grit and how to spot red flags from orbit — lessons that make his next switch the smartest of his career.',
    hint: 'Join Jha2 Infotech. Brave.',
  },
  loyal: {
    id: 'loyal',
    emoji: '\u{1F396}️',
    title: 'The Loyal Lead',
    tone: 'good',
    text: 'No offer was worth leaving for. Sachin’s reputation at Infinite Loop is so strong that Meera promotes him to Tech Lead with a real hike. Rakesh pretends it was his idea. Rohit pretends to be happy for him. Sachin genuinely is.',
    hint: 'Never switch, and finish the season with reputation 75+.',
  },
  founder: {
    id: 'founder',
    emoji: '\u{1F984}',
    title: 'Founder Mode',
    tone: 'great',
    text: 'Sharp skills, a strong network and savings to survive a year: Sachin quits to build his own product. His first hire is Ananya. His first office is his parents’ dining table. His pitch deck has 4 slides and zero buzzwords. Investors are intrigued.',
    hint: 'Never switch; finish with skill 80+, network 70+, charisma 55+ and ₹2.5L saved.',
  },
  influencer: {
    id: 'influencer',
    emoji: '\u{1F3A5}',
    title: 'Tech Influencer Arc',
    tone: 'good',
    text: 'His meetup talks went viral, his LinkedIn posts started paying, and a YouTube channel called “Java with Sachin” hits 100k subscribers. He still writes code — mostly on camera, with a ring light.',
    hint: 'Never switch; finish with charisma 75+ and network 75+.',
  },
  comfort: {
    id: 'comfort',
    emoji: '\u{1F6CB}️',
    title: 'Comfort Zone Champion',
    tone: 'mixed',
    text: 'The season ends and Sachin is still at Infinite Loop: same desk, same chai, same Rakesh. Nothing went wrong, but nothing really changed either. Next season, he promises himself, he’ll take the bigger swing.',
    hint: 'Reach the end of the season without accepting an offer.',
  },
  burnout: {
    id: 'burnout',
    emoji: '\u{1F975}',
    title: 'Burnout Speedrun',
    tone: 'bad',
    text: 'Sachin’s sanity hit zero. He stopped replying to messages, then stopped opening the laptop. He moves back home for a few months to recover — and learns the most important lesson of his career: no job, offer or appraisal is worth your health.',
    hint: 'Let sanity drop to 0.',
  },
  fired: {
    id: 'fired',
    emoji: '\u{1F4E4}',
    title: 'Pink Slip Friday',
    tone: 'bad',
    text: 'Reputation at zero. Pooja schedules a 15-minute “quick sync” on Friday at 4 PM, and Sachin knows. He walks out with a cardboard box, a relieving letter and a hard-earned lesson: you can job hunt, but you can’t stop showing up for the job you have.',
    hint: 'Let reputation drop to 0 before you resign.',
  },
};

export const ENDING_IDS = Object.keys(ENDINGS) as EndingId[];

export const ROMANCE_EPILOGUE: Record<Exclude<RomanceOutcome, null>, string> = {
  engaged: '\u{1F48D} And Riya said yes. The wedding planner has already asked for a 70% advance.',
  together: '❤️ Riya and Sachin are still together, still arguing about whose turn it is to book the cab.',
  split: '\u{1F494} Riya and Sachin went their separate ways — friends, mostly, and better at boundaries.',
};
