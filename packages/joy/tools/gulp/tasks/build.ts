import * as gulp from "gulp";
import { createProject } from "gulp-typescript";
import * as sourcemaps from "gulp-sourcemaps";
import * as log from "fancy-log";
import * as merge2 from "merge2";
import { Simulate } from "react-dom/test-utils";
import copy = Simulate.copy;
const { exec } = require("child_process");

const DIST_DIR = "dist";

// ts project
const tsProject = createProject("tsconfig.json", { emitDeclarationOnly: true });

/**
 * Watches the packages/* folder and
 * builds the package on file change
 */
function defaultTask() {
  log.info("Watching files..");
  gulp.watch(
    [`src/**/*.{ts,tsx,js,jsx}`],
    { ignoreInitial: false },
    gulp.series("build")
  );
}

/**
 * Builds the src
 */
function buildPackage() {
  const tsResult = tsProject.src().pipe(tsProject());

  return merge2(
    tsResult.dts.pipe(gulp.dest(DIST_DIR)), // fixme gulp-typescript（v6.0.1-alpha）有bug，不能输出d.ts文件。
    tsResult.js.pipe(gulp.dest(DIST_DIR))
  );
}

function tsc() {
  return exec("tsc -d -p tsconfig.json");
}

function copyAsset() {
  return gulp.src([`src/**/*.{handlebars,json}`]).pipe(gulp.dest(DIST_DIR));
}

/**
 * Builds the src and adds sourcemaps
 */
function buildPackageDev() {
  return tsProject
    .src()
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(
      sourcemaps.mapSources(
        (sourcePath: string) => "./" + sourcePath.split("/").pop()
      )
    )
    .pipe(sourcemaps.write(".", {}))
    .pipe(gulp.dest(DIST_DIR));
}

// task('common:dev', series(modules.map(packageName => `${packageName}:dev`)));
// glup.task('build', buildPackage);
gulp.task("build", gulp.series([tsc, copyAsset]));
gulp.task("build:dev", () => buildPackageDev());
gulp.task("watch", defaultTask);
