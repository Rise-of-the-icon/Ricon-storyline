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

  .card-root { cursor: pointer; position: relative; overflow: hidden; min-height: 250px; display: flex; flex-direction: column; justify-content: flex-end; padding: 28px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: linear-gradient(180deg, color-mix(in srgb, var(--card) 92%, var(--primary) 8%), var(--card)); box-shadow: var(--shadow-soft); transition: transform var(--motion-standard) var(--ease-out), border-color var(--motion-standard), box-shadow var(--motion-standard), background var(--motion-standard); }
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
  .assistant-text { color: var(--card-foreground); font-size: 1.05rem; line-height: 1.75; }
  .verified-meta { margin-top: 10px; color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; }
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
  }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
  }

`;

export default CSS;
