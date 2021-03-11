import {source} from '../config';
import {dest, series, src, task} from 'gulp';
import {tsPackageConfigs} from "./modules";
import * as path from "path";

const moduleNames = Object.keys(tsPackageConfigs)

const distId = process.argv.indexOf('--dist');
const dist = distId < 0 ? source : process.argv[distId + 1];

/**
 * Copy package meta file to dist dirs
 * @param packageName The name of the package
 */
function copyPackageInfo(packageName: string, done) {
  const copyFiles = ['package.json', 'bin/*'].map(item => `${source}/${packageName}/${item}`)
  const build_dir = `${dist}/${packageName}`
  const rootPath = `${source}/${packageName}`
  moduleNames.forEach((module)=>{
   // src(copyFiles).pipe(dest(`${dist}/${packageName}`))
   src(copyFiles).pipe(
     dest(function (file) {
       console.log(path.dirname(file.path))
       const folders = path.dirname(file.path).split('/')
       const folder = folders[folders.length - 1]

       return folder === rootPath ? build_dir : path.join(build_dir, folder)
     }))
    done()
  });
}

moduleNames.forEach(packageName => {
  task(`copy-package:${packageName}`, (done) => copyPackageInfo(packageName, done))
});

task('copy-package', series(moduleNames.map(packageName => `copy-package:${packageName}`)));
