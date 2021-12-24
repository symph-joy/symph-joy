import { useContext } from "react";
import { ReactApplicationReactContext } from "./react-app-container";
import { IReactApplication } from "./interfaces";

export function useJoyContext(): IReactApplication {
  const context = useContext(ReactApplicationReactContext);
  if (context === undefined) {
    throw new Error("Missing JoyReactContext in the react tree");
  }
  return context;
}
