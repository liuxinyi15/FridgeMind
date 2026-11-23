import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { NativeRuntimeBridge } from './NativeRuntimeBridge';

const navItems = [
  { to: '/', label: 'Today', icon: '⌂' },
  { to: '/fridge', label: 'My Fridge', icon: '▤' },
  { to: '/recipes', label: 'Recipes', icon: '◫' },
  { to: '/shopping', label: 'Shopping', icon: '✓' },
];

export function Layout() {
  const { data } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  const isDetail = !['/', '/fridge', '/recipes', '/shopping'].includes(location.pathname);
  return (
    <div className="app-shell">
      <NativeRuntimeBridge />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="app-header">
        <div className="header-inner">
          {isDetail ? <button className="icon-button" onClick={() => navigate(-1)} aria-label="Go back">‹</button> : <div className="brand-mark" aria-hidden="true">F</div>}
          <div className="brand-copy">
            <strong>FridgeMind</strong>
            <span>Make what you have count</span>
          </div>
          <NavLink className="avatar-link" to="/settings" aria-label="Open settings">{data.profile.name.slice(0, 1)}</NavLink>
        </div>
      </header>
      <main id="main-content" className="page-content" tabIndex={-1}><Outlet /></main>
      <nav className="bottom-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
