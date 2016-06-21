import arrify = require('arrify')
import extend = require('xtend')
import Promise = require('any-promise')
import { resolve } from 'url'
import { scrapeUrl } from './scrape'
import { Result, ResultMeta, ImageResult, VideoResult, BaseResult } from './interfaces'

export type ExtractType = 'video' | 'image' | 'article' | 'summary'

/**
 * Extract rich snippets from the scraping result.
 */
export function extract (result: Result, priority: ExtractType[] = ['video', 'image', 'article', 'summary']): Snippet {
  if (result == null) {
    return
  }

  for (const type of priority) {
    const extract = extracts[type]

    if (extract) {
      const out = extract(result)

      if (out) {
        return out
      }
    }
  }
}

/**
 * Extract the rich snippet from a URL.
 */
export function extractFromUrl (url: string, priority?: ExtractType[]): Promise<Snippet> {
  return scrapeUrl(url).then(res => extract(res, priority))
}

export interface SnippetAppLink {
  id: string
  name: string
  url: string
}

export interface SnippetLocale {
  primary?: string
  alternate?: string[]
}

export interface SnippetImage {
  url: string
  secureUrl?: string
  alt?: string
  type?: string
  width?: number
  height?: number
}

export interface SnippetPlayer {
  url: string
  width: number
  height: number
  streamUrl?: string
  streamContentType?: string
}

export interface SnippetVideo {
  url: string
  secureUrl?: string
  type?: string
  width?: number
  height?: number
}

export interface SnippetAudio {
  url: string
  secureUrl?: string
  type?: string
}

export interface SnippetTwitter {
  siteId?: string
  siteHandle?: string
  creatorId?: string
  creatorHandle?: string
}

export interface SnippetApps {
  iphone?: SnippetAppLink
  ipad?: SnippetAppLink
  android?: SnippetAppLink
  windows?: SnippetAppLink
  windowsPhone?: SnippetAppLink
}

export interface BaseSnippet extends BaseResult {
  image?: SnippetImage | SnippetImage[]
  video?: SnippetVideo | SnippetVideo[]
  audio?: SnippetAudio | SnippetAudio[]
  player?: SnippetPlayer
  originalUrl?: string
  determiner?: string
  headline?: string
  caption?: string
  tags?: string[]
  author?: string
  publisher?: string
  siteName?: string
  ttl?: number
  locale?: SnippetLocale
  twitter?: SnippetTwitter
  apps?: SnippetApps
}

export interface ArticleSnippet extends BaseResult {
  type: 'article'
  section?: string
  dateModified?: Date
  datePublished?: Date
  dateExpires?: Date
}

export interface VideoSnippet extends BaseSnippet {
  type: 'video'
}

export interface ImageSnippet extends BaseSnippet {
  type: 'image'
}

export interface SummarySnippet extends BaseSnippet {
  type: 'summary'
  subtype?: 'image' | string
}

export type Snippet = VideoSnippet | ImageSnippet | SummarySnippet | ArticleSnippet

export interface Extracts {
  video (result: Result): VideoSnippet
  image (result: Result): ImageSnippet
  summary (result: Result): SummarySnippet
  [key: string]: (result: Result) => Snippet
}

