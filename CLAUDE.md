# Project conventions

- English is the primary language of this repository: code, identifiers, comments, commit messages, pull requests, issues and `README.md`.
- German is the secondary language. Keep `README.de.md` in step with `README.md`.
- The mod itself speaks English, German, French, Italian and Spanish. Every text it shows goes through `hooks/i18n.ts` and exists in all five languages; when you add or change a text, update every language (the `Record<Language, Texts>` type makes a missing one fail the type check). Write translations idiomatically, not word for word, and read each language through once.
- Regional variants (de-CH, fr-CH, it-CH, en-US …) live in `REGIONAL` in `hooks/i18n.ts`.
- `/backdrop` (and its short form `/winter`) understands the words of every language in `WORDS` in `hooks/i18n.ts`; accents are optional.
- Occasions are data in `hooks/occasions.ts`. A new country needs a table entry (or its code in a region group) and the occasion's name in every language. Switzerland's occasions must stay exactly as recorded in `hooks/ch-snapshot.ts`.
- Dates that Intl cannot compute come from published calendars, with the sources in a comment; never estimate them.
- Settings a user may change live in `hooks/settings.ts`, each with a short English comment.
- Before committing, run `claude plugin validate .` and `claude plugin test .`.
- A release is a version bump in `.claude-plugin/plugin.json` plus a `## <version>` section in `CHANGELOG.md`; the release workflow creates the tag and the GitHub release when it reaches `main`.
