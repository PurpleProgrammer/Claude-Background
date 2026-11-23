# Project conventions

- English is the primary language of this repository: code, identifiers, comments, commit messages, pull requests, issues and `README.md`.
- German is the secondary language. Keep `README.de.md` in step with `README.md`, and keep the German texts in `hooks/i18n.ts` in step with the English ones.
- Every text the mod shows goes through `hooks/i18n.ts`, in both languages. `/backdrop` (and its short form `/winter`) accepts the English and the German words.
- Settings a user may change live in `hooks/settings.ts`, each with a short English comment.
- Before committing, run `claude plugin validate .` and `claude plugin test .`.
