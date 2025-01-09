import express from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/login', (req, res) => {
  res.render('auth/login');
});

router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/folders',
    failureRedirect: '/login',
    failureFlash: true
  })
);

router.get('/register', (req, res) => {
  res.render('auth/register');
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    res.redirect('/login');
  } catch (error) {
    res.redirect('/register');
  }
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

// Change to ES module export
export default router;