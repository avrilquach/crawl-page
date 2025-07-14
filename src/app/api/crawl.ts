import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer-extra';
import type { Browser } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

import { crawlHafele } from '../../utils/crawlers/crawlHafele';
import { crawlBosch } from '../../utils/crawlers/crawlBosch';
import { crawlSino } from '../../utils/crawlers/crawlSino';

// 👉 Nếu chưa biết kiểu trả về cụ thể, dùng unknown để an toàn
type CrawlFunc = (model: string, browser: Browser) => Promise<unknown>;

const handlers: Record<string, CrawlFunc> = {
  hafele: crawlHafele,
  bosch: crawlBosch,
  sino: crawlSino,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { website, model } = req.body as { website: string; model: string };

    const handler = handlers[website];
    if (!handler) {
      res.status(400).json({ error: `Website ${website} không được hỗ trợ.` });
      return;
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled',
      ],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });

    const result = await handler(model, browser);

    await browser.close();

    res.status(200).json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Lỗi khi crawl:', error);
    res.status(500).json({ error: message });
  }
}
