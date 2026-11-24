import { useEffect, useState } from 'react';
import { nativeNotifications, type NotificationPermissionState } from '../platform/notifications';
import { useAppState } from '../state/AppState';

export function NativeNotificationPermissionCard() {
  const { data } = useAppState();
  const [permission, setPermission] = useState<NotificationPermissionState>('unavailable');
  const [showExplanation, setShowExplanation] = useState(false);
  const [status, setStatus] = useState('');
  const [working, setWorking] = useState(false);
  const available = nativeNotifications.isAvailable();

  useEffect(() => {
    void nativeNotifications.checkPermission().then(setPermission);
  }, []);

  const requestPermission = async () => {
    setWorking(true);
    const result = await nativeNotifications.requestPermission();
    setPermission(result);
    setShowExplanation(false);
    setStatus(result === 'granted' ? 'OS notifications are enabled for this device.' : 'Permission was not granted. Food Rescue remains available inside Today.');
    setWorking(false);
  };

  const sendPreview = async () => {
    const intervention = data.interventions[0];
    if (!intervention) return;
    setWorking(true);
    try {
      await nativeNotifications.deliver(intervention);
      setStatus('A real local notification preview was scheduled on this device.');
    } catch {
      setStatus('The OS notification could not be scheduled. In-app Food Rescue is unchanged.');
    } finally {
      setWorking(false);
    }
  };

  return <>
    <section className="settings-card native-capability-card" aria-labelledby="native-notifications-title">
      <div><span className="kicker">Your choice</span><h2 id="native-notifications-title">Device notifications</h2><p>Food rescue stays available inside Today even when notifications are off.</p></div>
      <div className="capability-status"><span aria-hidden="true">{permission === 'granted' ? '✓' : available ? '○' : '—'}</span><div><strong>{permission === 'granted' ? 'Permission granted' : available ? 'Permission not enabled' : 'Available in the installed app'}</strong><small>{available ? 'This device supports local notifications.' : 'Open the installed app to change device permission.'}</small></div></div>
      {available && permission !== 'granted' && <button className="button secondary full" onClick={() => setShowExplanation(true)}>Enable OS notifications</button>}
      {available && permission === 'granted' && <button className="button secondary full" onClick={sendPreview} disabled={working}>{working ? 'Scheduling…' : 'Send notification preview'}</button>}
      {!available && <button className="button secondary full" disabled>Install the app to enable</button>}
      {status && <p className="inline-feedback" role="status">{status}</p>}
    </section>

    {showExplanation && <div className="sheet-backdrop" role="presentation" onClick={() => setShowExplanation(false)}>
      <section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="notification-permission-title" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <span className="kicker">Before the OS asks</span>
        <h2 id="notification-permission-title">Choose whether FridgeMind may notify you</h2>
        <p>Notifications can surface an actionable use-soon opportunity when the app is not open. You can change this later in system settings.</p>
        <ul className="permission-list"><li>Quiet Hours and reminder preferences still apply</li><li>Dismissing a reminder suppresses immediate repetition</li><li>If denied, Food Rescue remains inside Today</li></ul>
        <div className="sheet-actions"><button className="button secondary" onClick={() => setShowExplanation(false)}>Not now</button><button className="button primary" onClick={requestPermission} disabled={working}>{working ? 'Requesting…' : 'Continue to OS settings'}</button></div>
      </section>
    </div>}
  </>;
}
