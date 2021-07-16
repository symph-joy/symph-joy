export async function readConfigFile(
  filePath: string
): Promise<Record<string, any>> {
  let config = require(filePath);
  config = config.default || config;
  if (Object.keys(config).length === 0) {
    console.warn(
      "Detected joy.config.js, no exported configuration found. #empty-configuration"
    );
  }
  return config;
}
