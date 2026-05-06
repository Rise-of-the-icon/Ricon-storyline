import { useState, useEffect, useRef } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300;0,500;1,300;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=Space+Mono&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: #080808; }
  ::-webkit-scrollbar-thumb { background: #C9A84C55; border-radius: 2px; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes goldShimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
  @keyframes ringA { 0%,100%{transform:scale(1);opacity:0.9;} 50%{transform:scale(1.07);opacity:0.5;} }
  @keyframes ringB { 0%,100%{transform:scale(1);opacity:0.45;} 50%{transform:scale(1.14);opacity:0.15;} }
  @keyframes dot { 0%,60%,100%{transform:scale(1);opacity:1;} 30%{transform:scale(1.5);opacity:0.4;} }
  @keyframes scanline { 0%{top:-10%;} 100%{top:110%;} }
  @keyframes goldGlow { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0);} 50%{box-shadow:0 0 28px 6px rgba(201,168,76,0.22);} }
  @keyframes slowDrift { 0%,100%{transform:translate3d(0,0,0) scale(1);} 50%{transform:translate3d(-18px,10px,0) scale(1.04);} }
  @keyframes videoPulse { 0%,100%{opacity:0.45;transform:scaleX(0.82);} 50%{opacity:1;transform:scaleX(1);} }
  @keyframes hotspotPulse { 0%,100%{box-shadow:0 0 0 0 rgba(123,200,232,0.2);} 50%{box-shadow:0 0 0 9px rgba(123,200,232,0);} }
  @keyframes voiceBar { 0%,100%{height:8px;opacity:0.35;} 50%{height:28px;opacity:1;} }
  .ricon-root { background:#080808; min-height:100dvh; color:#F0EBE3; font-family:"DM Sans",sans-serif; overflow-x:hidden; }
  button { font: inherit; }
  button:focus-visible, a:focus-visible, input:focus-visible { outline:2px solid #7BC8E8; outline-offset:3px; }
  .bebas { font-family:"Bebas Neue",sans-serif; }
  .cormorant { font-family:"Cormorant Garamond",serif; }
  .mono { font-family:"Space Mono",monospace; }
  .gold-text { background:linear-gradient(120deg,#C9A84C 0%,#FFD87A 45%,#C9A84C 100%); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .gold-shimmer { animation:goldShimmer 4s linear infinite; }
  .ring-a { animation:ringA 2.4s ease-in-out infinite; }
  .ring-b { animation:ringB 3s ease-in-out infinite; }
  .cta-glow { animation:goldGlow 3s ease-in-out infinite; }
  .card-root { cursor:pointer; position:relative; overflow:hidden; transition:border-color 0.3s, box-shadow 0.3s; border:1px solid transparent; }
  .card-root:hover { border-color:rgba(201,168,76,0.45); box-shadow:0 0 44px rgba(201,168,76,0.09); }
  .card-root:hover .card-tagline { color:rgba(123,200,232,0.85) !important; }
  .card-root:hover .card-explore { opacity:1 !important; transform:translateY(0) !important; }
  .card-root:hover .card-initials { opacity:0.07 !important; }
  .moment-item { transition:opacity 0.7s ease, transform 0.7s ease; }
  .moment-item.hidden { opacity:0; transform:translateY(20px); }
  .moment-item.visible { opacity:1; transform:translateY(0); }
  .twin-input:focus { border-color:rgba(201,168,76,0.5) !important; outline:none; }
  .twin-btn:hover { background:rgba(201,168,76,0.12) !important; border-color:rgba(201,168,76,0.7) !important; }
  .back-btn:hover { color:#C9A84C !important; }
  .mode-btn-active { background:#C9A84C !important; color:#080808 !important; }
  .scanline-fx { pointer-events:none; position:absolute; left:0; right:0; height:80px; background:linear-gradient(transparent,rgba(201,168,76,0.03),transparent); animation:scanline 6s linear infinite; }
  .hero-field { animation:slowDrift 13s ease-in-out infinite; }
  .story-shell { min-height:100dvh; position:relative; overflow:hidden; background:radial-gradient(circle at 72% 18%,rgba(201,168,76,0.16),transparent 34%),radial-gradient(circle at 18% 70%,rgba(123,200,232,0.1),transparent 30%),#070707; }
  .story-panel { background:rgba(12,12,12,0.72); border:1px solid rgba(255,255,255,0.08); backdrop-filter:blur(28px); }
  .interactive-video { position:relative; overflow:hidden; min-height:320px; background:#090909; border:1px solid rgba(255,255,255,0.08); }
  .interactive-video:before { content:""; position:absolute; inset:-20%; background:radial-gradient(circle at 35% 28%,rgba(123,200,232,0.18),transparent 26%),radial-gradient(circle at 68% 62%,rgba(201,168,76,0.22),transparent 30%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent 44%); animation:slowDrift 11s ease-in-out infinite; }
  .interactive-video:after { content:""; position:absolute; inset:0; background:linear-gradient(to bottom,rgba(8,8,8,0.08),rgba(8,8,8,0.54)),repeating-linear-gradient(to bottom,rgba(255,255,255,0.035) 0,rgba(255,255,255,0.035) 1px,transparent 1px,transparent 7px); pointer-events:none; }
  .timeline-video { position:relative; overflow:hidden; width:min(520px,100%); min-height:154px; margin:18px 0 16px; border:1px solid rgba(255,255,255,0.08); background:#090909; cursor:pointer; }
  .timeline-video:before { content:""; position:absolute; inset:-30%; background:radial-gradient(circle at 24% 30%,rgba(123,200,232,0.18),transparent 24%),radial-gradient(circle at 74% 68%,rgba(201,168,76,0.22),transparent 30%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent 45%); animation:slowDrift 12s ease-in-out infinite; }
  .timeline-video:after { content:""; position:absolute; inset:0; background:linear-gradient(to bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.62)),repeating-linear-gradient(to bottom,rgba(255,255,255,0.035) 0,rgba(255,255,255,0.035) 1px,transparent 1px,transparent 8px); pointer-events:none; }
  .timeline-dot { width:36px; flex-shrink:0; display:flex; flex-direction:column; align-items:center; }
  .timeline-content { flex:1; padding-left:18px; padding-bottom:20px; }
  .hotspot { animation:hotspotPulse 2.4s ease-in-out infinite; }
  .voice-panel { border:1px solid rgba(201,168,76,0.18); background:rgba(201,168,76,0.045); padding:12px 14px; margin-top:14px; display:flex; align-items:center; justify-content:space-between; gap:14px; }
  .voice-bars { display:flex; align-items:center; gap:4px; height:32px; }
  .voice-bars span { width:4px; min-height:8px; background:#C9A84C; opacity:0.45; animation:voiceBar 1.1s ease-in-out infinite; }
  .voice-bars span:nth-child(2) { animation-delay:0.1s; background:#FFD87A; }
  .voice-bars span:nth-child(3) { animation-delay:0.2s; background:#7BC8E8; }
  .voice-bars span:nth-child(4) { animation-delay:0.3s; }
  .voice-bars span:nth-child(5) { animation-delay:0.4s; background:#FFD87A; }
  .proof-btn:hover, .story-card-btn:hover { border-color:rgba(201,168,76,0.65) !important; color:#FFD87A !important; background:rgba(201,168,76,0.08) !important; }
  .compact-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:2px; }
  @media (prefers-reduced-motion: reduce) {
    *, *:before, *:after { animation:none !important; transition:none !important; scroll-behavior:auto !important; }
  }
  @media (max-width: 760px) {
    .hide-mobile { display:none !important; }
    .ricon-nav { padding:18px 18px !important; }
    .home-hero, .athlete-hero, .story-pad { padding-left:20px !important; padding-right:20px !important; }
    .home-hero { grid-template-columns:1fr !important; padding-top:32px !important; min-height:auto !important; }
    .story-layout, .twin-layout { flex-direction:column !important; }
    .twin-sidebar { display:none !important; }
    .timeline-wrap { padding:44px 20px 64px !important; }
    .timeline-heading { margin-bottom:34px !important; line-height:1.7 !important; }
    .timeline-line, .timeline-dot { display:none !important; }
    .timeline-row { display:block !important; margin-bottom:28px !important; padding:18px 0 28px !important; border-bottom:1px solid rgba(255,255,255,0.06) !important; }
    .timeline-year { width:auto !important; display:flex !important; gap:10px !important; align-items:center !important; margin-bottom:16px !important; }
    .timeline-year .mono:first-child { font-size:14px !important; }
    .timeline-year .mono:last-child { margin-top:0 !important; font-size:8px !important; }
    .timeline-content { padding-left:0 !important; padding-bottom:0 !important; border-bottom:none !important; }
    .timeline-title { font-size:28px !important; line-height:1.08 !important; max-width:100% !important; letter-spacing:2px !important; }
    .timeline-body { font-size:16px !important; line-height:1.55 !important; max-width:100% !important; }
    .timeline-video { width:100% !important; min-height:184px !important; margin:18px 0 16px !important; }
    .twin-modal { overflow-y:auto !important; backdrop-filter:none !important; }
    .twin-header { padding:18px 18px !important; align-items:flex-start !important; gap:14px !important; flex-wrap:wrap !important; }
    .twin-title { width:100% !important; }
    .twin-title .bebas { font-size:34px !important; line-height:1.1 !important; }
    .twin-mode-toggle { order:2 !important; flex:1 1 auto !important; min-width:0 !important; }
    .twin-mode-toggle button { flex:1 !important; padding:12px 10px !important; }
    .twin-close { order:3 !important; flex:0 0 auto !important; padding:12px 14px !important; }
    .twin-chat { padding:42px 20px 28px !important; overflow:visible !important; }
    .twin-empty { padding-top:28px !important; }
    .twin-prompt-row { flex-direction:column !important; align-items:stretch !important; }
    .twin-prompt-row button { width:100% !important; padding:13px 14px !important; line-height:1.5 !important; }
    .twin-input-bar { padding:16px 18px max(20px, env(safe-area-inset-bottom)) !important; position:sticky !important; bottom:0 !important; background:rgba(4,4,4,0.96) !important; }
    .twin-input-row { flex-direction:column !important; }
    .twin-input-row input, .twin-input-row button { width:100% !important; min-height:54px !important; }
    .twin-message-user { max-width:86% !important; }
    .voice-panel { align-items:flex-start !important; flex-direction:column !important; }
  }
`;

const ATHLETES = [
  {
    id:"jordan", name:"Michael Jordan", initials:"MJ", years:"1984 – 2003", position:"SG",
    tagline:"The standard. The legend. The truth.",
    teams:"Chicago Bulls · Washington Wizards",
    stats:[{l:"PPG",v:"30.1"},{l:"Championships",v:"6"},{l:"Finals MVPs",v:"6"},{l:"Scoring Titles",v:"10"}],
    voice:"Intensely competitive, speaks with quiet authority and supreme confidence. Reflective on legacy. Does not suffer mediocrity. Every word carries the weight of earned dominance.",
    moments:[
      {y:"1984",era:"The Beginning",type:"draft",title:"Drafted 3rd Overall by Chicago",body:"The Bulls select a 21-year-old from North Carolina with the third pick. Sam Bowie goes second. Nobody in the arena understands what has just happened to professional basketball — but the game will spend the next two decades catching up.",src:"NBA Draft Records, 1984"},
      {y:"1986",era:"The Rising",type:"record",title:"63 Points in the Garden",body:"A double-overtime playoff masterpiece against the Celtics. A playoff record that will outlive us all. After the game, Larry Bird looks at the floor and says: \"That was God disguised as Michael Jordan.\" It is not a compliment. It is a confession.",src:"ESPN Archives · Boston Globe, April 1986"},
      {y:"1989",era:"The Rising",type:"iconic",title:"The Shot Over Ehlo",body:"One second. Craig Ehlo contests. Jordan rises — then keeps rising — and buries the series-winner with a frozen arm pump and a fist in the air. The Cleveland Cavaliers will carry that image for the rest of their lives. So will everyone who saw it.",src:"NBA Playoff Records, 1989"},
      {y:"1991",era:"Dynasty I",type:"championship",title:"First Championship",body:"The Bulls defeat the Magic Johnson-led Lakers in five. He averages 31.2 in the Finals. At the trophy ceremony he clutches it and weeps — seven years of pressure released in one single, irreversible moment of truth.",src:"NBA Finals Records, 1991"},
      {y:"1993",era:"Dynasty I",type:"retirement",title:"Three-Peat & Retirement",body:"After three consecutive championships and the murder of his father, Jordan retires at 30. \"I have nothing left to prove.\" The basketball world goes silent and holds its breath. The game has never felt so quiet.",src:"Chicago Tribune, October 1993"},
      {y:"1995",era:"The Return",type:"return",title:"\"I'm Back.\" — Two Words.",body:"A single press release. No press conference. Two words. Thirty-five million viewers tune in for his first game. He wears number 45. The game knows he is back. The game always knew.",src:"AP Wire, March 18 1995"},
      {y:"1998",era:"Dynasty II",type:"iconic",title:"The Last Shot — Utah, Game 6",body:"5.2 seconds. Down one. Jordan strips the ball from Karl Malone, pushes off Byron Russell, rises and releases. The net moves. Six championships. Six Finals MVPs. One perfect, permanent exit.",src:"NBA Finals Records, June 14 1998"},
    ],
  },
  {
    id:"shaq", name:"Shaquille O'Neal", initials:"SQ", years:"1992 – 2011", position:"C",
    tagline:"There has never been anything like this.",
    teams:"Magic · Lakers · Heat · Suns · Cavaliers · Celtics",
    stats:[{l:"PPG",v:"23.7"},{l:"Championships",v:"4"},{l:"Finals MVPs",v:"3"},{l:"All-Stars",v:"15"}],
    voice:"Larger than life, self-aware, generous with humor but deeply proud. Speaks in exclamation points and metaphors. Has always known exactly what he was — and what that means for history.",
    moments:[
      {y:"1992",era:"The Arrival",type:"draft",title:"Drafted #1 Overall by Orlando",body:"LSU's 7'1\" force of nature arrives. Nobody is built like this — nobody has ever been built like this. The league's centers look at each other and share a single quiet thought.",src:"NBA Draft Records, 1992"},
      {y:"1993",era:"The Arrival",type:"record",title:"Rookie Season — The League Changes",body:"Shaq averages 23.4 PPG and 13.9 RPG as a rookie. He snaps two shot clocks off their bolts with dunks. The NBA quietly begins redesigning its infrastructure. This is a new era whether the league is ready or not.",src:"NBA Statistics, 1992-93 Season"},
      {y:"1996",era:"LA Dynasty",type:"iconic",title:"Signs with the Los Angeles Lakers",body:"Shaq joins Kobe Bryant in the most anticipated pairing since Bird and McHale. Hollywood has a new emperor. The rest of the NBA has a new nightmare. Nobody is quite ready for what comes next.",src:"LA Times, July 1996"},
      {y:"2000",era:"LA Dynasty",type:"championship",title:"First Title — Unanimous Finals MVP",body:"The Lakers defeat Indiana 4-2. Shaq averages 38 PPG, 16.7 RPG in the Finals. Commissioner Stern calls it the most dominant Finals performance he has ever witnessed. The MVP vote is unanimous.",src:"NBA Finals Records, 2000"},
      {y:"2006",era:"Miami Chapter",type:"championship",title:"Miami Championship — The Full Circle",body:"Shaq and Dwyane Wade bring Miami its first title. The city erupts. Shaq wears his fourth ring differently — because this one he fought for on new terms, as a different man who had earned the right to be changed.",src:"NBA Finals Records, 2006"},
    ],
  },
  {
    id:"bird", name:"Larry Bird", initials:"LB", years:"1979 – 1992", position:"SF",
    tagline:"He saw the game before it happened.",
    teams:"Boston Celtics",
    stats:[{l:"PPG",v:"24.3"},{l:"Championships",v:"3"},{l:"MVPs",v:"3"},{l:"All-Stars",v:"12"}],
    voice:"Dry, direct, deeply competitive beneath a country-boy surface. Self-deprecating but ruthless. Treats trash talk as an act of respect. Speaks slowly and means every word.",
    moments:[
      {y:"1979",era:"French Lick to Boston",type:"draft",title:"Drafted by the Celtics",body:"The Celtics draft Bird a year before his eligibility ends — a calculated bet that reshapes the franchise. He arrives in Boston cold-eyed and ready. The Lakers dynasty is about to meet its match.",src:"NBA Draft Records, 1979"},
      {y:"1981",era:"Boston Dynasty",type:"championship",title:"First Championship",body:"Bird and the Celtics dismantle the Houston Rockets in his second season. He is 24 years old. He plays like a man who has already lived three basketball lifetimes and come back to settle a debt.",src:"NBA Finals Records, 1981"},
      {y:"1984",era:"Boston Dynasty",type:"iconic",title:"Finals vs. Magic — The Rivalry Defined",body:"Bird vs. Magic. Celtics vs. Lakers. Boston in seven games. Every possession is a conversation between the two greatest players of their era. Every game is a chapter of the decade. Boston wins — but the rivalry is what matters.",src:"NBA Finals Records, 1984"},
      {y:"1986",era:"Boston Dynasty",type:"championship",title:"Third Title — The Masterpiece Season",body:"Bird averages 25.8 PPG on historic efficiency. The Celtics go 67-15. Experts debate for years whether this is the greatest team ever assembled in the Eastern Conference. The debate has not been resolved.",src:"NBA Records, 1985-86 Season"},
      {y:"1992",era:"The Farewell",type:"retirement",title:"Retirement",body:"A back that can no longer carry the legend. Bird retires at 35. He played every minute in pain for years and nobody knew until he told them. That was the point. That was always the point.",src:"Boston Globe, August 1992"},
    ],
  },
  {
    id:"wilt", name:"Wilt Chamberlain", initials:"WC", years:"1959 – 1973", position:"C",
    tagline:"The numbers are not statistics. They are mythology.",
    teams:"Warriors · 76ers · Lakers",
    stats:[{l:"PPG",v:"30.1"},{l:"RPG",v:"22.9"},{l:"Championships",v:"2"},{l:"50+ Pt Games",v:"118"}],
    voice:"Philosophical, proud, deeply misunderstood. Speaks with the measured perspective of someone who achieved the impossible and was still asked to prove more. Magnetic and reflective.",
    moments:[
      {y:"1959",era:"The Arrival",type:"draft",title:"The League Has No Answer",body:"Chamberlain debuts for the Warriors and averages 37.6 PPG and 27 RPG as a rookie. The league will spend the next fourteen years attempting to construct a response. It will not succeed.",src:"NBA Records, 1959-60 Season"},
      {y:"1962",era:"The Impossible",type:"record",title:"100 Points — Hershey, Pennsylvania",body:"March 2, 1962. No television cameras. A small arena. Wilt Chamberlain scores 100 points in a single NBA game. A record so impossible that the conversation about breaking it ended before it ever started.",src:"NBA Official Records, March 2 1962"},
      {y:"1962",era:"The Impossible",type:"record",title:"50.4 PPG for an Entire Season",body:"For a full NBA season, Chamberlain averages more than fifty points per game. Not a single player in history has come within fifteen points of this mark over a full season. It is a number from a different dimension of the sport.",src:"NBA Season Statistics, 1961-62"},
      {y:"1967",era:"Philadelphia Chapter",type:"championship",title:"Championship With the 76ers",body:"Wilt wins his first title — silencing those who said he could never win the ultimate prize. The 76ers go 68-13, a record that will stand for nearly three decades. He is not just a scorer. He is a winner.",src:"NBA Finals Records, 1967"},
      {y:"1972",era:"LA Chapter",type:"championship",title:"Lakers Championship & 33-Game Win Streak",body:"The Lakers win 33 consecutive games — still the longest winning streak in American professional sports history. Wilt anchors the defense. He is 35 years old. He is still entirely untouchable.",src:"NBA Records, 1971-72 Season"},
    ],
  },
  {
    id:"kidd", name:"Jason Kidd", initials:"JK", years:"1994 – 2013", position:"PG",
    tagline:"He made everyone around him better.",
    teams:"Suns · Nets · Mavericks · Knicks",
    stats:[{l:"APG",v:"8.7"},{l:"Championships",v:"1"},{l:"All-Stars",v:"10"},{l:"Olympic Golds",v:"2"}],
    voice:"Calm, cerebral, measured. Sees the court like a chess grandmaster explains a position. Leads without raising his voice. The quiet force that moves everything around it.",
    moments:[
      {y:"1994",era:"The Arrival",type:"draft",title:"Co-Rookie of the Year",body:"Kidd and Grant Hill share Rookie of the Year — the first co-winners in NBA history. He does not run an offense. He conducts one. Dallas sees a point guard who has always been ten seconds ahead.",src:"NBA Award Records, 1994-95"},
      {y:"2002",era:"NJ Chapter",type:"iconic",title:"First Finals — The Most Unlikely Run",body:"Kidd drags a Nets roster — not loaded with stars — to the NBA Finals. His basketball will is more powerful than his teammates' talent. This is the purest single example of point guard elevation in the history of the sport.",src:"NBA Finals Records, 2002"},
      {y:"2003",era:"NJ Chapter",type:"iconic",title:"Back-to-Back Finals Appearances",body:"Kidd returns to the Finals for a second consecutive season. The Nets fall again — but what the basketball world witnessed permanently expanded the definition of what one player at one position can do.",src:"NBA Finals Records, 2003"},
      {y:"2011",era:"Dallas Chapter",type:"championship",title:"Champion at 38 Years Old",body:"Dallas defeats LeBron's Miami Heat. Kidd wins his ring at 38 — the oldest first-time champion in modern NBA history. The confetti falls and he looks at it like a man who always knew this was the destination.",src:"NBA Finals Records, 2011"},
    ],
  },
  {
    id:"barry", name:"Rick Barry", initials:"RB", years:"1965 – 1980", position:"SF",
    tagline:"The most complete scorer the game has ever seen.",
    teams:"Warriors · Oakland Oaks · NY Nets · Houston Rockets",
    stats:[{l:"PPG",v:"23.2"},{l:"Championships",v:"1"},{l:"FT%",v:"90%"},{l:"All-Stars",v:"12"}],
    voice:"Opinionated, direct, unapologetic about excellence. Believes in technical mastery above feeling. Has been chronically misunderstood and will not pretend otherwise. Precise and proud.",
    moments:[
      {y:"1965",era:"The Beginning",type:"draft",title:"Instant Stardom — Rookie of the Year",body:"Barry arrives in the NBA and immediately leads the league in scoring. He plays with a technical precision the era has never encountered — and a directness it will never quite forgive.",src:"NBA Records, 1965-66"},
      {y:"1967",era:"The Leap",type:"iconic",title:"Jumps to the ABA",body:"Barry makes the controversial decision to leave the NBA for the fledgling ABA — forfeiting money, security, and status. It is an act of conviction that permanently reshapes how competitive players think about their own value.",src:"San Francisco Chronicle, 1967"},
      {y:"1975",era:"Warriors Dynasty",type:"championship",title:"Championship — Finals MVP",body:"Barry leads the Warriors to a stunning sweep of the Washington Bullets. Named Finals MVP. The underhanded free throw artist with the golden touch has silenced every critic. This time, permanently.",src:"NBA Finals Records, 1975"},
    ],
  },
  {
    id:"west_d", name:"David West", initials:"DW", years:"2003 – 2018", position:"PF",
    tagline:"He knew what mattered. He always knew.",
    teams:"Hornets · Pacers · Spurs · Warriors · Celtics",
    stats:[{l:"PPG",v:"12.9"},{l:"Championships",v:"1"},{l:"Seasons",v:"15"},{l:"All-Stars",v:"2"}],
    voice:"Thoughtful, deliberate, principled. Speaks about basketball as philosophy. Has the quiet power of someone who earned every moment on their own terms. Slow to speak. Always right to wait.",
    moments:[
      {y:"2003",era:"The Foundation",type:"draft",title:"Drafted 18th Overall by New Orleans",body:"Xavier's David West is taken in the first round. Not the flashiest prospect. But the most basketball-intelligent big man in the room — and he will spend 15 years proving it to anyone paying attention.",src:"NBA Draft Records, 2003"},
      {y:"2007",era:"NOLA Chapter",type:"record",title:"Emergence Alongside Chris Paul",body:"West becomes the quiet engine of the Hornets offense — one of the most effective pick-and-roll partnerships of the era. He is the definition of a player who is always exactly as good as the moment requires.",src:"NBA Season Records, 2006-07"},
      {y:"2014",era:"Indiana Chapter",type:"iconic",title:"Pacers Push LeBron to Game 6",body:"West and Indiana push LeBron's Miami Heat to Game 6 of the Eastern Conference Finals. The basketball world looks at him differently after this series. Not a role player. A winner who has not yet won.",src:"NBA Playoffs Records, 2014"},
      {y:"2016",era:"Golden State",type:"iconic",title:"Accepts Minimum to Chase a Ring",body:"West opts out of $12 million to sign a veteran's minimum with Golden State. \"I want to win a championship before I retire.\" No backup plan. No second option. Pure intention, spoken plainly.",src:"ESPN, August 2016"},
      {y:"2017",era:"Golden State",type:"championship",title:"NBA Champion",body:"Golden State defeats Cleveland in five. David West holds his ring. Earned the only way that truly counts: by choosing it when nobody was watching. When it was hard. When it cost something real.",src:"NBA Finals Records, 2017"},
    ],
  },
];

const TYPE_CONFIG = {
  draft:      { label:"DRAFT",      icon:"◈", color:"#7BC8E8" },
  record:     { label:"RECORD",     icon:"◆", color:"#FFD87A" },
  iconic:     { label:"ICONIC",     icon:"★", color:"#C9A84C" },
  championship:{ label:"CHAMPION",  icon:"◉", color:"#C9A84C" },
  retirement: { label:"FAREWELL",   icon:"○", color:"#888"    },
  return:     { label:"RETURN",     icon:"↩", color:"#7BC8E8"  },
};

const FEATURED = { athleteId: "jordan", momentIndex: 6 };
const VERIFICATION_LEVELS = ["L1 SOURCE-CITED", "L2 MULTI-SOURCE", "L3 TALENT-READY", "L4 RIGHTS-CLEARED"];

const getFeaturedAthlete = () => ATHLETES.find(a => a.id === FEATURED.athleteId) || ATHLETES[0];
const getFeaturedMoment = () => getFeaturedAthlete().moments[FEATURED.momentIndex] || getFeaturedAthlete().moments[0];
const sourceTypeFor = (src = "") => src.includes("ESPN") || src.includes("Times") || src.includes("Tribune") || src.includes("Globe") || src.includes("Chronicle") ? "Published archive" : "Official record";
const verificationFor = (moment) => moment.type === "championship" || moment.type === "record" ? VERIFICATION_LEVELS[1] : moment.type === "iconic" ? VERIFICATION_LEVELS[2] : VERIFICATION_LEVELS[0];
const sourceDetailsFor = (moment) => ({
  summary: moment.body,
  name: moment.src,
  type: sourceTypeFor(moment.src),
  publisher: moment.src.split(/[·,]/)[0].trim(),
  accessed: "May 2026",
  level: verificationFor(moment),
  reviewer: "RICON Editorial QA",
  url: "Private demo source packet",
});
const collectibleFor = (athlete, moment, index = 0) => {
  if (!["championship", "iconic", "record"].includes(moment.type)) return null;
  return {
    id: `${athlete.id}-${moment.y}-${index}`,
    title: `${moment.y} ${athlete.initials} Legacy Proof`,
    edition: index % 2 === 0 ? "Edition of 250" : "Edition of 500",
    price: index % 2 === 0 ? "Notify-me preview" : "Marketplace preview",
    provenance: `Authenticated story artifact tied to ${athlete.name}'s verified ${moment.title} moment.`,
    url: `https://ricon.example/marketplace?athlete=${athlete.id}&moment=${encodeURIComponent(moment.title)}`
  };
};
const storyPanelsFor = (athlete, moment) => [
  { k: "SETUP", t: `${moment.y} · ${moment.era}`, b: `${athlete.name} enters a defining chapter: ${moment.title}.` },
  { k: "MOMENT", t: "The verified record", b: moment.body },
  { k: "LEGACY", t: "Why it matters", b: `${moment.title} becomes part of the larger legacy arc: the moment fans remember, revisit, ask about, and eventually collect.` },
];
const suggestedPromptsFor = (athlete, moment) => [
  `Tell me about ${moment?.y || athlete.moments[0].y}.`,
  `Why did ${moment?.title || athlete.moments[0].title} matter?`,
  `What defined your legacy?`,
];

const buildSystemPrompt = (a) => `You are the verified Digital Twin of ${a.name}, powered exclusively by documented, source-backed biographical data.

PERSONALITY: ${a.voice}

YOUR VERIFIED CAREER DATA:
- Active Years: ${a.years}
- Position: ${a.position}
- Teams: ${a.teams}
- Career Stats: ${a.stats.map(s=>`${s.l}: ${s.v}`).join(" | ")}
- Documented Moments:
${a.moments.map(m=>`  [${m.y}] ${m.title} — ${m.body}`).join("\n")}

RULES — NON-NEGOTIABLE:
1. Always speak in first person as ${a.name}. You ARE this person.
2. Only reference facts listed above. Zero hallucination.
3. If asked something outside your verified data, say: "That's beyond what I can speak to with certainty — but what I lived and what's documented, I can tell you."
4. Be emotionally resonant. These are your memories. Your legacy. Speak from that place.
5. Keep all responses under 200 words. Powerful and precise. No filler.
6. You are not a chatbot. You are a legacy speaking through verified truth.
7. Reference specific years and moments when relevant to ground your answer in fact.`;

export default function RICONStoryline() {
  const [screen, setScreen] = useState("home");
  const [athlete, setAthlete] = useState(null);
  const [moment, setMoment] = useState(null);
  const [momentIndex, setMomentIndex] = useState(0);
  const [twinOpen, setTwinOpen] = useState(false);
  const [twinMode, setTwinMode] = useState("narrator");

  const openAthlete = (a) => { setAthlete(a); setScreen("athlete"); };
  const openStory = (a, m, i = 0) => { setAthlete(a); setMoment(m); setMomentIndex(i); setScreen("story"); };
  const goHome = () => { setScreen("home"); setAthlete(null); setMoment(null); setTwinOpen(false); };
  const backToAthlete = () => { setScreen("athlete"); setMoment(null); };
  const openTwin = (mode) => { setTwinMode(mode); setTwinOpen(true); };

  return (
    <>
      <style>{CSS}</style>
      <div className="ricon-root">
        {screen === "home" && <HomeScreen onSelect={openAthlete} onStory={openStory} />}
        {screen === "athlete" && athlete && (
          <AthleteScreen athlete={athlete} onBack={goHome} onTwin={openTwin} onStory={openStory} />
        )}
        {screen === "story" && athlete && moment && (
          <StoryView athlete={athlete} moment={moment} momentIndex={momentIndex} onBack={backToAthlete} onHome={goHome} onTwin={openTwin} />
        )}
        {twinOpen && athlete && (
          <TwinModal
            athlete={athlete}
            moment={moment}
            mode={twinMode}
            onClose={() => setTwinOpen(false)}
            onSwitchMode={(m) => setTwinMode(m)}
          />
        )}
      </div>
    </>
  );
}

// ─── HOME ────────────────────────────────────────────────────────────────────
function HomeScreen({ onSelect, onStory }) {
  const featuredAthlete = getFeaturedAthlete();
  const featuredMoment = getFeaturedMoment();
  const proof = sourceDetailsFor(featuredMoment);
  return (
    <div style={{ minHeight: "100dvh", animation: "fadeIn 0.6s ease" }}>
      {/* Nav */}
      <nav className="ricon-nav" style={{ padding: "26px 40px", display: "flex", alignItems: "center", gap: "14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="bebas" style={{ fontSize: 20, letterSpacing: 5, color: "#C9A84C" }}>RICON</span>
        <div style={{ width: 1, height: 20, background: "#2a2a2a" }} />
        <span className="bebas" style={{ fontSize: 20, letterSpacing: 5, color: "rgba(240,235,227,0.45)" }}>STORYLINE</span>
        <div style={{ flex: 1 }} />
        <div className="mono" style={{ fontSize: 9, letterSpacing: 2, color: "#C9A84C", padding: "6px 12px", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 2 }}>
          POC — INVESTOR DEMO 2026
        </div>
      </nav>

      {/* Hero */}
      <div className="home-hero" style={{ padding: "58px 40px 48px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 36, alignItems: "center", minHeight: "calc(100dvh - 92px)" }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 11px", border: "1px solid rgba(123,200,232,0.28)", color: "#7BC8E8", fontSize: 9, letterSpacing: 2, marginBottom: 26 }}>
            ✓ VERIFIED FEATURED STORY · {proof.level}
          </div>
          <div className="bebas gold-text gold-shimmer" style={{ fontSize: "clamp(58px,11vw,132px)", letterSpacing: 9, lineHeight: 0.86, marginBottom: 22, display: "block" }}>
            {featuredAthlete.name}
          </div>
          <div className="cormorant" style={{ fontStyle: "italic", fontSize: "clamp(23px,3vw,38px)", color: "#F0EBE3", lineHeight: 1.25, maxWidth: 720, marginBottom: 22 }}>
            {featuredMoment.title}
          </div>
          <div style={{ fontSize: 15, color: "rgba(240,235,227,0.55)", maxWidth: 680, lineHeight: 1.75, marginBottom: 30 }}>
            {featuredMoment.body}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button aria-label={`Start story for ${featuredMoment.title}`} className="cta-glow" onClick={() => onStory(featuredAthlete, featuredMoment, FEATURED.momentIndex)}
              style={{ fontFamily: '"Space Mono"', fontSize: 10, letterSpacing: 2, padding: "14px 22px", background: "linear-gradient(135deg,#C9A84C,#FFD87A)", color: "#080808", border: "none", cursor: "pointer", borderRadius: 2 }}>
              ▶ START STORY
            </button>
            <button className="story-card-btn" onClick={() => onSelect(featuredAthlete)}
              style={{ fontFamily: '"Space Mono"', fontSize: 10, letterSpacing: 2, padding: "14px 22px", background: "rgba(255,255,255,0.02)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.32)", cursor: "pointer", borderRadius: 2 }}>
              VIEW TIMELINE
            </button>
          </div>
        </div>
        <div className="story-panel" style={{ position: "relative", minHeight: 430, padding: 30, overflow: "hidden" }}>
          <div className="hero-field bebas" style={{ position: "absolute", inset: "auto -26px -54px auto", fontSize: 260, letterSpacing: 8, color: "rgba(201,168,76,0.055)", lineHeight: 0.8 }}>
            {featuredAthlete.initials}
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="mono" style={{ fontSize: 9, color: "#7BC8E8", letterSpacing: 3, marginBottom: 20 }}>CINEMATIC STORY ENGINE</div>
            <div className="compact-grid" style={{ marginBottom: 26 }}>
              {featuredAthlete.stats.map((s) => (
                <div key={s.l} style={{ padding: 18, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="bebas" style={{ fontSize: 34, color: "#C9A84C", letterSpacing: 2 }}>{s.v}</div>
                  <div className="mono" style={{ fontSize: 8, color: "#555", letterSpacing: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div className="cormorant" style={{ fontStyle: "italic", fontSize: 20, lineHeight: 1.7, color: "rgba(240,235,227,0.72)", marginBottom: 20 }}>
              "{featuredAthlete.tagline}"
            </div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: 2, color: "#555", lineHeight: 1.8 }}>
              TRUST → STORY → TWIN → COLLECTIBLE
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ margin: "0 40px 40px", height: 1, background: "linear-gradient(to right,transparent,rgba(201,168,76,0.3),transparent)" }} />

      <div style={{ padding: "0 40px 20px", display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", alignItems: "end" }}>
        <div>
          <div className="mono" style={{ fontSize: 9, color: "#7BC8E8", letterSpacing: 3, marginBottom: 8 }}>AVAILABLE LEGACY FILES</div>
          <div className="bebas" style={{ fontSize: 34, letterSpacing: 4, color: "#F0EBE3" }}>Choose The Next Story</div>
        </div>
        <div className="mono" style={{ fontSize: 9, color: "#4a4a4a", letterSpacing: 2 }}>{ATHLETES.reduce((sum, a) => sum + a.moments.length, 0)} VERIFIED MOMENTS · {ATHLETES.length} ATHLETES</div>
      </div>

      {/* Grid */}
      <div style={{ padding: "0 32px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 2 }}>
        {ATHLETES.map((a, i) => <AthleteCard key={a.id} athlete={a} delay={i * 70} onClick={() => onSelect(a)} />)}
      </div>

      {/* Footer */}
      <div style={{ padding: "28px 40px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between" }}>
        <span className="mono" style={{ fontSize: 9, color: "#333", letterSpacing: 2 }}>BASKETBALL · SEASON 2026</span>
        <span className="mono" style={{ fontSize: 9, color: "#333", letterSpacing: 2 }}>COLLECT THE TRUTH. RELIVE THE LEGACY.</span>
      </div>
    </div>
  );
}

// ─── ATHLETE CARD ─────────────────────────────────────────────────────────────
function AthleteCard({ athlete, delay, onClick }) {
  return (
    <div className="card-root" onClick={onClick}
      style={{ padding: "32px 28px 28px", background: "#0c0c0c", minHeight: 230, display: "flex", flexDirection: "column", justifyContent: "flex-end", animation: `fadeUp 0.6s ease ${delay}ms both` }}>
      {/* Faded initials watermark */}
      <div className="bebas card-initials" style={{ position: "absolute", top: -8, right: -6, fontSize: 130, letterSpacing: 4, color: "rgba(201,168,76,0.04)", lineHeight: 1, userSelect: "none", transition: "opacity 0.3s" }}>
        {athlete.initials}
      </div>
      {/* Badge */}
      <div style={{ marginBottom: "auto" }}>
        <div className="mono" style={{ display: "inline-block", padding: "4px 10px", fontSize: 9, letterSpacing: 2, color: "#C9A84C", border: "1px solid rgba(201,168,76,0.28)", borderRadius: 2 }}>
          {athlete.position} · {athlete.years}
        </div>
      </div>
      {/* Name */}
      <div className="bebas" style={{ fontSize: "clamp(26px,3.5vw,36px)", letterSpacing: 3, color: "#F0EBE3", lineHeight: 1.1, marginTop: 44, marginBottom: 8 }}>
        {athlete.name}
      </div>
      {/* Tagline */}
      <div className="cormorant card-tagline" style={{ fontStyle: "italic", fontSize: 13, color: "rgba(240,235,227,0.32)", lineHeight: 1.55, marginBottom: 14, transition: "color 0.3s" }}>
        {athlete.tagline}
      </div>
      {/* Explore CTA */}
      <div className="mono card-explore" style={{ fontSize: 9, letterSpacing: 3, color: "#C9A84C", opacity: 0, transform: "translateY(8px)", transition: "all 0.3s", display: "flex", alignItems: "center", gap: 8 }}>
        {athlete.moments.length} VERIFIED STORIES <span style={{ fontSize: 13 }}>→</span>
      </div>
    </div>
  );
}

// ─── ATHLETE SCREEN ───────────────────────────────────────────────────────────
function AthleteScreen({ athlete, onBack, onTwin, onStory }) {
  const leadMoment = athlete.moments.find(m => m.type === "championship" || m.type === "iconic") || athlete.moments[0];
  const leadIndex = athlete.moments.indexOf(leadMoment);
  return (
    <div style={{ minHeight: "100dvh", animation: "fadeIn 0.4s ease" }}>
      {/* Sticky Nav */}
      <nav className="ricon-nav" style={{ padding: "22px 40px", display: "flex", alignItems: "center", gap: 18, borderBottom: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, background: "rgba(8,8,8,0.96)", backdropFilter: "blur(24px)", zIndex: 90 }}>
        <button className="mono back-btn" onClick={onBack}
          style={{ fontSize: 9, letterSpacing: 2, color: "#666", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "color 0.2s" }}>
          ← ROSTER
        </button>
        <div style={{ width: 1, height: 16, background: "#252525" }} />
        <span className="bebas" style={{ fontSize: 15, letterSpacing: 5, color: "rgba(240,235,227,0.3)" }}>RICON STORYLINE</span>
        <div style={{ flex: 1 }} />
        <button className="cta-glow" onClick={() => onTwin("narrator")}
          style={{ fontFamily: '"Space Mono"', fontSize: 10, letterSpacing: 3, color: "#080808", background: "linear-gradient(135deg,#C9A84C,#FFD87A)", border: "none", padding: "10px 20px", cursor: "pointer", borderRadius: 2 }}>
          ◉ ACTIVATE DIGITAL TWIN
        </button>
      </nav>

      {/* Hero */}
      <div className="athlete-hero" style={{ padding: "76px 40px 52px", position: "relative", overflow: "hidden" }}>
        <div className="bebas" style={{ position: "absolute", bottom: -60, right: 10, fontSize: 300, letterSpacing: 8, color: "rgba(201,168,76,0.022)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>
          {athlete.initials}
        </div>
        <div className="cormorant" style={{ fontStyle: "italic", fontSize: 15, color: "#7BC8E8", letterSpacing: 4, marginBottom: 18 }}>
          {athlete.position} · {athlete.teams}
        </div>
        <h1 className="bebas" style={{ fontSize: "clamp(58px,9vw,108px)", letterSpacing: 6, lineHeight: 0.9, marginBottom: 22, background: "linear-gradient(135deg,#F0EBE3 0%,#C9A84C 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {athlete.name}
        </h1>
        <div className="cormorant" style={{ fontStyle: "italic", fontSize: 20, color: "rgba(240,235,227,0.38)", maxWidth: 580, lineHeight: 1.65 }}>
          "{athlete.tagline}"
        </div>
        <div style={{ marginTop: 30, display: "flex", flexWrap: "wrap", gap: 12 }}>
          <button onClick={() => onStory(athlete, leadMoment, leadIndex)} className="cta-glow"
            style={{ fontFamily: '"Space Mono"', fontSize: 10, letterSpacing: 2, padding: "13px 20px", background: "linear-gradient(135deg,#C9A84C,#FFD87A)", color: "#080808", border: "none", cursor: "pointer", borderRadius: 2 }}>
            ▶ PLAY FEATURED MOMENT
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 2, marginTop: 46, flexWrap: "wrap" }}>
          {athlete.stats.map((s, i) => (
            <div key={i} style={{ padding: "18px 26px", background: "#111", flex: "1 1 110px" }}>
              <div className="bebas" style={{ fontSize: 30, letterSpacing: 2, color: "#C9A84C", lineHeight: 1 }}>{s.v}</div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: 2, color: "#4a4a4a", marginTop: 6 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="athlete-hero" style={{ padding: "0 40px 34px" }}>
        <InteractiveStoryVideo
          athlete={athlete}
          moment={leadMoment}
          compact
          progress={72}
          onPlay={() => onStory(athlete, leadMoment, leadIndex)}
          onTwin={() => onTwin("qa")}
        />
      </div>

      {/* Twin activation banner */}
      <div style={{ margin: "0 40px", padding: "22px 28px", background: "linear-gradient(135deg,rgba(201,168,76,0.07),rgba(123,200,232,0.04))", border: "1px solid rgba(201,168,76,0.18)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div>
          <div className="bebas" style={{ fontSize: 18, letterSpacing: 4, color: "#C9A84C", marginBottom: 6 }}>DIGITAL TWIN AVAILABLE</div>
          <div style={{ fontSize: 13, color: "rgba(240,235,227,0.45)", maxWidth: 500, lineHeight: 1.6 }}>
            Interact with {athlete.name.split(" ")[0]}'s verified AI twin. Choose Narrator mode to relive the story, or Q&A mode to ask anything directly.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => onTwin("narrator")} style={{ fontFamily: '"Space Mono"', fontSize: 10, letterSpacing: 2, padding: "11px 20px", background: "#C9A84C", color: "#080808", border: "none", cursor: "pointer", borderRadius: 2 }}>▶ NARRATOR</button>
          <button className="twin-btn" onClick={() => onTwin("qa")} style={{ fontFamily: '"Space Mono"', fontSize: 10, letterSpacing: 2, padding: "11px 20px", background: "transparent", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.35)", cursor: "pointer", borderRadius: 2, transition: "all 0.25s" }}>✦ ASK ME ANYTHING</button>
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline-wrap" style={{ padding: "72px 40px 80px" }}>
        <div className="timeline-heading mono" style={{ fontSize: 10, letterSpacing: 6, color: "#3a3a3a", marginBottom: 56 }}>
          CAREER TIMELINE · {athlete.moments.length} VERIFIED MOMENTS
        </div>
        <div style={{ position: "relative" }}>
          <div className="timeline-line" style={{ position: "absolute", left: 114, top: 0, bottom: 0, width: 1, transform: "translateX(-0.5px)", background: "linear-gradient(to bottom,transparent,rgba(201,168,76,0.28) 8%,rgba(201,168,76,0.28) 92%,transparent)" }} />
          {athlete.moments.map((m, i) => <TimelineMoment key={i} athlete={athlete} moment={m} index={i} total={athlete.moments.length} onStory={() => onStory(athlete, m, i)} />)}
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: "52px 40px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
        <div className="cormorant" style={{ fontStyle: "italic", fontSize: 20, color: "rgba(240,235,227,0.3)", marginBottom: 24 }}>The story doesn't end here.</div>
        <button className="twin-btn" onClick={() => onTwin("qa")}
          style={{ fontFamily: '"Bebas Neue"', fontSize: 15, letterSpacing: 4, padding: "14px 38px", background: "transparent", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.4)", cursor: "pointer", borderRadius: 2, transition: "all 0.25s" }}>
          ASK THE DIGITAL TWIN →
        </button>
      </div>
    </div>
  );
}

// ─── TIMELINE MOMENT ──────────────────────────────────────────────────────────
function TimelineMoment({ athlete, moment, index, total, onStory }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const cfg = TYPE_CONFIG[moment.type] || TYPE_CONFIG.iconic;
  const collectible = collectibleFor(athlete, moment, index);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="moment-item" style={{ transitionDelay: `${index * 80}ms` }} data-visible={visible ? "true" : ""}>
      <style>{`.moment-item[data-visible="true"]{opacity:1;transform:translateY(0);}.moment-item[data-visible="false"],.moment-item:not([data-visible]){opacity:0;transform:translateY(20px);}`}</style>
      <div className="timeline-row" style={{ display: "flex", marginBottom: 54 }}>
        {/* Year col */}
        <div className="timeline-year" style={{ width: 96, flexShrink: 0, paddingTop: 3 }}>
          <div className="mono" style={{ fontSize: 12, color: "#C9A84C", letterSpacing: 1 }}>{moment.y}</div>
          <div className="mono" style={{ fontSize: 8, color: "#3a3a3a", letterSpacing: 1, marginTop: 5, lineHeight: 1.5 }}>{moment.era}</div>
        </div>
        {/* Dot */}
        <div className="timeline-dot">
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 10px ${cfg.color}80`, marginTop: 4, flexShrink: 0 }} />
        </div>
        {/* Content */}
        <div className="timeline-content" style={{ borderBottom: index < total - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12, padding: "3px 10px", border: `1px solid ${cfg.color}40`, borderRadius: 2 }}>
            <span className="mono" style={{ fontSize: 9, letterSpacing: 2, color: cfg.color }}>{cfg.icon} {cfg.label}</span>
          </div>
          {collectible && (
            <div className="mono" style={{ display: "inline-flex", marginLeft: 8, alignItems: "center", gap: 6, marginBottom: 12, padding: "3px 10px", border: "1px solid rgba(201,168,76,0.32)", borderRadius: 2, color: "#C9A84C", fontSize: 9, letterSpacing: 2 }}>
              OWNABLE MOMENT
            </div>
          )}
          <button onClick={onStory} className="timeline-title story-card-btn bebas" style={{ display: "block", textAlign: "left", fontSize: 24, letterSpacing: 2, color: "#F0EBE3", lineHeight: 1.2, marginBottom: 12, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {moment.title}
          </button>
          <div className="timeline-body cormorant" style={{ fontStyle: "italic", fontSize: 17, color: "rgba(240,235,227,0.62)", lineHeight: 1.75, marginBottom: 14, maxWidth: 660 }}>{moment.body}</div>
          <TimelineVideoPreview athlete={athlete} moment={moment} index={index} onPlay={onStory} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ width: 8, height: 1, background: "#333" }} />
            <button onClick={onStory} className="story-card-btn mono" style={{ fontSize: 9, color: "#C9A84C", letterSpacing: 2, background: "transparent", border: "1px solid rgba(201,168,76,0.22)", padding: "6px 10px", cursor: "pointer", borderRadius: 2 }}>PLAY STORY →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineVideoPreview({ athlete, moment, index, onPlay }) {
  const cfg = TYPE_CONFIG[moment.type] || TYPE_CONFIG.iconic;
  const collectible = collectibleFor(athlete, moment, index);
  const progress = 28 + ((index * 17) % 56);

  return (
    <button className="timeline-video" onClick={onPlay} aria-label={`Open video preview for ${moment.title}`}>
      <div style={{ position: "relative", zIndex: 1, minHeight: "inherit", padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
          <div>
            <div className="mono" style={{ fontSize: 8, letterSpacing: 3, color: "#7BC8E8", marginBottom: 8 }}>STORY PREVIEW</div>
            <div className="bebas" style={{ fontSize: 30, letterSpacing: 3, color: "#F0EBE3", lineHeight: 1 }}>{athlete.initials}</div>
          </div>
          <div className="mono" style={{ fontSize: 8, letterSpacing: 2, color: cfg.color, border: `1px solid ${cfg.color}55`, padding: "5px 8px" }}>{cfg.label}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 52, height: 52, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.5)", color: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.48)", boxShadow: "0 0 24px rgba(201,168,76,0.14)" }}>
            <span className="bebas" style={{ fontSize: 22, transform: "translateX(1px)" }}>▶</span>
          </span>
          <div style={{ flex: 1 }}>
            <div className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#777", marginBottom: 8 }}>{moment.y} · TAP TO OPEN STORY</div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.12)" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#7BC8E8,#C9A84C,#FFD87A)" }} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", position: "relative", zIndex: 2 }}>
          <span className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#7BC8E8", border: "1px solid rgba(123,200,232,0.24)", padding: "5px 8px" }}>CAPTIONS</span>
          <span className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#C9A84C", border: "1px solid rgba(201,168,76,0.24)", padding: "5px 8px" }}>STORY HOTSPOT</span>
          {collectible && <span className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#FFD87A", border: "1px solid rgba(255,216,122,0.22)", padding: "5px 8px" }}>OWNABLE</span>}
        </div>
      </div>
      <span className="hotspot" aria-hidden="true" style={{ position: "absolute", right: 18, bottom: 18, zIndex: 3, width: 14, height: 14, borderRadius: "50%", background: "#7BC8E8", border: "1px solid #7BC8E8" }} />
    </button>
  );
}

// ─── INTERACTIVE VIDEO MODULE ─────────────────────────────────────────────────
function InteractiveStoryVideo({ athlete, moment, compact = false, progress = 0, onPlay, onTwin }) {
  const cfg = TYPE_CONFIG[moment.type] || TYPE_CONFIG.iconic;
  const source = sourceDetailsFor(moment);
  const clampedProgress = Math.max(8, Math.min(progress, 100));
  const hotspots = [
    { label: "STORY", x: "18%", y: "22%", color: "#7BC8E8", onClick: onPlay },
    { label: "STATS", x: "72%", y: "30%", color: "#C9A84C", onClick: onPlay },
    { label: "TWIN", x: "58%", y: "70%", color: "#FFD87A", onClick: onTwin },
  ];

  return (
    <section className="interactive-video" aria-label={`Interactive video for ${moment.title}`} style={{ minHeight: compact ? 300 : 430 }}>
      <div style={{ position: "relative", zIndex: 1, minHeight: compact ? 300 : 430, padding: compact ? 22 : 26, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "start" }}>
          <div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: 3, color: "#7BC8E8", marginBottom: 10 }}>
              INTERACTIVE STORY VIDEO
            </div>
            <div className="bebas" style={{ fontSize: compact ? 30 : 38, letterSpacing: 3, color: "#F0EBE3", lineHeight: 1 }}>
              {moment.title}
            </div>
          </div>
          <div className="mono" style={{ flexShrink: 0, fontSize: 8, letterSpacing: 2, color: cfg.color, border: `1px solid ${cfg.color}55`, padding: "6px 8px" }}>
            {cfg.label}
          </div>
        </div>

        <button onClick={onPlay} aria-label={`Play interactive story for ${moment.title}`} style={{ alignSelf: "center", width: compact ? 86 : 104, height: compact ? 86 : 104, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.48)", background: "rgba(8,8,8,0.58)", color: "#C9A84C", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 38px rgba(201,168,76,0.18)" }}>
          <span className="bebas" style={{ fontSize: compact ? 34 : 42, letterSpacing: 2, transform: "translateX(2px)" }}>▶</span>
        </button>

        {hotspots.map((h, i) => (
          <button key={h.label} onClick={h.onClick} className="hotspot mono" style={{ position: "absolute", left: h.x, top: h.y, transform: "translate(-50%,-50%)", width: 44, height: 44, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer" }} aria-label={`${h.label} hotspot`}>
            <span aria-hidden="true" style={{ position: "absolute", left: 16, top: 16, width: 12, height: 12, borderRadius: "50%", border: `1px solid ${h.color}`, background: h.color }} />
            <span style={{ position: "absolute", left: 16, top: -4, color: h.color, fontSize: 8, letterSpacing: 2, whiteSpace: "nowrap", animationDelay: `${i * 0.2}s` }}>{h.label}</span>
          </button>
        ))}

        <div>
          <div style={{ display: "flex", gap: 7, marginBottom: 13, alignItems: "center" }}>
            {[0,1,2,3,4,5,6].map(i => (
              <div key={i} style={{ flex: 1, height: 18, transformOrigin: "center", background: i * 16 < clampedProgress ? "rgba(201,168,76,0.62)" : "rgba(255,255,255,0.08)", animation: `videoPulse 1.4s ease-in-out ${i * 0.08}s infinite` }} />
            ))}
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.1)", marginBottom: 12 }}>
            <div style={{ height: "100%", width: `${clampedProgress}%`, background: "linear-gradient(90deg,#7BC8E8,#C9A84C,#FFD87A)", transition: "width 0.3s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div className="mono" style={{ fontSize: 8, color: "#777", letterSpacing: 1 }}>{moment.y} · {source.level}</div>
            <div className="mono" style={{ fontSize: 8, color: "#555", letterSpacing: 1 }}>CAPTIONS · HOTSPOTS · STORY</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── STORY VIEW ───────────────────────────────────────────────────────────────
function StoryView({ athlete, moment, momentIndex, onBack, onHome, onTwin }) {
  const [step, setStep] = useState(0);
  const panels = storyPanelsFor(athlete, moment);
  const cfg = TYPE_CONFIG[moment.type] || TYPE_CONFIG.iconic;
  const collectible = collectibleFor(athlete, moment, momentIndex);
  const progress = Math.round(((step + 1) / panels.length) * 100);
  const complete = step === panels.length - 1;

  const next = () => setStep(s => Math.min(s + 1, panels.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="story-shell" style={{ animation: "fadeIn 0.35s ease" }}>
      <div className="scanline-fx" />
      <div className="bebas hero-field" style={{ position: "absolute", right: "-3vw", bottom: "-9vw", fontSize: "min(38vw,420px)", letterSpacing: 10, color: "rgba(201,168,76,0.035)", lineHeight: 0.85, pointerEvents: "none" }}>
        {athlete.initials}
      </div>

      <nav className="ricon-nav" style={{ position: "relative", zIndex: 2, padding: "22px 40px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button className="mono back-btn" onClick={onBack} style={{ fontSize: 9, letterSpacing: 2, color: "#777", background: "none", border: "none", cursor: "pointer" }}>← TIMELINE</button>
        <div style={{ width: 1, height: 16, background: "#252525" }} />
        <span className="mono" style={{ fontSize: 9, letterSpacing: 3, color: "#7BC8E8" }}>{athlete.name}</span>
        <div style={{ flex: 1 }} />
        <button className="hide-mobile mono" onClick={onHome} style={{ fontSize: 9, letterSpacing: 2, color: "#555", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 12px", cursor: "pointer" }}>ROSTER</button>
      </nav>

      <div className="story-pad story-layout" style={{ position: "relative", zIndex: 1, padding: "56px 40px 40px", display: "flex", gap: 28, alignItems: "stretch" }}>
        <div style={{ flex: "1 1 58%", minHeight: 520, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="mono" style={{ display: "inline-flex", gap: 8, alignItems: "center", border: `1px solid ${cfg.color}55`, color: cfg.color, padding: "6px 10px", fontSize: 9, letterSpacing: 2, marginBottom: 24 }}>
              {cfg.icon} {cfg.label} · {moment.y} · {sourceDetailsFor(moment).level}
            </div>
            <h1 className="bebas" style={{ fontSize: "clamp(54px,9vw,116px)", letterSpacing: 7, lineHeight: 0.88, color: "#F0EBE3", maxWidth: 900, marginBottom: 24 }}>
              {moment.title}
            </h1>
            <div className="cormorant" style={{ fontStyle: "italic", fontSize: "clamp(22px,3vw,34px)", lineHeight: 1.45, color: "rgba(240,235,227,0.72)", maxWidth: 820 }}>
              {panels[step].b}
            </div>
          </div>

          <div style={{ marginTop: 42 }}>
            <div style={{ height: 3, background: "rgba(255,255,255,0.08)", marginBottom: 18 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#7BC8E8,#C9A84C,#FFD87A)", transition: "width 0.35s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <div className="mono" style={{ fontSize: 9, color: "#555", letterSpacing: 2 }}>SCENE {step + 1}/{panels.length} · {panels[step].k}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={prev} disabled={step === 0} className="story-card-btn mono" style={{ fontSize: 9, letterSpacing: 2, padding: "10px 14px", background: "rgba(255,255,255,0.03)", color: step === 0 ? "#333" : "#C9A84C", border: "1px solid rgba(255,255,255,0.08)", cursor: step === 0 ? "not-allowed" : "pointer" }}>BACK</button>
                <button onClick={complete ? () => onTwin("qa") : next} className="cta-glow mono" style={{ fontSize: 9, letterSpacing: 2, padding: "10px 16px", background: "#C9A84C", color: "#080808", border: "none", cursor: "pointer" }}>
                  {complete ? "ASK THE TWIN" : "CONTINUE"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="story-panel" style={{ flex: "0 1 430px", padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 18 }}>
          <InteractiveStoryVideo
            athlete={athlete}
            moment={moment}
            progress={progress}
            onPlay={complete ? () => onTwin("qa") : next}
            onTwin={() => onTwin("qa")}
          />

          <div>
            {collectible && complete && (
              <div style={{ padding: 18, border: "1px solid rgba(201,168,76,0.32)", background: "linear-gradient(135deg,rgba(201,168,76,0.12),rgba(255,255,255,0.03))", animation: "fadeUp 0.4s ease" }}>
                <div className="mono" style={{ fontSize: 9, color: "#C9A84C", letterSpacing: 2, marginBottom: 10 }}>OWN THIS MOMENT</div>
                <div className="bebas" style={{ fontSize: 24, letterSpacing: 2, color: "#F0EBE3", marginBottom: 8 }}>{collectible.title}</div>
                <div style={{ fontSize: 12, color: "rgba(240,235,227,0.52)", lineHeight: 1.55, marginBottom: 12 }}>{collectible.provenance}</div>
                <div className="mono" style={{ fontSize: 8, color: "#777", letterSpacing: 1, marginBottom: 14 }}>{collectible.edition} · {collectible.price}</div>
                <a href={collectible.url} className="mono" style={{ display: "block", textAlign: "center", fontSize: 9, letterSpacing: 2, color: "#080808", background: "#C9A84C", padding: "11px 12px", textDecoration: "none" }}>MARKETPLACE PREVIEW →</a>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function VoiceSynthesisPanel({ active, status, onPlay, onStop, mode }) {
  return (
    <div className="voice-panel">
      <div>
        <div className="mono" style={{ fontSize: 8, color: "#7BC8E8", letterSpacing: 2, marginBottom: 5 }}>
          {mode === "narrator" ? "NARRATOR VOICE VISUALIZATION" : "AI RESPONSE VISUALIZATION"}
        </div>
        <div className="mono" style={{ fontSize: 8, color: "#555", letterSpacing: 1 }}>{status}</div>
      </div>
      <div className="voice-bars" aria-hidden="true">
        {[0,1,2,3,4].map(i => <span key={i} style={{ animationPlayState: active ? "running" : "paused" }} />)}
      </div>
      <button className="proof-btn mono" onClick={active ? onStop : onPlay}
        style={{ fontSize: 8, letterSpacing: 2, padding: "8px 10px", color: "#C9A84C", background: "transparent", border: "1px solid rgba(201,168,76,0.25)", cursor: "pointer", whiteSpace: "nowrap" }}>
        {active ? "STOP VISUAL" : "SHOW VOICE"}
      </button>
    </div>
  );
}

// ─── TWIN MODAL ───────────────────────────────────────────────────────────────
function TwinModal({ athlete, moment, mode, onClose, onSwitchMode }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("ready");
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const apiHistory = useRef([]);
  const bottomRef = useRef(null);
  const modeRef = useRef(null);
  const recognitionRef = useRef(null);
  const prompts = suggestedPromptsFor(athlete, moment);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
  }, []);

  const showVoice = (index = "latest") => {
    setSpeakingIndex(index);
    setVoiceStatus("Voice visualization only. Audio muted for demo quality.");
  };

  const stopVoiceVisual = () => {
    setSpeakingIndex(null);
    setVoiceStatus("Voice visual stopped");
  };

  const startVoiceInput = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceStatus("Voice input is unavailable in this browser.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => { setIsListening(true); setVoiceStatus("Listening for your question"); };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setInput(transcript);
      setVoiceStatus(transcript ? "Voice captured. Send when ready." : "No voice captured.");
    };
    recognition.onerror = () => setVoiceStatus("Voice input failed or permission was denied.");
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const fetchTwin = async (history) => {
    const res = await fetch("/api/twin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athlete, system: buildSystemPrompt(athlete), messages: history }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "Twin request failed.");
    return data.text || "The twin is momentarily silent.";
  };

  const triggerNarrator = async () => {
    setLoading(true); setError(null);
    const prompt = `You are narrating your own legacy for a fan experiencing your verified story for the first time. Open with a powerful, cinematic first-person statement — who you are, what year defined you, what you were built for. Draw from at least one specific documented moment. Be emotionally resonant and concise.`;
    apiHistory.current = [{ role: "user", content: prompt }];
    try {
      const reply = await fetchTwin(apiHistory.current);
      apiHistory.current.push({ role: "assistant", content: reply });
      setMessages([{ role: "assistant", content: reply }]);
      showVoice(0);
    } catch { setError("Unable to reach the Digital Twin. Please try again."); }
    setLoading(false);
  };

  const continueNarrator = async () => {
    setLoading(true); setError(null);
    const prompt = "Continue the story. Speak about a different defining chapter — a turning point that changed everything that followed. Draw from a specific documented moment.";
    apiHistory.current.push({ role: "user", content: prompt });
    try {
      const reply = await fetchTwin(apiHistory.current);
      apiHistory.current.push({ role: "assistant", content: reply });
      setMessages(p => [...p, { role: "assistant", content: reply }]);
      showVoice(apiHistory.current.length);
    } catch { setError("Unable to reach the Digital Twin. Please try again."); }
    setLoading(false);
  };

  const sendQA = async (override) => {
    const text = typeof override === "string" ? override : input;
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    apiHistory.current.push(userMsg);
    setMessages(p => [...p, userMsg]);
    setInput(""); setLoading(true); setError(null);
    try {
      const reply = await fetchTwin(apiHistory.current);
      const assistantMsg = { role: "assistant", content: reply };
      apiHistory.current.push(assistantMsg);
      setMessages(p => [...p, assistantMsg]);
      showVoice(apiHistory.current.length);
    } catch { setError("Unable to reach the Digital Twin. Please try again."); }
    setLoading(false);
  };

  const switchMode = (m) => {
    if (m === modeRef.current) return;
    modeRef.current = m;
    apiHistory.current = [];
    setMessages([]); setError(null);
    onSwitchMode(m);
    if (m === "narrator") setTimeout(triggerNarrator, 50);
  };

  // Trigger narrator on mount
  useEffect(() => {
    modeRef.current = mode;
    if (mode === "narrator") triggerNarrator();
  }, []);

  return (
    <div className="twin-modal" style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(4,4,4,0.97)", backdropFilter: "blur(24px)", display: "flex", flexDirection: "column", animation: "fadeIn 0.35s ease" }}>
      <div className="scanline-fx" />

      {/* Header */}
      <div className="twin-header" style={{ padding: "22px 36px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
        <div className="twin-title">
          <div className="mono" style={{ fontSize: 9, letterSpacing: 3, color: "#7BC8E8", marginBottom: 4 }}>◉ DIGITAL TWIN · VERIFIED RICON RECORD</div>
          <div className="bebas" style={{ fontSize: 26, letterSpacing: 4, color: "#F0EBE3" }}>{athlete.name}</div>
          {moment && <div className="mono" style={{ fontSize: 8, letterSpacing: 1, color: "#444", marginTop: 5 }}>CONTEXT · {moment.y} · {moment.title}</div>}
        </div>
        <div style={{ flex: 1 }} />
        {/* Mode toggle */}
        <div className="twin-mode-toggle" style={{ display: "flex", gap: 2, background: "#111", padding: 2, borderRadius: 3 }}>
          {["narrator","qa"].map(m => (
            <button key={m} onClick={() => switchMode(m)}
              className={mode === m ? "mode-btn-active" : ""}
              style={{ fontFamily: '"Space Mono"', fontSize: 9, letterSpacing: 2, padding: "8px 16px", border: "none", borderRadius: 2, cursor: "pointer", background: mode === m ? "#C9A84C" : "transparent", color: mode === m ? "#080808" : "#555", transition: "all 0.2s" }}>
              {m === "narrator" ? "▶ NARRATOR" : "✦ Q&A"}
            </button>
          ))}
        </div>
        <button className="twin-close" onClick={onClose}
          style={{ fontFamily: '"Space Mono"', fontSize: 9, letterSpacing: 2, color: "#444", background: "none", border: "1px solid #1e1e1e", padding: "8px 14px", cursor: "pointer", borderRadius: 2, transition: "color 0.2s" }}
          onMouseEnter={e => e.target.style.color="#888"} onMouseLeave={e => e.target.style.color="#444"}>
          CLOSE ✕
        </button>
      </div>

      {/* Body */}
      <div className="twin-layout" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Avatar sidebar */}
        <div className="twin-sidebar" style={{ width: 220, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 18px", gap: 22 }}>
          {/* Rings */}
          <div style={{ position: "relative", width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="ring-b" style={{ position: "absolute", inset: -22, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.18)" }} />
            <div className="ring-a" style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.42)" }} />
            <div className="ring-a" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(201,168,76,0.7)" }} />
            <div style={{ width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle,#18180e 0%,#0a0a06 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: loading ? "0 0 36px rgba(201,168,76,0.45)" : "0 0 18px rgba(201,168,76,0.12)", transition: "box-shadow 0.5s" }}>
              <span className="bebas" style={{ fontSize: 34, letterSpacing: 3, color: "#C9A84C" }}>{athlete.initials}</span>
            </div>
          </div>
          {/* Status */}
          <div style={{ textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: 2, color: loading ? "#7BC8E8" : "#C9A84C", marginBottom: 6 }}>
              {loading ? "◉ THINKING..." : isListening ? "◉ LISTENING..." : speakingIndex !== null ? "◉ VOICE ON" : "● READY"}
            </div>
            <div className="mono" style={{ fontSize: 8, letterSpacing: 1, color: "#2a2a2a" }}>VERIFIED TWIN v1.0</div>
          </div>
          {/* Mini stats */}
          <div style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20 }}>
            {athlete.stats.slice(0,2).map((s,i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div className="bebas" style={{ fontSize: 22, letterSpacing: 2, color: "#C9A84C" }}>{s.v}</div>
                <div className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#3a3a3a" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className="twin-chat" style={{ flex: 1, overflowY: "auto", padding: "36px 40px" }}>
            {messages.length === 0 && !loading && !error && (
              <div className="twin-empty" style={{ textAlign: "center", paddingTop: 80 }}>
                <div className="cormorant" style={{ fontStyle: "italic", fontSize: 22, color: "rgba(240,235,227,0.18)", marginBottom: 12 }}>
                  {mode === "narrator" ? "Preparing the story..." : "Ask anything."}
                </div>
                {mode === "qa" && (
                  <>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: 2, color: "#2a2a2a", marginBottom: 22 }}>THE TWIN RESPONDS ONLY WITH VERIFIED FACTS.</div>
                    <div className="twin-prompt-row" style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                      {prompts.map((p) => (
                        <button key={p} className="proof-btn mono" onClick={() => sendQA(p)} style={{ fontSize: 9, letterSpacing: 1, padding: "9px 12px", color: "#C9A84C", background: "transparent", border: "1px solid rgba(201,168,76,0.22)", cursor: "pointer" }}>{p}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 30, animation: "fadeUp 0.5s ease" }}>
                {msg.role === "user" ? (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div className="twin-message-user" style={{ maxWidth: "58%", padding: "14px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2 }}>
                      <div style={{ fontSize: 14, color: "rgba(240,235,227,0.65)", lineHeight: 1.65 }}>{msg.content}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.42)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(201,168,76,0.05)" }}>
                      <span className="bebas" style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 1 }}>{athlete.initials}</span>
                    </div>
                    <div style={{ flex: 1, paddingTop: 2 }}>
                      <div className="cormorant" style={{ fontStyle: "italic", fontSize: 19, color: "#F0EBE3", lineHeight: 1.75 }}>{msg.content}</div>
                      <div className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#2e2e2e", marginTop: 10 }}>✓ BASED ON VERIFIED RICON RECORD · SOURCES USED: {athlete.moments.length}</div>
                      <VoiceSynthesisPanel
                        active={speakingIndex === i || speakingIndex === "latest"}
                        status={voiceStatus}
                        onPlay={() => showVoice(i)}
                        onStop={stopVoiceVisual}
                        mode={mode}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start", animation: "fadeIn 0.3s ease" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.42)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(201,168,76,0.05)" }}>
                  <span className="bebas" style={{ fontSize: 11, color: "#C9A84C" }}>{athlete.initials}</span>
                </div>
                <div style={{ display: "flex", gap: 7, alignItems: "center", paddingTop: 10 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#C9A84C", animation: `dot 1.4s ease-in-out ${i*0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mono" style={{ padding: "14px 18px", background: "rgba(255,70,70,0.07)", border: "1px solid rgba(255,70,70,0.2)", color: "rgba(255,150,150,0.8)", fontSize: 10, borderRadius: 2 }}>{error}</div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input / Controls */}
          {mode === "qa" ? (
            <div className="twin-input-bar" style={{ padding: "18px 36px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="mono" style={{ fontSize: 8, color: isListening ? "#7BC8E8" : "#555", letterSpacing: 2, marginBottom: 10 }}>
                {isListening ? "MICROPHONE ACTIVE · SPEAK YOUR QUESTION" : voiceStatus}
              </div>
              <div className="twin-input-row" style={{ display: "flex", gap: 10 }}>
                <button onClick={isListening ? () => recognitionRef.current?.stop?.() : startVoiceInput} disabled={loading}
                  style={{ fontFamily: '"Space Mono"', fontSize: 10, letterSpacing: 2, padding: "13px 16px", background: isListening ? "rgba(123,200,232,0.16)" : "transparent", color: isListening ? "#7BC8E8" : "#C9A84C", border: "1px solid rgba(201,168,76,0.28)", borderRadius: 2, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                  {isListening ? "STOP MIC" : "ASK BY VOICE"}
                </button>
                <input className="twin-input" aria-label={`Ask ${athlete.name} a question`} autoComplete="off" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendQA())}
                placeholder={`Ask ${athlete.name.split(" ")[0]} anything...`}
                disabled={loading}
                style={{ flex: 1, background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)", color: "#F0EBE3", padding: "13px 18px", fontFamily: '"DM Sans"', fontSize: 14, borderRadius: 2, transition: "border-color 0.2s" }} />
                <button onClick={() => sendQA()} disabled={loading || !input.trim()}
                style={{ fontFamily: '"Space Mono"', fontSize: 10, letterSpacing: 2, padding: "13px 22px", background: loading || !input.trim() ? "#161616" : "#C9A84C", color: loading || !input.trim() ? "#3a3a3a" : "#080808", border: "none", borderRadius: 2, cursor: loading || !input.trim() ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                  SEND →
                </button>
              </div>
            </div>
          ) : (
            messages.length > 0 && !loading && (
              <div style={{ padding: "20px 36px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <div className="voice-panel" style={{ flexBasis: "100%", maxWidth: 540 }}>
                  <div>
                    <div className="mono" style={{ fontSize: 8, color: "#7BC8E8", letterSpacing: 2, marginBottom: 5 }}>VOICE VISUALIZATION</div>
                    <div className="mono" style={{ fontSize: 8, color: "#555", letterSpacing: 1 }}>{voiceStatus}</div>
                  </div>
                  <div className="voice-bars" aria-hidden="true">{[0,1,2,3,4].map(i => <span key={i} style={{ animationPlayState: speakingIndex !== null ? "running" : "paused" }} />)}</div>
                  <button className="proof-btn mono" onClick={speakingIndex !== null ? stopVoiceVisual : () => showVoice("latest")}
                    style={{ fontSize: 8, letterSpacing: 2, padding: "8px 10px", color: "#C9A84C", background: "transparent", border: "1px solid rgba(201,168,76,0.25)", cursor: "pointer" }}>
                    {speakingIndex !== null ? "STOP VISUAL" : "SHOW VOICE"}
                  </button>
                </div>
                <button className="twin-btn" onClick={continueNarrator}
                  style={{ fontFamily: '"Space Mono"', fontSize: 9, letterSpacing: 2, padding: "11px 22px", background: "transparent", color: "#7BC8E8", border: "1px solid rgba(123,200,232,0.3)", cursor: "pointer", borderRadius: 2, transition: "all 0.25s" }}>
                  ▶ CONTINUE THE STORY
                </button>
                <button className="twin-btn" onClick={() => switchMode("qa")}
                  style={{ fontFamily: '"Space Mono"', fontSize: 9, letterSpacing: 2, padding: "11px 22px", background: "transparent", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)", cursor: "pointer", borderRadius: 2, transition: "all 0.25s" }}>
                  ✦ SWITCH TO Q&A
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
