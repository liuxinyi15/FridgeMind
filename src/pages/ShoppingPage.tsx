import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ShoppingItem } from '../domain/types';
import { useAppState } from '../state/AppState';
import { Icon } from '../components/Icon';

export function ShoppingPage() {
  const { data, actions } = useAppState();
  const [open, setOpen] = useState<string | null>(null);
  const remaining = data.shopping.filter((item) => !item.bought).length;
  return <div className="page-stack shopping-page"><section className="page-title-row"><div><span className="overline">Your list</span><h1>Shopping</h1><p>{data.shopping.length ? `${remaining} ${remaining === 1 ? 'item' : 'items'} left` : 'Ready when you are'}</p></div></section>
    {!data.shopping.length ? <section className="empty-state rewarding"><div className="empty-icon"><Icon name="check" size={34} /></div><h2>Nothing to pick up</h2><p>Your list is clear. Choose a recipe when you’re ready for the next meal.</p><Link className="button primary" to="/recipes">Find a recipe</Link></section> : <section aria-labelledby="shopping-list-title"><h2 id="shopping-list-title" className="sr-only">Shopping suggestions</h2><div className="shopping-list">{data.shopping.map((item) => <ShoppingRow item={item} key={item.id} open={open === item.id} setOpen={() => setOpen(open === item.id ? null : item.id)} />)}</div></section>}
    {data.shopping.length > 0 && <details className="concept-card"><summary>How this list works</summary><p>Only confirmed recipe gaps are added. Purchased amounts use a typical package suggestion where one is known, and you can edit it or choose “amount unknown”.</p></details>}
  </div>;

  function ShoppingRow({ item, open: isOpen, setOpen: toggleOpen }: { item: ShoppingItem; open: boolean; setOpen: () => void }) {
    const [amount, setAmount] = useState(String(item.suggestedPurchaseQuantity ?? item.quantity));
    const [unknown, setUnknown] = useState(false);
    useEffect(() => {
      if (item.bought && !item.addedToFridge) setOpen(item.id);
    }, [item.bought, item.addedToFridge]);
    return <article className={`shopping-item ${item.bought ? 'bought' : ''}`}>
      <label className="check-label"><input type="checkbox" checked={item.bought} onChange={(event) => actions.updateShopping(item.id, { bought: event.target.checked })} /><span className="custom-check"><Icon name="check" size={15} /></span><span><strong>{item.ingredientName}</strong><span>{item.recipeName}</span></span></label>
      <div className="quantity-editor"><span>Need {item.quantity}{item.unit}</span></div>
      <div className="shopping-item-actions"><button className="text-button" aria-expanded={isOpen} onClick={toggleOpen}>{item.bought && !item.addedToFridge ? 'Review purchase' : 'Why is this suggested?'}</button><button className="icon-button small" onClick={() => actions.removeShopping(item.id)} aria-label={`Remove ${item.ingredientName}`}><Icon name="trash" size={17} /></button></div>
      {isOpen && !item.bought && <div className="shopping-reason"><p>{item.reason}</p><Link to={`/recipes/${item.recipeId}`}>Review recipe</Link></div>}
      {isOpen && item.bought && !item.addedToFridge && <div className="purchase-reconcile"><div><strong>{item.ingredientName} purchased</strong><p>How much did you bring home?</p></div><label className="purchase-amount">Amount<input type="number" min="0" value={unknown ? '' : amount} disabled={unknown} onChange={(event) => setAmount(event.target.value)} /><span>{item.unit}</span></label><button type="button" className="unknown-toggle" aria-pressed={unknown} onClick={() => setUnknown(!unknown)}><span aria-hidden="true">{unknown ? '✓' : '○'}</span> Amount unknown</button><button className="button primary" onClick={() => { actions.reconcileShopping(item.id, unknown ? null : Number(amount), item.unit); setOpen(null); }}>Add to fridge</button></div>}
      {item.addedToFridge && <div className="purchase-added"><Icon name="check" size={16} /> Added to My Fridge</div>}
    </article>;
  }
}
