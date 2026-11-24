import { Link } from 'react-router-dom';
import { rankRecipes } from '../domain/recommendationEngine';
import type { MealContextChoice } from '../domain/types';
import { useAppState } from '../state/AppState';
import { RecipeCard } from '../components/RecipeCard';
import { UseSoonCard } from '../components/UseSoonCard';
import { HabitInsight } from '../components/HabitInsight';
import { Icon } from '../components/Icon';

const todayKey = (now = new Date()) => {
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
};

export function TodayPage() {
  const { data, actions } = useAppState();
  const productNow = data.researchNow ? new Date(data.researchNow) : new Date();
  const context = data.mealContexts.find((entry) => entry.date === todayKey(productNow))?.choice ?? 'not_sure';
  const awayActive = data.awayMode.active && (!data.awayMode.until || data.awayMode.until >= todayKey(productNow));
  const recommendations = rankRecipes(data.recipes, data.inventory, data.profile.routine.typicalServings, data.savedRecipes, {
    cookingFrequency: data.profile.routine.cookingFrequency,
    mealContext: context,
    activity: data.activity,
    feedback: data.recommendationFeedback,
    substitutions: data.substitutions,
  });
  const leftovers = data.inventory.filter((item) => item.kind === 'leftover' && (item.portions ?? 0) > 0);
  const useSoon = data.inventory.find((item) => item.kind !== 'leftover' && item.batches.some((batch) => batch.state === 'use_soon'));
  const intervention = useSoon ? data.interventions.find((item) => item.foodId === useSoon.id) ?? data.interventions[0] : undefined;

  return (
    <div className="page-stack today-page">
      <section className="welcome-block">
        <span className="overline">Good evening, {data.profile.name}</span>
        <h1>{awayActive ? 'Before you go.' : context === 'eating_out' ? 'Enjoy your evening out.' : leftovers.length ? 'Dinner is already sorted.' : 'Dinner, sorted.'}</h1>
        <p>{awayActive ? 'Urgent food stays visible; routine meal prompts are paused.' : context === 'eating_out' ? 'No cooking nudge — only food that may need a quick plan.' : 'Here’s the easiest realistic win from your fridge.'}</p>
        <div className="meal-context" role="group" aria-label="Tonight's plan">
          {([
            ['cooking', 'Cooking tonight'],
            ['eating_out', 'Eating out'],
            ['not_sure', 'Not sure'],
          ] as [MealContextChoice, string][]).map(([value, label]) => <button key={value} aria-pressed={context === value} onClick={() => actions.setMealContext(value)}>{label}</button>)}
        </div>
      </section>

      {awayActive && <section className="away-summary"><div><span className="overline">Away mode</span><h2>{data.inventory.filter((item) => item.batches.some((batch) => batch.state === 'use_soon')).length} foods may need attention</h2><p>Meal reminders are paused{data.awayMode.until ? ' until ' + new Date(data.awayMode.until + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}.</p></div><button className="button secondary" onClick={() => actions.setAwayMode(false)}>I’m back</button></section>}

      {!awayActive && context !== 'eating_out' && leftovers.length > 0 && <section className="leftover-hero">
        <div className="leftover-icon"><Icon name="servings" size={26} /></div>
        <div><span className="overline">Eat this first</span><h2>{leftovers[0].name}</h2><p>{leftovers[0].portions} {leftovers[0].portions === 1 ? 'portion' : 'portions'} left · {storedLabel(leftovers[0].cookedAt, productNow)}</p></div>
        <button className="button primary" onClick={() => actions.consumeLeftover(leftovers[0].id)}>Eat 1 portion</button>
      </section>}

      {!awayActive && context !== 'eating_out' && !leftovers.length && <section aria-labelledby="suggestions-heading" className="today-recommendations">
        <h2 id="suggestions-heading" className="sr-only">Your next meal</h2>
        {recommendations[0] && <RecipeCard recommendation={recommendations[0]} featured />}
        {recommendations.length > 1 && <div className="more-ideas"><div className="section-heading"><h2>More easy ideas</h2><span>{data.profile.routine.typicalServings} portions</span></div><div className="recipe-list horizontal">{recommendations.slice(1, 3).map((recommendation) => <RecipeCard key={recommendation.recipe.id} recommendation={recommendation} />)}</div></div>}
        {!recommendations.length && <div className="empty-state"><h2>No strong match right now</h2><p>Check your fridge information or browse recipes when you feel like cooking.</p><Link className="button secondary" to="/recipes">Browse recipes</Link></div>}
      </section>}

      {context === 'eating_out' && useSoon && <section className="calm-context-card"><Icon name="snowflake" size={24} /><div><h2>One quick fridge check</h2><p>{useSoon.name} may need attention. Freeze or store it if that suits the food and its label.</p></div><button className="button secondary" onClick={() => actions.handleFood(useSoon.id, 'frozen')}>I froze it</button></section>}
      {useSoon && intervention && <UseSoonCard food={useSoon} intervention={intervention} />}
      {!awayActive && data.profile.notifications.habitSuggestions && data.habits[0] && <HabitInsight habit={data.habits[0]} />}
    </div>
  );
}

function storedLabel(cookedAt: string | undefined, now: Date) {
  if (!cookedAt) return 'Stored recently';
  const cooked = new Date(cookedAt);
  const cookedDay = new Date(cooked.getFullYear(), cooked.getMonth(), cooked.getDate()).getTime();
  const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.round((currentDay - cookedDay) / 86_400_000);
  if (days === 0) return 'Stored today';
  if (days === 1) return 'Stored yesterday';
  return `Stored ${days} days ago`;
}
