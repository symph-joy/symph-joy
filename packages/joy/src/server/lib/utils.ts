export class ProcessError extends Error {
  constructor(public code: number, public message: string) {
    super(message);
    this.name = "process.exist";
  }

  toString() {
    return `${this.name}, code: ${this.code},  message: ${this.message}`;
  }
}

export function printAndExit(message: string, code = 1) {
  if (code === 0) {
    message && console.log(message);
  } else {
    message && console.error(message);
  }
  if (process.env.NODE_ENV === "test") {
    // for jest test
    if (code !== 0) {
      throw new ProcessError(code, message);
    } else {
      //noop
      return;
    }
  }
  process.exit(code);
}

export function getNodeOptionsWithoutInspect() {
  const NODE_INSPECT_RE = /--inspect(-brk)?(=\S+)?( |$)/;
  return (process.env.NODE_OPTIONS || "").replace(NODE_INSPECT_RE, "");
}
