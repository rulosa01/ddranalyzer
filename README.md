# FileMaker DDR Analyzer

A client-side web app for exploring and analyzing FileMaker Database Design Reports (DDR) exported as XML.

**Live app:** [ddranalyzer.vercel.app](https://ddranalyzer.vercel.app)

## Features

- **Explorer** — Browse tables, fields, layouts, scripts, relationships, value lists, custom functions, accounts, and privilege sets with detailed drill-down views
- **Entity Relationship Diagram** — Interactive hierarchical graph of table occurrences and their relationships with predicate labels, bezier edges, zoom/pan, and fit-to-screen
- **Script Analysis** — View script steps, triggers, and cross-references
- **Reverse References** — See where any field, table, layout, or script is used across the entire solution
- **Health Dashboard** — Metrics and warnings for orphaned fields, empty scripts, unused tables, and more
- **Dark Mode** — Full light/dark theme support
- **Privacy-first** — All parsing happens in the browser. No data is uploaded or stored on any server.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser and drag-and-drop a FileMaker DDR XML file to begin.

### Build for Production

```bash
npm run build
npm run preview
```

## Tech Stack

- [React 19](https://react.dev/) + [Vite 7](https://vite.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) icons
- Deployed on [Vercel](https://vercel.com/)

## How to Export a DDR from FileMaker

1. Open your FileMaker solution in FileMaker Pro Advanced
2. Go to **Tools → Database Design Report**
3. Select the tables/elements you want to include
4. Choose **XML** as the output format
5. Save and use the resulting XML file with this app

## License

Private project.
