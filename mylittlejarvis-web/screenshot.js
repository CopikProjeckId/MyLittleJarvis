const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/home/vboxuser/.openclaw/workspace-work/mylittlejarvis-web/screenshot.png', fullPage: true });
  await browser.close();
  console.log('Screenshot saved: screenshot.png');
})();
