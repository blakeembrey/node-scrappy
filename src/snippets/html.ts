import { Path } from 'getvalue'

import {
  Entity,
  HtmlResult,
  HtmlSnippet,
  HtmlSnippetImage,
  HtmlSnippetAppLink,
  HtmlSnippetApps,
  HtmlSnippetAudio,
  HtmlSnippetLocale,
  HtmlSnippetPlayer,
  HtmlSnippetVideo,
  HtmlSnippetTwitter,
  HtmlSnippetIcon,
  ExtractOptions
} from '../interfaces'

import {
  getArray,
  getDate,
  getString,
  getNumber,
  getUrl,
  copyProps,
  toNumber,
  toString,
  JsonLdValue
} from '../support'

export default function (result: HtmlResult, options: ExtractOptions): HtmlSnippet {
  return {
    type: 'html',
    image: getImage(result),
    video: getVideo(result),
    audio: getAudio(result),
    player: getPlayer(result),
    entity: getEntity(result),
    url: result.url,
    canonicalUrl: getCanonicalUrl(result),
    encodingFormat: result.encodingFormat,
    determiner: getDeterminer(result),
    headline: getHeadline(result),
    description: getDescription(result),
    provider: getProvider(result),
    author: getAuthor(result),
    ttl: getTtl(result),
    icon: getIcon(result, options),
    tags: getTags(result),
    locale: getLocale(result),
    twitter: getTwitter(result),
    apps: getApps(result)
  }
}

/**
 * Get the canonical URL from the metadata.
 */
function getCanonicalUrl (result: HtmlResult) {
  return getUrl(result, ['twitter', 'url'], result.url) ||
    getUrl(result, ['rdfa', 0, 'http://ogp.me/ns#url'], result.url) ||
    getUrl(result, ['html', 'canonical'], result.url) ||
    getUrl(result, ['applinks', 'web:url'], result.url) ||
    getUrl(result, ['oembed', 'url'], result.url)
}

/**
 * Get the metadata author.
 */
function getAuthor (result: HtmlResult) {
  const name = getString(result, ['html', 'author']) ||
    getString(result, ['oembed', 'author_name']) ||
    getString(result, ['rdfa', 0, 'http://ogp.me/ns/article#author']) ||
    getString(result, ['rdfa', 0, 'https://creativecommons.org/ns#attributionName']) ||
    getString(result, ['sailthru', 'author'])

  const url = getString(result, ['oembed', 'author_url'])

  return { name, url }
}

/**
 * Get tags from metadata.
 */
function getTags (result: HtmlResult): string[] | undefined {
  const htmlKeywords = getString(result, ['html', 'keywords'])

  if (htmlKeywords) {
    return htmlKeywords.split(/ *, */)
  }

  const metaTags = getArray(result, ['rdfa', 0, 'http://ogp.me/ns#video:tag'])

  if (metaTags) {
    return metaTags
  }

  return
}

/**
 * Get the name of the site.
 */
function getProvider (result: HtmlResult) {
  const name = getString(result, ['rdfa', 0, 'http://ogp.me/ns#site_name']) ||
    getString(result, ['oembed', 'provider_name']) ||
    getString(result, ['html', 'application-name']) ||
    getString(result, ['html', 'apple-mobile-web-app-title']) ||
    getString(result, ['twitter', 'app:name:iphone']) ||
    getString(result, ['twitter', 'app:name:ipad']) ||
    getString(result, ['twitter', 'app:name:googleplay']) ||
    getString(result, ['applinks', 'ios:app_name']) ||
    getString(result, ['applinks', 'ipad:app_name']) ||
    getString(result, ['applinks', 'iphone:app_name']) ||
    getString(result, ['twitter', 'android:app_name'])

  const url = getString(result, ['oembed', 'provider_url'])

  return { name, url }
}

/**
 * Get the headline from the site.
 */
function getHeadline (result: HtmlResult) {
  return getString(result, ['twitter', 'title']) ||
    getString(result, ['oembed', 'title']) ||
    getString(result, ['rdfa', 0, 'http://ogp.me/ns#title']) ||
    getString(result, ['rdfa', 0, 'http://purl.org/dc/terms/title']) ||
    getString(result, ['html', 'title'])
}

/**
 * Get the caption from the site.
 */
