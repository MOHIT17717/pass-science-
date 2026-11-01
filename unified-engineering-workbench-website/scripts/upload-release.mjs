import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { put } from '@vercel/blob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const websiteRoot = path.resolve(__dirname, '..');

// 1. Read .env.local for credentials
const envPath = path.join(websiteRoot, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/BLOB_READ_WRITE_TOKEN="?([^"\r\n]+)"?/);
if (!match) {
  console.error('Error: BLOB_READ_WRITE_TOKEN not found in .env.local');
  process.exit(1);
}
const token = match[1];

// 2. Locate release ZIP
const zipPath = path.resolve(websiteRoot, '../release/CandidateID_Workbench.zip');
if (!fs.existsSync(zipPath)) {
  console.error(`Error: ZIP file not found at ${zipPath}`);
  process.exit(1);
}

const stats = fs.statSync(zipPath);
console.log(`[Phase 2] Target file: ${zipPath}`);
console.log(`[Phase 2] File size: ${stats.size} bytes (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);

// 3. Compute local SHA-256
console.log('[Phase 2] Verifying local SHA-256 hash...');
const fileBuffer = fs.readFileSync(zipPath);
const localHash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
console.log(`[Phase 2] Computed SHA-256: ${localHash}`);

const expectedHash = '01EF5F8BC6D8DC3597D8DD918991540E686ACF5B449F7A1284C8A9DD453C67A0';
if (localHash !== expectedHash) {
  console.error(`Hash mismatch! Expected: ${expectedHash}, Got: ${localHash}`);
  process.exit(1);
}
console.log('[Phase 2] Local checksum verified successfully!');

// 4. Upload to Vercel Blob using multipart
console.log('[Phase 2] Starting multipart upload to Vercel Blob...');
const startTime = Date.now();
const stream = fs.createReadStream(zipPath);

try {
  const blob = await put('CandidateID_Workbench.zip', stream, {
    access: 'public',
    token: token,
    multipart: true,
    addRandomSuffix: false,
    contentType: 'application/zip',
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[Phase 2] Upload completed in ${duration}s!`);
  console.log(`[Phase 2] Blob URL: ${blob.url}`);
  console.log(`[Phase 2] Download URL: ${blob.downloadUrl}`);

  // 5. Save release metadata
  const metadata = {
    fileName: 'CandidateID_Workbench.zip',
    fileSize: stats.size,
    fileSizeFormatted: `${(stats.size / (1024 * 1024)).toFixed(1)} MB`,
    sha256: localHash,
    blobUrl: blob.url,
    downloadUrl: blob.downloadUrl,
    uploadedAt: new Date().toISOString(),
    version: '1.0.0',
    platform: 'Windows 11 x64',
    verifiedCleanMachine: true,
  };

  const dataDir = path.join(websiteRoot, 'src/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const metaPath = path.join(dataDir, 'release-metadata.json');
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`[Phase 2] Release metadata saved to ${metaPath}`);

  // 6. Verification: Download and compare checksum
  console.log('[Phase 2] Performing verification download from Blob storage...');
  const res = await fetch(blob.downloadUrl);
  if (!res.ok) {
    throw new Error(`Failed to download uploaded blob: HTTP ${res.status}`);
  }

  const downloadBuffer = Buffer.from(await res.arrayBuffer());
  const downloadedHash = crypto.createHash('sha256').update(downloadBuffer).digest('hex').toUpperCase();
  console.log(`[Phase 2] Downloaded bytes: ${downloadBuffer.length}`);
  console.log(`[Phase 2] Downloaded SHA-256: ${downloadedHash}`);

  if (downloadedHash === localHash && downloadBuffer.length === stats.size) {
    console.log('[Phase 2] SUCCESS! Verified 100% byte-for-byte integrity against original local ZIP!');
  } else {
    console.error('[Phase 2] Checksum verification failed!');
    process.exit(1);
  }
} catch (err) {
  console.error('[Phase 2] Upload failed:', err);
  process.exit(1);
}

