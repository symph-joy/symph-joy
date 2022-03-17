import * as gulp from "gulp";
import { createProject } from "gulp-typescript";
import * as sourcemaps from "gulp-sourcemaps";
import * as log from "fancy-log";
import * as merge2 from "merge2";
import * as babel from "gulp-babel";
import { resolve } from "path";
const sourcemaps = require("gulp-sourcemaps");
const { spawn, exec } = require("child_process");

const DIST_DIR = "dist";

// ts project
const tsProject = createProject("tsconfig.json", {
  declaration: true,
  declarationFiles: true,
});

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
  const childProcess = exec("tsc -d -p tsconfig.json", { cwd: resolve(__dirname, "../../../") });
  childProcess.stdout?.on("data", (chunk) => {
    console.log(chunk);
  });
  childProcess.stderr?.on("data", (chunk) => {
    console.error(chunk);
  });
  return childProcess;
}

function watchTsc() {
  const childProcess = exec("tsc -d -w -p tsconfig.json --sourceMap", { cwd: resolve(__dirname, "../../../") });
  childProcess.stdout?.on("data", (chunk) => {
    console.log(chunk);
  });
  childProcess.stderr?.on("data", (chunk) => {
    console.error(chunk);
  });
  return childProcess;
}
// return gulp.src([`src/**/*.{handlebars,json}`, "src/**/server/dev/*.*"]).pipe(gulp.dest(DIST_DIR));
const assetSrc = [`src/**/*.{handlebars,json,d.ts}`];
function copyAsset() {
  return gulp.src(assetSrc).pipe(gulp.dest(DIST_DIR));
}

function buildJS() {
  return gulp
    .src("src/**/*.js")
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("dist"));
}

function watchJS() {
  log.info("Watching js files..");
  gulp.watch([`src/**/*.{js,jsx}`], { ignoreInitial: false }, gulp.series([buildJS]));
}

function watchAsset() {
  log.info("Watching asset files..");
  gulp.watch(assetSrc, { ignoreInitial: false }, gulp.series([copyAsset]));
}

gulp.task("build", gulp.series([buildJS, tsc, copyAsset]));
gulp.task("watch", gulp.parallel([watchJS, watchTsc, watchAsset]));
