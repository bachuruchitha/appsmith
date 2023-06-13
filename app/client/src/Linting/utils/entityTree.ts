import EntityFactory from "Linting/lib/entity";
import type { ConfigTree, UnEvalTree } from "entities/DataTree/dataTreeFactory";
import { mapValues } from "lodash";

export function createEntityTree(
  unEvalTree: UnEvalTree,
  configTree: ConfigTree,
) {
  const tree: Record<string, ReturnType<typeof EntityFactory.getEntity>> = {};
  for (const entityName of Object.keys(unEvalTree)) {
    const unevalEntity = unEvalTree[entityName];
    const configTreeEntity = configTree[entityName];
    tree[entityName] = EntityFactory.getEntity(unevalEntity, configTreeEntity);
  }
  return tree;
}

export function getUnevalEntityTree(entityTree: TEntityTree) {
  return mapValues(entityTree, (entity) => {
    return entity.getRawEntity();
  });
}

export type TEntityTree = ReturnType<typeof createEntityTree>;
