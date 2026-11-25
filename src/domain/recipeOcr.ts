import type { Recipe } from './types';

export type OcrQuality = 'good' | 'review_needed' | 'poor';
export type RecipeOcrPass = 'primary' | 'contrast' | 'threshold';

export interface OcrLine {
  text: string;
  confidence?: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
}

export interface OcrDocumentResult {
  rawText: string;
  text: string;
  meanConfidence?: number;
  lines: OcrLine[];
  qualityScore: number;
  quality: OcrQuality;
  pass: RecipeOcrPass;
  psm: string;
  discardedLines: string[];
}

const fractionCharacters = '¼½¾⅓⅔⅛⅜⅝⅞';

export function normaliseRecipeHeading(line: string) {
  return line.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z'\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function isIngredientHeading(line: string) {
  return /^(?:ingredients?|what you(?:'|’)ll need)$/.test(normaliseRecipeHeading(line));
}

export function isMethodHeading(line: string) {
  return /^(?:method|instructions?|directions?|preparation|steps?|how to make it)$/.test(normaliseRecipeHeading(line));
}

export function isRecipeMetadataLine(line: string) {
  const value = line.trim();
  return /^(?:serves?|servings?|yield|makes?|ready in|prep(?:aration)? time|cook(?:ing)? time|total time)\b/i.test(value)
    || /^\d+(?:\.\d+)?\s+(?:servings?|minutes?|mins?|hours?|hrs?)\b/i.test(value);
}

function symbolRatio(value: string) {
  const compact = value.replace(/\s/g, '');
  if (!compact) return 1;
  return compact.replace(new RegExp(`[A-Za-z0-9${fractionCharacters}]`, 'g'), '').length / compact.length;
}

function suspiciousShortCapitals(value: string) {
  const lettersOnly = value.replace(/[^A-Za-z]/g, '');
  if (!lettersOnly || lettersOnly !== lettersOnly.toUpperCase()) return false;
  const words = value.match(/[A-Z]+/g) ?? [];
  const letters = words.join('').length;
  return words.length >= 2 && letters <= 6 && words.every((word) => word.length <= 4);
}

export function isPlausibleRecipePhrase(value: string) {
  const line = value.trim();
  const letters = line.match(/[A-Za-z]/g)?.length ?? 0;
  if (letters < 3 || symbolRatio(line) > .35 || suspiciousShortCapitals(line)) return false;
  const words = line.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
  return words.some((word) => word.length >= 3);
}

function cleanOcrLine(raw: string) {
  return raw
    .replace(/\u00a0/g, ' ')
    .replace(/[•·▪◦●]/g, ' ')
    .replace(/^[\s+*_=~`|\\:;—–-]+(?=[A-Za-z0-9¼½¾⅓⅔⅛⅜⅝⅞])/u, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function isObviousGarbageLine(line: string) {
  const letters = line.match(/[A-Za-z]/g)?.length ?? 0;
  const numbers = line.match(/\d/g)?.length ?? 0;
  if (!line || (!letters && !numbers) || symbolRatio(line) > .6) return true;
  if (letters > 0 && letters < 3 && numbers === 0) return true;
  return suspiciousShortCapitals(line);
}

export function cleanOcrRecipeText(rawText: string) {
  const kept: string[] = [];
  const discardedLines: string[] = [];
  for (const raw of rawText.replace(/\r/g, '').split('\n')) {
    const cleaned = cleanOcrLine(raw);
    if (isObviousGarbageLine(cleaned)) {
      if (raw.trim()) discardedLines.push(raw.trim());
      continue;
    }
    kept.push(cleaned);
  }
  return { text: kept.join('\n'), lines: kept, discardedLines };
}

function looksLikeQuantity(value: string) {
  return new RegExp(`^(?:\\d+(?:[.,]\\d+)?(?:\\s+\\d+\\/\\d+)?|\\d+\\/\\d+|[${fractionCharacters}])(?:\\s|(?=[A-Za-z]))`).test(value.trim());
}

export function looksLikeIngredientLine(value: string) {
  const line = value.trim();
  if (!line || isIngredientHeading(line) || isMethodHeading(line) || isRecipeMetadataLine(line)) return false;
  if (/^\d+[.)]\s+/.test(line) || /[.!?]$/.test(line) && line.split(/\s+/).length > 7) return false;
  return (looksLikeQuantity(line) || isPlausibleRecipePhrase(line)) && line.length <= 100;
}

export function isPlausibleRecipeTitle(value: string) {
  const line = value.replace(/^#+\s*/, '').trim();
  if (!isPlausibleRecipePhrase(line) || isIngredientHeading(line) || isMethodHeading(line) || isRecipeMetadataLine(line) || looksLikeQuantity(line)) return false;
  const letters = line.match(/[A-Za-z]/g)?.length ?? 0;
  return letters >= 4 && line.length <= 100;
}

export function scoreRecipeDocument(rawText: string, meanConfidence?: number) {
  const cleaned = cleanOcrRecipeText(rawText);
  const lines = cleaned.lines;
  const ingredientIndex = lines.findIndex(isIngredientHeading);
  const methodIndex = lines.findIndex(isMethodHeading);
  const titlePool = lines.slice(0, ingredientIndex >= 0 ? ingredientIndex : Math.min(lines.length, 5));
  const hasTitle = titlePool.some(isPlausibleRecipeTitle);
  const ingredientStart = ingredientIndex >= 0 ? ingredientIndex + 1 : hasTitle ? 1 : 0;
  const ingredientEnd = methodIndex >= 0 ? methodIndex : lines.findIndex((line, index) => index >= ingredientStart && /^\d+[.)]\s+/.test(line));
  const ingredientLines = lines.slice(ingredientStart, ingredientEnd >= 0 ? ingredientEnd : lines.length).filter(looksLikeIngredientLine);
  const stepLines = lines.slice(methodIndex >= 0 ? methodIndex + 1 : 0).filter((line) => /^\d+[.)]\s+/.test(line) || /[.!?]$/.test(line) && line.split(/\s+/).length >= 4);
  const measuredLines = ingredientLines.filter((line) => /\b(?:g|grams?|kg|ml|millilitres?|l|litres?|tbsp|tablespoons?|tbs|tsp|teaspoons?|cups?)\b/i.test(line));
  const rawNonEmpty = rawText.split(/\r?\n/).filter((line) => line.trim()).length;
  const garbageRatio = rawNonEmpty ? cleaned.discardedLines.length / rawNonEmpty : 1;

  let score = 0;
  score += Math.min(15, Math.max(0, (meanConfidence ?? 45) / 6));
  score += Math.min(14, lines.length * 2);
  score += hasTitle ? 10 : 0;
  score += ingredientIndex >= 0 ? 14 : 0;
  score += methodIndex >= 0 ? 10 : 0;
  score += Math.min(25, ingredientLines.length * 5);
  score += Math.min(8, measuredLines.length * 2);
  score += Math.min(10, stepLines.length * 2.5);
  score -= garbageRatio * 35;
  if ((meanConfidence ?? 100) < 35) score -= 15;
  if (lines.length < 3) score -= 20;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const hardFailure = lines.length < 3 || (rawText.match(/[A-Za-z]/g)?.length ?? 0) < 18 || garbageRatio > .55 || ingredientLines.length < 1;
  const quality: OcrQuality = hardFailure || score < 32 ? 'poor' : score >= 68 && ingredientLines.length >= 3 && ingredientIndex >= 0 ? 'good' : 'review_needed';
  return { ...cleaned, qualityScore: score, quality, ingredientLineCount: ingredientLines.length, stepLineCount: stepLines.length, hasTitle };
}

export function isUsableRecipeDraft(recipe: Recipe) {
  return recipe.ingredients.filter((ingredient) => isPlausibleRecipePhrase(ingredient.name)).length >= 2;
}
