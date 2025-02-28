import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  deployMode,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Validate basic binding of Input widget to Input widget", () => {
  before(() => {
    cy.fixture("inputBindingdsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. Input widget test with default value from another Input widget", () => {
    cy.fixture("testdata").then(function (dataSet: any) {
      //dataSet = data;
      entityExplorer.SelectEntityByName("Input1", "Widgets");
      propPane.UpdatePropertyFieldValue(
        "Default value",
        dataSet.defaultInputBinding + "}}",
      );
      assertHelper.AssertNetworkStatus("@updateLayout");
      //Binding second input widget with first input widget and validating
      entityExplorer.SelectEntityByName("Input2");
      propPane.UpdatePropertyFieldValue(
        "Default value",
        dataSet.momentInput + "}}",
      );
    });
    assertHelper.AssertNetworkStatus("@updateLayout");
    //Publish widget and validate the data displayed in input widgets
    let currentTime = new Date();
    deployMode.DeployApp(locators._widgetInputSelector("inputwidgetv2"));
    cy.get(locators._widgetInputSelector("inputwidgetv2"))
      .first()
      .should("contain.value", currentTime.getFullYear());
    cy.get(locators._widgetInputSelector("inputwidgetv2"))
      .last()
      .should("contain.value", currentTime.getFullYear());
  });
});
