import { useEffect, useMemo, useState, type ReactNode } from "react";
import "./AppShell.css";

type NavItem = {
  label: string;
  href: string;
};

type AppShellProps = {
  children: ReactNode;
};

const desktopNavItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Stories", href: "/#stories" },
  { label: "NBA", href: "/#nba" },
  { label: "Music", href: "/#music" },
  { label: "Timeline", href: "/#timeline" },
  { label: "About", href: "/#about" },
  { label: "Ask AI", href: "/#ask-ai" },
];

const mobileNavItems = [
  { label: "Home", href: "/", icon: "⌂" },
  { label: "Stories", href: "/#stories", icon: "▤" },
  { label: "Timeline", href: "/#timeline", icon: "⎯" },
  { label: "Ask", href: "/#ask-ai", icon: "✦" },
  { label: "Saved", href: "/#saved", icon: "◈" },
];

function activeForHref(href: string, pathname: string, hash: string) {
  if (href === "/") return pathname === "/" && !hash;
  const [, itemHash = ""] = href.split("#");
  return hash === `#${itemHash}`;
}

export default function AppShell({ children }: AppShellProps) {
  const [scrolled, setScrolled] = useState(false);
  const [locationState, setLocationState] = useState(() => ({
    pathname: typeof window === "undefined" ? "/" : window.location.pathname,
    hash: typeof window === "undefined" ? "" : window.location.hash,
  }));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const syncLocation = () => {
      setLocationState({
        pathname: window.location.pathname,
        hash: window.location.hash,
      });
    };
    syncLocation();
    window.addEventListener("hashchange", syncLocation);
    window.addEventListener("popstate", syncLocation);
    return () => {
      window.removeEventListener("hashchange", syncLocation);
      window.removeEventListener("popstate", syncLocation);
    };
  }, []);

  const desktopLinks = useMemo(() => desktopNavItems.map((item) => ({
    ...item,
    active: activeForHref(item.href, locationState.pathname, locationState.hash),
  })), [locationState.hash, locationState.pathname]);

  const mobileLinks = useMemo(() => mobileNavItems.map((item) => ({
    ...item,
    active: activeForHref(item.href, locationState.pathname, locationState.hash),
  })), [locationState.hash, locationState.pathname]);

  return (
    <div className="app-shell">
      <a className="app-shell-skip" href="#main-content">Skip to content</a>

      <header className={`app-shell-header ${scrolled ? "app-shell-header-scrolled" : ""}`} aria-label="RICON primary navigation">
        <div className="app-shell-header-inner">
          <a className="app-shell-brand" href="/" aria-label="RICON Storyline home">
            <span className="app-shell-brand-mark" aria-hidden="true">R</span>
            <span className="app-shell-brand-copy">
              <span className="app-shell-brand-name">RICON</span>
              <span className="app-shell-brand-subtitle">Storyline</span>
            </span>
          </a>

          <nav className="app-shell-desktop-nav" aria-label="Desktop navigation">
            {desktopLinks.map((item) => (
              <a
                key={item.label}
                className={`app-shell-nav-link ${item.active ? "app-shell-nav-link-active" : ""} ${item.label === "Ask AI" ? "app-shell-nav-link-ai" : ""}`}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <header className="app-shell-mobile-header" aria-label="RICON mobile header">
        <a className="app-shell-mobile-logo" href="/" aria-label="RICON Storyline home">RICON</a>
        <a className="app-shell-mobile-ask" href="/#ask-ai">Ask AI</a>
      </header>

      <main id="main-content" className="app-shell-main" tabIndex={-1}>
        {children}
      </main>

      <button className="app-shell-ai-launcher" type="button" aria-label="Open AI assistant placeholder" disabled>
        <span aria-hidden="true">✦</span>
        Ask AI
      </button>

      <nav className="app-shell-bottom-nav" aria-label="Mobile bottom navigation">
        {mobileLinks.map((item) => (
          <a
            key={item.label}
            className={`app-shell-bottom-link ${item.active ? "app-shell-bottom-link-active" : ""}`}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
          >
            <span className="app-shell-bottom-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
