import { JoyApplicationOptions } from "./interfaces";
import { JoyContainer, CoreFactoryImplement, Type } from "@symph/core";
import { ReactApplicationConfig } from "./react-application-config";
import { ReactApplicationContext } from "./react-application-context";
import { ApplicationConfig } from "./application-config";

export class ReactApplicationFactoryImplement extends CoreFactoryImplement {
  public async create(
    entry: Record<string, unknown> | Type = ReactApplicationConfig,
    options?: JoyApplicationOptions
  ): Promise<ReactApplicationContext> {
    this.applyLogger(options);
    const applicationConfig = new ApplicationConfig();
    const container = new JoyContainer();
    const application = new ReactApplicationContext(
      entry,
      applicationConfig,
      container
    );
    return this.initContext(application);
  }
}

export const ReactApplicationFactory = new ReactApplicationFactoryImplement();
