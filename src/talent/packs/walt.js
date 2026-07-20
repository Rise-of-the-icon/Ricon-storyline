/** Walt talent pack — interview-grounded storyline for the Talent Storyline Details shell. */
const CHAPTER_MEDIA = {
  "Fremont": { type:"texture", tone:"tech", mark:"HP", label:"Chapter scene", title:"Fremont", purpose:"Silicon Valley origin signal", caption:"Illustrative chapter visual for Silicon Valley circuitry and early music context. Replace with cleared Walt/RICON media when available." },
  "High School": { type:"texture", tone:"studio", mark:"Tape", label:"Chapter scene", title:"High School", purpose:"Radio, records, and first doors", caption:"Illustrative chapter visual for radio, records, and first studio doors. Replace with verified photo or video when available." },
  "The Hustle": { type:"texture", tone:"archival", mark:"Dub", label:"Chapter scene", title:"The Hustle", purpose:"Street-level cassette economy", caption:"Illustrative chapter visual for cassette duplication and street sales. Replace with cleared archival media when available." },
  "The Manager": { type:"texture", tone:"studio", mark:"Roster", label:"Chapter scene", title:"The Manager", purpose:"Long artist-development arc", caption:"Illustrative chapter visual for management years and long artist development. Replace with verified Walt/RICON media when available." },
  "The Crash & The Pivot": { type:"texture", tone:"tech", mark:"Pivot", label:"Chapter scene", title:"The Pivot", purpose:"Web and app rebuild energy", caption:"Illustrative chapter visual for web and app work after the crash. Replace with cleared media when available." },
  "Where the Money's Hidden": { type:"texture", tone:"paperwork", mark:"Rights", label:"Chapter scene", title:"Publishing Rights", purpose:"The business behind the music", caption:"Illustrative chapter visual for publishing, copyright, and sample clearance. Replace with approved document or production visual when available." },
  "Television": { type:"texture", tone:"studio", mark:"Score", label:"Chapter scene", title:"Television", purpose:"Screen scoring and supervision", caption:"Illustrative chapter visual for supervision and composition for screen. Replace with verified photo or video when available." },
  "Now · The Catalog": { type:"texture", tone:"archival", mark:"Catalog", label:"Chapter scene", title:"The Catalog", purpose:"Old recordings still working", caption:"Illustrative chapter visual for old recordings still earning. Replace with cleared catalog media when available." },
  "AI · The Next Tool": { type:"texture", tone:"tech", mark:"AI", label:"Chapter scene", title:"AI Tools", purpose:"The next production instrument", caption:"Illustrative chapter visual for tools, prompts, and production experiments. Replace with product or workflow footage when available." },
  "The Twin · Consent": { type:"texture", tone:"twin", mark:"Twin", label:"Chapter scene", title:"Twin Consent", purpose:"Likeness, license, and control", caption:"Illustrative chapter visual for consent, likeness, and protection. Replace with approved likeness media when available." },
};

const BEAT_MEDIA = {
  "The NWA tape": [
    { size:"wide", tone:"archival", label:"Cassette culture", title:"Cassette Culture", mark:"NWA", caption:"Illustrative placeholder for Walt carrying a new sound back to Fremont. Replace with a cleared archival asset." },
    { size:"small", tone:"tech", label:"Trade memory", title:"Ten Games", mark:"10", caption:"Illustrative placeholder for the trade that moved the tape from South Central to Fremont." },
  ],
  "Chasing Hammer": [
    { size:"wide", tone:"studio", label:"Studio glimpse", title:"Studio Glimpse", mark:"Door", caption:"Illustrative placeholder for the open door moment that pulled Walt into Hammer's production world. Replace with verified photo or video." },
    { size:"small", tone:"archival", label:"Bike route", title:"Fremont to Auto Mall", mark:"Ride", caption:"Illustrative placeholder for the repeated bike rides before Walt could drive." },
  ],
  "Publishing": [
    { size:"wide", tone:"paperwork", label:"Rights paperwork", title:"Rights Paperwork", mark:"Rights", caption:"Illustrative placeholder for publishing, registration, and copyright work. Replace with an approved production document visual." },
    { size:"small", tone:"archival", label:"Sample map", title:"Sample Clearance", mark:"Clear", caption:"Illustrative placeholder for the hidden business work behind samples, registrations, and permissions." },
  ],
  "Always first": [
    { size:"wide", tone:"tech", label:"Tool signal", title:"Tool Signal", mark:"Tool", caption:"Illustrative placeholder for the same early-adopter reflex moving from records to AI tools. Replace with product or workflow footage." },
    { size:"small", tone:"studio", label:"Workflow", title:"Old School Polish", mark:"Mix", caption:"Illustrative placeholder for the craft Walt still applies after using AI as a starting point." },
  ],
  "The fear, named": [
    { size:"wide", tone:"twin", label:"Consent frame", title:"Consent Frame", mark:"Twin", caption:"Illustrative placeholder for the shift from novelty to consent and control. Replace with approved likeness media." },
    { size:"small", tone:"paperwork", label:"License control", title:"License Control", mark:"Terms", caption:"Illustrative placeholder for the consent, likeness, and usage terms that make a twin feel controlled." },
  ],
};

