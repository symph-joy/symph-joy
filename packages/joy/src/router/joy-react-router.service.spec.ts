import {handlebars} from "../lib/handlebars";


describe("joy-react-router.service", () => {
  test("onGenerateFiles, handle with windows path", async () => {
    const temp = handlebars.compile('{{json winPath}}');
    const data  ={
      winPath: 'C:\\a\\.b'
    }
    const str = temp(data)
    console.log(str)
    expect(str).toBe('"C:\\\\a\\\\.b"')
  });
});
