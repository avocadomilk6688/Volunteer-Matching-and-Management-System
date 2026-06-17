import { io } from "socket.io-client";

describe("Real-Time Chat E2E Tests", () => {
  const uniqueId = Date.now();
  const orgEmail = `org_chat_${uniqueId}@example.com`;
  const volunteerEmail = `vol_chat_${uniqueId}@example.com`;
  const password = "password123";

  let orgId = "";
  let volunteerId = "";
  let programmeId = "";

  it("should register organization, submit verification, and approve it programmatically", () => {
    // 1. Sign up organization
    cy.visit("/sign-up");
    cy.get("#email").type(orgEmail);
    cy.get("#password").type(password);
    cy.get("#confirm-password").type(password);
    cy.get("#organization").check();
    cy.get("button[type=submit]").click();

    cy.url().should("include", "/organization-verification");

    // Read organization user ID from localStorage
    cy.window().then((win) => {
      orgId = win.localStorage.getItem("userId") || "";
      expect(orgId).not.to.be.empty;
    });

    // 2. Fill SSM form
    cy.get("#organizationName").type(`Chat Org ${uniqueId}`);
    cy.get("#authorizedPersonName").type("Org Director");
    cy.get("#description").type("Test organization for chat integration testing.");
    cy.get("#address").type("456 Unity Loop, Cyberjaya, Malaysia");

    // Attach mock file
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from("SSM doc mock content"),
      fileName: "org_ssm_doc.pdf",
      mimeType: "application/pdf"
    }, { force: true });

    // Submit SSM verification
    const alertStub = cy.stub();
    cy.on("window:alert", alertStub);
    cy.get(".org-verification-submit-btn").click();
    cy.wrap(alertStub).should("have.been.calledWith", "Verification documents uploaded successfully! Your application is currently under administrative evaluation.");

    // 3. Programmatically approve organization via REST API
    cy.window().then((win) => {
      const token = win.localStorage.getItem("token");

      // Fetch the registration record ID (starts with REGxxx)
      cy.request({
        method: "GET",
        url: `http://localhost:3000/organizations/registration/${orgId}`,
        headers: { Authorization: `Bearer ${token}` }
      }).then((regResponse) => {
        const regId = regResponse.body.id;

        // Approve registration record
        cy.request({
          method: "PATCH",
          url: `http://localhost:3000/organizations/registration/${regId}`,
          headers: { Authorization: `Bearer ${token}` },
          body: { status: "approved" }
        }).then((patchResponse) => {
          expect(patchResponse.body.status).to.eq("approved");
        });
      });
    });
  });

  it("should create a programme listing as organization", () => {
    // Login as approved organization
    cy.visit("/login");
    cy.get("#email").type(orgEmail);
    cy.get("#password").type(password);
    cy.get("#organization").check();
    cy.get("button[type=submit]").click();

    cy.url().should("include", "/manage-listing");

    // Create a new programme listing
    cy.get(".add-listing-btn").click();
    cy.get("table tbody tr.adding-row").should("be.visible");

    // Fill details
    cy.get("tr.adding-row input[type=text]").eq(0).type(`Chat Campaign ${uniqueId}`); // title
    cy.get("tr.adding-row textarea").type("Join us for checking chat logs."); // description
    cy.get("tr.adding-row select").eq(0).select("Physical"); // mode
    cy.get("tr.adding-row input[type=text]").eq(1).type("Cyberjaya Community Hall"); // location
    cy.get("tr.adding-row input[type=datetime-local]").eq(0).type("2026-12-01T09:00"); // start_time
    cy.get("tr.adding-row input[type=datetime-local]").eq(1).type("2026-12-01T17:00"); // end_time

    cy.get("table tbody tr.adding-row .save-btn").click();

    // Verify row was added
    cy.get("table tbody").should("contain", `Chat Campaign ${uniqueId}`);
  });

  it("should support real-time messaging between volunteer and organization", () => {
    // 1. Sign up volunteer
    cy.visit("/sign-up");
    cy.get("#email").type(volunteerEmail);
    cy.get("#password").type(password);
    cy.get("#confirm-password").type(password);
    cy.get("#volunteer").check();
    cy.get("button[type=submit]").click();

    cy.url().should("include", "/volunteer-home");

    // Read volunteer user ID from localStorage
    cy.window().then((win) => {
      volunteerId = win.localStorage.getItem("userId") || "";
      expect(volunteerId).not.to.be.empty;
    });

    // 2. Find and open details page of Chat Campaign
    cy.get(".loading-state").should("not.exist");
    cy.get(".search-input").clear().type(`Chat Campaign ${uniqueId}`);
    cy.get(".search-trigger-btn").click();

    // Click on program listing
    cy.get(".programmes-container .programme").first().click();
    cy.url().should("include", "/programme-details/");

    // Capture programmeId from url
    cy.url().then((url) => {
      const parts = url.split("/");
      programmeId = parts[parts.length - 1];
      expect(programmeId).not.to.be.empty;
    });

    // 3. Open chat and send message
    cy.get(".chat-button").click();
    cy.get(".chat-window-container").should("be.visible");
    cy.get(".chat-input-field").type("Hello Organization! Is this campaign still active?");
    cy.get(".send-btn").click();

    // Verify sent bubble appears
    cy.get(".chat-messages").should("contain", "Hello Organization! Is this campaign still active?");

    // 4. Simulate Organization reply using a WebSocket client connection
    cy.then(() => {
      const socket = io("http://localhost:3000", { autoConnect: true });

      socket.on("connect", () => {
        // Join organization personal notification room
        socket.emit("join_private_room", { userId: orgId });

        // Join the shared chat room
        socket.emit("join_chat_session", {
          senderId: orgId,
          receiverId: volunteerId,
          programmeId: programmeId
        });

        // Send message from organization
        socket.emit("send_message", {
          senderId: orgId,
          receiverId: volunteerId,
          programmeId: programmeId,
          content: "Yes, we are actively looking for chat testers!"
        });
      });
    });

    // 5. Verify organization's reply bubble appears in real-time in volunteer's browser UI
    cy.get(".chat-messages", { timeout: 10000 }).should("contain", "Yes, we are actively looking for chat testers!");

    // Close chat
    cy.get(".header-close-btn").click();
    cy.get(".chat-window-container").should("not.exist");
  });
});
