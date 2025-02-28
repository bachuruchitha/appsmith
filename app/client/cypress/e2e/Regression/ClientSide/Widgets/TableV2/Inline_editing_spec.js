const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import {
  agHelper,
  entityExplorer,
  propPane,
  table,
  draggableWidgets,
} from "../../../../../support/Objects/ObjectsCore";
import { PROPERTY_SELECTOR } from "../../../../../locators/WidgetLocators";

describe("Table widget inline editing functionality", () => {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
    cy.fixture("Table/InlineEditingDSL").then((val) => {
      agHelper.AddDsl(val);
    });
  });

  let propPaneBack = "[data-testid='t--property-pane-back-btn']";

  it("1. should check that edit check box is present in the columns list", () => {
    cy.openPropertyPane("tablewidgetv2");

    ["step", "task", "status", "action"].forEach((column) => {
      cy.get(
        `[data-rbd-draggable-id="${column}"] .t--card-checkbox input[type="checkbox"]`,
      ).should("exist");
    });
  });

  it("2. should check that editablity checkbox is preset top of the list", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(`.t--property-control-columns .t--uber-editable-checkbox`).should(
      "exist",
    );
  });

  it("3. should check that turning on editablity turns on edit in all the editable column in the list", () => {
    cy.openPropertyPane("tablewidgetv2");
    function checkEditableCheckbox(expected) {
      ["step", "task", "status"].forEach((column) => {
        cy.get(
          `[data-rbd-draggable-id="${column}"] .t--card-checkbox.t--checked`,
        ).should(expected);
      });
    }

    checkEditableCheckbox("not.exist");

    cy.get(
      `.t--property-control-columns .t--uber-editable-checkbox input+span`,
    ).click();

    checkEditableCheckbox("exist");

    cy.get(
      `.t--property-control-columns .t--uber-editable-checkbox input+span`,
    ).click();

    checkEditableCheckbox("not.exist");
  });

  it("4. should check that turning on editablity DOESN'T turn on edit in the non editable column in the list", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(
      '[data-rbd-draggable-id="action"] .t--card-checkbox.t--checked',
    ).should("not.exist");
    cy.get(
      `.t--property-control-columns .t--uber-editable-checkbox input+span`,
    ).click();
    cy.get(
      '[data-rbd-draggable-id="action"] .t--card-checkbox.t--checked',
    ).should("not.exist");
    cy.get(
      `.t--property-control-columns .t--uber-editable-checkbox input+span`,
    ).click();
    cy.get(
      '[data-rbd-draggable-id="action"] .t--card-checkbox.t--checked',
    ).should("not.exist");
  });

  it("5. should check that checkbox in the column list and checkbox inside the column settings ARE in sync", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(
      '[data-rbd-draggable-id="step"] .t--card-checkbox.t--checked',
    ).should("not.exist");
    cy.editColumn("step");
    cy.get(".t--property-control-editable .ads-v2-switch.checked").should(
      "not.exist",
    );
    cy.get(propPaneBack).click();
    cy.get(
      '[data-rbd-draggable-id="step"] .t--card-checkbox input+span',
    ).click();
    cy.get(
      '[data-rbd-draggable-id="step"] .t--card-checkbox.t--checked',
    ).should("exist");
    cy.editColumn("step");
    cy.get(".t--property-control-editable")
      .find("input")
      .should("have.attr", "checked");
    cy.get(propPaneBack).click();
    cy.get(
      '[data-rbd-draggable-id="step"] .t--card-checkbox input+span',
    ).click();
    cy.get(
      '[data-rbd-draggable-id="step"] .t--card-checkbox.t--checked',
    ).should("not.exist");
    cy.editColumn("step");
    cy.get(".t--property-control-editable .ads-v2-switch.checked").should(
      "not.exist",
    );
  });

  it("6. should check that checkbox in the column list and checkbox inside the column settings ARE NOT in sync when there is js expression", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("step");
    cy.get(".t--property-control-editable .t--js-toggle").click();
    cy.updateCodeInput(".t--property-control-editable", `{{true === true}}`);
    cy.get(propPaneBack).click();
    cy.makeColumnEditable("step");
    cy.editColumn("step");
    cy.get(".t--property-control-editable .CodeMirror .CodeMirror-code").should(
      "contain",
      "{{true === true}}",
    );
    cy.get(propPaneBack).click();
    cy.makeColumnEditable("step");
    cy.editColumn("step");
    cy.get(".t--property-control-editable .CodeMirror .CodeMirror-code").should(
      "contain",
      "{{true === true}}",
    );
  });

  it("7. should check that editable checkbox is disabled for columns that are not editable", () => {
    cy.openPropertyPane("tablewidgetv2");
    [
      {
        columnType: "URL",
        expected: "be.disabled",
      },
      {
        columnType: "Number",
        expected: "not.be.disabled",
      },
      {
        columnType: "Date",
        expected: "not.be.disabled",
      },
      {
        columnType: "Image",
        expected: "be.disabled",
      },
      {
        columnType: "Video",
        expected: "be.disabled",
      },
      {
        columnType: "Button",
        expected: "be.disabled",
      },
      {
        columnType: "Menu button",
        expected: "be.disabled",
      },
      {
        columnType: "Icon button",
        expected: "be.disabled",
      },
      {
        columnType: "Plain text",
        expected: "not.be.disabled",
      },
    ].forEach((data) => {
      cy.editColumn("step");
      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option")
        .children()
        .contains(data.columnType)
        .click();
      cy.wait("@updateLayout");
      cy.get(propPaneBack).click();
      cy.get(`[data-rbd-draggable-id="step"] .t--card-checkbox input`).should(
        data.expected,
      );
    });
  });

  it("8. should check that editable property is only available for Plain text & number columns", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("step");
    [
      {
        columnType: "URL",
        expected: "not.exist",
      },
      {
        columnType: "Number",
        expected: "exist",
      },
      {
        columnType: "Date",
        expected: "exist",
      },
      {
        columnType: "Image",
        expected: "not.exist",
      },
      {
        columnType: "Video",
        expected: "not.exist",
      },
      {
        columnType: "Button",
        expected: "not.exist",
      },
      {
        columnType: "Menu button",
        expected: "not.exist",
      },
      {
        columnType: "Icon button",
        expected: "not.exist",
      },
      {
        columnType: "Plain text",
        expected: "exist",
      },
    ].forEach((data) => {
      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option")
        .children()
        .contains(data.columnType)
        .click();
      cy.wait("@updateLayout");
      cy.get(".t--property-control-editable").should(data.expected);
    });
  });

  it("9. should check that inline save option is shown only when a column is made editable", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(".t--property-control-updatemode").should("not.exist");
    cy.makeColumnEditable("step");
    cy.get(".t--property-control-updatemode").should("exist");
    cy.makeColumnEditable("step");
    cy.get(".t--property-control-updatemode").should("exist");

    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 600 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{Table1.inlineEditingSaveOption}}`,
    );
    cy.get(".t--widget-textwidget .bp3-ui-text").should("contain", "ROW_LEVEL");
  });

  it("10. should check that save/discard column is added when a column is made editable and removed when made uneditable", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    cy.get("[data-rbd-draggable-id='EditActions1']").should("exist");
    cy.get("[data-rbd-draggable-id='EditActions1'] input[type='text']").should(
      "contain.value",
      "Save / Discard",
    );
    cy.get("[data-colindex='4'][data-rowindex='0'] button").should(
      "be.disabled",
    );
    cy.makeColumnEditable("step");
    cy.get("[data-rbd-draggable-id='EditActions1']").should("not.exist");

    cy.get(
      `.t--property-control-columns .t--uber-editable-checkbox input+span`,
    ).click();
    cy.get("[data-rbd-draggable-id='EditActions1']").should("exist");
    cy.get("[data-rbd-draggable-id='EditActions1'] input[type='text']").should(
      "contain.value",
      "Save / Discard",
    );
    cy.get("[data-colindex='4'][data-rowindex='0'] button").should(
      "be.disabled",
    );
    cy.get(
      `.t--property-control-columns .t--uber-editable-checkbox input+span`,
    ).click();
    cy.get("[data-rbd-draggable-id='EditActions1']").should("not.exist");

    cy.editColumn("step");
    cy.get(".t--property-control-editable .ads-v2-switch").click();
    cy.get(propPaneBack).click();
    cy.get("[data-rbd-draggable-id='EditActions1']").should("exist");
    cy.get("[data-rbd-draggable-id='EditActions1'] input[type='text']").should(
      "contain.value",
      "Save / Discard",
    );
    cy.get("[data-colindex='4'][data-rowindex='0'] button").should(
      "be.disabled",
    );
    cy.editColumn("step");
    cy.get(".t--property-control-editable .ads-v2-switch").click();
    cy.get("[data-rbd-draggable-id='EditActions1']").should("not.exist");
  });

  it("11. should check that save/discard column is added/removed when inline save option is changed", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    cy.get("[data-rbd-draggable-id='EditActions1']").should("exist");
    cy.get(".t--property-control-updatemode .t--property-control-label")
      .last()
      .click();
    cy.get(".ads-v2-segmented-control-value-CUSTOM").click({ force: true });
    cy.get("[data-rbd-draggable-id='EditActions1']").should("not.exist");
    cy.makeColumnEditable("task");
    cy.get("[data-rbd-draggable-id='EditActions1']").should("not.exist");
    cy.get(".t--property-control-updatemode .t--property-control-label")
      .last()
      .click();
    cy.get(".ads-v2-segmented-control-value-ROW_LEVEL").click({ force: true });
    cy.get("[data-rbd-draggable-id='EditActions1']").should("exist");
    cy.get(".t--property-control-updatemode .t--property-control-label")
      .last()
      .click();
    cy.get(".ads-v2-segmented-control-value-CUSTOM").click({ force: true });
    cy.get("[data-rbd-draggable-id='EditActions1']").should("not.exist");
    cy.makeColumnEditable("step");
    cy.makeColumnEditable("task");
    cy.get(".t--property-control-updatemode .t--property-control-label")
      .last()
      .click();
    cy.get(".ads-v2-segmented-control-value-ROW_LEVEL").click({ force: true });
    cy.get("[data-rbd-draggable-id='EditActions1']").should("not.exist");
  });

  it("12. should check that cell of an editable column is editable", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    // click the edit icon
    cy.editTableCell(0, 0);
    cy.get(
      "[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor input.bp3-input",
    ).should("not.be.disabled");

    //double click the cell
    cy.openPropertyPane("tablewidgetv2");
    cy.get(
      `[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor input.bp3-input`,
    ).should("not.exist");
    cy.get(`[data-colindex=0][data-rowindex=0] .t--table-text-cell`).trigger(
      "dblclick",
    );
    cy.get(
      `[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor input.bp3-input`,
    ).should("exist");
    cy.get(
      "[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor input.bp3-input",
    ).should("not.be.disabled");
  });

  it("13. should check that changes can be discarded by clicking escape", () => {
    cy.openPropertyPane("tablewidgetv2");
    let value;
    cy.readTableV2data(0, 0).then((val) => {
      value = val;
    });
    cy.makeColumnEditable("step");
    cy.editTableCell(0, 0);
    cy.enterTableCellValue(0, 0, "newValue");
    cy.discardTableCellValue(0, 0);
    cy.get(
      `[data-colindex="0"][data-rowindex="0"] .t--inlined-cell-editor input.bp3-input`,
    ).should("not.exist");
    cy.readTableV2data(0, 0).then((val) => {
      expect(val).to.equal(value);
    });
  });

  it("14. should check that changes can be saved by pressing enter or clicking outside", () => {
    cy.openPropertyPane("tablewidgetv2");
    let value;
    cy.readTableV2data(0, 0).then((val) => {
      value = val;
    });
    cy.makeColumnEditable("step");
    cy.editTableCell(0, 0);
    cy.enterTableCellValue(0, 0, "newValue");
    cy.saveTableCellValue(0, 0);
    cy.get(
      `[data-colindex="0"][data-rowindex="0"] .t--inlined-cell-editor input.bp3-input`,
    ).should("not.exist");
    cy.wait(1000);
    cy.readTableV2data(0, 0).then((val) => {
      expect(val).to.not.equal(value);
      value = val;
    });
    cy.editTableCell(0, 0);
    cy.enterTableCellValue(0, 0, "someOtherNewValue");
    cy.openPropertyPane("tablewidgetv2");
    cy.get(
      `[data-colindex="0"][data-rowindex="0"] .t--inlined-cell-editor input.bp3-input`,
    ).should("not.exist");
    cy.wait(1000);
    cy.readTableV2data(0, 0).then((val) => {
      expect(val).to.not.equal(value);
    });
  });

  it("15. should check that updatedRows and updatedRowIndices have correct values", () => {
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(".t--property-control-text", `{{Table1.updatedRows}}`);
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    cy.editTableCell(0, 0);
    cy.enterTableCellValue(0, 0, "newValue");
    cy.saveTableCellValue(0, 0);
    cy.get(".t--widget-textwidget .bp3-ui-text").should(
      "contain",
      `[  {    "index": 0,    "updatedFields": {      "step": "newValue"    },    "allFields": {      "step": "newValue",      "task": "Drop a table",      "status": "✅"    }  }]`,
    );
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{Table1.updatedRowIndices}}`,
    );
    cy.get(".t--widget-textwidget .bp3-ui-text").should("contain", "[  0]");
  });

  it("16. should check that onsubmit event is available for the columns that are editable", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("step");
    [
      {
        columnType: "URL",
        expected: "not.exist",
      },
      {
        columnType: "Number",
        expected: "not.exist",
      },
      {
        columnType: "Date",
        expected: "not.exist",
      },
      {
        columnType: "Image",
        expected: "not.exist",
      },
      {
        columnType: "Video",
        expected: "not.exist",
      },
      {
        columnType: "Button",
        expected: "not.exist",
      },
      {
        columnType: "Menu button",
        expected: "not.exist",
      },
      {
        columnType: "Icon button",
        expected: "not.exist",
      },
      {
        columnType: "Plain text",
        expected: "not.exist",
      },
    ].forEach((data) => {
      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option")
        .children()
        .contains(data.columnType)
        .click();
      cy.wait("@updateLayout");
      cy.wait(500);
      cy.get(".t--property-control-onsubmit").should(data.expected);
    });

    cy.get(propPaneBack).click();
    cy.makeColumnEditable("step");
    cy.editColumn("step");

    [
      {
        columnType: "URL",
        expected: "not.exist",
      },
      {
        columnType: "Number",
        expected: "exist",
      },
      {
        columnType: "Date",
        expected: "not.exist",
      },
      {
        columnType: "Image",
        expected: "not.exist",
      },
      {
        columnType: "Video",
        expected: "not.exist",
      },
      {
        columnType: "Button",
        expected: "not.exist",
      },
      {
        columnType: "Menu button",
        expected: "not.exist",
      },
      {
        columnType: "Icon button",
        expected: "not.exist",
      },
      {
        columnType: "Plain text",
        expected: "exist",
      },
    ].forEach((data) => {
      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option")
        .children()
        .contains(data.columnType)
        .click();
      cy.wait("@updateLayout");
      cy.wait(500);
      cy.get(".t--property-control-onsubmit").should(data.expected);
    });
  });

  it("17. should check that onsubmit event is triggered when changes are saved", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    cy.editColumn("step");
    cy.getAlert("onSubmit", "Submitted!!");
    cy.editTableCell(0, 0);
    cy.enterTableCellValue(0, 0, "NewValue");
    cy.saveTableCellValue(0, 0);

    cy.get(widgetsPage.toastAction).should("be.visible");
    cy.get(widgetsPage.toastActionText)
      .last()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal("Submitted!!");
      });
  });

  it("18. should check that onSubmit events has access to edit values through triggeredRow", () => {
    const value = "newCellValue";
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    cy.editColumn("step");
    cy.getAlert("onSubmit", "{{Table1.triggeredRow.step}}");
    cy.editTableCell(0, 0);
    cy.enterTableCellValue(0, 0, value);
    cy.saveTableCellValue(0, 0);

    cy.get(widgetsPage.toastAction).should("be.visible");
    cy.get(widgetsPage.toastActionText)
      .last()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal(value);
      });
  });

  it("19. should check that onSave is working", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    cy.editColumn("EditActions1");
    //cy.get(".t--property-pane-section-collapse-savebutton").click({force:true});
    cy.get(".t--property-pane-section-collapse-discardbutton").click({
      force: true,
    });
    cy.getAlert("onSave", "Saved!!");
    cy.editTableCell(0, 0);
    cy.enterTableCellValue(0, 0, "NewValue");
    cy.openPropertyPane("tablewidgetv2");
    cy.saveTableRow(4, 0);
    cy.get(widgetsPage.toastAction).should("be.visible");
    cy.get(widgetsPage.toastActionText)
      .last()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal("Saved!!");
      });
  });

  it("20. should check that onSave events has access to edit values through triggeredRow", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    cy.editColumn("EditActions1");
    //cy.get(".t--property-pane-section-collapse-savebutton").click({force:true});
    cy.get(".t--property-pane-section-collapse-discardbutton").click({
      force: true,
    });
    cy.getAlert("onSave", "{{Table1.triggeredRow.step}}");
    /*
    cy.addSuccessMessage(
      "{{Table1.triggeredRow.step}}",
      ".t--property-control-onsave",
    );
    */
    cy.editTableCell(0, 0);
    cy.enterTableCellValue(0, 0, "NewValue");
    cy.openPropertyPane("tablewidgetv2");
    cy.saveTableRow(4, 0);
    cy.get(widgetsPage.toastAction).should("be.visible");
    cy.get(widgetsPage.toastActionText)
      .last()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal("NewValue");
      });
  });

  it("21. should check that onDiscard event is working", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    cy.editColumn("EditActions1");
    cy.get(".t--property-pane-section-collapse-savebutton").click();
    //cy.get(".t--property-pane-section-collapse-discardbutton").click();
    cy.getAlert("onDiscard", "discarded!!");
    cy.editTableCell(0, 0);
    cy.enterTableCellValue(0, 0, "NewValue");
    cy.openPropertyPane("tablewidgetv2");
    cy.discardTableRow(4, 0);
    cy.get(widgetsPage.toastAction).should("be.visible");
    cy.get(widgetsPage.toastActionText)
      .last()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal("discarded!!");
      });
  });

  it("22. should check that inline editing works with text wrapping disabled", () => {
    cy.fixture("Table/InlineEditingDSL").then((val) => {
      agHelper.AddDsl(val);
    });
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    cy.editTableCell(0, 0);
    cy.get(
      "[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor input.bp3-input",
    ).should("not.be.disabled");
  });

  it("23. should check that inline editing works with text wrapping enabled", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    cy.editColumn("step");
    cy.get(".t--property-control-cellwrapping .ads-v2-switch")
      .first()
      .click({ force: true });
    cy.editTableCell(0, 0);
    cy.get(
      "[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor input.bp3-input",
    ).should("not.be.disabled");
  });

  it("24. should check that doesn't grow taller when text wrapping is disabled", () => {
    entityExplorer.SelectEntityByName("Table1");
    table.EnableEditableOfColumn("step");
    table.EditTableCell(0, 0, "", false);
    agHelper.GetHeight(table._editCellEditor);
    cy.get("@eleHeight").then(($initiaHeight) => {
      expect(Number($initiaHeight)).to.eq(28);
      table.EditTableCell(
        1,
        0,
        "this is a very long cell value to check the height of the cell is growing accordingly",
        false,
      );
      agHelper.GetHeight(table._editCellEditor);
      cy.get("@eleHeight").then(($newHeight) => {
        expect(Number($newHeight)).to.eq(Number($initiaHeight));
      });
    });
  });

  it("25. should check that grows taller when text wrapping is enabled", () => {
    entityExplorer.SelectEntityByName("Table1");
    table.EnableEditableOfColumn("step");
    table.EditColumn("step");
    propPane.TogglePropertyState("Cell Wrapping", "On");
    table.EditTableCell(
      0,
      0,
      "this is a very long cell value to check the height of the cell is growing accordingly",
      false,
    );
    agHelper.GetHeight(table._editCellEditor);
    cy.get("@eleHeight").then(($newHeight) => {
      expect(Number($newHeight)).to.be.greaterThan(34);
    });
  });

  it("26. should check if updatedRowIndex is getting updated for single row update mode", () => {
    cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
    cy.get(".t--widget-textwidget").should("exist");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{Table1.updatedRowIndex}}`,
    );

    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 300 });
    cy.get(".t--widget-buttonwidget").should("exist");
    cy.get(PROPERTY_SELECTOR.onClick).find(".t--js-toggle").click();
    cy.updateCodeInput(".t--property-control-label", "Reset");
    cy.updateCodeInput(
      PROPERTY_SELECTOR.onClick,
      `{{resetWidget("Table1",true)}}`,
    );

    // case 1: check if updatedRowIndex has -1 as the default value:
    cy.get(commonlocators.textWidgetContainer).should("contain.text", -1);

    cy.openPropertyPane("tablewidgetv2");

    cy.makeColumnEditable("step");
    cy.wait(1000);

    // case 2: check if updatedRowIndex is 0, when cell at row 0 is updated.
    cy.editTableCell(0, 0);
    cy.enterTableCellValue(0, 0, "#12").type("{enter}");
    cy.get(commonlocators.textWidgetContainer).should("contain.text", 0);

    // case 3: check if updatedRowIndex is -1 when changes are discarded.
    cy.discardTableRow(4, 0);
    cy.get(commonlocators.textWidgetContainer).should("contain.text", -1);

    // case 4: check if the updateRowIndex is -1 when widget is reset
    cy.editTableCell(0, 1);
    cy.enterTableCellValue(0, 1, "#13").type("{enter}");
    cy.contains("Reset").click({ force: true });
    cy.get(commonlocators.textWidgetContainer).should("contain.text", -1);

    // case 5: check if the updatedRowIndex changes to -1 when the table data changes.
    cy.wait(1000);
    cy.editTableCell(0, 2);
    cy.enterTableCellValue(0, 2, "#14").type("{enter}");
    cy.openPropertyPane("tablewidgetv2");
    cy.get(widgetsPage.tabedataField).type("{backspace}");
    cy.wait(300);
    cy.get(commonlocators.textWidgetContainer).should("contain.text", -1);
  });

  it("27. should check if updatedRowIndex is getting updated for multi row update mode", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 400, 400);
    cy.get(".t--widget-textwidget").should("exist");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{Table1.updatedRowIndex}}`,
    );
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 300, 300);
    cy.get(".t--widget-buttonwidget").should("exist");
    cy.get(PROPERTY_SELECTOR.onClick).find(".t--js-toggle").click();
    cy.updateCodeInput(".t--property-control-label", "Reset");
    cy.updateCodeInput(
      PROPERTY_SELECTOR.onClick,
      `{{resetWidget("Table1",true)}}`,
    );

    entityExplorer.NavigateToSwitcher("Explorer");
    entityExplorer.SelectEntityByName("Table1");
    table.EnableEditableOfColumn("step");
    agHelper.GetNClick(table._updateMode("Multi"));

    // case 1: check if updatedRowIndex is 0, when cell at row 0 is updated.
    table.EditTableCell(0, 0, "#12");
    cy.get(commonlocators.textWidgetContainer).should("contain.text", 0);

    // case 2: check if the updateRowIndex is -1 when widget is reset
    table.EditTableCell(1, 0, "#13");
    cy.get(commonlocators.textWidgetContainer).should("contain.text", 1);

    cy.contains("Reset").click({ force: true });
    cy.get(commonlocators.textWidgetContainer).should("contain.text", -1);

    // case 3: check if the updatedRowIndex changes to -1 when the table data changes.
    cy.wait(1000);
    table.EditTableCell(2, 0, "#14");
    cy.get(commonlocators.textWidgetContainer).should("contain.text", 2);
    cy.openPropertyPane("tablewidgetv2");
    cy.get(widgetsPage.tabedataField).type("{backspace}");
    cy.wait(300);
    cy.get(commonlocators.textWidgetContainer).should("contain.text", -1);
  });
});
