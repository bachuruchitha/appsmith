import { defineConfig } from "cypress";

export default defineConfig({
  watchForFileChanges: false,
  defaultCommandTimeout: 30000,
  requestTimeout: 21000,
  responseTimeout: 30000,
  pageLoadTimeout: 60000,
  videoUploadOnPasses: false,
  videoCompression: false,
  numTestsKeptInMemory: 5,
  experimentalMemoryManagement: true,
  reporterOptions: {
    reportDir: "results",
    overwrite: false,
    html: true,
    json: false,
  },
  chromeWebSecurity: false,
  viewportHeight: 1200,
  viewportWidth: 1600,
  retries: {
    runMode: 1,
    openMode: 0,
  },
  e2e: {
    baseUrl: "https://dev.appsmith.com/",
    env: {
      USERNAME: "xxxx",
      PASSWORD: "xxx",
    },
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config);
    },
    specPattern: "cypress/e2e/**/*.{js,ts}",
    testIsolation: false,
    excludeSpecPattern: "cypress/e2e/**/spec_utility.ts",
  },
});
