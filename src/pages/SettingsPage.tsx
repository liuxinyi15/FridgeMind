import { Link } from 'react-router-dom';
import { HabitInsight } from '../components/HabitInsight';
import { NativeNotificationPermissionCard } from '../components/NativeNotificationPermissionCard';
import type { ReminderMode } from '../domain/types';
import { useAppState } from '../state/AppState';
import { Icon } from '../components/Icon';

export function SettingsPage() {
  const { data, actions } = useAppState();
  const preferences = data.profile.notifications;
  return <div className="page-stack narrow-page settings-page">
    <section><span className="overline">Your profile</span><h1>Settings</h1><p>Make FridgeMind work your way.</p></section>
    <section className="profile-card"><div className="profile-avatar">{data.profile.name.slice(0, 1)}</div><div><strong>{data.profile.name}</strong><span>Cooking for {data.profile.routine.typicalServings} most often</span></div></section>
    <section className="settings-group" aria-labelledby="reminder-settings"><h2 id="reminder-settings">Reminders</h2><div className="settings-card">
      <div className="setting-row"><div className="setting-label"><span className="setting-icon"><Icon name="bell" size={19} /></span><div><strong>Helpful reminders</strong><span>Food rescue and shopping nudges</span></div></div><label className="switch"><input type="checkbox" checked={preferences.proactiveEnabled} onChange={(e) => actions.updateNotifications({ proactiveEnabled: e.target.checked, mode: e.target.checked && preferences.mode === 'off' ? 'actionable' : preferences.mode })} /><span aria-hidden="true" /></label></div>
      <label className="setting-select"><span>Reminder style</span><select value={preferences.mode} onChange={(e) => actions.updateNotifications({ mode: e.target.value as ReminderMode, proactiveEnabled: e.target.value !== 'off' })}><option value="actionable">Action + reminder</option><option value="simple">Simple reminder</option><option value="in_app">In-app only</option><option value="off">Off</option></select></label>
      <div className="setting-row"><div className="setting-label"><span className="setting-icon"><Icon name="clock" size={19} /></span><div><strong>Quiet hours</strong><span>{preferences.quietStart}–{preferences.quietEnd}</span></div></div><label className="switch"><input type="checkbox" checked={preferences.quietHoursEnabled} onChange={(e) => actions.updateNotifications({ quietHoursEnabled: e.target.checked })} /><span aria-hidden="true" /></label></div>
      {preferences.quietHoursEnabled && <div className="field-row compact-times"><label>From<input type="time" value={preferences.quietStart} onChange={(e) => actions.updateNotifications({ quietStart: e.target.value })} /></label><label>Until<input type="time" value={preferences.quietEnd} onChange={(e) => actions.updateNotifications({ quietEnd: e.target.value })} /></label></div>}
    </div></section>
    <section className="settings-group" aria-labelledby="suggestion-settings"><h2 id="suggestion-settings">Suggestions</h2><div className="settings-card">{([
      ['useSoon', 'Food rescue', 'When food needs using soon'], ['shopping', 'Shopping', 'Useful list reminders'], ['habitSuggestions', 'Routine insights', 'Patterns you can approve'],
    ] as const).map(([key, label, description]) => <div className="setting-row compact-setting" key={key}><div><strong>{label}</strong><span>{description}</span></div><label className="switch"><input type="checkbox" checked={preferences[key]} onChange={(e) => actions.updateNotifications({ [key]: e.target.checked })} /><span aria-hidden="true" /></label></div>)}</div></section>
    {data.habits[0] && <details className="settings-disclosure"><summary><span className="setting-icon"><Icon name="sparkle" size={19} /></span><span><strong>Routine insight</strong><small>Review what FridgeMind noticed</small></span><Icon name="chevron" size={18} /></summary><HabitInsight habit={data.habits[0]} /></details>}
    <details className="settings-disclosure"><summary><span className="setting-icon"><Icon name="bell" size={19} /></span><span><strong>Device notifications</strong><small>Permission and preview controls</small></span><Icon name="chevron" size={18} /></summary><NativeNotificationPermissionCard /></details>
    <details className="settings-disclosure"><summary><span className="setting-icon"><Icon name="lock" size={19} /></span><span><strong>Privacy & app details</strong><small>Local data and technical notes</small></span><Icon name="chevron" size={18} /></summary><div className="disclosure-body"><p>Your fridge, preferences and activity are stored locally by this prototype. Photos are not uploaded for recognition.</p><Link to="/settings/research">Open Demo / Research Mode</Link><button className="button secondary full" onClick={actions.resetDemo}>Reset demo data</button></div></details>
  </div>;
}
