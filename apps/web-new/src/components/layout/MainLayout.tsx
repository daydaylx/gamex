import { JSX } from 'preact';
import { Link, useLocation } from 'wouter-preact';
import { clsx } from 'clsx';

export interface MainLayoutProps {
  children: JSX.Element | JSX.Element[];
}

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { path: '/', label: 'Start', icon: '🏠' },
    { path: '/sessions', label: 'Sessions', icon: '📋' },
  ];

  return (
    <div className="app-layout">
      <header className="topbar">
        <div className="wrap">
          <h1>Intimacy Tool</h1>
          <p className="sub">Local-first. Lokal gespeichert (Plaintext). Kein Overthinking, nur Struktur.</p>
        </div>
      </header>

      <main className="wrap main-content">
        {children}
      </main>

      <nav className="mobile-bottom-nav">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a
              className={clsx('mobile-nav-item', { active: location === item.path })}
              aria-label={item.label}
            >
              <span className="mobile-nav-icon">{item.icon}</span>
              <span className="mobile-nav-label">{item.label}</span>
            </a>
          </Link>
        ))}
      </nav>
    </div>
  );
}