function getDescription (result: HtmlResult) {
  return getString(result, ['rdfa', 0, 'http://ogp.me/ns#description']) ||
    getString(result, ['oembed', 'summary']) ||
    getString(result, ['twitter', 'description']) ||
    getString(result, ['html', 'description'])
}

/**
 * Get the meta image url.
 */
function getImage (result: HtmlResult): HtmlSnippetImage | HtmlSnippetImage[] {
  const ogpImages = getArray(result, ['rdfa', 0, 'http://ogp.me/ns#image']) ||
    getArray(result, ['rdfa', 0, 'http://ogp.me/ns#image:url'])
  const twitterImages = getArray(result, ['twitter', 'image']) || getArray(result, ['twitter', 'image0'])
  const images: HtmlSnippetImage[] = []

  function addImage (newImage: HtmlSnippetImage, append: boolean) {
    for (const image of images) {
      if (image.url === newImage.url) {
        copyProps(image, newImage)
        return
      }
    }

    if (append) {
      images.push(newImage)
    }
  }

  function addImages (
    urls: string[] | JsonLdValue[],
    secureUrls: string[] | JsonLdValue[] | undefined,
    types: string[] | JsonLdValue[] | undefined,
    alts: string[] | JsonLdValue[] | undefined,
    widths: string[] | JsonLdValue[] | undefined,
    heights: string[] | JsonLdValue[] | undefined,
    append: boolean
  ) {
    for (let i = 0; i < urls.length; i++) {
      addImage(
        {
          url: toString(urls[i]) as string,
          secureUrl: secureUrls ? toString(secureUrls[i]) : undefined,
          type: types ? toString(types[i]) : undefined,
          alt: alts ? toString(alts[i]) : undefined,
          width: widths ? toNumber(widths[i]) : undefined,
          height: heights ? toNumber(heights[i]) : undefined
        },
        append
      )
    }
  }

  if (ogpImages) {
    const ogpTypes = getArray(result, ['rdfa', 0, 'http://ogp.me/ns#image:type'])
    const ogpWidths = getArray(result, ['rdfa', 0, 'http://ogp.me/ns#image:width'])
    const ogpHeights = getArray(result, ['rdfa', 0, 'http://ogp.me/ns#image:height'])
    const ogpSecureUrls = getArray(result, ['rdfa', 0, 'http://ogp.me/ns#image:secure_url'])

    addImages(ogpImages, ogpSecureUrls, ogpTypes, undefined, ogpWidths, ogpHeights, true)
  }

  if (twitterImages) {
    const twitterAlts = getArray(result, ['twitter', 'image:alt'])
    const twitterWidths = getArray(result, ['twitter', 'image:width'])
    const twitterHeights = getArray(result, ['twitter', 'image:height'])

    addImages(twitterImages, undefined, undefined, twitterAlts, twitterWidths, twitterHeights, !ogpImages)
  }

  return images.length > 1 ? images : images[0]
}

/**
 * Get the meta audio information.
 */
function getAudio (result: HtmlResult): HtmlSnippetAudio | HtmlSnippetAudio[] {
  const ogpAudios = getArray(result, ['rdfa', 0, 'http://ogp.me/ns#audio']) ||
    getArray(result, ['rdfa', 0, 'http://ogp.me/ns#audio:url'])
  const audios: HtmlSnippetAudio[] = []

  function addAudio (newAudio: HtmlSnippetAudio) {
    for (const audio of audios) {
      if (audio.url === newAudio.url) {
        copyProps(audio, newAudio)
        return
      }
    }

    audios.push(newAudio)
  }

  function addAudios (urls: string[], secureUrls: string[] | undefined, types: string[] | undefined) {
    for (let i = 0; i < urls.length; i++) {
      addAudio({
        url: urls[i],
        secureUrl: secureUrls ? secureUrls[i] : undefined,
        type: types ? types[i] : undefined
      })
    }
  }

  if (ogpAudios) {
    const ogpTypes = getArray(result, ['rdfa', 0, 'http://ogp.me/ns#audio:type'])
    const ogpSecureUrls = getArray(result, ['rdfa', 0, 'http://ogp.me/ns#audio:secure_url'])

    addAudios(ogpAudios, ogpSecureUrls, ogpTypes)
  }

  return audios.length > 1 ? audios : audios[0]
}

/**
 * Get the meta image url.
 */
