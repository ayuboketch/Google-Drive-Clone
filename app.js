import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { configurePassport } from './src/config/passport.js';
import authRoutes from './src/routes/auth.js';
import folderRoutes from './src/routes/folders.js';
import fileRoutes from './src/routes/files.js';
import shareRoutes from './src/routes/share.js';
import { PrismaSessionStore } from '@quixo3/prisma-session-store'; // Importing PrismaSessionStore

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();
const app = express();

// Log the DATABASE_URL for debugging
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, 'public')));

// Session setup
app.use(
  session({
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000,  // 2 minutes
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

// Passport configuration
configurePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', authRoutes);
app.use('/folders', folderRoutes);
app.use('/files', fileRoutes);
app.use('/share', shareRoutes);

// Home route
app.get('/', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.redirect('/folders');
});

export default app;