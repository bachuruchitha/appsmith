import { useIsWidgetActionConnectionPresent } from "pages/Editor/utils";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getEvaluationInverseDependencyMap } from "selectors/dataTreeSelectors";
import {
  getApplicationLastDeployedAt,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getCanvasWidgets,
  getDatasources,
  getPageActions,
} from "selectors/entitiesSelector";
import styled from "styled-components";
import { SIGNPOSTING_STEP } from "./Utils";

const ProgressContainer = styled.div<StatusProgressbarContainerType>`
  background-color: ${(props) =>
    props.active
      ? "var(--ads-v2-color-bg-brand-emphasis-plus)"
      : "var(--ads-v2-color-bg-subtle)"};
  border-radius: var(--ads-v2-border-radius);
  overflow: hidden;
  margin-top: 12px;
`;

const Progressbar = styled.div<StatusProgressbarType>`
  width: ${(props) => props.percentage}%;
  height: 6px;
  background: ${(props) =>
    props.active
      ? "var(--ads-v2-color-bg)"
      : "var(--ads-v2-color-bg-brand-emphasis-plus)"};
  transition: width 0.3s ease, background 0.3s ease;
  border-radius: var(--ads-v2-border-radius);
`;

type StatusProgressbarType = {
  percentage: number;
  active: boolean;
};
type StatusProgressbarContainerType = {
  active: boolean;
};

export function StatusProgressbar(props: StatusProgressbarType) {
  return (
    <ProgressContainer {...props}>
      <Progressbar {...props} />
    </ProgressContainer>
  );
}

const useStatusListener = () => {
  const datasources = useSelector(getDatasources);
  const pageId = useSelector(getCurrentPageId);
  const actions = useSelector(getPageActions(pageId));
  const widgets = useSelector(getCanvasWidgets);
  const deps = useSelector(getEvaluationInverseDependencyMap);
  const isConnectionPresent = useIsWidgetActionConnectionPresent(
    widgets,
    actions,
    deps,
  );
  const isDeployed = !!useSelector(getApplicationLastDeployedAt);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!!(datasources.length || actions.length)) {
      dispatch({
        type: "SIGNPOSTING_STEP_COMPLETE",
        payload: {
          step: SIGNPOSTING_STEP.CONNECT_A_DATASOURCE,
          completed: true,
        },
      });
    } else {
      dispatch({
        type: "SIGNPOSTING_STEP_COMPLETE",
        payload: {
          step: SIGNPOSTING_STEP.CONNECT_A_DATASOURCE,
          completed: false,
        },
      });
    }
  }, [datasources.length, actions.length]);

  useEffect(() => {
    if (!!actions.length) {
      dispatch({
        type: "SIGNPOSTING_STEP_COMPLETE",
        payload: {
          step: SIGNPOSTING_STEP.CREATE_A_QUERY,
          completed: true,
        },
      });
    } else {
      dispatch({
        type: "SIGNPOSTING_STEP_COMPLETE",
        payload: {
          step: SIGNPOSTING_STEP.CREATE_A_QUERY,
          completed: false,
        },
      });
    }
  }, [actions.length]);

  useEffect(() => {
    if (Object.keys(widgets).length > 1) {
      dispatch({
        type: "SIGNPOSTING_STEP_COMPLETE",
        payload: {
          step: SIGNPOSTING_STEP.ADD_WIDGETS,
          completed: true,
        },
      });
    } else {
      dispatch({
        type: "SIGNPOSTING_STEP_COMPLETE",
        payload: {
          step: SIGNPOSTING_STEP.ADD_WIDGETS,
          completed: false,
        },
      });
    }
  }, [Object.keys(widgets).length]);

  useEffect(() => {
    if (isConnectionPresent) {
      dispatch({
        type: "SIGNPOSTING_STEP_COMPLETE",
        payload: {
          step: SIGNPOSTING_STEP.CONNECT_DATA_TO_WIDGET,
          completed: true,
        },
      });
    } else {
      dispatch({
        type: "SIGNPOSTING_STEP_COMPLETE",
        payload: {
          step: SIGNPOSTING_STEP.CONNECT_DATA_TO_WIDGET,
          completed: false,
        },
      });
    }
  }, [isConnectionPresent]);

  useEffect(() => {
    if (isDeployed) {
      dispatch({
        type: "SIGNPOSTING_STEP_COMPLETE",
        payload: {
          step: SIGNPOSTING_STEP.DEPLOY_APPLICATIONS,
          completed: true,
        },
      });
    } else {
      dispatch({
        type: "SIGNPOSTING_STEP_COMPLETE",
        payload: {
          step: SIGNPOSTING_STEP.DEPLOY_APPLICATIONS,
          completed: false,
        },
      });
    }
  }, [isDeployed]);
};

export function OnboardingStatusbar() {
  useStatusListener();

  return null;
}

export default OnboardingStatusbar;
