import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { APP_MODE } from "entities/App";
import { find, get, isString } from "lodash";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import type { TEntity } from "Linting/lib/entity";
import { isJSEntity } from "Linting/lib/entity";
import { isJSFunctionProperty } from "@shared/ast";
import { AppsmithFunctionsWithFields } from "components/editorComponents/ActionCreator/constants";
import type { TEntityTree, TEntityTreeWithParsedJS } from "./entityTree";
import DependencyMap from "entities/DependencyMap";
import { getAllPathsFromNode } from "./entityPath";
import { lintingDependencyMap } from "./lintingDependencyMap";
import { getParsedJSEntity } from "./parseJSEntity";

function isDataField(fullPath: string, entityTree: TEntityTree) {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
  const entity = find(entityTree, entityName);
  if (!entity) return false;
  const entityConfig = entity.getConfig();
  if (entityConfig && "triggerPaths" in entityConfig) {
    return !(propertyPath in entityConfig.triggerPaths);
  }
  return false;
}
export class AsyncJsFunctionInDataField {
  private dependencyMap = new DependencyMap();
  private isDisabled = true;
  initialize(appMode: APP_MODE | undefined) {
    this.isDisabled = !(appMode === APP_MODE.EDIT);
  }

  update(
    fullPath: string,
    referencesInPath: string[],
    entityTree: TEntityTree,
  ) {
    if (this.isDisabled) return [];

    const { entityName } = getEntityNameAndPropertyPath(fullPath);
    const entity = find(entityTree, entityName);
    // Only datafields can cause updates
    if (!entity || !isDataField(fullPath, entityTree)) return [];

    const asyncJSFunctionsInvokedInPath = getAsyncJSFunctionInvocationsInPath(
      entity,
      referencesInPath,
      fullPath,
    );
    const pathsToAdd = asyncJSFunctionsInvokedInPath.reduce(
      (paths: Record<string, true>, currentPath) => {
        return { ...paths, [currentPath]: true } as const;
      },
      { [fullPath]: true } as Record<string, true>,
    );
    this.dependencyMap.addNodes(pathsToAdd);

    const currentNodeDependencies = [
      ...(this.dependencyMap.getDependencies().get(fullPath) || []),
    ];

    const updatedDependencies = asyncJSFunctionsInvokedInPath
      .filter((x) => !currentNodeDependencies.includes(x))
      .concat(
        currentNodeDependencies.filter(
          (x) => !asyncJSFunctionsInvokedInPath.includes(x),
        ),
      );
    this.dependencyMap.addDependency(fullPath, asyncJSFunctionsInvokedInPath);
    return updatedDependencies;
  }

  handlePathDeletion(
    deletedPath: string,
    entityTree: TEntityTree,
    entityTreeWithParsedJS: TEntityTreeWithParsedJS,
  ) {
    if (this.isDisabled) return [];
    const updatedJSFns = new Set<string>();
    const { entityName } = getEntityNameAndPropertyPath(deletedPath);
    const entity = find(entityTree, entityName);
    if (!entity) return [];

    const allDeletedPaths = getAllPathsFromNode(
      deletedPath,
      entityTreeWithParsedJS,
    );

    for (const path of Object.keys(allDeletedPaths)) {
      const pathDependencies = this.dependencyMap.getDependencies().get(path);
      if (!pathDependencies) continue;
      pathDependencies.forEach((funcName) => updatedJSFns.add(funcName));
    }
    this.dependencyMap.removeNodes(allDeletedPaths);

    return Array.from(updatedJSFns);
  }
  handlePathEdit(
    editedPath: string,
    dependenciesInPath: string[],
    entityTree: TEntityTree,
  ) {
    if (this.isDisabled) return [];
    let updatedJSFns: string[] = [];
    const { entityName } = getEntityNameAndPropertyPath(editedPath);
    const entity = find(entityTree, entityName);
    if (!entity) return;

    if (isJSEntity(entity)) {
      if (isAsyncJSFunction(editedPath)) {
        this.dependencyMap.addNodes({ [editedPath]: true });
      } else {
        this.dependencyMap.removeNodes({ [editedPath]: true });
      }
    } else {
      const updatedPaths = this.update(
        editedPath,
        dependenciesInPath,
        entityTree,
      );
      updatedJSFns = [...updatedJSFns, ...updatedPaths];
    }
    return updatedJSFns;
  }

  getMap() {
    return this.dependencyMap.getDependenciesInverse();
  }
}

function getAsyncJSFunctionInvocationsInPath(
  entity: TEntity,
  dependencies: string[],
  fullPath: string,
) {
  const invokedAsyncJSFunctions = new Set<string>();
  const { propertyPath } = getEntityNameAndPropertyPath(fullPath);
  const unevalPropValue = get(entity.getRawEntity(), propertyPath);

  dependencies.forEach((dependant) => {
    if (
      isAsyncJSFunction(dependant) &&
      isFunctionInvoked(dependant, unevalPropValue)
    ) {
      invokedAsyncJSFunctions.add(dependant);
    }
  });

  return Array.from(invokedAsyncJSFunctions);
}

function getFunctionInvocationRegex(funcName: string) {
  return new RegExp(`${funcName}[.call | .apply]*\s*\\(.*?\\)`, "g");
}

export function isFunctionInvoked(
  functionName: string,
  unevalPropValue: unknown,
) {
  if (!isString(unevalPropValue)) return false;
  const { jsSnippets } = getDynamicBindings(unevalPropValue);
  for (const jsSnippet of jsSnippets) {
    if (!jsSnippet.includes(functionName)) continue;
    const isInvoked = getFunctionInvocationRegex(functionName).test(jsSnippet);
    if (isInvoked) return true;
  }
  return false;
}

// TODO: Add dependencies on Entity functions and Setter functions
export function isAsyncJSFunction(jsFnFullname: string) {
  const { entityName: jsObjectName, propertyPath } =
    getEntityNameAndPropertyPath(jsFnFullname);
  const parsedJSEntity = getParsedJSEntity(jsObjectName);
  if (!parsedJSEntity) return false;
  const propertyConfig = find(
    parsedJSEntity.getParsedEntityConfig(),
    propertyPath,
  );
  if (!propertyConfig || !isJSFunctionProperty(propertyConfig)) return false;
  return (
    propertyConfig.isMarkedAsync ||
    lintingDependencyMap.isRelated(jsFnFullname, AppsmithFunctionsWithFields)
  );
}

export const asyncJsFunctionInDataFields = new AsyncJsFunctionInDataField();
