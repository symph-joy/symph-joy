import cheerio from "cheerio";

export function getDomInnerHtml(html: string, domQuery: string): string | null | undefined {
  if (!html) {
    return undefined;
  }
  const $ = cheerio.load(html);
  return $(domQuery).html();
}
