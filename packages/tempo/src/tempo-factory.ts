import { Logger } from "./services";
import { IJoyContext, JoyApplicationOptions, Type } from "./interfaces";
import { isNil } from "./utils/shared.utils";
import { ApplicationConfig } from "./react/application-config";
import { JoyContainer } from "./injector";
import { MESSAGES } from "./constants";
import { ReactApplicationContext } from "./react/react-application-context";
import { JoyContextOptions } from "./interfaces/joy-context-options.interface";
import { TempoContext } from "./tempo-context";

export class TempoFactoryImplement {
  private readonly logger = new Logger("JoyFactory", true);

  public async create(
    entry: Record<string, unknown> | Type = {},
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

  public async createApplicationContext(
    entry: Record<string, unknown> | Type = {},
    options?: JoyContextOptions
  ): Promise<IJoyContext> {
    this.applyLogger(options);
    const container = new JoyContainer();
    const applicationContext = new TempoContext(entry, container);
    return this.initContext(applicationContext);
  }

  private async initContext<T extends IJoyContext>(context: T): Promise<T> {
    this.logger.log(MESSAGES.APPLICATION_START);
    try {
      await context.init();
    } catch (e) {
      this.logger.error("start error", e.stack);
      process.abort();
    }
    return context;
  }

  private applyLogger(options: JoyContextOptions | undefined) {
    if (!options) {
      return;
    }
    !isNil(options.logger) && Logger.overrideLogger(options.logger);
  }
}

export const TempoFactory = new TempoFactoryImplement();