export const extracts: Extracts = {
  image (result): ImageSnippet {
    const { type, meta } = result

    if (type === 'image') {
      return result as ImageResult
    }

    if (type === 'html') {
      if (
        getString(meta, ['twitter', 'card']) === 'photo'
      ) {
        return extend(extracts.summary(result), {
          type: 'image' as 'image'
        })
      }
    }
  },
  article (result): ArticleSnippet {
    const { type, meta } = result

    if (type === 'html') {
      if (
        getString(meta, ['rdfa', '', 'http://ogp.me/ns#type']) === 'article'
      ) {
        return extend(extracts.summary(result), {
          type: 'article' as 'article',
          section: getString(meta, ['rdfa', '', 'http://ogp.me/ns/article#section']),
          datePublished: getDate(meta, ['rdfa', '', 'http://ogp.me/ns/article#published_time']),
          dateExpires: getDate(meta, ['rdfa', '', 'http://ogp.me/ns/article#expiration_time']),
          dateModified: getDate(meta, ['rdfa', '', 'http://ogp.me/ns/article#modified_time'])
        })
      }
    }
  },
  video (result): VideoSnippet {
    const { type, meta } = result

    if (type === 'video') {
      return result as VideoResult
    }

    if (type === 'html') {
      if (
        getString(meta, ['rdfa', '', 'http://ogp.me/ns#type']) === 'video'
      ) {
        return extend(extracts.summary(result), {
          type: 'video' as 'video'
        })
      }
    }
  },
  summary (result): SummarySnippet {
    const { type, contentUrl, meta } = result

    if (type === 'html') {
      return {
        type: 'summary',
        subtype: getMetaSubType(meta, 'summary'),
        image: getMetaImage(meta, contentUrl),
        video: getMetaVideo(meta, contentUrl),
        audio: getMetaAudio(meta, contentUrl),
        player: getMetaPlayer(meta, contentUrl),
        contentUrl: getMetaUrl(meta, contentUrl),
        contentSize: result.contentSize,
        originalUrl: result.contentUrl,
        encodingFormat: result.encodingFormat,
        determiner: getMetaDeterminer(meta),
        headline: getMetaHeadline(meta),
        caption: getMetaCaption(meta),
        siteName: getMetaSiteName(meta),
        author: getMetaAuthor(meta),
        publisher: getMetaPublisher(meta),
        ttl: getMetaTtl(meta),
        tags: getMetaTags(meta),
        locale: getMetaLocale(meta),
        twitter: getMetaTwitter(meta),
        apps: getMetaApps(meta)
      }
    }
  }
}

type Path = Array<string | number | symbol>

/**
 * Select a value from an object.
 */
function get <T> (obj: any, path: Path): T {
  let res = obj

  for (const key of path) {
    if (!(key in res)) {
      return
    }

    res = res[key]
  }

  return res
}

/**
 * Return a value as a string.
 */
function getString (meta: ResultMeta, path: Path): string {
  const value = get<any>(meta, path)

  if (Array.isArray(value)) {
    if (typeof value[0] === 'string') {
      return value[0]
    }
  }

  if (typeof value === 'string') {
    return value
  }
}

/**
 * Return an array of values.
 */
function getArray (meta: ResultMeta, path: Path): string[] {
  const value = get<any>(meta, path)

  return value ? arrify(value) : undefined
}

/**
 * Convert a string to valid number.
 */
function toNumber (value: string): number {
  const num = Number(value)

  return isFinite(num) ? num : undefined
}

/**
 * Return a value as a number.
 */
function getNumber (meta: ResultMeta, path: Path): number {
  return toNumber(getString(meta, path))
}

/**
 * Return a value in date format.
 */
function getDate (meta: ResultMeta, path: Path): Date {
  const value = new Date(getString(meta, path))

  return isNaN(value.getTime()) ? undefined : value
}

/**
 * Get URL from the meta object.
 */
function getUrl (meta: ResultMeta, path: Path, baseUrl: string): string {
  const value = getString(meta, path)

  if (value) {
    return resolve(baseUrl, value)
  }

  return value
}

/**
 * Set defined properties from one object to the other.
 */
function setProps (obj: any, data: any) {
  for (const key of Object.keys(data)) {
    if (data[key] != null) {
      obj[key] = data[key]
    }
  }

  return obj
}

/**
 * Get the canonical URL from the metadata.
 */
function getMetaUrl (meta: ResultMeta, baseUrl: string) {
  return getUrl(meta, ['twitter', 'url'], baseUrl) ||
    getUrl(meta, ['rdfa', '', 'http://ogp.me/ns#url'], baseUrl) ||
    getUrl(meta, ['html', 'canonical'], baseUrl) ||
    getUrl(meta, ['applinks', 'web:url'], baseUrl)
}

/**
 * Get the metadata author.
 */
function getMetaAuthor (meta: ResultMeta) {
  return getString(meta, ['html', 'author']) ||
    getString(meta, ['sailthru', 'author']) ||
    getString(meta, ['rdfa', '', 'http://ogp.me/ns/article#author']) ||
    getString(meta, ['rdfa', '', 'https://creativecommons.org/ns#attributionName'])
}

