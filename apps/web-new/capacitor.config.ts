import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.intimacytool.app",
  appName: "Intimacy Tool",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    cleartext: true,
  },
  android: {
    // Portrait only for mobile-first experience
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#0f0a0f",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      spinnerColor: "#f472b6",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
  },
};

export default config;

