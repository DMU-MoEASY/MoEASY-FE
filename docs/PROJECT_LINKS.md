# MoEasy External Project Links

Updated: 2026-10-07 (Asia/Seoul)

## GitHub

- Organization frontend repository: https://github.com/DMU-MoEASY/MoEASY-FE
- Personal mirror: https://github.com/minsik1014/MoEasy
- Local remote mapping:
  - `origin` -> `git@github.com:DMU-MoEASY/MoEASY-FE.git`
  - `personal` -> `git@github.com:minsik1014/MoEasy.git`
- Primary branch: `main`

Use the organization repository for issues and pull requests unless the user explicitly asks for the personal mirror. Inspect current remotes and authentication before pushing. Do not create duplicate issues or PRs without checking existing open items.

## Notion

- MoEasy main project page: https://app.notion.com/p/347bf07f90e3800cb1d0ca22a86c979a
- API/base URL documentation page: https://app.notion.com/p/3dfbf07f90e380f2b45ccec99fd04fd8

These pages may be private. A URL in this file does not grant Claude access.

To use them from Claude:

1. Open the links while signed into the authorized Notion account, or configure an authorized Notion MCP/connector for Claude.
2. If connector access is unavailable, export only the required pages as Markdown or PDF and place the sanitized exports under `docs/notion/`.
3. Never export or commit secrets, access tokens, private member data, or real environment-variable values.
4. Treat Notion as product/API documentation and verify time-sensitive backend behavior against a live response before changing frontend code.

When updating Notion, edit the canonical page or database row rather than creating duplicate content. Keep API examples, frontend environment-variable names, callback URIs, and implementation status separated so that plans are not mistaken for completed behavior.

