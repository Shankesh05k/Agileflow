describe('Kanban board', () => {
  beforeEach(() => {
    // Login via API shortcut
    cy.request('POST', '/api/auth/login', {
      email: 'alice@agileflow.dev',
      password: 'Password123!',
    }).then(res => {
      localStorage.setItem('accessToken', res.body.accessToken);
      localStorage.setItem('refreshToken', res.body.refreshToken);
    });
    cy.visit('/board');
  });

  it('renders the board heading', () => {
    cy.contains('Board').should('be.visible');
  });

  it('renders at least one kanban column', () => {
    cy.get('[class*="column"]').should('have.length.gte', 1);
  });

  it('opens new ticket modal on button click', () => {
    cy.contains('New ticket').click();
    cy.get('[role="dialog"]').should('be.visible');
    cy.contains('New ticket', { matchCase: false });
  });

  it('closes modal on Escape key', () => {
    cy.contains('New ticket').click();
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('body').type('{esc}');
    cy.get('[role="dialog"]').should('not.exist');
  });
});
