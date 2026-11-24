import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { availableToPlan } from '../domain/inventory';
import { useAppState } from '../state/AppState';
import { StatusChip } from '../components/StatusChip';
import { FoodIcon } from '../components/FoodIcon';
import { Icon } from '../components/Icon';

type Filter = 'all' | 'use_soon' | 'check';

export function FridgePage() {
  const { data } = useAppState();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const useSoonCount = data.inventory.filter((item) => item.batches.some((batch) => batch.state === 'use_soon')).length;
  const needsCheckCount = data.inventory.filter((item) => item.batches.some((batch) => batch.confidence === 'needs_confirmation')).length;
  const filtered = useMemo(() => data.inventory.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(query.toLowerCase().trim());
    const batch = food.batches[0];
    return matchesSearch && (filter === 'all' || (filter === 'use_soon' && batch.state === 'use_soon') || (filter === 'check' && batch.confidence === 'needs_confirmation'));
  }), [data.inventory, query, filter]);

  return (
    <div className="page-stack fridge-page">
      <section className="page-title-row"><div><span className="overline">Your food</span><h1>My Fridge</h1><p>{data.inventory.length} ingredients · {useSoonCount ? `${useSoonCount} to use soon` : 'everything looks good'}</p></div><Link className="button primary add-food-button" to="/fridge/add"><Icon name="plus" size={19} /> <span>Add food</span></Link></section>
      {location.state?.cooked && <p className="inline-feedback" role="status">Nice work — your fridge is updated after cooking {location.state.cooked}.</p>}
      <section className="inventory-tools" aria-label="Find and filter food">
        <label className="search-field"><span className="sr-only">Search your fridge</span><Icon name="search" size={19} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your fridge" /></label>
        <div className="filter-chips" role="group" aria-label="Filter foods">
          <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All <span>{data.inventory.length}</span></button>
          <button aria-pressed={filter === 'use_soon'} onClick={() => setFilter('use_soon')}>Use soon <span>{useSoonCount}</span></button>
          <button aria-pressed={filter === 'check'} onClick={() => setFilter('check')}>Needs check <span>{needsCheckCount}</span></button>
        </div>
      </section>
      <section aria-labelledby="inventory-heading"><div className="section-heading"><h2 id="inventory-heading">{filter === 'all' ? 'Everything' : filter === 'use_soon' ? 'Use soon' : 'Needs a check'}</h2><span>{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</span></div>
        {filtered.length ? <div className="food-list">{filtered.map((food) => {
          const batch = food.batches[0]; const available = availableToPlan(batch);
          return <Link key={food.id} className="food-card" to={`/fridge/${food.id}`} aria-label={`${food.name}, ${available === null ? 'amount unknown' : `${available} ${batch.unit}`}. Edit details`}>
            <FoodIcon name={food.canonicalName} />
            <div className="food-main"><div className="food-name-line"><h3>{food.name}</h3>{batch.state === 'use_soon' && <StatusChip tone="warn">Use soon</StatusChip>}</div><p>{available === null ? 'Amount needs checking' : `${available}${batch.unit} · ${batch.storage}`} · {dateLabel(batch.relevantDate, batch.dateType)}</p>{batch.confidence !== 'confirmed' && <span className="uncertainty-note"><Icon name="info" size={14} /> {batch.confidence === 'estimated' ? 'Estimated amount' : 'Tap to confirm amount'}</span>}</div>
            <Icon className="row-chevron" name="chevron" size={18} />
          </Link>;
        })}</div> : <div className="empty-state compact"><FoodIcon name="salad" large /><h2>Nothing here</h2><p>Try another filter or add something new.</p></div>}
      </section>
    </div>
  );
}

function dateLabel(date: string | undefined, type: string) {
  if (!date) return 'No date added';
  const value = new Date(`${date}T12:00:00`);
  const today = new Date();
  const days = Math.round((value.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000);
  const label = type === 'use_by' ? 'Use by' : 'Best before';
  if (days === 0) return `${label} today`;
  if (days === 1) return `${label} tomorrow`;
  return `${label} ${value.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
}
