import { Readable } from "stream";

export interface Page {
  url: string;
  status: number;
  headers: Record<string, string | string[]>;
  body: Readable;
}

export type Scrape = (page: Page) => Promise<Snippet>;
export type ScrapeUrl = (url: string) => Promise<Snippet>;

export interface RequestOptions {
  headers?: Record<string, string>;
}

export type Request = (url: string, options?: RequestOptions) => Promise<Page>;

export interface Input {
  page: Page;
  request: Request;
  scrape: Scrape;
}

export type Next = (input: Input) => Promise<Snippet>;
export type Plugin = (input: Input, next: Next) => Promise<Snippet>;

export interface BaseSnippet {
  type?: string;
  url: string;
  secureUrl?: string;
  canonicalUrl?: string;
  encodingFormat?: string;
}

export interface SnippetAppLink {
  id: string;
  name: string;
  url: string;
}

export interface SnippetLocale {
  primary?: string;
  alternate?: string[];
}

export interface SnippetTwitter {
  siteId?: string;
  siteHandle?: string;
  creatorId?: string;
  creatorHandle?: string;
}

export interface SnippetApps {
  iphone?: SnippetAppLink;
  ipad?: SnippetAppLink;
  android?: SnippetAppLink;
  windows?: SnippetAppLink;
  windowsPhone?: SnippetAppLink;
}

export interface ArticleEntity {
  type: "article";
  section?: string;
  publisher?: string;
  dateModified?: Date;
  datePublished?: Date;
  dateExpires?: Date;
}

export interface ImageEntity {
  type: "image";
  url?: string;
  width?: number;
  height?: number;
}

export interface VideoEntity {
  type: "video";
  html?: string;
  width?: number;
  height?: number;
}

export interface RichEntity {
  type: "rich";
  html?: string;
  width?: number;
  height?: number;
}

export type Entity = ArticleEntity | VideoEntity | ImageEntity | RichEntity;

export interface HtmlSnippet extends BaseSnippet {
  type: "html";
  entity?: Entity;
  image?: ImageSnippet[];
  video?: VideoSnippet[];
  audio?: AudioSnippet[];
  headline?: string;
  description?: string;
  tags?: string[];
  author?: {
    url?: string;
    name?: string;
  };
  provider?: {
    url?: string;
    name?: string;
  };
  ttl?: number;
  icon?: ImageSnippet;
  locale?: SnippetLocale;
  twitter?: SnippetTwitter;
  apps?: SnippetApps;
}

export interface AudioSnippet extends BaseSnippet {
  type: "audio";
}

export interface VideoSnippet extends BaseSnippet {
  type: "video";
  width?: number;
  height?: number;
}

export interface ImageSnippet extends BaseSnippet {
  type: "image";
  caption?: string;
  dateModified?: Date;
  dateCreated?: Date;
  width?: number;
  height?: number;
  make?: string;
  model?: string;
  lensMake?: string;
  lensModel?: string;
  software?: string;
  orientation?: string;
  megapixels?: number;
}

export interface PdfSnippet extends BaseSnippet {
  type: "pdf";
  author?: string;
  headline?: string;
  pageCount?: number;
  producer?: string;
  creator?: string;
  dateCreated?: Date;
  dateModified?: Date;
}

export interface UnknownSnippet extends BaseSnippet {
  type: "unknown";
}

export type Snippet =
  | UnknownSnippet
  | PdfSnippet
  | VideoSnippet
  | ImageSnippet
  | HtmlSnippet;