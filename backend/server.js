require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const queue = require('./queue');
const { uploadInputFile } = require('./storageService');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const port = process.env.PORT || 3001;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('application/pdf') || 
        file.mimetype.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
    }
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Authentication middleware
class AuthMiddleware {
  static async verifyToken(req, res, next) {
    try {
      const { authorization } = req.headers;
      if (!authorization) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const [, token] = authorization.split(' ');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
}

// Auth routes
app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        }
      }
    });

    if (error) throw error;
    
    // Create user profile
    const { data: userData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email,
        full_name,
      });

    if (profileError) throw profileError;

    res.status(200).json({ message: 'User created successfully', user: data.user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    res.status(200).json({ message: 'Login successful', user: data.user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Protected routes
app.get('/auth/user', AuthMiddleware.verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Conversion routes (now protected)
app.post('/convert/pdf-to-docx', [AuthMiddleware.verifyToken, upload.single('file')], async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload input file to storage
    const inputPath = await uploadInputFile(req.user.id, 'temp', file); // temp placeholder, updated below

    // Create conversion job in Supabase
    const { data: job, error: jobError } = await supabase
      .from('conversion_jobs')
      .insert({
        user_id: req.user.id,
        type: 'pdf-to-docx',
        input_file: file.originalname,
        status: 'processing',
        credits_used: 1,
        started_at: new Date(),
        estimated_completion: new Date(Date.now() + 300000) // 5 minutes estimate
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // enqueue conversion job
    await queue.add('convert', {
      jobId: job.id,
      userId: req.user.id,
      type: 'pdf-to-docx',
      inputPath,
    });

    /* removed simulation setTimeout */
    /* setTimeout(async () => {
      await supabase
        .from('conversion_jobs')

    res.status(200).json({ 
      message: 'Conversion started',
      jobId: job.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/convert/docx-to-pdf', [AuthMiddleware.verifyToken, upload.single('file')], async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { data: job, error: jobError } = await supabase
      .from('conversion_jobs')
      .insert({
        user_id: req.user.id,
        type: 'docx-to-pdf',
        input_file: file.originalname,
        status: 'pending',
        credits_used: 1
      })
      .select()
      .single();

    if (jobError) throw jobError;

    res.status(200).json({ 
      message: 'Conversion started',
      jobId: job.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/convert/pdf-merge', [AuthMiddleware.verifyToken, upload.array('files', 5)], async (req, res) => {
  try {
    const { files } = req;
    if (!files || files.length < 2) {
      return res.status(400).json({ error: 'At least 2 PDF files are required' });
    }

    const { data: job, error: jobError } = await supabase
      .from('conversion_jobs')
      .insert({
        user_id: req.user.id,
        type: 'pdf-merge',
        input_file: files.map(f => f.originalname).join(', '),
        status: 'pending',
        credits_used: 2
      })
      .select()
      .single();

    if (jobError) throw jobError;

    res.status(200).json({ 
      message: 'PDF merge started',
      jobId: job.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/convert/pdf-compress', [AuthMiddleware.verifyToken, upload.single('file')], async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { data: job, error: jobError } = await supabase
      .from('conversion_jobs')
      .insert({
        user_id: req.user.id,
        type: 'pdf-compress',
        input_file: file.originalname,
        status: 'pending',
        credits_used: 1
      })
      .select()
      .single();

    if (jobError) throw jobError;

    res.status(200).json({ 
      message: 'PDF compression started',
      jobId: job.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List conversion jobs for authenticated user
app.get('/conversion-jobs', AuthMiddleware.verifyToken, async (req, res) => {
  try {
    const { data: jobs, error } = await supabase
      .from('conversion_jobs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get status for a single job (existing route remains below)
app.get('/jobs/:jobId', AuthMiddleware.verifyToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { data: job, error: jobError } = await supabase
      .from('conversion_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', req.user.id)
      .single();

    if (jobError) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download converted file (placeholder implementation)
app.get('/download/:jobId', AuthMiddleware.verifyToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { data: job, error } = await supabase
      .from('conversion_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;

    if (job.status !== 'completed' || !job.output_file) {
      return res.status(400).json({ error: 'File not ready for download' });
    }

    // For now, just send the stored URL/path. In production, you might generate a signed URL.
    res.status(200).json({ url: job.output_file });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
