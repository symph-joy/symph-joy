import initJoy, * as joy from "./index";

window.joy = joy;

initJoy().catch((err) => {
  console.error(`${err.message}\n${err.stack}`);
});
