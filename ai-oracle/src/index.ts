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

// 1. Registramos las rutas normales
app.use('/api/dispute', disputeRouter);
app.use('/api/faucet', faucetRouter);
app.use('/api/telegram', telegramRouter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Lexius Pay AI Oracle',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// 2. Inicializamos el Bot de Telegram (Webhook/Polling) ANTES de levantar el puerto 🚀
console.log('🤖 Inicializando Telegram Bot...');
initBot(app)
  .then(() => {
    // 3. Solo cuando el bot y sus rutas estén 100% listos, abrimos el puerto al tráfico
    app.listen(PORT, () => {
      console.log(`🚀 Lexius Pay AI Oracle service listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[Telegram Bot] Failed to initialize:', err.message);
    // Levantamos el puerto como plan de respaldo aunque el bot falle
    app.listen(PORT, () => {
      console.log(`🚀 Lexius Pay AI Oracle listening (Bot initialization failed) on port ${PORT}`);
    });
  });
