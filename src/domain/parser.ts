import { canonicalise } from './inventory';
import type { QuantityMode, Recipe, RecipeIngredient, StorageLocation, Unit } from './types';
import { cleanOcrRecipeText, isIngredientHeading, isMethodHeading, isPlausibleRecipePhrase, isPlausibleRecipeTitle, isRecipeMetadataLine, looksLikeIngredientLine } from './recipeOcr';

const unitAliases: Record<string, { unit: Unit; multiplier?: number }> = {
  g: { unit: 'g' }, gram: { unit: 'g' }, grams: { unit: 'g' }, kg: { unit: 'g', multiplier: 1000 },
  ml: { unit: 'ml' }, millilitre: { unit: 'ml' }, millilitres: { unit: 'ml' }, l: { unit: 'ml', multiplier: 1000 }, litre: { unit: 'ml', multiplier: 1000 }, litres: { unit: 'ml', multiplier: 1000 },
  tbsp: { unit: 'tbsp' }, tbs: { unit: 'tbsp' }, tablespoon: { unit: 'tbsp' }, tablespoons: { unit: 'tbsp' },
  tsp: { unit: 'tsp' }, teaspoon: { unit: 'tsp' }, teaspoons: { unit: 'tsp' },
  cup: { unit: 'cup' }, cups: { unit: 'cup' },
  item: { unit: 'item' }, items: { unit: 'item' }, clove: { unit: 'item' }, cloves: { unit: 'item' },
  can: { unit: 'item' }, cans: { unit: 'item' }, tin: { unit: 'item' }, tins: { unit: 'item' },
  pack: { unit: 'item' }, packs: { unit: 'item' }, slice: { unit: 'item' }, slices: { unit: 'item' },
};

const sectionHeading = /^(for the .+|to serve|optional|garnish)\s*:?$/i;

function cleanLine(line: string) {
  return line.trim().replace(/^[•·▪◦*–—-]\s*/, '').replace(/^\[[ x]\]\s*/i, '').trim();
}

function normaliseFractions(value: string) {
  const fractions: Record<string, string> = { '½': '1/2', '¼': '1/4', '¾': '3/4', '⅓': '1/3', '⅔': '2/3', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8' };
  return value.replace(/(\d)\s*([½¼¾⅓⅔⅛⅜⅝⅞])/g, (_, whole: string, fraction: string) => `${whole} ${fractions[fraction]}`).replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g, (fraction) => fractions[fraction]);
}

function parseNumber(raw: string) {
  const unicode: Record<string, number> = { '½': .5, '¼': .25, '¾': .75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': .125, '⅜': .375, '⅝': .625, '⅞': .875 };
  if (unicode[raw] !== undefined) return unicode[raw];
  if (/^\d+\s+\d+\/\d+$/.test(raw)) {
    const [whole, fraction] = raw.split(/\s+/); const [a, b] = fraction.split('/').map(Number);
    return Number(whole) + a / b;
  }
  if (/^\d+\/\d+$/.test(raw)) { const [a, b] = raw.split('/').map(Number); return a / b; }
  return Number(raw.replace(',', '.'));
}

function parseIngredient(line: string, index: number): RecipeIngredient | null {
  const cleaned = normaliseFractions(cleanLine(line)).replace(/\s+/g, ' ');
  if (!cleaned || isIngredientHeading(cleaned) || isMethodHeading(cleaned) || sectionHeading.test(cleaned) || isRecipeMetadataLine(cleaned) || !looksLikeIngredientLine(cleaned)) return null;
  const match = cleaned.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)\s*(.*)$/);
  let quantity = 1;
  let unit: Unit = 'item';
  let name = cleaned;
  if (match) {
    quantity = parseNumber(match[1]);
    const remainder = match[2].trim();
    const measured = remainder.match(/^([a-zA-Z]+)\.?\s+(.+)$/);
    const unitInfo = measured ? unitAliases[measured[1].toLowerCase()] : undefined;
    if (unitInfo) {
      unit = unitInfo.unit;
      quantity *= unitInfo.multiplier ?? 1;
      name = measured![2];
    } else {
      name = remainder;
    }
  }
  name = name
    .replace(/^of\s+/i, '')
    .replace(/^(small|medium|large)\s+/i, '')
    .replace(/,\s*(?:roughly\s+)?(?:chopped|sliced|diced|minced|drained|melted|to serve|plus more.*)$/i, '')
    .trim();
  if (!name || /^\d+$/.test(name) || !isPlausibleRecipePhrase(name)) return null;
  return { id: `imported-ingredient-${index}`, name, canonicalName: canonicalise(name), quantity, unit };
}

