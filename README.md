# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Run locally in VS Code (تشغيل المشروع على VS Code)

Requirements: Node.js 20+ and npm.

```sh
git clone <your-repo-url>
cd <repo>
npm install
npm run dev
```

Open http://localhost:8080

### Environment variables
The file `.env` is included in the repository and already contains:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_PROJECT_ID=...
```

These are public (publishable) keys — login, database and all pages work locally with them.

For the AI features (AI assistant, recommendations, AI content studio) add one more line to `.env`:

```
LOVABLE_API_KEY=your_key_here
```

Create the key from Lovable → Settings → API Keys. Without it the site still runs, but AI requests return an error.

### Useful commands
- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — lint
