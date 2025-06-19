const { Worker } = require('bullmq');
const converters = require('./converters');
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
};

const worker = new Worker('fippo', async (job) => {
  const handler = converters[job.data.type];
  if (!handler) throw new Error(`No converter for type ${job.data.type}`);
  await handler(job.data);
}, { connection });

worker.on('completed', (job) => console.log('Job completed', job.id));
worker.on('failed', (job, err) => console.error('Job failed', job.id, err));
