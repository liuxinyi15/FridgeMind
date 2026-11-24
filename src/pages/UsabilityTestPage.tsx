import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateTaskMetrics, interviewPrompts, observationOptions, usabilityTasks } from '../domain/usability';
import type { UsabilityTaskId } from '../domain/types';
import { useAppState } from '../state/AppState';
import { StatusChip } from '../components/StatusChip';

export function UsabilityTestPage() {
  const { data, actions } = useAppState();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState<Record<UsabilityTaskId, boolean>>({
    'task-1': true, 'task-2': true, 'task-3': true, 'task-4': true, 'task-5': true, 'task-6': true, 'task-7': true,
  });
  const session = data.usabilitySessions.find((entry) => entry.id === data.currentUsabilitySessionId) ?? [...data.usabilitySessions].reverse()[0];
  const launch = (taskId: UsabilityTaskId, path: string) => {
    actions.launchUsabilityTask(taskId, ratings[taskId]);
    navigate(path);
  };
  const exportResults = () => {
    const payload = {
      format: 'fridgemind-usability-v1',
      exportedAt: new Date().toISOString(),
      storage: 'local-only',
      sessions: data.usabilitySessions.map((entry) => ({
        ...entry,
        taskRuns: entry.taskRuns.map((run) => ({ ...run, metrics: calculateTaskMetrics(run, entry.events) })),
      })),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `fridgemind-usability-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <div className="page-stack usability-research-page">
    <section className="research-header"><span className="kicker">Research Mode</span><h1>Usability Test</h1><p>Launch deterministic participant tasks, review friction signals, and export the local session record.</p><div className="research-privacy"><strong>Local only</strong><span>No participant data is uploaded.</span></div></section>

    <section className="research-session-card"><div><span className="overline">Current session</span><h2>{data.currentUsabilitySessionId ? 'Session in progress' : session ? 'Most recent session' : 'No session yet'}</h2><p>{session ? `Started ${new Date(session.startedAt).toLocaleString('en-GB')} · ${session.taskRuns.length} task runs` : 'Start a session before handing the device to a participant.'}</p></div><div className="button-row">{!data.currentUsabilitySessionId && <button className="button primary" onClick={actions.startUsabilitySession}>Start new session</button>}{data.currentUsabilitySessionId && <><button className="button secondary" onClick={() => actions.logUsabilityEvent('dead_end_marked')}>Mark dead end</button><button className="button ghost" onClick={actions.endUsabilitySession}>End session</button></>}<button className="button secondary" onClick={exportResults} disabled={!data.usabilitySessions.length}>Export JSON</button></div></section>

    <section aria-labelledby="usability-tasks-title"><div className="section-heading"><div><h2 id="usability-tasks-title">Participant tasks</h2><p>Each launch resets to its deterministic starting state.</p></div></div><div className="usability-task-list">{usabilityTasks.map((task) => {
      const latestRun = session ? [...session.taskRuns].reverse().find((run) => run.taskId === task.id) : undefined;
      return <article className="usability-task-card" key={task.id}><div className="usability-task-number">{task.id.replace('task-', '')}</div><div className="usability-task-copy"><div className="task-title-line"><h3>{task.title}</h3>{latestRun && <StatusChip tone={latestRun.status === 'completed' ? 'good' : latestRun.status === 'abandoned' ? 'danger' : 'warn'}>{latestRun.status}</StatusChip>}</div><p><strong>Setup:</strong> {task.scenario}</p><blockquote>{task.prompt}</blockquote><p className="success-criterion"><strong>Success:</strong> {task.success}</p><details><summary>What is captured</summary><ul>{task.capture.map((item) => <li key={item}>{item}</li>)}</ul></details></div><div className="usability-task-controls"><label><input type="checkbox" checked={ratings[task.id]} onChange={(event) => setRatings({ ...ratings, [task.id]: event.target.checked })} /> Ask post-task ratings</label><button className="button primary" onClick={() => launch(task.id, task.startPath)}>Launch task</button></div></article>;
    })}</div></section>

    {session && <section aria-labelledby="metrics-title"><div className="section-heading"><div><h2 id="metrics-title">Session task results</h2><p>Counts indicate interaction patterns, not usability quality by themselves.</p></div></div>{session.taskRuns.length ? <div className="metrics-table-wrap"><table className="metrics-table"><thead><tr><th>Task</th><th>Done</th><th>Interactions</th><th>Back</th><th>Time</th><th>Corrections</th><th>Dead ends</th><th>Disclosures</th></tr></thead><tbody>{session.taskRuns.map((run, index) => { const metrics = calculateTaskMetrics(run, session.events); return <tr key={`${run.taskId}-${run.startedAt}-${index}`}><td>{run.taskId.replace('task-', '')}</td><td>{metrics.completion ? 'Yes' : 'No'}</td><td>{metrics.interactions}</td><td>{metrics.backNavigations}</td><td>{metrics.seconds === null ? '—' : `${metrics.seconds}s`}</td><td>{metrics.corrections}</td><td>{metrics.deadEnds}</td><td>{metrics.disclosures}</td></tr>; })}</tbody></table></div> : <div className="empty-state compact"><p>No tasks have been launched in this session.</p></div>}</section>}

    {session && <section aria-labelledby="observations-title"><div className="section-heading"><div><h2 id="observations-title">Researcher observation checklist</h2><p>Mark observed behaviour; do not infer it from click count alone.</p></div></div><div className="observation-checklist">{observationOptions.map((option) => <label key={option}><input type="checkbox" checked={session.observations.includes(option)} onChange={() => actions.toggleUsabilityObservation(option)} /> <span>{option}</span></label>)}</div></section>}

    <section aria-labelledby="interview-title"><div className="section-heading"><div><h2 id="interview-title">Final interview guide</h2><p>Researcher-facing prompts for after the tasks.</p></div></div><ol className="interview-guide">{interviewPrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ol></section>

    <details className="research-walkthrough"><summary>Exact participant walkthrough instructions</summary><ol><li>Start a new session and choose the first task.</li><li>Read only the quoted task prompt aloud; do not name buttons or routes.</li><li>Hand the device to the participant and remain neutral.</li><li>Use “Mark dead end” only when the participant reaches a genuine impasse.</li><li>Let automatic success detection end the task, or use “I’m finished” if the participant verbalises completion.</li><li>If the participant stops, use “I want to stop” so abandonment is recorded.</li><li>Collect the optional ratings when enabled.</li><li>Return to this page, mark observed behaviours, and launch the next task.</li><li>For Task 7, explain only that it is the next evening.</li><li>After the interview, end the session and export the JSON file.</li></ol></details>
  </div>;
}
