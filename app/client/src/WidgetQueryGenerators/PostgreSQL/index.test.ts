import PostgreSQL from ".";

describe("PostgreSQL WidgetQueryGenerator", () => {
  const initialValues = {
    actionConfiguration: {
      pluginSpecifiedTemplates: [{ value: true }],
    },
  };
  test("should build select form data correctly", () => {
    const expr = PostgreSQL.build(
      {
        select: {
          limit: "data_table.pageSize",
          where: 'data_table.searchText || ""',
          offset: "(data_table.pageNo - 1) * data_table.pageSize",
          orderBy: "data_table.sortOrder.column",
          sortOrder: "data_table.sortOrder.order || 'ASC'",
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "genres",
      },
      initialValues,
    );

    const res = `SELECT
  *
FROM
  someTable
WHERE
  \"title\" ilike '%{{data_table.searchText || \"\"}}%'
ORDER BY
  \"{{data_table.sortOrder.column || 'genres'}}\" {{data_table.sortOrder.order || 'ASC' ? \"\" : \"DESC\"}}
LIMIT
  {{data_table.pageSize}}
OFFSET
  {{(data_table.pageNo - 1) * data_table.pageSize}}`;

    expect(expr).toEqual([
      {
        name: "Select_query",
        type: "select",
        dynamicBindingPathList: [
          {
            key: "body",
          },
        ],
        payload: {
          pluginSpecifiedTemplates: [{ value: false }],
          body: res,
        },
      },
    ]);
  });

  test("should build select form data correctly without primary column", () => {
    const expr = PostgreSQL.build(
      {
        select: {
          limit: "data_table.pageSize",
          where: 'data_table.searchText || ""',
          offset: "(data_table.pageNo - 1) * data_table.pageSize",
          orderBy: "data_table.sortOrder.column",
          sortOrder: `data_table.sortOrder.order !== "desc"`,
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "",
      },
      initialValues,
    );

    const res = `SELECT
  *
FROM
  someTable
WHERE
  \"title\" ilike '%{{data_table.searchText || \"\"}}%' {{data_table.sortOrder.column ? "ORDER BY " + data_table.sortOrder.column + "  " + (data_table.sortOrder.order !== "desc" ? "" : "DESC") : ""}}
LIMIT
  {{data_table.pageSize}}
OFFSET
  {{(data_table.pageNo - 1) * data_table.pageSize}}`;

    expect(expr).toEqual([
      {
        name: "Select_query",
        type: "select",
        dynamicBindingPathList: [
          {
            key: "body",
          },
        ],
        payload: {
          pluginSpecifiedTemplates: [{ value: false }],
          body: res,
        },
      },
    ]);
  });

  test("should not build update form data without primary key ", () => {
    const expr = PostgreSQL.build(
      {
        update: {
          value: `update_form.fieldState'`,
          where: `"id" = {{data_table.selectedRow.id}}`,
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: ["id", "name"],
        primaryColumn: "",
      },
      initialValues,
    );

    expect(expr).toEqual([]);
  });

  test("should build update form data correctly ", () => {
    const expr = PostgreSQL.build(
      {
        update: {
          value: `update_form.fieldState'`,
          where: `data_table.selectedRow`,
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: ["id", "name"],
        primaryColumn: "id",
      },
      initialValues,
    );

    expect(expr).toEqual([
      {
        name: "Update_query",
        type: "update",
        dynamicBindingPathList: [
          {
            key: "body",
          },
        ],
        payload: {
          body: "UPDATE someTable SET \"id\"= '{{update_form.fieldState'.id}}', \"name\"= '{{update_form.fieldState'.name}}' WHERE \"id\"= {{data_table.selectedRow.id}};",
          pluginSpecifiedTemplates: [{ value: false }],
        },
      },
    ]);
  });

  test("should not build insert form data without primary key ", () => {
    const expr = PostgreSQL.build(
      {
        create: {
          value: `update_form.fieldState`,
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        // ignore columns
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: ["id", "name"],
        primaryColumn: "",
      },
      initialValues,
    );
    expect(expr).toEqual([]);
  });

  test("should build insert form data correctly ", () => {
    const expr = PostgreSQL.build(
      {
        create: {
          value: `update_form.fieldState`,
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        // ignore columns
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: ["id", "name"],
        primaryColumn: "id",
      },
      initialValues,
    );
    expect(expr).toEqual([
      {
        name: "Insert_query",
        type: "create",
        dynamicBindingPathList: [
          {
            key: "body",
          },
        ],
        payload: {
          body: "INSERT INTO someTable (\"id\",\"name\") VALUES ('{{update_form.fieldState.id}}','{{update_form.fieldState.name}}')",
          pluginSpecifiedTemplates: [{ value: false }],
        },
      },
    ]);
  });
});
