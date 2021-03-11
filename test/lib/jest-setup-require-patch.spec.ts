import "reflect-metadata";
import * as path from "path";
import fs from 'fs'

describe("jest require ", () => {
  test("should load new data, when file changed", async () => {
    const filePath ='./_require-data.json'
    const absPath = path.resolve(__dirname, filePath)
    const originData = {
      a: 'aaa'
    }
    fs.writeFileSync(absPath, JSON.stringify(originData), {encoding: 'utf-8'})
    const requireData = require(filePath)
    expect(requireData.a).toBe('aaa')

    const changedData = {
      ...originData,
      b: 'bbb'
    }
    jest.resetModules()
    delete require.cache[absPath]
    fs.writeFileSync(absPath, JSON.stringify(changedData), {encoding: 'utf-8'})

    const requireChangedData = require(filePath)
    expect(requireChangedData.a).toBe('aaa')
    expect(requireChangedData.b).toBe('bbb')
    fs.unlinkSync(absPath)
  });

});


