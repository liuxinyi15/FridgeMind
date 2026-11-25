# V0.4.1 activation and local OCR

## Implementation

- OCR engine: `tesseract.js` 6.0.1.
- Loading: `src/platform/ocr/browserOcr.ts` is dynamically imported only from recipe, receipt, and package scan flows. The normal Today, Fridge, Recipes, and Shopping bundles do not initialise OCR.
- Processing: Tesseract runs in a browser worker. Selected image pixels are not sent to a FridgeMind backend or third-party vision API. Tesseract worker/language assets may be downloaded by the library when first used.
- Persistence: temporary scan object URLs are revoked. Receipt and package images are not persisted. A recipe image is resized to at most 1280 px and JPEG-compressed before local persistence only when the user keeps it as a cover.
- Failure: empty or structurally unusable OCR output opens an honest fallback with another image, text paste, and manual entry options. Consumer uploads never use deterministic fixture output.

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