function getVideo (result: HtmlResult): HtmlSnippetVideo | HtmlSnippetVideo[] {
  const ogpVideos = getArray(result, ['rdfa', 0, 'http://ogp.me/ns#video']) ||
    getArray(result, ['rdfa', 0, 'http://ogp.me/ns#video:url'])
  const videos: HtmlSnippetVideo[] = []

  function addVideo (newVideo: HtmlSnippetVideo) {
    for (const video of videos) {
      if (video.url === newVideo.url) {
        copyProps(video, newVideo)
        return
      }
    }

    videos.push(newVideo)
  }

  function addVideos (
    urls: string[],
    secureUrls: string[] | undefined,
    types: string[] | undefined,
    widths: string[] | undefined,
    heights: string[] | undefined
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
    const ogpTypes = getArray(result, ['rdfa', 0, 'http://ogp.me/ns#video:type'])
    const ogpWidths = getArray(result, ['rdfa', 0, 'http://ogp.me/ns#video:width'])
    const ogpHeights = getArray(result, ['rdfa', 0, 'http://ogp.me/ns#video:height'])
    const ogpSecureUrls = getArray(result, ['rdfa', 0, 'http://ogp.me/ns#video:secure_url'])

    addVideos(ogpVideos, ogpSecureUrls, ogpTypes, ogpWidths, ogpHeights)
  }

  return videos.length > 1 ? videos : videos[0]
}

/**
 * Get apps metadata.
 */
function getApps (result: HtmlResult): HtmlSnippetApps {
  return {
    iphone: getIphoneApp(result),
    ipad: getIpadApp(result),
    android: getAndroidApp(result),
    windows: getWindowsApp(result),
    windowsPhone: getWindowsPhoneApp(result)
  }
}

/**
 * Extract iPad app information from metadata.
 */
function getIpadApp (result: HtmlResult): HtmlSnippetAppLink | undefined {
  const twitterIpadUrl = getString(result, ['twitter', 'app:url:ipad'])
  const twitterIpadId = getString(result, ['twitter', 'app:id:ipad'])
  const twitterIpadName = getString(result, ['twitter', 'app:name:ipad'])

  if (twitterIpadId && twitterIpadName && twitterIpadUrl) {
    return {
      id: twitterIpadId,
      name: twitterIpadName,
      url: twitterIpadUrl
    }
  }

  const applinksIpadUrl = getString(result, ['applinks', 'ipad:url'])
  const applinksIpadId = getString(result, ['applinks', 'ipad:app_store_id'])
  const applinksIpadName = getString(result, ['applinks', 'ipad:app_name'])

  if (applinksIpadId && applinksIpadName && applinksIpadUrl) {
    return {
      id: applinksIpadId,
      name: applinksIpadName,
      url: applinksIpadUrl
    }
  }

  return getIosApp(result)
}

/**
 * Extract iPhone app information from metadata.
 */
function getIphoneApp (result: HtmlResult): HtmlSnippetAppLink | undefined {
  const twitterIphoneUrl = getString(result, ['twitter', 'app:url:iphone'])
  const twitterIphoneId = getString(result, ['twitter', 'app:id:iphone'])
  const twitterIphoneName = getString(result, ['twitter', 'app:name:iphone'])

  if (twitterIphoneId && twitterIphoneName && twitterIphoneUrl) {
    return {
      id: twitterIphoneId,
      name: twitterIphoneName,
      url: twitterIphoneUrl
    }
  }

  const applinksIphoneUrl = getString(result, ['applinks', 'iphone:url'])
  const applinksIphoneId = getString(result, ['applinks', 'iphone:app_store_id'])
  const applinksIphoneName = getString(result, ['applinks', 'iphone:app_name'])

  if (applinksIphoneId && applinksIphoneName && applinksIphoneUrl) {
    return {
      id: applinksIphoneId,
      name: applinksIphoneName,
      url: applinksIphoneUrl
    }
  }

  return getIosApp(result)
}

/**
 * Extract the iOS app metadata.
 */
function getIosApp (result: HtmlResult): HtmlSnippetAppLink | undefined {
  const applinksUrl = getString(result, ['applinks', 'ios:url'])
  const applinksId = getString(result, ['applinks', 'ios:app_store_id'])
  const applinksName = getString(result, ['applinks', 'ios:app_name'])

  if (applinksId && applinksName && applinksUrl) {
    return {
      id: applinksId,
      name: applinksName,
      url: applinksUrl
    }
  }

  return
}

