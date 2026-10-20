import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    viewportWidth: 1280,
    viewportHeight: 800,
    setupNodeEvents(_on, _config) {
      // No custom node events required
    },
  },
});
