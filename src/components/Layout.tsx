import { NavLink, Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useAppState } from '../state/AppState';
import { NativeRuntimeBridge } from './NativeRuntimeBridge';
import { Icon, type IconName } from './Icon';
import { UsabilityTaskPrompt } from './UsabilityTaskPrompt';
import { recipeOpenedMetadata } from '../domain/usability';

const navItems = [
  { to: '/', label: 'Today', icon: 'home' },
  { to: '/fridge', label: 'Fridge', icon: 'fridge' },
  { to: '/recipes', label: 'Recipes', icon: 'recipes' },
  { to: '/shopping', label: 'Shopping', icon: 'shopping' },
];

export function Layout() {
  const { data, actions } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const visited = useRef(false);
  const session = data.usabilitySessions.find((entry) => entry.id === data.currentUsabilitySessionId);
  const activeRun = session?.currentTaskId ? [...session.taskRuns].reverse().find((entry) => entry.taskId === session.currentTaskId) : undefined;
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
  useEffect(() => {
    if (!activeRun || activeRun.status !== 'running') return;
    actions.logUsabilityEvent('page_visited', undefined, location.pathname);
    if (/^\/recipes\/[^/]+$/.test(location.pathname) && !location.pathname.endsWith('/import')) {
      const recipeId = location.pathname.split('/').pop() ?? '';
      actions.logUsabilityEvent('recipe_opened', recipeOpenedMetadata(data, recipeId), location.pathname);
    }
    if (visited.current && navigationType === 'POP') actions.logUsabilityEvent('back_navigation', undefined, location.pathname);
    visited.current = true;
  }, [location.pathname, navigationType, activeRun?.status, activeRun?.startedAt]);
  useEffect(() => {
    if (!activeRun || activeRun.status !== 'running') return;
    const capture = (event: MouseEvent) => {
      const control = (event.target as HTMLElement).closest('button, a, summary') as HTMLElement | null;
      if (!control || control.closest('[data-usability-control]')) return;
      const label = (control.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80);
      const metadata = session?.mode === 'participant' ? undefined : { label };
      if (control.tagName === 'SUMMARY') {
        if (/why this suggestion/i.test(label)) actions.logUsabilityEvent('recommendation_explanation_opened', metadata);
        else if (/more/i.test(label)) actions.logUsabilityEvent('more_opened', metadata);
        else actions.logUsabilityEvent('explanatory_disclosure_opened', metadata);
        return;
      }
      if (control.classList.contains('primary')) actions.logUsabilityEvent('primary_cta_clicked', metadata);
      else if (control.classList.contains('secondary') || control.classList.contains('ghost') || control.classList.contains('text-button')) actions.logUsabilityEvent('secondary_cta_clicked', metadata);
    };
    document.addEventListener('click', capture);
    return () => document.removeEventListener('click', capture);
  }, [activeRun?.status, activeRun?.startedAt, session?.mode]);
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
      <UsabilityTaskPrompt />
      {data.experienceMode === 'demo' && <div className="demo-banner"><strong>Demo Fridge</strong><span>Sample data</span><button onClick={actions.leaveDemo}>Exit demo</button></div>}
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
