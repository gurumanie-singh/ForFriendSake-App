# forfriendsake.com

The website for [ForFriendSake](https://apps.apple.com/us/app/forfriendsake/id6757169962),
an iPhone app for friend groups: make a squad, plan at a real place, check in when you
get there, and climb the leaderboard.

Plain HTML, CSS and JavaScript served by GitHub Pages from `main`. No build step.

| Path | What it is |
|---|---|
| `index.html` | Home page |
| `support.html` | Help and FAQ |
| `privacy.html` | Privacy policy |
| `404.html` | Served by GitHub Pages for unknown paths |
| `confirm.html`, `founding-squad.html`, `unsubscribe.html` | Founding Squad email list: confirm, send an idea, unsubscribe |
| `community.js` | Calls the Founding Squad Cloud Functions (source in the app repo, `functions/community/`) |
| `privacy/`, `support/` | Redirects for the old folder-style URLs |
| `site.css`, `site.js` | Shared styles and behaviour (theme toggle, mobile menu, the check-in ring) |
| `assets/screens/` | Phone screens cropped from the App Store screenshots |
| `assets/og.png` | 1200×630 link preview image |

To preview locally:

```bash
python3 -m http.server 8000
```

Contact: support@forfriendsake.com · © 2026 Gurumanie Singh Dhiman
