describe("Volunteer Experience E2E Tests", () => {
  const uniqueId = Date.now();
  const testEmail = `volunteer_user_${uniqueId}@example.com`;
  const testPassword = "password123";

  before(() => {
    // Register a new volunteer user first
    cy.visit("/sign-up");
    cy.get("#email").type(testEmail);
    cy.get("#password").type(testPassword);
    cy.get("#confirm-password").type(testPassword);
    cy.get("#volunteer").check();
    cy.get("button[type=submit]").click();

    // Verify redirected to volunteer home
    cy.url().should("include", "/volunteer-home");
  });

  beforeEach(() => {
    // Log in to establish session for each test
    cy.visit("/login");
    cy.get("#email").type(testEmail);
    cy.get("#password").type(testPassword);
    cy.get("#volunteer").check();
    cy.get("button[type=submit]").click();
    cy.url().should("include", "/volunteer-home");
  });

  it("should show volunteer home page components correctly", () => {
    cy.get(".header-container").should("be.visible");
    cy.get(".search-filter-section").should("be.visible");
    cy.get(".search-input").should("be.visible");
    cy.get(".search-trigger-btn").should("be.visible");
    cy.get(".reset-filter-btn").should("be.visible");
  });

  it("should support typing search query and triggering filter action", () => {
    cy.get(".search-input").clear().type("Clean Up Campaign");
    cy.get(".search-trigger-btn").click();
    // Re-evaluates feed. Even if 0 results or results found, search input should retain value
    cy.get(".search-input").should("have.value", "Clean Up Campaign");
  });

  it("should navigate to Leaderboard page", () => {
    cy.get(".nav-link").contains("Leaderboard").click();
    cy.url().should("include", "/leaderboard");
    cy.get(".leaderboard-header").should("be.visible");
  });

  it("should navigate to Q&A page", () => {
    cy.get(".nav-link").contains("Q&A").click();
    cy.url().should("include", "/qa");
    // Verify Q&A page title/header
    cy.get("h1").contains(/Q&A/i).should("be.visible");
  });

  it("should navigate to Volunteering History page via profile dropdown", () => {
    cy.get(".profile-icon").click();
    cy.get(".profile-options").should("be.visible");
    cy.get(".profile-options .view-volunteering-history").click();
    cy.url().should("include", "/volunteering-history");
    cy.get("h1").contains(/volunteering history/i).should("be.visible");
  });

  it("should navigate to Manage Profile page via profile dropdown", () => {
    cy.get(".profile-icon").click();
    cy.get(".profile-options").should("be.visible");
    cy.get(".profile-options .manage-profile").click();
    cy.url().should("include", "/manage-profile");
    // Check page header/title for edit profile
    cy.get("h1").contains(/manage profile/i).should("be.visible");
  });

  it("should support viewing programme details and attempting application if list is not empty", () => {
    // Wait for loading to finish and results to render
    cy.get(".programmes-container").find(".programme, .no-results").should("exist");

    cy.get("body").then(($body) => {
      // Check if there are programme items
      if ($body.find(".programmes-container .programme").length > 0) {
        cy.get(".programmes-container .programme").first().click();
        cy.url().should("include", "/programme-details/");

        // Check if join button exists
        cy.get(".join-button").should("be.visible").click();

        // Confirm modal pops up
        cy.get(".application-modal").should("be.visible");
        cy.get(".modal-cancel-btn").click();
        cy.get(".application-modal").should("not.exist");
      } else {
        cy.get(".no-results").should("contain", "No programmes found");
      }
    });
  });
});
