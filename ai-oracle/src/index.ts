import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import disputeRouter from './routes/dispute';
import faucetRouter from './routes/faucet';
import telegramRouter from './routes/telegram';
import { initBot } from './services/telegram';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Lexius Pay AI Oracle',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/dispute', disputeRouter);
app.use('/api/faucet', faucetRouter);
app.use('/api/telegram', telegramRouter);

app.listen(PORT, () => {
  console.log(`🚀 Lexius Pay AI Oracle service listening on port ${PORT}`);

  // Initialize Telegram bot (webhook in production, long-polling in development)
  initBot(app).catch((err) => {
    console.error('[Telegram Bot] Failed to initialize:', err.message);
  });
});
