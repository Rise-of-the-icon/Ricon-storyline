import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { configureHaptics, triggerHaptic } from "./src/haptics.js";
import { ErrorState, EmptyState, LoadingState, RetryAction } from "./src/ui/StateStates.jsx";
import ErrorBoundary from "./src/ui/ErrorBoundary.jsx";
import FeaturedStoryHero from "./src/components/home/FeaturedStoryHero.jsx";
import ExperienceModeSection from "./src/components/home/ExperienceModeSection.jsx";
import FeaturedTimelinePreview from "./src/components/home/FeaturedTimelinePreview.jsx";
import AIPromptDemo from "./src/components/home/AIPromptDemo.jsx";
import StoryLibraryPreview from "./src/components/home/StoryLibraryPreview.jsx";
import VerificationSection from "./src/components/home/VerificationSection.jsx";
import michaelJordanLastShotStory from "./src/data/stories/michael-jordan-last-shot";
import StoryExperiencePage from "./src/pages/story/StoryExperiencePage.jsx";

const CSS = `
  :root {
    --safe-top: env(safe-area-inset-top, 0px);
    --safe-bottom: env(safe-area-inset-bottom, 0px);
    --safe-left: env(safe-area-inset-left, 0px);
    --safe-right: env(safe-area-inset-right, 0px);
    --safe-bottom-ui: max(12px, calc(8px + var(--safe-bottom)));
    --text-primary: #F0EBE3;
    --text-body: rgba(240,235,227,0.82);
    --text-caption: rgba(240,235,227,0.72);
    --text-meta: #8f8f8f;
    --text-disabled: #8a8a8a;
    --focus-ring: #7BC8E8;
    --error-text: #ffb3b3;
  }
  /* Approved contrast pairings on dark surfaces:
     --text-primary on #080808/#0c0c0c
     --text-body on rgba(8,8,8,0.72)+
     --text-caption on rgba(8,8,8,0.72)+
     --text-meta on #080808/#0f0f0f
     --focus-ring against all dark interactive backgrounds */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
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
  @keyframes streamShimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
  .ricon-root { background:#080808; min-height:100vh; min-height:100dvh; color:#F0EBE3; font-family:"Inter",sans-serif; overflow-x:hidden; }
  html, body { max-width:100%; overflow-x:hidden; }
  button { font: inherit; }
  button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible { outline:2px solid var(--focus-ring); outline-offset:3px; }
  .bebas { font-family:"Inter",sans-serif; }
  .cormorant { font-family:"Inter",sans-serif; }
  .mono { font-family:"Inter",sans-serif; }
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
  .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
  .twin-btn:hover { background:rgba(201,168,76,0.12) !important; border-color:rgba(201,168,76,0.7) !important; }
  .back-btn:hover { color:#C9A84C !important; }
  .mode-btn-active { background:#C9A84C !important; color:#080808 !important; }
  .scanline-fx { pointer-events:none; position:absolute; left:0; right:0; height:80px; background:linear-gradient(transparent,rgba(201,168,76,0.03),transparent); animation:scanline 6s linear infinite; }
  .hero-field { animation:slowDrift 13s ease-in-out infinite; }
  .story-shell { min-height:100vh; min-height:100dvh; position:relative; overflow:hidden; background:radial-gradient(circle at 72% 18%,rgba(201,168,76,0.16),transparent 34%),radial-gradient(circle at 18% 70%,rgba(123,200,232,0.1),transparent 30%),#070707; }
  .ricon-root { overflow-x:hidden; }
  .story-panel { background:rgba(12,12,12,0.72); border:1px solid rgba(255,255,255,0.08); backdrop-filter:blur(28px); }
  .interactive-video { position:relative; overflow:hidden; min-height:320px; aspect-ratio:16 / 9; background:#090909; border:1px solid rgba(255,255,255,0.08); }
  .interactive-video:before { content:""; position:absolute; inset:-20%; background:radial-gradient(circle at 35% 28%,rgba(123,200,232,0.18),transparent 26%),radial-gradient(circle at 68% 62%,rgba(201,168,76,0.22),transparent 30%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent 44%); animation:slowDrift 11s ease-in-out infinite; }
  .interactive-video:after { content:""; position:absolute; inset:0; background:linear-gradient(to bottom,rgba(8,8,8,0.08),rgba(8,8,8,0.54)),repeating-linear-gradient(to bottom,rgba(255,255,255,0.035) 0,rgba(255,255,255,0.035) 1px,transparent 1px,transparent 7px); pointer-events:none; }
  .timeline-video { position:relative; overflow:hidden; width:min(520px,100%); min-height:154px; aspect-ratio:16 / 9; margin:18px 0 16px; border:1px solid rgba(255,255,255,0.08); background:#090909; cursor:pointer; }
  .timeline-video:before { content:""; position:absolute; inset:-30%; background:radial-gradient(circle at 24% 30%,rgba(123,200,232,0.18),transparent 24%),radial-gradient(circle at 74% 68%,rgba(201,168,76,0.22),transparent 30%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent 45%); animation:slowDrift 12s ease-in-out infinite; }
  .timeline-video:after { content:""; position:absolute; inset:0; background:linear-gradient(to bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.62)),repeating-linear-gradient(to bottom,rgba(255,255,255,0.035) 0,rgba(255,255,255,0.035) 1px,transparent 1px,transparent 8px); pointer-events:none; }
  .video-container { position:absolute; inset:0; z-index:0; overflow:hidden; background:#090909; contain:layout paint; }
  .media-readable-overlay { position:absolute; inset:0; pointer-events:none; background:linear-gradient(180deg,rgba(4,4,4,0.2) 0%,rgba(4,4,4,0.44) 48%,rgba(4,4,4,0.78) 100%),radial-gradient(circle at 50% 36%,rgba(0,0,0,0.06) 0,rgba(0,0,0,0.38) 70%); }
  .media-readable-overlay-strong { background:linear-gradient(180deg,rgba(4,4,4,0.26) 0%,rgba(4,4,4,0.56) 48%,rgba(4,4,4,0.84) 100%),radial-gradient(circle at 50% 36%,rgba(0,0,0,0.12) 0,rgba(0,0,0,0.48) 70%); }
  .media-text-surface { text-shadow:0 2px 18px rgba(0,0,0,0.9),0 1px 2px rgba(0,0,0,0.95); }
  .media-text-surface .bebas, .media-text-surface .cormorant, .media-text-surface .mono { text-shadow:inherit; }
  .media-copy { color:var(--text-body) !important; }
  .media-muted-copy { color:var(--text-caption) !important; }
  .video-container:before { content:""; position:absolute; inset:0; z-index:2; pointer-events:none; background:linear-gradient(180deg,rgba(4,4,4,0.16),rgba(4,4,4,0.42) 48%,rgba(4,4,4,0.68)); }
  .video-media, .video-poster { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; opacity:0.62; }
  .video-poster { background-size:cover; background-position:center; transform:scale(1.03); }
  .video-media { z-index:1; }
  .video-poster { z-index:0; }
  .video-container-poster-only .video-poster { z-index:1; opacity:0.72; }
  .video-overlay { z-index:2; }
  .video-controls { position:absolute; left:calc(12px + var(--safe-left)); right:calc(12px + var(--safe-right)); bottom:var(--safe-bottom-ui); z-index:4; display:flex; align-items:center; gap:7px; opacity:0; transform:translateY(5px); transition:opacity 0.2s,transform 0.2s; pointer-events:auto; }
  .interactive-video:hover .video-controls, .timeline-video:hover .video-controls, .video-container:focus-within .video-controls, .video-controls-visible { opacity:1; transform:translateY(0); }
  .video-control-btn { min-width:32px; height:30px; display:inline-flex; align-items:center; justify-content:center; border:1px solid rgba(201,168,76,0.35); background:rgba(8,8,8,0.72); color:#C9A84C; border-radius:2px; cursor:pointer; font-family:"Inter",sans-serif; font-size:9px; letter-spacing:1px; }
  .video-control-btn:hover { border-color:rgba(201,168,76,0.8); color:#FFD87A; background:rgba(201,168,76,0.1); }
  .video-control-btn:focus-visible { outline:2px solid #7BC8E8; outline-offset:3px; }
  .video-control-btn[aria-pressed="true"] { background:#C9A84C; color:#080808; border-color:#C9A84C; }
  .video-control-btn-primary { min-width:56px; height:56px; border-radius:50%; font-size:16px; letter-spacing:0; box-shadow:0 0 24px rgba(201,168,76,0.18); }
  .video-mobile-center-controls { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); z-index:5; pointer-events:none; }
  .video-mobile-center-controls .video-control-btn-primary { pointer-events:auto; }
  .video-mobile-tap-zone { position:absolute; top:0; bottom:0; width:34%; z-index:3; background:transparent; border:none; cursor:pointer; }
  .video-mobile-tap-zone-left { left:0; }
  .video-mobile-tap-zone-right { right:0; }
  .video-mobile-secondary-menu { position:absolute; right:0; bottom:calc(60px + var(--safe-bottom-ui)); z-index:6; display:flex; flex-direction:column; gap:8px; padding:10px; border:1px solid rgba(201,168,76,0.24); background:rgba(8,8,8,0.92); }
  .video-doubletap-indicator { position:absolute; top:50%; transform:translateY(-50%); z-index:5; padding:10px 12px; border:1px solid rgba(123,200,232,0.42); background:rgba(8,8,8,0.8); color:#7BC8E8; font-family:"Inter",sans-serif; font-size:10px; letter-spacing:1.5px; pointer-events:none; }
  .video-doubletap-indicator-left { left:10px; }
  .video-doubletap-indicator-right { right:10px; }
  .video-control-spacer { flex:1; }
  .timeline-dot { width:36px; flex-shrink:0; display:flex; flex-direction:column; align-items:center; }
  .timeline-content { flex:1; padding-left:18px; padding-bottom:20px; content-visibility:auto; contain-intrinsic-size:480px; }
  .timeline-story-card { border:1px solid transparent; padding:10px; margin:-10px; transition:border-color 0.22s ease, background 0.22s ease, transform 0.22s ease; }
  .timeline-story-card-interactive { cursor:pointer; }
  .timeline-story-card-interactive:hover { border-color:rgba(201,168,76,0.34); background:rgba(255,255,255,0.02); transform:translateY(-1px); }
  .timeline-story-card-interactive:focus-visible { outline:2px solid #7BC8E8; outline-offset:3px; border-color:rgba(123,200,232,0.48); background:rgba(123,200,232,0.05); }
  .timeline-story-card-interactive:active { transform:translateY(0); background:rgba(201,168,76,0.08); }
  .timeline-status-badge { display:inline-flex; align-items:center; gap:6px; margin-bottom:12px; padding:3px 10px; border-radius:2px; border:1px solid rgba(255,255,255,0.22); font-family:"Inter",sans-serif; font-size:8px; letter-spacing:1.4px; }
  .timeline-status-badge-disabled { color:var(--text-disabled); border-color:rgba(255,255,255,0.28); background:rgba(255,255,255,0.03); }
  .story-bottom-action-bar { position:fixed; left:calc(12px + var(--safe-left)); right:calc(12px + var(--safe-right)); bottom:var(--safe-bottom-ui); z-index:95; display:none; gap:8px; padding:8px; border:1px solid rgba(255,255,255,0.12); background:rgba(8,8,8,0.94); backdrop-filter:blur(16px); }
  .story-bottom-action-bar button { flex:1; min-height:46px; font-family:"Inter",sans-serif; font-size:9px; letter-spacing:1.6px; border-radius:2px; border:1px solid rgba(255,255,255,0.14); background:rgba(255,255,255,0.02); color:#C9A84C; cursor:pointer; }
  .story-bottom-action-bar button:focus-visible { outline:2px solid var(--focus-ring); outline-offset:2px; }
  .story-bottom-action-bar button:disabled { color:var(--text-disabled); border-color:rgba(255,255,255,0.2); cursor:not-allowed; }
  .chapter-section { scroll-margin-top:150px; }
  .chapter-kicker { position:sticky; top:calc(146px + var(--safe-top)); z-index:2; display:inline-flex; align-items:center; gap:8px; margin-bottom:12px; padding:4px 9px; background:rgba(8,8,8,0.88); border:1px solid rgba(201,168,76,0.2); backdrop-filter:blur(14px); }
  .hotspot { animation:hotspotPulse 2.4s ease-in-out infinite; }
  .voice-panel { border:1px solid rgba(201,168,76,0.18); background:rgba(201,168,76,0.045); padding:12px 14px; margin-top:14px; display:flex; align-items:center; justify-content:space-between; gap:14px; }
  .voice-bars { display:flex; align-items:center; gap:4px; height:32px; }
  .voice-bars span { width:4px; min-height:8px; background:#C9A84C; opacity:0.45; animation:voiceBar 1.1s ease-in-out infinite; }
  .voice-bars span:nth-child(2) { animation-delay:0.1s; background:#FFD87A; }
  .voice-bars span:nth-child(3) { animation-delay:0.2s; background:#7BC8E8; }
  .voice-bars span:nth-child(4) { animation-delay:0.3s; }
  .voice-bars span:nth-child(5) { animation-delay:0.4s; background:#FFD87A; }
  .stream-caret { display:inline-block; width:7px; height:1.05em; margin-left:4px; vertical-align:-0.12em; background:#C9A84C; animation:dot 1.2s ease-in-out infinite; }
  .stream-shimmer { width:min(340px,72vw); height:12px; border-radius:2px; background:linear-gradient(90deg,rgba(201,168,76,0.08),rgba(201,168,76,0.34),rgba(123,200,232,0.16),rgba(201,168,76,0.08)); background-size:200% 100%; animation:streamShimmer 1s linear infinite; }
  .suggestion-row { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
  .suggestion-chip { font-family:"Inter",sans-serif; font-size:9px; letter-spacing:1px; padding:9px 12px; color:#C9A84C; background:rgba(201,168,76,0.035); border:1px solid rgba(201,168,76,0.22); border-radius:2px; cursor:pointer; line-height:1.45; text-align:left; transition:border-color 0.2s,color 0.2s,background 0.2s; }
  .suggestion-chip:hover { border-color:rgba(201,168,76,0.68); color:#FFD87A; background:rgba(201,168,76,0.08); }
  .suggestion-chip:focus-visible { outline:2px solid #7BC8E8; outline-offset:3px; }
  .assistant-message-bubble { min-height:56px; contain:layout style; overflow-wrap:anywhere; word-break:normal; }
  .twin-message-user { overflow-wrap:anywhere; word-break:break-word; }
  .assistant-markdown { font-size:19px; color:#F0EBE3; line-height:1.75; overflow-wrap:anywhere; word-break:break-word; }
  .assistant-markdown p { margin:0 0 12px; }
  .assistant-markdown p:last-child { margin-bottom:0; }
  .assistant-markdown ul, .assistant-markdown ol { margin:8px 0 14px 22px; padding:0; }
  .assistant-markdown li { margin:5px 0; padding-left:3px; }
  .assistant-markdown a { color:#7BC8E8; text-decoration:none; border-bottom:1px solid rgba(123,200,232,0.32); overflow-wrap:anywhere; word-break:break-all; }
  .assistant-markdown code { font-family:"Inter",sans-serif; font-size:0.78em; color:#FFD87A; background:rgba(201,168,76,0.09); border:1px solid rgba(201,168,76,0.16); padding:0.08em 0.32em; border-radius:2px; white-space:break-spaces; overflow-wrap:anywhere; }
  .assistant-markdown pre { max-width:100%; margin:12px 0 16px; padding:13px 14px; overflow:auto; white-space:pre-wrap; overflow-wrap:anywhere; word-break:break-word; background:rgba(255,255,255,0.035); border:1px solid rgba(255,255,255,0.08); border-radius:2px; }
  .assistant-markdown pre code { display:block; padding:0; border:none; background:transparent; color:rgba(240,235,227,0.86); white-space:pre-wrap; }
  .assistant-markdown .markdown-pending { border-color:rgba(123,200,232,0.22); background:rgba(123,200,232,0.045); }
  .state-card { border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); padding:16px 18px; border-radius:2px; }
  .state-card-title { font-size:9px; letter-spacing:2px; color:#7BC8E8; margin-bottom:8px; }
  .state-card-copy { font-size:13px; line-height:1.6; color:var(--text-caption); }
  .skeleton-shimmer { position:relative; overflow:hidden; background:rgba(255,255,255,0.06); border-radius:2px; }
  .skeleton-shimmer:after {
    content:"";
    position:absolute;
    inset:0;
    transform:translateX(-100%);
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent);
    animation:streamShimmer 1.2s linear infinite;
  }
  .proof-btn:hover, .story-card-btn:hover { border-color:rgba(201,168,76,0.65) !important; color:#FFD87A !important; background:rgba(201,168,76,0.08) !important; }
  .compact-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:2px; }
  @media (hover: none), (pointer: coarse) {
    .card-root:hover { border-color:transparent; box-shadow:none; }
    .card-root:hover .card-tagline { color:rgba(240,235,227,0.32) !important; }
    .card-root:hover .card-initials { opacity:1 !important; }
    .card-explore { opacity:1 !important; transform:translateY(0) !important; }
    .interactive-video .video-controls, .timeline-video .video-controls { opacity:1; transform:translateY(0); }
    .interactive-video:hover .video-controls, .timeline-video:hover .video-controls { opacity:1; transform:translateY(0); }
    .video-control-btn:hover, .proof-btn:hover, .story-card-btn:hover, .twin-btn:hover, .back-btn:hover, .suggestion-chip:hover {
      background:inherit;
      color:inherit;
      border-color:inherit;
    }
  }
  @media (pointer: coarse) {
    button, .suggestion-chip, .video-control-btn, .timeline-video, .proof-btn, .story-card-btn, .twin-btn, .back-btn, .cta-glow {
      min-height:44px;
      min-width:44px;
    }
    .video-controls { gap:8px; }
    .twin-input-row { gap:10px; }
    .timeline-story-card-interactive:active { background:rgba(201,168,76,0.16); border-color:rgba(201,168,76,0.44); }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *:before, *:after { animation:none !important; transition:none !important; scroll-behavior:auto !important; }
    .video-media { display:none !important; }
    .video-container .video-poster { z-index:1; opacity:0.76; }
  }
  @media (max-width: 768px) {
    .timeline-video .video-media { display:none !important; }
    .video-container .video-poster { z-index:1; opacity:0.78; transform:none; }
    .media-readable-overlay { background:linear-gradient(180deg,rgba(4,4,4,0.34) 0%,rgba(4,4,4,0.62) 48%,rgba(4,4,4,0.88) 100%),radial-gradient(circle at 50% 32%,rgba(0,0,0,0.18) 0,rgba(0,0,0,0.52) 68%); }
    .media-text-surface { text-shadow:0 2px 16px rgba(0,0,0,0.95),0 1px 2px #000; }
    .scanline-fx, .hero-field, .ring-a, .ring-b, .hotspot, .cta-glow { animation:none !important; }
    .moment-item, .video-controls, .card-root, .card-tagline, .card-explore { transition:none !important; }
    .video-controls { left:calc(10px + var(--safe-left)); right:calc(10px + var(--safe-right)); bottom:max(14px, calc(8px + var(--safe-bottom))); }
    .video-control-btn { min-width:44px; height:44px; font-size:10px; }
    .story-bottom-action-bar { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); }
    .story-has-bottom-bar { padding-bottom:calc(96px + var(--safe-bottom)) !important; }
  }
  @media (max-width: 768px) and (orientation: landscape) {
    .interactive-video { min-height:260px; }
    .video-controls { bottom:max(10px, calc(6px + var(--safe-bottom))); }
    .story-bottom-action-bar { bottom:max(8px, calc(6px + var(--safe-bottom))); }
  }
  @media (max-width: 760px) {
    .hide-mobile { display:none !important; }
    .ricon-nav { padding:calc(18px + var(--safe-top)) calc(18px + var(--safe-right)) 18px calc(18px + var(--safe-left)) !important; }
    .home-hero, .athlete-hero, .story-pad { padding-left:20px !important; padding-right:20px !important; }
    .home-hero { grid-template-columns:1fr !important; padding-top:32px !important; min-height:auto !important; }
    .story-layout, .twin-layout { flex-direction:column !important; }
    .story-main-column { display:contents !important; }
    .story-copy-block { order:1; }
    .story-video-column { display:contents !important; }
    .story-video-block { order:2; }
    .story-scene-controls { order:3; margin-top:22px !important; }
    .story-ai-entry { order:4; width:100%; }
    .story-supporting-card { order:5; margin-top:14px; }
    .story-pad { gap:18px !important; }
    .twin-sidebar { display:none !important; }
    .timeline-wrap { padding:44px 20px 64px !important; }
    .chapter-section { scroll-margin-top:172px; }
    .chapter-kicker { position:static !important; max-width:100%; white-space:normal !important; }
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
    .twin-modal { height:100vh !important; height:100dvh !important; overflow:hidden !important; backdrop-filter:none !important; }
    .twin-header { padding:calc(18px + var(--safe-top)) calc(18px + var(--safe-right)) 18px calc(18px + var(--safe-left)) !important; align-items:flex-start !important; gap:14px !important; flex-wrap:wrap !important; }
    .twin-title { width:100% !important; }
    .twin-title .bebas { font-size:34px !important; line-height:1.1 !important; }
    .twin-mode-toggle { order:2 !important; flex:1 1 auto !important; min-width:0 !important; }
    .twin-mode-toggle { width:100% !important; }
    .twin-mode-toggle button { flex:1 !important; min-height:44px !important; padding:12px 10px !important; }
    .twin-close { order:3 !important; flex:0 0 auto !important; min-height:44px !important; min-width:44px !important; padding:12px 14px !important; }
    .twin-layout { min-height:0 !important; overflow:hidden !important; }
    .twin-chat { padding:42px calc(20px + var(--safe-right)) 28px calc(20px + var(--safe-left)) !important; overflow-y:auto !important; overflow-x:hidden !important; -webkit-overflow-scrolling:touch; }
    .twin-empty { padding-top:28px !important; }
    .twin-prompt-row { flex-direction:column !important; align-items:stretch !important; }
    .twin-prompt-row button { width:100% !important; min-height:44px !important; padding:13px 14px !important; line-height:1.5 !important; }
    .suggestion-row { flex-direction:column !important; align-items:stretch !important; }
    .suggestion-chip { width:100% !important; min-height:44px !important; padding:13px 14px !important; }
    .twin-input-bar { padding:16px calc(18px + var(--safe-right)) max(20px, calc(12px + var(--safe-bottom))) calc(18px + var(--safe-left)) !important; position:sticky !important; bottom:0 !important; background:rgba(4,4,4,0.96) !important; z-index:25 !important; }
    .twin-input-row { flex-direction:column !important; }
    .twin-input-row input, .twin-input-row textarea, .twin-input-row button { width:100% !important; min-height:54px !important; }
    .twin-input-row > * + * { margin-top:8px; }
    .twin-narrator-actions { position:sticky !important; bottom:0 !important; background:rgba(4,4,4,0.96) !important; padding-left:calc(18px + var(--safe-left)) !important; padding-right:calc(18px + var(--safe-right)) !important; padding-bottom:max(20px, calc(12px + var(--safe-bottom))) !important; }
    .twin-narrator-actions .twin-btn { min-height:44px !important; }
    .twin-message-user { max-width:86% !important; }
    .assistant-markdown { font-size:17px !important; line-height:1.68 !important; }
    .assistant-markdown pre { font-size:12px; }
    .voice-panel { align-items:flex-start !important; flex-direction:column !important; }
    .story-title-mobile-fit { font-size:clamp(38px,12vw,66px) !important; letter-spacing:3px !important; line-height:0.94 !important; }
    .story-context-mobile-fit { font-size:clamp(18px,5.2vw,24px) !important; line-height:1.42 !important; }
    .home-headline-mobile-fit { font-size:clamp(46px,16vw,88px) !important; letter-spacing:4px !important; line-height:0.9 !important; }
    .home-hero { gap:22px !important; }
    .timeline-video, .interactive-video { max-width:100% !important; }
    .story-layout *, .twin-layout * { max-width:100%; }
  }
  @media (max-width: 480px) {
    .story-pad { padding-top:30px !important; }
    .story-scene-controls .story-card-btn, .story-scene-controls .cta-glow { flex:1 1 100%; justify-content:center; text-align:center; }
    .twin-chat { padding-top:26px !important; }
    .twin-header { gap:10px !important; }
    .twin-title .bebas { font-size:30px !important; }
    .story-bottom-action-bar { grid-template-columns:repeat(2,minmax(0,1fr)); }
  }
  @media (max-width: 360px) {
    .ricon-nav, .twin-header, .twin-chat, .twin-input-bar { padding-left:calc(14px + var(--safe-left)) !important; padding-right:calc(14px + var(--safe-right)) !important; }
    .twin-title .bebas { font-size:30px !important; letter-spacing:3px !important; }
  }
  @supports (height: 100svh) {
    .ricon-root { min-height:100svh; }
    .story-shell { min-height:100svh; }
    .twin-modal { height:100svh; }
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
      {y:"1998",era:"Dynasty II",type:"iconic",title:"The Last Shot — Utah, Game 6",body:"5.2 seconds. Down one. Jordan strips the ball from Karl Malone, pushes off Byron Russell, rises and releases. The net moves. Six championships. Six Finals MVPs. One perfect, permanent exit.",src:"NBA Finals Records, June 14 1998",captionSrc:"/captions/jordan-last-shot.vtt",transcript:"[00:00] Delta Center. Finals Game 6.\n[00:08] Jordan strips Malone at the elbow.\n[00:14] He rises over Russell and releases.\n[00:19] The shot drops. Chicago closes the dynasty.",chapters:[{id:"setup",label:"Final possession setup",startTime:0,endTime:8,description:"Chicago sets up the final possession with the score tight."},{id:"steal",label:"Steal on Malone",startTime:8,endTime:14,description:"Jordan reads the post entry and strips Malone cleanly."},{id:"jumper",label:"Pull-up jumper",startTime:14,endTime:19,description:"Jordan crosses into space and rises over Russell."},{id:"close",label:"Championship close",startTime:19,endTime:24,description:"The shot falls and closes the Bulls dynasty in Utah."}],hotspots:[{id:"stakes",label:"High Stakes",description:"Chicago is down one with seconds remaining. One possession decides the title.",startTime:1,endTime:8,x:24,y:24,type:"context"},{id:"steal-source",label:"Verified Source",description:"Primary record: NBA Finals play-by-play and official game report (June 14, 1998).",startTime:8,endTime:14,x:72,y:26,type:"source"},{id:"legacy-quote",label:"Legacy Quote",description:"This sequence became the defining image of Jordan's sixth championship run.",startTime:14,endTime:20,x:58,y:66,type:"quote"},{id:"collectible",label:"Collectible Context",description:"This frame anchors a legacy-proof collectible moment in the RICON archive.",startTime:19,endTime:24,x:30,y:68,type:"collectible"}]},
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
const videoPosterFor = (athlete, moment) => {
  const cfg = TYPE_CONFIG[moment.type] || TYPE_CONFIG.iconic;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
    <rect width="1200" height="675" fill="#090909"/>
    <radialGradient id="a" cx="32%" cy="28%" r="48%"><stop offset="0" stop-color="#7BC8E8" stop-opacity=".28"/><stop offset="1" stop-color="#7BC8E8" stop-opacity="0"/></radialGradient>
    <radialGradient id="b" cx="72%" cy="68%" r="54%"><stop offset="0" stop-color="${cfg.color}" stop-opacity=".3"/><stop offset="1" stop-color="${cfg.color}" stop-opacity="0"/></radialGradient>
    <rect width="1200" height="675" fill="url(#a)"/>
    <rect width="1200" height="675" fill="url(#b)"/>
    <g fill="none" stroke="#ffffff" stroke-opacity=".06">${Array.from({ length: 36 }, (_, i) => `<path d="M0 ${i * 20}H1200"/>`).join("")}</g>
    <text x="78" y="118" fill="#7BC8E8" font-family="Inter, sans-serif" font-size="22" letter-spacing="10">RICON STORYLINE</text>
    <text x="78" y="388" fill="#F0EBE3" font-family="Inter, sans-serif" font-size="168" letter-spacing="14">${athlete.initials}</text>
    <text x="82" y="456" fill="#C9A84C" font-family="Inter, sans-serif" font-size="24" letter-spacing="7">${moment.y} - ${cfg.label}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
const videoAssetsFor = (athlete, moment) => ({
  poster: moment?.video?.poster || videoPosterFor(athlete, moment),
  poster2x: moment?.video?.poster2x || moment.poster2x || moment.posterSrcSet2x || "",
  webm: moment?.video?.webm || moment.videoWebm,
  mp4: moment?.video?.mp4 || moment.videoMp4,
  // Add caption files per moment with `captionSrc` or `captionVtt`.
  captions: moment?.captions?.src || moment.captionSrc || moment.captionVtt || moment.captionsVtt,
});
const transcriptDataFor = (athlete, moment) => {
  const fallback = {
    text: `Transcript coming soon for "${moment.title}".\n\nWe are preparing a full, searchable transcript for this verified chapter.\n\nVerified source: ${moment.src}`,
    chapters: [],
    isPlaceholder: true
  };
  if (!moment?.transcript) return fallback;
  return {
    text: moment.transcript,
    chapters: Array.isArray(moment.chapters) ? moment.chapters : [],
    isPlaceholder: false
  };
};
const timeToSeconds = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
  if (typeof value !== "string") return null;
  const parts = value.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return null;
  if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  if (parts.length === 2) return (parts[0] * 60) + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
};
const chapterMarkersFor = (moment) => {
  const raw = Array.isArray(moment?.chapters) ? moment.chapters : [];
  if (!raw.length) return [];
  const normalized = raw.map((chapter, index) => {
    const start = timeToSeconds(chapter.startTime ?? chapter.time);
    const end = timeToSeconds(chapter.endTime);
    const markerId = chapter.id || `chapter-marker-${index + 1}`;
    return {
      id: markerId,
      label: chapter.label || `Chapter ${index + 1}`,
      startTime: start ?? 0,
      endTime: Number.isFinite(end) ? Math.max(end, start ?? 0) : null,
      description: chapter.description || chapter.label || `Chapter ${index + 1}`
    };
  });
  return normalized.sort((a, b) => a.startTime - b.startTime).map((chapter, index, arr) => ({
    ...chapter,
    endTime: chapter.endTime ?? (arr[index + 1]?.startTime ?? chapter.startTime + 6)
  }));
};
const hotspotDataFor = (moment) => {
  const raw = Array.isArray(moment?.hotspots) ? moment.hotspots : [];
  if (!raw.length) return [];
  return raw
    .map((hotspot, index) => {
      const startTime = timeToSeconds(hotspot.startTime);
      const endTime = timeToSeconds(hotspot.endTime);
      const x = Number(hotspot.x);
      const y = Number(hotspot.y);
      return {
        id: hotspot.id || `hotspot-${index + 1}`,
        label: hotspot.label || `Hotspot ${index + 1}`,
        description: hotspot.description || "Additional verified context for this moment.",
        startTime: Number.isFinite(startTime) ? Math.max(0, startTime) : 0,
        endTime: Number.isFinite(endTime) ? Math.max(0, endTime) : ((Number.isFinite(startTime) ? startTime : 0) + 5),
        x: Number.isFinite(x) ? Math.min(Math.max(x, 8), 92) : 50,
        y: Number.isFinite(y) ? Math.min(Math.max(y, 16), 74) : 45,
        type: hotspot.type || "context"
      };
    })
    .sort((a, b) => a.startTime - b.startTime);
};
const slugify = (value = "") => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "story";
const estimateReadTimeFor = (text = "") => {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
  if (!words) return "1 min read";
  return `${Math.max(1, Math.round(words / 160))} min read`;
};
const normalizeScene = ({ storyId, storyTitle, defaultEyebrow, sourceReference }, scene, index = 0) => {
  const fallbackTitle = ["Setup", "Moment", "Legacy"][index] || `Scene ${index + 1}`;
  const body = scene?.body || scene?.text || "";
  return {
    id: scene?.id || `${storyId}-scene-${index + 1}`,
    title: scene?.title || fallbackTitle,
    eyebrow: scene?.eyebrow || defaultEyebrow,
    body: body || `${storyTitle} scene detail is coming soon.`,
    duration: scene?.duration || estimateReadTimeFor(body),
    estimatedReadTime: scene?.estimatedReadTime || estimateReadTimeFor(body),
    visualState: scene?.visualState || "cinematic",
    aiContext: scene?.aiContext || `Focus on verified context for ${storyTitle} and keep narrative grounded in documented record.`,
    sourceReferences: Array.isArray(scene?.sourceReferences) && scene.sourceReferences.length
      ? scene.sourceReferences
      : (sourceReference ? [sourceReference] : [])
  };
};
const normalizeStoryData = (athlete, moment, index = 0) => {
  const title = moment?.title || `Story ${index + 1}`;
  const slug = moment?.slug || slugify(`${athlete?.id || "athlete"}-${moment?.y || index + 1}-${title}`);
  const storyId = moment?.id || `${athlete?.id || "athlete"}-${index + 1}-${slug}`;
  const sourceReference = moment?.src || "";
  const fallbackScenes = [
    { title: "Setup", eyebrow: `${moment?.y || "—"} · ${moment?.era || "Era"}`, body: `${athlete?.name || "The athlete"} enters a defining chapter: ${title}.` },
    { title: "Moment", eyebrow: "Verified record", body: moment?.body || "This verified chapter is being prepared." },
    { title: "Legacy", eyebrow: "Why it matters", body: `${title} becomes part of the larger legacy arc: the moment fans remember, revisit, ask about, and eventually collect.` }
  ];
  const rawScenes = Array.isArray(moment?.scenes) && moment.scenes.length ? moment.scenes : fallbackScenes;
  const scenes = rawScenes.map((scene, sceneIndex) => normalizeScene({ storyId, storyTitle: title, defaultEyebrow: `${moment?.y || "—"} · ${moment?.era || "Era"}`, sourceReference }, scene, sceneIndex));
  const collectible = moment?.collectible || collectibleFor(athlete, moment, index);
  const relatedStories = Array.isArray(moment?.relatedStories) && moment.relatedStories.length
    ? moment.relatedStories
    : (athlete?.moments || [])
      .filter((candidate, candidateIndex) => candidateIndex !== index)
      .slice(0, 3)
      .map((candidate, relatedIndex) => ({
        id: candidate.id || `${athlete.id}-related-${relatedIndex + 1}`,
        slug: candidate.slug || slugify(`${athlete.id}-${candidate.y}-${candidate.title}`),
        title: candidate.title,
        year: candidate.y
      }));
  const normalized = {
    ...moment,
    id: storyId,
    slug,
    title,
    subtitle: moment?.subtitle || `${moment?.y || "—"} · ${moment?.era || "Era"}`,
    person: moment?.person || moment?.talent || { id: athlete?.id, name: athlete?.name, initials: athlete?.initials },
    talent: moment?.talent || { id: athlete?.id, name: athlete?.name, initials: athlete?.initials },
    year: moment?.year || moment?.y || "",
    date: moment?.date || moment?.y || "",
    verificationStatus: moment?.verificationStatus || "verified",
    sourceStatus: moment?.sourceStatus || (sourceReference ? "source-cited" : "draft"),
    summary: moment?.summary || moment?.body || "",
    scenes,
    video: moment?.video || {
      poster: videoPosterFor(athlete, moment),
      webm: moment?.videoWebm || "",
      mp4: moment?.videoMp4 || ""
    },
    captions: moment?.captions || { src: moment?.captionSrc || moment?.captionVtt || moment?.captionsVtt || "" },
    transcript: moment?.transcript || "",
    chapters: Array.isArray(moment?.chapters) ? moment.chapters : [],
    hotspots: Array.isArray(moment?.hotspots) ? moment.hotspots : [],
    suggestedPrompts: Array.isArray(moment?.suggestedPrompts) && moment.suggestedPrompts.length
      ? moment.suggestedPrompts
      : [
          `What should I notice in "${title}"?`,
          `Why does "${title}" matter to the legacy arc?`,
          `What verified source context anchors "${title}"?`
        ],
    collectible,
    marketplace: collectible,
    relatedStories
  };
  return normalized;
};
const storyPanelsFor = (athlete, moment) => {
  const story = normalizeStoryData(athlete, moment, 0);
  return story.scenes.map((scene, index) => ({
    k: scene.title.toUpperCase(),
    t: scene.eyebrow || `${story.year} · ${moment?.era || "Era"}`,
    b: scene.body,
    id: scene.id,
    duration: scene.duration,
    aiContext: scene.aiContext,
    sourceReferences: scene.sourceReferences,
    visualState: scene.visualState,
    estimatedReadTime: scene.estimatedReadTime,
    index
  }));
};
const chaptersFor = (athlete) => athlete.moments.map((rawMoment, index) => {
  const moment = normalizeStoryData(athlete, rawMoment, index);
  return ({
  id: `chapter-${index + 1}`,
  number: index + 1,
  athlete,
  moment,
  title: moment.title,
  era: moment.era,
  year: moment.y,
  });
});
const chapterNumberFromHash = (hash = window.location.hash) => {
  const match = hash.match(/^#chapter-(\d+)(?:\/scene-\d+)?$/);
  return match ? Number(match[1]) : null;
};
const sceneNumberFromHash = (hash = window.location.hash) => {
  const match = hash.match(/^#chapter-\d+\/scene-(\d+)$/);
  return match ? Number(match[1]) : null;
};
const chapterSceneHash = (chapterNumber, sceneNumber = 1) => `#chapter-${chapterNumber}/scene-${sceneNumber}`;
const STORY_PROGRESS_KEY = "ricon.storyProgress.v1";
const loadStoryProgress = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORY_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};
const saveStoryProgress = (value) => {
  if (typeof window === "undefined") return;
  try {
    if (!value) {
      window.localStorage.removeItem(STORY_PROGRESS_KEY);
      return;
    }
    window.localStorage.setItem(STORY_PROGRESS_KEY, JSON.stringify(value));
  } catch {
    // Ignore localStorage write failures.
  }
};
const chapterForContext = (athlete, moment, hash = window.location.hash) => {
  const chapters = chaptersFor(athlete);
  const momentIndex = moment ? athlete.moments.findIndex((item) => item === moment || item.title === moment.title) : -1;
  if (momentIndex >= 0) return chapters[momentIndex];
  const hashNumber = chapterNumberFromHash(hash);
  return chapters[Math.min(Math.max((hashNumber || 1) - 1, 0), chapters.length - 1)] || chapters[0];
};
const isKnownAppPath = (pathname = window.location.pathname) => (
  pathname === "/" || pathname === "/index.html" || /^\/stories\/[^/]+\/?$/.test(pathname)
);
const storySlugFromPath = (pathname = window.location.pathname) => {
  const match = pathname.match(/^\/stories\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
};
const suggestionConfigFor = (athlete) => Object.fromEntries(chaptersFor(athlete).map((chapter) => {
  const firstName = athlete.name.split(" ")[0];
  const scene = chapter.title;
  const year = chapter.year;
  return [chapter.id, {
    starter: [
      { label: "What should I notice here?", prompt: `In ${year}, during "${scene}", what should I notice that most fans miss?` },
      { label: "Ask what this moment means", prompt: `As ${firstName}, explain what "${scene}" meant in the larger story of your career.` },
      { label: "Go deeper on this scene", prompt: `Take me deeper into "${scene}". What pressure, choice, or turning point defines this chapter?` },
    ],
    followup: [
      { label: "Continue from this point", prompt: `Continue the story from "${scene}" and connect it to the next defining chapter.` },
      { label: "Explain the motivation", prompt: `What motivation was driving ${firstName} in "${scene}"? Keep it grounded in the verified record.` },
      { label: "Show the legacy impact", prompt: `Why does "${scene}" still matter to the legacy today?` },
    ],
  }];
}));
const suggestionsFor = (athlete, chapter, phase = "starter") => {
  const config = suggestionConfigFor(athlete);
  return (config[chapter?.id]?.[phase] || config["chapter-1"]?.[phase] || []).slice(0, 3);
};
const LazyTwinModal = lazy(() => import("./src/TwinModal.jsx"));
const TWIN_PERSONA = {
  id: "legacy-archivist",
  name: "The Archivist",
  icon: "◉",
  avatarGlyph: "AR",
  versionLabel: "ARCHIVIST v1.0",
  badgeLabel: "PREMIUM STORY COMPANION",
  emptyState: {
    narratorHeadline: "Composing your opening scene...",
    qaHeadline: "The record is open. Ask with intent.",
    description: "I map verified moments into cinematic context, answer with source-grounded clarity, and keep every response faithful to the documented legacy.",
    trustLine: "EVERY ANSWER IS GROUNDED IN THE VERIFIED RICON RECORD.",
  },
  toneGuidance: {
    qa: "Best results: ask precise, chapter-aware questions for sharper narrative detail.",
    narrator: "This companion speaks in premium, cinematic, source-grounded language.",
  },
  chapterIntroLine: (chapter, athlete) => (
    chapter
      ? `Now entering Chapter ${chapter.number}: ${chapter.title} (${chapter.year}) in ${athlete.name}'s timeline.`
      : null
  ),
};
const APP_CONFIG = {
  hapticsEnabled: true,
};
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => (
    typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false
  ));

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, [query]);

  return matches;
};
const isSafeUrl = (url) => /^https?:\/\//i.test(url) || /^mailto:/i.test(url);
const renderInlineMarkdown = (text, keyPrefix = "inline") => {
  const parts = [];
  const pattern = /(\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|https?:\/\/[^\s<)]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const [raw, , linkText, linkUrl, code, bold, italic] = match;
    const key = `${keyPrefix}-${match.index}`;

    if (linkText && isSafeUrl(linkUrl)) {
      parts.push(<a key={key} href={linkUrl} target="_blank" rel="noreferrer">{linkText}</a>);
    } else if (code) {
      parts.push(<code key={key}>{code}</code>);
    } else if (bold) {
      parts.push(<strong key={key}>{bold}</strong>);
    } else if (italic) {
      parts.push(<span key={key}>{italic}</span>);
    } else if (isSafeUrl(raw)) {
      parts.push(<a key={key} href={raw} target="_blank" rel="noreferrer">{raw}</a>);
    } else {
      parts.push(raw);
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
};

function SafeMarkdown({ content, streaming }) {
  const lines = String(content || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = null;
  let fence = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(" ");
    blocks.push(<p key={`p-${blocks.length}`}>{renderInlineMarkdown(text, `p-${blocks.length}`)}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={`list-${blocks.length}`}>
        {list.items.map((item, index) => <li key={index}>{renderInlineMarkdown(item, `li-${blocks.length}-${index}`)}</li>)}
      </Tag>
    );
    list = null;
  };

  lines.forEach((line) => {
    const fenceMatch = line.match(/^```([\w-]+)?\s*$/);
    if (fenceMatch) {
      if (fence) {
        blocks.push(
          <pre key={`code-${blocks.length}`}>
            <code>{fence.lines.join("\n")}</code>
          </pre>
        );
        fence = null;
      } else {
        flushParagraph(); flushList();
        fence = { lang: fenceMatch[1] || "", lines: [] };
      }
      return;
    }

    if (fence) {
      fence.lines.push(line);
      return;
    }

    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const orderedList = Boolean(ordered);
      if (!list || list.ordered !== orderedList) flushList();
      if (!list) list = { ordered: orderedList, items: [] };
      list.items.push((unordered || ordered)[1]);
      return;
    }

    if (!line.trim()) {
      flushParagraph(); flushList();
      return;
    }

    paragraph.push(line.trim());
  });

  flushParagraph(); flushList();
  if (fence) {
    blocks.push(
      <pre key={`pending-code-${blocks.length}`} className="markdown-pending" aria-label={streaming ? "Streaming code block preview" : "Incomplete code block"}>
        <code>{fence.lines.join("\n")}</code>
      </pre>
    );
  }

  return <div className="assistant-markdown cormorant">{blocks.length ? blocks : null}</div>;
}
function SuggestionChips({ suggestions, onSelect, disabled = false, label = "Suggested prompts" }) {
  if (!suggestions.length) return null;
  return (
    <div aria-label={label} className="suggestion-row twin-prompt-row">
      {suggestions.map((suggestion) => (
        <button
          key={`${suggestion.label}-${suggestion.prompt}`}
          type="button"
          className="suggestion-chip"
          onClick={() => onSelect(suggestion.prompt)}
          disabled={disabled}
          aria-label={`${suggestion.label}: send suggested prompt`}
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}

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
7. Reference specific years and moments when relevant to ground your answer in fact.
8. Clearly separate VERIFIED RECORD from NARRATIVE INTERPRETATION.
9. Never claim unsupported facts are verified.
10. If uncertain or outside record, transparently state the limitation.`;

export default function RICONStoryline() {
  const initialChapter = chapterNumberFromHash();
  const initialStorySlug = storySlugFromPath();
  const routeMissing = !isKnownAppPath();
  const [screen, setScreen] = useState(initialStorySlug ? "story-experience" : (initialChapter ? "athlete" : "home"));
  const [athlete, setAthlete] = useState(initialChapter ? getFeaturedAthlete() : null);
  const [moment, setMoment] = useState(null);
  const [momentIndex, setMomentIndex] = useState(0);
  const [twinOpen, setTwinOpen] = useState(false);
  const [twinMode, setTwinMode] = useState("narrator");
  const [savedStoryProgress, setSavedStoryProgress] = useState(() => loadStoryProgress());
  const [timelineReturnContext, setTimelineReturnContext] = useState(null);
  const twinTriggerRef = useRef(null);

  const openAthlete = (a) => { setAthlete(a); setScreen("athlete"); };
  const openStory = (a, m, i = 0, sceneNumber = 1, options = null) => {
    triggerHaptic("primary");
    window.history.pushState(null, "", chapterSceneHash(i + 1, sceneNumber));
    if (options?.fromTimeline && options.timelineContext) {
      setTimelineReturnContext(options.timelineContext);
    }
    setAthlete(a); setMoment(normalizeStoryData(a, m, i)); setMomentIndex(i); setScreen("story");
  };
  const goHome = () => {
    window.history.pushState(null, "", "/");
    setScreen("home"); setAthlete(null); setMoment(null); setTwinOpen(false);
  };
  const openStoryExperience = (slug = michaelJordanLastShotStory.slug) => {
    window.history.pushState(null, "", `/stories/${encodeURIComponent(slug)}`);
    setScreen("story-experience");
    setTwinOpen(false);
  };
  const backToAthlete = () => { setScreen("athlete"); setMoment(null); };
  const openTwin = (mode) => {
    triggerHaptic("success");
    if (typeof document !== "undefined") twinTriggerRef.current = document.activeElement;
    setTwinMode(mode); setTwinOpen(true);
  };
  const closeTwin = () => {
    setTwinOpen(false);
    window.setTimeout(() => {
      if (twinTriggerRef.current && typeof twinTriggerRef.current.focus === "function") {
        twinTriggerRef.current.focus();
      }
    }, 0);
  };
  const persistStoryProgress = ({ athleteId, chapterNumber, sceneNumber, videoTime = 0 }) => {
    const next = {
      athleteId,
      chapterNumber: Math.max(1, Number(chapterNumber) || 1),
      sceneNumber: Math.max(1, Number(sceneNumber) || 1),
      videoTime: Math.max(0, Number(videoTime) || 0),
      updatedAt: Date.now()
    };
    saveStoryProgress(next);
    setSavedStoryProgress(next);
  };
  const clearStoryProgress = ({ athleteId, chapterNumber } = {}) => {
    if (athleteId && chapterNumber && savedStoryProgress?.athleteId === athleteId && savedStoryProgress?.chapterNumber === chapterNumber) {
      saveStoryProgress(null);
      setSavedStoryProgress(null);
      return;
    }
    if (!athleteId && !chapterNumber) {
      saveStoryProgress(null);
      setSavedStoryProgress(null);
    }
  };
  const continueSavedStory = () => {
    const saved = savedStoryProgress;
    if (!saved?.athleteId) return;
    const savedAthlete = ATHLETES.find((item) => item.id === saved.athleteId);
    if (!savedAthlete) return;
    const savedIndex = Math.min(Math.max((saved.chapterNumber || 1) - 1, 0), savedAthlete.moments.length - 1);
    const savedMoment = savedAthlete.moments[savedIndex];
    if (!savedMoment) return;
    openStory(savedAthlete, savedMoment, savedIndex, saved.sceneNumber || 1);
  };
  const openFeaturedStoryGuide = () => {
    const featuredAthlete = getFeaturedAthlete();
    const featuredMoment = getFeaturedMoment();
    setAthlete(featuredAthlete);
    setMoment(normalizeStoryData(featuredAthlete, featuredMoment, FEATURED.momentIndex));
    setMomentIndex(FEATURED.momentIndex);
    openTwin("qa");
  };

  useEffect(() => {
    configureHaptics({ enabled: APP_CONFIG.hapticsEnabled });
  }, []);

  useEffect(() => {
    const syncRoute = () => {
      if (storySlugFromPath()) {
        setScreen("story-experience");
        setTwinOpen(false);
        return;
      }
      if (chapterNumberFromHash()) {
        setAthlete((current) => current || getFeaturedAthlete());
        setScreen((current) => (current === "story" ? current : "athlete"));
        return;
      }
      if (isKnownAppPath()) {
        setScreen("home");
        setAthlete(null);
        setMoment(null);
        setTwinOpen(false);
      }
    };
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useEffect(() => {
    const featuredAthlete = getFeaturedAthlete();
    const featuredMoment = getFeaturedMoment();
    const href = videoPosterFor(featuredAthlete, featuredMoment);
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = href;
    link.fetchPriority = "high";
    document.head.appendChild(link);
    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <ErrorBoundary scopeLabel="application shell">
      <div className="ricon-root">
        {routeMissing && <NotFoundScreen onHome={goHome} />}
        {!routeMissing && (
          <>
        {screen === "home" && <HomeScreen onSelect={openAthlete} onStory={openStory} onStoryExperience={openStoryExperience} onAskAI={openFeaturedStoryGuide} savedStoryProgress={savedStoryProgress} onContinueSavedStory={continueSavedStory} onRestartSavedStory={() => clearStoryProgress()} />}
        {screen === "athlete" && athlete && (
          <AthleteScreen athlete={athlete} onBack={goHome} onTwin={openTwin} onStory={openStory} timelineReturnContext={timelineReturnContext} onClearTimelineContext={() => setTimelineReturnContext(null)} />
        )}
        {screen === "story" && athlete && moment && (
          <StoryView athlete={athlete} moment={moment} momentIndex={momentIndex} onBack={backToAthlete} onHome={goHome} onTwin={openTwin} onPersistProgress={persistStoryProgress} onRestartProgress={clearStoryProgress} initialVideoTime={savedStoryProgress?.athleteId === athlete.id && savedStoryProgress?.chapterNumber === (momentIndex + 1) ? savedStoryProgress.videoTime : 0} twinOpen={twinOpen} />
        )}
        {screen === "story-experience" && (
          <StoryExperiencePage slug={storySlugFromPath()} onHome={goHome} />
        )}
        {twinOpen && athlete && (
          <ErrorBoundary scopeLabel="AI companion" resetKeys={[athlete?.id, moment?.title, twinMode]}>
            <Suspense fallback={<div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(4,4,4,0.94)", display: "grid", placeItems: "center", padding: 20 }}><div style={{ width: "min(560px,100%)" }}><LoadingState label="Loading companion" message="Opening the verified companion channel..." /></div></div>}>
              <LazyTwinModal
                athlete={athlete}
                moment={moment}
                mode={twinMode}
                onClose={closeTwin}
                onSwitchMode={(m) => setTwinMode(m)}
                chapterForContext={chapterForContext}
                suggestionsFor={suggestionsFor}
                buildSystemPrompt={buildSystemPrompt}
                persona={TWIN_PERSONA}
              />
            </Suspense>
          </ErrorBoundary>
        )}
          </>
        )}
      </div>
      </ErrorBoundary>
    </>
  );
}

// ─── HOME ────────────────────────────────────────────────────────────────────
function NotFoundScreen({ onHome }) {
  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "40px 20px" }}>
      <div className="story-panel" style={{ width: "min(680px,100%)", padding: "32px 26px", textAlign: "center" }}>
        <div className="mono" style={{ fontSize: 9, color: "#7BC8E8", letterSpacing: 3, marginBottom: 12 }}>RICON STORYLINE · NOT FOUND</div>
        <div className="bebas gold-text" style={{ fontSize: "clamp(44px,9vw,76px)", letterSpacing: 5, lineHeight: 0.95, marginBottom: 14 }}>Chapter Not Found</div>
        <div className="cormorant" style={{ fontSize: "clamp(19px,4vw,28px)", color: "rgba(240,235,227,0.75)", lineHeight: 1.45, marginBottom: 18 }}>
          This page is outside the verified storyline archive.
        </div>
        <div style={{ fontSize: 14, color: "rgba(240,235,227,0.52)", lineHeight: 1.65, marginBottom: 24 }}>
          The chapter or route you requested could not be found. Return to the main storyline and continue from a verified moment.
        </div>
        <button onClick={onHome} className="cta-glow mono" style={{ fontSize: 10, letterSpacing: 2, padding: "13px 20px", background: "linear-gradient(135deg,#C9A84C,#FFD87A)", color: "#080808", border: "none", cursor: "pointer", borderRadius: 2 }}>
          ← RETURN TO STORYLINE
        </button>
      </div>
    </div>
  );
}

function HomeScreen({ onSelect, onStory, onStoryExperience, onAskAI, savedStoryProgress, onContinueSavedStory, onRestartSavedStory }) {
  const featuredAthlete = getFeaturedAthlete();
  const featuredMoment = getFeaturedMoment();
  const openFeaturedExperience = () => onStoryExperience(michaelJordanLastShotStory.slug);
  const [heroLoading, setHeroLoading] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setHeroLoading(false), 260);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div style={{ minHeight: "100dvh", animation: "fadeIn 0.6s ease" }}>
      {/* Nav */}
      <nav className="ricon-nav" style={{ padding: "calc(26px + var(--safe-top)) calc(40px + var(--safe-right)) 26px calc(40px + var(--safe-left))", display: "flex", alignItems: "center", gap: "14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="bebas" style={{ fontSize: 20, letterSpacing: 5, color: "#C9A84C" }}>RICON</span>
        <div style={{ width: 1, height: 20, background: "#2a2a2a" }} />
        <span className="bebas" style={{ fontSize: 20, letterSpacing: 5, color: "rgba(240,235,227,0.45)" }}>STORYLINE</span>
        <div style={{ flex: 1 }} />
        <div className="mono" style={{ fontSize: 9, letterSpacing: 2, color: "#C9A84C", padding: "6px 12px", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 2 }}>
          POC — INVESTOR DEMO 2026
        </div>
      </nav>

      {heroLoading ? (
        <div className="home-hero" style={{ padding: "58px 40px 48px", minHeight: "calc(100dvh - 92px)", display: "grid", alignItems: "center" }}>
          <LoadingState label="Loading featured story" message="Preparing the verified opening chapter." />
        </div>
      ) : (
        <FeaturedStoryHero
          story={michaelJordanLastShotStory}
          onWatch={openFeaturedExperience}
          onTimeline={() => onSelect(featuredAthlete)}
          onAskAI={onAskAI}
        />
      )}

      <ExperienceModeSection
        onWatch={openFeaturedExperience}
        onExplore={() => onSelect(featuredAthlete)}
        onAsk={onAskAI}
      />

      <FeaturedTimelinePreview
        story={michaelJordanLastShotStory}
        onViewMoment={openFeaturedExperience}
      />

      <AIPromptDemo />

      <StoryLibraryPreview
        onSelect={openFeaturedExperience}
      />

      <VerificationSection />

      {savedStoryProgress?.athleteId && (
        <div style={{ padding: "18px 40px 0", display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="story-card-btn" onClick={onContinueSavedStory}
            style={{ fontFamily: '"Inter"', fontSize: 10, letterSpacing: 2, padding: "14px 22px", background: "rgba(123,200,232,0.08)", color: "#7BC8E8", border: "1px solid rgba(123,200,232,0.36)", cursor: "pointer", borderRadius: 2 }}>
            CONTINUE WHERE YOU LEFT OFF
          </button>
          <button className="story-card-btn" onClick={onRestartSavedStory}
            style={{ fontFamily: '"Inter"', fontSize: 10, letterSpacing: 2, padding: "14px 22px", background: "rgba(255,255,255,0.02)", color: "#8f8f8f", border: "1px solid rgba(255,255,255,0.16)", cursor: "pointer", borderRadius: 2 }}>
            RESTART SAVED STORY
          </button>
        </div>
      )}

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
      <div className="cormorant card-tagline" style={{ fontSize: 13, color: "rgba(240,235,227,0.32)", lineHeight: 1.55, marginBottom: 14, transition: "color 0.3s" }}>
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
function AthleteScreen({ athlete, onBack, onTwin, onStory, timelineReturnContext = null, onClearTimelineContext = null }) {
  const leadMoment = athlete.moments.find(m => m.type === "championship" || m.type === "iconic") || athlete.moments[0];
  const leadIndex = athlete.moments.indexOf(leadMoment);
  const chapters = useMemo(() => chaptersFor(athlete), [athlete]);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [activeChapter, setActiveChapter] = useState(() => Math.min(Math.max(chapterNumberFromHash() || 1, 1), chapters.length));
  const isProgrammaticScroll = useRef(Boolean(chapterNumberFromHash()));
  const activeChapterRef = useRef(activeChapter);
  const chapterRafRef = useRef(null);
  const didRestoreRef = useRef(false);
  const hasReturnContext = timelineReturnContext?.athleteId === athlete.id;
  const [timelineLoading, setTimelineLoading] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setTimelineLoading(false), 280);
    return () => window.clearTimeout(id);
  }, [athlete.id]);
  useEffect(() => {
    activeChapterRef.current = activeChapter;
  }, [activeChapter]);

  useEffect(() => {
    const scrollToChapter = (chapterNumber, behavior = "smooth") => {
      const nextChapter = Math.min(Math.max(chapterNumber || 1, 1), chapters.length);
      const target = document.getElementById(`chapter-${nextChapter}`);
      if (!target) return;
      isProgrammaticScroll.current = true;
      setActiveChapter(nextChapter);
      target.scrollIntoView({ behavior, block: "start" });
      window.setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, behavior === "auto" ? 1200 : 800);
    };

    const hashChapter = chapterNumberFromHash();
    if (hashChapter) window.setTimeout(() => scrollToChapter(hashChapter, "auto"), 0);

    const onHashChange = () => {
      const next = chapterNumberFromHash();
      if (next) scrollToChapter(next);
    };
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onHashChange);
    };
  }, [chapters.length]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      let bestEntry = null;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) bestEntry = entry;
      }
      if (!bestEntry || isProgrammaticScroll.current) return;
      const next = Number(bestEntry.target.dataset.chapter);
      if (!next || next === activeChapterRef.current) return;
      if (chapterRafRef.current) cancelAnimationFrame(chapterRafRef.current);
      chapterRafRef.current = requestAnimationFrame(() => {
        activeChapterRef.current = next;
        setActiveChapter(next);
        triggerHaptic("chapter");
        if (chapterNumberFromHash(window.location.hash) !== next) {
          window.history.replaceState(null, "", `#chapter-${next}`);
        }
      });
    }, { rootMargin: "-35% 0px -45% 0px", threshold: [0.15, 0.35, 0.6] });

    chapters.forEach((chapter) => {
      const node = document.getElementById(chapter.id);
      if (node) observer.observe(node);
    });
    return () => {
      observer.disconnect();
      if (chapterRafRef.current) cancelAnimationFrame(chapterRafRef.current);
    };
  }, [chapters]);

  const openStoryFromTimeline = (targetMoment, index) => {
    onStory(athlete, targetMoment, index, 1, {
      fromTimeline: true,
      timelineContext: {
        athleteId: athlete.id,
        chapterNumber: activeChapter,
        scrollY: window.scrollY
      }
    });
  };
  const scrollToSavedTimelinePosition = () => {
    if (!hasReturnContext) return;
    const chapter = Math.min(Math.max(timelineReturnContext.chapterNumber || 1, 1), chapters.length);
    window.history.replaceState(null, "", `#chapter-${chapter}`);
    window.scrollTo({ top: Math.max(0, Number(timelineReturnContext.scrollY) || 0), behavior: "smooth" });
  };
  useEffect(() => {
    if (!hasReturnContext || didRestoreRef.current) return;
    didRestoreRef.current = true;
    const chapter = Math.min(Math.max(timelineReturnContext.chapterNumber || 1, 1), chapters.length);
    window.history.replaceState(null, "", `#chapter-${chapter}`);
    window.setTimeout(() => {
      window.scrollTo({ top: Math.max(0, Number(timelineReturnContext.scrollY) || 0), behavior: "auto" });
      setActiveChapter(chapter);
      onClearTimelineContext?.();
    }, 0);
  }, [chapters.length, hasReturnContext, onClearTimelineContext, timelineReturnContext]);

  if (!chapters.length) {
    return (
      <div style={{ minHeight: "100dvh", padding: "40px 20px", display: "grid", placeItems: "center" }}>
        <div style={{ width: "min(680px,100%)" }}>
          <ErrorState
            title="Timeline currently unavailable"
            message="This athlete archive does not have chapter data yet. Return to the roster and choose another verified storyline."
            ariaLabel="Timeline unavailable"
            action={<RetryAction label="RETURN TO ROSTER" onRetry={onBack} ariaLabel="Return to roster" />}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", animation: "fadeIn 0.4s ease" }}>
      {/* Sticky Nav */}
      <nav className="ricon-nav" style={{ padding: "calc(22px + var(--safe-top)) calc(40px + var(--safe-right)) 22px calc(40px + var(--safe-left))", display: "flex", alignItems: "center", gap: 18, borderBottom: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, background: "rgba(8,8,8,0.96)", backdropFilter: "blur(24px)", zIndex: 90 }}>
        <button className="mono back-btn" onClick={onBack}
          style={{ fontSize: 9, letterSpacing: 2, color: "#666", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "color 0.2s" }}>
          ← ROSTER
        </button>
        <div style={{ width: 1, height: 16, background: "#252525" }} />
        <span className="bebas" style={{ fontSize: 15, letterSpacing: 5, color: "rgba(240,235,227,0.3)" }}>RICON STORYLINE</span>
        <div style={{ flex: 1 }} />
        {hasReturnContext && (
          <button className="story-card-btn mono" onClick={scrollToSavedTimelinePosition} style={{ fontSize: 8, letterSpacing: 2, color: "#7BC8E8", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(123,200,232,0.32)", padding: "9px 10px", cursor: "pointer", borderRadius: 2 }}>
            BACK TO CURRENT TIMELINE POSITION
          </button>
        )}
        <button className="cta-glow" onClick={() => onTwin("narrator")}
          style={{ fontFamily: '"Inter"', fontSize: 10, letterSpacing: 3, color: "#080808", background: "linear-gradient(135deg,#C9A84C,#FFD87A)", border: "none", padding: "10px 20px", cursor: "pointer", borderRadius: 2 }}>
          ◉ ACTIVATE DIGITAL TWIN
        </button>
      </nav>

      {/* Hero */}
      <div className="athlete-hero" style={{ padding: "76px 40px 52px", position: "relative", overflow: "hidden" }}>
        <div className="bebas" style={{ position: "absolute", bottom: -60, right: 10, fontSize: 300, letterSpacing: 8, color: "rgba(201,168,76,0.022)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>
          {athlete.initials}
        </div>
        <div className="cormorant" style={{ fontSize: 15, color: "#7BC8E8", letterSpacing: 4, marginBottom: 18 }}>
          {athlete.position} · {athlete.teams}
        </div>
        <h1 className="bebas" style={{ fontSize: "clamp(58px,9vw,108px)", letterSpacing: 6, lineHeight: 0.9, marginBottom: 22, background: "linear-gradient(135deg,#F0EBE3 0%,#C9A84C 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {athlete.name}
        </h1>
        <div className="cormorant" style={{ fontSize: 20, color: "rgba(240,235,227,0.38)", maxWidth: 580, lineHeight: 1.65 }}>
          "{athlete.tagline}"
        </div>
        <div style={{ marginTop: 30, display: "flex", flexWrap: "wrap", gap: 12 }}>
          <button onClick={() => openStoryFromTimeline(leadMoment, leadIndex)} className="cta-glow"
            style={{ fontFamily: '"Inter"', fontSize: 10, letterSpacing: 2, padding: "13px 20px", background: "linear-gradient(135deg,#C9A84C,#FFD87A)", color: "#080808", border: "none", cursor: "pointer", borderRadius: 2 }}>
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

      {/* Twin activation banner */}
      <div style={{ margin: "0 40px", padding: "22px 28px", background: "linear-gradient(135deg,rgba(201,168,76,0.07),rgba(123,200,232,0.04))", border: "1px solid rgba(201,168,76,0.18)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div>
          <div className="bebas" style={{ fontSize: 18, letterSpacing: 4, color: "#C9A84C", marginBottom: 6 }}>DIGITAL TWIN AVAILABLE</div>
          <div style={{ fontSize: 13, color: "rgba(240,235,227,0.45)", maxWidth: 500, lineHeight: 1.6 }}>
            Interact with {athlete.name.split(" ")[0]}'s verified AI twin. Choose Narrator mode to relive the story, or Q&A mode to ask anything directly.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => onTwin("narrator")} style={{ fontFamily: '"Inter"', fontSize: 10, letterSpacing: 2, padding: "11px 20px", background: "#C9A84C", color: "#080808", border: "none", cursor: "pointer", borderRadius: 2 }}>▶ NARRATOR</button>
          <button className="twin-btn" onClick={() => onTwin("qa")} style={{ fontFamily: '"Inter"', fontSize: 10, letterSpacing: 2, padding: "11px 20px", background: "transparent", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.35)", cursor: "pointer", borderRadius: 2, transition: "all 0.25s" }}>✦ ASK ME ANYTHING</button>
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline-wrap" style={{ padding: "72px 40px 80px" }}>
        <div className="timeline-heading mono" style={{ fontSize: 10, letterSpacing: 6, color: "#3a3a3a", marginBottom: 56 }}>
          CAREER TIMELINE · {athlete.moments.length} VERIFIED MOMENTS
        </div>
        <ErrorBoundary scopeLabel="timeline" resetKeys={[athlete.id, chapters.length]}>
          {timelineLoading ? (
            <LoadingState label="Loading timeline" message="Syncing verified moments for this athlete." />
          ) : (
            <div style={{ position: "relative" }}>
              <div className="timeline-line" style={{ position: "absolute", left: 114, top: 0, bottom: 0, width: 1, transform: "translateX(-0.5px)", background: "linear-gradient(to bottom,transparent,rgba(201,168,76,0.28) 8%,rgba(201,168,76,0.28) 92%,transparent)" }} />
              {chapters.map((chapter, i) => <TimelineMoment key={chapter.id} chapter={chapter} athlete={athlete} moment={chapter.moment} index={i} total={chapters.length} active={activeChapter === chapter.number} reduceMotion={reducedMotion} onStory={() => openStoryFromTimeline(chapter.moment, i)} />)}
            </div>
          )}
        </ErrorBoundary>
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: "52px 40px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
        <div className="cormorant" style={{ fontSize: 20, color: "rgba(240,235,227,0.3)", marginBottom: 24 }}>The story doesn't end here.</div>
        <button className="twin-btn" onClick={() => onTwin("qa")}
          style={{ fontFamily: '"Inter"', fontSize: 15, letterSpacing: 4, padding: "14px 38px", background: "transparent", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.4)", cursor: "pointer", borderRadius: 2, transition: "all 0.25s" }}>
          ASK THE DIGITAL TWIN →
        </button>
      </div>
    </div>
  );
}

// ─── TIMELINE MOMENT ──────────────────────────────────────────────────────────
function TimelineMoment({ chapter, athlete, moment, index, total, active, reduceMotion = false, onStory }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(reduceMotion);
  const cfg = TYPE_CONFIG[moment.type] || TYPE_CONFIG.iconic;
  const collectible = collectibleFor(athlete, moment, index);
  const hasSource = Boolean(moment?.src);
  const status = String(moment?.status || "").toLowerCase();
  const unavailable = Boolean(moment?.comingSoon || status === "coming-soon" || status === "comingsoon");
  const draft = status === "draft";
  const statusBadges = [
    { key: "verified", label: "VERIFIED", color: "#7BC8E8", visible: !draft && !unavailable },
    { key: "draft", label: "DRAFT", color: "#777", visible: draft && !unavailable },
    { key: "source-cited", label: "SOURCE-CITED", color: "#C9A84C", visible: hasSource && !unavailable },
    { key: "coming-soon", label: "COMING SOON", color: "#999", visible: unavailable }
  ].filter((item) => item.visible);
  const openLabel = unavailable ? `Story not yet published for ${moment.title || chapter.title}. Coming soon.` : `Open story ${chapter.number}: ${moment.title}. ${moment.y}, ${moment.era}.`;
  const handleOpen = () => {
    if (unavailable) return;
    onStory?.();
  };

  useEffect(() => {
    if (reduceMotion) {
      setVisible(true);
      return undefined;
    }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [reduceMotion]);

  return (
    <section
      id={chapter.id}
      ref={ref}
      className="moment-item chapter-section"
      style={{ transitionDelay: `${index * 80}ms` }}
      data-visible={visible ? "true" : ""}
      data-chapter={chapter.number}
      aria-labelledby={`${chapter.id}-title`}
    >
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
          <div
            className={`timeline-story-card ${unavailable ? "" : "timeline-story-card-interactive"}`}
            role={unavailable ? "group" : "button"}
            tabIndex={unavailable ? -1 : 0}
            aria-label={openLabel}
            aria-disabled={unavailable || undefined}
            onClick={handleOpen}
            onKeyDown={(event) => {
              if (unavailable) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleOpen();
              }
            }}
          >
          <div className="chapter-kicker mono" style={{ color: active ? "#C9A84C" : "#555", letterSpacing: 2, fontSize: 8 }}>
            CHAPTER {String(chapter.number).padStart(2, "0")} <span style={{ color: "#333" }}>·</span> {chapter.era}
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12, padding: "3px 10px", border: `1px solid ${cfg.color}40`, borderRadius: 2 }}>
            <span className="mono" style={{ fontSize: 9, letterSpacing: 2, color: cfg.color }}>{cfg.icon} {cfg.label}</span>
          </div>
          {statusBadges.map((badge) => (
            <div key={badge.key} className={`timeline-status-badge mono ${unavailable ? "timeline-status-badge-disabled" : ""}`} style={{ color: badge.color, borderColor: `${badge.color}66` }}>
              {badge.label}
            </div>
          ))}
          {collectible && (
            <div className="mono" style={{ display: "inline-flex", marginLeft: 8, alignItems: "center", gap: 6, marginBottom: 12, padding: "3px 10px", border: "1px solid rgba(201,168,76,0.32)", borderRadius: 2, color: "#C9A84C", fontSize: 9, letterSpacing: 2 }}>
              OWNABLE MOMENT
            </div>
          )}
          <button id={`${chapter.id}-title`} onClick={handleOpen} disabled={unavailable} aria-label={openLabel} className="timeline-title story-card-btn bebas" style={{ display: "block", textAlign: "left", fontSize: 24, letterSpacing: 2, color: unavailable ? "#777" : (active ? "#FFD87A" : "#F0EBE3"), lineHeight: 1.2, marginBottom: 12, background: "none", border: "none", cursor: unavailable ? "not-allowed" : "pointer", padding: 0 }}>
            {moment.title}
          </button>
          <div className="timeline-body cormorant" style={{ fontSize: 17, color: unavailable ? "rgba(240,235,227,0.36)" : "rgba(240,235,227,0.62)", lineHeight: 1.75, marginBottom: 14, maxWidth: 660 }}>{moment.body}</div>
          <TimelineVideoPreview athlete={athlete} moment={moment} index={index} onPlay={handleOpen} unavailable={unavailable} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ width: 8, height: 1, background: "#333" }} />
            <button onClick={handleOpen} disabled={unavailable} aria-label={openLabel} className="story-card-btn mono" style={{ fontSize: 9, color: unavailable ? "#555" : "#C9A84C", letterSpacing: 2, background: "transparent", border: "1px solid rgba(201,168,76,0.22)", padding: "6px 10px", cursor: unavailable ? "not-allowed" : "pointer", borderRadius: 2 }}>
              {unavailable ? "COMING SOON" : "OPEN STORY →"}
            </button>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SafeStoryVideo({ athlete, moment, eager = false, loop = false, autoPlay = false, background = false, chapterMarkers = [], onActiveChapterChange = null, hotspots = [], hotspotsEnabled = true, initialTime = 0, onTimePersist = null }) {
  const ref = useRef(null);
  const videoRef = useRef(null);
  const [inView, setInView] = useState(eager);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [posterLoading, setPosterLoading] = useState(true);
  const [posterError, setPosterError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedRatio, setBufferedRatio] = useState(0);
  const [activeChapterId, setActiveChapterId] = useState(chapterMarkers[0]?.id || null);
  const [activeHotspotId, setActiveHotspotId] = useState(null);
  const [openHotspot, setOpenHotspot] = useState(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [doubleTapHint, setDoubleTapHint] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const lastTapRef = useRef({ side: null, at: 0 });
  const hideControlsTimerRef = useRef(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const assets = useMemo(() => videoAssetsFor(athlete, moment), [athlete, moment]);
  const hasSources = Boolean(assets.webm || assets.mp4);
  const hasCaptions = Boolean(assets.captions);
  const posterOnly = (background && isMobile) || reducedMotion;
  const shouldLoad = hasSources && !posterOnly && (eager || inView);
  const shouldAutoPlay = autoPlay && !posterOnly;
  const shouldLoadPoster = eager || inView || !background;
  const mediaFailed = Boolean(posterError || mediaError);
  const isMobileControlMode = isMobile && !background;
  const hasDuration = Number.isFinite(duration) && duration > 0;
  const playedRatio = hasDuration ? Math.min(Math.max(currentTime / duration, 0), 1) : 0;
  const videoPreload = background ? "none" : "metadata";
  const posterBackgroundImage = useMemo(() => {
    if (!assets.poster2x) return `url("${assets.poster}")`;
    return `image-set(url("${assets.poster}") 1x, url("${assets.poster2x}") 2x)`;
  }, [assets.poster, assets.poster2x]);
  const markerPositions = useMemo(() => {
    if (!chapterMarkers.length) return [];
    if (hasDuration) {
      return chapterMarkers.map((chapter) => ({
        ...chapter,
        ratio: Math.min(Math.max(chapter.startTime / duration, 0), 1)
      }));
    }
    return chapterMarkers.map((chapter, index) => ({
      ...chapter,
      ratio: chapterMarkers.length === 1 ? 0 : index / (chapterMarkers.length - 1)
    }));
  }, [chapterMarkers, duration, hasDuration]);
  const activeHotspots = useMemo(() => {
    if (!hotspotsEnabled) return [];
    return hotspots.filter((hotspot) => currentTime >= hotspot.startTime && currentTime < hotspot.endTime);
  }, [hotspots, currentTime, hotspotsEnabled]);

  const formatTime = (value) => {
    const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
    const mins = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const syncTracks = (enabled) => {
    const tracks = videoRef.current?.textTracks;
    if (!tracks) return;
    Array.from(tracks).forEach((track) => {
      track.mode = enabled ? "showing" : "disabled";
    });
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play?.().then(() => setPlaying(true)).catch(() => {});
    } else {
      video.pause?.();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
  };

  const toggleCaptions = () => {
    const next = !captionsOn;
    setCaptionsOn(next);
    syncTracks(next);
  };

  const toggleFullscreen = () => {
    const node = ref.current;
    if (!node) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      node.requestFullscreen?.();
    }
  };

  const seekBy = (seconds) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), video.duration);
  };

  const handleScrub = (event) => {
    const video = videoRef.current;
    if (!video || !hasDuration) return;
    const next = Number(event.target.value || 0);
    const clamped = Math.min(Math.max(next, 0), duration);
    video.currentTime = clamped;
    setCurrentTime(clamped);
  };
  const jumpToChapter = (chapter) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(chapter.startTime)) return;
    video.currentTime = chapter.startTime;
    setCurrentTime(chapter.startTime);
    setActiveChapterId(chapter.id);
    onActiveChapterChange?.(chapter);
  };
  const openHotspotPanel = (hotspot) => {
    videoRef.current?.pause?.();
    setPlaying(false);
    setMobileMenuOpen(false);
    setControlsVisible(true);
    setOpenHotspot(hotspot);
    setActiveHotspotId(hotspot.id);
  };
  const resumeFromHotspot = () => {
    setOpenHotspot(null);
    if (!videoRef.current || mediaFailed) return;
    videoRef.current.play?.().catch(() => {});
  };
  const revealControls = () => {
    setControlsVisible(true);
  };
  const handleTapZone = (side) => {
    revealControls();
    if (!shouldLoad || mediaFailed) return;
    const now = Date.now();
    const isDoubleTap = lastTapRef.current.side === side && (now - lastTapRef.current.at) < 300;
    lastTapRef.current = { side, at: now };
    if (!isDoubleTap) return;
    const delta = side === "left" ? -10 : 10;
    seekBy(delta);
    setDoubleTapHint(delta > 0 ? "+10s" : "-10s");
  };

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting;
      setInView(visible);
      if (!visible) {
        videoRef.current?.pause?.();
        setPlaying(false);
      }
      if (visible && shouldAutoPlay && videoRef.current?.paused) {
        videoRef.current.play?.().catch(() => {});
      }
    }, { rootMargin: eager ? "0px" : "180px 0px", threshold: 0.2 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [eager, shouldAutoPlay]);

  useEffect(() => {
    if (posterOnly) videoRef.current?.pause?.();
  }, [posterOnly]);

  useEffect(() => {
    syncTracks(captionsOn);
  }, [captionsOn, shouldLoad]);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handleKeyDown = (event) => {
    if (event.target instanceof HTMLButtonElement) return;
    const key = event.key.toLowerCase();
    if (key === " ") { event.preventDefault(); togglePlay(); }
    if (key === "m") { event.preventDefault(); toggleMute(); }
    if (key === "c") { event.preventDefault(); toggleCaptions(); }
    if (key === "f") { event.preventDefault(); toggleFullscreen(); }
    if (event.key === "ArrowLeft") { event.preventDefault(); seekBy(-5); }
    if (event.key === "ArrowRight") { event.preventDefault(); seekBy(5); }
  };

  const retryMedia = () => {
    setPosterLoading(true);
    setPosterError(false);
    setVideoReady(false);
    setMediaError(null);
    setReloadToken((n) => n + 1);
  };

  useEffect(() => {
    if (!shouldLoadPoster) {
      setPosterLoading(false);
      return;
    }
    setPosterLoading(true);
    setPosterError(false);
    setVideoReady(false);
    setMediaError(null);
    const img = new Image();
    img.onload = () => setPosterLoading(false);
    img.onerror = () => { setPosterLoading(false); setPosterError(true); };
    img.src = assets.poster;
  }, [assets.poster, reloadToken, shouldLoadPoster]);

  useEffect(() => {
    if (!videoRef.current) return;
    setCurrentTime(0);
    setDuration(0);
    setBufferedRatio(0);
    setActiveChapterId(chapterMarkers[0]?.id || null);
    setActiveHotspotId(null);
    setOpenHotspot(null);
    setControlsVisible(true);
    setMobileMenuOpen(false);
  }, [moment.title, reloadToken]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(initialTime) || initialTime <= 0) return;
    const apply = () => {
      const max = Number.isFinite(video.duration) && video.duration > 0 ? Math.max(video.duration - 0.25, 0) : initialTime;
      const nextTime = Math.min(Math.max(initialTime, 0), max);
      video.currentTime = nextTime;
      setCurrentTime(nextTime);
    };
    if (Number.isFinite(video.duration) && video.duration > 0) apply();
    else video.addEventListener("loadedmetadata", apply, { once: true });
    return () => {
      video.removeEventListener("loadedmetadata", apply);
    };
  }, [initialTime, reloadToken, moment.title]);
  useEffect(() => {
    if (typeof onTimePersist !== "function" || !hasDuration) return;
    onTimePersist(currentTime);
  }, [currentTime, hasDuration, onTimePersist]);
  useEffect(() => {
    if (!chapterMarkers.length) return;
    const active = chapterMarkers.find((chapter) => currentTime >= chapter.startTime && currentTime < chapter.endTime) || chapterMarkers[chapterMarkers.length - 1];
    if (!active || active.id === activeChapterId) return;
    setActiveChapterId(active.id);
    onActiveChapterChange?.(active);
  }, [chapterMarkers, currentTime, activeChapterId, onActiveChapterChange]);
  useEffect(() => {
    if (!openHotspot) return;
    const stillActive = activeHotspots.some((hotspot) => hotspot.id === openHotspot.id);
    if (!stillActive) setOpenHotspot(null);
  }, [activeHotspots, openHotspot]);
  useEffect(() => {
    if (!isMobileControlMode) return undefined;
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    if (!playing || !controlsVisible || mobileMenuOpen || openHotspot) return undefined;
    hideControlsTimerRef.current = setTimeout(() => setControlsVisible(false), 2200);
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [isMobileControlMode, playing, controlsVisible, mobileMenuOpen, openHotspot, currentTime]);
  useEffect(() => {
    if (!doubleTapHint) return undefined;
    const timeout = setTimeout(() => setDoubleTapHint(null), 700);
    return () => clearTimeout(timeout);
  }, [doubleTapHint]);

  return (
    <div
      ref={ref}
      className={`video-container ${posterOnly || !hasSources ? "video-container-poster-only" : ""}`}
      tabIndex={0}
      role="group"
      aria-label={`${moment.title} video controls`}
      onKeyDown={handleKeyDown}
      onClick={(event) => {
        if (!isMobileControlMode) return;
        if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLInputElement) return;
        revealControls();
      }}
    >
      <div className="video-poster" style={{ backgroundImage: shouldLoadPoster ? posterBackgroundImage : "none" }} />
      {shouldLoad && (
        <video
          key={`${moment.title}-${reloadToken}`}
          ref={videoRef}
          className="video-media"
          muted={muted}
          playsInline
          playsinline="true"
          preload={videoPreload}
          poster={assets.poster}
          loop={loop}
          autoPlay={shouldAutoPlay}
          controls={false}
          disablePictureInPicture
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onCanPlay={() => setVideoReady(true)}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            setDuration(Number.isFinite(video.duration) ? video.duration : 0);
            setCurrentTime(Number.isFinite(video.currentTime) ? video.currentTime : 0);
            syncTracks(captionsOn);
          }}
          onDurationChange={(event) => {
            const nextDuration = event.currentTarget.duration;
            if (Number.isFinite(nextDuration)) setDuration(nextDuration);
          }}
          onTimeUpdate={(event) => {
            const nextTime = event.currentTarget.currentTime;
            if (Number.isFinite(nextTime)) setCurrentTime(nextTime);
          }}
          onProgress={(event) => {
            const video = event.currentTarget;
            if (!Number.isFinite(video.duration) || video.duration <= 0) {
              setBufferedRatio(0);
              return;
            }
            const { buffered } = video;
            if (!buffered || buffered.length === 0) {
              setBufferedRatio(0);
              return;
            }
            const bufferedEnd = buffered.end(buffered.length - 1);
            setBufferedRatio(Math.min(Math.max(bufferedEnd / video.duration, 0), 1));
          }}
          onError={() => setMediaError("Video stream unavailable for this moment.")}
        >
          {assets.webm && <source src={assets.webm} type="video/webm" />}
          {assets.mp4 && <source src={assets.mp4} type="video/mp4" />}
          {assets.captions && <track kind="captions" src={assets.captions} srcLang="en" label="English captions" default={captionsOn} />}
        </video>
      )}
      <div className="video-overlay media-readable-overlay" />
      {activeHotspots.length > 0 && (
        <div aria-label="Interactive video hotspots" style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
          {activeHotspots.map((hotspot) => (
            <button
              key={hotspot.id}
              type="button"
              className="hotspot mono"
              onClick={() => openHotspotPanel(hotspot)}
              aria-label={`${hotspot.label}. ${hotspot.type}. ${hotspot.description}`}
              style={{ pointerEvents: "auto", position: "absolute", left: `${hotspot.x}%`, top: `${hotspot.y}%`, transform: "translate(-50%, -50%)", minWidth: 44, minHeight: 44, borderRadius: "50%", border: hotspot.id === activeHotspotId ? "1px solid #FFD87A" : "1px solid rgba(123,200,232,0.66)", background: "rgba(8,8,8,0.78)", color: "#7BC8E8", cursor: "pointer", fontSize: 8, letterSpacing: 1, padding: 0 }}
              title={`${hotspot.label} · ${hotspot.type.toUpperCase()}`}
            >
              ●
            </button>
          ))}
        </div>
      )}
      {(posterLoading || (shouldLoad && !videoReady)) && !mediaFailed && (
        <div style={{ position: "absolute", left: 14, right: 14, top: 14, zIndex: 5 }}>
          <LoadingState label="Loading media" message="Preparing this verified chapter clip." />
        </div>
      )}
      {mediaFailed && (
        <div style={{ position: "absolute", inset: 14, zIndex: 6, display: "grid", alignItems: "center" }}>
          <ErrorState
            title="Media unavailable"
            message={posterError ? "We couldn't load the chapter artwork yet." : (mediaError ? "This chapter clip is taking longer than expected." : "This chapter clip is temporarily unavailable.")}
            ariaLabel="Video error state"
            action={<RetryAction label="TRY AGAIN" onRetry={retryMedia} ariaLabel="Retry media loading" />}
          />
        </div>
      )}
      {openHotspot && (
        <div style={{ position: "absolute", left: 14, right: 14, bottom: 56, zIndex: 6, border: "1px solid rgba(201,168,76,0.32)", background: "rgba(8,8,8,0.94)", padding: 12 }}>
          <div className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#7BC8E8", marginBottom: 6 }}>
            {openHotspot.type.toUpperCase()} HOTSPOT
          </div>
          <div className="bebas" style={{ fontSize: 20, letterSpacing: 2, color: "#F0EBE3", marginBottom: 6 }}>
            {openHotspot.label}
          </div>
          <div style={{ fontSize: 13, color: "rgba(240,235,227,0.72)", lineHeight: 1.55, marginBottom: 10 }}>
            {openHotspot.description}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="proof-btn mono" onClick={resumeFromHotspot} style={{ fontSize: 8, letterSpacing: 2, padding: "8px 10px", color: "#C9A84C", background: "transparent", border: "1px solid rgba(201,168,76,0.32)", cursor: "pointer" }}>
              RESUME VIDEO
            </button>
            <button type="button" className="proof-btn mono" onClick={() => setOpenHotspot(null)} style={{ fontSize: 8, letterSpacing: 2, padding: "8px 10px", color: "#7BC8E8", background: "transparent", border: "1px solid rgba(123,200,232,0.32)", cursor: "pointer" }}>
              CLOSE
            </button>
          </div>
        </div>
      )}
      {isMobileControlMode && controlsVisible && (
        <div className="video-mobile-center-controls">
          <button className="video-control-btn video-control-btn-primary" type="button" onClick={togglePlay} disabled={!shouldLoad || mediaFailed} aria-label={playing ? `Pause ${moment.title}` : `Play ${moment.title}`}>
            {playing ? "II" : "▶"}
          </button>
        </div>
      )}
      {isMobileControlMode && hasSources && (
        <>
          <button type="button" className="video-mobile-tap-zone video-mobile-tap-zone-left" onClick={() => handleTapZone("left")} aria-label={`Double tap left to rewind ${moment.title}`} />
          <button type="button" className="video-mobile-tap-zone video-mobile-tap-zone-right" onClick={() => handleTapZone("right")} aria-label={`Double tap right to fast-forward ${moment.title}`} />
          {doubleTapHint && (
            <div className={`video-doubletap-indicator ${doubleTapHint.startsWith("-") ? "video-doubletap-indicator-left" : "video-doubletap-indicator-right"}`}>
              {doubleTapHint}
            </div>
          )}
        </>
      )}
      <div className={`video-controls ${(hasSources && (!isMobileControlMode || controlsVisible)) ? "video-controls-visible" : ""}`} aria-label="Video controls">
        <div style={{ position: "absolute", left: 0, right: 0, top: -28, display: "flex", alignItems: "center", gap: 8, padding: "0 4px" }}>
          <div style={{ position: "relative", flex: 1, height: 4, background: "rgba(255,255,255,0.14)" }}>
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, width: `${bufferedRatio * 100}%`, background: "rgba(123,200,232,0.32)" }} />
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, width: `${playedRatio * 100}%`, background: "linear-gradient(90deg,#7BC8E8,#C9A84C,#FFD87A)" }} />
            {markerPositions.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                title={chapter.label}
                onClick={() => jumpToChapter(chapter)}
                aria-label={`${chapter.label}. Jump to ${formatTime(chapter.startTime)}. ${chapter.description}`}
                style={{ position: "absolute", left: `calc(${chapter.ratio * 100}% - 11px)`, top: -10, width: 22, height: 22, borderRadius: "50%", border: chapter.id === activeChapterId ? "1px solid #FFD87A" : "1px solid rgba(123,200,232,0.55)", background: chapter.id === activeChapterId ? "rgba(201,168,76,0.5)" : "rgba(8,8,8,0.84)", cursor: "pointer" }}
              />
            ))}
            <input
              type="range"
              min={0}
              max={hasDuration ? duration : 1}
              step={0.1}
              value={hasDuration ? currentTime : 0}
              onChange={handleScrub}
              disabled={!hasDuration || mediaFailed}
              aria-label={`Scrub ${moment.title} playback`}
              style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: hasDuration ? "pointer" : "not-allowed" }}
            />
          </div>
          <div className="mono" style={{ fontSize: 8, letterSpacing: 1, color: "#C9A84C", minWidth: 66, textAlign: "right" }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        {!isMobileControlMode && (
          <button className="video-control-btn" type="button" onClick={togglePlay} disabled={!shouldLoad || mediaFailed} aria-label={playing ? `Pause ${moment.title}` : `Play ${moment.title}`}>
            {playing ? "II" : "▶"}
          </button>
        )}
        {!isMobileControlMode && (
          <>
            <button className="video-control-btn" type="button" onClick={toggleMute} disabled={!hasSources || mediaFailed} aria-pressed={!muted} aria-label={muted ? `Unmute ${moment.title}` : `Mute ${moment.title}`}>
              {muted ? "MUTE" : "ON"}
            </button>
            <button className="video-control-btn" type="button" onClick={toggleCaptions} disabled={!hasCaptions || mediaFailed} aria-pressed={captionsOn} aria-label={hasCaptions ? `${captionsOn ? "Disable" : "Enable"} captions for ${moment.title}` : `Captions unavailable for ${moment.title}. Add .vtt files to moment.captionVtt.`}>
              CC
            </button>
            <button className="video-control-btn" type="button" onClick={() => seekBy(-5)} disabled={!shouldLoad || mediaFailed} aria-label={`Seek ${moment.title} backward 5 seconds`}>
              -5
            </button>
            <button className="video-control-btn" type="button" onClick={() => seekBy(5)} disabled={!shouldLoad || mediaFailed} aria-label={`Seek ${moment.title} forward 5 seconds`}>
              +5
            </button>
          </>
        )}
        {isMobileControlMode && (
          <button className="video-control-btn" type="button" onClick={() => setMobileMenuOpen((v) => !v)} aria-expanded={mobileMenuOpen} aria-label={`${mobileMenuOpen ? "Hide" : "Show"} player settings`}>
            ⋮
          </button>
        )}
        <span className="video-control-spacer" />
        <button className="video-control-btn" type="button" onClick={toggleFullscreen} disabled={mediaFailed} aria-pressed={fullscreen} aria-label={fullscreen ? `Exit fullscreen for ${moment.title}` : `Enter fullscreen for ${moment.title}`}>
          F
        </button>
        {isMobileControlMode && mobileMenuOpen && (
          <div className="video-mobile-secondary-menu" role="menu" aria-label="Video settings">
            <button className="video-control-btn" type="button" onClick={toggleMute} disabled={!hasSources || mediaFailed} aria-pressed={!muted} aria-label={muted ? `Unmute ${moment.title}` : `Mute ${moment.title}`}>
              {muted ? "UNMUTE" : "MUTE"}
            </button>
            <button className="video-control-btn" type="button" onClick={toggleCaptions} disabled={!hasCaptions || mediaFailed} aria-pressed={captionsOn} aria-label={hasCaptions ? `${captionsOn ? "Disable" : "Enable"} captions for ${moment.title}` : `Captions unavailable for ${moment.title}. Add .vtt files to moment.captionVtt.`}>
              CC
            </button>
            <button className="video-control-btn" type="button" onClick={() => seekBy(-10)} disabled={!shouldLoad || mediaFailed} aria-label={`Seek ${moment.title} backward 10 seconds`}>
              -10
            </button>
            <button className="video-control-btn" type="button" onClick={() => seekBy(10)} disabled={!shouldLoad || mediaFailed} aria-label={`Seek ${moment.title} forward 10 seconds`}>
              +10
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineVideoPreview({ athlete, moment, index, onPlay, unavailable = false }) {
  const cfg = TYPE_CONFIG[moment.type] || TYPE_CONFIG.iconic;
  const collectible = collectibleFor(athlete, moment, index);
  const progress = 28 + ((index * 17) % 56);

  return (
    <button className="timeline-video" onClick={onPlay} disabled={unavailable} aria-label={unavailable ? `${moment.title} preview unavailable. Coming soon.` : `Open video preview for ${moment.title}`}>
      <SafeStoryVideo athlete={athlete} moment={moment} background />
      <div className="media-text-surface" style={{ position: "relative", zIndex: 1, minHeight: "inherit", padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "left" }}>
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
            <div className="mono media-muted-copy" style={{ fontSize: 8, letterSpacing: 2, marginBottom: 8 }}>{moment.y} · TAP TO OPEN CHAPTER</div>
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
      <span className="hotspot" aria-hidden="true" style={{ position: "absolute", right: 18, bottom: 18, zIndex: 3, width: 14, height: 14, borderRadius: "50%", background: unavailable ? "#777" : "#7BC8E8", border: `1px solid ${unavailable ? "#777" : "#7BC8E8"}` }} />
    </button>
  );
}

// ─── INTERACTIVE VIDEO MODULE ─────────────────────────────────────────────────
function StoryVideoPlayer({ athlete, moment, compact = false, progress = 0, onContinue, onTwin, initialTime = 0, onTimePersist = null }) {
  const cfg = TYPE_CONFIG[moment.type] || TYPE_CONFIG.iconic;
  const source = sourceDetailsFor(moment);
  const clampedProgress = Math.max(8, Math.min(progress, 100));
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [transcriptQuery, setTranscriptQuery] = useState("");
  const [hotspotsEnabled, setHotspotsEnabled] = useState(true);
  const [activeVideoChapter, setActiveVideoChapter] = useState(null);
  const transcriptData = useMemo(() => transcriptDataFor(athlete, moment), [athlete, moment]);
  const chapterMarkers = useMemo(() => chapterMarkersFor(moment), [moment]);
  const hotspotData = useMemo(() => hotspotDataFor(moment), [moment]);
  const transcriptLines = useMemo(() => (
    transcriptData.text
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0)
  ), [transcriptData.text]);
  const filteredTranscriptLines = useMemo(() => {
    const query = transcriptQuery.trim().toLowerCase();
    if (!query) return transcriptLines;
    return transcriptLines.filter((line) => line.toLowerCase().includes(query));
  }, [transcriptLines, transcriptQuery]);

  return (
    <section className="interactive-video" aria-label={`Interactive video for ${moment.title}`} style={{ minHeight: compact ? 300 : 430 }}>
      <SafeStoryVideo athlete={athlete} moment={moment} eager={!compact} autoPlay={false} loop={false} chapterMarkers={chapterMarkers} onActiveChapterChange={setActiveVideoChapter} hotspots={hotspotData} hotspotsEnabled={hotspotsEnabled} initialTime={initialTime} onTimePersist={onTimePersist} />
      <div className="media-text-surface" style={{ position: "relative", zIndex: 1, minHeight: compact ? 300 : 430, padding: compact ? 22 : 26, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "start" }}>
          <div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: 3, color: "#7BC8E8", marginBottom: 10 }}>
              INTERACTIVE STORY VIDEO
            </div>
            <div className="bebas media-copy" style={{ fontSize: compact ? 30 : 38, letterSpacing: 3, lineHeight: 1 }}>
              {moment.title}
            </div>
          </div>
          <div className="mono" style={{ flexShrink: 0, fontSize: 8, letterSpacing: 2, color: cfg.color, border: `1px solid ${cfg.color}55`, padding: "6px 8px" }}>
            {cfg.label}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <button onClick={onContinue} className="story-card-btn mono" aria-label={`Continue ${moment.title} story scene`} style={{ fontSize: 9, color: "#C9A84C", letterSpacing: 2, background: "rgba(8,8,8,0.56)", border: "1px solid rgba(201,168,76,0.34)", padding: "9px 12px", cursor: "pointer", borderRadius: 2 }}>
            CONTINUE STORY
          </button>
          <button onClick={onTwin} className="story-card-btn mono" aria-label={`Ask companion about ${moment.title}`} style={{ fontSize: 9, color: "#7BC8E8", letterSpacing: 2, background: "rgba(8,8,8,0.56)", border: "1px solid rgba(123,200,232,0.36)", padding: "9px 12px", cursor: "pointer", borderRadius: 2 }}>
            ASK COMPANION
          </button>
          <button onClick={() => setTranscriptOpen((v) => !v)} className="story-card-btn mono" aria-expanded={transcriptOpen} aria-controls={`transcript-${athlete.id}-${moment.y}`} aria-label={`${transcriptOpen ? "Hide" : "View"} transcript for ${moment.title}`} style={{ fontSize: 9, color: "#F0EBE3", letterSpacing: 2, background: "rgba(8,8,8,0.56)", border: "1px solid rgba(255,255,255,0.24)", padding: "9px 12px", cursor: "pointer", borderRadius: 2 }}>
            {transcriptOpen ? "HIDE TRANSCRIPT" : "VIEW TRANSCRIPT"}
          </button>
          <button onClick={() => setHotspotsEnabled((value) => !value)} className="story-card-btn mono" aria-pressed={hotspotsEnabled} aria-label={`${hotspotsEnabled ? "Hide" : "Show"} interactive hotspots`} style={{ fontSize: 9, color: hotspotsEnabled ? "#C9A84C" : "#777", letterSpacing: 2, background: "rgba(8,8,8,0.56)", border: "1px solid rgba(201,168,76,0.24)", padding: "9px 12px", cursor: "pointer", borderRadius: 2 }}>
            {hotspotsEnabled ? "HIDE HOTSPOTS" : "SHOW HOTSPOTS"}
          </button>
        </div>

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
            <div className="mono media-muted-copy" style={{ fontSize: 8, letterSpacing: 1 }}>{moment.y} · {source.level}</div>
            <div className="mono media-muted-copy" style={{ fontSize: 8, letterSpacing: 1 }}>NATIVE VIDEO · CAPTIONS · CONTROLS</div>
          </div>
          {activeVideoChapter && (
            <div className="mono" style={{ marginTop: 8, fontSize: 8, letterSpacing: 1.2, color: "#C9A84C" }}>
              ACTIVE CHAPTER · {activeVideoChapter.label}
            </div>
          )}
        </div>
        {transcriptOpen && (
          <div id={`transcript-${athlete.id}-${moment.y}`} style={{ marginTop: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(8,8,8,0.82)", padding: 14, maxHeight: compact ? 210 : 260, overflow: "auto" }}>
            <div className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#7BC8E8", marginBottom: 10 }}>
              TRANSCRIPT {transcriptData.isPlaceholder ? "· IN PREPARATION" : "· SEARCHABLE"}
            </div>
            {transcriptData.chapters.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {transcriptData.chapters.map((chapter) => (
                  <span key={`${chapter.time}-${chapter.label}`} className="mono" style={{ fontSize: 8, letterSpacing: 1, color: "#C9A84C", border: "1px solid rgba(201,168,76,0.24)", padding: "4px 6px" }}>
                    {chapter.time} · {chapter.label}
                  </span>
                ))}
              </div>
            )}
            <label className="mono" style={{ display: "block", fontSize: 8, letterSpacing: 1.5, color: "#555", marginBottom: 6 }}>
              SEARCH TRANSCRIPT
            </label>
            <input
              type="search"
              value={transcriptQuery}
              onChange={(event) => setTranscriptQuery(event.target.value)}
              placeholder="Search lines..."
              style={{ width: "100%", background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)", color: "#F0EBE3", padding: "8px 10px", marginBottom: 10, fontSize: 13 }}
            />
            {filteredTranscriptLines.length === 0 ? (
              <div className="mono" style={{ fontSize: 8, letterSpacing: 1.5, color: "#777" }}>No transcript lines match your search.</div>
            ) : (
              <div style={{ userSelect: "text", whiteSpace: "pre-wrap", color: "rgba(240,235,227,0.86)", fontSize: 14, lineHeight: 1.55 }}>
                {filteredTranscriptLines.join("\n")}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── STORY VIEW ───────────────────────────────────────────────────────────────
function StoryView({ athlete, moment, momentIndex, onBack, onHome, onTwin, onPersistProgress, onRestartProgress, initialVideoTime = 0, twinOpen = false }) {
  const panels = storyPanelsFor(athlete, moment);
  const initialScene = Math.min(Math.max((sceneNumberFromHash() || 1) - 1, 0), Math.max(panels.length - 1, 0));
  const [step, setStep] = useState(initialScene);
  const [sceneLoading, setSceneLoading] = useState(true);
  const cfg = TYPE_CONFIG[moment.type] || TYPE_CONFIG.iconic;
  const collectible = collectibleFor(athlete, moment, momentIndex);
  const progress = Math.round(((step + 1) / panels.length) * 100);
  const complete = step === panels.length - 1;
  const activePanel = panels[step];
  const missingChapterContent = !moment?.title || !moment?.body || !activePanel?.b || !panels.length;
  const chapterNumber = momentIndex + 1;
  const [videoTime, setVideoTime] = useState(Math.max(0, Number(initialVideoTime) || 0));

  const next = () => setStep((s) => Math.min(s + 1, panels.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const jumpToScene = (index) => setStep(Math.min(Math.max(index, 0), panels.length - 1));

  useEffect(() => {
    const nextScene = Math.min(Math.max((sceneNumberFromHash() || 1) - 1, 0), Math.max(panels.length - 1, 0));
    setStep(nextScene);
    setVideoTime(Math.max(0, Number(initialVideoTime) || 0));
  }, [initialVideoTime, moment?.title, panels.length]);
  useEffect(() => {
    setSceneLoading(true);
    const id = window.setTimeout(() => setSceneLoading(false), 280);
    return () => window.clearTimeout(id);
  }, [moment?.title, step]);
  useEffect(() => {
    if (!panels.length) return;
    const nextHash = chapterSceneHash(chapterNumber, step + 1);
    if (window.location.hash !== nextHash) window.history.pushState(null, "", nextHash);
  }, [chapterNumber, panels.length, step]);
  useEffect(() => {
    if (typeof onPersistProgress !== "function") return;
    if (step === 0 && videoTime === 0) return;
    onPersistProgress({
      athleteId: athlete.id,
      chapterNumber,
      sceneNumber: step + 1,
      videoTime
    });
  }, [athlete.id, chapterNumber, onPersistProgress, step, videoTime]);
  useEffect(() => {
    const syncSceneFromRoute = () => {
      const hashChapter = chapterNumberFromHash(window.location.hash);
      if (hashChapter !== chapterNumber) return;
      const hashScene = Math.min(Math.max((sceneNumberFromHash(window.location.hash) || 1) - 1, 0), Math.max(panels.length - 1, 0));
      setStep(hashScene);
    };
    window.addEventListener("popstate", syncSceneFromRoute);
    window.addEventListener("hashchange", syncSceneFromRoute);
    return () => {
      window.removeEventListener("popstate", syncSceneFromRoute);
      window.removeEventListener("hashchange", syncSceneFromRoute);
    };
  }, [chapterNumber, panels.length]);

  return (
    <div className="story-shell" style={{ animation: "fadeIn 0.35s ease" }}>
      <div className="scanline-fx" />
      <div className="bebas hero-field" style={{ position: "absolute", right: "-3vw", bottom: "-9vw", fontSize: "min(38vw,420px)", letterSpacing: 10, color: "rgba(201,168,76,0.035)", lineHeight: 0.85, pointerEvents: "none" }}>
        {athlete.initials}
      </div>

      <nav className="ricon-nav" style={{ position: "relative", zIndex: 2, padding: "calc(22px + var(--safe-top)) calc(40px + var(--safe-right)) 22px calc(40px + var(--safe-left))", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button className="mono back-btn" onClick={onBack} style={{ fontSize: 9, letterSpacing: 2, color: "#777", background: "none", border: "none", cursor: "pointer" }}>← BACK TO TIMELINE</button>
        <div style={{ width: 1, height: 16, background: "#252525" }} />
        <span className="mono" style={{ fontSize: 9, letterSpacing: 3, color: "#7BC8E8" }}>{athlete.name}</span>
        <div style={{ flex: 1 }} />
        <button className="hide-mobile mono" onClick={onHome} style={{ fontSize: 9, letterSpacing: 2, color: "#555", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 12px", cursor: "pointer" }}>ROSTER</button>
      </nav>

      <div className={`story-pad story-layout ${twinOpen ? "" : "story-has-bottom-bar"}`} style={{ position: "relative", zIndex: 1, padding: "56px 40px 40px", display: "flex", gap: 28, alignItems: "stretch" }}>
        <div className="story-main-column" style={{ flex: "1 1 58%", minHeight: 520, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <ErrorBoundary scopeLabel="story scene" resetKeys={[athlete.id, moment?.title, step]}>
          <div className="story-copy-block">
            <div className="mono" style={{ display: "inline-flex", gap: 8, alignItems: "center", border: `1px solid ${cfg.color}55`, color: cfg.color, padding: "6px 10px", fontSize: 9, letterSpacing: 2, marginBottom: 24 }}>
              {cfg.icon} {cfg.label} · {moment.y} · {sourceDetailsFor(moment).level}
            </div>
            {missingChapterContent ? (
              <div style={{ maxWidth: 820 }}>
                <ErrorState
                  title="Chapter in editorial review"
                  message="This part of the archive is still being prepared. You can return to the timeline or continue in companion mode."
                  ariaLabel="Story content unavailable"
                  action={(
                    <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                      <RetryAction label="RETURN TO TIMELINE" onRetry={onBack} ariaLabel="Return to timeline" />
                      <RetryAction label="ASK THE COMPANION" onRetry={() => onTwin("qa")} ariaLabel="Open companion mode" />
                    </div>
                  )}
                />
              </div>
            ) : sceneLoading ? (
              <div style={{ maxWidth: 860 }}>
                <LoadingState label="Loading chapter" message="Pulling this verified scene from the RICON archive." />
              </div>
            ) : (
              <>
                <h1 className="bebas story-title-mobile-fit" style={{ fontSize: "clamp(54px,9vw,116px)", letterSpacing: 7, lineHeight: 0.88, color: "#F0EBE3", maxWidth: 900, marginBottom: 24 }}>
                  {moment.title}
                </h1>
                <div className="cormorant story-context-mobile-fit" style={{ fontSize: "clamp(22px,3vw,34px)", lineHeight: 1.45, color: "rgba(240,235,227,0.72)", maxWidth: 820 }}>
                  {activePanel.b}
                </div>
              </>
            )}
          </div>

          <div className="story-scene-controls" style={{ marginTop: 42 }}>
            <div style={{ height: 3, background: "rgba(255,255,255,0.08)", marginBottom: 18 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#7BC8E8,#C9A84C,#FFD87A)", transition: "width 0.35s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <div className="mono" style={{ fontSize: 9, color: "#555", letterSpacing: 2 }}>
                {missingChapterContent ? "CHAPTER STATUS · IN PREPARATION" : `SCENE ${step + 1}/${panels.length} · ${activePanel.k} · ${activePanel.t}`}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={prev} disabled={step === 0 || missingChapterContent} className="story-card-btn mono" style={{ fontSize: 9, letterSpacing: 2, padding: "10px 14px", background: "rgba(255,255,255,0.03)", color: step === 0 || missingChapterContent ? "#333" : "#C9A84C", border: "1px solid rgba(255,255,255,0.08)", cursor: step === 0 || missingChapterContent ? "not-allowed" : "pointer" }}>PREVIOUS SCENE</button>
                <button onClick={() => {
                  triggerHaptic("primary");
                  if (missingChapterContent) onTwin("qa");
                  else if (complete) onTwin("qa");
                  else next();
                }} className="cta-glow mono" style={{ fontSize: 9, letterSpacing: 2, padding: "10px 16px", background: "#C9A84C", color: "#080808", border: "none", cursor: "pointer" }}>
                  {missingChapterContent || complete ? "ASK TWIN" : "NEXT SCENE"}
                </button>
                <button onClick={() => {
                  setStep(0);
                  setVideoTime(0);
                  if (typeof onRestartProgress === "function") onRestartProgress({ athleteId: athlete.id, chapterNumber });
                  window.history.pushState(null, "", chapterSceneHash(chapterNumber, 1));
                }} className="story-card-btn mono" style={{ fontSize: 9, letterSpacing: 2, padding: "10px 14px", background: "rgba(255,255,255,0.02)", color: "#777", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer" }}>
                  RESTART CHAPTER
                </button>
                <button onClick={() => onTwin("qa")} className="story-card-btn mono story-ai-entry" style={{ fontSize: 9, letterSpacing: 2, padding: "10px 14px", background: "rgba(123,200,232,0.07)", color: "#7BC8E8", border: "1px solid rgba(123,200,232,0.32)", cursor: "pointer" }}>
                  ASK TWIN
                </button>
              </div>
            </div>
            {!missingChapterContent && (
              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <div className="mono" style={{ fontSize: 8, color: "#7BC8E8", letterSpacing: 2 }}>SCENE STEPPER</div>
                {panels.map((panel, index) => (
                  <button
                    key={`${panel.k}-${index}`}
                    type="button"
                    onClick={() => jumpToScene(index)}
                    aria-current={step === index ? "step" : undefined}
                    className="story-card-btn mono"
                    style={{ fontSize: 8, letterSpacing: 1.4, padding: "8px 10px", background: step === index ? "rgba(201,168,76,0.16)" : "rgba(255,255,255,0.02)", color: step === index ? "#FFD87A" : "#C9A84C", border: step === index ? "1px solid rgba(201,168,76,0.52)" : "1px solid rgba(201,168,76,0.22)", cursor: "pointer" }}
                    aria-label={`Jump to scene ${index + 1}: ${panel.k}. ${panel.t}`}
                    title={`${panel.k} · ${panel.t}`}
                  >
                    {index + 1}. {panel.k}
                  </button>
                ))}
              </div>
            )}
          </div>
          </ErrorBoundary>
        </div>

        <aside className="story-panel story-video-column" style={{ flex: "0 1 430px", padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 18 }}>
          <ErrorBoundary scopeLabel="story detail actions" resetKeys={[athlete.id, moment?.title]}>
          <div className="story-video-block">
          <StoryDetailActions
            athlete={athlete}
            moment={moment}
            progress={progress}
            onContinue={complete ? () => onTwin("qa") : next}
            onTwin={() => onTwin("qa")}
          />
          </div>
          </ErrorBoundary>

          <div className="story-supporting-card">
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
      {!twinOpen && (
        <div className="story-bottom-action-bar" role="toolbar" aria-label="Story quick actions">
          <button type="button" onClick={prev} disabled={step === 0 || missingChapterContent} aria-label="Go to previous scene">
            PREVIOUS
          </button>
          <button type="button" onClick={() => (missingChapterContent || complete ? onTwin("qa") : next())} aria-label={missingChapterContent || complete ? "Ask the Twin" : "Go to next scene"}>
            {missingChapterContent || complete ? "ASK TWIN" : "NEXT"}
          </button>
          <button type="button" onClick={() => onTwin("qa")} aria-label="Open Ask Twin companion">
            ASK TWIN
          </button>
          <button type="button" onClick={onBack} aria-label="Return to timeline">
            TIMELINE
          </button>
        </div>
      )}
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
  const persona = TWIN_PERSONA;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingId, setStreamingId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("ready");
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(() => chapterForContext(athlete, moment));
  const apiHistory = useRef([]);
  const abortRef = useRef(null);
  const lastRequestRef = useRef(null);
  const bottomRef = useRef(null);
  const composerRef = useRef(null);
  const modeRef = useRef(null);
  const recognitionRef = useRef(null);
  const starterSuggestions = useMemo(() => suggestionsFor(athlete, currentChapter, "starter"), [athlete, currentChapter]);
  const followupSuggestions = useMemo(() => suggestionsFor(athlete, currentChapter, "followup"), [athlete, currentChapter]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    const updateChapter = () => setCurrentChapter(chapterForContext(athlete, moment));
    updateChapter();
    window.addEventListener("hashchange", updateChapter);
    window.addEventListener("popstate", updateChapter);
    return () => {
      window.removeEventListener("hashchange", updateChapter);
      window.removeEventListener("popstate", updateChapter);
    };
  }, [athlete, moment]);

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
    abortRef.current?.abort?.();
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

  const errorMessageFor = (status, text) => {
    if (status === 429) return "The companion is receiving high traffic right now. Please wait a few seconds, then retry.";
    if (status === 401 || status === 403) return "The companion service is not authorized. Check the server API key configuration and retry.";
    if (status >= 500) return "The companion service is temporarily unavailable. Retry in a moment or switch modes.";
    return text || "We couldn't reach the companion service. Check your connection and try again.";
  };

  const streamTwin = async ({ history, assistantId, onComplete }) => {
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true); setError(null); setStreamingId(assistantId);

    const res = await fetch("/api/twin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        athlete,
        system: buildSystemPrompt(athlete),
        messages: history.map(({ role, content }) => ({ role, content })),
      }),
    });

    if (!res.ok) {
      throw new Error(errorMessageFor(res.status, await res.text()));
    }
    if (!res.body) throw new Error("Streaming is unavailable in this browser. Try refreshing or using a modern browser.");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      setMessages((current) => current.map((msg) => (
        msg.id === assistantId ? { ...msg, content: fullText, streaming: true } : msg
      )));
    }

    const reply = fullText || "The twin is momentarily silent.";
    setMessages((current) => current.map((msg) => (
      msg.id === assistantId ? { ...msg, content: reply, streaming: false } : msg
    )));
    onComplete?.(reply);
    return reply;
  };

  const runTwinRequest = async ({ history, userMessage = null, replaceAssistantId = null, modeTag = mode, onComplete }) => {
    const assistantId = replaceAssistantId || `assistant-${Date.now()}`;
    lastRequestRef.current = { history: [...history], assistantId, modeTag };
    if (userMessage) setMessages(p => [...p, userMessage, { id: assistantId, role: "assistant", content: "", streaming: true }]);
    else if (replaceAssistantId) setMessages(p => p.map(msg => msg.id === replaceAssistantId ? { ...msg, content: "", streaming: true } : msg));
    else setMessages(p => [...p, { id: assistantId, role: "assistant", content: "", streaming: true }]);

    try {
      await streamTwin({ history, assistantId, onComplete });
      showVoice(assistantId);
    } catch (err) {
      if (err.name === "AbortError") {
        setMessages(p => p.map(msg => msg.id === assistantId ? { ...msg, streaming: false, stopped: true, content: msg.content || "Generation stopped." } : msg));
      } else {
        setError(err.message || "Unable to reach the Digital Twin. Please try again.");
        setMessages(p => p.map(msg => msg.id === assistantId ? { ...msg, streaming: false, failed: true, content: msg.content || "" } : msg));
      }
    } finally {
      setLoading(false);
      setStreamingId(null);
      abortRef.current = null;
    }
  };

  const stopGeneration = () => {
    abortRef.current?.abort?.();
  };

  const retryLatest = () => {
    const last = lastRequestRef.current;
    if (!last || loading) return;
    runTwinRequest({
      history: last.history,
      replaceAssistantId: last.assistantId,
      modeTag: last.modeTag,
      onComplete: (reply) => {
        apiHistory.current = [...last.history, { role: "assistant", content: reply }];
      }
    });
  };

  const triggerNarrator = async () => {
    const prompt = `You are narrating your own legacy for a fan experiencing your verified story for the first time. Open with a powerful, cinematic first-person statement — who you are, what year defined you, what you were built for. Draw from at least one specific documented moment. Be emotionally resonant and concise.`;
    apiHistory.current = [{ role: "user", content: prompt }];
    setMessages([]);
    await runTwinRequest({
      history: apiHistory.current,
      onComplete: (reply) => apiHistory.current.push({ role: "assistant", content: reply })
    });
  };

  const continueNarrator = async () => {
    if (loading) return;
    const prompt = "Continue the story. Speak about a different defining chapter — a turning point that changed everything that followed. Draw from a specific documented moment.";
    apiHistory.current.push({ role: "user", content: prompt });
    await runTwinRequest({
      history: apiHistory.current,
      onComplete: (reply) => apiHistory.current.push({ role: "assistant", content: reply })
    });
  };

  const sendQA = async (override) => {
    const text = typeof override === "string" ? override : input;
    if (!text.trim() || loading) return;
    const userMsg = { id: `user-${Date.now()}`, role: "user", content: text };
    apiHistory.current.push({ role: "user", content: text });
    setInput(""); setError(null);
    composerRef.current?.focus?.();
    await runTwinRequest({
      history: apiHistory.current,
      userMessage: userMsg,
      onComplete: (reply) => apiHistory.current.push({ role: "assistant", content: reply })
    });
  };

  const switchMode = (m) => {
    if (m === modeRef.current) return;
    modeRef.current = m;
    apiHistory.current = [];
    abortRef.current?.abort?.();
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
      <div className="twin-header" style={{ padding: "calc(22px + var(--safe-top)) calc(36px + var(--safe-right)) 22px calc(36px + var(--safe-left))", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
        <div className="twin-title">
          <div className="mono" style={{ fontSize: 9, letterSpacing: 3, color: "#7BC8E8", marginBottom: 4 }}>{persona.icon} {persona.name.toUpperCase()} · VERIFIED RICON RECORD</div>
          <div className="bebas" style={{ fontSize: 26, letterSpacing: 4, color: "#F0EBE3" }}>{athlete.name}</div>
          <div className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#444", marginTop: 5 }}>{persona.badgeLabel}</div>
          {moment && <div className="mono" style={{ fontSize: 8, letterSpacing: 1, color: "#444", marginTop: 5 }}>CONTEXT · {moment.y} · {moment.title}</div>}
        </div>
        <div style={{ flex: 1 }} />
        {/* Mode toggle */}
        <div className="twin-mode-toggle" style={{ display: "flex", gap: 2, background: "#111", padding: 2, borderRadius: 3 }}>
          {["narrator","qa"].map(m => (
            <button key={m} onClick={() => switchMode(m)}
              className={mode === m ? "mode-btn-active" : ""}
              style={{ fontFamily: '"Inter"', fontSize: 9, letterSpacing: 2, padding: "8px 16px", border: "none", borderRadius: 2, cursor: "pointer", background: mode === m ? "#C9A84C" : "transparent", color: mode === m ? "#080808" : "#555", transition: "all 0.2s" }}>
              {m === "narrator" ? "▶ NARRATOR" : "✦ Q&A"}
            </button>
          ))}
        </div>
        <button className="twin-close" onClick={onClose}
          style={{ fontFamily: '"Inter"', fontSize: 9, letterSpacing: 2, color: "#444", background: "none", border: "1px solid #1e1e1e", padding: "8px 14px", cursor: "pointer", borderRadius: 2, transition: "color 0.2s" }}
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
              <span className="bebas" style={{ fontSize: 34, letterSpacing: 3, color: "#C9A84C" }}>{persona.avatarGlyph}</span>
            </div>
          </div>
          {/* Status */}
          <div style={{ textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: 2, color: loading ? "#7BC8E8" : "#C9A84C", marginBottom: 6 }}>
              {loading ? "◉ THINKING..." : isListening ? "◉ LISTENING..." : speakingIndex !== null ? "◉ VOICE ON" : "● READY"}
            </div>
            <div className="mono" style={{ fontSize: 8, letterSpacing: 1, color: "#2a2a2a" }}>{persona.versionLabel}</div>
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
                <div className="cormorant" style={{ fontSize: 22, color: "rgba(240,235,227,0.18)", marginBottom: 12 }}>
                  {mode === "narrator" ? persona.emptyState.narratorHeadline : persona.emptyState.qaHeadline}
                </div>
                <div className="mono" style={{ maxWidth: 640, margin: "0 auto 12px", fontSize: 9, letterSpacing: 1, lineHeight: 1.9, color: "#3a3a3a" }}>
                  {persona.emptyState.description}
                </div>
                {persona.chapterIntroLine(currentChapter, athlete) && (
                  <div className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#444", marginBottom: 10 }}>
                    {persona.chapterIntroLine(currentChapter, athlete)}
                  </div>
                )}
                {mode === "qa" && (
                  <>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: 2, color: "#2a2a2a", marginBottom: 10 }}>{persona.emptyState.trustLine}</div>
                    <div className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#333", marginBottom: 22 }}>CURRENT CHAPTER · {currentChapter?.number || 1} · {currentChapter?.title}</div>
                    <SuggestionChips suggestions={starterSuggestions} onSelect={sendQA} disabled={loading} label={`${currentChapter?.title || "Current chapter"} starter prompts`} />
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
                      <span className="bebas" style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 1 }}>{persona.avatarGlyph}</span>
                    </div>
                    <div className="assistant-message-bubble" style={{ flex: 1, paddingTop: 2 }}>
                      <div aria-live={msg.streaming ? "polite" : "off"} aria-atomic="false" role={msg.streaming ? "status" : undefined} style={{ minHeight: 56 }}>
                        {msg.content ? <SafeMarkdown content={msg.content} streaming={msg.streaming} /> : (msg.streaming ? <span className="stream-shimmer" style={{ display: "inline-block" }} /> : <SafeMarkdown content="The twin is momentarily silent." />)}
                        {msg.streaming && msg.content && <span className="stream-caret" aria-hidden="true" />}
                      </div>
                      <div className="mono" style={{ fontSize: 8, letterSpacing: 2, color: msg.failed ? "rgba(255,150,150,0.8)" : "#2e2e2e", marginTop: 10 }}>
                        {msg.failed ? "GENERATION FAILED · RETRY AVAILABLE" : msg.stopped ? "GENERATION STOPPED · RETRY AVAILABLE" : `✓ BASED ON VERIFIED RICON RECORD · SOURCES USED: ${athlete.moments.length}`}
                      </div>
                      {!msg.streaming && (
                        <VoiceSynthesisPanel
                          active={speakingIndex === msg.id || speakingIndex === "latest"}
                          status={voiceStatus}
                          onPlay={() => showVoice(msg.id)}
                          onStop={stopVoiceVisual}
                          mode={mode}
                        />
                      )}
                      {(i === messages.length - 1 && !loading) && (
                        <div style={{ marginTop: 12 }}>
                          <SuggestionChips suggestions={followupSuggestions} onSelect={sendQA} disabled={loading} label={`${currentChapter?.title || "Current chapter"} follow-up prompts`} />
                          <button className="proof-btn mono" onClick={retryLatest} aria-label={`Retry latest ${athlete.name} response`}
                            style={{ marginTop: 12, fontSize: 8, letterSpacing: 2, padding: "8px 10px", color: "#C9A84C", background: "transparent", border: "1px solid rgba(201,168,76,0.25)", cursor: "pointer" }}>
                            RETRY RESPONSE
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && messages[messages.length - 1]?.role !== "assistant" && (
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start", animation: "fadeIn 0.3s ease" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.42)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(201,168,76,0.05)" }}>
                  <span className="bebas" style={{ fontSize: 11, color: "#C9A84C" }}>{persona.avatarGlyph}</span>
                </div>
                <div style={{ display: "flex", gap: 7, alignItems: "center", paddingTop: 10 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#C9A84C", animation: `dot 1.4s ease-in-out ${i*0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mono" style={{ padding: "14px 18px", background: "rgba(255,70,70,0.07)", border: "1px solid rgba(255,70,70,0.2)", color: "rgba(255,150,150,0.8)", fontSize: 10, borderRadius: 2, lineHeight: 1.6 }}>
                <div style={{ marginBottom: 8 }}>{error}</div>
                <div style={{ color: "rgba(255,180,180,0.88)", marginBottom: 10 }}>Next step: retry the request or switch modes while the service recovers.</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="proof-btn mono" onClick={retryLatest} disabled={loading} aria-label={`Retry latest ${athlete.name} response after error`}
                    style={{ fontSize: 8, letterSpacing: 2, padding: "8px 10px", color: "#C9A84C", background: "transparent", border: "1px solid rgba(201,168,76,0.25)", cursor: loading ? "not-allowed" : "pointer" }}>
                    RETRY
                  </button>
                  <button className="proof-btn mono" onClick={() => switchMode(mode === "qa" ? "narrator" : "qa")} disabled={loading} aria-label={`Switch ${athlete.name} companion mode after error`}
                    style={{ fontSize: 8, letterSpacing: 2, padding: "8px 10px", color: "#7BC8E8", background: "transparent", border: "1px solid rgba(123,200,232,0.3)", cursor: loading ? "not-allowed" : "pointer" }}>
                    SWITCH MODE
                  </button>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input / Controls */}
          {mode === "qa" ? (
            <div className="twin-input-bar" style={{ padding: "18px calc(36px + var(--safe-right)) calc(20px + var(--safe-bottom)) calc(36px + var(--safe-left))", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="mono" style={{ fontSize: 8, color: isListening ? "#7BC8E8" : "#555", letterSpacing: 2, marginBottom: 10 }}>
                {isListening ? "MICROPHONE ACTIVE · SPEAK YOUR QUESTION" : voiceStatus}
              </div>
              <div className="mono" style={{ fontSize: 8, color: "#444", letterSpacing: 1, marginBottom: 10 }}>
                {persona.toneGuidance.qa}
              </div>
              <div className="twin-input-row" style={{ display: "flex", gap: 10 }}>
                <button onClick={isListening ? () => recognitionRef.current?.stop?.() : startVoiceInput} disabled={loading} aria-label={isListening ? `Stop voice input for ${athlete.name}` : `Ask ${athlete.name} by voice`}
                  style={{ fontFamily: '"Inter"', fontSize: 10, letterSpacing: 2, padding: "13px 16px", background: isListening ? "rgba(123,200,232,0.16)" : "transparent", color: isListening ? "#7BC8E8" : "#C9A84C", border: "1px solid rgba(201,168,76,0.28)", borderRadius: 2, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                  {isListening ? "STOP MIC" : "ASK BY VOICE"}
                </button>
                <label className="sr-only" htmlFor="twin-composer">Ask the Digital Twin a question</label>
                <textarea
                id="twin-composer"
                ref={composerRef}
                className="twin-input"
                aria-label={`Ask ${athlete.name} a question`}
                aria-describedby="twin-composer-help"
                autoComplete="off"
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendQA();
                  }
                }}
                placeholder={`Ask ${athlete.name.split(" ")[0]} anything...`}
                style={{ flex: 1, minHeight: 48, maxHeight: 130, resize: "vertical", background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)", color: "#F0EBE3", padding: "13px 18px", fontFamily: '"Inter"', fontSize: 14, borderRadius: 2, transition: "border-color 0.2s", lineHeight: 1.45 }} />
                <span id="twin-composer-help" className="sr-only">Press Enter to send. Press Shift and Enter to add a new line.</span>
                <button onClick={() => sendQA()} disabled={loading || !input.trim()} aria-label={`Send message to ${athlete.name}`}
                style={{ fontFamily: '"Inter"', fontSize: 10, letterSpacing: 2, padding: "13px 22px", background: loading || !input.trim() ? "#161616" : "#C9A84C", color: loading || !input.trim() ? "#3a3a3a" : "#080808", border: "none", borderRadius: 2, cursor: loading || !input.trim() ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                  SEND →
                </button>
                {loading && (
                  <button onClick={stopGeneration} aria-label={`Stop ${athlete.name} response generation`}
                  style={{ fontFamily: '"Inter"', fontSize: 10, letterSpacing: 2, padding: "13px 18px", background: "rgba(255,70,70,0.08)", color: "rgba(255,150,150,0.92)", border: "1px solid rgba(255,70,70,0.28)", borderRadius: 2, cursor: "pointer", transition: "all 0.2s" }}>
                    STOP
                  </button>
                )}
                <button onClick={onClose} disabled={loading} aria-label="Close AI companion"
                style={{ fontFamily: '"Inter"', fontSize: 10, letterSpacing: 2, padding: "13px 18px", background: "transparent", color: "#777", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 2, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                  CLOSE
                </button>
              </div>
            </div>
          ) : (
            messages.length > 0 && (
              <div className="twin-narrator-actions" style={{ padding: "20px calc(36px + var(--safe-right)) calc(20px + var(--safe-bottom)) calc(36px + var(--safe-left))", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <div className="mono" style={{ flexBasis: "100%", fontSize: 8, color: "#444", letterSpacing: 1, textAlign: "center" }}>
                  {persona.toneGuidance.narrator}
                </div>
                {!loading && <div className="voice-panel" style={{ flexBasis: "100%", maxWidth: 540 }}>
                  <div>
                    <div className="mono" style={{ fontSize: 8, color: "#7BC8E8", letterSpacing: 2, marginBottom: 5 }}>VOICE VISUALIZATION</div>
                    <div className="mono" style={{ fontSize: 8, color: "#555", letterSpacing: 1 }}>{voiceStatus}</div>
                  </div>
                  <div className="voice-bars" aria-hidden="true">{[0,1,2,3,4].map(i => <span key={i} style={{ animationPlayState: speakingIndex !== null ? "running" : "paused" }} />)}</div>
                  <button className="proof-btn mono" onClick={speakingIndex !== null ? stopVoiceVisual : () => showVoice("latest")}
                    style={{ fontSize: 8, letterSpacing: 2, padding: "8px 10px", color: "#C9A84C", background: "transparent", border: "1px solid rgba(201,168,76,0.25)", cursor: "pointer" }}>
                    {speakingIndex !== null ? "STOP VISUAL" : "SHOW VOICE"}
                  </button>
                </div>}
                {loading ? (
                  <button className="twin-btn" onClick={stopGeneration} aria-label={`Stop ${athlete.name} response generation`}
                    style={{ fontFamily: '"Inter"', fontSize: 9, letterSpacing: 2, padding: "11px 22px", background: "rgba(255,70,70,0.08)", color: "rgba(255,150,150,0.92)", border: "1px solid rgba(255,70,70,0.28)", cursor: "pointer", borderRadius: 2, transition: "all 0.25s" }}>
                    STOP GENERATION
                  </button>
                ) : <button className="twin-btn" onClick={continueNarrator} aria-label={`Continue ${athlete.name} narrator story`}
                  style={{ fontFamily: '"Inter"', fontSize: 9, letterSpacing: 2, padding: "11px 22px", background: "transparent", color: "#7BC8E8", border: "1px solid rgba(123,200,232,0.3)", cursor: "pointer", borderRadius: 2, transition: "all 0.25s" }}>
                  ▶ CONTINUE THE STORY
                </button>}
                {!loading && <button className="twin-btn" onClick={retryLatest} aria-label={`Retry latest ${athlete.name} narrator response`}
                  style={{ fontFamily: '"Inter"', fontSize: 9, letterSpacing: 2, padding: "11px 22px", background: "transparent", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)", cursor: "pointer", borderRadius: 2, transition: "all 0.25s" }}>
                  RETRY RESPONSE
                </button>}
                <button className="twin-btn" onClick={() => switchMode("qa")} disabled={loading} aria-label={`Switch to ${athlete.name} question and answer mode`}
                  style={{ fontFamily: '"Inter"', fontSize: 9, letterSpacing: 2, padding: "11px 22px", background: "transparent", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)", cursor: "pointer", borderRadius: 2, transition: "all 0.25s" }}>
                  ✦ SWITCH TO Q&A
                </button>
                <button className="twin-btn" onClick={onClose} disabled={loading} aria-label="Close AI companion"
                  style={{ fontFamily: '"Inter"', fontSize: 9, letterSpacing: 2, padding: "11px 22px", background: "transparent", color: "#777", border: "1px solid rgba(255,255,255,0.14)", cursor: loading ? "not-allowed" : "pointer", borderRadius: 2, transition: "all 0.25s" }}>
                  CLOSE
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
