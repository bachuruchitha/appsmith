import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { get, isFunction } from "lodash";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { getType, Types } from "utils/TypeHelpers";
import { Def } from "tern";
import {
  isAction,
  isAppsmithEntity,
  isJSAction,
  isTrueObject,
  isWidget,
} from "workers/evaluationUtils";
import { DataTreeDefEntityInformation } from "utils/autocomplete/TernServer";
import { Variable } from "entities/JSCollection";

// When there is a complex data type, we store it in extra def and refer to it
// in the def
let extraDefs: Def = {};
// Def names are encoded with information about the entity
// This so that we have more info about them
// when sorting results in autocomplete
// DATA_TREE.{entityType}.{entitySubType}.{entityName}
// eg DATA_TREE.WIDGET.TABLE_WIDGET_V2.Table1
// or DATA_TREE.ACTION.ACTION.Api1
export const dataTreeTypeDefCreator = (
  dataTree: DataTree,
  isJSEditorEnabled: boolean,
): { def: Def; entityInfo: Map<string, DataTreeDefEntityInformation> } => {
  const def: Def = {
    "!name": "DATA_TREE",
  };
  const entityMap: Map<string, DataTreeDefEntityInformation> = new Map();

  Object.entries(dataTree).forEach(([entityName, entity]) => {
    if (isWidget(entity)) {
      const widgetType = entity.type;
      if (widgetType in entityDefinitions) {
        const definition = get(entityDefinitions, widgetType);
        if (isFunction(definition)) {
          def[entityName] = definition(entity);
        } else {
          def[entityName] = definition;
        }
        flattenDef(def, entityName);
        entityMap.set(entityName, {
          type: ENTITY_TYPE.WIDGET,
          subType: widgetType,
        });
      }
    } else if (isAction(entity)) {
      def[entityName] = entityDefinitions.ACTION(entity);
      flattenDef(def, entityName);
      entityMap.set(entityName, {
        type: ENTITY_TYPE.ACTION,
        subType: "ACTION",
      });
    } else if (isAppsmithEntity(entity)) {
      def.appsmith = (entityDefinitions.APPSMITH as any)(entity);
      entityMap.set("appsmith", {
        type: ENTITY_TYPE.APPSMITH,
        subType: ENTITY_TYPE.APPSMITH,
      });
    } else if (isJSAction(entity) && isJSEditorEnabled) {
      const metaObj = entity.meta;
      const jsProperty: Def = {};

      for (const key in metaObj) {
        const jsFunctionObj = metaObj[key];
        const { arguments: args } = jsFunctionObj;
        const argsTypeString = getFunctionsArgsType(args);

        jsProperty[key] = argsTypeString;
      }

      for (let i = 0; i < entity.variables.length; i++) {
        const varKey = entity.variables[i];
        const varValue = entity[varKey];
        jsProperty[varKey] = generateTypeDef(varValue);
      }

      def[entityName] = jsProperty;
      flattenDef(def, entityName);
      entityMap.set(entityName, {
        type: ENTITY_TYPE.JSACTION,
        subType: "JSACTION",
      });
    }
    if (Object.keys(extraDefs)) {
      def["!define"] = { ...extraDefs };
      extraDefs = {};
    }
  });

  return { def, entityInfo: entityMap };
};

export function generateTypeDef(obj: any): string | Def {
  const type = getType(obj);
  switch (type) {
    case Types.ARRAY: {
      const arrayType = getType(obj[0]);
      return `[${arrayType}]`;
    }
    case Types.OBJECT: {
      const objType: Def = {};
      Object.keys(obj).forEach((k) => {
        objType[k] = generateTypeDef(obj[k]);
      });
      return objType;
    }
    case Types.STRING:
      return "string";
    case Types.NUMBER:
      return "number";
    case Types.BOOLEAN:
      return "bool";
    case Types.NULL:
    case Types.UNDEFINED:
      return "?";
    default:
      return "?";
  }
}

export const flattenDef = (def: Def, entityName: string): Def => {
  const flattenedDef = def;
  if (isTrueObject(def[entityName])) {
    Object.entries(def[entityName]).forEach(([key, value]) => {
      if (!key.startsWith("!")) {
        flattenedDef[`${entityName}.${key}`] = value;
        if (isTrueObject(value)) {
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (!subKey.startsWith("!")) {
              flattenedDef[`${entityName}.${key}.${subKey}`] = subValue;
            }
          });
        }
      }
    });
  }
  return flattenedDef;
};

/*
test cases 
const metaObj: typeof entity.meta = {
        myFunc1: {
          confirmBeforeExecute: false,
          isAsync: false,
          arguments: [
            { name: "a", value: undefined },
            { name: "b", value: undefined },
            { name: "d", value: undefined },
            { name: "er", value: undefined },
          ],
        },
        myFunc2: {
          confirmBeforeExecute: false,
          isAsync: false,
          arguments: [],
        },
        myFunc12: {
          confirmBeforeExecute: false,
          isAsync: false,
          arguments: [
            { name: "a", value: undefined },
            { name: "b", value: undefined },
          ],
        },
      };
*/
const getFunctionsArgsType = (args: Variable[]): string => {
  // skip same name args to avoiding creating invalid type
  const argNames = new Set<string>();
  args.map((arg) => {
    argNames.add(arg.name);
  });
  const argNamesArray = [...argNames];
  const argsTypeString = argNamesArray.reduce(
    (accumulatedArgType, argName, currentIndex) => {
      switch (currentIndex) {
        case 0:
          return `${argName}: ?`;
        case 1:
          return `${accumulatedArgType}, ${argName}: ?`;
        default:
          return `${accumulatedArgType}, ${argName}: ?`;
      }
    },
    argNamesArray[0],
  );
  return argsTypeString ? `fn(${argsTypeString})` : `fn()`;
};
