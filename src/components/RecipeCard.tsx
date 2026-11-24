import { Link } from 'react-router-dom';
import type { RecommendationScore } from '../domain/recommendationEngine';
import { StatusChip } from './StatusChip';
import { Icon } from './Icon';
import { RecipeArtwork } from './RecipeArtwork';

export function RecipeCard({ recommendation, featured = false }: { recommendation: RecommendationScore; featured?: boolean }) {
  const { recipe } = recommendation;
  const gapLabel = recommendation.missingIngredientCount === 0 ? 'Everything you need' : `Missing ${recommendation.missingIngredientCount} ${recommendation.missingIngredientCount === 1 ? 'ingredient' : 'ingredients'}`;
  return (
    <article className={`recipe-card${featured ? ' featured' : ''}`}>
      <Link className="recipe-visual" to={`/recipes/${recipe.id}`} aria-label={`View ${recipe.name}`}>
        <RecipeArtwork recipe={recipe} eager={featured} />
        {recommendation.useSoonCoverage > 0 && <span className="image-badge"><Icon name="leaf" size={14} /> Uses food soon</span>}
      </Link>
      <div className="recipe-card-body">
        <div className="eyebrow-row">
          <span><Icon name="clock" size={15} /> {recipe.minutes} min</span><span><Icon name="servings" size={15} /> {recipe.baseServings} servings</span>
        </div>
        <h3><Link to={`/recipes/${recipe.id}`}>{recipe.name}</Link></h3>
        <div className="recipe-card-footer"><StatusChip tone={recommendation.missingIngredientCount === 0 ? 'good' : 'neutral'}>{gapLabel}</StatusChip>{featured && <Link className="button primary compact" to={`/recipes/${recipe.id}`}>Cook this</Link>}</div>
        {featured && <details className="explanation">
          <summary>Why this suggestion?</summary>
          <ul>{recommendation.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </details>}
      </div>
    </article>
  );
}
