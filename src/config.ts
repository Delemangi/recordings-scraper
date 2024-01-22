export const [cookie, url] = process.argv.slice(2);

if (cookie === undefined || url === undefined) {
  throw new Error('Missing cookie or URL');
}

export const cookies = {
  domain: 'courses.finki.ukim.mk',
  name: 'MoodleSession',
  value: cookie,
};
