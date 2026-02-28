import { Fragment } from "react";

import type { SelectedStep } from "../types";

interface StepSidebarProps {
  selectedStep: SelectedStep | null;
  onChangeOption: (key: string, value: unknown) => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const coerceNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#8fa5c2",
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  background: "#0b1220",
  color: "#e2e8f0",
  border: "1px solid #2c3e55",
  borderRadius: 8,
  padding: "7px 8px",
  boxSizing: "border-box",
};

export const StepSidebar = ({ selectedStep, onChangeOption }: StepSidebarProps) => {
  if (!selectedStep) {
    return (
      <aside
        style={{
          minWidth: 260,
          maxWidth: 320,
          background: "#0f172a",
          border: "1px solid #223146",
          borderRadius: 14,
          padding: 12,
          color: "#8fa5c2",
        }}
      >
        Select a step to edit
      </aside>
    );
  }

  const { step } = selectedStep;
  const options = isRecord(step.options) ? step.options : {};

  return (
    <aside
      style={{
        minWidth: 260,
        maxWidth: 320,
        background: "#0f172a",
        border: "1px solid #223146",
        borderRadius: 14,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ color: "#e2e8f0", fontWeight: 700 }}>{step.type}</div>
      <div style={{ color: "#8fa5c2", fontSize: 12 }}>{`id: ${step.id}`}</div>
      <div style={{ display: "grid", gap: 10 }}>
        {Object.entries(options).map(([key, value]) => {
          if (key === "button" && typeof value === "string") {
            return (
              <Fragment key={key}>
                <label style={fieldLabelStyle}>{key}</label>
                <select
                  value={value}
                  onChange={(event) => onChangeOption(key, event.target.value)}
                  style={fieldStyle}
                >
                  <option value="left">left</option>
                  <option value="right">right</option>
                  <option value="middle">middle</option>
                </select>
              </Fragment>
            );
          }

          if (typeof value === "number") {
            return (
              <Fragment key={key}>
                <label style={fieldLabelStyle}>{key}</label>
                <input
                  type="number"
                  value={value}
                  onChange={(event) => onChangeOption(key, coerceNumber(event.target.value))}
                  style={fieldStyle}
                />
              </Fragment>
            );
          }

          if (typeof value === "string") {
            return (
              <Fragment key={key}>
                <label style={fieldLabelStyle}>{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(event) => onChangeOption(key, event.target.value)}
                  style={fieldStyle}
                />
              </Fragment>
            );
          }

          if (typeof value === "boolean") {
            return (
              <Fragment key={key}>
                <label style={fieldLabelStyle}>{key}</label>
                <select
                  value={value ? "true" : "false"}
                  onChange={(event) => onChangeOption(key, event.target.value === "true")}
                  style={fieldStyle}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </Fragment>
            );
          }

          return (
            <Fragment key={key}>
              <label style={fieldLabelStyle}>{key}</label>
              <input
                type="text"
                value={JSON.stringify(value)}
                onChange={(event) => {
                  try {
                    onChangeOption(key, JSON.parse(event.target.value));
                  } catch {
                    onChangeOption(key, event.target.value);
                  }
                }}
                style={fieldStyle}
              />
            </Fragment>
          );
        })}
      </div>
    </aside>
  );
};
