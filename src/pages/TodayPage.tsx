import { rankRecipes } from '../domain/recommendationEngine';
import { useAppState } from '../state/AppState';
import { RecipeCard } from '../components/RecipeCard';
import { UseSoonCard } from '../components/UseSoonCard';
import { HabitInsight } from '../components/HabitInsight';

export function TodayPage() {
  const { data } = useAppState();
  const recommendations = rankRecipes(data.recipes, data.inventory, data.profile.routine.typicalServings, data.savedRecipes);
  const spinach = data.inventory.find((item) => item.id === 'food-spinach');
  const intervention = data.interventions.find((item) => item.id === 'intervention-spinach');
  return (
    <div className="page-stack">
      <section className="welcome-block">
        <span className="kicker">Good evening, {data.profile.name}</span>
        <h1>What should I cook?</h1>
        <p>Options based on what is available, what needs attention, and the time each meal takes.</p>
      </section>
      <section aria-labelledby="suggestions-heading">
        <div className="section-heading"><div><span className="kicker">For your next meal</span><h2 id="suggestions-heading">A few practical options</h2></div><span className="small-note">Ranked for {data.profile.routine.typicalServings} servings</span></div>
        <div className="recipe-list">{recommendations.slice(0, 3).map((recommendation) => <RecipeCard key={recommendation.recipe.id} recommendation={recommendation} />)}</div>
      </section>
      {spinach && intervention && <UseSoonCard food={spinach} intervention={intervention} />}
      {data.profile.notifications.habitSuggestions && data.habits[0] && <HabitInsight habit={data.habits[0]} />}
      <aside className="evidence-banner"><strong>Research boundary</strong><p>Recommendations are evidence-informed prototype hypotheses. Survey summaries combine people living alone and people not currently living alone.</p></aside>
    </div>
  );
}
