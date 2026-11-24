const foodEmoji: Record<string, string> = {
  spinach: '🥬', mushroom: '🍄', pasta: '🍝', chicken: '🍗', cream: '🥛', rice: '🍚', onion: '🧅', tomato: '🍅', egg: '🥚', carrot: '🥕', stock: '🥣', bread: '🍞',
};

export function FoodIcon({ name, large = false }: { name: string; large?: boolean }) {
  const canonical = name.toLowerCase().replace(/s$/, '');
  return <span className={`food-illustration${large ? ' large' : ''}`} aria-hidden="true">{foodEmoji[canonical] ?? '🥗'}</span>;
}
