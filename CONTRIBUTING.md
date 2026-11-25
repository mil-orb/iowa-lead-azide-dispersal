# Contributing

Thanks for looking. The most useful contributions are fixes to the physics, better checks against measured data once EPA publishes it, and anything that makes the page clearer to someone worried about their town.

## Setup

No install. Serve the folder and open it:

```bash
python -m http.server 8765
```

Run the tests (Node 20 or newer, no packages):

```bash
node --test test/core.test.js
```

## What a PR needs

- One change per PR, with what changed and why.
- Tests pass. A physics change comes with a test, or a note on how you checked it (mass balance, a hand calculation, a comparison with the Army map).
- No new dependency unless the PR says why. A CDN script must be pinned to an exact version at least two weeks old.
- The page must keep saying it is an estimate and keep the EPA and Army links above the fold.
- No health thresholds or advice. Link to the agency that sets them.
- No personal data, home locations or real names in code, docs, tests or images.
- Text from the network goes into the page with `textContent`, never `innerHTML`.
