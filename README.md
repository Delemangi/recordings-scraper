# Courses Recordings Scraper

Use this to get the links of all recordings within a Courses (Moodle) course, and generates a screenshot of the entire course.

## Installing

1. `git clone git@github.com:Delemangi/courses-recordings-scraper.git`
2. `npm i`
3. `npm run build`

You don't need to have any WebDrivers installed for this.

## Usage

`npm run start <cookie> <url>`, where `cookie` is your `MoodleSession` cookie, and `url` is the url of the course.

Once run, a Chrome window opens and locates all the recordings within the course. Don't close it, as it will close itself when it's done. The results will be written in the `output` directory.

## License

This project is licensed under the MIT license.
