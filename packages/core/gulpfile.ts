"use strict";
const { dest, series, task, watch } = require("gulp");
const { createProject } = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const log = require("fancy-log");

const tsProject = createProject("./tsconfig.json");

/**
 * Watches the packages/* folder and
 * builds the package on file change
 */
function watchSrc() {
  log.info("Watching files..");
  watch(
    [`/src/**/*.ts`, `/src/*.js`],
    { ignoreInitial: false },
    series("buildSrc")
  );
}

function buildSrc() {
  return tsProject.src().pipe(tsProject()).pipe(dest(`/dist-glup`));
}

/**
 * Builds the given package and adds sourcemaps
 * @param packageName The name of the package
 */
function buildSrcDev(packageName: string) {
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
    .pipe(dest(`/dist`));
}

task("build", buildSrc);
task("build:dev", buildSrcDev);
task("watch", watchSrc);
