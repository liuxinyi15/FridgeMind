import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { studyAssetUrl, usabilityTasks, type UsabilityStudyAsset } from '../domain/usability';
import {
  createUsabilityExportPayload,
  downloadUsabilityResults,
  participantResultsFilename,
  participantSessionFromData,
  sanitiseParticipantId,
} from '../domain/usabilityExport';
import type { UsabilityTaskRun } from '../domain/types';
import { useAppState } from '../state/AppState';
import { Icon } from '../components/Icon';

type RatingValue = 1 | 2 | 3 | 4 | 5;

export function ParticipantStudyPage() {
  const { data, actions } = useAppState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryParticipant = sanitiseParticipantId(searchParams.get('participant') ?? '');
  const [participantId, setParticipantId] = useState(queryParticipant);
  const [copyStatus, setCopyStatus] = useState('');
  const session = participantSessionFromData(data);
  const latestRun = session?.taskRuns.at(-1);
  const latestResponse = latestRun ? session?.responses.find((response) => response.runId === latestRun.id) : undefined;

  const nextTask = useMemo(() => {
    if (!session || latestRun?.status === 'running' || (latestRun && !latestResponse)) return undefined;
    return usabilityTasks[session.taskRuns.length];
  }, [session, latestRun, latestResponse]);

  const startStudy = () => {
    const safeId = sanitiseParticipantId(participantId);
    if (!safeId) return;
    actions.startParticipantStudy(safeId);
  };
  const beginTask = (taskIndex: number) => {
    const task = usabilityTasks[taskIndex];
    if (!task) return;
    actions.launchUsabilityTask(task.id, true);
    navigate(task.startPath);
  };
  const download = () => {
    if (!session?.participantId) return;
    downloadUsabilityResults(createUsabilityExportPayload([session]), participantResultsFilename(session.participantId));
    actions.markParticipantResultsDownloaded();
  };
  const copy = async () => {
    if (!session) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(createUsabilityExportPayload([session]), null, 2));
      setCopyStatus('Results copied');
    } catch {
      setCopyStatus('Copy was unavailable. Please download the file instead.');
    }
  };
  const clear = () => {
    if (window.confirm('Clear this study session and its locally stored results? This cannot be undone.')) actions.clearParticipantStudyData();
  };

  if (session && queryParticipant && queryParticipant !== session.participantId) {
    return <StudyShell progress={null}><section className="participant-card">
      <span className="overline">Study already in this browser</span>
      <h1>Participant ID doesn’t match</h1>
      <p>This browser currently holds a study for <strong>{session.participantId}</strong>. The link you opened is for <strong>{queryParticipant}</strong>.</p>
      <p>Continue the existing study, or clear it before starting with a different ID.</p>
      <div className="button-row"><button className="button primary" onClick={() => navigate('/test', { replace: true })}>Continue {session.participantId}</button><button className="button secondary" onClick={clear}>Clear existing study data</button></div>
    </section></StudyShell>;
  }

  if (!session) {
    return <StudyShell progress={null}><section className="participant-card participant-intro">
      <span className="overline">Remote study</span>
      <h1>FridgeMind usability study</h1>
      <div className="study-intro-copy"><p>You’ll complete several everyday food-planning tasks using FridgeMind.</p><p>We’re testing the product, not you. There are no right or wrong answers.</p><p>Please use the app as you naturally would.</p></div>
      <form onSubmit={(event) => { event.preventDefault(); startStudy(); }}>
        <label htmlFor="participant-id">Participant ID<input id="participant-id" autoComplete="off" value={participantId} onChange={(event) => setParticipantId(sanitiseParticipantId(event.target.value))} placeholder="For example, P03" required /></label>
        <button className="button primary full" type="submit" disabled={!sanitiseParticipantId(participantId)}>Start study</button>
      </form>
      <p className="participant-privacy"><Icon name="lock" size={17} />Your study interactions are stored only in this browser until you download the results. FridgeMind does not automatically upload study data.</p>
    </section></StudyShell>;
  }

  if (session.completedAt) {
    return <StudyShell progress={7}><section className="participant-card participant-complete">
      <div className="study-complete-icon" aria-hidden="true">✓</div>
      <h1>Thanks — you’ve completed the FridgeMind study.</h1>
      <p>Please download your study results and send the file back to the researcher.</p>
      <button className="button primary full" onClick={download}>{session.resultsDownloadedAt ? 'Download again' : 'Download study results'}</button>
      {session.resultsDownloadedAt && <p className="download-status" role="status">✓ Results downloaded</p>}
      <button className="button secondary full" onClick={copy}>Copy results</button>
      {copyStatus && <p className="copy-status" role="status">{copyStatus}</p>}
      <button className="text-button clear-study" onClick={clear}>Clear study data</button>
    </section></StudyShell>;
  }

  if (latestRun?.status === 'running') {
    const task = usabilityTasks.find((entry) => entry.id === latestRun.taskId)!;
    return <StudyShell progress={session.taskRuns.length}><section className="participant-card">
      <span className="overline">Task {session.taskRuns.length} of 7</span>
      <h1>Task in progress</h1>
      <blockquote className="participant-task-prompt">{task.prompt}</blockquote>
      {task.studyAsset && <StudyMaterial asset={task.studyAsset} />}
      <p>Your progress is still saved in this browser.</p>
      <button className="button primary full" onClick={() => navigate(task.startPath)}>Continue task</button>
    </section></StudyShell>;
  }

  if (latestRun && !latestResponse) {
    return <StudyShell progress={session.taskRuns.length}><PostTaskScreen run={latestRun} isLast={session.taskRuns.length === usabilityTasks.length} /> </StudyShell>;
  }

  const taskIndex = nextTask ? usabilityTasks.indexOf(nextTask) : 0;
  const task = nextTask ?? usabilityTasks[0];
  return <StudyShell progress={taskIndex + 1}><section className="participant-card participant-task-card">
    <span className="overline">Task {taskIndex + 1} of 7</span>
    <h1>{task.title}</h1>
    <blockquote className="participant-task-prompt">{task.prompt}</blockquote>
    {task.studyAsset && <StudyMaterial asset={task.studyAsset} />}
    <button className="button primary full" onClick={() => beginTask(taskIndex)}>Begin task</button>
  </section></StudyShell>;
}

