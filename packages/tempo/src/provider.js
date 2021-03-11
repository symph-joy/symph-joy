import React, { Component, createContext } from "react";
import PropTypes from "prop-types";
import { Provider as ReduxProvider } from "react-redux";

const TempoContext = createContext(null);

class Provider extends Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
  };

  static childContextTypes = {
    tempo: PropTypes.object,
  };

  getChildContext() {
    const { app } = this.props;
    return {
      tempo: app,
    };
  }

  render() {
    const { app, children } = this.props;
    return (
      <TempoContext.Provider value={app}>
        <ReduxProvider store={app._store}>{children}</ReduxProvider>
      </TempoContext.Provider>
    );
  }
}

export default Provider;
export { Provider, TempoContext };
