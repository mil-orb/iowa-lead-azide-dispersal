# Contributing

Thanks for looking. This model is public because people near the plant, and downwind of it, had no tool of their own. Help that makes it more accurate or easier to understand is welcome.

Live site: https://iowa-lead-azide-dispersal.vercel.app

## Where help counts most

1. **Measured data.** When EPA publishes soil, wipe or cassette results, or readings from more of its 43 stations, fitting the model to them is the single biggest improvement available.
2. **The source term.** If you can read the Army's permit documents on [EPA's response site](https://response.epa.gov/site/doc_list.aspx?site_id=17211) (they are scanned images) and find the magazine location, the planning model's inputs, or the monitor inlet sizes, open an issue with the page number.
3. **Physics corrections.** Anything in the model that disagrees with a published method or a measurement. Atmospheric scientists and aerosol people especially.
4. **Forecast ensembles.** Running several forecast members to show a spread instead of one track.
5. **Clarity.** Wording, layout or accessibility changes that help someone checking on their town.

## Setup

No install. Serve the folder and open it:

```bash
python -m http.server 8765
```

Run the tests (Node 20 or newer, no packages):

```bash
node --test test/core.test.js
```

The model lives in `<script id="core">` in `index.html` and has no DOM access, so the tests load it directly in Node. [AGENTS.md](AGENTS.md) has a map of the code.

## Rules for a change

**Physics**

- A physics change needs a test against an analytic result or a published curve, in `test/core.test.js`. Say what you compared against.
- Do not tune a constant to make the map look right. If a constant has no published source, add it to the "Not from a source" list in the README and report what halving and doubling it does.
- Cite the source for any formula or constant in the code comment and in the README references.
- "Fine" always means aerodynamic diameter.

**Data and claims**

- Never bundle or store weather or EPA readings. The page shows current data, with its time, or nothing.
- EPA's readings are shown as published, with nothing applied to them.
- Report the monitor comparison as a limit with its noise. Never present it as a measured release.
- No thresholds or advice of our own. An agency's level may be quoted with attribution, as the page does for EPA's screening level and the Army's map legend.
- The page must keep saying it is an estimate and keep the EPA and Army links at the top.

**Code**

- One change per pull request, with what changed and why.
- No new dependency unless the pull request says why. A CDN script must be pinned to an exact version at least two weeks old.
- Text from the network goes into the page with `textContent`, never `innerHTML`.
- The three Open-Meteo requests together sit at the free tier's per-minute limit. Do not add variables or grid points without removing some, and say what the request costs.
- No personal data, home locations or real names in code, docs, tests, commits or images.

## Reporting a problem

Use the issue templates. For a wrong result, include the status line from the page (it says when the weather was fetched), the town or monitor, and what you expected. Leave out your address. The nearest listed town is enough.

Security problems go through [private reporting](https://github.com/mil-orb/iowa-lead-azide-dispersal/security/advisories/new), as described in [SECURITY.md](SECURITY.md).
