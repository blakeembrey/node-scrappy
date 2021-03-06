import { fetch } from "popsicle/dist/node";
import filenamify from "filenamify";
import { createReadStream, createWriteStream } from "fs";
import { promises as fs } from "fs";
import { join } from "path";
import { Readable, PassThrough } from "stream";
import type { Request, RequestOptions } from "@borderless/unfurl";

export const FIXTURE_DIR = join(__dirname, "../fixtures");

export const FIXTURE_URLS = [
  // Source code repository.
  "https://github.com/blakeembrey/popsicle",
  "https://github.com/moment/moment/pull/3323",
  "https://github.com/Microsoft/TypeScript/issues/10462",
  // Profile pages.
  "https://github.com/blakeembrey",
  "https://twitter.com/blakeembrey",
  // Music pages.
  "https://soundcloud.com/lifeofdesiigner/desiigner-panda",
  "https://soundcloud.com/tobiasvanschneider/ntmy-episode-1-pieter-levels",
  "https://slant6.bandcamp.com/",
  // Movie pages.
  "http://www.imdb.com/title/tt1375666/",
  "https://www.rottentomatoes.com/m/inception/",
  "https://trakt.tv/movies/kung-fury-2015",
  // File pages.
  "http://d.pr/a/q3z9",
  // Information pages.
  "https://en.wikipedia.org/wiki/TypeScript",
  "https://en.wikipedia.org/wiki/Jean-Luc_Picard",
  // Places.
  "https://www.google.com/maps/place/Boba+Guys/@37.7600441,-122.4233333,17z/data=!4m5!3m4!1s0x808f7e3cfdb89265:0x8ae0820c41111f70!8m2!3d37.7600017!4d-122.4211124",
  "https://foursquare.com/v/boba-guys/51abb0a3498eb42c0d5cf324",
  "https://foursquare.com/v/sydney-opera-house/4b058762f964a5201b8f22e3",
  "https://foursquare.com/v/royal-botanic-garden/4b058761f964a520188f22e3",
  "https://foursquare.com/v/bondi-beach/4b058763f964a520848f22e3",
  "https://foursquare.com/v/darling-harbour/4b058762f964a5201d8f22e3",
  "https://foursquare.com/v/the-baxter-inn/4ed4896c775b45f6ed7b0182",
  "https://foursquare.com/v/mrs-macquaries-point/4b3c2445f964a520348225e3",
  "https://foursquare.com/v/bourke-street-bakery/4b0b4a63f964a520fa2f23e3",
  "http://www.yelp.com/biz/boba-guys-san-francisco-4",
  // Social media posts.
  "https://news.ycombinator.com/item?id=12282756",
  "https://www.reddit.com/r/news/comments/4p1enj/uk_man_tried_to_kill_trump_court_papers/",
  "https://twitter.com/typescriptlang/status/743113612407889920",
  "https://twitter.com/ericclemmons/status/749223563790471169",
  "https://twitter.com/alexisohanian/status/764997551384776704",
  "https://twitter.com/SeanTAllen/status/764993929469161472",
  // PDFs.
  "https://web.eecs.umich.edu/~mihalcea/papers/mihalcea.emnlp04.pdf",
  "http://web.cs.ucdavis.edu/~rogaway/papers/moral-fn.pdf",
  "https://cansecwest.com/slides/2015/Liang_CanSecWest2015.pdf",
  // JPEG.
  "https://c1.staticflickr.com/9/8699/28229743586_cd32cea242_o.jpg",
  "https://c2.staticflickr.com/4/3930/15428630771_61e9dcf6f4_o.jpg",
  // PNG.
  "http://html5doctor.com/wp-content/uploads/2011/08/rich-snippet-data2.png",
  "https://i.imgur.com/mvUPRyV.png",
  // WebP.
  "https://www.gstatic.com/webp/gallery/1.webp",
  "https://upload.wikimedia.org/wikipedia/commons/a/a1/Johnrogershousemay2020.webp",
  // Image pages.
  "https://www.flickr.com/photos/timdrivas/27999498362/in/explore-2016-07-05/",
  "https://www.flickr.com/photos/fabianf_/28229743586/sizes/o/",
  "https://www.instagram.com/p/BG0m4IDGaqk/",
  // Pricing pages.
  "http://cloudinary.com/pricing",
  // Forum posts.
  "https://discourse.codinghorror.com/t/the-raspberry-pi-has-revolutionized-emulation/4462/29",
  "https://moz.com/community/q/are-rel-author-and-rel-publisher-meta-tags-currently-in-use",
  // Video pages.
  "https://www.youtube.com/watch?v=W9ZnpIGvZUo",
  "https://www.ted.com/talks/tim_harford_how_messy_problems_can_inspire_creativity",
  "https://www.ted.com/playlists/321/talks_to_form_better_habits?utm_campaign=social&utm_medium=referral&utm_source=facebook.com&utm_content=playlist&utm_term=social-science",
  "https://www.youtube.com/watch?v=ZynZdGqxT7Q",
  // XKCD entries.
  "http://xkcd.com/208/",
  // Schema pages.
  "https://schema.org/WebSite",
  // Documentation.
  "https://developers.google.com/search/docs/guides/intro-structured-data",
  "https://learnxinyminutes.com/docs/standard-ml/",
  "https://dev.twitter.com/cards/types/player",
  "https://www.w3.org/TR/json-ld/",
  "http://knexjs.org/",
  // Product pages.
  "https://bjango.com/mac/istatmenus/",
  "http://www.newegg.com/Product/Product.aspx?Item=28-840-014",
  "https://www.etsy.com/listing/549504785/pokenatomy-the-science-of-pokemon-an?ref=hp_prn&frs=1",
  "http://www.ebay.com/itm/Outdoor-Wicker-Patio-Furniture-Sofa-3-Seater-Luxury-Comfort-Brown-Wicker-Couch-/381228738769?&_trksid=p2056016.l4276",
  "http://store.steampowered.com/app/8930/",
  "https://itunes.apple.com/us/movie/the-avengers/id533654020",
  "http://www.mysteryranch.com/asap-pack",
  // "https://www.bestbuy.com/site/apple-airpods-pro-white/5706659.p",
  "https://itunes.apple.com/us/app/pokemon-go/id1094591345?mt=8",
  "https://smile.amazon.com/gp/product/1937785734/ref=s9_qpp_gw_d99_g14_i5_r?ie=UTF8&fpl=fresh&pf_rd_m=ATVPDKIKX0DER&pf_rd_s=desktop-1&pf_rd_r=92JG667YC8526036ANPR&pf_rd_t=36701&pf_rd_p=6aad23bd-3035-4a40-b691-0eefb1a18396&pf_rd_i=desktop", // Good cross-domain redirect test.
  "https://www.airbnb.com/rooms/2250401?checkin=06%2F24%2F2016&checkout=06%2F30%2F2016&guests=1&s=eI3nl9s6",
  "http://franz.com/agraph/allegrograph/",
  "http://shop.boostedboards.com/products/boosted-dual-plus?variant=1141824744",
  "https://www.kickstarter.com/projects/lactate-threshold/lvl-the-first-wearable-hydration-monitor?ref=category_featured",
  "https://pragprog.com/book/btlang/seven-languages-in-seven-weeks",
  "https://www.battlefield.com/buy/battlefield-1",
  "https://yoast.com/wordpress/plugins/seo/",
  // Property pages.
  "https://www.redfin.com/CA/Oakland/2325-Valley-St-94612/unit-201/home/173701090",
  // "https://www.zillow.com/homes/2325-Valley-St-.num.-201-Oakland,-CA,-94612_rb/2077166664_zpid/",
  "https://www.opendoor.com/homes/21-via-hacienda-rancho-santa-margarita-ca-92688",
  // Documents.
  "https://drive.google.com/file/d/0B59Tysg-nEQZOGhsU0U5QXo0Sjg/view?usp=sharing",
  "https://docs.google.com/document/d/1GnsFxQZWERvB5A2cYnmpmNzgH_zAtUsUMQ-th1em2jQ/edit?usp=sharing",
  "https://docs.google.com/spreadsheets/d/1teKblpByMmLaSmRAqDCyLXf0RApcJg3sg4E0MMmfrPg/edit?usp=sharing",
  // Quora.
  "https://www.quora.com/How-do-I-impress-a-computer-programmer-on-a-date",
  // Homepages.
  "http://hackerne.ws", // Good redirection test.
  "https://www.spotify.com/",
  "https://github.com/",
  "https://www.facebook.com/",
  "https://twitter.com/",
  "http://www.reddit.com/",
  "http://ogp.me/",
  "https://techcrunch.com/",
  "http://cnn.com/",
  "http://everlane.com/",
  "http://dealmoon.com/",
  // Landing page.
  "https://tailwindui.com/pricing",
  // Blog/article posts.
  "http://www.lifehacker.com.au/2016/08/some-bill-providers-automatically-update-your-credit-card-when-you-get-a-new-one/",
  "http://www.theverge.com/2016/8/10/12416766/google-white-house-ostp-emails?utm_campaign=theverge&utm_content=chorus&utm_medium=social&utm_source=twitter",
  "http://gizmodo.com/the-dnc-hack-was-much-bigger-than-we-thought-1785145268?utm_campaign=socialflow_gizmodo_twitter&utm_source=gizmodo_twitter&utm_medium=socialflow",
  "https://bjango.com/articles/pngoptimisation/",
  "https://droplr.com/droplr-addition-google-chrome-extension",
  "https://adactio.com/journal/9881",
  "http://www.news.com.au/world/breaking-news/uk-man-tried-to-kill-trump-court-papers/news-story/c4116603f54f1b7c88339cd039c7e123",
  "http://html5doctor.com/microdata/",
  "http://www.nytimes.com/2016/06/15/opinion/campaign-stops/decoding-donald-trump.html?action=click&module=MostEmailed&region=Lists&pgtype=collection",
  "https://medium.com/slack-developer-blog/everything-you-ever-wanted-to-know-about-unfurling-but-were-afraid-to-ask-or-how-to-make-your-e64b4bb9254#.a0wjf4ltt",
  "https://segment.com/blog/the-segment-aws-stack/",
  "http://mashable.com/2016/06/17/battle-of-the-bastards-game-of-thrones-fantasy-ending/#L2pP7_P5k5q3",
  "https://techcrunch.com/2016/06/17/the-europas-awards-2016-honored-the-best-tech-startups-in-europe/",
  "https://techcrunch.com/2020/02/23/sensors-are-the-next-big-thing-in-space-not-starships/",
  "https://aaronparecki.com/2016/08/23/2/micropub-cr?utm_medium=email&utm_source=html5weekly",
  "http://ideas.ted.com/why-i-learned-20-languages-and-what-i-learned-about-myself-in-the-process/?utm_campaign=social&utm_medium=referral&utm_source=facebook.com&utm_content=ideas-blog&utm_term=education",
  "https://stratechery.com/2016/google-uber-and-the-evolution-of-transportation-as-a-service/",
  "https://github.com/blog/2242-git-2-10-has-been-released",
  "http://waitbutwhy.com/2016/09/marriage-decision.html",
  "https://ianstormtaylor.com/design-tip-never-use-black/",
  "https://www.sciencedaily.com/releases/2020/03/200311121832.htm",
  "https://spreadprivacy.com/privacy-risks-note-apps/",
  // Courses.
  "https://www.khanacademy.org/economics-finance-domain/core-finance/stock-and-bonds/stocks-intro-tutorial/v/bonds-vs-stocks",
  "https://www.coursera.org/learn/machine-learning",
  // Contact page.
  "https://www.mulesoft.com/contact",
  // Developer pages.
  "https://www.npmjs.com/package/filenamify",
  "https://atom.io/themes/aesthetic-ui",
  // Schema definitions.
  "https://schema.org/docs/schema_org_rdfa.html",
];

