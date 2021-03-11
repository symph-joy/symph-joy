import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { ApplicationConfig, ReactApplicationContext } from "@symph/tempo";
import { CalculateController } from "./controllers/CalculateController";

const app = new ReactApplicationContext({}, new ApplicationConfig());

function App() {
  const [{ hasInit, AppComponent }, setHasInit] = useState<{
    hasInit: boolean;
    AppComponent: React.ComponentType;
  }>({ hasInit: false, AppComponent: () => <div>aaa</div> });
  useEffect(() => {
    app.init().then(() => {
      setHasInit({ hasInit: true, AppComponent: app.start() });
    });
  }, []);

  if (!hasInit) {
    return <div>initializing ...</div>;
  }

  return (
    <div className="App">
      <AppComponent>
        <img src={logo} className="App-logo" alt="logo" />
        <div>
          <CalculateController />
        </div>
      </AppComponent>
    </div>
  );
}

export default App;