/**
 * Get tags from metadata.
 */
function getMetaTags (meta: ResultMeta): string[] {
  const htmlKeywords = getString(meta, ['html', 'keywords'])

  if (htmlKeywords) {
    return htmlKeywords.split(/ *, */)
  }

  const metaTags = get<string | string[]>(meta, ['rdfa', '', 'http://ogp.me/ns#video:tag'])

  if (metaTags) {
    return arrify(metaTags)
  }
}

/**
 * Get the publisher from metadata.
 */
function getMetaPublisher (meta: ResultMeta) {
  return getString(meta, ['rdfa', '', 'http://ogp.me/ns/article#publisher'])
}

/**
 * Get the name of the site.
 */
function getMetaSiteName (meta: ResultMeta) {
  return getString(meta, ['rdfa', '', 'http://ogp.me/ns#site_name']) ||
    getString(meta, ['twitter', 'app:name:iphone']) ||
    getString(meta, ['twitter', 'app:name:ipad']) ||
    getString(meta, ['twitter', 'app:name:googleplay']) ||
    getString(meta, ['applinks', 'ios:app_name']) ||
    getString(meta, ['applinks', 'ipad:app_name']) ||
    getString(meta, ['applinks', 'iphone:app_name']) ||
    getString(meta, ['twitter', 'android:app_name'])
}

/**
 * Get the headline from the site.
 */
function getMetaHeadline (meta: ResultMeta) {
  return getString(meta, ['twitter', 'title']) ||
    getString(meta, ['rdfa', '', 'http://ogp.me/ns#title']) ||
    getString(meta, ['html', 'title'])
}

/**
 * Get the caption from the site.
 */
function getMetaCaption (meta: ResultMeta) {
  return getString(meta, ['twitter', 'description']) ||
    getString(meta, ['rdfa', '', 'http://ogp.me/ns#description']) ||
    getString(meta, ['html', 'description'])
}

/**
 * Get the meta image url.
 */
function getMetaImage (meta: ResultMeta, baseUrl: string): SnippetImage | SnippetImage[] {
  const ogpImages = getArray(meta, ['rdfa', '', 'http://ogp.me/ns#image']) ||
    getArray(meta, ['rdfa', '', 'http://ogp.me/ns#image:url'])
  const twitterImages = getArray(meta, ['twitter', 'image'])
  const images: SnippetImage[] = []

  function addImage (newImage: SnippetImage) {
    for (const image of images) {
      if (image.url === newImage.url) {
        setProps(image, newImage)
        return
      }
    }

    images.push(newImage)
  }

  function addImages (
    urls: string[],
    secureUrls: string[],
    types: string[],
    alts: string[],
    widths: string[],
    heights: string[]
  ) {
    for (let i = 0; i < urls.length; i++) {
      addImage({
        url: urls[i],
        secureUrl: secureUrls ? secureUrls[i] : undefined,
        type: types ? types[i] : undefined,
        alt: alts ? alts[i] : undefined,
        width: widths ? toNumber(widths[i]) : undefined,
        height: heights ? toNumber(heights[i]) : undefined
      })
    }
  }

  if (ogpImages) {
    const ogpTypes = getArray(meta, ['rdfa', '', 'http://ogp.me/ns#image:type'])
    const ogpWidths = getArray(meta, ['rdfa', '', 'http://ogp.me/ns#image:width'])
    const ogpHeights = getArray(meta, ['rdfa', '', 'http://ogp.me/ns#image:height'])
    const ogpSecureUrls = getArray(meta, ['rdfa', '', 'http://ogp.me/ns#image:secure_url'])

    addImages(ogpImages, ogpSecureUrls, ogpTypes, null, ogpWidths, ogpHeights)
  }

  if (twitterImages) {
    const twitterAlts = getArray(meta, ['twitter', 'image:alt'])
    const twitterWidths = getArray(meta, ['twitter', 'image:width'])
    const twitterHeights = getArray(meta, ['twitter', 'image:height'])

    addImages(twitterImages, null, null, twitterAlts, twitterWidths, twitterHeights)
  }

  return images.length > 1 ? images : images[0]
}

