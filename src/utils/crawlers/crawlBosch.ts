import puppeteer, { Browser } from 'puppeteer';

export async function crawlBosch(model: string, browser: Browser) {
  const page = await browser.newPage();
  const searchUrl = `https://vn.bosch-pt.com/vn/vi/searchfrontend/?q=${encodeURIComponent(model)}`;
  await page.goto(searchUrl, {
    waitUntil: 'domcontentloaded',
  });
  await new Promise(resolve => setTimeout(resolve, 5000)); // tương đương waitForTimeout
  let title = 'Không tìm thấy sản phẩm';
  try {
    title = await page.$eval('.m-marketing_description', el => el.textContent?.trim() || '');
  } catch (err) {
    console.warn('❌ Không tìm thấy phần tử:', err);
  }
  await page.close();

  return { model, title };
}
