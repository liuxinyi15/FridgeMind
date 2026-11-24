import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { useAppState } from '../state/AppState';
import { NativeRuntimeBridge } from './NativeRuntimeBridge';
import { Icon, type IconName } from './Icon';

const navItems = [
  { to: '/', label: 'Today', icon: 'home' },
  { to: '/fridge', label: 'Fridge', icon: 'fridge' },
  { to: '/recipes', label: 'Recipes', icon: 'recipes' },
  { to: '/shopping', label: 'Shopping', icon: 'shopping' },
];

export function Layout() {
  const { data } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  const isDetail = !['/', '/fridge', '/recipes', '/shopping'].includes(location.pathname);
  useLayoutEffect(() => {
    const reset = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    reset();
    const frame = window.requestAnimationFrame(reset);
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);
  return (
    <div className="app-shell">
      <NativeRuntimeBridge />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="app-header">
        <div className="header-inner">
          {isDetail ? <button className="icon-button" onClick={() => navigate(-1)} aria-label="Go back"><Icon name="back" /></button> : <div className="brand-mark" aria-hidden="true"><Icon name="leaf" size={20} /></div>}
          <div className="brand-copy">
            <strong>FridgeMind</strong>
            <span>{isDetail ? 'Back to your day' : 'Make what you have count'}</span>
          </div>
          <NavLink className="avatar-link" to="/settings" aria-label="Open settings">{data.profile.name.slice(0, 1)}</NavLink>
        </div>
      </header>
      <main id="main-content" className="page-content" tabIndex={-1}><Outlet /></main>
      <nav className="bottom-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => window.scrollTo(0, 0)} className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon"><Icon name={item.icon as IconName} size={21} /></span><span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
