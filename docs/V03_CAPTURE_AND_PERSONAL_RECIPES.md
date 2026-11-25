# V0.3 capture and personal recipes

V0.3 shifts FridgeMind away from manual inventory bookkeeping. The shared interaction contract is:

**Capture → propose → review → save**

No image or receipt result is committed before review. All processing stays local and the prototype does not upload images or use a remote recognition service.

## Food capture

`/fridge/add` provides four entry points: Scan groceries, Scan receipt, Add from photo, and Enter manually. Image selection uses the existing native camera adapter where available and a browser file input elsewhere.

The current recognition layer is deterministic prototype recognition. It supplies realistic local proposals for the grocery, receipt, and single-item flows, including conservative unknown/approximate quantity and date states. A short processing state separates capture from review. Filenames containing `empty`, `unknown`, or `blank` exercise the failure fallback.

Batch review supports selection, removal, rename, category, quantity mode, amount, unit, storage, date, and advanced plain-language quantity. Duplicate items require an explicit new-purchase or merge choice. Receipt candidates matching Shopping use the existing reconciliation action.

## Personal recipes

`/recipes/import` supports image/screenshot proposals, flexible pasted text, and minimum-field manual creation. Every route produces the same editable `Recipe` draft before saving. Personal recipes use `ownership: personal`, retain optional original text, and can store a user-selected image as a local data URL.

Personal recipes participate in the existing `matchRecipe`, availability, shopping-gap, cooking, and recommendation engines. Missing time is treated as neutral rather than excluding or unfairly promoting the recipe. User-created recipes can be saved, unsaved, edited, or deleted; built-in recipes remain non-deletable.

## Inventory lifecycle

Food batches carry a lightweight source (`manual`, `photo`, `receipt`, `shopping`, `cooking`, or `seeded`). Inventory events record additions, merges, corrections, partial use, finishing, discarding, freezing, cooking consumption, and leftover creation. This provenance is internal and does not add maintenance work to the consumer interface.

Quick Fridge actions provide Find recipe, Used some, Freeze, and progressively disclosed corrections. Approximate and unknown stock stays conservative after partial-use actions.

## Reproducible evaluation

The existing V0.2 Research Mode fixtures and seven-task remote study remain unchanged. Eight additional `V3-*` fixtures cover grocery capture, receipts, image/text recipe imports, duplicate handling, Shopping matching, Use Soon filtering, and quick corrections. Four neutral exploratory prompts are listed in Research Mode but are not added to `/test`.