const RESPONSES = {
  ai: { kind:"grounded", chapter:"Cold Open + early years",
    text:"Man, I've been chasing the new thing my whole life. Third grade I traded my cousin ten Nintendo games for a dub of the NWA tape and brought it back to Fremont — ever since then, I was the music guy. The four-track, my first website back in '95, Pro Tools, blockchain, all of it. When something new comes out, we gotta figure it out. AI's just the next one. The robot homie just got hella good ideas, you know what I'm saying? Like a robot Quincy Jones in my pocket with all the baddest session musicians. The tool was never the thing to be scared of." },
  own: { kind:"grounded", chapter:"Where the money's hidden",
    text:"Because the money's hidden where artists don't look — the publishing. A lot of them don't deal with it, they don't understand it, and it just gets left on the table. I took classes on it young, so it gave me an advantage in every negotiation I was in. Publishing leads you into copyright, rights, clearing samples — that's where the money's made, and where artists aren't getting paid. And now the same thing's about to happen with your likeness and AI, if nobody registers it and protects it." },
  hammer: { kind:"grounded", chapter:"Inspector Gadget",
    text:"Freshman year, before I could even drive, I used to ride my bike all the way from Fremont to the Auto Mall, just hoping to catch Hammer. One day a room was open — I could hear music coming out of it, so I poked my head in. One of his producers waved me in. 'Come here.' Turns out Hammer had two floors of a hotel by New Park Mall rented out — producers, songwriters, dancers, everybody had a studio in their room. That's how I learned how to make beats." },
  maroon: { kind:"grounded", chapter:"The management years",
    text:"They weren't even Maroon 5 when we got them — they were a group called Kara's Flowers. One of our junior managers, Jordan Feldstein, rest in peace, grew up with Adam, and he brought them in. I helped change the name. People think it happened overnight — nah. Songs About Jane was almost two years old when we met, took another two years to get a deal, another year to re-record it, then a year or two after that before it went platinum. A seven, eight year stretch. That's the part nobody sees." },
  tv: { kind:"grounded", chapter:"Television",
    text:"That came out of nowhere — during the pandemic, a call about a Tyler Perry show that wanted a new sound. My partner's wife overheard the executives at a resort and handed them our card. We interviewed, they did their homework, and gave us the show — All the Queen's Men, the first one Tyler let another crew run. I did supervision and composition both, scored the whole thing with my partner. It became their number one product. Five seasons — the last just aired on Paramount. I had to use every muscle I ever built in the music business to do it." },
  twin: { kind:"grounded", chapter:"The cloning",
    text:"The fear is the cloning — losing your autonomy. It's a psychological thing, I get it. A twin done right isn't that. Whatever artist we come into contact with, this is what would put me at ease as a manager: protect the likeness, license it, and you know it's protected. If we don't have that, what is licensing anyway? It's the same as the music — people make it but never copyright or register anything. It has to be done." },
};

const QUESTION = {
  ai:"How are you not scared of AI?",
  own:"Why don't artists own their music?",
  hammer:"Tell me the Hammer story.",
  maroon:"How did Maroon 5 happen?",
  tv:"How did the Tyler Perry show happen?",
  twin:"Clone vs. twin — what's the difference?",
};

const SUGGESTED = [
  { id:"hammer", label:"Origin", q:QUESTION.hammer },
  { id:"own", label:"Business", q:QUESTION.own },
  { id:"ai", label:"AI", q:QUESTION.ai },
  { id:"twin", label:"Twin consent", q:QUESTION.twin },
];

