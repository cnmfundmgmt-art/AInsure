This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Prerequisites

### Tesseract OCR

This app uses [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) for text extraction from ID card images. Install it before running the app:

**Ubuntu / Debian:**
```bash
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-msa  # Malay language pack
```

**macOS:**
```bash
brew install tesseract tesseract-lang
```

**Windows:**
Download and install from [the official Windows installer](https://github.com/UB-Mannheim/tesseract/wiki). Ensure `tesseract.exe` is in your PATH.

### Verify Installation

```bash
tesseract --version
tesseract --list-langs  # Should list 'eng' and 'mal'
```

### Database Setup

This app uses SQLite with [Drizzle ORM](https://orm.drizzle.team). The database file is at `data/cfp_local.db`.

**Create the database and push the schema (first time only):**

```bash
mkdir -p data
npm run db:push
```

**Other useful Drizzle commands:**

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate migrations from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio — GUI for browsing data |

**To reset the database (delete all data):**

```bash
rm data/cfp_local.db && npm run db:push
```

### Database Migrations

This project has additional migration scripts for the insurance module. Run them in order after initial setup:

**Individual scripts** (if you prefer to run them separately):
```bash
node scripts/migrate-add-advisor-fields.js   # Phase 1 — users table
node scripts/migrate-insurance-history.js   # Phase 2 — insurance_analysis_sessions
node scripts/migrate-insurance-policies.js   # Phase 3 — client_policies
node scripts/migrate-insurance-products.js   # Phase 4 — products seed
```

### MiniMax API Setup

The insurance recommendation feature uses MiniMax M2.7 as the AI backend. Create a `.env` file in the project root:

```bash
MINIMAX_API_KEY=your-api-key-here
MINIMAX_BASE_URL=https://api.minimax.io/anthropic
```

Get your API key from [platform.minimax.io](https://platform.minimax.io/user-center/basic-information/interface-key).

### Seed Test Data

A script is provided to seed a pre-verified test user so you can bypass the admin approval step during development:

```bash
npx tsx scripts/seed-fin-test.ts
```

This creates a **client** account:

| Field | Value |
|-------|-------|
| Email | `finapi@test.com` |
| Password | `TestPass123` |
| Role | `client` |
| Status | `verified` |

Log in at [`/login`](http://localhost:3000/login) with these credentials to access the client dashboard without admin approval.


## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
