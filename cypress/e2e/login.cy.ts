describe('Login flow', () => {
  beforeEach(() => cy.visit('/login'));

  it('shows the AgileFlow brand', () => {
    cy.contains('AgileFlow').should('be.visible');
  });

  it('shows validation message for empty form', () => {
    cy.get('[type="submit"]').click();
    // Browser HTML5 validation prevents submit
    cy.url().should('include', '/login');
  });

  it('shows error for wrong credentials', () => {
    cy.get('[type="email"]').clear().type('wrong@test.com');
    cy.get('[type="password"]').clear().type('wrongpassword');
    cy.get('[type="submit"]').click();
    cy.get('[class*="error"]').should('be.visible');
  });

  it('pre-fills demo credentials on demo button click', () => {
    cy.contains('Admin').click();
    cy.get('[type="email"]').should('have.value', 'alice@agileflow.dev');
    cy.get('[type="password"]').should('have.value', 'Password123!');
  });
});
