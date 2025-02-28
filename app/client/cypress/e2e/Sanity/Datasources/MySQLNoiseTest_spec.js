const queryLocators = require("../../../locators/QueryEditor.json");
const datasourceEditor = require("../../../locators/DatasourcesEditor.json");
import { agHelper, dataSources } from "../../../support/Objects/ObjectsCore";
const commonlocators = require("../../../locators/commonlocators.json");

describe("MySQL noise test", function () {
  let datasourceName;

  beforeEach(() => {
    cy.fixture("noiseDsl").then((val) => {
      agHelper.AddDsl(val);
    });
    cy.startRoutesForDatasource();
  });

  it("1. Verify after killing MySQL session, app should not crash", function () {
    cy.NavigateToDatasourceEditor();
    cy.get(datasourceEditor.MySQL).click();
    cy.generateUUID().then((uid) => {
      datasourceName = uid;
      cy.get(".t--edit-datasource-name").click();
      cy.get(".t--edit-datasource-name input")
        .clear()
        .type(datasourceName, { force: true })
        .should("have.value", datasourceName)
        .blur();
      cy.fillMySQLDatasourceForm();
      cy.testSaveDatasource();
      cy.NavigateToActiveDSQueryPane(datasourceName);
    });
    cy.get(queryLocators.queryNameField).type("NoiseTestQuery");
    // mySQL query to fetch data
    dataSources.EnterQuery(
      "SELECT * FROM users where role = 'Admin' ORDER BY id LIMIT 10",
    );
    cy.WaitAutoSave();
    cy.runQuery();
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    // API for killing mySQL session
    cy.CreateAPI("killSession");
    cy.enterDatasourceAndPath(
      "http://host.docker.internal:5001/",
      "v1/noise/killmysql",
    );
    cy.SaveAndRunAPI();
    cy.ResponseCheck("killed");
    cy.get('.t--entity-name:contains("Page1")').click({ force: true });
    cy.wait(2000);
    // run kill query
    cy.get(".bp3-button-text:contains('Kill Session')").should("be.visible");
    cy.get(".bp3-button-text:contains('Kill Session')").click({ force: true });
    // run refresh query
    cy.get(".bp3-button-text:contains('Refresh Query')").click({ force: true });
    cy.wait(2000);
    cy.get(commonlocators.toastmsg).contains(
      "NoiseTestQuery failed to execute",
    );
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.statusCode).to.eq("200 OK");
    });
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.statusCode).to.eq("200 OK");
    });
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.statusCode).to.eq("PE-STC-5000");
      expect(response.body.data.title).to.eq("Connection is stale");
    });
  });
});
