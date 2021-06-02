import initJoy, * as joy from "./";

window.joy = joy;

initJoy().catch(console.error);