/**
 * Get the meta audio information.
 */
function getMetaAudio (meta: ResultMeta, baseUrl: string): SnippetAudio | SnippetAudio[] {
  const ogpAudios = getArray(meta, ['rdfa', '', 'http://ogp.me/ns#audio']) ||
    getArray(meta, ['rdfa', '', 'http://ogp.me/ns#audio:url'])
  const audios: SnippetAudio[] = []

  function addAudio (newAudio: SnippetAudio) {
    for (const audio of audios) {
      if (audio.url === newAudio.url) {
        setProps(audio, newAudio)
        return
      }
    }

    audios.push(newAudio)
  }

  function addAudios (urls: string[], secureUrls: string[], types: string[]) {
    for (let i = 0; i < urls.length; i++) {
      addAudio({
        url: urls[i],
        secureUrl: secureUrls ? secureUrls[i] : undefined,
        type: types ? types[i] : undefined
      })
    }
  }

  if (ogpAudios) {
    const ogpTypes = getArray(meta, ['rdfa', '', 'http://ogp.me/ns#audio:type'])
    const ogpSecureUrls = getArray(meta, ['rdfa', '', 'http://ogp.me/ns#audio:secure_url'])

    addAudios(ogpAudios, ogpSecureUrls, ogpTypes)
  }

  return audios.length > 1 ? audios : audios[0]
}

/**
 * Get the meta image url.
 */
function getMetaVideo (meta: ResultMeta, baseUrl: string): SnippetVideo | SnippetVideo[] {
  const ogpVideos = getArray(meta, ['rdfa', '', 'http://ogp.me/ns#video']) ||
    getArray(meta, ['rdfa', '', 'http://ogp.me/ns#video:url'])
  const videos: SnippetVideo[] = []

  function addVideo (newVideo: SnippetVideo) {
    for (const video of videos) {
      if (video.url === newVideo.url) {
        setProps(video, newVideo)
        return
      }
    }

    videos.push(newVideo)
  }

  function addVideos (
    urls: string[],
    secureUrls: string[],
    types: string[],
    widths: string[],
    heights: string[]
  ) {
    for (let i = 0; i < urls.length; i++) {
      addVideo({
        url: urls[i],
        secureUrl: secureUrls ? secureUrls[i] : undefined,
        type: types ? types[i] : undefined,
        width: widths ? toNumber(widths[i]) : undefined,
        height: heights ? toNumber(heights[i]) : undefined
      })
    }
  }

  if (ogpVideos) {
    const ogpTypes = getArray(meta, ['rdfa', '', 'http://ogp.me/ns#video:type'])
    const ogpWidths = getArray(meta, ['rdfa', '', 'http://ogp.me/ns#video:width'])
    const ogpHeights = getArray(meta, ['rdfa', '', 'http://ogp.me/ns#video:height'])
    const ogpSecureUrls = getArray(meta, ['rdfa', '', 'http://ogp.me/ns#video:secure_url'])

    addVideos(ogpVideos, ogpSecureUrls, ogpTypes, ogpWidths, ogpHeights)
  }

  return videos.length > 1 ? videos : videos[0]
}

/**
 * Get apps metadata.
 */
function getMetaApps (meta: ResultMeta): SnippetApps {
  return {
    iphone: getMetaIphoneApp(meta),
    ipad: getMetaIpadApp(meta),
    android: getMetaAndroidApp(meta),
    windows: getMetaWindowsApp(meta),
    windowsPhone: getMetaWindowsPhoneApp(meta)
  }
}

/**
 * Extract iPad app information from metadata.
 */
