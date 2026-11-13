---
inclusion: manual
---

# /submission-check: Kiroween 2026 pre-flight

Check the repository and the submission materials against the hackathon rules. Report Pass, Fail or Needs the user for each line. Do not fix anything in this run; produce the list.

The official rules at https://kiroween.devpost.com/rules are the authority. If anything below disagrees with them, the rules win: tell the user.

## Repository (check by reading files and running git commands)

1. The repository is on GitHub and public (ask the user to confirm the URL and visibility).
2. A `LICENSE` file with an OSI-approved license is at the root, and GitHub's About box shows the license (user confirms).
3. `/.kiro` exists at the repository root and contains `steering/`, `specs/` and `hooks/` with real content.
4. `.gitignore` does not ignore `.kiro` or anything inside it. Run `git check-ignore -v .kiro .kiro/specs .kiro/hooks .kiro/steering` and expect no output. Run `git ls-files .kiro | head` and expect files.
5. No secrets, private keys or `.env` files are tracked. Search the tree and the history summary for obvious ones.
6. `README.md` explains what the project is, how to install, run, test and deploy it, and links to the live site.
7. Every third-party asset (fonts especially) has its license file in the repo and is listed in the README.
8. `npm ci && npm run typecheck && npm test && npm run build` succeeds from a clean clone.
9. The project was created during the submission period. Nothing was copied from older projects without being disclosed in the README.

## Live application

10. The deployed URL loads over HTTPS and both `#/listen` and `#/station` work without a login.
11. The site needs no paid service or key to try. It must stay free to test until the judging period ends.
12. A judge with one device can still see it work (digital loopback or "decode from file").
13. The About page states the limits plainly: text only, slow, load once before going offline, radio rules vary by country.

## Devpost form (user confirms each)

14. Category chosen: Resurrection. One category only.
15. Text description of features and functionality.
16. Demo video: under 3 minutes, public on YouTube, shows the project running on the devices it was built for, no third-party trademarks, no copyrighted music.
17. Kiro write-up present and covers: spec-driven development, property-based testing, steering, hooks, MCP, custom agents, powers, and how the IDE, CLI, Web and Crew were each used (or says plainly that a surface was not used).
18. Testing instructions for judges, including the two-device steps and the one-device fallback.
19. Bonus fields filled where they apply: Kiro Crew app repository URL (separate repo, same GitHub account), blog post URL, social post URL beginning with the required hashtag, student or startup or returning-participant details.

## Honesty check on the write-up

20. Every claim about how Kiro was used matches `docs/kiro-journal.md`, the files in `.kiro/`, and the git history. Flag any sentence that overstates.
21. The write-up says which parts were prepared outside Kiro (for example the planning briefs and starter steering files) and which were built in Kiro.

## Output

A numbered Pass / Fail / Needs-the-user table, then the Fail items as a to-do list in the order they should be fixed. Finish with the submission deadline from the rules page and a reminder that the form cannot be edited after it.