function timeInMinutes(lines: string[]) {
  for (const line of lines) {
    if (!/\b(min|mins|minute|minutes|hour|hours|hr|hrs)\b/i.test(line)) continue;
    const hours = Number(line.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i)?.[1] ?? 0);
    const minutes = Number(line.match(/(\d+)\s*(?:minutes?|mins?)/i)?.[1] ?? 0);
    const total = Math.round(hours * 60 + minutes);
    if (total) return total;
  }
  return 0;
}

export function parseRecipeText(text: string): Recipe {
  const lines = cleanOcrRecipeText(text).lines.map(cleanLine).filter(Boolean);
  const ingredientStartIndex = lines.findIndex(isIngredientHeading);
  const titleCandidates = lines.slice(0, ingredientStartIndex >= 0 ? ingredientStartIndex : Math.min(lines.length, 5));
  const titleIndex = lines.findIndex((line) => titleCandidates.includes(line) && isPlausibleRecipeTitle(line));
  const name = titleIndex >= 0 ? lines[titleIndex].replace(/^#+\s*/, '').replace(/\s+/g, ' ') : 'Imported recipe';
  const servingLine = lines.find((line) => /\b(serves?|servings?|yield|makes?)\b/i.test(line));
  const baseServings = Math.max(1, Number(servingLine?.match(/\d+/)?.[0]) || 2);
  const minutes = timeInMinutes(lines);
  const ingredientStart = lines.findIndex(isIngredientHeading);
  const methodStart = lines.findIndex(isMethodHeading);
  const numberedStepIndexes = lines.map((line, index) => /^\d+[.)]\s+/.test(line) ? index : -1).filter((index) => index >= 0);
  const inferredMethodStart = methodStart >= 0 ? methodStart : numberedStepIndexes[0] ?? -1;
  const start = ingredientStart >= 0 ? ingredientStart + 1 : Math.max(0, titleIndex + 1);
  const end = inferredMethodStart >= 0 ? inferredMethodStart : lines.length;
  const ingredientLines = lines.slice(start, end).filter((line) => line !== servingLine && !isRecipeMetadataLine(line) && !sectionHeading.test(line) && !/\b(?:minutes?|mins?|hours?|hrs?)\b/i.test(line));
  const ingredients = ingredientLines.map(parseIngredient).filter((item): item is RecipeIngredient => Boolean(item));
  const methodLines = inferredMethodStart >= 0 ? lines.slice(inferredMethodStart + (methodStart >= 0 ? 1 : 0)) : [];
  const hasNumberedSteps = methodLines.some((line) => /^\d+[.)]\s+/.test(line));
  const steps = methodLines
    .filter((line) => !sectionHeading.test(line))
    .filter((line) => !hasNumberedSteps || /^\d+[.)]\s+/.test(line))
    .map((line) => line.replace(/^\d+[.)]\s*/, '').trim())
    .filter((line) => isPlausibleRecipePhrase(line));
  return {
    id: `imported-${Date.now()}`, name, baseServings, ingredients, minutes, steps,
    tags: ['Imported'], source: 'imported', ownership: 'personal', originalText: text, createdAt: new Date().toISOString(),
  };
}

const receiptAliases: [RegExp, string][] = [
  [/\bmushrooms?\b/i, 'Mushrooms'], [/\b(?:baby\s+)?spinach\b/i, 'Spinach'], [/\bchicken(?:\s+breast)?\b/i, 'Chicken'],
  [/\b(?:penne|spaghetti|fusilli|macaroni)?\s*pasta\b/i, 'Pasta'], [/\bonions?\b/i, 'Onions'], [/\btomatoes?\b/i, 'Tomatoes'],
  [/\beggs?\b/i, 'Eggs'], [/\brice\b/i, 'Rice'], [/\bpotatoes?\b/i, 'Potatoes'], [/\bbread\b/i, 'Bread'],
];

/** Conservative pasted-receipt support: names only, never invented quantities or dates. */
export function parseReceiptText(text: string): string[] {
  const names: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || /^(total|subtotal|vat|change|cash|card|visa|mastercard|tesco|sainsbury|waitrose|aldi|lidl|morrisons)\b/i.test(line)) continue;
    if (/^\d+[\s-]*$/.test(line) || /^£?\d+[.,]\d{2}$/.test(line)) continue;
    const alias = receiptAliases.find(([pattern]) => pattern.test(line));
    if (alias && !names.includes(alias[1])) names.push(alias[1]);
  }
  return names;
}

export interface ParsedFoodText {
  name: string;
  quantity: number | null;
  quantityMode: QuantityMode;
  unit: Unit;
  storage: StorageLocation;
}

