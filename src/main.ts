import { cookies, url } from './config.js';
import { logger } from './logger.js';
import {
  courseSelector,
  sessionSelector,
  tableSelector,
  titleSelector,
} from './selectors.js';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { launch } from 'puppeteer';

const browser = await launch({ headless: false });
const page = await browser.newPage();

await page.setCookie(cookies);
await page.goto(url as string);

const sessions = await page.$$eval(
  sessionSelector,
  (elements) =>
    elements
      .map((element) => element.parentElement?.getAttribute('href'))
      .filter(Boolean) as string[],
);
const course = await page.$eval(courseSelector, (element) => element.title);
const courseFileName = course.replaceAll(/[\\/]/gu, '');
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
    links = await page.$eval(
      tableSelector,
      (table) =>
        Array.from(table.querySelectorAll('a'))
          .map((element) => element.dataset['href'])
          .filter(Boolean) as string[],
    );
  } catch {
    logger.info(`${title} has no recordings`);
    continue;
  }

  logger.info(`Found ${links.length} recordings in ${title}`);

  for (const link of links) {
    await page.goto(link);

    log.push(`${title}: ${page.url()}`);
  }
}

await browser.close();

if (!existsSync('output')) {
  await mkdir('output');
}

await writeFile(`output/${courseFileName}.txt`, log.join('\n'), { flag: 'w' });
