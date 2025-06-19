const path = require('path');
const execa = require('execa');
const fs = require('fs/promises');
const { uploadOutputFile } = require('../storageService');
const supabase = require('../supabaseClient'); // we will create

module.exports = async function pdfToDocx(job) {
  const { jobId, userId, inputPath } = job;

  // update progress to 20
  await supabase.from('conversion_jobs').update({ progress: 20 }).eq('id', jobId);

  const localInput = path.join('/tmp', path.basename(inputPath));
  const { data: downloadUrl } = await supabase.storage.from('documents').createSignedUrl(inputPath, 600);
  await execa('curl', ['-L', downloadUrl.signedUrl, '-o', localInput]);

  // Convert with LibreOffice headless
  await execa('soffice', [
    '--headless', '--convert-to', 'docx', localInput, '--outdir', '/tmp',
  ]);

  const outputFile = localInput.replace(/\.pdf$/i, '.docx');
  const outputBuffer = await fs.readFile(outputFile);

  const outputPath = await uploadOutputFile(userId, jobId, outputBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

  await supabase.from('conversion_jobs').update({
    progress: 100,
    status: 'completed',
    output_file: outputPath,
    completed_at: new Date(),
  }).eq('id', jobId);
};
