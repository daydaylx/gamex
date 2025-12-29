import { render } from "preact";
import { App } from "./App";
import "./index.css";
import { initPerformanceMonitoring } from "./services/performance";

function updateDeviceClass() {
  const minScreen = Math.min(window.screen.width, window.screen.height);
  const isPhone = minScreen <= 500;
  document.documentElement.dataset.device = isPhone ? "phone" : "desktop";
}

updateDeviceClass();
window.addEventListener("resize", updateDeviceClass);
window.addEventListener("orientationchange", updateDeviceClass);

// Initialize performance monitoring (Web Vitals)
initPerformanceMonitoring();

// Initialize app
const appElement = document.getElementById("app");
if (appElement) {
  render(<App />, appElement);
} else {
  console.error("App root element not found");
}
