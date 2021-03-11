import React, {Component, ReactNode} from 'react'
import {Controller, ReactController, Route} from "@symph/react";
import {string} from "prop-types";
import {Inject} from "@symph/core";

@Route({path: '/'})
@Controller()
export default class HelloController extends ReactController {

  renderView(): ReactNode {
    return (
      <div>hello word</div>
    );
  }
}
