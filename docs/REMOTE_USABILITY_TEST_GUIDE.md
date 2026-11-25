# Remote usability test guide

FridgeMind’s participant study runs entirely in the participant’s browser. It does not use accounts, remote analytics, or automatic uploads. Each participant downloads one anonymous JSON results file and returns it to the researcher.

## Researcher preparation

1. Deploy the latest `main` build and open the public HTTPS URL on a phone-sized viewport as a smoke check.
2. Assign an anonymous ID such as `P01`; do not encode a name, email address, university ID, or other personal information in it.
3. Generate the participant-specific `/test` link.
4. Prepare the Zoom, Teams, or Discord call and ask the participant to share their screen.
5. Ask the participant to think aloud. Explain that FridgeMind is being tested, not them.
6. Do not tell the participant where to click, what the expected route is, or what counts as task success.

Example participant links (replace the origin and repository prefix with the deployed site):

- `https://<deployment>/test?participant=P01`
- `https://<deployment>/test?participant=P02`
- `https://<deployment>/test?participant=P03`

For GitHub project Pages the route will normally include the repository name, for example `https://<owner>.github.io/<repository>/test?participant=P01`.

## Deploying to GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` builds and deploys the app on pushes to `main`, and can also be run manually from GitHub Actions. It derives the Vite base path from `GITHUB_REPOSITORY`, so no GitHub username is hard-coded.

1. Push the repository to GitHub.
2. In **Settings → Pages**, choose **GitHub Actions** as the source.
3. Run **Deploy FridgeMind to GitHub Pages**, or push to `main`.
4. Open the deployment URL reported by the workflow.
5. Verify `/test?participant=TEST` and refresh it once before recruiting participants.

The build copies `index.html` to `404.html`. GitHub Pages serves that fallback for direct and refreshed SPA routes, while React Router keeps clean routes such as `/test`, `/recipes/:id`, and `/settings/research/usability`. The app’s Vite base and router basename both support the repository subpath.

## During the session

- Let the participant read each task scenario from the screen.
- Remain neutral and observe hesitation, backtracking, and comments.
- Record verbal comments separately if useful.
- Avoid rescuing the participant too early. If they cannot continue, ask them to use **I can’t complete this task**.
- Automatic success signals are recorded invisibly; they do not stop a task. The participant decides when to use **I’m finished**.
- After each task, allow the participant to answer both ratings and the optional comment in their own words.

## After the session

The participant should:

1. select **Download study results**;
2. check that **Results downloaded** appears;
3. send `FridgeMind_<participant ID>_results.json` to the researcher.

The researcher should verify that the file uses the `fridgemind-usability-v1` format, contains the expected anonymous participant ID and seven task runs, then store it under that anonymous ID. FridgeMind does not delete the browser copy after download, so **Download again** remains available.

## Troubleshooting

### Accidental refresh

- On a task prompt, refreshing restores the prompt.
- In the FridgeMind interface, refreshing restores the current fixture, task, and event session from local storage.
- Opening `/test` while a task is active shows **Task in progress** and a **Continue task** action.

### Browser back button

Back navigation is allowed and logged during a task. If the participant reaches `/test`, they can continue the active task without restarting the whole study.

### Closed tab

Reopen the same participant link in the same browser and browser profile. The locally stored study resumes. Private-browsing sessions may be lost when all private tabs are closed.

### Missing download

Ask the participant to choose **Download again**. On iPhone or iPad, the file may appear in Safari’s Downloads list or the Files app. **Copy results** is a secondary fallback when clipboard access is available.

### Wrong participant ID

If the URL ID differs from the study already stored in that browser, FridgeMind shows both IDs and does not overwrite the existing study. Continue the existing study or use the confirmed **Clear existing study data** action before starting the correct participant.

### Restarting a session

Only clear study data after the current results file has been returned or the run is known to be invalid. **Clear study data** is available on the completion screen and requires confirmation. Researcher tools remain available only at the known `/settings/research/usability` route and are never linked from the participant or consumer interface.
