export const runtimeFlags = {
  isDev: import.meta.env.DEV,
  debugOrientation: import.meta.env.DEV,
  screenshotMode: new URLSearchParams(window.location.search).get("screenshot") === "1"
};
