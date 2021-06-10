export function getDomInnerHtml(
  html: string,
  id: string,
  domType = "div"
): string | undefined {
  if (!html) {
    return undefined;
  }
  const regDiv = new RegExp(
    `<${domType} [\\s\\S]*?id=['"]${id}['"][\\s\\S]*?>([\\s\\S]*?)</${domType}>`
  );
  const matched = html.match(regDiv);
  if (matched) {
    return matched[1];
  }
  return undefined;
}
