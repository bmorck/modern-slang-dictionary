# Modern Slang Dictionary

A community-driven slang dictionary that empowers users to discover, contribute, and engage with contemporary language terms through innovative digital interactions.

## Features

- Submit and discover modern slang terms
- Vote on terms to influence their ranking
- Track trending terms and popularity insights
- AI-powered content moderation with detailed rejection feedback
- Community engagement through voting system
- Clean and responsive UI with dark/light mode support

## Tech Stack

- React + TypeScript frontend
- Express.js backend
- PostgreSQL database with Drizzle ORM
- OpenAI API for content moderation
- TanStack Query for data fetching
- Shadcn UI components
- Tailwind CSS for styling

## Prerequisites

Before you begin, ensure you have the following:
- Node.js >= 18
- PostgreSQL database
- OpenAI API key

## Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd modern-slang-dictionary
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key
SESSION_SECRET=your_session_secret
```

4. Initialize the database:
```bash
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - See [LICENSE](LICENSE) for details.