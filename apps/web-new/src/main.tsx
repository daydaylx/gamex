import { render } from "preact";
import { App } from "./App";
import "./index.css";
import { initPerformanceMonitoring } from "./services/performance";

// Initialize performance monitoring (Web Vitals)
initPerformanceMonitoring();

// Initialize app
render(<App />, document.getElementById("app")!);

