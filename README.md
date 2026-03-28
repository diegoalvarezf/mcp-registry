# MCP Registry

> The open hub for MCP servers, skills, agents & stacks — discover, install, and publish in one command.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Active](https://img.shields.io/badge/status-active-brightgreen)]()

**[mcp-registry-sigma.vercel.app](https://mcp-registry-sigma.vercel.app)**

## What is this?

The MCP ecosystem is growing fast and there's no central place to discover servers. MCP Registry fixes that — think npm registry but for MCP servers.

- **Discover** servers by name, tag, tool, or compatible client
- **Publish** your own server
- **Rate and review** servers you've used
- **Security auditing** with a 4-tier trust system

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** — dark mode UI
- **PostgreSQL + Prisma**
- **GitHub OAuth**
- **i18n** — EN / ES

## Development

```bash
git clone https://github.com/diegoalvarezf/mcp-registry.git
cd mcp-registry
npm install
cp .env.example .env.local
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Roadmap

- [x] Browse and search servers
- [x] Server detail pages
- [x] Tag and client filters
- [x] Submit a server (form + API)
- [x] Public API (`GET /api/servers`, `POST /api/servers`)
- [x] Ratings and reviews
- [x] GitHub OAuth
- [x] Security auditing (4-tier trust system)
- [x] i18n EN/ES
- [ ] CLI: `mcp install` / `mcp publish`
- [ ] User stacks

## Contributing

Open an issue or PR. All contributions welcome.

## License

MIT
