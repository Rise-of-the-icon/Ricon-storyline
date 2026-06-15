import { Link } from "react-router-dom";

export default function TalentLayout({ children, title, lead }) {
  return (
    <div className="animate-page-enter talent-page">
      <nav className="app-nav sticky" aria-label="Talent workspace">
        <Link to="/" className="ghost-button auth-back-link">
          <span aria-hidden="true">← </span>Storyline
        </Link>
        <div className="nav-divider" />
        <span className="brand-mark">RICON</span>
        <div className="nav-divider" />
        <span className="brand-submark">Talent</span>
        <div className="nav-spacer" />
        <Link to="/feed" className="ghost-button">
          Fan feed
        </Link>
        <Link to="/talent/drops/new" className="secondary-button">
          New drop
        </Link>
      </nav>

      <main className="talent-main">
        {(title || lead) && (
          <header className="talent-header">
            <p className="auth-kicker">Talent workspace · POC</p>
            {title && <h1 className="talent-title">{title}</h1>}
            {lead && <p className="talent-lead">{lead}</p>}
          </header>
        )}
        {children}
      </main>
    </div>
  );
}
