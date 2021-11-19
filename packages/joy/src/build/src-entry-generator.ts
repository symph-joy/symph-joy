import {Autowire, Component, IComponentLifecycle} from "@symph/core";
import {JoyAppConfig} from "../joy-server/server/joy-app-config";
import glob from "glob";
import path from "path";
import fs from "fs";
import {FSWatcher, watch} from "chokidar";
import {EmitSrcService} from "./webpack/plugins/emit-src-plugin/emit-src-service";
import {FileScanner} from "./scanner/file-scanner";
import Watchpack from "watchpack";
import lodash from "lodash";

class AggregateChange {
  constructor(
    public add: string[] = [],
    public remove: string[] = [],
    public change: string[] = []
  ) {
  }
}

@Component()
export class SrcEntryGenerator {

  public srcDir: string

  public sourceFileExts = ['js', 'jsx', 'ts', 'tsx']

  public watcher: FSWatcher | undefined

  public srcFiles: string[] = []

  private lastChangeTimestamp = 0;
  private aggregateTimeout = 200;
  public aggregateChange: AggregateChange = new AggregateChange();

  constructor(@Autowire() private joyAppConfig: JoyAppConfig, private emitSrcService: EmitSrcService, private fileScanner: FileScanner,) {
    this.srcDir = this.joyAppConfig.resolveAppDir("src");
  }

  async getSrcFiles(isWatch = false): Promise<string[]> {
    return new Promise((resolve, reject) => {
      // this.watcher = watch([`${this.srcDir}/`], {followSymlinks: false, awaitWriteFinish: true})
      // this.watcher
      //   .on('add', (path) => {
      //     console.log('>>>> add', path)
      //   })
      //   .on('change', (path) => {
      //     console.log('>>>> change', path)
      //   })
      //   .on('ready', () => {
      //     console.log('Initial scan complete. Ready for changes')
      //   })
      //
      // if (isWatch){
      //   this.watcher.close();
      //   this.watcher = undefined;
      // }

      glob(`**/*.{${this.sourceFileExts.join(',')}}`, {cwd: this.srcDir}, async (err, files) => {
        if (err) {
          reject(err)
        }
        const sourceFiles: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const filePath = files[i];
          let fullPath = path.resolve(this.srcDir, filePath);
          fullPath = path.normalize(fullPath);
          fullPath = fullPath.replace(/\\/g, "/");
          sourceFiles.push(fullPath);
        }
        if (isWatch) {
          this.startWatch()
        }
        this.srcFiles = sourceFiles;

        resolve(sourceFiles)
      });
    })
  }

  startWatch(): void {
    // this.watcher = watch([`**/*.${this.sourceFileExts.join(',')}`], {followSymlinks: false, awaitWriteFinish:true})
    this.watcher = watch([`${this.srcDir}/`], {followSymlinks: false, awaitWriteFinish: true, ignoreInitial: true})
    // this.watcher = new Watchpack({
    //   aggregateTimeout: 1000,
    //   ignored: ["**/.git"]
    // })
    // @ts-ignore
    // this.watcher.watch({files: [], directories: [`${this.srcDir}/`], missing: listOfNotExistingItems, startTime: Date.now() - 10000})
    // this.watcher.watch({files: [], directories: [`${this.srcDir}/`], missing: listOfNotExistingItems, startTime: Date.now() - 10000})
    // this.watcher.watch([], [`${this.srcDir}/`], Date.now() - 10000)
    this.watcher.on('add', (filePath) => {
      console.log('>>>> add', filePath)
      // this.srcFiles.push(filePath)
      this.applyChange(filePath, 'add')
    })
    this.watcher.on('change', (filePath) => {
      console.log('>>>> change', filePath)
      this.applyChange(filePath, 'change')
    })
    this.watcher.on('unlink', (filePath) => {
      console.log('>>>> remove', filePath)
      // const index = this.srcFiles.indexOf(filePath)
      // if (index > 0) {
      //   this.srcFiles.splice(index, 1)
      // }
      this.applyChange(filePath, 'remove')
      this.removeDist(filePath)
    })
    this.watcher.on('ready', () => {
      console.log('Initial scan src directory complete. Ready for changes')
    })
  }

  triggerAggregatedChange = lodash.throttle(() => {
    console.log('>>>>> apply changes, this.aggregateChange', this.aggregateChange);
    const aggregateChange = this.aggregateChange;
    this.aggregateChange = new AggregateChange()
    for (const f of aggregateChange.add) {
      this.srcFiles.push(f)
    }

    for (const f of aggregateChange.remove) {
      const index = this.srcFiles.indexOf(f)
      if (index > 0) {
        this.srcFiles.splice(index, 1)
      }
    }
    console.log('>>>>> apply changes this.srcFiles:', this.srcFiles);
  }, this.aggregateTimeout, {trailing: true, leading: false} )

  applyChange(filePath: string, changeType: keyof AggregateChange) {
    const curTs = Date.now()
    this.lastChangeTimestamp = curTs
    this.aggregateChange[changeType].push(filePath)

    this.triggerAggregatedChange()
  }

  private removeDist(srcPath: string) {
    const emitInfo = this.emitSrcService.getEmitInfoBySrc(srcPath)
    if (emitInfo) {
      const distPath = emitInfo.dest;
      if (fs.existsSync(distPath)) {
        fs.rmSync(distPath)
      }
    }
  }

}
