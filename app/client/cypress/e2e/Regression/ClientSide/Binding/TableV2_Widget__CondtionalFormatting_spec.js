/* eslint-disable cypress/no-unnecessary-waiting */
import {
  entityExplorer,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Table Widget V2 condtional formatting to remain consistent", function () {
  before(() => {
    cy.fixture("tableV2WidgetCondnFormatDsl").then((val) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. check the cell styles before and after sorting", function () {
    entityExplorer.SelectEntityByName("Table1");
    //Check Font weight, font style, and text color before sorting
    cy.readTableV2dataValidateCSS("0", "1", "font-weight", "700");
    cy.readTableV2dataValidateCSS("0", "1", "font-style", "normal");
    cy.readTableV2dataValidateCSS("0", "1", "color", "rgb(0, 0, 255)");
    cy.readTableV2dataValidateCSS("1", "1", "font-weight", "400");
    cy.readTableV2dataValidateCSS("1", "1", "font-style", "italic");
    cy.readTableV2dataValidateCSS("1", "1", "color", "rgb(255, 0, 0)");
    cy.get(".draggable-header").contains("id").click({ force: true });
    //Check Font weight, font style, and text color after sorting
    cy.readTableV2dataValidateCSS("3", "1", "font-weight", "700");
    cy.readTableV2dataValidateCSS("3", "1", "font-style", "normal");
    cy.readTableV2dataValidateCSS("3", "1", "color", "rgb(0, 0, 255)");
    cy.readTableV2dataValidateCSS("2", "1", "font-weight", "400");
    cy.readTableV2dataValidateCSS("2", "1", "font-style", "italic");
    cy.readTableV2dataValidateCSS("2", "1", "color", "rgb(255, 0, 0)");
  });
});
