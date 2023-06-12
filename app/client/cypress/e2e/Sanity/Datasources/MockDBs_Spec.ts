import * as _ from "../../../support/Objects/ObjectsCore";
let dsName: any;

describe(
  "excludeForAirgap",
  "Validate Mock Query Active Ds querying & count",
  () => {
    it("1. Create Query from Mock Mongo DB & verify active queries count", () => {
      _.dataSources.CreateMockDB("Movies").then((mockDBName) => {
        dsName = mockDBName;
        _.dataSources.CreateQueryFromActiveTab(mockDBName, false);
        _.dataSources.ValidateNSelectDropdown("Commands", "Find document(s)");
        _.agHelper.EnterValue("movies", {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Collection",
        });
        _.dataSources.RunQueryNVerifyResponseViews(10, false);
        _.dataSources.NavigateToActiveTab();
        _.agHelper
          .GetText(_.dataSources._queriesOnPageText(mockDBName))
          .then(($queryCount) =>
            expect($queryCount).to.eq("1 query on this page"),
          );

        _.entityExplorer.CreateNewDsQuery(mockDBName);
        _.dataSources.ValidateNSelectDropdown("Commands", "Find document(s)");
        _.agHelper.EnterValue("movies", {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Collection",
        });
        _.dataSources.RunQueryNVerifyResponseViews(10, false);
        _.dataSources.NavigateToActiveTab();
        _.agHelper
          .GetText(_.dataSources._queriesOnPageText(mockDBName))
          .then(($queryCount) =>
            expect($queryCount).to.eq("2 queries on this page"),
          );
      });
    });

    it("2. Create Query from Mock Postgres DB & verify active queries count", () => {
      _.dataSources.CreateMockDB("Users").then((mockDBName) => {
        dsName = mockDBName;
        _.dataSources.CreateQueryFromActiveTab(mockDBName, false);
        // Resetting the default query and rewriting a new one
        _.dataSources.EnterQuery("");
        _.dataSources.EnterQuery("SELECT * FROM users LIMIT 10");
        _.dataSources.RunQueryNVerifyResponseViews(10);
        _.dataSources.NavigateToActiveTab();
        _.agHelper
          .GetText(_.dataSources._queriesOnPageText(mockDBName))
          .then(($queryCount) =>
            expect($queryCount).to.eq("1 query on this page"),
          );

        _.entityExplorer.CreateNewDsQuery(mockDBName);
        // Resetting the default query and rewriting a new one
        _.dataSources.EnterQuery("");
        _.dataSources.EnterQuery("SELECT * FROM users LIMIT 10");
        _.dataSources.RunQueryNVerifyResponseViews(10, false);
        _.dataSources.NavigateToActiveTab();
        _.agHelper
          .GetText(_.dataSources._queriesOnPageText(mockDBName))
          .then(($queryCount) =>
            expect($queryCount).to.eq("2 queries on this page"),
          );
      });
    });

    afterEach(() => {
      _.entityExplorer.ExpandCollapseEntity("Queries/JS");
      _.entityExplorer.ActionContextMenuByEntityName(
        "Query1",
        "Delete",
        "Are you sure?",
      );
      _.entityExplorer.ActionContextMenuByEntityName(
        "Query2",
        "Delete",
        "Are you sure?",
      );
      _.dataSources.NavigateToActiveTab();
      _.agHelper
        .GetText(_.dataSources._queriesOnPageText(dsName))
        .then(($queryCount) =>
          expect($queryCount).to.eq(
            "No query in this application is using this datasource",
          ),
        );
      _.dataSources.DeleteDatasouceFromActiveTab(dsName);
    });
  },
);
