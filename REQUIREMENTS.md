# Requirements — Bloomary platform

Format and evidence rules: [CONTRIBUTING.md](CONTRIBUTING.md). Check: `scripts/trace-check.sh REQUIREMENTS.md tests`.

| ID | Requirement (When X, Y.) | Source | Status |
|---|---|---|---|
| WEB-001 | When a member posts an open draft to LinkedIn, the request carries its `draftId`, so the backend drops that draft's schedule. | Kat, 2026-10-22 | active |
| WEB-002 | When a member presses Unschedule on a scheduled draft, the app sends `DELETE /api/linkedin/schedule` for that draft and reloads schedules. | Kat, 2026-10-22 | active |
| WEB-003 | When the editor URL is `/editor?draft=<id>`, that draft opens in the editor, and opening a draft puts its ID in the URL. | Kat, 2026-10-22 | active |
<!-- Add rows like:
| WEB-001 | When <condition>, <system> <observable result>. | <issue / spec link> | active |
-->
