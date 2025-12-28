import { render } from "preact";
import { App } from "./App";
import "./index.css";
import { initPerformanceMonitoring } from "./services/performance";

// Initialize performance monitoring (Web Vitals)
initPerformanceMonitoring();

// Initialize app
const appElement = document.getElementById("app");
if (appElement) {
  render(<App />, appElement);
} else {
  console.error("App root element not found");
}
