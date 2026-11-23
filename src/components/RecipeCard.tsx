import { Link } from 'react-router-dom';
import type { RecommendationScore } from '../domain/recommendationEngine';
import { StatusChip } from './StatusChip';

export function RecipeCard({ recommendation }: { recommendation: RecommendationScore }) {
  const { recipe } = recommendation;
  const match = Math.round(recommendation.pantryCoverage * 100);
  return (
    <article className="recipe-card">
      <div className="recipe-visual" aria-hidden="true"><span>{recipe.tags[0]}</span></div>
      <div className="recipe-card-body">
        <div className="eyebrow-row">
          <span>{recipe.minutes} min</span><span>·</span><span>{recipe.baseServings} servings</span>
        </div>
        <h3><Link to={`/recipes/${recipe.id}`}>{recipe.name}</Link></h3>
        <div className="chip-row">
          <StatusChip tone={match >= 75 ? 'good' : 'neutral'}>{match}% available</StatusChip>
          {recommendation.useSoonCoverage > 0 && <StatusChip tone="warn">Uses food soon</StatusChip>}
        </div>
        <p className="card-summary">{recommendation.missingIngredientCount === 0 ? 'No confirmed gaps' : `${recommendation.missingIngredientCount} ${recommendation.missingIngredientCount === 1 ? 'gap' : 'gaps'} to resolve`}</p>
        <details className="explanation">
          <summary>Why this suggestion?</summary>
          <ul>{recommendation.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          <p className="research-note">Prototype heuristic — not empirically validated.</p>
        </details>
      </div>
    </article>
  );
}
