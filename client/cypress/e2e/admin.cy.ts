describe("Admin Flow E2E Tests", () => {
  const uniqueId = Date.now();
  const adminEmail = `admin_test_${uniqueId}@example.com`;
  const adminPassword = "password123";

  before(() => {
    // Register the admin user programmatically through backend API
    cy.request("POST", "http://localhost:3000/auth/register", {
      email: adminEmail,
      username: `admin_${uniqueId}`,
      password: adminPassword,
      role: "admin"
    });
  });

  beforeEach(() => {
    // Login as Admin
    cy.visit("/login");
    cy.get("#email").type(adminEmail);
    cy.get("#password").type(adminPassword);
    cy.get("#admin").check();
    cy.get("button[type=submit]").click();

    cy.url().should("include", "/manage-user-account");
  });

  it("should show admin dashboard elements correctly", () => {
    cy.get(".admin-sidebar").should("be.visible");
    cy.get(".admin-main-title").should("contain", "Manage user account");
    cy.get(".admin-search-input").should("be.visible");
    cy.get(".admin-add-account-btn").should("be.visible");
  });

  it("should navigate through all admin pages via sidebar", () => {
    // 1. Verify Organization Registration
    cy.get(".admin-sidebar li").contains(/verify organization/i).click();
    cy.url().should("include", "/verify-organization-registration");
    cy.get(".admin-main-title").should("contain", "Verify Organization Registration");

    // 2. Admin Manage Listing
    cy.get(".admin-sidebar li").contains(/manage listing/i).click();
    cy.url().should("include", "/admin-manage-listing");
    cy.get(".admin-main-title").should("contain", "Manage listing");

    // 3. Manage Q&A
    cy.get(".admin-sidebar li").contains(/manage Q&A/i).click();
    cy.url().should("include", "/manage-qa");
    cy.get(".admin-main-title").should("contain", "Manage Q&A section");

    // 4. Manage Tickets
    cy.get(".admin-sidebar li").contains(/support ticket/i).click();
    cy.url().should("include", "/manage-tickets");
    cy.get(".admin-main-title").should("contain", "Manage support ticket");

    // 5. Manage User Account (Back to start)
    cy.get(".admin-sidebar li").contains(/manage user account/i).click();
    cy.url().should("include", "/manage-user-account");
  });

  it("should support search filtering of user accounts", () => {
    cy.get(".admin-search-input").clear().type("NonExistentUserSearchQuery");
    // Verify that the table updates/shows empty state
    cy.get(".admin-empty-table-fallback").should("be.visible");
  });

  it("should toggle the Add User form and cancel correctly", () => {
    cy.get(".admin-add-account-btn").click();
    cy.get(".adding-row").should("be.visible");

    // Inputs should be visible in adding row
    cy.get(".adding-row input").first().type("test_new_user");
    cy.get(".adding-row .cancel-btn").click();
    cy.get(".adding-row").should("not.exist");
  });
});
