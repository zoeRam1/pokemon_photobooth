const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5179/');
  await p.waitForTimeout(800);
  await p.click('.pull-btn', { force: true });
  await p.waitForTimeout(3500); // shuffle (1.75s) + reveal (0.48s) + flip (0.42s) + margin
  const resultVisible = await p.isVisible('text=Start the photobooth').catch(() => false);
  const rline = await p.textContent('.rline').catch(() => null);
  console.log('result visible:', resultVisible);
  console.log('rline:', rline);
  console.log('errors:', JSON.stringify(errs));
  await b.close();
})();
