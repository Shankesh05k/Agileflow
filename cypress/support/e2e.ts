// Cypress E2E support file — loaded before every spec

// Extend Cypress with any custom commands here
// Example: cy.login(email, password)

Cypress.Commands.add('loginAs', (email: string, password: string) => {
  cy.request('POST', '/api/auth/login', { email, password }).then(res => {
    window.localStorage.setItem('accessToken', res.body.accessToken);
    window.localStorage.setItem('refreshToken', res.body.refreshToken);
  });
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginAs(email: string, password: string): Chainable<void>;
    }
  }
}

export {};
