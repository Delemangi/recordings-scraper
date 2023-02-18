import { existsSync } from 'node:fs';
import {
  mkdir,
  writeFile
} from 'node:fs/promises';
import { argv } from 'node:process';
import { launch } from 'puppeteer';
import {
  createLogger,
  format,
  transports
} from 'winston';

const sessionSelector = 'a > img[src^="https://courses.finki.ukim.mk/theme/image.php/classic/bigbluebuttonbn/"]';
const tableSelector = 'table.generaltable';
const titleSelector = 'div[role="main"] > h3';
const courseSelector = 'ol.breadcrumb > li:nth-child(3) > a';
const logger = createLogger({
  transports: [
    new transports.Console({
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.colorize({
          colors: {
            debug: 'gray',
            error: 'red',
            http: 'blue',
            info: 'green',
            silly: 'magenta',
            verbose: 'cyan',
            warn: 'yellow'
          }
        }),
        format.printf(({
          level,
          message,
          timestamp
        }) => `${timestamp} - ${level}: ${message}`)
      ),
      handleExceptions: true,
      level: 'info'
    })
  ]
});

const [cookie, url] = argv.slice(2);

if (cookie === undefined || url === undefined) {
  throw new Error('Missing cookie or url');
}

const cookies = {
  domain: 'courses.finki.ukim.mk',
  name: 'MoodleSession',
  value: cookie
};

const browser = await launch({ headless: false });
const page = await browser.newPage();

await page.setCookie(cookies);
await page.goto(url);

const sessions = await page.$$eval(sessionSelector, (elements) => elements.map((e) => e.parentElement?.getAttribute('href')));
const course = await page.$eval(courseSelector, (e) => e.title);
const log: string[] = [];

for (const session of sessions) {
  if (session === undefined || session === null) {
    continue;
  }

  await page.goto(session);

  const title = await page.$eval(titleSelector, (e) => e.textContent);
  let links;
  try {
    links = await page.$eval(tableSelector, (e) => Array.from(e.querySelectorAll('a')).map((el) => el.dataset['href']));
  } catch {
    logger.info(`${title} has no recordings`);
    continue;
  }

  logger.info(`Found ${links.length} recordings in ${title}`);

  for (const link of links) {
    if (link === undefined || link === null) {
      logger.warn('e');
      continue;
    }

    await page.goto(link);

    log.push(`${title}: ${page.url()}`);
  }
}

await browser.close();

if (!existsSync('output')) {
  await mkdir('output');
}

await writeFile(`output/${course.replaceAll(/[\\/]/gu, '')}.txt`, log.join('\n'), { flag: 'w' });
