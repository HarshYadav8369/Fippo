const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const BUCKET = 'documents';

async function uploadInputFile(userId, jobId, file) {
  const ext = path.extname(file.originalname);
  const filePath = `inputs/${userId}/${jobId}${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file.buffer, {
    contentType: file.mimetype,
    upsert: true,
  });
  if (error) throw error;
  return filePath;
}

async function uploadOutputFile(userId, jobId, buffer, mime) {
  const filePath = `outputs/${userId}/${jobId}`;
  const { error } = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
    contentType: mime,
    upsert: true,
  });
  if (error) throw error;
  return filePath;
}

async function getSignedUrl(filePath, expiry = 3600) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, expiry);
  if (error) throw error;
  return data.signedUrl;
}

module.exports = { uploadInputFile, uploadOutputFile, getSignedUrl };
