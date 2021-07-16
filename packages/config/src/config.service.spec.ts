import { CoreContextFactory, Injectable } from "@symph/core";
import { ConfigValue } from "./config-value.decorator";
import { ConfigService } from "./config.service";
import { Configurable } from "./configurable.decorator";

describe("config.service", () => {
  test(`should inject config value to prop of a configurable provider`, async () => {
    @Configurable()
    @Injectable()
    class BasicConfig {
      @ConfigValue()
      public msg: string;
    }

    @Injectable()
    class CustomConfigService extends ConfigService {
      async afterPropertiesSet(): Promise<void> {
        await super.afterPropertiesSet();
        this.mergeConfig({ msg: "From afterPropertiesSet" });
      }
    }

    const context = await CoreContextFactory.createApplicationContext([
      CustomConfigService,
      BasicConfig,
    ]);
    const configService = await context.get(ConfigService);
    const basicConfig = await context.get(BasicConfig);
    expect(configService).toBeInstanceOf(CustomConfigService);
    expect(basicConfig.msg).toBe("From afterPropertiesSet");
  });
});
