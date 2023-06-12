/// <reference types="Cypress" />

const datasource = require("../../../../locators/DatasourcesEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const commonlocators = require("../../../../locators/commonlocators.json");

import * as _ from "../../../../support/Objects/ObjectsCore";

const pageid = "MyPage";
let datasourceName;

describe("Entity explorer tests related to query and datasource", function () {
  before(() => {
    cy.generateUUID().then((uid) => {
      datasourceName = uid;
    });
  });

  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create a page/moveQuery/rename/delete in explorer", function () {
    cy.Createpage(pageid);
    cy.wait(2000);
    cy.get(".t--entity-name").contains("Page1").click({ force: true });
    cy.wait(2000);
    _.dataSources.NavigateToDSCreateNew();
    _.dataSources.CreatePlugIn("PostgreSQL");
    _.dataSources.FillPostgresDSForm();
    // checking that conflicting names are not allowed
    cy.get(".t--edit-datasource-name").click();
    cy.get(".t--edit-datasource-name input")
      .clear()
      .type("download", { force: true })
      .blur();
    cy.get(".Toastify").should("contain", "Invalid name");

    // checking a valid name
    cy.get(".t--edit-datasource-name").click();
    cy.get(".t--edit-datasource-name input")
      .clear()
      .type(datasourceName, { force: true })
      .should("have.value", datasourceName)
      .blur();

    cy.testSaveDatasource();
    cy.NavigateToActiveDSQueryPane(datasourceName);

    /* eslint-disable */
    cy.wait(2000);
    cy.NavigateToQueryEditor();
    cy.CheckAndUnfoldEntityItem("Datasources");
    cy.contains(".t--entity-name", datasourceName).click();

    cy.get(".t--edit-datasource-name").click();
    cy.get(".t--edit-datasource-name input")
      .clear()
      .type(`${datasourceName}new`, { force: true })
      .blur();

    cy.contains(commonlocators.entityName, `${datasourceName}new`);

    // reverting the name
    cy.get(".t--edit-datasource-name").click();
    cy.get(".t--edit-datasource-name input")
      .clear()
      .type(`${datasourceName}`, { force: true })
      .blur();

    // going  to the query create page
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    cy.contains(commonlocators.entityName, "Query1").click();

    cy.wait("@getPluginForm").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    // Resetting the default query and rewriting a new one
    _.dataSources.EnterQuery("");
    cy.get(".CodeMirror textarea").first().focus().type("select * from users");

    cy.EvaluateCurrentValue("select * from users");
    cy.get(".t--action-name-edit-field").click({ force: true });

    _.entityExplorer.ActionContextMenuByEntityName("Query1", "Show bindings");
    cy.get(apiwidget.propertyList).then(function ($lis) {
      expect($lis).to.have.length(5);
      expect($lis.eq(0)).to.contain("{{Query1.isLoading}}");
      expect($lis.eq(1)).to.contain("{{Query1.data}}");
      expect($lis.eq(2)).to.contain("{{Query1.responseMeta}}");
      expect($lis.eq(3)).to.contain("{{Query1.run()}}");
      expect($lis.eq(4)).to.contain("{{Query1.clear()}}");
    });
    cy.get(".t--entity-property-close").click(); //closing Bindings overlay
    _.entityExplorer.ActionContextMenuByEntityName("Query1", "Edit name");
    cy.EditApiNameFromExplorer("MyQuery");
    _.entityExplorer.ActionContextMenuByEntityName(
      "MyQuery",
      "Move to page",
      pageid,
    );
    cy.wait(2000);
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.SelectEntityByName("MyQuery");
    cy.wait(2000);
    cy.runQuery();

    //deleteQuery & DS
    _.agHelper.ActionContextMenuWithInPane("Delete");
    _.dataSources.DeleteDatasouceFromActiveTab(datasourceName);
  });
});
