describe("Authentication Flow Tests", () => {
  const uniqueId = Date.now();
  const testEmail = `test_volunteer_${uniqueId}@example.com`;
  const testPassword = "password123";

  beforeEach(() => {
    cy.visit("/login");
  });

  it("should display validation errors when fields are empty", () => {
    cy.get("form").within(() => {
      cy.get("button[type=submit]").click();
    });
    cy.url().should("include", "/login");
  });

  it("should show error when passwords do not match during sign up", () => {
    cy.get(".sign-up a").click();
    cy.url().should("include", "/sign-up");

    const alertStub = cy.stub();
    cy.on("window:alert", alertStub);

    cy.get("#email").type(testEmail);
    cy.get("#password").type(testPassword);
    cy.get("#confirm-password").type("differentPassword");
    cy.get("button[type=submit]").click().then(() => {
      expect(alertStub.getCall(0)).to.be.calledWith("Error: Passwords do not match.");
    });
  });

  it("should successfully sign up a new volunteer and redirect to volunteer home", () => {
    cy.get(".sign-up a").click();
    cy.url().should("include", "/sign-up");

    cy.get("#email").type(testEmail);
    cy.get("#password").type(testPassword);
    cy.get("#confirm-password").type(testPassword);
    cy.get("#volunteer").check();
    cy.get("button[type=submit]").click();

    cy.url().should("include", "/volunteer-home");
    cy.get(".header-container").should("be.visible");
  });

  it("should fail login with invalid credentials and show alert", () => {
    const alertStub = cy.stub();
    cy.on("window:alert", alertStub);

    cy.get("#email").type(testEmail);
    cy.get("#password").type("wrongpassword");
    cy.get("#volunteer").check();
    cy.get("button[type=submit]").click();

    cy.wrap(alertStub).should("be.called");
  });

  it("should successfully login as the registered volunteer and logout", () => {
    cy.get("#email").type(testEmail);
    cy.get("#password").type(testPassword);
    cy.get("#volunteer").check();
    cy.get("button[type=submit]").click();

    cy.url().should("include", "/volunteer-home");

    // Open profile options dropdown
    cy.get(".profile-icon").click();
    // Click Log out
    cy.get(".profile-options .log-out").click();

    // Verify redirection to base URL '/' (which is the login screen)
    cy.url().should("eq", Cypress.config().baseUrl + "/");
  });
});