const UNCERTAIN = { kind:"uncertain",
  chapter:"Outside verified interview",
  text:"Man, that's not really something I got into when I sat down for this. I talked about the music, the business, managing artists, and the AI stuff — ask me about any of that and I'm all yours." };

const SOURCE_LABEL = "June 19 interview + local timeline";
const STATUS_COPY = {
  idle: "Ready from verified interview material",
  submitted: "Request received",
  preparing: "Checking Walt's interview",
  streaming: "Composing from verified material",
  stopped: "Response stopped — partial answer preserved",
  complete: "Answer ready for review",
  uncertain: "Outside verified interview",
  failed: "Could not complete response",
};

const ERAS_RAW = [
  { label:"Fremont", year:"1983 –", beats:[
    { title:"Silicon Valley kid",
      setup:"Walt's mother was one of the first programmers at HP — first wave, back when the valley was still orchards turning into chip plants. She'd bring printed circuit boards home, and he grew up taking them apart. So when music eventually moved onto computers, it never felt like a foreign world to him. It was the one he was raised in.",
      tape:"My mom was one of the first programmers at HP, in the first wave… I used to play with the printed circuit boards she'd bring home.",
      narr:"Tech was never a swerve in Walt's life. It was the house he grew up in." },
    { title:"The NWA tape",
      setup:"Third grade. N.W.A had just detonated gangster rap out of Compton, but nothing like it had reached the Fremont suburbs yet. Walt had cousins down in South Central who could get the real thing — so he made a trade, a dub of the tape for a stack of his video games, and carried it back up to the Bay.",
      tape:"I traded my cousin ten Nintendo games for a dub of the NWA tape, brought it back to Fremont in third grade — and just blew everybody's minds. Ever since then, I was the music guy.",
      narr:"The pattern is fully formed before he's ten: be first to the new sound." },
    { title:"Hooked",
      setup:"Fremont in the late '80s ran on Filipino mobile-DJ crews — the Bay Area scene that turned two turntables into a competitive sport. As the older kids aged out of those crews, they handed their gear down to Walt's circle. At a sixth-grade party, they finally let him on the tables.",
      tape:"The Filipino DJ crews out here were on another level. At the end of the night, the big brothers let us get on — and that was it. I was hooked.",
      narr:"The gear got handed down. Walt never handed it back." },
    { title:"The only kid on payroll",
      setup:"It went from hobby to income fast. He saved lunch money and did extra chores for his first equipment, then started DJing the actual school dances — which, the way he tells it, made him the only student the school was cutting checks to.",
      tape:"I'm the only kid on the payroll at the school… I've been making money with music since then. I had a bank account at 12, business cards, all of it.",
      narr:"Twelve years old, DJing the dances, already running it like a business." },
  ]},
  { label:"High School", year:"– 1995", beats:[
    { title:"Live on air",
      setup:"A local rapper named Chili Bee — the kind with radio songs and corporate gigs — came through Walt's school and ran a talent contest. Walt's group won it, and Chili Bee took them to a radio station for their first time on air. Walt was only there as the DJ. Nobody knew he'd been quietly writing raps.",
      tape:"I was the DJ, I wasn't even rhyming — but he points at me to rap. So I just started… and killed it in the station.",
      narr:"The first time anyone heard his raps was live, on the radio, with no warning." },
    { title:"Chasing Hammer", ask:"hammer",
      setup:"M.C. Hammer was, right then, one of the biggest acts on the planet — and he was local, out of Oakland, with a spot near the Fremont Auto Mall. Walt was a freshman who couldn't drive yet. So he rode his bike there, again and again, on the off chance.",
      tape:"I used to ride my bike all the way from Fremont to the Auto Mall, just to maybe catch Hammer one day.",
      narr:"Then one day a door was open, music coming out of it — and a producer waved him in." },
    { title:"How he learned to make beats",
      setup:"The producer who waved him in worked for Hammer — who at his peak had rented two whole floors of a hotel and filled them with producers, songwriters, and dancers, a studio in every room. Walt hung around until they let him touch things. One of them gave him a line he still repeats: in music, if you love it, you can do a lot of different things.",
      tape:"Hammer had two floors of that hotel rented out — producers, songwriters, dancers, everybody had a studio in their room. That's how I learned how to make beats.",
      narr:"That one line — do a lot of different things — became the map for his whole career." },
    { title:"Calling the label",
      setup:"This is pre-internet. Walt loved one rapper's album so much that he called the phone number printed on the back of the record, expecting to reach the artist himself. Instead the label put a high-schooler through to their A&R — who, charmed that he'd gotten that far, hooked him up with vinyl to spread to DJs.",
      tape:"I called the number on the back of the record, thinking I could talk to him… and they put me through to the A&R.",
      narr:"A kid cold-calling a record label and talking his way in. The fearlessness was already there." },
    { title:"Beverly Hills",
      setup:"On a school break he drove to LA and crashed at a friend's place in Beverly Hills, running with the kids interning at labels like Big Beat, Atlantic, and Interscope — most of whom now run the industry. One of them was Evan Bogart, son of Neil Bogart, the man behind Casablanca Records — Donna Summer, the disco-era powerhouse that helped make the platinum record a standard.",
      tape:"I'm hanging with the interns at Big Beat, Atlantic, Interscope — and these guys are the top dogs now.",
      narr:"That Bogart connection would later write Walt his first record deal." },
  ]},
  { label:"The Hustle", year:"mid-90s", beats:[
    { title:"The first website → Finland",
      setup:"Around 1995, almost no one Walt knew had a website. He did. Some kids in Finland found his music through it, mailed him money, and flew him to Helsinki for a week — his first time overseas, made possible by nothing but a web page and an email address.",
      tape:"I had a website at 17, 18, like '95. Some kids from Finland found my music, sent me money, and brought me out there for a week.",
      narr:"First to the internet, same as he was first to the tape. The web flew him across the world before he could legally drink." },
    { title:"Out the trunk",
      setup:"He recorded on a four-track, had his mom drive him to Costco for bulk blank cassettes, dubbed his music onto both sides, and sold them for ten dollars on Telegraph Ave in Berkeley — posted up outside Leopold's record store, picking off its customers. Eventually the store's buyer gave up and just stocked him.",
      tape:"Mom would take me to Costco for a pallet of tapes… record both sides, sell them for ten dollars. Then Leopold's said, why don't we just put your stuff in here.",
      narr:"Selling himself off the sidewalk until the store let him in — then outselling the majors on its shelves." },
    { title:"Learning the business to be heard",
      setup:"Everything he wanted — DJs to spin his records, stores to carry them — forced him to learn the machinery behind it: pressing vinyl, a resale license, a barcode, incorporating a company. When he walked into a distributor to place his records, the owner just hired him.",
      tape:"Music always led me to learn more about business… because I wanted more people to hear what I was doing.",
      narr:"Every door he wanted to walk through taught him how the building was wired." },
  ]},
  { label:"The Manager", year:"late 90s – 2000s", beats:[
    { title:"Cal State Hayward",
      setup:"He enrolled at Cal State Hayward — though he'd already been hosting a show on its college radio station while still in high school. Alongside the underground rap, he sat in the orchestra playing saxophone. The two halves never seemed to bother him.",
      tape:"I had a radio show at Cal State Hayward before I was even going there. I played saxophone in the orchestra too.",
      narr:"Underground records by night, an orchestra seat by day." },
    { title:"Manager at 18",
      setup:"Planet Asia — a Bay Area rapper catching fire at the time — came to Walt's studio to record his first material. Walt cut and mixed it, and Asia asked him to manage, because Walt was the organized one who knew everybody. He reached back to his LA contacts and walked Asia into a record deal.",
      tape:"He asked me to manage him… and that's what turned me into a manager at, like, 18.",
      narr:"DJ, artist, and now manager — all before he could legally rent a car." },
    { title:"Kara's Flowers", ask:"maroon",
      setup:"A junior manager in Walt's company, Jordan Feldstein, had grown up with Adam Levine and brought in his band — then called Kara's Flowers. Walt co-managed them and helped change the name to Maroon 5. The 'overnight' success wasn't: their album sat for years before it broke.",
      tape:"They weren't even Maroon 5 — they were a group called Kara's Flowers. Songs About Jane was almost two years old when we met. It was a seven, eight year stretch.",
      narr:"Patience, not magic, made it platinum — the part of the story nobody tells." },
    { title:"Fifteen years",
      setup:"He stayed in management for the better part of fifteen years, juggling a roster while also holding a mix-show slot on Q102 radio. A manager, he says, has to be able to do a little of everything — which is exactly the muscle he kept building, without yet knowing why.",
      tape:"I did the management thing for almost fifteen years. I had a mix show on Q102 for a couple of those, too.",
      narr:"A jack of all trades by necessity. He'd need every trade later." },
  ]},
  { label:"The Crash & The Pivot", year:"2008 –", beats:[
    { title:"To hell with music",
      setup:"When the 2008 financial crash hit, the music money dried up and Walt walked away — burned out on artists entirely. He came home to the Bay and spent the better part of a decade learning a different trade: building websites and apps, working with developers.",
      tape:"Around 2008, 2009, that crash hit and everything dried up… I was really like, to hell with music.",
      narr:"He thought he was quitting music. He was actually picking up its other half." },
    { title:"Marrying the two lives",
      setup:"After years in tech, a question formed. He had a lifetime of music knowledge and now a set of developer skills — how could he put the first to work without chaining himself back to artists? The answer would take a while to arrive.",
      tape:"I got all this information about music — how do I use that without getting married to these crazy artists?",
      narr:"Two separate lives, looking for the thing that would fuse them." },
  ]},
  { label:"Where the Money's Hidden", year:"2010s", beats:[
    { title:"Publishing", ask:"own",
      setup:"Years later, Planet Asia made Walt his publisher — handing over the side of music most artists never learn. Publishing is where the real money sits, and because so few understand it, it gets left on the table. Walt had studied it young, which had given him an edge in every deal he ever did.",
      tape:"The publishing is where the money's made, and a lot of artists don't deal with it… it just gets left on the table.",
      narr:"This became the through-line of the entire second half of his career." },
    { title:"Rights & samples",
      setup:"Publishing pulled him into everything next to it — copyright, rights management, clearing samples — the unglamorous paperwork where money is both made and quietly lost. He's been doing it with a partner for about a decade.",
      tape:"That leads me into copyright and all the other stuff — where the money is hidden and made, and where artists are not getting paid.",
      narr:"Ten years deep in the part of music nobody romanticizes. The part that pays." },
  ]},
  { label:"Television", year:"2020 –", beats:[
    { title:"The cold call", ask:"tv",
      setup:"During the pandemic, a call came in: a new show from Tyler Perry — one of the most prolific moguls in television — needed a music supervisor and a fresh sound. The lead came from pure chance: Walt's partner's wife had overheard the executives talking at a resort and slipped them a card.",
      tape:"We get a call out of nowhere about a Tyler Perry show… they wanted a new sound.",
      narr:"One overheard conversation at a resort changed everything." },
    { title:"Two checks",
      setup:"The show was All the Queen's Men — the first one Tyler Perry let another crew run. Walt took on both music supervision and composition, two jobs usually held by two people, because nobody told him he couldn't. He and his partner scored the whole thing.",
      tape:"I had to use every muscle I've ever developed in the music business… I scored the whole show, and it became their number one product.",
      narr:"Five seasons. The final one just aired on Paramount." },
    { title:"It all made sense",
      setup:"Looking back, the scattered detours — DJ, artist, manager, publisher, tech guy — stopped looking random. He reaches for The Karate Kid: all the pointless-seeming chores that were secretly the training the whole time.",
      tape:"When I look back at all the different things I did, it all made sense. Paint the fence, wax on, wax off.",
      narr:"Every detour was preparation for a seat he didn't know existed." },
  ]},
  { label:"Now · The Catalog", year:"present", beats:[
    { title:"The asset, working",
      setup:"Today Walt works with producer Michael Stokes — a man he calls a Quincy, who's worked with the Jackson 5, Janet Jackson, and Herb Alpert. Walt's own old recordings keep getting sampled into new hits, including three on the latest Drake album, each one sending royalties back his way.",
      tape:"We got three records on the new Drake album… my catalog gets sampled, and she kicks back money.",
      narr:"His old work earns while he sleeps — the exact thing he tells every artist to protect." },
  ]},
  { label:"AI · The Next Tool", year:"present", beats:[
    { title:"Always first", ask:"ai",
      setup:"The same instinct that grabbed the NWA tape grabbed everything after it. Friends nicknamed him Inspector Gadget; landing in Japan, he made straight for Akihabara's electronics district. Pro Tools, blockchain, NFTs, the metaverse, Midjourney, ChatGPT — he was early to all of it.",
      tape:"It's all tech — from programming to MIDI. When something new comes out, we gotta figure it out. They used to call me Inspector Gadget.",
      narr:"So when AI music arrived, he wasn't a skeptic for long." },
    { title:"The Suno moment",
      setup:"At first he dismissed AI music outright — until he sat down with Suno, the AI song generator. He took the vocal-only tracks from a song, stripped the original beat off, and rebuilt the whole production around the voice. Then he finished it with the old-school techniques he's always known.",
      tape:"I took the acapellas, got rid of the beat, rebuilt it in Suno… it blew my mind. Then I took it out and did all the old-school stuff I know how to do.",
      narr:"He converted the moment he realized the machine couldn't replace his craft — only amplify it." },
    { title:"The robot homie",
      setup:"To Walt, AI is just the newest instrument — no different from the leap from turntables to tape decks to Pro Tools. The gear was never the point; what comes out of the speaker is. And because he feeds it his own material to start, his results don't sound like everyone else's prompts.",
      tape:"The robot homie just got hella good ideas… like a robot Quincy Jones in my pocket with the baddest session musicians. I start with my own stuff and let it embellish.",
      narr:"Same as DJing: the equipment was never the point." },
    { title:"All in",
      setup:"He's not theorizing — he's using it. The royalty collection he used to grind through by hand in spreadsheets now runs with AI; he's even got it handling phone calls. His open-source setup, he figures, already does about sixty percent of what he wants.",
      tape:"I'm all in. I'm over it. I love it. Give me more — what else can it do?",
      narr:"The early-adopter reflex, forty years on, pointed straight at the frontier." },
  ]},
  { label:"The Twin · Consent", year:"now", beats:[
    { title:"The fear, named", ask:"twin",
      setup:"When the conversation turns to digital twins — an AI version of a real artist — Walt names the thing other artists are scared of, and doesn't wave it off. The fear is being cloned, losing control of your own self. He gets it. He just believes the answer is structure, not avoidance.",
      tape:"Is there a fear of cloning? Yeah — and losing your autonomy. It's a psychological thing. I get it.",
      narr:"He's watched unprotected work get taken from artists for thirty years. This is the same fight, new weapon." },
    { title:"The protection",
      setup:"His condition is the one he learned the hard way in publishing: protect the likeness first, register and license it, so the artist always knows it's theirs. Without that, he argues, the whole idea falls apart — because what is a license that protects nothing?",
      tape:"Protect the likeness, license it, and you know it's protected. If we don't have that, what is licensing? It has to be done.",
      narr:"The early adopter and the rights man were never two people. They finally meet — on the twin." },
  ]},
];

