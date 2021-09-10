import * as gulp from "gulp";
import { createProject } from "gulp-typescript";
import * as sourcemaps from "gulp-sourcemaps";
import * as log from "fancy-log";
import * as merge2 from "merge2";
import { Simulate } from "react-dom/test-utils";
import copy = Simulate.copy;
import { ExecException } from "child_process";
const { spawn, exec } = require("child_process");

const DIST_DIR = "dist";

// ts project
const tsProject = createProject("tsconfig.json", {
  declaration: true,
  declarationFiles: true,
});

function watchAsset() {
  log.info("Watching asset files..");
  gulp.watch([`src/**/*.{handlebars,json}`], { ignoreInitial: false }, gulp.series([copyAsset]));
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
  const childProcess = exec("tsc -d -p tsconfig.json");
  childProcess.stdout?.on("data", (chunk) => {
    console.log(chunk);
  });
  childProcess.stderr?.on("data", (chunk) => {
    console.error(chunk);
  });
  return childProcess;
}

function watchTsc() {
  const childProcess = exec("tsc -d -w -p tsconfig.json --sourceMap");
  childProcess.stdout?.on("data", (chunk) => {
    console.log(chunk);
  });
  childProcess.stderr?.on("data", (chunk) => {
    console.error(chunk);
  });
  return childProcess;
}

function copyAsset() {
  return gulp.src([`src/**/*.{handlebars,json}`]).pipe(gulp.dest(DIST_DIR));
}

// gulp.task('build', buildPackage);
gulp.task("build", gulp.series([tsc, copyAsset]));
gulp.task("watch", gulp.parallel([watchTsc, watchAsset]));
// gulp.task("watch", watch);
