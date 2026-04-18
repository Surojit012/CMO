# CMO: Your AI Growth Team

CMO is an autonomous growth engine that helps you analyze and grow your online presence. It uses AI to perform deep analyses of your websites and automatically publishes reports to platforms like Dev.to and Hashnode.

## Features

- **Autonomous Growth Engine**: Automated daily analysis and publishing.
- **AI-Powered Analysis**: Uses advanced LLMs to generate actionable growth strategies.
- **Multi-Platform Publishing**: Automatically post to Dev.to and Hashnode.
- **n8n Integration**: Built-in workflow for autonomous scheduling.
- **Vercel Ready**: Optimized for Vercel deployment with Cron jobs and Analytics.

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- n8n (for autonomous workflow)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd CMO
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env.local` and fill in your API keys.

4. Set up n8n workflow:
   ```bash
   npm run setup-n8n
   ```

### Development

Run the development server:
```bash
npm run dev
```

## Deployment

This project is designed to be deployed on **Vercel**. 

- **Cron Jobs**: Configured in `vercel.json` for daily automated analysis.
- **Analytics**: Integrated with `@vercel/analytics`.
- **Speed Insights**: Integrated with `@vercel/speed-insights`.

## License

MIT
