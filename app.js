import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import compilerRoutes from './routes/compiler.js';

dotenv.config();
const port = 5000;
const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // Your Vite frontend URL
  credentials: true
}));

// Rate Limiting - Crucial for preventing abuse of the compiler
const compilerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 compilation requests per minute
  message: 'Too many compilation requests from this IP, please try again after a minute.',
  standardHeaders: true,
});


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

app.use('/api/compile', compilerLimiter); // Apply only to the compile route

// General Middleware
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies

// Routes
app.use('/api/compile', compilerRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Compiler API is running!' });
});

// 404 Handler
// app.use('*', (req, res) => {
//   res.status(404).json({ error: 'Route not found' });
// });

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

export default app;