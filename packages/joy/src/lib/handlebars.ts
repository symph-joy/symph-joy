import handlebars from "handlebars";

handlebars.registerHelper("json", function (strPath) {
  return new handlebars.SafeString(JSON.stringify(strPath));
});

handlebars.registerHelper("jsonProps", function (obj, ...subProps) {
  let subObj = undefined;
  if (subProps && subProps.length > 1) {
    subObj = {} as any;
    for (let i = 0; i < subProps.length - 1; i++) {
      const prop = subProps[i];
      subObj[prop] = obj[prop];
    }
  } else {
    subObj = { ...obj };
  }
  const strSubObj = JSON.stringify(subObj).slice(1, -1);
  return new handlebars.SafeString(strSubObj);
});

export { handlebars };