/**
 * Extract Android app metadata.
 */
function getAndroidApp (result: HtmlResult): HtmlSnippetAppLink | undefined {
  const twitterAndroidUrl = getString(result, ['twitter', 'app:url:googleplay'])
  const twitterAndroidId = getString(result, ['twitter', 'app:id:googleplay'])
  const twitterAndroidName = getString(result, ['twitter', 'app:name:googleplay'])

  if (twitterAndroidId && twitterAndroidName && twitterAndroidUrl) {
    return {
      id: twitterAndroidId,
      name: twitterAndroidName,
      url: twitterAndroidUrl
    }
  }

  const applinksAndroidUrl = getString(result, ['applinks', 'android:url'])
  const applinksAndroidId = getString(result, ['applinks', 'android:package'])
  const applinksAndroidName = getString(result, ['applinks', 'android:app_name'])

  if (applinksAndroidId && applinksAndroidName && applinksAndroidUrl) {
    return {
      id: applinksAndroidId,
      name: applinksAndroidName,
      url: applinksAndroidUrl
    }
  }

  return
}

/**
 * Extract Windows Phone app metadata.
 */
function getWindowsPhoneApp (result: HtmlResult): HtmlSnippetAppLink | undefined {
  const applinksWindowsPhoneUrl = getString(result, ['applinks', 'windows_phone:url'])
  const applinksWindowsPhoneId = getString(result, ['applinks', 'windows_phone:app_id'])
  const applinksWindowsPhoneName = getString(result, ['applinks', 'windows_phone:app_name'])

  if (applinksWindowsPhoneId && applinksWindowsPhoneName && applinksWindowsPhoneUrl) {
    return {
      id: applinksWindowsPhoneId,
      name: applinksWindowsPhoneName,
      url: applinksWindowsPhoneUrl
    }
  }

  return getWindowsUniversalApp(result)
}

/**
 * Extract Windows app metadata.
 */
function getWindowsApp (result: HtmlResult): HtmlSnippetAppLink | undefined {
  const applinksWindowsUrl = getString(result, ['applinks', 'windows:url'])
  const applinksWindowsId = getString(result, ['applinks', 'windows:app_id'])
  const applinksWindowsName = getString(result, ['applinks', 'windows:app_name'])

  if (applinksWindowsId && applinksWindowsName && applinksWindowsUrl) {
    return {
      id: applinksWindowsId,
      name: applinksWindowsName,
      url: applinksWindowsUrl
    }
  }

  return getWindowsUniversalApp(result)
}

/**
 * Extract Windows Universal app metadata.
 */
function getWindowsUniversalApp (result: HtmlResult): HtmlSnippetAppLink | undefined {
  const applinksWindowsUniversalUrl = getString(result, ['applinks', 'windows_universal:url'])
  const applinksWindowsUniversalId = getString(result, ['applinks', 'windows_universal:app_id'])
  const applinksWindowsUniversalName = getString(result, ['applinks', 'windows_universal:app_name'])

  if (applinksWindowsUniversalId && applinksWindowsUniversalName && applinksWindowsUniversalUrl) {
    return {
      id: applinksWindowsUniversalId,
      name: applinksWindowsUniversalName,
      url: applinksWindowsUniversalUrl
    }
  }

  return
}

/**
 * Get locale data.
 */
function getLocale (result: HtmlResult): HtmlSnippetLocale | undefined {
  const primary = getString(result, ['rdfa', 0, 'http://ogp.me/ns#locale'])
  const alternate = getArray(result, ['rdfa', 0, 'http://ogp.me/ns#locale:alternate'])

  if (primary || alternate) {
    return { primary, alternate }
  }

  return
}

/**
 * Get twitter data.
 */
function getTwitter (result: HtmlResult): HtmlSnippetTwitter | undefined {
  const creatorId = getString(result, ['twitter', 'creator:id'])
  const creatorHandle = getTwitterHandle(result, ['twitter', 'creator'])
  const siteId = getString(result, ['twitter', 'site:id'])
  const siteHandle = getTwitterHandle(result, ['twitter', 'site'])

  if (siteId || siteHandle || creatorId || creatorHandle) {
    return {
      siteId,
      siteHandle,
      creatorId,
      creatorHandle
    }
  }

  return
}

