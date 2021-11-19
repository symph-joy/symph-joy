import { Logger } from "./services/logger.service";
import { EntryType, ICoreContext, Type } from "./interfaces";
import { isNil } from "./utils/shared.utils";
import { CoreContainer } from "./injector";
import { MESSAGES } from "./constants";
import { JoyContextOptions } from "./interfaces/joy-context-options.interface";
import { CoreContext } from "./core-context";

export class CoreFactoryImplement {
  private readonly logger = new Logger("JoyFactory", true);

  public async createApplicationContext(entry: EntryType | EntryType[], options?: JoyContextOptions): Promise<ICoreContext> {
    this.applyLogger(options);
    const container = new CoreContainer();
    const applicationContext = new CoreContext(entry);
    return this.initContext(applicationContext);
  }

  protected async initContext<T extends ICoreContext>(context: T): Promise<T> {
    this.logger.log(MESSAGES.APPLICATION_START);
    try {
      await context.init();
    } catch (e) {
      this.logger.error("Init context error:", e.message);
      // process.abort();
      throw e;
    }
    return context;
  }

  protected applyLogger(options: JoyContextOptions | undefined): void {
    if (!options) {
      return;
    }
    !isNil(options.logger) && Logger.overrideLogger(options.logger);
  }
}

export const CoreContextFactory = new CoreFactoryImplement();
