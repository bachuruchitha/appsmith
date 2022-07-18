import React, { CSSProperties } from "react";
import cx from "clsx";

import VisuallyHidden from "../_VisuallyHidden";

import styles from "./styles.module.css";

export interface InputLabelProps extends React.HTMLProps<HTMLLabelElement> {
  /**
   * makes the label disabled
   */
  disabled?: boolean;
  /**
   * makes the label required
   */
  required?: boolean;
  /**
   * makes the label visually hidden
   */
  visuallyHidden?: boolean;
  /**
   * align label's text
   */
  textAlign?: "left" | "center" | "right";
  /**
   * font size of label
   */
  fontSize?: string;
  /**
   * font weight of label
   */
  fontWeight?: "normal" | "bold" | "lighter" | "bolder";
}

const InputLabel: React.FC<InputLabelProps> = ({
  children,
  disabled,
  fontSize = "1rem",
  fontWeight = "normal",
  htmlFor,
  required,
  textAlign = "left",
  visuallyHidden,
}) => {
  const cssVariables = {
    "--cursor": disabled ? "default" : "pointer",
    "--text-align": textAlign,
    "--font-size": fontSize,
    "--font-weight": fontWeight,
  } as CSSProperties;

  return (
    <VisuallyHidden
      asChild
      className={styles.label}
      isVisible={!visuallyHidden}
      style={cssVariables}
    >
      <label htmlFor={htmlFor}>
        {required ? (
          <span className="flex">
            <div className="mr-1">{children}</div>
            <span aria-hidden="true">*</span>
          </span>
        ) : (
          children
        )}
      </label>
    </VisuallyHidden>
  );
};

export default InputLabel;
