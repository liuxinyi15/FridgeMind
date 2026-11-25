# V0.4.1 activation and local OCR

## Implementation

- OCR engine: `tesseract.js` 6.0.1.
- Loading: `src/platform/ocr/browserOcr.ts` is dynamically imported only from recipe, receipt, and package scan flows. The normal Today, Fridge, Recipes, and Shopping bundles do not initialise OCR.
- Processing: Tesseract runs in a browser worker. Selected image pixels are not sent to a FridgeMind backend or third-party vision API. Tesseract worker/language assets may be downloaded by the library when first used.
- Persistence: temporary scan object URLs are revoked. Receipt and package images are not persisted. A recipe image is resized to at most 1280 px and JPEG-compressed before local persistence only when the user keeps it as a cover.
- Failure: decode, allocation, preprocessing, worker, cancellation, and recognition failures use typed internal error codes and recover inside the relevant import page. Empty or structurally unusable OCR output opens an honest fallback with another image, text paste, and manual entry options. One small shared route error boundary protects both `/recipes/import` and `/fridge/add`, preserving the FridgeMind shell, participant session, and flow-specific recovery links if an unexpected render error occurs. Consumer uploads never use deterministic fixture output.
- Recipe preprocessing: source orientation is respected. Every temporary Canvas is constrained to 1800 px wide, 3200 px high, and 5.5 million pixels. Normal small images may be upscaled only when the complete result remains within all three limits. Very tall images are not blindly upscaled; they use sequential vertical tiles with 160 px overlap. Temporary primary, contrast-enhanced greyscale, and Otsu-threshold variants are created one at a time from the decoded source, transformed in place, and released by zeroing their dimensions immediately after recognition. These variants are never stored as the recipe cover.
- Recipe recognition: React receives two animation frames to paint the processing state before OCR starts, and preprocessing yields between tiles and fallback passes. One Tesseract worker is reused for every primary/fallback pass and every tile, then terminated once. The primary `PSM.AUTO` pass runs first with inter-word spacing preserved. `PSM.SINGLE_BLOCK` contrast and `PSM.SPARSE_TEXT` threshold passes run sequentially only when the preceding result is not good. Word boxes split large column gaps, tile results are de-duplicated in top-to-bottom order, and temporary canvases are never retained as an array.
- Receipt/package recognition: generic OCR uses the same source decoder, scale plan, 5.5-million-pixel allocation guard, sequential vertical tiling, Canvas release, typed cancellation, browser yielding, and one-worker lifecycle as recipe OCR. It runs a primary pass first and only runs one contrast fallback when the relevant receipt/package parser cannot use the primary text. Readable but unparsed receipt text remains available in the existing correction textarea; package parsing never invents a product.
- Quality gate: deterministic structure, ingredient-line, title, step, symbol-noise, and mean-confidence signals produce `good`, `review_needed`, or `poor`. Poor output never populates structured fields. Readable weak output can be corrected through Review extracted text and parsed again.
- Research evidence: researcher mode can inspect input/scaled dimensions, maximum tile pixels, tile count, preprocessing/OCR duration, selected pass, PSM, mean confidence, quality score, failure code, discarded lines, and raw text. Participant UI does not expose technical diagnostics; events never contain image pixels or recipe contents.

## Reliable scope

OCR works best with upright, high-contrast, well-lit English text. Recipe parsing can propose a title, servings, time, ingredients, quantities, units, and method when those sections are clearly labelled. Receipt and package parsing intentionally recognises a small set of common product names and only amounts printed explicitly as weights, volumes, or pack counts.

It does not identify arbitrary grocery objects, infer hidden quantities, infer expiry dates, read complex nutrition panels, or guarantee correct text. All proposals require review.

## Manual real-device smoke test

Run the production build on each available device and complete these checks without Research Mode fixtures.

The save evidence events (`food_batch_added` and `personal_recipe_saved`) are exported as objective milestones but are intentionally excluded from the interaction count. The existing save-button click already represents the interaction; counting both would double-count one user action.

### iPhone Safari

1. Open Add Food, confirm Quick Add accepts a comma-separated list and the keyboard does not cause horizontal overflow.
2. Open Scan Package and Scan Receipt. Verify the camera/photo picker, local OCR progress, cancellation, editable review, and save.
3. Open the participant link and advance to Task 3. Open or download the supplied recipe screenshot, then return to FridgeMind.
4. Begin Task 3 and choose Scan screenshot or photo. Confirm the primary picker offers Photos/image library or Files rather than forcing the rear camera.
5. Select the saved screenshot, observe local OCR progress, review the parsed recipe, save it, click “I’m finished”, and submit the post-task ratings.
6. Reload `/test`, resume the study where applicable, and download the JSON export.
7. Confirm fixed bottom navigation remains reachable and the page stays responsive without horizontal overflow.

### Android Chrome

Repeat the iPhone checks, confirming the image/file picker offers the gallery and Files. Also verify back-navigation during OCR and that cancellation returns to a usable flow.

### Desktop Chrome

1. Use file upload for recipe, receipt, and package images.
2. Confirm the OCR code chunk is requested only after a scan begins.
3. Confirm the app remains responsive, cancel works, and the source scan is absent from local storage unless retained as a recipe cover.
4. Confirm local persistence and participant JSON export after a reload.

Automated Chromium coverage validates layout and business flow, but does not replace the camera/file-picker checks above.
