import { Link } from 'react-router-dom';
import type { RecommendationScore } from '../domain/recommendationEngine';
import { StatusChip } from './StatusChip';
import { Icon } from './Icon';
import { RecipeArtwork } from './RecipeArtwork';
import { useAppState } from '../state/AppState';

export function RecipeCard({ recommendation, featured = false }: { recommendation: RecommendationScore; featured?: boolean }) {
  const { data, actions } = useAppState();
  const { recipe } = recommendation;
  const gapLabel = recommendation.availability === 'READY'
    ? 'Everything you need'
    : recommendation.availability === 'READY_WITH_UNCERTAINTY'
      ? `Check ${recommendation.uncertainIngredientCount} ${recommendation.uncertainIngredientCount === 1 ? 'item' : 'items'}`
      : `Missing ${recommendation.missingIngredientCount} ${recommendation.missingIngredientCount === 1 ? 'ingredient' : 'ingredients'}`;
  const correctionItem = data.inventory.find((item) => recipe.ingredients.some((ingredient) => ingredient.canonicalName === item.canonicalName));
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
        <div className="recipe-card-footer"><StatusChip tone={recommendation.availability === 'READY' ? 'good' : 'neutral'}>{gapLabel}</StatusChip>{featured && <Link className="button primary compact" to={`/recipes/${recipe.id}`}>Cook this</Link>}</div>
        {featured && <details className="explanation">
          <summary>Why this suggestion?</summary>
          <ul>{recommendation.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          <div className="recommendation-feedback">
            <span>Not right today?</span>
            <button onClick={() => actions.addRecommendationFeedback(recipe.id, 'not_in_mood')}>Not in the mood</button>
            <button onClick={() => actions.addRecommendationFeedback(recipe.id, 'ate_recently')}>Already ate this recently</button>
            <button onClick={() => actions.addRecommendationFeedback(recipe.id, 'never_recommend')}>Don’t recommend this recipe</button>
            {correctionItem && <Link to={`/fridge/${correctionItem.id}`}>Ingredient information is wrong</Link>}
          </div>
        </details>}
      </div>
    </article>
  );
}
