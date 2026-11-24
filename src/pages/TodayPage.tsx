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
    <div className="page-stack today-page">
      <section className="welcome-block">
        <span className="overline">Good evening, {data.profile.name}</span>
        <h1>Dinner, sorted.</h1>
        <p>Here’s the easiest win from your fridge.</p>
      </section>
      <section aria-labelledby="suggestions-heading" className="today-recommendations">
        <h2 id="suggestions-heading" className="sr-only">Your next meal</h2>
        {recommendations[0] && <RecipeCard recommendation={recommendations[0]} featured />}
        {recommendations.length > 1 && <div className="more-ideas"><div className="section-heading"><h2>More easy ideas</h2><span>{data.profile.routine.typicalServings} portions</span></div><div className="recipe-list horizontal">{recommendations.slice(1, 3).map((recommendation) => <RecipeCard key={recommendation.recipe.id} recommendation={recommendation} />)}</div></div>}
      </section>
      {spinach && intervention && <UseSoonCard food={spinach} intervention={intervention} />}
      {data.profile.notifications.habitSuggestions && data.habits[0] && <HabitInsight habit={data.habits[0]} />}
    </div>
  );
}
