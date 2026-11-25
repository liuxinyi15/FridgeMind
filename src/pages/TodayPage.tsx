import { useState } from 'react';
import { Link } from 'react-router-dom';
import { rankRecipes } from '../domain/recommendationEngine';
import type { MealContextChoice } from '../domain/types';
import { useAppState } from '../state/AppState';
import { RecipeCard } from '../components/RecipeCard';
import { UseSoonCard } from '../components/UseSoonCard';
import { Icon } from '../components/Icon';
import { showsResearchUi } from '../domain/usability';

const todayKey = (now = new Date()) => [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');

export function TodayPage() {
  const { data, actions } = useAppState();
  const [changingContext, setChangingContext] = useState(false);
  const productNow = data.researchNow ? new Date(data.researchNow) : new Date();
  const context = data.mealContexts.find((entry) => entry.date === todayKey(productNow))?.choice ?? 'not_sure';
  const awayActive = data.awayMode.active && (!data.awayMode.until || data.awayMode.until >= todayKey(productNow));
  const recommendations = rankRecipes(data.recipes, data.inventory, data.profile.routine.typicalServings, data.savedRecipes, {
    cookingFrequency: data.profile.routine.cookingFrequency, mealContext: context, activity: data.activity,
    feedback: data.recommendationFeedback, substitutions: data.substitutions,
  });
  const readyNow = recommendations.filter((entry) => entry.availability === 'READY');
  const leftovers = data.inventory.filter((item) => item.kind === 'leftover' && (item.portions ?? 0) > 0);
  const attention = data.inventory.filter((item) => item.kind !== 'leftover' && item.batches.some((batch) => batch.state === 'use_soon'));
  const firstAttention = attention[0];
  const intervention = firstAttention ? data.interventions.find((item) => item.foodId === firstAttention.id) : undefined;
  const personalRecipes = data.recipes.filter((recipe) => recipe.ownership === 'personal');
  const hasUsefulPersonalState = data.inventory.length > 0 || personalRecipes.length > 0 || leftovers.length > 0;
  const preparedMeals = leftovers.reduce((sum, item) => sum + (item.portions ?? 0), 0);
  const summaryMetrics = [
    attention.length ? { value: attention.length, label: attention.length === 1 ? 'food needs attention' : 'foods need attention' } : null,
    readyNow.length ? { value: readyNow.length, label: readyNow.length === 1 ? 'meal without shopping' : 'meals without shopping' } : null,
    preparedMeals ? { value: preparedMeals, label: preparedMeals === 1 ? 'meal already prepared' : 'meals already prepared' } : null,
  ].filter((metric): metric is { value: number; label: string } => Boolean(metric));

  return <div className="page-stack today-page">
    <section className="welcome-block compact-welcome"><span className="overline">Today</span><h1>{!hasUsefulPersonalState ? 'Start with something useful.' : attention.length ? `${attention.length} ${attention.length === 1 ? 'food may' : 'foods may'} be forgotten.` : leftovers.length ? 'A meal is already prepared.' : 'Your food, at a glance.'}</h1>{!hasUsefulPersonalState && <p>Add a few foods or one recipe you already like. FridgeMind can then show what needs using and what you can make.</p>}{hasUsefulPersonalState && <><div className="tonight-control"><span>Tonight</span><strong>{contextLabel(context)}</strong><button className="text-button" onClick={() => setChangingContext((value) => !value)}>{changingContext ? 'Done' : 'Change'}</button></div>{changingContext && <div className="meal-context" role="group" aria-label="Tonight's plan">{([['cooking', 'Cooking tonight'], ['eating_out', 'Eating out'], ['not_sure', 'Not sure']] as [MealContextChoice, string][]).map(([value, label]) => <button key={value} aria-pressed={context === value} onClick={() => { actions.setMealContext(value); setChangingContext(false); }}>{label}</button>)}</div>}</>}</section>

    {!hasUsefulPersonalState ? <section className="empty-state new-user-empty"><Icon name="leaf" size={32} /><h2>Choose a quick start</h2><div className="empty-choice-grid"><Link className="button primary" to="/fridge/add">Quick add foods</Link><Link className="button secondary" to="/recipes/import">Add a recipe</Link><Link className="button ghost" to="/recipes">Explore ideas</Link></div></section> : <>
      {summaryMetrics.length ? <section className="today-metrics" aria-label="Today summary">{summaryMetrics.map((metric) => <article key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></article>)}</section> : <div className="quiet-card today-zero-state"><strong>{data.inventory.length === 0 ? 'Add a few foods to see what you can make.' : personalRecipes.length === 0 ? 'Add one of your usual recipes to see what your fridge can already cover.' : 'Nothing needs attention. Check your recipes when you are ready to cook.'}</strong></div>}

      {awayActive && <section className="away-summary"><div><span className="overline">Away mode</span><h2>{attention.length} foods may need attention</h2><p>Meal prompts are paused.</p></div><button className="button secondary" onClick={() => actions.setAwayMode(false)}>I’m back</button></section>}

      {attention.length > 0 && <section className="today-value-section" aria-labelledby="attention-title"><div className="section-heading"><div><span className="overline">Needs attention</span><h2 id="attention-title">{attention.length} {attention.length === 1 ? 'food may' : 'foods may'} be forgotten</h2></div></div>{firstAttention && intervention ? <UseSoonCard food={firstAttention} intervention={intervention} /> : firstAttention && <AttentionRow name={firstAttention.name} canonicalName={firstAttention.canonicalName} foodId={firstAttention.id} />}{attention.slice(1).map((food) => <AttentionRow key={food.id} name={food.name} canonicalName={food.canonicalName} foodId={food.id} />)}</section>}

      {!awayActive && leftovers.length > 0 && <section aria-labelledby="sorted-title"><div className="section-heading"><div><span className="overline">Already sorted</span><h2 id="sorted-title">Tomorrow’s lunch is already ready</h2></div></div>{leftovers.map((leftover) => <article className="leftover-hero" key={leftover.id}><div className="leftover-icon"><Icon name="servings" size={26} /></div><div><h3>{leftover.name}</h3><p>{leftover.portions} {leftover.portions === 1 ? 'portion' : 'portions'} left · {storedLabel(leftover.cookedAt, productNow)}</p></div><button className="button secondary" onClick={() => actions.consumeLeftover(leftover.id)}>Eat 1 portion</button></article>)}</section>}

      {!awayActive && context !== 'eating_out' && readyNow.length > 0 && <section className="today-recommendations" aria-labelledby="no-shop-title"><div className="section-heading"><div><span className="overline">Cook without shopping</span><h2 id="no-shop-title">{readyNow.length} {readyNow.length === 1 ? 'dinner' : 'dinners'} you can make without shopping</h2></div><Link className="text-button" to="/recipes">See recipes</Link></div><div className="recipe-list recipe-grid today-ready-grid">{readyNow.slice(0, 3).map((recommendation, index) => <RecipeCard key={recommendation.recipe.id} recommendation={recommendation} featured={index === 0 && attention.length === 0 && leftovers.length === 0} />)}</div></section>}
      {showsResearchUi(data) && recommendations.some((entry) => entry.availability !== 'READY') && <section aria-label="Research fixture recipe options"><div className="section-heading"><div><span className="overline">Research fixture</span><h2>Other meal options</h2></div></div><div className="recipe-list recipe-grid">{recommendations.filter((entry) => entry.availability !== 'READY').slice(0, 3).map((recommendation) => <RecipeCard key={recommendation.recipe.id} recommendation={recommendation} />)}</div></section>}
    </>}
  </div>;
}

function AttentionRow({ name, canonicalName, foodId }: { name: string; canonicalName: string; foodId: string }) {
  const { actions } = useAppState();
  return <article className="attention-row"><div><strong>{name}</strong><span>Use soon</span></div><Link to={`/recipes?uses=${canonicalName}`}>Find a meal</Link><button onClick={() => actions.handleFood(foodId, 'used')}>I used it</button><Link to={`/fridge/${foodId}`}>Check options</Link></article>;
}

function contextLabel(context: MealContextChoice) { return context === 'cooking' ? 'Cooking' : context === 'eating_out' ? 'Eating out' : 'Not sure'; }

function storedLabel(cookedAt: string | undefined, now: Date) {
  if (!cookedAt) return 'Stored recently';
  const cooked = new Date(cookedAt); const cookedDay = new Date(cooked.getFullYear(), cooked.getMonth(), cooked.getDate()).getTime();
  const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); const days = Math.round((currentDay - cookedDay) / 86_400_000);
  if (days === 0) return 'Stored today'; if (days === 1) return 'Stored yesterday'; return `Stored ${days} days ago`;
}