function getMetaIpadApp (meta: ResultMeta): SnippetAppLink {
  const twitterIpadUrl = getString(meta, ['twitter', 'app:url:ipad'])
  const twitterIpadId = getString(meta, ['twitter', 'app:id:ipad'])
  const twitterIpadName = getString(meta, ['twitter', 'app:name:ipad'])

  if (twitterIpadId && twitterIpadName && twitterIpadUrl) {
    return {
      id: twitterIpadId,
      name: twitterIpadName,
      url: twitterIpadUrl
    }
  }

  const applinksIpadUrl = getString(meta, ['applinks', 'ipad:url'])
  const applinksIpadId = getString(meta, ['applinks', 'ipad:app_store_id'])
  const applinksIpadName = getString(meta, ['applinks', 'ipad:app_name'])

  if (applinksIpadId && applinksIpadName && applinksIpadUrl) {
    return {
      id: applinksIpadId,
      name: applinksIpadName,
      url: applinksIpadUrl
    }
  }

  return getMetaIosApp(meta)
}

/**
 * Extract iPhone app information from metadata.
 */
function getMetaIphoneApp (meta: ResultMeta): SnippetAppLink {
  const twitterIphoneUrl = getString(meta, ['twitter', 'app:url:iphone'])
  const twitterIphoneId = getString(meta, ['twitter', 'app:id:iphone'])
  const twitterIphoneName = getString(meta, ['twitter', 'app:name:iphone'])

  if (twitterIphoneId && twitterIphoneName && twitterIphoneUrl) {
    return {
      id: twitterIphoneId,
      name: twitterIphoneName,
      url: twitterIphoneUrl
    }
  }

  const applinksIphoneUrl = getString(meta, ['applinks', 'iphone:url'])
  const applinksIphoneId = getString(meta, ['applinks', 'iphone:app_store_id'])
  const applinksIphoneName = getString(meta, ['applinks', 'iphone:app_name'])

  if (applinksIphoneId && applinksIphoneName && applinksIphoneUrl) {
    return {
      id: applinksIphoneId,
      name: applinksIphoneName,
      url: applinksIphoneUrl
    }
  }

  return getMetaIosApp(meta)
}

/**
 * Extract the iOS app metadata.
 */
function getMetaIosApp (meta: ResultMeta): SnippetAppLink {
  const applinksUrl = getString(meta, ['applinks', 'ios:url'])
  const applinksId = getString(meta, ['applinks', 'ios:app_store_id'])
  const applinksName = getString(meta, ['applinks', 'ios:app_name'])

  if (applinksId && applinksName && applinksUrl) {
    return {
      id: applinksId,
      name: applinksName,
      url: applinksUrl
    }
  }
}

/**
 * Extract Android app metadata.
 */
function getMetaAndroidApp (meta: ResultMeta): SnippetAppLink {
  const twitterAndroidUrl = getString(meta, ['twitter', 'app:url:googleplay'])
  const twitterAndroidId = getString(meta, ['twitter', 'app:id:googleplay'])
  const twitterAndroidName = getString(meta, ['twitter', 'app:name:googleplay'])

  if (twitterAndroidId && twitterAndroidName && twitterAndroidUrl) {
    return {
      id: twitterAndroidId,
      name: twitterAndroidName,
      url: twitterAndroidUrl
    }
  }

  const applinksAndroidUrl = getString(meta, ['applinks', 'android:url'])
  const applinksAndroidId = getString(meta, ['applinks', 'android:package'])
  const applinksAndroidName = getString(meta, ['applinks', 'android:app_name'])

  if (applinksAndroidId && applinksAndroidName && applinksAndroidUrl) {
    return {
      id: applinksAndroidId,
      name: applinksAndroidName,
      url: applinksAndroidUrl
    }
  }
}

/**
 * Extract Windows Phone app metadata.
 */
function getMetaWindowsPhoneApp (meta: ResultMeta): SnippetAppLink {
  const applinksWindowsPhoneUrl = getString(meta, ['applinks', 'windows_phone:url'])
  const applinksWindowsPhoneId = getString(meta, ['applinks', 'windows_phone:app_id'])
  const applinksWindowsPhoneName = getString(meta, ['applinks', 'windows_phone:app_name'])

  if (applinksWindowsPhoneId && applinksWindowsPhoneName && applinksWindowsPhoneUrl) {
    return {
      id: applinksWindowsPhoneId,
      name: applinksWindowsPhoneName,
      url: applinksWindowsPhoneUrl
    }
  }

  return getMetaWindowsUniversalApp(meta)
}

