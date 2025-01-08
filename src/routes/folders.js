const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', isAuthenticated, async (req, res) => {
  const folders = await prisma.folder.findMany({
    where: {
      userId: req.user.id,
      parentId: null,
    },
    include: {
      files: true,
      children: true,
    },
  });
  res.render('folders/index', { folders });
});

router.get('/:id', isAuthenticated, async (req, res) => {
  const folder = await prisma.folder.findUnique({
    where: { id: req.params.id },
    include: {
      files: true,
      children: true,
    },
  });

  if (!folder || folder.userId !== req.user.id) {
    return res.redirect('/folders');
  }

  res.render('folders/show', { folder });
});

router.post('/', isAuthenticated, async (req, res) => {
  const { name, parentId } = req.body;
  await prisma.folder.create({
    data: {
      name,
      path: name,
      userId: req.user.id,
      parentId,
    },
  });
  res.redirect(parentId ? `/folders/${parentId}` : '/folders');
});

router.post('/:id/delete', isAuthenticated, async (req, res) => {
  const folder = await prisma.folder.findUnique({
    where: { id: req.params.id },
  });

  if (!folder || folder.userId !== req.user.id) {
    return res.redirect('/folders');
  }

  await prisma.folder.delete({
    where: { id: req.params.id },
  });

  res.redirect('/folders');
});

module.exports = router;