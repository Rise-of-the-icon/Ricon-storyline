const CSS = `
  :root {
    color-scheme: dark;
    --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    --background: #0a0b10;
    --foreground: #e6edf7;
    --card-foreground: #f8fafc;
    --surface: #121621;
    --surface-strong: #161d2b;
    --card: #1a2233;
    --popover: #111827;
    --muted: #1f2937;
    --muted-foreground: #aeb9c8;
    --border: rgba(199, 208, 221, 0.14);
    --primary: #7c6cff;
    --primary-foreground: #f8fafc;
    --accent: #60a5fa;
    --accent-foreground: #0a0b10;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #f04438;
    --premium: #c9a54d;
    --input: rgba(255, 255, 255, 0.06);
    --ring: #60a5fa;
    --radius-xs: 6px;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    --shadow-soft: 0 8px 24px rgba(0, 0, 0, 0.18);
    --shadow-medium: 0 12px 32px rgba(0, 0, 0, 0.22);
    --shadow-large: 0 20px 60px rgba(0, 0, 0, 0.24);
    --motion-fast: 160ms;
    --motion-standard: 220ms;
    --motion-emphasis: 320ms;
    --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; border-color: var(--border); }
  html { scroll-behavior: smooth; background: var(--background); }
  body { margin: 0; background: var(--background); color: var(--foreground); font-family: var(--font-sans); }
  button, input, textarea { font: inherit; }
  button { cursor: pointer; }
  ::selection { background: color-mix(in srgb, var(--primary) 35%, transparent); }
  ::-webkit-scrollbar { width: 14px; }
  ::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
  ::-webkit-scrollbar-thumb { border: 3px solid transparent; border-radius: 999px; background-clip: padding-box; background-color: rgba(174, 185, 200, 0.7); }
  :focus-visible { outline: 3px solid var(--ring); outline-offset: 2px; box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.35); }

  @keyframes pageEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes ringA { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.06); opacity: 0.45; } }
  @keyframes ringB { 0%,100% { transform: scale(1); opacity: 0.38; } 50% { transform: scale(1.14); opacity: 0.14; } }
  @keyframes dot { 0%,60%,100% { transform: scale(1); opacity: 1; } 30% { transform: scale(1.45); opacity: 0.42; } }
  @keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.78; } 50% { transform: scale(1.35); opacity: 0.42; } }
  @keyframes premiumGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(201, 165, 77, 0); } 50% { box-shadow: 0 0 28px 6px rgba(201, 165, 77, 0.18); } }

  .ricon-root { min-height: 100vh; overflow-x: hidden; background: radial-gradient(circle at 15% 0%, rgba(124, 108, 255, 0.18), transparent 34%), radial-gradient(circle at 88% 12%, rgba(96, 165, 250, 0.16), transparent 30%), var(--background); color: var(--foreground); font-family: var(--font-sans); }
  .bebas, .cormorant, .mono { font-family: var(--font-sans); }
  .mono { font-family: var(--font-mono); }
  .premium-text { color: var(--premium); }
  .brand-gradient-text { background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 58%, var(--premium) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .animate-page-enter { animation: pageEnter 240ms var(--ease-out); }
  .cta-glow { animation: premiumGlow 3s ease-in-out infinite; }
  .ring-a { animation: ringA 2.4s ease-in-out infinite; }
  .ring-b { animation: ringB 3s ease-in-out infinite; }

  .app-nav { min-height: 76px; padding: 20px 40px; display: flex; align-items: center; gap: 14px; border-bottom: 1px solid var(--border); background: color-mix(in srgb, var(--background) 84%, transparent); backdrop-filter: blur(24px); }
  .app-nav.sticky { position: sticky; top: 0; z-index: 90; }
  .brand-mark { font-size: 0.9rem; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; color: var(--card-foreground); }
  .brand-submark { font-size: 0.85rem; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted-foreground); }
  .nav-divider { width: 1px; height: 20px; background: var(--border); }
  .nav-spacer { flex: 1; }
  .status-pill, .eyebrow-pill, .type-pill { display: inline-flex; align-items: center; min-height: 2rem; border: 1px solid var(--border); border-radius: 999px; padding: 0.35rem 0.75rem; font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted-foreground); background: color-mix(in srgb, var(--card) 72%, transparent); }
  .status-pill { color: var(--premium); }

  .hero { padding: 76px 40px 56px; text-align: center; }
  .landing-hero { position: relative; overflow: hidden; border-bottom: 1px solid var(--border); }
  .landing-hero::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0.55; transition: opacity var(--motion-emphasis); }
  .landing-hero-sports::before { background: radial-gradient(ellipse at 50% 100%, rgba(201, 165, 77, 0.14), transparent 62%); }
  .landing-hero-music::before { background: radial-gradient(ellipse at 50% 100%, rgba(96, 165, 250, 0.16), transparent 62%); }
  .landing-hero > * { position: relative; z-index: 1; }
  .hero-kicker, .section-kicker { color: var(--accent); font-size: 0.78rem; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; }
  .hero-kicker { margin-bottom: 22px; }
  .hero-rotator-label { min-height: 1rem; margin-bottom: 12px; color: var(--premium); font-family: var(--font-mono); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; }
  .hero-title { display: block; margin-bottom: 20px; color: #EEF2F7; font-size: clamp(4rem, 12vw, 8.5rem); font-weight: 900; line-height: 0.92; letter-spacing: 0; }
  .hero-rotator-title { min-height: clamp(4rem, 12vw, 8.5rem); display: flex; align-items: center; justify-content: center; transition: opacity var(--motion-emphasis), transform var(--motion-emphasis); }
  .hero-rotator-title.is-hidden { opacity: 0; transform: translateY(10px); }
  .hero-rotator-title.is-visible { opacity: 1; transform: translateY(0); }
  .hero-copy { color: var(--muted-foreground); font-size: 1.05rem; line-height: 1.7; }
  .hero-actions { margin-top: 32px; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
  .music-action { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 42%, var(--border)); background: color-mix(in srgb, var(--accent) 8%, transparent); }
  .section-rule { margin: 0 40px 40px; height: 1px; background: linear-gradient(to right, transparent, var(--border), transparent); }
  .category-nav { position: sticky; top: 0; z-index: 80; border-bottom: 1px solid var(--border); background: color-mix(in srgb, var(--background) 88%, transparent); backdrop-filter: blur(24px); }
  .category-nav-inner { min-height: 58px; padding: 0 40px; display: flex; align-items: stretch; gap: 14px; overflow-x: auto; }
  .filter-group { display: flex; align-items: center; gap: 4px; padding-left: 14px; border-left: 1px solid var(--border); flex-shrink: 0; }
  .filter-group-label { padding-right: 8px; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.66rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.62; }
  .filter-tab { min-height: 58px; padding: 0 12px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.72rem; font-weight: 850; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; transition: color var(--motion-fast), border-color var(--motion-fast), background var(--motion-fast); }
  .filter-tab:hover { color: var(--card-foreground); background: rgba(255, 255, 255, 0.025); }
  .filter-tab.active, .filter-sports.active { color: var(--premium); border-bottom-color: var(--premium); }
  .filter-music.active { color: var(--accent); border-bottom-color: var(--accent); }
  .featured-section, .browse-section { padding: 48px 32px 0; }
  .featured-section .section-kicker { margin: 0 8px 18px; }
  .featured-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
  .featured-card { min-height: 220px; padding: 26px; display: flex; flex-direction: column; justify-content: space-between; gap: 28px; text-align: left; border: 1px solid var(--border); border-radius: var(--radius-md); background: color-mix(in srgb, var(--card) 84%, transparent); color: var(--foreground); box-shadow: var(--shadow-soft); transition: transform var(--motion-standard) var(--ease-out), border-color var(--motion-standard), box-shadow var(--motion-standard); }
  .featured-card:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--premium) 44%, var(--border)); box-shadow: var(--shadow-medium); }
  .featured-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .featured-enter { color: var(--accent); font-family: var(--font-mono); font-size: 0.68rem; font-weight: 850; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0; transform: translateX(8px); transition: opacity var(--motion-standard), transform var(--motion-standard); }
  .featured-card:hover .featured-enter { opacity: 1; transform: translateX(0); }
  .featured-title { margin-bottom: 10px; color: var(--card-foreground); font-size: clamp(1.6rem, 3vw, 2.25rem); font-weight: 900; line-height: 1.05; }
  .featured-copy { margin-bottom: 12px; color: var(--muted-foreground); font-size: 0.95rem; line-height: 1.6; }
  .featured-meta, .browse-count, .nav-context { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.7rem; font-weight: 750; letter-spacing: 0.08em; text-transform: uppercase; }
  .browse-section { padding-bottom: 80px; }
  .browse-heading { display: flex; align-items: baseline; gap: 14px; margin: 0 8px 24px; flex-wrap: wrap; }
  .eyebrow-music { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 42%, var(--border)); background: color-mix(in srgb, var(--accent) 10%, transparent); }
  .eyebrow-sports { color: var(--premium); border-color: color-mix(in srgb, var(--premium) 42%, var(--border)); background: color-mix(in srgb, var(--premium) 10%, transparent); }
  .music-card-root:hover { border-color: color-mix(in srgb, var(--accent) 48%, var(--border)); }
  .music-card-root .card-initials { color: var(--accent); }
  .athlete-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; padding: 0 32px 80px; }
  .app-footer { padding: 28px 40px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; gap: 18px; flex-wrap: wrap; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; }

  .card-root { cursor: pointer; position: relative; overflow: hidden; min-height: 250px; display: flex; flex-direction: column; justify-content: flex-end; padding: 28px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: linear-gradient(180deg, color-mix(in srgb, var(--card) 92%, var(--primary) 8%), var(--card)); color: var(--foreground); text-align: left; box-shadow: var(--shadow-soft); transition: transform var(--motion-standard) var(--ease-out), border-color var(--motion-standard), box-shadow var(--motion-standard), background var(--motion-standard); }
  .card-root:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--primary) 48%, var(--border)); box-shadow: var(--shadow-medium); }
  .card-root:hover .card-tagline { color: var(--card-foreground); }
  .card-root:hover .card-explore { opacity: 1; transform: translateY(0); }
  .card-root:hover .card-initials { opacity: 0.08; }
  .card-root:hover .card-headshot-wrap { transform: translateY(-2px) scale(1.03); border-color: color-mix(in srgb, var(--premium) 52%, var(--border)); }
  .card-initials { position: absolute; top: -10px; right: -4px; font-size: 7rem; font-weight: 900; letter-spacing: 0; color: var(--primary); opacity: 0.05; line-height: 1; user-select: none; transition: opacity var(--motion-standard); }
  .card-headshot-wrap { position: absolute; top: 26px; right: 26px; z-index: 1; width: 76px; height: 76px; overflow: hidden; border: 1px solid color-mix(in srgb, var(--premium) 34%, var(--border)); border-radius: 999px; background: radial-gradient(circle, color-mix(in srgb, var(--premium) 18%, var(--surface)), var(--card)); box-shadow: 0 14px 36px rgba(0, 0, 0, 0.28), 0 0 0 7px rgba(201, 165, 77, 0.04); transition: transform var(--motion-standard) var(--ease-out), border-color var(--motion-standard); }
  .card-headshot { width: 100%; height: 100%; object-fit: cover; object-position: center top; filter: saturate(0.96) contrast(1.08); }
  .card-top, .card-title, .card-tagline, .card-explore { position: relative; z-index: 2; }
  .card-top { margin-bottom: auto; padding-right: 82px; }
  .card-title { margin-top: 44px; margin-bottom: 10px; color: var(--card-foreground); font-size: clamp(1.55rem, 3.3vw, 2.25rem); font-weight: 850; line-height: 1.08; letter-spacing: 0; }
  .card-tagline { max-width: 78%; color: var(--muted-foreground); font-size: 0.92rem; line-height: 1.6; margin-bottom: 18px; transition: color var(--motion-standard); }
  .card-explore { display: flex; align-items: center; gap: 8px; color: var(--accent); font-family: var(--font-mono); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0; transform: translateY(8px); transition: all var(--motion-standard); }

  .ghost-button, .primary-button, .secondary-button, .close-button, .mode-button { border-radius: var(--radius-sm); border: 1px solid var(--border); min-height: 2.5rem; padding: 0.7rem 1rem; font-family: var(--font-mono); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; transition: background var(--motion-fast), color var(--motion-fast), border-color var(--motion-fast), opacity var(--motion-fast); }
  .ghost-button { background: transparent; color: var(--muted-foreground); }
  .ghost-button:hover, .secondary-button:hover, .close-button:hover { border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); color: var(--card-foreground); background: color-mix(in srgb, var(--accent) 12%, transparent); }
  .primary-button { border-color: transparent; background: linear-gradient(135deg, var(--primary), var(--accent)); color: var(--primary-foreground); }
  .primary-button:disabled { cursor: not-allowed; opacity: 0.45; background: var(--muted); color: var(--muted-foreground); }
  .secondary-button { background: transparent; color: var(--accent); }
  .premium-button { background: linear-gradient(135deg, var(--premium), #f0c86b); color: var(--background); }

  .athlete-hero { position: relative; overflow: hidden; padding: 72px 40px 48px; }
  .athlete-hero::after { content: ""; position: absolute; inset: 0; z-index: 2; pointer-events: none; background: linear-gradient(90deg, rgba(8, 10, 16, 0) 0%, rgba(8, 10, 16, 0) 46%, rgba(8, 10, 16, 0.36) 70%, rgba(8, 10, 16, 0.78) 100%), linear-gradient(0deg, rgba(8, 10, 16, 0.72) 0%, rgba(8, 10, 16, 0) 34%); }
  .athlete-watermark { position: absolute; z-index: 1; bottom: -52px; right: 12px; color: var(--primary); opacity: 0.05; font-size: clamp(9rem, 24vw, 18rem); font-weight: 900; line-height: 1; user-select: none; pointer-events: none; }
  .athlete-portrait-wrap { position: absolute; z-index: 1; right: clamp(28px, 7vw, 120px); bottom: 8px; width: min(28vw, 360px); height: min(34vw, 430px); display: flex; align-items: flex-end; justify-content: center; opacity: 0.58; pointer-events: none; }
  .athlete-portrait-wrap.headshot-fallback { right: clamp(42px, 9vw, 150px); bottom: 42px; width: min(20vw, 270px); height: min(22vw, 300px); opacity: 0.46; }
  .athlete-portrait-wrap::after { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 42%, transparent 32%, rgba(8, 10, 16, 0.22) 64%, rgba(8, 10, 16, 0.9) 100%), linear-gradient(to bottom, rgba(8, 10, 16, 0.08), rgba(8, 10, 16, 0.72)); }
  .athlete-portrait-wrap.headshot-fallback::after { background: radial-gradient(ellipse at 50% 45%, transparent 24%, rgba(8, 10, 16, 0.34) 62%, rgba(8, 10, 16, 0.92) 100%); }
  .athlete-portrait { width: 100%; height: 100%; object-fit: contain; object-position: center bottom; filter: saturate(0.82) contrast(1.06) brightness(0.92); }
  .athlete-meta, .athlete-name, .athlete-tagline, .stats-grid { position: relative; z-index: 3; }
  .athlete-meta { margin-bottom: 18px; color: var(--accent); font-size: 0.78rem; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; }
  .athlete-name { margin-bottom: 22px; max-width: 980px; color: #f8fafc; font-size: clamp(3.4rem, 8vw, 6.75rem); font-weight: 900; line-height: 0.95; letter-spacing: 0; }
  .athlete-tagline { max-width: 640px; color: var(--muted-foreground); font-size: 1.15rem; line-height: 1.7; }
  .stats-grid { display: flex; gap: 16px; margin-top: 44px; flex-wrap: wrap; }
  .stat-card { flex: 1 1 130px; padding: 18px 20px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-soft); }
  .stat-value { color: var(--premium); font-size: 1.85rem; font-weight: 900; line-height: 1; }
  .stat-label { margin-top: 8px; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .twin-banner { margin: 0 40px; padding: 22px 24px; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 14%, var(--surface)), color-mix(in srgb, var(--accent) 10%, var(--surface))); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-soft); }
  .twin-banner-title { margin-bottom: 6px; color: var(--card-foreground); font-size: 1rem; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
  .twin-banner-copy { max-width: 560px; color: var(--muted-foreground); font-size: 0.92rem; line-height: 1.65; }
  .twin-banner-locked { border-color: color-mix(in srgb, var(--premium) 28%, var(--border)); background: linear-gradient(135deg, color-mix(in srgb, var(--premium) 8%, var(--surface)), color-mix(in srgb, var(--primary) 10%, var(--surface))); }
  .button-row { display: flex; gap: 10px; flex-wrap: wrap; }
  .timeline-section { padding: 72px 40px 80px; }
  .timeline-wrap { position: relative; }
  .timeline-line { position: absolute; left: 114px; top: 0; bottom: 0; width: 1px; background: linear-gradient(to bottom, transparent, var(--border) 8%, var(--border) 92%, transparent); }
  .closing-cta { padding: 52px 40px; border-top: 1px solid var(--border); text-align: center; }
  .closing-copy { margin-bottom: 24px; color: var(--muted-foreground); font-size: 1.05rem; }

  .moment-item { transition: opacity 0.7s var(--ease-out), transform 0.7s var(--ease-out); }
  .moment-item[data-visible="true"] { opacity: 1; transform: translateY(0); }
  .moment-item[data-visible="false"], .moment-item:not([data-visible]) { opacity: 0; transform: translateY(20px); }
  .moment-row { display: flex; margin-bottom: 54px; }
  .moment-date { width: 96px; flex-shrink: 0; padding-top: 3px; }
  .moment-year { color: var(--premium); font-family: var(--font-mono); font-size: 0.9rem; font-weight: 800; }
  .moment-era { margin-top: 5px; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.68rem; line-height: 1.5; letter-spacing: 0.06em; text-transform: uppercase; }
  .moment-marker-col { width: 36px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
  .moment-marker { width: 10px; height: 10px; border-radius: 999px; background: var(--moment-color, var(--accent)); box-shadow: 0 0 14px color-mix(in srgb, var(--moment-color, var(--accent)) 70%, transparent); margin-top: 5px; flex-shrink: 0; }
  .moment-body { flex: 1; padding-left: 18px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
  .moment-body.last { border-bottom: none; }
  .type-pill { margin-bottom: 12px; color: var(--moment-color, var(--accent)); border-color: color-mix(in srgb, var(--moment-color, var(--accent)) 44%, var(--border)); background: color-mix(in srgb, var(--moment-color, var(--accent)) 10%, transparent); }
  .moment-title { margin-bottom: 12px; color: var(--card-foreground); font-size: 1.45rem; font-weight: 850; line-height: 1.25; }
  .moment-copy { max-width: 720px; margin-bottom: 14px; color: var(--foreground); font-size: 1rem; line-height: 1.75; }
  .source-row { display: flex; align-items: center; gap: 8px; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.04em; text-transform: uppercase; }
  .source-rule { width: 8px; height: 1px; background: var(--border); }
  .timeline-media-row { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 18px; }
  .timeline-media-row .video-card { width: min(236px, calc(50% - 7px)); }

  .modal-root { position: fixed; inset: 0; z-index: 1000; display: flex; flex-direction: column; background: color-mix(in srgb, var(--background) 96%, transparent); backdrop-filter: blur(24px); animation: fadeIn var(--motion-emphasis) var(--ease-out); }
  .modal-header { padding: 20px 36px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 20px; flex-shrink: 0; }
  .modal-status { margin-bottom: 4px; color: var(--accent); font-family: var(--font-mono); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
  .modal-title { color: var(--card-foreground); font-size: 1.55rem; font-weight: 900; }
  .mode-toggle { display: flex; gap: 4px; background: var(--surface); padding: 4px; border: 1px solid var(--border); border-radius: var(--radius-md); }
  .mode-button { min-height: 2.2rem; border: 0; background: transparent; color: var(--muted-foreground); }
  .mode-btn-active { background: var(--primary) !important; color: var(--primary-foreground) !important; }
  .close-button { background: transparent; color: var(--muted-foreground); }
  .modal-layout { flex: 1; display: flex; overflow: hidden; }
  .twin-rail { width: 240px; flex-shrink: 0; border-right: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 36px 18px; gap: 22px; background: color-mix(in srgb, var(--surface) 45%, transparent); }
  .avatar-wrap { position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; }
  .avatar-ring { position: absolute; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--premium) 42%, transparent); }
  .avatar-ring.outer { inset: -22px; }
  .avatar-ring.mid { inset: -8px; }
  .avatar-ring.inner { inset: 0; border-width: 2px; }
  .avatar-core { position: relative; width: 120px; height: 120px; overflow: hidden; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, color-mix(in srgb, var(--premium) 18%, var(--card)), var(--surface)); box-shadow: 0 0 18px rgba(201, 165, 77, 0.16); transition: box-shadow var(--motion-emphasis); }
  .avatar-core.loading { box-shadow: 0 0 38px rgba(201, 165, 77, 0.42); }
  .avatar-headshot { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; filter: saturate(0.95) contrast(1.08); }
  .avatar-headshot + .avatar-initials { opacity: 0; }
  .avatar-initials { position: relative; z-index: 1; color: var(--premium); font-size: 2rem; font-weight: 900; letter-spacing: 0.05em; }
  .twin-state { text-align: center; }
  .twin-state-label { margin-bottom: 6px; color: var(--premium); font-family: var(--font-mono); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .twin-state-label.loading { color: var(--accent); }
  .twin-version { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.06em; text-transform: uppercase; }
  .rail-stats { width: 100%; border-top: 1px solid var(--border); padding-top: 20px; }
  .rail-stat { margin-bottom: 14px; }
  .modal-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .chat-session-bar { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 14px 40px; border-bottom: 1px solid color-mix(in srgb, var(--premium) 22%, var(--border)); background: color-mix(in srgb, var(--surface) 88%, var(--premium) 4%); flex-shrink: 0; }
  .chat-session-copy { min-width: 0; }
  .chat-session-kicker { margin-bottom: 6px; color: var(--premium); font-family: var(--font-mono); font-size: 0.64rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
  .chat-session-title { color: var(--card-foreground); font-size: 0.92rem; font-weight: 850; line-height: 1.4; }
  .chat-session-meta { margin: 6px 0 0; color: var(--muted-foreground); font-size: 0.82rem; line-height: 1.55; max-width: 56ch; }
  .chat-session-actions { display: flex; flex-wrap: wrap; gap: 10px; flex-shrink: 0; }
  .chat-session-end-button { min-height: 40px; white-space: nowrap; }
  .chat-session-recap { align-items: flex-start; flex-direction: column; padding: 20px 40px; background: linear-gradient(180deg, color-mix(in srgb, var(--premium) 8%, var(--surface)), color-mix(in srgb, var(--surface) 92%, transparent)); }
  .chat-session-stats { display: flex; flex-wrap: wrap; gap: 18px; margin: 14px 0 12px; }
  .chat-session-stat { min-width: 120px; padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: color-mix(in srgb, var(--card) 90%, transparent); }
  .chat-session-stat-value { display: block; color: var(--card-foreground); font-size: 1.35rem; font-weight: 900; line-height: 1; }
  .chat-session-stat-label { display: block; margin-top: 6px; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.62rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .chat-session-sources { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; color: var(--muted-foreground); font-size: 0.84rem; line-height: 1.5; }
  .chat-session-sources li { padding-left: 0; }
  .chat-session-exhausted { align-items: flex-start; flex-direction: column; border-bottom-color: color-mix(in srgb, var(--danger) 24%, var(--border)); background: color-mix(in srgb, var(--danger) 8%, var(--surface)); }
  .chat-session-exhausted .chat-session-title { color: #fca5a5; }
  .composer-disabled-note { padding: 18px 40px; border-top: 1px solid var(--border); color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.06em; text-transform: uppercase; text-align: center; background: color-mix(in srgb, var(--surface) 90%, transparent); }
  .messages { flex: 1; overflow-y: auto; padding: 36px 40px; }
  .empty-state { text-align: center; padding-top: 80px; }
  .empty-title { margin-bottom: 12px; color: var(--muted-foreground); font-size: 1.25rem; }
  .empty-meta { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; }
  .qa-empty-state { min-height: 44vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .live-dot { width: 8px; height: 8px; border-radius: 999px; background: var(--premium); opacity: 0.78; }
  .live-dot.active { background: var(--accent); box-shadow: 0 0 18px rgba(96, 165, 250, 0.68); animation: pulse 1.1s ease-in-out infinite; }
  .voice-prompts { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; transform: translateY(-2vh); }
  .voice-prompts.compact { flex: 0; margin-top: 24px; transform: none; gap: 12px; }
  .voice-prompts-title { margin-bottom: 2px; color: var(--muted-foreground); font-size: clamp(1.55rem, 2.5vw, 2.45rem); font-weight: 900; }
  .voice-chip { min-height: 54px; padding: 0 28px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--border) 72%, white); background: color-mix(in srgb, var(--surface) 86%, white 5%); color: var(--card-foreground); display: inline-flex; align-items: center; gap: 18px; font-size: clamp(1.1rem, 1.8vw, 1.7rem); font-weight: 850; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05); }
  .voice-chip span { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 1.1em; }
  .voice-prompts.compact .voice-chip { min-height: 44px; padding: 0 20px; font-size: 0.95rem; }
  .voice-status-card { width: fit-content; max-width: 100%; margin: 0 auto 22px; display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid color-mix(in srgb, var(--accent) 32%, var(--border)); border-radius: 999px; background: color-mix(in srgb, var(--surface) 84%, var(--accent) 6%); color: var(--card-foreground); font-family: var(--font-mono); font-size: 0.72rem; font-weight: 850; letter-spacing: 0.08em; text-transform: uppercase; }
  .message { margin-bottom: 30px; animation: fadeUp var(--motion-emphasis) var(--ease-out); }
  .user-message { display: flex; justify-content: flex-end; }
  .user-bubble { max-width: min(58%, 680px); padding: 14px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--foreground); line-height: 1.65; }
  .assistant-message { display: flex; gap: 18px; align-items: flex-start; }
  .assistant-message.narrator-active .assistant-text { color: var(--card-foreground); }
  .assistant-avatar { width: 34px; height: 34px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--premium) 42%, var(--border)); display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: color-mix(in srgb, var(--premium) 8%, transparent); color: var(--premium); font-size: 0.7rem; font-weight: 900; }
  .assistant-copy { flex: 1; padding-top: 2px; }
  .assistant-text { color: var(--card-foreground); font-size: 1.05rem; line-height: 1.75; min-height: 1.75rem; }
  .assistant-text.is-streaming::after { content: "▍"; display: inline-block; margin-left: 2px; color: var(--accent); animation: streamCursor 0.9s step-end infinite; }
  @keyframes streamCursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  .stream-thinking-label { margin-bottom: 8px; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .twin-textarea { min-height: 52px; max-height: 140px; resize: vertical; line-height: 1.45; padding-top: 14px; padding-bottom: 14px; }
  .voice-dock .twin-textarea { border-radius: var(--radius-md); }
  .verified-meta { margin-top: 10px; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; }
  .source-attribution { margin-top: 14px; padding-top: 12px; border-top: 1px solid color-mix(in srgb, var(--border) 72%, transparent); }
  .source-attribution-header { margin-bottom: 8px; }
  .source-attribution-badge { display: inline-flex; align-items: center; gap: 4px; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.64rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
  .source-attribution-badge.is-pending { color: color-mix(in srgb, var(--accent) 80%, var(--muted-foreground)); }
  .source-chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
  .source-chip { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 5px 10px; border: 1px solid color-mix(in srgb, var(--premium) 28%, var(--border)); border-radius: 999px; background: color-mix(in srgb, var(--premium) 6%, var(--surface)); color: var(--card-foreground); font-size: 0.72rem; line-height: 1.3; }
  .source-chip-year { color: var(--premium); font-family: var(--font-mono); font-size: 0.62rem; font-weight: 800; letter-spacing: 0.06em; }
  .source-chip-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 28ch; }
  .source-details { margin-top: 2px; }
  .source-details-toggle { cursor: pointer; color: var(--accent); font-family: var(--font-mono); font-size: 0.62rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; list-style: none; user-select: none; }
  .source-details-toggle::-webkit-details-marker { display: none; }
  .source-details-toggle::before { content: "▸ "; color: var(--premium); }
  .source-details[open] .source-details-toggle::before { content: "▾ "; }
  .source-details-list { margin: 10px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; }
  .source-details-item { padding: 10px 12px; border: 1px solid color-mix(in srgb, var(--border) 80%, transparent); border-radius: var(--radius-sm); background: color-mix(in srgb, var(--surface) 92%, transparent); }
  .source-details-title { color: var(--card-foreground); font-size: 0.82rem; font-weight: 800; line-height: 1.35; }
  .source-details-meta { margin-top: 4px; color: var(--premium); font-family: var(--font-mono); font-size: 0.6rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .source-details-citation { margin-top: 6px; color: var(--muted-foreground); font-size: 0.76rem; line-height: 1.45; }
  .source-unavailable { margin: 0; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.62rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; line-height: 1.5; }
  .narrator-beat { position: relative; margin-bottom: 38px; }
  .narrator-beat::before { content: ""; position: absolute; left: 24px; top: 56px; bottom: -26px; width: 1px; background: linear-gradient(to bottom, color-mix(in srgb, var(--premium) 42%, transparent), transparent); z-index: 0; }
  .narrator-beat:last-of-type::before { display: none; }
  .narrator-marker { position: relative; z-index: 1; width: 50px; min-width: 50px; height: 50px; border: 1px solid color-mix(in srgb, var(--premium) 44%, var(--border)); border-radius: 999px; background: var(--background); color: var(--premium); font-family: var(--font-mono); font-size: 0.68rem; font-weight: 900; box-shadow: 0 0 0 7px var(--background), 0 0 20px rgba(201, 165, 77, 0.08); }
  .narrator-active .narrator-marker { background: color-mix(in srgb, var(--premium) 12%, var(--surface)); box-shadow: 0 0 28px rgba(201, 165, 77, 0.24); }
  .narrator-marker span { display: block; transform: translateY(1px); }
  .narrator-chapter { display: inline-flex; align-items: center; gap: 10px; min-height: auto; margin-bottom: 10px; padding: 0; border: 0; background: transparent; color: var(--card-foreground); font-size: 0.86rem; font-weight: 850; text-align: left; }
  .narrator-chapter span { color: var(--accent); font-family: var(--font-mono); font-size: 0.66rem; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
  .narrator-media-row { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 16px; }
  .video-card { width: min(236px, 100%); aspect-ratio: 16 / 9; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid color-mix(in srgb, var(--border) 72%, var(--premium)); border-radius: var(--radius-md); background: linear-gradient(135deg, rgba(245, 247, 252, 0.92), rgba(176, 183, 194, 0.88)); color: #12151d; box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22); }
  .video-card::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgba(8, 10, 16, 0.38), transparent 58%); }
  .video-play { position: relative; z-index: 1; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 999px; background: rgba(8, 10, 16, 0.24); color: rgba(8, 10, 16, 0.68); font-size: 1.35rem; }
  .video-copy { position: absolute; z-index: 1; left: 14px; right: 14px; bottom: 12px; display: flex; flex-direction: column; gap: 2px; color: white; font-size: 0.76rem; font-weight: 850; text-align: left; text-shadow: 0 1px 10px rgba(0, 0, 0, 0.45); }
  .video-copy small { color: rgba(255, 255, 255, 0.72); font-family: var(--font-mono); font-size: 0.58rem; letter-spacing: 0.06em; text-transform: uppercase; }
  .typing { display: flex; gap: 7px; align-items: center; padding-top: 10px; }
  .typing-dot { width: 7px; height: 7px; border-radius: 999px; background: var(--premium); animation: dot 1.4s ease-in-out infinite; }
  .error-box { padding: 14px 18px; background: color-mix(in srgb, var(--danger) 12%, transparent); border: 1px solid color-mix(in srgb, var(--danger) 30%, var(--border)); color: #fca5a5; font-family: var(--font-mono); font-size: 0.78rem; border-radius: var(--radius-md); }
  .modal-composer { padding: 20px 36px; border-top: 1px solid var(--border); display: flex; gap: 10px; }
  .voice-dock { align-items: center; gap: 12px; border-top: 0; background: linear-gradient(to top, rgba(8, 10, 16, 0.92), rgba(8, 10, 16, 0.54)); }
  .dock-icon-button, .dock-close-button { width: 52px; min-width: 52px; height: 52px; padding: 0; border-radius: 999px; border-color: color-mix(in srgb, var(--border) 70%, white); background: color-mix(in srgb, var(--surface) 86%, white 4%); color: var(--card-foreground); font-size: 1.9rem; font-weight: 350; }
  .dock-close-button { background: rgba(255, 255, 255, 0.94); color: #050609; font-size: 2.2rem; }
  .dock-input-wrap { flex: 1; min-width: 160px; }
  .send-icon-button { width: 52px; min-width: 52px; height: 52px; padding: 0; border-radius: 999px; border: 1px solid transparent; background: var(--primary); color: var(--primary-foreground); font-size: 1.35rem; font-weight: 900; line-height: 1; display: flex; align-items: center; justify-content: center; transition: opacity var(--motion-fast), background var(--motion-fast), transform var(--motion-fast); }
  .send-icon-button:hover:not(:disabled) { transform: translateY(-1px); background: color-mix(in srgb, var(--primary) 82%, var(--accent)); }
  .send-icon-button:disabled { cursor: not-allowed; opacity: 0.34; background: var(--muted); color: var(--muted-foreground); }
  .send-icon-button.stop-mode { background: rgba(255, 255, 255, 0.94); color: #050609; font-size: 2.2rem; font-weight: 650; }
  .send-icon-button.stop-mode:hover:not(:disabled) { background: #ffffff; }
  .voice-button { width: 52px; min-width: 52px; height: 52px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 999px; border-color: color-mix(in srgb, var(--accent) 32%, var(--border)); background: color-mix(in srgb, var(--surface) 86%, var(--accent) 8%); color: var(--card-foreground); }
  .voice-button.listening, .voice-button.thinking, .voice-button.speaking { background: var(--primary); color: var(--primary-foreground); box-shadow: 0 0 28px rgba(124, 108, 255, 0.38); }
  .voice-button > span:first-child { font-size: 1rem; line-height: 1; }
  .twin-input { width: 100%; flex: 1; background: var(--input); border: 1px solid var(--border); color: var(--foreground); padding: 13px 16px; border-radius: var(--radius-sm); transition: border-color var(--motion-fast), background var(--motion-fast); }
  .voice-dock .twin-input { height: 52px; border-radius: 999px; padding-left: 24px; font-size: 1rem; }
  .twin-input:focus { border-color: var(--ring); outline: none; background: color-mix(in srgb, var(--input) 80%, var(--accent) 8%); }
  .narrator-actions { justify-content: center; flex-wrap: wrap; }

  .auth-page { min-height: 100vh; display: flex; flex-direction: column; }
  .auth-back-link { text-decoration: none; display: inline-flex; align-items: center; }
  .auth-main { flex: 1; padding: 48px 40px 80px; }
  .auth-main-centered { display: flex; align-items: center; justify-content: center; }
  .auth-layout { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(320px, 420px); gap: 48px; align-items: start; }
  .auth-layout-wide { max-width: 1200px; grid-template-columns: minmax(280px, 360px) minmax(0, 1fr); }
  .auth-copy-panel { padding-top: 12px; }
  .auth-kicker { margin-bottom: 14px; color: var(--accent); font-size: 0.78rem; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; }
  .auth-title { margin-bottom: 22px; color: var(--card-foreground); font-size: clamp(2rem, 4vw, 3rem); font-weight: 900; line-height: 1.05; }
  .auth-lead { color: var(--muted-foreground); font-size: 1rem; line-height: 1.7; max-width: 36ch; }
  .auth-trust-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 12px; color: var(--muted-foreground); font-size: 0.98rem; line-height: 1.6; }
  .auth-trust-list li { position: relative; padding-left: 18px; }
  .auth-trust-list li::before { content: "✓"; position: absolute; left: 0; color: var(--premium); font-weight: 900; }
  .auth-card { padding: 32px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: color-mix(in srgb, var(--card) 88%, transparent); box-shadow: var(--shadow-medium); }
  .auth-card-title { margin-bottom: 10px; color: var(--card-foreground); font-size: 1.35rem; font-weight: 900; }
  .auth-card-copy { margin-bottom: 24px; color: var(--muted-foreground); font-size: 0.95rem; line-height: 1.65; }
  .auth-form { display: grid; gap: 18px; }
  .form-field { display: grid; gap: 8px; }
  .form-label { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
  .form-input { width: 100%; min-height: 48px; padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--input); color: var(--foreground); transition: border-color var(--motion-fast), box-shadow var(--motion-fast); }
  .form-input::placeholder { color: color-mix(in srgb, var(--muted-foreground) 72%, transparent); }
  .form-input:focus { border-color: var(--ring); outline: none; box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.22); }
  .form-input.has-error { border-color: color-mix(in srgb, var(--danger) 55%, var(--border)); }
  .form-error { color: #fca5a5; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.02em; }
  .form-banner-error { margin-bottom: 16px; padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid color-mix(in srgb, var(--danger) 30%, var(--border)); background: color-mix(in srgb, var(--danger) 12%, transparent); color: #fca5a5; font-size: 0.85rem; }
  .auth-submit { width: 100%; min-height: 48px; justify-content: center; display: inline-flex; align-items: center; text-decoration: none; }
  .auth-divider { margin: 22px 0 18px; display: flex; align-items: center; gap: 12px; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; }
  .auth-divider::before, .auth-divider::after { content: ""; flex: 1; height: 1px; background: var(--border); }
  .auth-social-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .social-button { min-height: 48px; display: inline-flex; align-items: center; justify-content: center; gap: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: color-mix(in srgb, var(--surface) 90%, white 4%); color: var(--card-foreground); font-family: var(--font-mono); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; transition: border-color var(--motion-fast), background var(--motion-fast); }
  .social-button:hover:not(:disabled) { border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); background: color-mix(in srgb, var(--accent) 10%, transparent); }
  .social-button:disabled { opacity: 0.5; cursor: not-allowed; }
  .social-button-apple { background: color-mix(in srgb, var(--surface-strong) 92%, black 8%); }
  .auth-footer-copy { margin-top: 22px; text-align: center; color: var(--muted-foreground); font-size: 0.92rem; }
  .auth-inline-link { color: var(--accent); font-weight: 700; text-decoration: none; }
  .auth-inline-link:hover { text-decoration: underline; }
  .flow-steps { list-style: none; margin: 0 0 28px; padding: 0; display: flex; gap: 10px; flex-wrap: wrap; }
  .flow-step { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 999px; background: color-mix(in srgb, var(--surface) 80%, transparent); color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.66rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .flow-step-index { width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: var(--muted); color: var(--muted-foreground); font-size: 0.62rem; }
  .flow-step.is-current { border-color: color-mix(in srgb, var(--premium) 50%, var(--border)); color: var(--card-foreground); box-shadow: 0 0 24px rgba(201, 165, 77, 0.12); }
  .flow-step.is-current .flow-step-index { background: linear-gradient(135deg, var(--premium), #f0c86b); color: var(--background); }
  .flow-step.is-complete { color: var(--card-foreground); }
  .flow-step.is-complete .flow-step-index { background: color-mix(in srgb, var(--success) 24%, var(--surface)); color: var(--success); }
  .select-twin-page { padding-bottom: 0; }
  .select-twin-main { flex: 1; padding: 40px 40px 120px; max-width: 1280px; margin: 0 auto; width: 100%; }
  .select-twin-header { margin-bottom: 32px; max-width: 720px; }
  .select-twin-body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 320px); gap: 28px; align-items: start; }
  .select-twin-grid-wrap { min-width: 0; }
  .select-twin-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-content: start; }
  .select-twin-card { position: relative; text-align: left; padding: 22px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: color-mix(in srgb, var(--card) 84%, transparent); color: var(--foreground); box-shadow: var(--shadow-soft); transition: transform var(--motion-standard) var(--ease-out), border-color var(--motion-standard), box-shadow var(--motion-standard); }
  .select-twin-card:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--premium) 44%, var(--border)); box-shadow: var(--shadow-medium); }
  .select-twin-card.is-selected { border-color: color-mix(in srgb, var(--premium) 62%, var(--border)); box-shadow: 0 0 0 1px color-mix(in srgb, var(--premium) 28%, transparent), 0 16px 40px rgba(201, 165, 77, 0.14); background: linear-gradient(180deg, color-mix(in srgb, var(--premium) 8%, var(--card)), color-mix(in srgb, var(--card) 92%, transparent)); }
  .select-twin-card.is-selected .select-twin-cta { color: var(--card-foreground); }
  .select-twin-selected-badge { position: absolute; top: 14px; right: 14px; padding: 4px 10px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--premium) 50%, var(--border)); background: color-mix(in srgb, var(--premium) 14%, var(--surface)); color: var(--premium); font-family: var(--font-mono); font-size: 0.6rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .select-twin-avatar-wrap { width: 64px; height: 64px; margin-bottom: 16px; overflow: hidden; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--premium) 34%, var(--border)); background: radial-gradient(circle, color-mix(in srgb, var(--premium) 18%, var(--surface)), var(--card)); box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22); }
  .select-twin-avatar-fallback { display: flex; align-items: center; justify-content: center; color: var(--premium); font-size: 1.4rem; font-weight: 900; }
  .select-twin-avatar { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
  .select-twin-tags { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .select-twin-industry { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.62rem; font-weight: 750; letter-spacing: 0.08em; text-transform: uppercase; }
  .select-twin-name { margin-bottom: 6px; color: var(--card-foreground); font-size: 1.2rem; font-weight: 900; line-height: 1.15; }
  .select-twin-years { margin-bottom: 10px; color: var(--accent); font-family: var(--font-mono); font-size: 0.66rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .select-twin-copy { margin-bottom: 16px; color: var(--muted-foreground); font-size: 0.88rem; line-height: 1.55; min-height: 2.8em; }
  .select-twin-cta { display: inline-flex; align-items: center; color: var(--premium); font-family: var(--font-mono); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .select-twin-summary { position: sticky; top: 96px; }
  .select-twin-summary-inner { padding: 24px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: linear-gradient(160deg, color-mix(in srgb, var(--primary) 10%, var(--card)), color-mix(in srgb, var(--premium) 6%, var(--surface))); box-shadow: var(--shadow-medium); }
  .select-twin-summary-title { margin-bottom: 18px; color: var(--card-foreground); font-size: 0.82rem; font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase; }
  .select-twin-summary-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
  .select-twin-summary-row:last-of-type { margin-bottom: 0; }
  .select-twin-summary-label { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.64rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .select-twin-summary-value { color: var(--card-foreground); font-size: 0.92rem; font-weight: 750; text-align: right; }
  .select-twin-summary-price { color: var(--premium); font-size: 1rem; font-weight: 900; }
  .select-twin-summary-trial { margin: 16px 0 12px; padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid color-mix(in srgb, var(--premium) 36%, var(--border)); background: color-mix(in srgb, var(--premium) 8%, transparent); color: var(--premium); font-family: var(--font-mono); font-size: 0.66rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
  .select-twin-summary-copy { margin: 14px 0 18px; color: var(--muted-foreground); font-size: 0.86rem; line-height: 1.6; }
  .select-twin-continue { margin-top: 4px; }

  .select-twin-continue { margin-top: 4px; }

  .checkout-page { min-height: 100vh; }
  .checkout-main { flex: 1; padding: 40px 40px 80px; max-width: 1100px; margin: 0 auto; width: 100%; }
  .checkout-header { margin-bottom: 32px; max-width: 720px; }
  .checkout-body { display: grid; grid-template-columns: minmax(280px, 340px) minmax(0, 1fr); gap: 28px; align-items: start; }
  .checkout-summary-inner, .checkout-success-card { padding: 24px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: linear-gradient(160deg, color-mix(in srgb, var(--primary) 10%, var(--card)), color-mix(in srgb, var(--premium) 6%, var(--surface))); box-shadow: var(--shadow-medium); }
  .checkout-summary-title, .checkout-panel-title { margin-bottom: 18px; color: var(--card-foreground); font-size: 0.82rem; font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase; }
  .checkout-twin-preview { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid var(--border); }
  .checkout-twin-avatar { width: 56px; height: 56px; border-radius: 999px; object-fit: cover; object-position: center top; border: 1px solid color-mix(in srgb, var(--premium) 40%, var(--border)); }
  .checkout-twin-name { color: var(--card-foreground); font-size: 1.05rem; font-weight: 900; line-height: 1.2; }
  .checkout-twin-meta { margin-top: 4px; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.62rem; font-weight: 750; letter-spacing: 0.08em; text-transform: uppercase; }
  .checkout-summary-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
  .checkout-summary-label { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.64rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .checkout-summary-value { color: var(--card-foreground); font-size: 0.92rem; font-weight: 750; text-align: right; }
  .checkout-summary-price { color: var(--premium); font-size: 1.05rem; font-weight: 900; }
  .checkout-trial-toggle { display: flex; align-items: flex-start; gap: 12px; margin: 18px 0 14px; padding: 14px; border-radius: var(--radius-md); border: 1px solid color-mix(in srgb, var(--premium) 36%, var(--border)); background: color-mix(in srgb, var(--premium) 8%, transparent); cursor: pointer; }
  .checkout-trial-toggle input { margin-top: 3px; width: 18px; height: 18px; accent-color: var(--premium); flex-shrink: 0; }
  .checkout-trial-copy { display: grid; gap: 4px; color: var(--card-foreground); font-size: 0.92rem; line-height: 1.45; }
  .checkout-trial-copy small { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.64rem; letter-spacing: 0.04em; text-transform: uppercase; }
  .checkout-cancel-copy { margin: 0 0 16px; color: var(--muted-foreground); font-size: 0.86rem; line-height: 1.6; }
  .checkout-change-link { color: var(--accent); font-family: var(--font-mono); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; }
  .checkout-change-link:hover { text-decoration: underline; }
  .checkout-payment-panel { padding: 24px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: color-mix(in srgb, var(--card) 88%, transparent); box-shadow: var(--shadow-soft); }
  .checkout-form-wrap { display: grid; gap: 16px; }
  .checkout-demo-banner { display: flex; gap: 12px; padding: 14px 16px; border-radius: var(--radius-md); border: 1px solid color-mix(in srgb, var(--accent) 32%, var(--border)); background: color-mix(in srgb, var(--accent) 8%, var(--surface)); color: var(--card-foreground); }
  .checkout-demo-banner strong { display: block; margin-bottom: 4px; font-size: 0.82rem; letter-spacing: 0.06em; text-transform: uppercase; }
  .checkout-demo-banner p { margin: 0; color: var(--muted-foreground); font-size: 0.86rem; line-height: 1.55; }
  .checkout-demo-icon { color: var(--accent); font-size: 1rem; line-height: 1; margin-top: 2px; }
  .checkout-form { display: grid; gap: 16px; }
  .checkout-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .checkout-input { font-family: var(--font-mono); letter-spacing: 0.04em; }
  .checkout-hint { margin: 0; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.64rem; line-height: 1.5; }
  .checkout-hint code { color: var(--accent); font-size: 0.68rem; }
  .checkout-pay-button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 50px; }
  .checkout-spinner { width: 16px; height: 16px; border-radius: 999px; border: 2px solid rgba(255, 255, 255, 0.28); border-top-color: white; animation: checkoutSpin 0.8s linear infinite; }
  @keyframes checkoutSpin { to { transform: rotate(360deg); } }
  .checkout-success-card { max-width: 520px; width: 100%; text-align: center; }
  .checkout-success-icon { width: 64px; height: 64px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; border-radius: 999px; background: color-mix(in srgb, var(--success) 18%, var(--surface)); color: var(--success); font-size: 1.8rem; font-weight: 900; box-shadow: 0 0 32px rgba(16, 185, 129, 0.18); }
  .checkout-success-title { margin-bottom: 12px; color: var(--card-foreground); font-size: clamp(1.6rem, 3vw, 2rem); font-weight: 900; }
  .checkout-success-copy { margin-bottom: 22px; color: var(--muted-foreground); font-size: 0.98rem; line-height: 1.65; }
  .checkout-success-details { margin-bottom: 18px; text-align: left; }
  .checkout-success-status { color: var(--success); font-weight: 900; }
  .checkout-demo-note { margin-bottom: 22px; padding: 10px 12px; border-radius: var(--radius-sm); border: 1px dashed color-mix(in srgb, var(--accent) 30%, var(--border)); color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.64rem; letter-spacing: 0.06em; text-transform: uppercase; }
  .checkout-success-actions { display: grid; gap: 10px; }

  .twin-gate-modal .modal-header { border-bottom-color: color-mix(in srgb, var(--premium) 24%, var(--border)); }
  .twin-gate-body { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 24px; overflow-y: auto; }
  .twin-gate-card { width: min(100%, 560px); padding: 32px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: linear-gradient(160deg, color-mix(in srgb, var(--card) 92%, var(--premium) 8%), color-mix(in srgb, var(--surface) 88%, transparent)); box-shadow: var(--shadow-large); text-align: center; }
  .twin-gate-lock { width: 72px; height: 72px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--premium) 44%, var(--border)); background: color-mix(in srgb, var(--premium) 10%, transparent); color: var(--premium); font-size: 1.6rem; box-shadow: 0 0 32px rgba(201, 165, 77, 0.16); }
  .twin-gate-title { margin-bottom: 12px; color: var(--card-foreground); font-size: 1.45rem; font-weight: 900; }
  .twin-gate-copy { margin-bottom: 22px; color: var(--muted-foreground); font-size: 0.98rem; line-height: 1.65; }
  .twin-gate-preview { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border); background: color-mix(in srgb, var(--surface) 84%, transparent); text-align: left; }
  .twin-gate-avatar { width: 52px; height: 52px; border-radius: 999px; object-fit: cover; object-position: center top; border: 1px solid color-mix(in srgb, var(--premium) 34%, var(--border)); flex-shrink: 0; }
  .twin-gate-preview-label { color: var(--accent); font-family: var(--font-mono); font-size: 0.62rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
  .twin-gate-preview-name { margin-top: 4px; color: var(--card-foreground); font-size: 0.92rem; font-weight: 750; line-height: 1.45; }
  .twin-gate-features { margin: 0 0 24px; padding: 0; list-style: none; display: grid; gap: 10px; text-align: left; color: var(--muted-foreground); font-size: 0.88rem; line-height: 1.55; }
  .twin-gate-features li { position: relative; padding-left: 16px; }
  .twin-gate-features li::before { content: "◆"; position: absolute; left: 0; color: var(--premium); font-size: 0.62rem; top: 0.2em; }
  .twin-gate-cta { width: 100%; min-height: 50px; justify-content: center; display: inline-flex; align-items: center; margin-bottom: 12px; }
  .twin-gate-dismiss { width: 100%; min-height: 44px; justify-content: center; display: inline-flex; align-items: center; }

  .subscription-success-page { overflow: hidden; }
  .subscription-success-main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px 24px 80px; }
  .subscription-success-card { position: relative; width: min(100%, 640px); padding: 40px 36px; border: 1px solid color-mix(in srgb, var(--premium) 32%, var(--border)); border-radius: var(--radius-xl); background: linear-gradient(165deg, color-mix(in srgb, var(--card) 94%, var(--premium) 6%), color-mix(in srgb, var(--surface) 90%, transparent)); box-shadow: var(--shadow-large); text-align: center; overflow: hidden; }
  .subscription-success-glow { position: absolute; inset: -30% -10% auto; height: 240px; pointer-events: none; background: radial-gradient(circle, rgba(201, 165, 77, 0.18), transparent 68%); }
  .subscription-success-kicker { position: relative; margin-bottom: 10px; color: var(--accent); font-size: 0.78rem; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; }
  .subscription-success-title { position: relative; margin-bottom: 12px; color: var(--card-foreground); font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 900; line-height: 1.05; }
  .subscription-success-lead { position: relative; margin-bottom: 28px; color: var(--muted-foreground); font-size: 1rem; line-height: 1.65; }
  .subscription-success-twin { position: relative; display: flex; align-items: center; gap: 18px; margin-bottom: 24px; padding: 18px; border-radius: var(--radius-lg); border: 1px solid var(--border); background: color-mix(in srgb, var(--surface) 84%, transparent); text-align: left; }
  .subscription-success-avatar-wrap { position: relative; width: 88px; height: 88px; flex-shrink: 0; }
  .subscription-success-avatar { width: 88px; height: 88px; border-radius: 999px; object-fit: cover; object-position: center top; border: 2px solid color-mix(in srgb, var(--premium) 44%, var(--border)); box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28); }
  .subscription-success-avatar-ring { position: absolute; inset: -10px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--premium) 36%, transparent); }
  .subscription-success-twin-label { color: var(--premium); font-family: var(--font-mono); font-size: 0.64rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
  .subscription-success-twin-name { margin-top: 4px; color: var(--card-foreground); font-size: 1.35rem; font-weight: 900; line-height: 1.15; }
  .subscription-success-twin-meta { margin-top: 6px; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.66rem; font-weight: 750; letter-spacing: 0.08em; text-transform: uppercase; }
  .subscription-success-details { position: relative; margin-bottom: 28px; text-align: left; }
  .subscription-success-actions { position: relative; display: grid; gap: 12px; }

  .feed-page { min-height: 100vh; }
  .feed-main { max-width: 1100px; margin: 0 auto; padding: 40px 40px 80px; }
  .feed-header { margin-bottom: 36px; max-width: 720px; }
  .feed-title { margin-bottom: 12px; color: var(--card-foreground); font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 900; line-height: 1.05; }
  .feed-lead { color: var(--muted-foreground); font-size: 1rem; line-height: 1.65; }
  .feed-section { margin-bottom: 48px; }
  .feed-section-heading { margin-bottom: 20px; }
  .feed-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .feed-card { padding: 22px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: color-mix(in srgb, var(--card) 84%, transparent); box-shadow: var(--shadow-soft); display: flex; flex-direction: column; gap: 12px; }
  .feed-card-active { border-color: color-mix(in srgb, var(--premium) 40%, var(--border)); background: linear-gradient(180deg, color-mix(in srgb, var(--premium) 6%, var(--card)), color-mix(in srgb, var(--card) 92%, transparent)); }
  .feed-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
  .feed-type-pill { display: inline-flex; padding: 4px 10px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--accent) 28%, var(--border)); background: color-mix(in srgb, var(--accent) 8%, transparent); color: var(--card-foreground); font-family: var(--font-mono); font-size: 0.58rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .feed-card-twin { color: var(--premium); font-family: var(--font-mono); font-size: 0.62rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
  .feed-card-date { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.62rem; font-weight: 750; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; }
  .feed-card-title { color: var(--card-foreground); font-size: 1.15rem; font-weight: 900; line-height: 1.25; }
  .feed-card-copy { color: var(--muted-foreground); font-size: 0.9rem; line-height: 1.6; flex: 1; }
  .feed-card-source { display: flex; align-items: flex-start; gap: 8px; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.62rem; letter-spacing: 0.04em; line-height: 1.45; }
  .feed-verified-mark { color: var(--premium); font-weight: 900; flex-shrink: 0; }
  .feed-card-open-button { margin-top: 4px; align-self: flex-start; padding: 0; border: 0; background: transparent; color: var(--accent); font-family: var(--font-mono); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; }
  .feed-card-open-button:hover { text-decoration: underline; }
  .feed-preview-banner { margin-bottom: 36px; padding: 24px 28px; border: 1px solid color-mix(in srgb, var(--premium) 30%, var(--border)); border-radius: var(--radius-lg); background: linear-gradient(135deg, color-mix(in srgb, var(--premium) 8%, var(--surface)), color-mix(in srgb, var(--card) 90%, transparent)); display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
  .feed-preview-title { margin-bottom: 8px; color: var(--card-foreground); font-size: 1.1rem; font-weight: 900; }
  .feed-preview-copy { margin: 0; color: var(--muted-foreground); font-size: 0.92rem; line-height: 1.6; max-width: 52ch; }
  .feed-drop-modal { max-width: 720px; margin: 48px auto; max-height: calc(100vh - 96px); overflow: hidden; display: flex; flex-direction: column; }
  .feed-drop-modal-body { padding: 28px 36px 36px; overflow-y: auto; display: grid; gap: 18px; }
  .feed-drop-meta-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .feed-drop-summary { margin: 0; color: var(--muted-foreground); font-size: 0.98rem; line-height: 1.65; }
  .feed-drop-body { color: var(--card-foreground); font-size: 1.02rem; line-height: 1.75; }
  .feed-drop-source-panel { padding: 14px 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: color-mix(in srgb, var(--surface) 90%, transparent); }
  .feed-drop-source-label { margin-bottom: 8px; color: var(--premium); font-family: var(--font-mono); font-size: 0.6rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
  .feed-drop-actions { display: flex; flex-wrap: wrap; gap: 12px; }
  .feed-card-cta { margin-top: 4px; color: var(--accent); font-family: var(--font-mono); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; }
  .feed-card-cta:hover { text-decoration: underline; }
  .feed-empty { padding: 32px; border: 1px dashed var(--border); border-radius: var(--radius-lg); text-align: center; color: var(--muted-foreground); display: grid; gap: 16px; justify-items: center; }
  .feed-empty-note { max-width: 36ch; color: var(--muted-foreground); font-size: 0.84rem; line-height: 1.55; }
  .feed-invalid-drop-notice { margin-bottom: 18px; padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--border)); background: color-mix(in srgb, var(--accent) 8%, transparent); color: var(--card-foreground); font-size: 0.88rem; line-height: 1.5; }

  .talent-page { min-height: 100vh; }
  .talent-main { max-width: 1200px; margin: 0 auto; padding: 40px 40px 80px; }
  .talent-header { margin-bottom: 32px; max-width: 760px; }
  .talent-title { margin-bottom: 12px; color: var(--card-foreground); font-size: clamp(2rem, 4vw, 2.6rem); font-weight: 900; line-height: 1.05; }
  .talent-lead { color: var(--muted-foreground); font-size: 1rem; line-height: 1.65; max-width: 62ch; }
  .talent-form-layout { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(280px, 380px); gap: 28px; align-items: start; }
  .talent-form.auth-card { margin: 0; }
  .talent-fieldset { margin: 0; padding: 0; border: 0; display: grid; gap: 18px; }
  .talent-fieldset .form-label { margin-bottom: 0; }
  .talent-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .talent-preview-panel { position: sticky; top: 88px; padding: 22px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: color-mix(in srgb, var(--card) 86%, transparent); box-shadow: var(--shadow-soft); display: grid; gap: 16px; }
  .talent-preview-header { display: grid; gap: 8px; }
  .talent-preview-copy { margin: 0; color: var(--muted-foreground); font-size: 0.88rem; line-height: 1.55; }
  .talent-preview-empty { padding: 28px 18px; border: 1px dashed var(--border); border-radius: var(--radius-md); color: var(--muted-foreground); font-size: 0.9rem; line-height: 1.6; text-align: center; }
  .talent-preview-meta { display: grid; gap: 10px; }
  .talent-preview-note { margin: 0; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.62rem; letter-spacing: 0.05em; line-height: 1.5; }
  .talent-preview-panel .feed-card-open-button { pointer-events: none; opacity: 0.55; }
  .talent-success-card { max-width: 640px; padding: 32px; border: 1px solid color-mix(in srgb, var(--premium) 34%, var(--border)); border-radius: var(--radius-lg); background: linear-gradient(180deg, color-mix(in srgb, var(--premium) 8%, var(--card)), color-mix(in srgb, var(--card) 92%, transparent)); box-shadow: var(--shadow-medium); }
  .talent-success-kicker { margin-bottom: 8px; color: var(--premium); font-family: var(--font-mono); font-size: 0.64rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
  .talent-success-title { margin-bottom: 10px; color: var(--card-foreground); font-size: 1.6rem; font-weight: 900; }
  .talent-success-copy { margin-bottom: 22px; color: var(--muted-foreground); font-size: 0.98rem; line-height: 1.65; }
  .talent-success-actions { display: flex; flex-wrap: wrap; gap: 12px; }

  .notification-bell-wrap { position: relative; display: inline-flex; align-items: center; gap: 8px; }
  .notification-bell-button { position: relative; width: 42px; height: 42px; border: 1px solid var(--border); border-radius: 999px; background: color-mix(in srgb, var(--surface) 90%, transparent); color: var(--card-foreground); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
  .notification-bell-button:hover { border-color: color-mix(in srgb, var(--premium) 40%, var(--border)); }
  .notification-bell-icon { font-size: 1rem; line-height: 1; }
  .notification-bell-badge { position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: var(--premium); color: var(--background); font-family: var(--font-mono); font-size: 0.58rem; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; }
  .notification-new-pill { padding: 4px 10px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--premium) 34%, var(--border)); background: color-mix(in srgb, var(--premium) 10%, transparent); color: var(--premium); font-family: var(--font-mono); font-size: 0.58rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .notification-panel { position: absolute; top: calc(100% + 10px); right: 0; width: min(360px, calc(100vw - 32px)); padding: 14px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: color-mix(in srgb, var(--background) 96%, transparent); box-shadow: var(--shadow-medium); z-index: 1200; backdrop-filter: blur(18px); }
  .notification-panel-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
  .notification-panel-title { color: var(--card-foreground); font-size: 0.92rem; font-weight: 900; }
  .notification-panel-meta { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.62rem; letter-spacing: 0.06em; text-transform: uppercase; }
  .notification-mark-all { padding: 0; border: 0; background: transparent; color: var(--accent); font-family: var(--font-mono); font-size: 0.6rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; }
  .notification-empty { padding: 18px 12px; color: var(--muted-foreground); font-size: 0.88rem; text-align: center; }
  .notification-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; max-height: 320px; overflow-y: auto; }
  .notification-item { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: color-mix(in srgb, var(--surface) 92%, transparent); text-align: left; cursor: pointer; display: grid; gap: 4px; }
  .notification-item:not(.is-read) { border-color: color-mix(in srgb, var(--premium) 34%, var(--border)); background: color-mix(in srgb, var(--premium) 7%, var(--surface)); }
  .notification-item-title { color: var(--card-foreground); font-size: 0.84rem; font-weight: 850; line-height: 1.35; }
  .notification-item-message { color: var(--muted-foreground); font-size: 0.78rem; line-height: 1.45; }
  .notification-item-time { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.58rem; letter-spacing: 0.05em; text-transform: uppercase; }
  .notification-panel-footer { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
  .notification-enable-alerts { width: 100%; min-height: 38px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: transparent; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.62rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; }
  .notification-enable-alerts:hover { border-color: color-mix(in srgb, var(--accent) 40%, var(--border)); color: var(--card-foreground); }

  .fan-home-page { min-height: 100vh; display: flex; flex-direction: column; }
  .fan-home-main { flex: 1; max-width: 1100px; margin: 0 auto; width: 100%; padding: 40px 40px 80px; }
  .fan-home-header { margin-bottom: 28px; max-width: 720px; }
  .fan-home-title { margin-bottom: 10px; color: var(--card-foreground); font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 900; line-height: 1.05; }
  .fan-home-lead { color: var(--muted-foreground); font-size: 1rem; line-height: 1.65; }
  .fan-home-welcome { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 28px; padding: 20px 22px; border: 1px solid color-mix(in srgb, var(--premium) 34%, var(--border)); border-radius: var(--radius-lg); background: linear-gradient(135deg, color-mix(in srgb, var(--premium) 8%, var(--card)), color-mix(in srgb, var(--surface) 92%, transparent)); }
  .fan-home-welcome-kicker { margin-bottom: 6px; color: var(--premium); font-family: var(--font-mono); font-size: 0.64rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
  .fan-home-welcome-title { margin-bottom: 6px; color: var(--card-foreground); font-size: 1.25rem; font-weight: 900; }
  .fan-home-welcome-copy { color: var(--muted-foreground); font-size: 0.92rem; line-height: 1.55; }
  .fan-home-welcome-dismiss { flex-shrink: 0; }
  .fan-home-hero-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr); gap: 18px; margin-bottom: 22px; }
  .fan-home-twin-card, .fan-home-status-card { padding: 24px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: color-mix(in srgb, var(--card) 86%, transparent); box-shadow: var(--shadow-soft); }
  .fan-home-twin-card { display: flex; gap: 20px; align-items: flex-start; }
  .fan-home-twin-avatar-wrap { width: 96px; height: 96px; flex-shrink: 0; overflow: hidden; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--premium) 36%, var(--border)); background: radial-gradient(circle, color-mix(in srgb, var(--premium) 16%, var(--surface)), var(--card)); box-shadow: 0 14px 34px rgba(0, 0, 0, 0.24); }
  .fan-home-twin-avatar { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
  .fan-home-twin-avatar-fallback { display: flex; align-items: center; justify-content: center; color: var(--premium); font-size: 2rem; font-weight: 900; }
  .fan-home-twin-label { margin-bottom: 4px; color: var(--premium); font-family: var(--font-mono); font-size: 0.62rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
  .fan-home-twin-name { margin-bottom: 6px; color: var(--card-foreground); font-size: 1.55rem; font-weight: 900; line-height: 1.1; }
  .fan-home-twin-meta { margin-bottom: 10px; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.64rem; font-weight: 750; letter-spacing: 0.08em; text-transform: uppercase; }
  .fan-home-twin-copy { margin-bottom: 14px; color: var(--muted-foreground); font-size: 0.92rem; line-height: 1.6; }
  .fan-home-status-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
  .fan-home-status-row:last-of-type { margin-bottom: 0; padding-bottom: 0; border-bottom: 0; }
  .fan-home-status-label { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.62rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .fan-home-status-value { color: var(--card-foreground); font-size: 0.92rem; font-weight: 750; text-align: right; }
  .fan-home-status-active { color: var(--premium); }
  .fan-home-session-block { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--border); }
  .fan-home-session-top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 10px; }
  .fan-home-session-count { color: var(--card-foreground); font-size: 1.35rem; font-weight: 900; line-height: 1; }
  .fan-home-session-total { color: var(--muted-foreground); font-size: 0.82rem; font-weight: 700; }
  .fan-home-session-meter { height: 8px; border-radius: 999px; overflow: hidden; background: color-mix(in srgb, var(--surface) 88%, transparent); border: 1px solid var(--border); }
  .fan-home-session-meter-fill { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, color-mix(in srgb, var(--premium) 72%, var(--accent)), var(--premium)); transition: width var(--motion-standard) var(--ease-out); }
  .fan-home-session-copy { margin-top: 10px; color: var(--muted-foreground); font-size: 0.82rem; line-height: 1.5; }
  .fan-home-session-active { margin-top: 8px; color: var(--accent); font-family: var(--font-mono); font-size: 0.62rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
  .fan-home-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 28px; }
  .fan-home-panels { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .fan-home-panel { padding: 20px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: color-mix(in srgb, var(--card) 84%, transparent); box-shadow: var(--shadow-soft); min-height: 280px; display: flex; flex-direction: column; }
  .fan-home-panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
  .fan-home-inline-link { color: var(--accent); font-family: var(--font-mono); font-size: 0.64rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; }
  .fan-home-inline-link:hover { text-decoration: underline; }
  .fan-home-unread-pill { padding: 4px 10px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--premium) 34%, var(--border)); background: color-mix(in srgb, var(--premium) 10%, transparent); color: var(--premium); font-family: var(--font-mono); font-size: 0.58rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
  .fan-home-empty { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 14px; padding: 12px 0; color: var(--muted-foreground); font-size: 0.9rem; line-height: 1.55; text-align: center; }
  .fan-home-drop-list, .fan-home-chat-list, .fan-home-notification-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 10px; }
  .fan-home-drop-item, .fan-home-notification-item { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: color-mix(in srgb, var(--surface) 92%, transparent); text-align: left; cursor: pointer; display: grid; gap: 6px; }
  .fan-home-drop-item:hover, .fan-home-notification-item:hover { border-color: color-mix(in srgb, var(--accent) 36%, var(--border)); }
  .fan-home-notification-item:not(.is-read) { border-color: color-mix(in srgb, var(--premium) 34%, var(--border)); background: color-mix(in srgb, var(--premium) 7%, var(--surface)); }
  .fan-home-drop-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  .fan-home-drop-date { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.58rem; letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap; }
  .fan-home-drop-title, .fan-home-notification-title { color: var(--card-foreground); font-size: 0.9rem; font-weight: 850; line-height: 1.35; }
  .fan-home-drop-summary, .fan-home-notification-message { color: var(--muted-foreground); font-size: 0.8rem; line-height: 1.45; }
  .fan-home-notification-time, .fan-home-chat-time { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.58rem; letter-spacing: 0.05em; text-transform: uppercase; }
  .fan-home-chat-item { padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: color-mix(in srgb, var(--surface) 92%, transparent); }
  .fan-home-chat-item-user { border-color: color-mix(in srgb, var(--accent) 24%, var(--border)); }
  .fan-home-chat-item-twin { border-color: color-mix(in srgb, var(--premium) 24%, var(--border)); }
  .fan-home-chat-meta { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
  .fan-home-chat-role { color: var(--premium); font-family: var(--font-mono); font-size: 0.58rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .fan-home-chat-content { color: var(--card-foreground); font-size: 0.84rem; line-height: 1.5; }

  @media (max-width: 1024px) {
    .select-twin-body { grid-template-columns: 1fr; }
    .select-twin-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .select-twin-summary { position: fixed; left: 0; right: 0; bottom: 0; top: auto; z-index: 85; padding: 0 16px 16px; background: linear-gradient(to top, rgba(8, 10, 16, 0.98) 72%, rgba(8, 10, 16, 0)); pointer-events: none; }
    .select-twin-summary-inner { pointer-events: auto; padding: 18px 20px; }
    .select-twin-summary-copy { display: none; }
    .select-twin-main { padding-bottom: 200px; }
    .select-twin-summary-row { margin-bottom: 8px; padding-bottom: 8px; }
    .select-twin-summary-trial { margin: 10px 0 8px; }
    .checkout-body { grid-template-columns: 1fr; }
    .checkout-main { padding-bottom: 48px; }
    .fan-home-hero-grid { grid-template-columns: 1fr; }
    .fan-home-panels { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 760px) {
    .app-nav, .hero, .athlete-hero, .timeline-section, .closing-cta { padding-left: 20px; padding-right: 20px; }
    .app-nav { align-items: flex-start; flex-wrap: wrap; }
    .status-pill { width: 100%; justify-content: center; }
    .section-rule, .twin-banner { margin-left: 20px; margin-right: 20px; }
    .athlete-grid { grid-template-columns: 1fr; padding-left: 20px; padding-right: 20px; gap: 14px; }
    .athlete-portrait-wrap { right: -34px; bottom: 74px; width: 220px; height: 250px; opacity: 0.34; }
    .stats-grid { gap: 12px; }
    .timeline-line { left: 88px; }
    .moment-date { width: 70px; }
    .moment-body { padding-left: 14px; }
    .modal-header { padding: 16px 18px; flex-wrap: wrap; }
    .modal-layout { flex-direction: column; }
    .twin-rail { width: 100%; min-height: 180px; flex-direction: row; justify-content: flex-start; border-right: 0; border-bottom: 1px solid var(--border); overflow-x: auto; }
    .rail-stats { display: none; }
    .messages { padding: 24px 20px; }
    .user-bubble { max-width: 86%; }
    .modal-composer { padding: 16px 18px; flex-wrap: wrap; }
    .modal-composer .primary-button { width: 100%; }
    .chat-session-bar, .chat-session-recap, .chat-session-exhausted { padding: 16px 18px; }
    .composer-disabled-note { padding: 16px 18px; }
    .auth-main { padding: 28px 20px 56px; }
    .auth-layout, .auth-layout-wide { grid-template-columns: 1fr; gap: 28px; }
    .auth-social-row { grid-template-columns: 1fr; }
    .select-twin-main { padding: 28px 20px 200px; }
    .select-twin-grid { grid-template-columns: 1fr; }
    .checkout-row { grid-template-columns: 1fr; }
    .checkout-main { padding: 28px 20px 48px; }
    .feed-main { padding: 28px 20px 56px; }
    .feed-grid { grid-template-columns: 1fr; }
    .feed-drop-modal-body { padding: 20px 18px 28px; }
    .feed-preview-banner { padding: 18px; }
    .talent-main { padding: 28px 20px 56px; }
    .talent-form-layout { grid-template-columns: 1fr; }
    .talent-form-row { grid-template-columns: 1fr; }
    .talent-preview-panel { position: static; }
    .subscription-success-card { padding: 28px 22px; }
    .subscription-success-twin { flex-direction: column; text-align: center; }
    .fan-home-main { padding: 28px 20px 56px; }
    .fan-home-twin-card { flex-direction: column; }
    .fan-home-panels { grid-template-columns: 1fr; }
    .fan-home-welcome { flex-direction: column; }
  }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; }
  }

`;

export default CSS;
