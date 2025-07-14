import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer-extra';
import type { Browser } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

import { crawlHafele } from '../../utils/crawlers/crawlHafele';
import { crawlBosch } from '../../utils/crawlers/crawlBosch';
import { crawlSino } from '../../utils/crawlers/crawlSino';

type CrawlFunc = (model: string, browser: Browser) => Promise<any>;

const handlers: Record<string, CrawlFunc> = {
  hafele: crawlHafele,
  bosch: crawlBosch,
  sino: crawlSino,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { website, model } = req.body;

    const handler = handlers[website];
    if (!handler) {
      return res.status(400).json({ error: `Website ${website} không được hỗ trợ.` });
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
  } catch (error: any) {
    console.error('❌ Lỗi khi crawl:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
