# Solar Study Telegram Mini-App

Solar Study is a sample Telegram mini-application for managing study files. It provides file upload, search and theme switching features with an iOS-inspired interface.

## Local Installation

```bash
npm install
npm start
```

The server runs on [http://localhost:3000](http://localhost:3000). Open this URL in a browser or configure it as the mini-app URL in BotFather.

## Deploy to Telegram (BotFather)

1. Create a new bot using BotFather and obtain the bot token.
2. Copy the token into `telegram_config.json`:

```json
{
  "telegramBotToken": "YOUR_BOT_TOKEN_HERE"
}
```

3. Set the mini-app URL in BotFather to the public address of this server.

## Directory Structure

- `server.js` – Express server handling uploads and search.
- `public/` – Frontend pages and assets.
- `files/` – Uploaded files are stored here. Metadata is saved in `index.json`.
- `telegram_config.json` – Stores the Telegram bot token.

## Dependencies

- express
- multer
- cors
- docx

Install them automatically via `npm install`.

