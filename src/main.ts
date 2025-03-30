import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { launch } from 'puppeteer';

import { getConfiguration } from './config.js';
import { logger } from './logger.js';
import {
  courseSelector,
  sessionSelector,
  tableSelector,
  titleSelector,
} from './selectors.js';

const { cookies, url } = getConfiguration();

const browser = await launch({ headless: false });
const page = await browser.newPage();

await browser.setCookie(cookies);
await page.goto(url);

const sessions = await page.$$eval(sessionSelector, (elements) =>
  elements
    .map((e) => e.parentElement?.getAttribute('href'))
    .filter((e) => e !== null && e !== undefined),
);
const course = await page.$eval(
  courseSelector,
  (element) => element.textContent ?? 'Unknown',
);
const courseFileName = course.replaceAll(/[\\/]/gu, '-');
const log: string[] = [];

await page.screenshot({
  fullPage: true,
  path: `output/${courseFileName}.png`,
});

for (const session of sessions) {
  await page.goto(session);

  const title = await page.$eval(
    titleSelector,
    (element) => element.textContent,
  );
  let links: string[];
  try {
    links = await page.$eval(tableSelector, (table) =>
      Array.from(table.querySelectorAll('a'))
        .map((e) => e.dataset['href'])
        .filter((e) => e !== undefined),
    );
  } catch {
    logger.info(`${title} has no recordings`);
    continue;
  }

  logger.info(`Found ${links.length} recordings in ${title}`);

  for (const link of links) {
    await page.goto(link);

    log.push(`${title?.trim()},${page.url()}`);
  }
}

await browser.close();

if (!existsSync('output')) {
  await mkdir('output');
}

await writeFile(
  `output/${courseFileName}.csv`,
  `name,link\n${log.join('\n')}`,
  {
    flag: 'w',
  },
);
