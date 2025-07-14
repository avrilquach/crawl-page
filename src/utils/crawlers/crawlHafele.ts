import { Browser } from 'puppeteer';

export async function crawlHafele(model: string, browser: Browser) {
  const page = await browser.newPage();
  const searchUrl = `https://www.hafele.com.vn/hap-live/web/WFS/Haefele-HVN-Site/vi_VN/-/VND/ViewParametricSearch-SimpleOfferSearch?SearchType=all&SearchTerm=${encodeURIComponent(model)}`;
  await page.goto(searchUrl, {
    waitUntil: 'domcontentloaded',
  });
  await new Promise(resolve => setTimeout(resolve, 5000)); // tương đương waitForTimeout
  let title = 'Không tìm thấy sản phẩm';
  try {
    title = await page.$eval('.hfl-product-properties-content', el => el.textContent?.trim() || '');
  } catch (err) {
    console.warn('❌ Không tìm thấy phần tử:', err);
  }
  await page.close();

  return { model, title };
}
