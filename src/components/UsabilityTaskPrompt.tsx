import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usabilityTasks } from '../domain/usability';
import type { UsabilityTaskRun } from '../domain/types';
import { useAppState } from '../state/AppState';

export function UsabilityTaskPrompt() {
  const { data, actions } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  const session = data.usabilitySessions.find((entry) => entry.id === data.currentUsabilitySessionId);
  const taskId = session?.currentTaskId;
  const task = usabilityTasks.find((entry) => entry.id === taskId);
  const run = taskId ? [...(session?.taskRuns ?? [])].reverse().find((entry) => entry.taskId === taskId) : undefined;
  const response = run ? session?.responses.find((entry) => entry.runId === run.id) : undefined;
  if (!session || !task || !run || location.pathname.startsWith('/settings/research')) return null;

  if (session.mode === 'participant') {
    if (run.status !== 'running') return null;
    const finish = () => { actions.completeUsabilityTask(); navigate('/test'); };
    const abandon = () => { actions.abandonUsabilityTask(); navigate('/test'); };
    return <aside className="participant-task-controls" aria-label="Study task controls" data-usability-control>
      <span>Task {task.id.replace('task-', '')} of 7</span>
      <div><button onClick={abandon}>I can’t complete this task</button><button className="participant-finish-button" onClick={finish}>I’m finished</button></div>
    </aside>;
  }

  return <aside className={`usability-task-prompt ${run.status}`} aria-live="polite" data-usability-control>
    <div><span>{run.status === 'running' ? 'Your task' : run.status === 'completed' ? 'Task complete' : 'Task stopped'}</span><strong>{task.prompt}</strong></div>
    {run.status === 'running' && <div className="usability-prompt-actions"><button onClick={actions.completeUsabilityTask}>I’m finished</button><button onClick={actions.abandonUsabilityTask}>I want to stop</button></div>}
    {run.status === 'completed' && run.askPostTaskQuestions && !response && <PostTaskQuestions run={run} />}
    {run.status !== 'running' && (!run.askPostTaskQuestions || response) && <p>Please return the device to the researcher.</p>}
  </aside>;
}

function PostTaskQuestions({ run }: { run: UsabilityTaskRun }) {
  const { actions } = useAppState();
  const [ease, setEase] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [comment, setComment] = useState('');
  return <form className="post-task-panel" onSubmit={(event) => { event.preventDefault(); actions.submitPostTaskResponse(run.id, run.taskId, ease, confidence, comment); }}>
    <Rating label="How easy was this task?" low="Very difficult" high="Very easy" value={ease} setValue={setEase} name="ease" />
    <Rating label="How confident are you that FridgeMind understood your situation?" low="Not confident" high="Very confident" value={confidence} setValue={setConfidence} name="confidence" />
    <label>Optional comment<textarea rows={2} value={comment} onChange={(event) => setComment(event.target.value)} /></label>
    <button className="button primary" type="submit">Submit feedback</button>
  </form>;
}

function Rating({ label, low, high, value, setValue, name }: { label: string; low: string; high: string; value: 1 | 2 | 3 | 4 | 5; setValue: (value: 1 | 2 | 3 | 4 | 5) => void; name: string }) {
  return <fieldset><legend>{label}</legend><div className="rating-scale">{([1, 2, 3, 4, 5] as const).map((number) => <label key={number} className={value === number ? 'selected' : ''}><input type="radio" name={name} checked={value === number} onChange={() => setValue(number)} /><span>{number}</span></label>)}</div><div className="rating-anchors"><span>1 — {low}</span><span>5 — {high}</span></div></fieldset>;
}
