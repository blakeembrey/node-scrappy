# Scrappy

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

> Extract rich metadata from URLs.

## Installation

```sh
npm install scrappy --save
```

## Usage

Starting from `extractFromUrl`, **scrappy** creates a HTTP request (`scrapeUrl`) and streams the response into the scraper (`scrapeStream`). The scraper extracts metadata based on various specifications and standards, including HTML, RDFa, JSON-LD, Microdata, Open Graph and OEmbed. With all the relevant metadata, it uses `extract` to select the appropriate snippet. If you need snippets in a different format, you can create your own extraction method which accepts the scraped metadata.

```ts
import { scrapeUrl, scrapeStream, extract, extractFromUrl } from 'scrappy'

const url = 'https://medium.com/slack-developer-blog/everything-you-ever-wanted-to-know-about-unfurling-but-were-afraid-to-ask-or-how-to-make-your-e64b4bb9254#.a0wjf4ltt'

extractFromUrl(url).then(function (snippet) {
  // {
  //   "type": "summary",
  //   "imageUrl": "https://cdn-images-1.medium.com/max/1200/1*QOMaDLcO8rExD0ctBV3BWg.png",
  //   "contentUrl": "https://medium.com/slack-developer-blog/everything-you-ever-wanted-to-know-about-unfurling-but-were-afraid-to-ask-or-how-to-make-your-e64b4bb9254",
  //   "originalUrl": "https://medium.com/slack-developer-blog/everything-you-ever-wanted-to-know-about-unfurling-but-were-afraid-to-ask-or-how-to-make-your-e64b4bb9254#.a0wjf4ltt",
  //   "encodingFormat": "html",
  //   "headline": "Everything you ever wanted to know about unfurling but were afraid to ask /or/ How to make your… — Slack Platform Blog",
  //   "caption": "Let’s start with the most obvious question first. This is what an “unfurl” is:",
  //   "siteName": "Medium",
  //   "author": "Matt Haughey",
  //   "publisher": "https://www.facebook.com/medium",
  //   "apps": {
  //     "iphone": {
  //       "id": "828256236",
  //       "name": "Medium",
  //       "url": "medium://p/e64b4bb9254"
  //     },
  //     "ipad": {
  //       "id": "828256236",
  //       "name": "Medium",
  //       "url": "medium://p/e64b4bb9254"
  //     },
  //     "android": {
  //       "id": "com.medium.reader",
  //       "name": "Medium",
  //       "url": "medium://p/e64b4bb9254"
  //     }
  //   }
  // }
})
```

## Development

```sh
# Build the fixtures directory with raw content.
node scripts/fixtures.js
# Scrape the metadata results from fixtures.
node scripts/scrape.js
# Extract the snippets from the previous results.
node scripts/extract.js
```

## License

Apache 2.0

[npm-image]: https://img.shields.io/npm/v/scrappy.svg?style=flat
[npm-url]: https://npmjs.org/package/scrappy
[downloads-image]: https://img.shields.io/npm/dm/scrappy.svg?style=flat
[downloads-url]: https://npmjs.org/package/scrappy
[travis-image]: https://img.shields.io/travis/blakeembrey/node-scrappy.svg?style=flat
[travis-url]: https://travis-ci.org/blakeembrey/node-scrappy
[coveralls-image]: https://img.shields.io/coveralls/blakeembrey/node-scrappy.svg?style=flat
[coveralls-url]: https://coveralls.io/r/blakeembrey/node-scrappy?branch=master
