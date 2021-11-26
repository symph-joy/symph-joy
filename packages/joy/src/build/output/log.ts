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
  return `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()} `;
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
