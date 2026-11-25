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

### iPhone Safari

1. Open Add Food, confirm Quick Add accepts a comma-separated list and the keyboard does not cause horizontal overflow.
2. Open Scan Package and Scan Receipt. Verify the camera/photo picker, local OCR progress, cancellation, editable review, and save.
3. Open Add Recipe, scan a readable screenshot, correct one field, expand Original text, save, reload, and confirm the recipe persists.
4. Complete a participant study task, reload `/test`, resume it, and download the JSON export.
5. Confirm fixed bottom navigation remains reachable and the page stays responsive during OCR.

### Android Chrome

Repeat the iPhone checks, including camera capture and back-navigation during OCR. Confirm permission denial returns to a usable fallback.

### Desktop Chrome

1. Use file upload for recipe, receipt, and package images.
2. Confirm the OCR code chunk is requested only after a scan begins.
3. Confirm the app remains responsive, cancel works, and the source scan is absent from local storage unless retained as a recipe cover.
4. Confirm local persistence and participant JSON export after a reload.

Automated Chromium coverage validates layout and business flow, but does not replace the camera/file-picker checks above.
