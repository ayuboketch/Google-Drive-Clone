const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/folders/:id', isAuthenticated, async (req, res) => {
  try {
    const { duration } = req.body;
    const folderId = req.params.id;

    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.userId !== req.user.id) {
      return res.redirect('/folders');
    }

    // Calculate expiration date
    const days = parseInt(duration);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Create or update share link
    const shareLink = await prisma.shareLink.upsert({
      where: { folderId },
      update: {
        token: `${folderId}-${Date.now()}`,
        expiresAt,
      },
      create: {
        token: `${folderId}-${Date.now()}`,
        expiresAt,
        folderId,
      },
    });

    res.redirect(`/folders/${folderId}`);
  } catch (error) {
    console.error(error);
    res.redirect('/folders');
  }
});

router.get('/:token', async (req, res) => {
  const shareLink = await prisma.shareLink.findUnique({
    where: { token: req.params.token },
    include: {
      folder: {
        include: {
          files: true,
          children: true,
        },
      },
    },
  });

  if (!shareLink || shareLink.expiresAt < new Date()) {
    return res.render('share/expired');
  }

  res.render('share/show', { folder: shareLink.folder });
});

module.exports = router;