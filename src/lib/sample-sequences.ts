import type { Message } from './types';

export type PersonaId = 'three-bears' | 'career-coach' | 'employment-seeker';

interface SampleSequence {
  style: string;
  industry: string;
  titlePattern: string;
  persona: PersonaId;
  messages: Message[];
}

export const sampleSequences: SampleSequence[] = [
  // ── Three Bears Data (original persona) ──
  {
    style: 'cold',
    industry: 'Technology',
    titlePattern: 'VP|Director|Head',
    persona: 'three-bears',
    messages: [
      {
        day: 0,
        type: 'connection_request',
        subject: null,
        body: 'Hi {{firstName}} — I noticed {{company}} has been scaling quickly in the {{industry}} space. At that growth stage, most marketing teams start finding that platform-reported ROAS numbers don\'t add up when you compare them against actual revenue. The walled garden problem gets worse, not better, as spend increases. How is your team currently handling cross-channel attribution as you scale?',
      },
      {
        day: 3,
        type: 'follow_up_1',
        subject: 'Quick thought on {{industry}} attribution',
        body: '{{firstName}} — I was looking at some research on mid-market {{industry}} companies and a pattern keeps emerging: teams spending $1M+ on marketing are losing 15-30% of budget to misattribution. The culprit is usually relying on platform-reported conversions that double-count across channels. We\'ve been helping companies like {{company}} replace that guesswork with multi-touch models that show where dollars actually drive results.',
      },
      {
        day: 7,
        type: 'follow_up_2',
        subject: '5-min assessment for {{company}}',
        body: '{{firstName}} — One of our clients in a similar space was spending $3M annually on paid media with no clear picture of which channels were driving pipeline. Within 60 days, our measurement framework identified that 22% of their spend was going to channels with near-zero incremental impact. They reallocated and saw a 31% improvement in cost-per-acquisition.\n\nWe built a free 5-minute self-assessment that tells you where your measurement gaps are — no strings attached: https://threebearsdata.com/base12\n\nWorth a look?',
      },
      {
        day: 14,
        type: 'break_up',
        subject: 'Last note from me',
        body: '{{firstName}} — I don\'t want to be another person cluttering your inbox. If marketing measurement isn\'t a priority right now, totally understood. But if it becomes one down the road, I\'m here. The Base 12 assessment (https://threebearsdata.com/base12) is always available as a starting point.\n\nWishing {{company}} continued growth.',
      },
    ],
  },
  {
    style: 'cold',
    industry: 'Retail',
    titlePattern: 'Director|VP|Head|Manager',
    persona: 'three-bears',
    messages: [
      {
        day: 0,
        type: 'connection_request',
        subject: null,
        body: 'Hi {{firstName}} — Retail marketing has a unique attribution challenge: your customers see an ad online, research on their phone, and buy in-store. I\'ve been working with mid-market retailers like {{company}} who are trying to connect those dots. What\'s your team\'s approach to measuring the full customer journey right now?',
      },
      {
        day: 3,
        type: 'follow_up_1',
        subject: 'The retail measurement gap',
        body: '{{firstName}} — Interesting trend in retail analytics: companies spending $2M+ on digital are seeing a 40% gap between what platforms report and what actually drives in-store and online revenue. The issue isn\'t the data — it\'s that each platform grades its own homework. We\'ve been helping retailers build a single source of truth that bridges online and offline.',
      },
      {
        day: 7,
        type: 'follow_up_2',
        subject: 'How a retailer saved $800K',
        body: '{{firstName}} — A mid-market retailer we work with was running seasonal campaigns across 6 channels with no way to measure incrementality. Our measurement platform revealed that two of those channels were cannibalizing each other — they were paying twice for the same conversions. Cutting the overlap saved $800K annually and actually improved performance.\n\nCurious where {{company}} might have similar blind spots? Our free 5-minute assessment gives you a quick read: https://threebearsdata.com/base12',
      },
      {
        day: 14,
        type: 'break_up',
        subject: 'Signing off',
        body: '{{firstName}} — I\'ll keep this brief. If marketing measurement becomes a priority for {{company}}, I\'d welcome the conversation. The Base 12 self-assessment is always there when you need it: https://threebearsdata.com/base12\n\nAll the best with the upcoming quarter.',
      },
    ],
  },
  {
    style: 'warm',
    industry: '*',
    titlePattern: '.*',
    persona: 'three-bears',
    messages: [
      {
        day: 0,
        type: 're_engagement',
        subject: null,
        body: '{{firstName}} — Great to be connected here. I\'ve been following {{company}}\'s growth and it\'s impressive what you\'ve built in the {{industry}} space. I work with marketing leaders at companies around your size who are navigating a common challenge: their ad platforms all claim credit for the same conversions, and nobody has a clear picture of what\'s actually driving results. Is that something your team has been grappling with?',
      },
      {
        day: 3,
        type: 'value_add',
        subject: 'Thought you\'d find this relevant',
        body: '{{firstName}} — Wanted to share something we\'ve been seeing across {{industry}} companies at {{company}}\'s stage: the teams that shift from platform-reported metrics to independent multi-touch attribution are finding 15-30% of their spend was going to low-impact channels. Not because those channels are bad — but because the measurement was wrong. It\'s a surprisingly common blind spot.',
      },
      {
        day: 7,
        type: 'offer',
        subject: 'Quick diagnostic for {{company}}',
        body: '{{firstName}} — We recently helped a company in a similar space go from "we think our marketing works" to "we know exactly which dollars drive revenue." The shift happened in about 60 days.\n\nIf you\'re curious where {{company}}\'s measurement maturity stands, we built a free 5-minute self-assessment that gives you a clear picture — no sales pitch attached: https://threebearsdata.com/base12\n\nHappy to walk through the results if you find them interesting.',
      },
      {
        day: 14,
        type: 'soft_close',
        subject: 'No pressure',
        body: '{{firstName}} — I know timing is everything, and marketing measurement might not be the top priority right now. Totally fine. If it ever moves up the list, I\'m here and happy to help — even if it\'s just a 15-minute brainstorm.\n\nThe self-assessment is always at https://threebearsdata.com/base12 whenever it\'s useful.',
      },
    ],
  },

  // ── Career Coach (Rich Luby — myinterviewcoach.co) ──
  {
    style: 'cold',
    industry: '*',
    titlePattern: '.*',
    persona: 'career-coach',
    messages: [
      {
        day: 0,
        type: 'connection_request',
        subject: null,
        body: 'Hi {{firstName}} — I came across your profile and was genuinely impressed by your work in the {{industry}} space. As someone who coaches professionals through the interview process, I know that {{title}}-level roles come with real preparation demands — every word in an interview carries weight.\n\nOne thing I share with people at your level: the biggest differentiator in executive interviews isn\'t credentials, it\'s the ability to tell a compelling story under pressure. Would love to connect.',
      },
      {
        day: 3,
        type: 'follow_up_1',
        subject: 'One interview tip for {{industry}} professionals',
        body: '{{firstName}} — Wanted to share something relevant to where you are in your career.\n\nFor professionals in {{industry}}, the most common interview gap I see is leading with responsibilities instead of outcomes. Interviewers want to hear "I drove X by doing Y" not "I was responsible for Y."\n\nIt sounds simple, but under interview pressure, most people revert to job descriptions. A little practice reframes everything. Happy to share more if it\'s useful.',
      },
      {
        day: 7,
        type: 'follow_up_2',
        subject: 'Free mock interview — my offer to you',
        body: '{{firstName}} — I\'ve done 500+ mock interviews and in 2024 alone, my clients received 115 job offers — with an average salary increase of 16% over their prior role.\n\nI want to offer you a free 30-minute mock interview session, no strings attached. You\'ll get direct, honest feedback on how you\'re showing up and where to sharpen before your next opportunity.\n\nInterested? Just reply "yes" and I\'ll send you a scheduling link.',
      },
      {
        day: 14,
        type: 'break_up',
        subject: 'No worries either way',
        body: '{{firstName}} — I\'ll leave you be after this. If the timing isn\'t right or you\'re not actively exploring new roles, totally understood — there\'s no pressure here.\n\nWhen you are ready for your next move, my door is open. Good luck with everything at {{company}}, and I hope our paths cross when the time is right.',
      },
    ],
  },
  {
    style: 'warm',
    industry: '*',
    titlePattern: '.*',
    persona: 'career-coach',
    messages: [
      {
        day: 0,
        type: 're_engagement',
        subject: null,
        body: '{{firstName}} — Great to be connected. I\'ve been thinking about folks in the {{industry}} space lately — it\'s been a lot of change over the past couple of years.\n\nHow has your career journey been going? Are you heads-down at {{company}}, or have you been thinking about what\'s next?',
      },
      {
        day: 3,
        type: 'value_add',
        subject: 'What\'s shifting in {{industry}} interviews right now',
        body: '{{firstName}} — Something worth knowing if you\'re anywhere near the job market: {{industry}} hiring panels have gotten more structured. Behavioral questions are now weighted heavily — even for senior roles where credentials used to carry the room.\n\nThe pattern I\'m seeing: candidates who nail STAR-format answers (Situation, Task, Action, Result) are converting at 2-3x the rate of those who freestyle. Worth keeping in your back pocket.',
      },
      {
        day: 7,
        type: 'offer',
        subject: 'Here if you\'re thinking about your next move',
        body: '{{firstName}} — If you\'re considering what\'s next — whether that\'s a role change, a step up, or just keeping options open — I\'d love to help you prepare.\n\nIn 2024, my clients landed 115 job offers with an average 16% salary increase. The investment is a few hours of focused practice. Happy to do a free session to see if it\'s a fit.\n\nJust say the word.',
      },
      {
        day: 14,
        type: 'soft_close',
        subject: 'Always here for a practice round',
        body: '{{firstName}} — Dropping a casual note. No agenda.\n\nIf you ever want to run through a mock interview — whether it\'s imminent or just something to keep sharp — I\'m always up for it. You\'d be surprised how much even one session clarifies your story.\n\nTake care, and good luck with everything at {{company}}.',
      },
    ],
  },
  {
    style: 'referral',
    industry: '*',
    titlePattern: '.*',
    persona: 'career-coach',
    messages: [
      {
        day: 0,
        type: 'referral_intro',
        subject: null,
        body: 'Hi {{firstName}} — A mutual connection suggested I reach out. I\'m Rich Luby, an interview coach at myinterviewcoach.co. I work one-on-one with professionals to help them nail interviews and land better-fit roles at higher comp.\n\nGiven your background in {{industry}}, I thought it might be worth a conversation — especially if you\'re thinking about your next chapter. Happy to connect.',
      },
      {
        day: 5,
        type: 'value_cta',
        subject: 'A quick story — and an offer',
        body: '{{firstName}} — I recently worked with a {{industry}} professional at the {{title}} level who had been passed over twice for promotion. We spent three sessions rebuilding how she told her story — same experience, clearer framing.\n\nShe got the role on the next cycle with a 19% salary bump.\n\nI\'d love to offer you a free 30-minute session to do the same — see where your story lands, and sharpen what isn\'t working. Interested?',
      },
      {
        day: 12,
        type: 'gentle_follow_up',
        subject: 'Following up — no pressure',
        body: '{{firstName}} — Just following up in case my last note got buried. No pressure at all — I know inboxes are brutal.\n\nIf coaching isn\'t on your radar right now, no worries. But if your next move is anywhere in the picture, I\'m here whenever you want to talk. Good luck with everything.',
      },
    ],
  },

  // ── Employment Seeker (Christian Bourlier) ──
  {
    style: 'cold',
    industry: '*',
    titlePattern: '.*',
    persona: 'employment-seeker',
    messages: [
      {
        day: 0,
        type: 'connection_request',
        subject: null,
        body: 'Hi {{firstName}} — I\'ve been following what {{company}} is building in the {{industry}} space and it genuinely caught my attention. The work you\'re doing is the kind of problem I\'d want to be close to.\n\nI\'m a full-stack developer and AI/data specialist with a background in building products from zero to one. Always interested in connecting with people doing interesting work — would love to be in your network.',
      },
      {
        day: 3,
        type: 'follow_up_1',
        subject: 'Relevant experience for what {{company}} is building',
        body: '{{firstName}} — I\'ve been thinking more about {{company}}\'s work since we connected. The challenges you\'re navigating in {{industry}} — specifically around data, AI integration, and product velocity — are areas I\'ve spent the last few years deeply in.\n\nMost recently I\'ve been building AI-powered tools and full-stack web apps with a focus on making complex systems feel simple for end users. I\'d love to share more context if there\'s ever a fit.',
      },
      {
        day: 7,
        type: 'follow_up_2',
        subject: 'Portfolio piece that might resonate',
        body: '{{firstName}} — I wanted to share something concrete. I recently built Reach — an AI-powered LinkedIn outreach platform that generates personalized multi-touch sequences at scale. Full-stack: Next.js, Drizzle ORM, PostgreSQL, multi-LLM support (Gemini, Claude).\n\nI mention it because the domain ({{industry}}) shares real structural overlap with what I built. If {{company}} has openings or is thinking about engineering capacity, I\'d love to have a conversation.',
      },
      {
        day: 14,
        type: 'break_up',
        subject: 'Leaving the door open',
        body: '{{firstName}} — I\'ll wrap up my outreach here — I don\'t want to be noise in your inbox. If the timing or fit isn\'t right, I completely understand.\n\nRegardless, I\'d love to stay connected. {{company}} is doing genuinely interesting work and I\'d enjoy following along. Best of luck with everything.',
      },
    ],
  },
  {
    style: 'warm',
    industry: '*',
    titlePattern: '.*',
    persona: 'employment-seeker',
    messages: [
      {
        day: 0,
        type: 're_engagement',
        subject: null,
        body: '{{firstName}} — Good to be connected. It\'s been a while and I\'ve been watching what {{company}} has been up to — impressive trajectory in the {{industry}} space.\n\nWhat are you and your team most focused on right now? I\'m always curious about the real challenges behind the headlines.',
      },
      {
        day: 3,
        type: 'value_add',
        subject: 'Something that might be relevant to your work',
        body: '{{firstName}} — Given what {{company}} is working on, I thought this might be worth sharing: I\'ve been deep in AI-augmented developer tooling lately — specifically patterns for reducing model latency in production and keeping context costs manageable at scale.\n\nIf any of that overlaps with your current challenges, happy to share what I\'ve learned. No agenda — just thought it might be useful.',
      },
      {
        day: 7,
        type: 'offer',
        subject: 'Contributing to what you\'re building at {{company}}',
        body: '{{firstName}} — I\'ve been thinking about your team and what {{company}} is solving. My background is in full-stack development and AI/data systems — specifically building products that make intelligent systems accessible to non-technical users.\n\nIf you\'re growing your engineering org or thinking about capacity, I\'d love to explore whether there\'s a fit. I come with a product mindset, not just a builder one.',
      },
      {
        day: 14,
        type: 'soft_close',
        subject: 'Keeping the relationship warm',
        body: '{{firstName}} — No hard ask here, just wanted to stay on your radar. I\'m a big fan of what {{company}} is doing and I\'d love to find a way to contribute, whether that\'s now or down the road.\n\nFeel free to reach out whenever — or just keep me posted on what you\'re working on. Always interested.',
      },
    ],
  },
  {
    style: 'referral',
    industry: '*',
    titlePattern: '.*',
    persona: 'employment-seeker',
    messages: [
      {
        day: 0,
        type: 'referral_intro',
        subject: null,
        body: 'Hi {{firstName}} — A mutual connection suggested I reach out. I\'m Christian Bourlier — full-stack developer, AI/data specialist, and entrepreneur. I build products at the intersection of AI and user experience, most recently a multi-LLM outreach platform for LinkedIn.\n\nGiven your role at {{company}} in the {{industry}} space, I thought it might be worth connecting. Would love to be on your radar.',
      },
      {
        day: 5,
        type: 'value_cta',
        subject: 'Relevant work I\'d love to share',
        body: '{{firstName}} — Wanted to share something concrete: I recently built Reach, an AI-powered outreach sequencer — Next.js 16, Drizzle ORM, PostgreSQL, multi-LLM routing across Gemini and Claude. The interesting part was building a system that felt intuitive to non-technical users while handling complex async AI workflows under the hood.\n\nIf {{company}} is thinking about engineering capacity or product development in the {{industry}} space, I\'d love to have a conversation about fit.',
      },
      {
        day: 12,
        type: 'gentle_follow_up',
        subject: 'Following up',
        body: '{{firstName}} — Just a friendly follow-up in case my last note got lost in the shuffle. No pressure at all.\n\nIf the timing isn\'t right or there\'s not a fit, totally understood. I\'d still love to stay connected — {{company}} is doing work I genuinely find interesting. Hope things are going well.',
      },
    ],
  },
];
