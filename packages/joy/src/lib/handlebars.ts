import handlebars from "handlebars";

handlebars.registerHelper('json', function (strPath) {
  return new handlebars.SafeString(JSON.stringify(strPath))
})

export {handlebars}
