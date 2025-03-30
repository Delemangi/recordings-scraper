import { z } from 'zod';

export const [cookie, url] = process.argv.slice(2);

if (cookie === undefined || url === undefined) {
  throw new Error('Missing cookie or URL');
}

export const getConfiguration = () => ({
  cookies: {
    domain: 'courses.finki.ukim.mk',
    name: 'MoodleSession',
    value: z.string().parse(cookie),
  },
  url: z.string().parse(url),
});
