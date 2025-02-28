const commonlocators = require("../../../../locators/commonlocators.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation for Tab widget", function () {
  before(() => {
    cy.fixture("dynamicTabWidgetdsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });

  function validateHeight() {
    cy.wait(2000);
    cy.get(".t--tabid-tab1").click({ force: true });
    cy.wait(2000);
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((theight) => {
        cy.get(".t--tabid-tab2").click({ force: true });
        cy.wait(2000);
        //cy.get(".t--draggable-checkboxwidget .bp3-control-indicator").click({ force: true })
        cy.get(".t--widget-tabswidget")
          .invoke("css", "height")
          .then((tnewheight) => {
            expect(theight).to.not.equal(tnewheight);
          });
      });
  }
  it("1. Tab widget validation of height with dynamic height feature with publish mode", function () {
    //changing the Text Name and verifying
    cy.wait(3000);
    cy.openPropertyPane("tabswidget");
    cy.changeLayoutHeight(commonlocators.autoHeight);
    cy.get(".t--tabid-tab1").click({ force: true });
    validateHeight();
    _.deployMode.DeployApp();
    validateHeight();
    _.deployMode.NavigateBacktoEditor();
    _.agHelper.AssertElementVisible(_.locators._previewModeToggle("edit"));
    _.agHelper.GetNClick(_.locators._previewModeToggle("edit"));
    cy.wait(2000);
    cy.get(".t--tabid-tab1").click({ force: true });
    cy.wait(2000);
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((theight) => {
        cy.get(".t--tabid-tab2").click({ force: true });
        cy.wait(1000);
        //cy.get(".t--draggable-checkboxwidget .bp3-control-indicator").click({ force: true })
        cy.get(".t--widget-tabswidget")
          .invoke("css", "height")
          .then((tnewheight) => {
            expect(theight).to.not.equal(tnewheight);
          });
      });
    // it("Tab widget validation of height with preview mode", function() {
    _.agHelper.AssertElementVisible(_.locators._previewModeToggle("preview"));
    _.agHelper.GetNClick(_.locators._previewModeToggle("preview"));
    cy.wait(2000);
    cy.openPropertyPane("tabswidget");
    cy.changeLayoutHeight(commonlocators.fixed);
    cy.get(".t--tabid-tab1").click({ force: true });
    cy.wait(2000);
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((theight) => {
        cy.get(".t--tabid-tab2").click({ force: true });
        cy.wait(2000);
        //cy.get(".t--draggable-checkboxwidget .bp3-control-indicator").click({ force: true })
        cy.get(".t--widget-tabswidget")
          .invoke("css", "height")
          .then((tnewheight) => {
            expect(theight).to.equal(tnewheight);
            cy.get(commonlocators.showTabsControl).click({ force: true });
            cy.wait("@updateLayout").should(
              "have.nested.property",
              "response.body.responseMeta.status",
              200,
            );
            cy.get(".t--widget-tabswidget")
              .invoke("css", "height")
              .then((upheight) => {
                expect(tnewheight).to.equal(upheight);
                cy.get(".t--tabid-tab1").should("not.exist");
                cy.get(".t--tabid-tab2").should("not.exist");
              });
          });
      });
    //it("Tab widget validation of height with reload", function() {
    cy.wait(2000);
    cy.openPropertyPane("tabswidget");
    cy.get(commonlocators.generalSectionHeight).should("be.visible");
    cy.get(commonlocators.showTabsControl).click({ force: true });
    cy.changeLayoutHeight(commonlocators.autoHeight);
    cy.wait(2000);
    cy.get(".t--tabid-tab1").click({ force: true });
    cy.wait(2000);
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((theight) => {
        cy.get(".t--tabid-tab2").click({ force: true });
        cy.changeLayoutHeight(commonlocators.fixed);
        cy.wait(2000);
        _.agHelper.RefreshPage();
        cy.openPropertyPane("tabswidget");
        cy.get(".t--widget-tabswidget")
          .invoke("css", "height")
          .then((tnewheight) => {
            expect(theight).to.not.equal(tnewheight);
          });
      });
  });
});
