import {source} from '../config';
import {dest, series, task, watch} from 'gulp';
import {createProject} from 'gulp-typescript';
import * as sourcemaps from 'gulp-sourcemaps';
import * as log from 'fancy-log';
import {tsPackageConfigs} from './modules'

// Has to be a hardcoded object due to build order
const tsPackages = Object.keys(tsPackageConfigs).reduce((preVal, key) => {
  preVal[key] = createProject(tsPackageConfigs[key])
  return preVal
}, {})

const modules = Object.keys(tsPackages);

const distId = process.argv.indexOf('--dist');
const dist = distId < 0 ? source : process.argv[distId + 1];
console.log('>>>> dist', dist)

/**
 * Watches the packages/* folder and
 * builds the package on file change
 */
function defaultTask() {
  log.info('Watching files..');
  modules.forEach(packageName => {
    watch(
      [`${source}/${packageName}/src/**/*.ts`, `${source}/${packageName}/src/*.ts`],
      {ignoreInitial: false},
      series(packageName),
    );
  });
}

/**
 * Builds the given package
 * @param packageName The name of the package
 */
function buildPackage(packageName: string) {
  const tsPackage =tsPackages[packageName]
  return tsPackage
    .src()
    .pipe(tsPackage())
    .pipe(dest(`${dist}/${packageName}/dist`));
}

/**
 * Builds the given package and adds sourcemaps
 * @param packageName The name of the package
 */
function buildPackageDev(packageName: string) {
  return tsPackages[packageName]
    .src()
    .pipe(sourcemaps.init())
    .pipe(tsPackages[packageName]())
    .pipe(
      sourcemaps.mapSources(
        (sourcePath: string) => './' + sourcePath.split('/').pop(),
      ),
    )
    .pipe(sourcemaps.write('.', {}))
    .pipe(dest(`${dist}/${packageName}/dist`));
}

modules.forEach(packageName => {
  task(packageName, () => buildPackage(packageName));
  task(`${packageName}:dev`, () => buildPackageDev(packageName));
});

task('common:dev', series(modules.map(packageName => `${packageName}:dev`)));
task('build', series(modules));
task('build:dev', series('common:dev'))
task('watch', defaultTask);
