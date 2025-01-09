import express from 'express';
import multer from 'multer';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    const { folderId } = req.body;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('files')
      .upload(
        `${req.user.id}/${Date.now()}-${file.originalname}`,
        file.buffer,
        {
          contentType: file.mimetype,
        }
      );

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('files')
      .getPublicUrl(data.path);

    // Save file info to database
    await prisma.file.create({
      data: {
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        url: publicUrl,
        path: data.path,
        userId: req.user.id,
        folderId,
      },
    });

    res.redirect(folderId ? `/folders/${folderId}` : '/folders');
  } catch (error) {
    console.error(error);
    res.redirect('/folders');
  }
});

router.get('/:id', isAuthenticated, async (req, res) => {
  const file = await prisma.file.findUnique({
    where: { id: req.params.id },
  });

  if (!file || file.userId !== req.user.id) {
    return res.redirect('/folders');
  }

  res.render('files/show', { file });
});

router.post('/:id/delete', isAuthenticated, async (req, res) => {
  const file = await prisma.file.findUnique({
    where: { id: req.params.id },
  });

  if (!file || file.userId !== req.user.id) {
    return res.redirect('/folders');
  }

  // Delete from Supabase Storage
  await supabase.storage.from('files').remove([file.path]);

  // Delete from database
  await prisma.file.delete({
    where: { id: req.params.id },
  });

  res.redirect('/folders');
});

// Change to ES module export
export default router;