/**
 * Fork readable stream into two streams.
 */
export function tee(stream: Readable): [Readable, Readable] {
  return [stream.pipe(new PassThrough()), stream.pipe(new PassThrough())];
}

/**
 * Build file name for request caching.
 */
const buildFilename = (url: string, options: RequestOptions): string => {
  const params = [options.accept && `accept:${options.accept}`]
    .filter((x) => x !== undefined)
    .join(";");

  if (params) return `${filenamify(url)}/${filenamify(params)}`;

  return filenamify(url);
};

export const request: Request = async (url, options = {}) => {
  const filename = buildFilename(url, options);
  const path = join(FIXTURE_DIR, filename);

  const load = async () => {
    console.log(`Fetching ${JSON.stringify(url)}...`);

    const res = await fetch(url, {
      headers: {
        Accept: options.accept || "*/*",
        "User-Agent": "UnfurlBot 1.0 (+https://github.com/borderless/unfurl)",
      },
    });

    console.log(`Writing ${filename} with status ${res.status}...`);

    await fs.mkdir(path, { recursive: true });

    const meta = {
      url: res.url,
      headers: res.headers.asObject(),
      status: res.status,
    };

    // Write metadata to JSON file.
    await fs.writeFile(join(path, "meta.json"), JSON.stringify(meta));

    // Pipe response stream into file.
    const [a, b] = tee(res.stream());
    a.pipe(createWriteStream(join(path, "body")));

    return {
      ...meta,
      body: b,
    };
  };

  try {
    const stats = await fs.stat(path);

    if (!stats.isDirectory()) return load();
  } catch {
    return load();
  }

  const meta = JSON.parse(
    await fs.readFile(join(path, "meta.json"), "utf8")
  ) as { url: string; status: number; headers: Record<string, string> };

  return {
    ...meta,
    body: createReadStream(join(path, "body")),
  };
};
