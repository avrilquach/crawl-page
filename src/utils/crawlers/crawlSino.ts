import puppeteer, { Browser } from 'puppeteer';

export async function crawlSino(model: string, browser: Browser) {
  const page = await browser.newPage();
  const searchUrl = `https://sino.com.vn/product.html?title=${encodeURIComponent(model)}`;
  await page.goto(searchUrl, {
    waitUntil: 'domcontentloaded',
  });
  await new Promise(resolve => setTimeout(resolve, 5000)); // tương đương waitForTimeout
  let title = 'Không tìm thấy sản phẩm';
  try {
    // Kiểm tra nếu là trang danh sách kết quả
    const productItem = await page.$('.v2_bnc_pr_item a');

    if (productItem) {
      // Lấy href của sản phẩm đầu tiên
      const productLink = await page.$eval('.v2_bnc_pr_item a', el => el.getAttribute('href'));
      if (productLink) {
        const fullUrl = new URL(productLink, searchUrl).toString();
        await page.goto(fullUrl, { waitUntil: 'domcontentloaded' });

        // Lấy mô tả từ trang chi tiết
        title = await page.$eval('.v2_bnc_products_details_box_description', el =>
          el.textContent?.trim() || ''
        );
      }
    }
  } catch (err) {
    console.warn('❌ Lỗi khi xử lý trang:', err);
  }

  await page.close();
  return { model, title };
}
