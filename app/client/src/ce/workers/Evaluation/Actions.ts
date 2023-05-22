/* eslint-disable @typescript-eslint/ban-types */

import set from "lodash/set";
import type {
  ConfigTree,
  DataTree,
  DataTreeEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import type { EvalContext } from "workers/Evaluation/evaluate";
import type { EvaluationVersion } from "@appsmith/api/ApplicationApi";
import { addFn } from "workers/Evaluation/fns/utils/fnGuard";
import {
  entityFns,
  getPlatformFunctions,
} from "@appsmith/workers/Evaluation/fns";
import { getEntityForEvalContext } from "workers/Evaluation/getEntityForContext";
import { klona } from "klona/full";
import { isEmpty } from "lodash";
import { dataTreeEvaluator } from "workers/Evaluation/handlers/evalTree";
import { applySetterMethod } from "workers/Evaluation/setters";
declare global {
  /** All identifiers added to the worker global scope should also
   * be included in the DEDICATED_WORKER_GLOBAL_SCOPE_IDENTIFIERS in
   * app/client/src/constants/WidgetValidation.ts
   * */

  interface Window {
    $isDataField: boolean;
    $isAsync: boolean;
    $evaluationVersion: EvaluationVersion;
    $cloudHosting: boolean;
  }
}

export enum ExecutionType {
  PROMISE = "PROMISE",
  TRIGGER = "TRIGGER",
}

function getEntityMethodFromConfig(entityConfig: DataTreeEntityConfig) {
  const setterMethodMap: Record<string, any> = {};
  if (!entityConfig) return setterMethodMap;

  if (entityConfig.__setters) {
    for (const setterMethodName of Object.keys(entityConfig.__setters)) {
      const path = entityConfig.__setters[setterMethodName].path;

      setterMethodMap[setterMethodName] = function (value: any) {
        if (!dataTreeEvaluator) return;

        return applySetterMethod(path, value);
      };
    }
  }

  return setterMethodMap;
}

/**
 * This method returns new dataTree with entity function and platform function
 */
export const addDataTreeToContext = (args: {
  EVAL_CONTEXT: EvalContext;
  dataTree: Readonly<DataTree>;
  removeEntityFunctions?: boolean;
  isTriggerBased: boolean;
  configTree: ConfigTree;
}) => {
  const {
    configTree,
    dataTree,
    EVAL_CONTEXT,
    isTriggerBased,
    removeEntityFunctions = false,
  } = args;
  const dataTreeEntries = Object.entries(dataTree);
  const entityFunctionCollection: Record<string, Record<string, Function>> = {};

  for (const [entityName, entity] of dataTreeEntries) {
    EVAL_CONTEXT[entityName] = getEntityForEvalContext(entity, entityName);
    if (!removeEntityFunctions && !isTriggerBased) continue;

    for (const entityFn of entityFns) {
      if (!entityFn.qualifier(entity)) continue;
      const func = entityFn.fn(entity, entityName);
      const fullPath = `${entityFn.path || `${entityName}.${entityFn.name}`}`;
      set(entityFunctionCollection, fullPath, func);
    }

    const entityConfig = configTree[entityName];
    const entityMethodMap = getEntityMethodFromConfig(entityConfig);
    if (isEmpty(entityMethodMap)) continue;
    EVAL_CONTEXT[entityName] = Object.assign(
      {},
      dataTree[entityName],
      entityMethodMap,
    );
  }

  if (removeEntityFunctions)
    return removeEntityFunctionsFromEvalContext(
      entityFunctionCollection,
      EVAL_CONTEXT,
    );

  // if eval is not trigger based i.e., sync eval then we skip adding entity and platform function to evalContext
  if (!isTriggerBased) return;

  for (const [entityName, funcObj] of Object.entries(
    entityFunctionCollection,
  )) {
    EVAL_CONTEXT[entityName] = Object.assign(
      {},
      EVAL_CONTEXT[entityName],
      funcObj,
    );
  }
};

export const addPlatformFunctionsToEvalContext = (context: any) => {
  for (const fnDef of getPlatformFunctions(self.$cloudHosting)) {
    addFn(context, fnDef.name, fnDef.fn.bind(context));
  }
};

export const getAllAsyncFunctions = (dataTree: DataTree) => {
  const asyncFunctionNameMap: Record<string, true> = {};
  const dataTreeEntries = Object.entries(dataTree);
  for (const [entityName, entity] of dataTreeEntries) {
    for (const entityFn of entityFns) {
      if (!entityFn.qualifier(entity)) continue;
      const fullPath = `${entityFn.path || `${entityName}.${entityFn.name}`}`;
      asyncFunctionNameMap[fullPath] = true;
    }
  }
  for (const platformFn of getPlatformFunctions(self.$cloudHosting)) {
    asyncFunctionNameMap[platformFn.name] = true;
  }
  return asyncFunctionNameMap;
};

export const removeEntityFunctionsFromEvalContext = (
  entityFunctionCollection: Record<string, Record<string, Function>>,
  evalContext: EvalContext,
) => {
  for (const [entityName, funcObj] of Object.entries(
    entityFunctionCollection,
  )) {
    const entity = klona(evalContext[entityName]);
    Object.keys(funcObj).forEach((entityFn) => {
      delete entity[entityFn];
    });
    evalContext[entityName] = entity;
  }
};
