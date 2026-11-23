import { Link } from 'react-router-dom';
import { availableToPlan } from '../domain/inventory';
import { useAppState } from '../state/AppState';
import { StatusChip } from '../components/StatusChip';

export function FridgePage() {
  const { data } = useAppState();
  const useSoonCount = data.inventory.filter((item) => item.batches.some((batch) => batch.state === 'use_soon')).length;
  return (
    <div className="page-stack">
      <section className="page-title-row"><div><span className="kicker">Low-effort awareness</span><h1>My Fridge</h1><p>{data.inventory.length} foods tracked · {useSoonCount} need attention</p></div><Link className="button primary" to="/fridge/add">Add food</Link></section>
      <div className="inventory-summary"><div><span>Use soon</span><strong>{useSoonCount}</strong></div><div><span>Needs a check</span><strong>{data.inventory.filter((item) => item.batches.some((batch) => batch.confidence === 'needs_confirmation')).length}</strong></div><div><span>Planned stock</span><strong>{data.inventory.filter((item) => item.batches.some((batch) => batch.reservedStock > 0)).length}</strong></div></div>
      <section aria-labelledby="inventory-heading"><div className="section-heading"><h2 id="inventory-heading">Current inventory</h2><span className="small-note">Physical − reserved = available</span></div>
        <div className="food-list">{data.inventory.map((food) => {
          const batch = food.batches[0]; const available = availableToPlan(batch);
          return <article key={food.id} className="food-card">
            <div className="food-icon" aria-hidden="true">{food.name.slice(0, 1)}</div>
            <div className="food-main"><h3><Link to={`/fridge/${food.id}`}>{food.name}</Link></h3><p>{available === null ? 'Amount unknown' : `${available}${batch.unit} available`} · {batch.storage}</p><div className="chip-row">{batch.state === 'use_soon' && <StatusChip tone="warn">Use soon</StatusChip>}<StatusChip tone={batch.confidence === 'confirmed' ? 'good' : batch.confidence === 'needs_confirmation' ? 'danger' : 'neutral'}>{batch.confidence.replace('_', ' ')}</StatusChip></div></div>
            <div className="food-date"><span>{batch.dateType.replace('_', '-')}</span><strong>{batch.relevantDate ?? 'Check label'}</strong></div>
          </article>;
        })}</div>
      </section>
    </div>
  );
}
