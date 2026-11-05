<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Pages live in src/pages and route files in src/routes only wire them (head + component), so the screens can be reused by a separate site/simulator project later. This project is only the Acolhe+ app: the root renders only the Provider and Outlet, while /cidadao and /recepcao own separate layouts with a shared header; the URL alone defines the profile. Why: app screens are reused elsewhere.
- All data access goes through src/services/api.ts (Java endpoints, separate Flask endpoints, and explicitly labeled front-only demo actions) backed by SimuladorContext mock state persisted in localStorage. Why: no backend in the prototype.
- Triage rules and the questionnaire engine live only in src/services/regrasOrientacao.ts (pure, unit-tested); questions are data in src/data/perguntas.ts. The AI check (verificarUrgencia) may only raise severity. Why: rules must be testable and never live in components.

- Internal back navigation uses the pure rotaPai helper, never browser history; editing and UBS detail routes are unnested leaves so their parent screens cannot hide them. Why: deterministic navigation and correct independent rendering.

- Offer selection, expiry, handoff and deadline simulation use pure service helpers; the Provider owns the global expiry timer, while booking validates and consumes an offer within the API store update. Why: all screens share the same lifecycle and stale offers cannot book.
- Generate the daily demo through the seeded data generators and persist its date with the versioned state; use shared date/day helpers in both scheduling views. Why: occupancy and displayed days remain consistent.
