import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../state/AppState';

export function ShoppingPage() {
  const { data, actions } = useAppState(); const [open, setOpen] = useState<string | null>(null);
  const remaining = data.shopping.filter((item) => !item.bought).length;
  return <div className="page-stack"><section className="page-title-row"><div><span className="kicker">Only the gaps</span><h1>Shopping</h1><p>{remaining} items left · suggestions stay editable</p></div></section>
    {!data.shopping.length ? <section className="empty-state"><h2>No shopping suggestions yet</h2><p>Open a recipe and add its stock gaps. FridgeMind excludes confirmed amounts you already have.</p><Link className="button primary" to="/recipes">Browse recipes</Link></section> : <section aria-labelledby="shopping-list-title"><h2 id="shopping-list-title" className="sr-only">Shopping suggestions</h2><div className="shopping-list">{data.shopping.map((item) => <article className={`shopping-item ${item.bought ? 'bought' : ''}`} key={item.id}><label className="check-label"><input type="checkbox" checked={item.bought} onChange={(e) => actions.updateShopping(item.id, { bought: e.target.checked })} /><span><strong>{item.ingredientName}</strong><span>For {item.recipeName}</span></span></label><div className="quantity-editor"><label><span className="sr-only">Quantity for {item.ingredientName}</span><input type="number" min="0" value={item.quantity} onChange={(e) => actions.updateShopping(item.id, { quantity: Number(e.target.value) })} /></label><span>{item.unit}</span></div><button className="text-button" aria-expanded={open === item.id} onClick={() => setOpen(open === item.id ? null : item.id)}>Why is this suggested?</button>{open === item.id && <div className="shopping-reason"><p>{item.reason}</p><Link to={`/recipes/${item.recipeId}`}>Review recipe match</Link></div>}<button className="remove-button" onClick={() => actions.removeShopping(item.id)} aria-label={`Remove ${item.ingredientName}`}>Remove</button></article>)}</div></section>}
    <aside className="calm-tip"><strong>Before you buy</strong><p>Uncertain stock is a prompt to check, not proof that you need another package.</p></aside>
  </div>;
}
