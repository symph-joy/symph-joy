import curry from "lodash.curry";
import { Configuration, RuleSetRule, WebpackPluginInstance } from "webpack";

export const loader = curry(function loader(
  rule: RuleSetRule,
  config: Configuration
) {
  if (!config.module) {
    config.module = { rules: [] };
  }

  if (rule.oneOf) {
    const existing = config.module.rules!.find(
      (arrayRule) => (arrayRule as RuleSetRule).oneOf
    );
    if (existing) {
      (existing as RuleSetRule).oneOf!.push(...rule.oneOf);
      return config;
    }
  }

  config.module.rules!.push(rule);
  return config;
});

export const unshiftLoader = curry(function unshiftLoader(
  rule: RuleSetRule,
  config: Configuration
) {
  if (!config.module) {
    config.module = { rules: [] };
  }

  if (rule.oneOf) {
    const existing = config.module.rules!.find(
      (arrayRule) => (arrayRule as RuleSetRule).oneOf
    );
    if (existing) {
      (existing as RuleSetRule).oneOf!.unshift(...rule.oneOf);
      return config;
    }
  }

  config.module.rules!.unshift(rule);
  return config;
});

export const plugin = curry(function plugin(
  p: WebpackPluginInstance,
  config: Configuration
) {
  if (!config.plugins) {
    config.plugins = [];
  }
  config.plugins.push(p);
  return config;
});
