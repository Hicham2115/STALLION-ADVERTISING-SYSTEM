import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../public/images/dashboard-preview.png');

const loginRes = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'ceo@stallion.com', password: 'admin123' }),
});
const { token } = await loginRes.json();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.evaluate((t) => localStorage.setItem('stallion_token', t), token);
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const main = page.locator('main').first();
if (await main.count()) {
  await main.screenshot({ path: outPath });
} else {
  await page.screenshot({ path: outPath, fullPage: false });
}

await browser.close();
console.log('Saved:', outPath);
