import chalk from "chalk";

export const prefixes = {
  wait: chalk.cyan("wait") + "  -",
  error: chalk.red("error") + " -",
  warn: chalk.yellow("warn") + "  -",
  ready: chalk.green("ready") + " -",
  info: chalk.cyan("info") + "  -",
  event: chalk.magenta("event") + " -",
  trace: chalk.magenta("trace") + " -",
};

function getCurDateTime(): string {
  const date = new Date();
  return formDate(date);
}

function formDate(date: Date, fmt = "yyyy-MM-dd HH:mm:ss.SSS"): string {
  const o = {
    "M+": date.getMonth() + 1, //月份
    "d+": date.getDate(), //日
    "H+": date.getHours(), //小时
    "m+": date.getMinutes(), //分
    "s+": date.getSeconds(), //秒
    "q+": Math.floor((date.getMonth() + 3) / 3), //季度
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (const k in o) {
    const v = (o as any)[k];
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? v : ("00" + v).substr(("" + v).length));
  }
  if (/(S+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, ("000" + date.getMilliseconds()).slice(-RegExp.$1.length));

  return fmt;
}

export function wait(...message: string[]) {
  console.log(getCurDateTime(), prefixes.wait, ...message);
}

export function error(...message: string[]) {
  console.error(getCurDateTime(), prefixes.error, ...message);
}

export function warn(...message: string[]) {
  console.warn(getCurDateTime(), prefixes.warn, ...message);
}

export function ready(...message: string[]) {
  console.log(getCurDateTime(), prefixes.ready, ...message);
}

export function info(...message: string[]) {
  console.log(getCurDateTime(), prefixes.info, ...message);
}

export function event(...message: string[]) {
  console.log(getCurDateTime(), prefixes.event, ...message);
}

export function trace(...message: string[]) {
  console.log(prefixes.trace, ...message);
}
