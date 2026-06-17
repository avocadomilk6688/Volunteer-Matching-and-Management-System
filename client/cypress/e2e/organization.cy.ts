describe("Organization Flow E2E Tests", () => {
  const uniqueId = Date.now();
  const testEmail = `org_user_${uniqueId}@example.com`;
  const testPassword = "password123";

  it("should register a new organization and land on organization verification page", () => {
    cy.visit("/sign-up");

    cy.get("#email").type(testEmail);
    cy.get("#password").type(testPassword);
    cy.get("#confirm-password").type(testPassword);
    cy.get("#organization").check();
    cy.get("button[type=submit]").click();

    // Verify redirected to organization verification form
    cy.url().should("include", "/organization-verification");
    cy.get(".org-verification-title").should("contain", "Organization Verification");
  });

  it("should fill and submit the organization verification form", () => {
    // We login first using the newly created organization account
    cy.visit("/login");
    cy.get("#email").type(testEmail);
    cy.get("#password").type(testPassword);
    cy.get("#organization").check();
    cy.get("button[type=submit]").click();

    cy.url().should("include", "/organization-verification");

    // Stub window alert
    const alertStub = cy.stub();
    cy.on("window:alert", alertStub);

    // Fill form
    cy.get("#organizationName").type(`Organization Name ${uniqueId}`);
    cy.get("#authorizedPersonName").type("John Doe");
    cy.get("#description").type("We are dedicated to preservation of forests in Southeast Asia.");
    cy.get("#address").type("123 Green Valley St, KL, Malaysia");

    // Attempting submit without files should fail
    cy.get(".org-verification-submit-btn").click();
    cy.wrap(alertStub).should("have.been.calledWith", "Please upload at least one valid supporting document (e.g., SSM or ROS Certificate).");

    // Upload mock file using selectFile
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from("SSM Doc PDF Mock Content"),
      fileName: "ssm_document.pdf",
      mimeType: "application/pdf"
    }, { force: true });

    // Submit form
    cy.get(".org-verification-submit-btn").click();

    // Verify success alert was triggered
    cy.wrap(alertStub).should("have.been.calledWith", "Verification documents uploaded successfully! Your application is currently under administrative evaluation.");
  });

  it("should show pending approval page if a pending organization attempts to log in", () => {
    // If the organization logs in, they should navigate to the pending-approval page since they just submitted verification
    cy.visit("/login");
    cy.get("#email").type(testEmail);
    cy.get("#password").type(testPassword);
    cy.get("#organization").check();
    cy.get("button[type=submit]").click();

    cy.url().should("include", "/pending-approval");
    cy.get(".pending-card").should("be.visible");
    cy.get(".pending-message").should("contain", "Your application is pending");

    // Log out safely
    cy.get(".pending-logout-btn").click();
    cy.url().should("eq", Cypress.config().baseUrl + "/");
  });
});
