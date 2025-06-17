require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Placeholder for conversion routes
app.post('/convert/pdf-to-docx', (req, res) => {
  res.status(200).json({ message: 'PDF to DOCX conversion will be implemented here' });
});

app.post('/convert/docx-to-pdf', (req, res) => {
  res.status(200).json({ message: 'DOCX to PDF conversion will be implemented here' });
});

app.post('/convert/pdf-merge', (req, res) => {
  res.status(200).json({ message: 'PDF merge will be implemented here' });
});

app.post('/convert/pdf-compress', (req, res) => {
  res.status(200).json({ message: 'PDF compression will be implemented here' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
