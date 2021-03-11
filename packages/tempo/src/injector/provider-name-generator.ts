export function providerNameGenerate(clazz: { (...args): unknown }): string {
  let name = clazz.name;
  name = name.replace(name[0], name[0].toLowerCase());
  return name;
}