/**
 * Extract/normalize the twitter handle.
 */
function getTwitterHandle (result: HtmlResult, path: Path) {
  const value = getString(result, path)

  if (value) {
    // Normalize twitter handles.
    return value.replace(/^@/, '')
  }

  return
}

/**
 * Get the TTL of the page.
 */
function getTtl (result: HtmlResult): number | undefined {
  return getNumber(result, ['rdfa', 0, 'http://ogp.me/ns#ttl']) ||
    getNumber(result, ['oembed', 'cache_age'])
}

/**
 * Get the object determiner.
 */
function getDeterminer (result: HtmlResult): string | undefined {
  return getString(result, ['rdfa', 0, 'http://ogp.me/ns#determiner'])
}

/**
 * Retrieve a URL for embedding an interactive widget.
 */
function getPlayer (result: HtmlResult): HtmlSnippetPlayer | undefined {
  const isPlayer = getString(result, ['twitter', 'card']) === 'player'

  if (!isPlayer) {
    return
  }

  const url = getString(result, ['twitter', 'player'])
  const width = getNumber(result, ['twitter', 'player:width'])
  const height = getNumber(result, ['twitter', 'player:height'])
  const streamUrl = getString(result, ['twitter', 'player:stream'])
  const streamContentType = getString(result, ['twitter', 'player:stream:content_type'])

  if (url && width && height) {
    return {
      url,
      width,
      height,
      streamUrl,
      streamContentType
    }
  }

  return
}

/**
 * Retrieve the selected snippet icon.
 */
function getIcon (result: HtmlResult, options: ExtractOptions): HtmlSnippetIcon | undefined {
  const preferredSize = Number(options.preferredIconSize) || 32
  let selectedSize: number | undefined
  let selectedIcon: HtmlSnippetIcon | undefined

  for (const icon of result.icons) {
    if (selectedSize == null) {
      selectedIcon = icon
    }

    if (icon.sizes) {
      const size = parseInt(icon.sizes, 10) // "32x32" -> "32".

      if (selectedSize == null) {
        selectedIcon = icon
        selectedSize = size
      } else {
        if (Math.abs(preferredSize - size) < Math.abs(selectedSize - size)) {
          selectedIcon = icon
          selectedSize = size
        }
      }
    } else {
      selectedIcon = selectedIcon || icon
    }
  }

  return selectedIcon
}

/**
 * Extract HTML page content types.
 */
function getEntity (result: HtmlResult): Entity | undefined {
  const twitterType = getString(result, ['twitter', 'card'])
  const ogpType = getString(result, ['rdfa', 0, 'http://ogp.me/ns#type'])
  const oembedType = getString(result, ['oembed', 'type'])

  if (ogpType === 'article') {
    return {
      type: 'article',
      section: getString(result, ['rdfa', 0, 'http://ogp.me/ns/article#section']),
      publisher: getString(result, ['rdfa', 0, 'http://ogp.me/ns/article#publisher']),
      datePublished: getDate(result, ['rdfa', 0, 'http://ogp.me/ns/article#published_time']),
      dateExpires: getDate(result, ['rdfa', 0, 'http://ogp.me/ns/article#expiration_time']),
      dateModified: getDate(result, ['rdfa', 0, 'http://ogp.me/ns/article#modified_time'])
    }
  }

  if (oembedType === 'video') {
    return {
      type: 'video',
      html: getString(result, ['oembed', 'html']),
      width: getNumber(result, ['oembed', 'width']),
      height: getNumber(result, ['oembed', 'height'])
    }
  }

  if (oembedType === 'rich') {
    return {
      type: 'rich',
      html: getString(result, ['oembed', 'html']),
      width: getNumber(result, ['oembed', 'width']),
      height: getNumber(result, ['oembed', 'height'])
    }
  }

  if (
    twitterType === 'summary_large_image' ||
    twitterType === 'photo' ||
    twitterType === 'gallery' ||
    oembedType === 'photo'
  ) {
    return {
      type: 'image',
      url: getString(result, ['oembed', 'url']),
      width: getNumber(result, ['oembed', 'width']),
      height: getNumber(result, ['oembed', 'height'])
    }
  }

  return
}
