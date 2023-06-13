import type { TParsedJSProperty } from "@shared/ast";
import { isJSFunctionProperty } from "@shared/ast";
import { parseJSObject } from "@shared/ast";
import type { JSEntity } from "Linting/lib/entity";
import { isJSEntity } from "Linting/lib/entity";
import { validJSBodyRegex } from "workers/Evaluation/JSObject";
import type { createEntityTree } from "./entityTree";

export const parsedJSEntitiesCache: Record<string, ParsedJSEntity> = {};

class ParsedJSEntity {
  private entity: Record<string, string> = { body: "" };
  private entityConfig: Record<string, TParsedJSProperty> = {};

  constructor(
    jsObjectBody: string,
    jsObjectProperties: Record<string, TParsedJSProperty>,
  ) {
    const parsedJS: Record<string, string> = {
      body: jsObjectBody,
    };
    const parsedJSConfig: Record<string, Partial<TParsedJSProperty>> = {};

    for (const [propertyName, parsedPropertyDetails] of Object.entries(
      jsObjectProperties,
    )) {
      const { position, rawContent, type, value } = parsedPropertyDetails;
      parsedJS[propertyName] = value;
      if (isJSFunctionProperty(parsedPropertyDetails)) {
        parsedJSConfig[propertyName] = {
          isMarkedAsync: parsedPropertyDetails.isMarkedAsync,
          position,
          value: rawContent,
        };
      } else if (type !== "literal") {
        parsedJSConfig[propertyName] = {
          position: position,
          value: rawContent,
        };
      }
    }

    this.entity = parsedJS;
    this.entityConfig = parsedJSConfig as any; // Fix type during eval-linting split
  }

  getParsedEntity() {
    return this.entity;
  }
  getParsedEntityConfig() {
    return this.entityConfig;
  }
}

export function updateTreeWithParsedJS(
  entityTree: ReturnType<typeof createEntityTree>,
) {
  for (const entity of Object.values(entityTree)) {
    if (!isJSEntity(entity)) continue;
    const parsedJSEntity = parseJSEntity(entity).getParsedEntity();
    const rawEntity = entity.getRawEntity();
    for (const [key, value] of Object.entries(parsedJSEntity)) {
      rawEntity[key] = value;
    }
    entity.setParsedEntity(parsedJSEntity);
  }
  return entityTree;
}

function isValidJSBody(jsBody: string) {
  return !!jsBody.trim() && validJSBodyRegex.test(jsBody);
}

export function parseJSEntity(jsEntity: JSEntity) {
  const jsEntityBody = jsEntity.getRawEntity().body;
  const jsEntityName = jsEntity.getName();
  const cachedJSEntity = parsedJSEntitiesCache[jsEntityName];
  // When body is the unchanged, used cached value
  if (
    cachedJSEntity &&
    jsEntity.isEqual(cachedJSEntity.getParsedEntity().body)
  ) {
    return cachedJSEntity;
  }

  const { parsedObject } = parseJSObjectBody(jsEntityBody);
  const parsedJSEntity = new ParsedJSEntity(jsEntityBody, parsedObject);

  parsedJSEntitiesCache[jsEntityName] = parsedJSEntity;

  return parsedJSEntity;
}

function parseJSObjectBody(jsBody: string) {
  let response:
    | { success: false; parsedObject: Record<string, never> }
    | { success: true; parsedObject: Record<string, TParsedJSProperty> } = {
    success: false,
    parsedObject: {},
  };

  if (isValidJSBody(jsBody)) {
    const { parsedObject: parsedProperties, success } = parseJSObject(jsBody);
    if (success) {
      response = {
        success: true,
        parsedObject: parsedProperties.reduce(
          (acc: Record<string, TParsedJSProperty>, property) => {
            const updatedProperties = { ...acc, [property.key]: property };
            return updatedProperties;
          },
          {},
        ),
      };
    }
  }
  return response;
}

export function getParsedJSEntity(jsObjectName: string) {
  return parsedJSEntitiesCache[jsObjectName];
}
