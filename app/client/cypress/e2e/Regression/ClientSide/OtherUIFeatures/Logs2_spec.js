import commonlocators from "../../../../locators/commonlocators.json";
import * as _ from "../../../../support/Objects/ObjectsCore";

let logString;

const generateTestLogString = () => {
  const randString = Cypress._.random(0, 1e4);
  const logString = `Test ${randString}`;
  return logString;
};

describe("Debugger logs", function () {
  this.beforeEach(() => {
    logString = generateTestLogString();
  });

  it("1. Console log on text widget with normal moustache binding", function () {
    _.entityExplorer.NavigateToSwitcher("Widgets");
    _.entityExplorer.DragDropWidgetNVerify("textwidget", 400, 400);
    _.propPane.UpdatePropertyFieldValue(
      "Text",
      `{{(function(){
  	const temp = "Hello!"

  	console.log("${logString}");
  	return temp;
  })()}}`,
    );
    _.agHelper.RefreshPage();
    // Wait for the debugger icon to be visible
    _.agHelper.AssertElementVisible(".t--debugger-count");
    _.debuggerHelper.ClickDebuggerIcon();
    _.agHelper.GetNClick(_.jsEditor._logsTab);
    _.debuggerHelper.DoesConsoleLogExist(logString);
  });

  it("2. Console log in sync function", function () {
    _.entityExplorer.NavigateToSwitcher("Explorer");
    _.jsEditor.CreateJSObject(
      `export default {
        myFun1: () => {
  	      console.log("${logString}");
  	      return "sync";
        },
        myFun2: () => {
          return 1;
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: true,
        shouldCreateNewJSObj: true,
        prettify: false,
      },
    );
    _.agHelper.GetNClick(_.jsEditor._logsTab);
    _.debuggerHelper.DoesConsoleLogExist(logString);
  });

  it("3. Console log in async function", function () {
    _.entityExplorer.NavigateToSwitcher("Explorer");
    _.jsEditor.CreateJSObject(
      `export default {
        myFun1: async () => {
  	      console.log("${logString}");
  	      return "async";
        },
        myFun2: () => {
          return 1;
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: false,
        prettify: false,
      },
    );

    // Edit JSObject and verify no logs are visible
    _.jsEditor.EditJSObj(`export default {
      myFun1: async () => {
        console.log("${logString}");
        return "async";
      },
      myFun2: () => {
        return 2;
      }
    }`);
    _.debuggerHelper.DoesConsoleLogExist(logString, false);

    // Run function and verify logs are visible
    _.agHelper.GetNClick(_.jsEditor._runButton);
    _.agHelper.GetNClick(_.jsEditor._logsTab);
    _.debuggerHelper.DoesConsoleLogExist(logString);
  });

  it("4. Console log after API succedes", function () {
    _.entityExplorer.NavigateToSwitcher("Explorer");
    cy.fixture("testdata").then(function (dataSet) {
      _.apiPage.CreateAndFillApi(dataSet.baseUrl + dataSet.methods, "Api1");
    });
    const returnText = "success";
    _.jsEditor.CreateJSObject(
      `export default {
        myFun1: async () => {
          return storeValue("test", "test").then(() => {
            console.log("${logString} Started");
            return Api1.run().then(()=>{
              console.log("${logString} Success");
              return "${returnText}";
            }).catch(()=>{
              console.log("${logString} Failed");
              return "fail";
            });
          });
        },
        myFun2: () => {
          return 1;
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );

    cy.get("@jsObjName").then((jsObjName) => {
      _.agHelper.Sleep(2000);
      _.jsEditor.RunJSObj();
      _.agHelper.GetNClick(_.jsEditor._logsTab);
      _.debuggerHelper.DoesConsoleLogExist(`${logString} Started`);
      _.debuggerHelper.DoesConsoleLogExist(`${logString} Success`);
      _.entityExplorer.DragDropWidgetNVerify("textwidget", 200, 600);
      _.propPane.UpdatePropertyFieldValue(
        "Text",
        `{{${jsObjName}.myFun1.data}}`,
      );
      _.agHelper.GetNAssertElementText(
        commonlocators.textWidgetContainer,
        returnText,
        "have.text",
        1,
      );
    });
  });

  it("5. Console log after API execution fails", function () {
    _.entityExplorer.NavigateToSwitcher("Explorer");
    cy.fixture("testdata").then(function (dataSet) {
      _.apiPage.CreateAndFillApi(
        dataSet.baseUrl + dataSet.methods + "xyz",
        "Api2",
      );
    });
    _.jsEditor.CreateJSObject(
      `export default {
        myFun1: async () => {
          console.log("${logString} Started");
          return Api2.run().then(()=>{
            console.log("${logString} Success");
            return "success";
          }).catch(()=>{
            console.log("${logString} Failed");
            return "fail";
          });
        },
        myFun2: () => {
          return 1;
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    _.jsEditor.RunJSObj();
    _.agHelper.GetNClick(_.jsEditor._logsTab);
    _.debuggerHelper.DoesConsoleLogExist(`${logString} Started`);
    _.debuggerHelper.DoesConsoleLogExist(`${logString} Failed`);
  });

  it("6. Console log source inside nested function", function () {
    _.jsEditor.CreateJSObject(
      `export default {
        myFun1: async () => {
          console.log("Parent ${logString}");
          return Api1.run(()=>{console.log("Child ${logString}");});
        },
        myFun2: () => {
          return 1;
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: false,
      },
    );
    _.jsEditor.RunJSObj();
    _.agHelper.GetNClick(_.jsEditor._logsTab);
    _.debuggerHelper.DoesConsoleLogExist(`Parent ${logString}`);
    _.debuggerHelper.DoesConsoleLogExist(`Child ${logString}`);
  });

  it("7. Console log grouping", function () {
    _.jsEditor.CreateJSObject(
      `export default {
        myFun1: async () => {
          console.log("${logString}");
          console.log("${logString}");
          console.log("${logString}");
          console.log("${logString}");
          console.log("${logString}");
        },
        myFun2: () => {
          return 1;
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    _.jsEditor.RunJSObj();
    _.agHelper.GetNClick(_.jsEditor._logsTab);
    _.debuggerHelper.DoesConsoleLogExist(`${logString}`);
    _.debuggerHelper.AssertConsecutiveConsoleLogCount(5);
  });

  it("8. Console log should not mutate the passed object", function () {
    _.entityExplorer.NavigateToSwitcher("Explorer");
    _.jsEditor.CreateJSObject(
      `export default {
        myFun1: () => {
  	      let data = [];
          console.log("start:", data);
          for(let i=0; i<5; i++)
            data.push(i);
          console.log("end:", JSON.stringify(data));
          return data;
        },
        myFun2: () => {
          return 1;
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: true,
        shouldCreateNewJSObj: true,
        prettify: false,
      },
    );
    _.agHelper.GetNClick(_.jsEditor._logsTab);
    _.debuggerHelper.DoesConsoleLogExist("start: []");
    _.debuggerHelper.DoesConsoleLogExist("end: [0,1,2,3,4]");
  });

  it("9. Bug #19115 - Objects that start with an underscore `_JSObject1` fail to be navigated from the debugger", function () {
    const JSOBJECT_WITH_UNNECCESARY_SEMICOLON = `export default {
        myFun1: () => {
            //write code here
            if (1) {
                return true;;
            };
        }
    }
    `;

    _.jsEditor.CreateJSObject(JSOBJECT_WITH_UNNECCESARY_SEMICOLON, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.agHelper.GetNClick(_.locators._errorTab);

    _.debuggerHelper.ClicklogEntityLink(0);

    cy.get(".t--js-action-name-edit-field").should("exist");
  });
});
