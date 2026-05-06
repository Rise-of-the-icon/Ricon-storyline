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
  .ricon-root { background:#080808; min-height:100vh; color:#F0EBE3; font-family:"DM Sans",sans-serif; overflow-x:hidden; }
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
`;

export default CSS;
