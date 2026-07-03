# Picture It Clean

Picture It Clean helps volunteers verify that a space (a counter, a room, a pew row…) still
matches a reference "clean" photo, using a short checklist with time estimates.

Data is hierarchical: **Building/House → Area → Space**. Each Space has a current reference
photo, a checklist, and a history of past verifications. Buildings, Areas, and Spaces can be
shared with other users via invite links.

This repository currently contains the **self-hosted edition** (v1): a single Node.js/Express
API + React frontend, backed by SQLite and local-disk photo storage, packaged as one Docker
container.

## Tech stack

- **Server**: Node.js (Express, TypeScript), Node's built-in `node:sqlite` module (no native
  build step required), `multer` + `sharp` for photo upload/thumbnailing, JWT-in-cookie auth
  with `bcryptjs`.
- **Web**: React + TypeScript (Vite), React Router, TanStack Query, Tailwind CSS.
- **Auth**: username + password, no email required. There is no self-registration — accounts
  are created by the server admin (see below).
- **Sharing**: per-resource invite links/codes (viewer or editor role), scoped to a Building,
  Area, or Space.

## Local development

Requires Node.js 22.5+ (for `node:sqlite`).

```bash
npm install
npm run dev
```

This starts the API on `:4000` and the Vite dev server on `:5173` (which proxies `/api` to the
API). Open http://localhost:5173.

## Creating user accounts

There's no sign-up page. The admin creates each user with a CLI script:

```bash
npm run create-user --workspace apps/server -- <username> <password> [display name]
```

For example:

```bash
npm run create-user --workspace apps/server -- jamie secret123 "Jamie Fischer"
```

In Docker, run the same script inside the running container:

```bash
docker compose exec app node apps/server/dist/cli/createUser.js jamie secret123 "Jamie Fischer"
```

Once an account exists, that user can log in and be invited into buildings/areas/spaces like
anyone else.

## Self-hosting with Docker

```bash
docker compose up -d --build
```

This builds a single image that serves the built React app and the API from one Node process
on port 4000, backed by a SQLite file and a `photos/` folder. By default that data lives under
`./data` next to the compose file, but on a NAS/JBOD host you'll usually want it on bulk
storage instead — set `DATA_PATH_ON_HOST` to an absolute path on that storage. Set a real
`JWT_SECRET` too before exposing this beyond your local network. Either put both in a `.env`
file next to `docker-compose.yml`, or set them as environment variables on the stack if you're
deploying via Portainer:

```
JWT_SECRET=some-long-random-string
DATA_PATH_ON_HOST=/mnt/storage01/picture-it-clean
```

All your data (buildings, areas, spaces, checklists, photos, verification history) lives under
that path — back it up and you have the whole app's state.

## Architecture: why a repository layer

The server's routes and services never talk to SQLite directly — they depend only on the
interfaces in [`apps/server/src/repositories/interfaces.ts`](apps/server/src/repositories/interfaces.ts).
The SQLite implementations are wired up in one place,
[`apps/server/src/repositories/index.ts`](apps/server/src/repositories/index.ts).

This is deliberate: a future edition of Picture It Clean can be backed by a different system of
record entirely — Jira or Trello — by writing a new set of repository implementations against
those interfaces, without touching routes, access control, or the frontend.

### Future edition: Jira-backed

| Picture It Clean | Jira |
|---|---|
| Building | Project |
| Area | Component or Epic |
| Space | Issue |
| Checklist item | Subtask, or an item in Jira's built-in issue checklist |
| Reference photo | Issue attachment |
| Verification event | Issue transition + comment |
| Sharing | Jira project/issue permission schemes |

### Future edition: Trello-backed

Explored as a lower-complexity alternative to Jira, with one important caveat: Trello accounts
require an email or OAuth login to create, so a Trello-backed edition would give up this app's
"no email needed" account model. If that tradeoff is acceptable for a given deployment:

| Picture It Clean | Trello |
|---|---|
| Building | Board |
| Area | List |
| Space | Card |
| Checklist item | Card checklist item |
| Reference photo | Card cover image / attachment |
| Verification event | Card comment |
| Sharing | Board membership (native Trello sharing) |

Both future editions are additive: same domain model, same routes, same frontend — only the
`repositories/` implementation changes.