/**
 * Extract Windows app metadata.
 */
function getMetaWindowsApp (meta: ResultMeta): SnippetAppLink {
  const applinksWindowsUrl = getString(meta, ['applinks', 'windows:url'])
  const applinksWindowsId = getString(meta, ['applinks', 'windows:app_id'])
  const applinksWindowsName = getString(meta, ['applinks', 'windows:app_name'])

  if (applinksWindowsId && applinksWindowsName && applinksWindowsUrl) {
    return {
      id: applinksWindowsId,
      name: applinksWindowsName,
      url: applinksWindowsUrl
    }
  }

  return getMetaWindowsUniversalApp(meta)
}

/**
 * Extract Windows Universal app metadata.
 */
function getMetaWindowsUniversalApp (meta: ResultMeta): SnippetAppLink {
  const applinksWindowsUniversalUrl = getString(meta, ['applinks', 'windows_universal:url'])
  const applinksWindowsUniversalId = getString(meta, ['applinks', 'windows_universal:app_id'])
  const applinksWindowsUniversalName = getString(meta, ['applinks', 'windows_universal:app_name'])

  if (applinksWindowsUniversalId && applinksWindowsUniversalName && applinksWindowsUniversalUrl) {
    return {
      id: applinksWindowsUniversalId,
      name: applinksWindowsUniversalName,
      url: applinksWindowsUniversalUrl
    }
  }
}

/**
 * Get locale data.
 */
function getMetaLocale (meta: ResultMeta): SnippetLocale {
  const primary = getString(meta, ['rdfa', '', 'http://ogp.me/ns#locale'])
  const alternate = getArray(meta, ['rdfa', '', 'http://ogp.me/ns#locale:alternate'])

  if (primary || alternate) {
    return { primary, alternate }
  }
}

/**
 * Get twitter data.
 */
function getMetaTwitter (meta: ResultMeta): SnippetTwitter {
  const creatorId = getString(meta, ['twitter', 'creator:id'])
  const creatorHandle = getTwitterHandle(meta, ['twitter', 'creator'])
  const siteId = getString(meta, ['twitter', 'site:id'])
  const siteHandle = getTwitterHandle(meta, ['twitter', 'site'])

  if (siteId || siteHandle || creatorId || creatorHandle) {
    return {
      siteId,
      siteHandle,
      creatorId,
      creatorHandle
    }
  }
}

function getTwitterHandle (meta: ResultMeta, path: Path) {
  const value = getString(meta, path)

  if (value) {
    // Normalize twitter handles.
    return value.replace(/^@/, '')
  }
}

/**
 * Get the TTL of the page.
 */
function getMetaTtl (meta: ResultMeta): number {
  return getNumber(meta, ['rdfa', '', 'http://ogp.me/ns#ttl'])
}

/**
 * Get the object determiner.
 */
function getMetaDeterminer (meta: ResultMeta): string {
  return getString(meta, ['rdfa', '', 'http://ogp.me/ns#determiner'])
}

/**
 * Get the sub-type of metadata.
 */
function getMetaSubType (meta: ResultMeta, type: string): string {
  if (type === 'summary') {
    const twitterCard = getString(meta, ['twitter', 'card'])

    if (twitterCard === 'summary_large_image') {
      return 'image'
    }
  }
}

/**
 * Retrieve a URL for embedding an interactive widget.
 */
function getMetaPlayer (meta: ResultMeta, baseUrl: string): SnippetPlayer {
  const isPlayer = getString(meta, ['twitter', 'card']) === 'player'

  if (!isPlayer) {
    return
  }

  const url = getString(meta, ['twitter', 'player'])
  const width = getNumber(meta, ['twitter', 'player:width'])
  const height = getNumber(meta, ['twitter', 'player:height'])
  const streamUrl = getString(meta, ['twitter', 'player:stream'])
  const streamContentType = getString(meta, ['twitter', 'player:stream:content_type'])

  if (url && width && height) {
    return {
      url,
      width,
      height,
      streamUrl,
      streamContentType
    }
  }
}