function StudyMaterial({ asset }: { asset: UsabilityStudyAsset }) {
  const url = studyAssetUrl(asset.path, import.meta.env.BASE_URL);
  return <section className="participant-study-material" aria-label="Study material">
    <span className="overline">{asset.label}</span>
    <a className="study-material-preview" href={url} target="_blank" rel="noreferrer" aria-label={`Open ${asset.label.toLowerCase()}`}><img src={url} alt={`${asset.label} screenshot`} /></a>
    <div className="button-row"><a className="button secondary" href={url} target="_blank" rel="noreferrer">Open image</a><a className="button ghost" href={url} download>Download image</a></div>
  </section>;
}

function PostTaskScreen({ run, isLast }: { run: UsabilityTaskRun; isLast: boolean }) {
  const { actions } = useAppState();
  const [ease, setEase] = useState<RatingValue | null>(null);
  const [confidence, setConfidence] = useState<RatingValue | null>(null);
  const [comment, setComment] = useState('');
  return <section className="participant-card participant-rating-card">
    <span className="overline">Task {run.taskId.replace('task-', '')} of 7</span>
    <h1>Quick task feedback</h1>
    <form onSubmit={(event) => {
      event.preventDefault();
      if (!ease || !confidence) return;
      actions.submitPostTaskResponse(run.id, run.taskId, ease, confidence, comment);
      if (isLast) actions.endUsabilitySession();
    }}>
      <Rating label="How easy was this task?" low="Very difficult" high="Very easy" value={ease} setValue={setEase} name="participant-ease" />
      <Rating label="How confident are you that FridgeMind understood your situation?" low="Not confident" high="Very confident" value={confidence} setValue={setConfidence} name="participant-confidence" />
      <label>Anything confusing or unexpected?<textarea rows={4} value={comment} onChange={(event) => setComment(event.target.value)} /></label>
      <button className="button primary full" type="submit" disabled={!ease || !confidence}>{isLast ? 'Finish study' : 'Next task'}</button>
    </form>
  </section>;
}

function Rating({ label, low, high, value, setValue, name }: { label: string; low: string; high: string; value: RatingValue | null; setValue: (value: RatingValue) => void; name: string }) {
  return <fieldset className="participant-rating"><legend>{label}</legend><div className="rating-scale">{([1, 2, 3, 4, 5] as const).map((number) => <label key={number} className={value === number ? 'selected' : ''}><input type="radio" name={name} aria-label={`${number}${number === 1 ? ` — ${low}` : number === 5 ? ` — ${high}` : ''}`} checked={value === number} onChange={() => setValue(number)} /><span>{number}</span></label>)}</div><div className="rating-anchors"><span>1 — {low}</span><span>5 — {high}</span></div></fieldset>;
}

function StudyShell({ children, progress }: { children: React.ReactNode; progress: number | null }) {
  return <main className="participant-study-shell">
    <header className="participant-study-header"><div className="brand-mark" aria-hidden="true"><Icon name="leaf" size={20} /></div><strong>FridgeMind</strong>{progress !== null && <span>Task {progress} of 7</span>}</header>
    {progress !== null && <div className="study-progress" aria-label={`Task ${progress} of 7`}><span style={{ width: `${(progress / 7) * 100}%` }} /></div>}
    <div className="participant-study-content">{children}</div>
  </main>;
}