const cupboardFoods = /\b(pasta|rice|bread|flour|lentils?|beans?|chickpeas?|cereal|oats?)\b/i;
const freezerFoods = /\b(frozen|ice cream)\b/i;
const knownBrandOrReceiptLine = /^(tesco|sainsbury(?:'s)?|waitrose|aldi|lidl|morrisons|asda|co-op|receipt|subtotal|total|vat|card|cash|change)\b/i;

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function storageFor(name: string): StorageLocation {
  if (freezerFoods.test(name)) return 'freezer';
  if (cupboardFoods.test(name)) return 'cupboard';
  return 'fridge';
}

function normaliseMeasuredAmount(amount: number, rawUnit: string): Pick<ParsedFoodText, 'quantity' | 'unit' | 'quantityMode'> {
  const unit = rawUnit.toLowerCase();
  if (unit === 'kg') return { quantity: amount * 1000, unit: 'g', quantityMode: 'exact' };
  if (unit === 'l' || unit === 'litre' || unit === 'litres') return { quantity: amount * 1000, unit: 'ml', quantityMode: 'exact' };
  return { quantity: amount, unit: unit.startsWith('ml') ? 'ml' : 'g', quantityMode: 'exact' };
}

/** Lightweight, forgiving multi-food parser. Unrecognised amounts never reject the name. */
export function parseQuickAddText(text: string): ParsedFoodText[] {
  const parsed: ParsedFoodText[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/[,;\n]+/)) {
    let value = raw.trim().replace(/\s+/g, ' ');
    if (!value) continue;
    let quantity: number | null = null;
    let quantityMode: QuantityMode = 'unknown';
    let unit: Unit = 'item';
    const measured = value.match(/^(.*?)(\d+(?:[.,]\d+)?)\s*(kg|g|grams?|l|litres?|ml)\b\s*$/i);
    const counted = value.match(/^(\d+)\s+(?:x\s*)?(.+)$/i);
    if (measured?.[1].trim()) {
      value = measured[1].trim();
      ({ quantity, quantityMode, unit } = normaliseMeasuredAmount(Number(measured[2].replace(',', '.')), measured[3]));
    } else if (counted) {
      value = counted[2].trim();
      quantity = Number(counted[1]);
      quantityMode = 'exact';
      unit = 'item';
    }
    const name = titleCase(value.replace(/\s+(?:pack|packet)$/i, '').trim());
    const key = canonicalise(name);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    parsed.push({ name, quantity, quantityMode, unit, storage: storageFor(name) });
  }
  return parsed;
}

function amountFromProductLine(line: string) {
  const measured = line.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|grams?|l|litres?|ml)\b/i);
  if (measured) return normaliseMeasuredAmount(Number(measured[1].replace(',', '.')), measured[2]);
  const pack = line.match(/\b(\d+)\s*(?:x\s*)?(?:pack|pk)\b/i);
  if (pack) return { quantity: Number(pack[1]), unit: 'item' as Unit, quantityMode: 'exact' as QuantityMode };
  return { quantity: null, unit: 'item' as Unit, quantityMode: 'unknown' as QuantityMode };
}

function productNameFromLine(line: string) {
  const alias = receiptAliases.find(([pattern]) => pattern.test(line));
  if (alias) return alias[1];
  return titleCase(line
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|grams?|l|litres?|ml)\b/ig, '')
    .replace(/\b\d+\s*(?:pack|pk)\b/ig, '')
    .replace(/\b(?:tesco|sainsbury(?:'s)?|waitrose|aldi|lidl|morrisons|asda|co-op)\b/ig, '')
    .replace(/[^a-zA-Z\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

/** Conservative receipt parsing: product names plus only weights explicitly printed on a line. */
export function parseReceiptCandidates(text: string): ParsedFoodText[] {
  const candidates: ParsedFoodText[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || knownBrandOrReceiptLine.test(line) || /^£?\d+[.,]\d{2}$/.test(line)) continue;
    const alias = receiptAliases.find(([pattern]) => pattern.test(line));
    if (!alias) continue;
    const name = alias[1];
    const key = canonicalise(name);
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({ name, ...amountFromProductLine(line), storage: storageFor(name) });
  }
  return candidates;
}

/** Package OCR parser. It extracts one product name and an explicitly printed weight, volume or pack count. */
export function parsePackageText(text: string): ParsedFoodText | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !/^(receipt|subtotal|total|vat|card|cash|change)\b/i.test(line));
  const aliased = lines.find((line) => receiptAliases.some(([pattern]) => pattern.test(line)));
  const fallback = [...lines].sort((a, b) => b.replace(/[^a-z]/gi, '').length - a.replace(/[^a-z]/gi, '').length)[0];
  const line = aliased ?? fallback;
  if (!line) return null;
  const name = productNameFromLine(line);
  if (!name || name.length < 2) return null;
  return { name, ...amountFromProductLine(text), storage: storageFor(name) };
}
