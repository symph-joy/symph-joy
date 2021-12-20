// eslint-disable-next-line @typescript-eslint/ban-types

export function componentNameGenerate(clazz: unknown): string {
  if (typeof clazz === "function") {
    let name = clazz.name;
    name = name.replace(name[0], name[0].toLowerCase());
    return name;
  } else {
    return "" + clazz;
  }
}
