/// <reference types="Cypress" />

import apiLocators from "../../../../locators/ApiEditor";

import {
  agHelper,
  entityExplorer,
  deployMode,
  apiPage,
} from "../../../../support/Objects/ObjectsCore";

describe("Test Create Api and Bind to List widget", function () {
  let valueToTest;
  before(() => {
    cy.fixture("listwidgetdsl").then((val) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. Test_Add users api and execute api", function () {
    apiPage.CreateAndFillApi(this.dataSet.userApi + "/mock-api?records=10");
    cy.RunAPI();
    cy.get(apiLocators.jsonResponseTab).click();
    cy.get(apiLocators.responseBody)
      .contains("name")
      .siblings("span")
      .invoke("text")
      .then((text) => {
        valueToTest = `${text
          .match(/"(.*)"/)[0]
          .split('"')
          .join("")}`;
        cy.log(valueToTest);
        cy.log("val1:" + valueToTest);
      });
  });

  it("2. Test_Validate the Api data is updated on List widget", function () {
    entityExplorer.SelectEntityByName("List1");

    cy.testJsontext("items", "{{Api1.data}}");
    cy.get(".t--draggable-textwidget span").should("have.length", 8);
    cy.get(".t--draggable-textwidget span")
      .first()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal(valueToTest);
      });
    deployMode.DeployApp();
    cy.wait("@postExecute").then((interception) => {
      valueToTest = JSON.stringify(
        interception.response.body.data.body[0].name,
      ).replace(/['"]+/g, "");
    });
    cy.waitUntil(
      () => cy.get(".t--widget-textwidget span").should("be.visible"),
      {
        errorMsg: "Pubish app page is not loaded evn after 20 secs",
        timeout: 20000,
        interval: 1000,
      },
    ).then(() => cy.wait(500));

    cy.get(".t--widget-textwidget span").should("have.length", 8);
    cy.get(".t--widget-textwidget span")
      .first()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal(valueToTest);
      });
  });

  it("3. Test_Validate the list widget ", function () {
    deployMode.NavigateBacktoEditor();
    cy.wait("@postExecute").then((interception) => {
      valueToTest = JSON.stringify(
        interception.response.body.data.body[0].name,
      ).replace(/['"]+/g, "");
    });
    entityExplorer.SelectEntityByName("List1", "Widgets");
    cy.moveToStyleTab();
    cy.testJsontext("itemspacing\\(px\\)", "50");
    cy.get(".t--draggable-textwidget span").should("have.length", 6);
    cy.get(".t--draggable-textwidget span")
      .first()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal(valueToTest);
      });
    deployMode.DeployApp();
    cy.wait("@postExecute").then((interception) => {
      valueToTest = JSON.stringify(
        interception.response.body.data.body[0].name,
      ).replace(/['"]+/g, "");
    });
    cy.waitUntil(
      () => cy.get(".t--widget-textwidget span").should("be.visible"),
      {
        errorMsg: "Pubish app page is not loaded evn after 20 secs",
        timeout: 20000,
        interval: 1000,
      },
    ).then(() => cy.wait(500));
    cy.get(".t--widget-textwidget span").should("have.length", 6);
    cy.get(".t--widget-textwidget span")
      .first()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal(valueToTest);
      });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