function slugify(label) {
  return String(label).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const eras = ERAS_RAW.map((era) => ({
  id: slugify(era.label),
  label: era.label,
  year: era.year,
  media: CHAPTER_MEDIA[era.label] ? { id: slugify(era.label) + "-scene", ...CHAPTER_MEDIA[era.label] } : undefined,
  beats: era.beats.map((b) => ({
    id: slugify(b.title),
    title: b.title,
    setup: b.setup,
    tape: b.tape,
    narr: b.narr,
    askKey: b.ask,
    mediaItems: (BEAT_MEDIA[b.title] || []).map((item, i) => ({
      id: slugify(b.title) + "-" + (i + 1),
      ...item,
    })),
  })),
}));

const BEAT = {
  nwa: "the-nwa-tape",
  hammer: "chasing-hammer",
  maroon: "karas-flowers",
  own: "publishing",
  tv: "the-cold-call",
  ai: "always-first",
  twin: "the-fear-named",
};

const ERA = {
  fremont: "fremont",
  highSchool: "high-school",
  manager: "the-manager",
  money: "where-the-moneys-hidden",
  television: "television",
  ai: "ai-the-next-tool",
  twin: "the-twin-consent",
};

RESPONSES.ai.sourceBeatIds = [BEAT.nwa, BEAT.ai];
RESPONSES.ai.sourceEraIds = [ERA.fremont, ERA.ai];
RESPONSES.own.sourceBeatIds = [BEAT.own];
RESPONSES.own.sourceEraIds = [ERA.money];
RESPONSES.hammer.sourceBeatIds = [BEAT.hammer];
RESPONSES.hammer.sourceEraIds = [ERA.highSchool];
RESPONSES.maroon.sourceBeatIds = [BEAT.maroon];
RESPONSES.maroon.sourceEraIds = [ERA.manager];
RESPONSES.tv.sourceBeatIds = [BEAT.tv];
RESPONSES.tv.sourceEraIds = [ERA.television];
RESPONSES.twin.sourceBeatIds = [BEAT.twin];
RESPONSES.twin.sourceEraIds = [ERA.twin];

/** @type {import("../types.js").TalentStoryPack} */
const waltPack = {
  id: "walt",
  displayName: "Walt",
  initial: "W",
  portraitSrc: "/walt-portrait.png",
  tags: [],
  verifiedLabel: "Verified by RICON",
  verificationNote: "Built from vetted interview material and editorial archive.",
  hook: {
    quoteParts: [
      { text: '"The robot homie just got ' },
      { text: "hella good ideas", accent: true },
      { text: '… like a robot Quincy Jones in my pocket."' },
    ],
    attribution: "Walt · verified twin",
    subcopy: "He's run toward every new technology his whole life. Here's the whole run — Fremont to the twin — in his own words.",
  },
  twin: {
    available: true,
    modes: ["narrator", "ask"],
    askCtaLabel: "Ask Walt a question",
    narratorLabel: "Narrator",
    bannerTitle: "Digital Twin Available",
    bannerBody: "Interact with Walt's verified AI twin. Choose Narrator mode to relive the story, or Q&A mode to ask anything directly.",
  },
  trust: {
    consent: "Built with Walt's participation for this verified twin.",
    sourceScope: "June 19 interview plus the editorial timeline material.",
    limit: "Not a live person and not verified beyond loaded material.",
    simulation: "Live Inworld voice and Railway-backed twin responses.",
    sourceLabel: "June 19 interview + local timeline",
  },
  statusCopy: {
    idle: "Ready from verified archive",
    submitted: "Request received",
    preparing: "Checking verified records",
    streaming: "Speaking verified twin response",
    stopped: "Response stopped — partial answer preserved",
    complete: "Verified twin response delivered",
    uncertain: "Outside verified archive",
    failed: "Could not complete response",
  },
  eras,
  chat: {
    responses: RESPONSES,
    questions: QUESTION,
    suggested: SUGGESTED,
    uncertain: UNCERTAIN,
    recovery: [
      { label: "Ask about AI", questionKey: "ai" },
      { label: "Ask about publishing", questionKey: "own" },
      { label: "Ask about the twin", questionKey: "twin" },
    ],
    matchers: [
      { id: "hammer", pattern: "hammer|auto.?mall|\bbike\b|new park" },
      { id: "maroon", pattern: "maroon|kara|feldstein|adam|levine|songs about jane" },
      { id: "tv", pattern: "tyler|perry|queen|paramount|supervisor|composer|scored|tv show|television" },
      { id: "twin", pattern: "clone|twin|likeness|consent|autonom|protect|license" },
      { id: "own", pattern: "own|owns|owning|publish|royalt|leave.*table|money.*hidden|master" },
      { id: "ai", pattern: "scared|afraid|fear|robot|inspector|suno|pro tools|blockchain|nft|midjourney|chatgpt|new.*tool|nwa|nintendo|fremont|\bdj\b|\btape\b" },
    ],
  },
  copy: {
    empty: "This is an AI-assisted twin grounded in Walt's June 19 interview and the timeline above. Ask about the music, the business, the AI, or the twin consent story. If the material does not cover it, the twin will say so.",
    disclose: "Responses are generated from Walt's verified interview and timeline with live twin voice.",
    composerPlaceholder: "Ask Walt about the music, the business, the AI…",
    composerAriaLabel: "Message Walt's twin",
    tapeLabel: "Tape · Walt, verbatim",
    outsideCue: "Outside what Walt covered",
    storyTrust: "Guided narrator uses verified voice chapters · grounded in Walt's interview",
    chatHeading: "Ask the twin",
    chatEyebrow: "The handoff · timeline → conversation",
    footer: "Digital Twin · Verified Data\nContext from the June 19 interview · live Inworld voice",
    mediaProvenance: "Illustrative media placeholder · replace with cleared Walt/RICON asset",
    timelineAriaLabel: "Walt's timeline, in order",
    verifiedBadge: "Verified twin",
  },
};

export default waltPack;
