import type { Step } from "@walkr/core";
import type React from "react";

interface StepPanelProps {
  step: Step | null;
  stepIndex: number | null;
  onUpdate: (stepIndex: number, updates: Partial<Step>) => void;
}

const STEP_COLORS: Record<string, string> = {
  moveTo: "#1d3a5c",
  moveToCoords: "#1a3050",
  click: "#3b1d5c",
  clickCoords: "#301850",
  type: "#1d5c2a",
  scroll: "#5c3b1d",
  wait: "#333",
  zoom: "#5c1d3b",
  pan: "#1d5c5c",
  highlight: "#5c5c1d",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#888",
  marginBottom: 4,
  display: "block",
};

const inputStyle: React.CSSProperties = {
  background: "#222",
  border: "1px solid #333",
  color: "#e8e8e8",
  borderRadius: 4,
  padding: "6px 8px",
  width: "100%",
  fontSize: 13,
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: 12,
};

const EASING_OPTIONS = ["linear", "ease", "ease-in", "ease-out", "ease-in-out"];

export function StepPanel({ step, stepIndex, onUpdate }: StepPanelProps) {
  if (step === null || stepIndex === null) {
    return (
      <div style={panelStyle}>
        <div style={{ color: "#555", fontSize: 13, marginTop: 40, textAlign: "center" }}>
          Select a step to edit its options.
        </div>
      </div>
    );
  }

  const updateOptions = (updates: Record<string, unknown>) => {
    onUpdate(stepIndex, { options: { ...step.options, ...updates } } as Partial<Step>);
  };

  const updateDuration = (duration: number) => {
    onUpdate(stepIndex, { duration });
  };

  return (
    <div style={panelStyle}>
      {/* Step type badge */}
      <div style={{ marginBottom: 16 }}>
        <span
          style={{
            display: "inline-block",
            background: STEP_COLORS[step.type] ?? "#333",
            color: "#e8e8e8",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: 4,
          }}
        >
          {step.type}
        </span>
      </div>

      <div style={{ fontSize: 13, color: "#ccc", marginBottom: 16 }}>Step {stepIndex + 1}</div>

      {/* Duration */}
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Duration (ms)</label>
        <input
          type="number"
          style={inputStyle}
          value={step.duration}
          min={0}
          onChange={(e) => updateDuration(Math.max(0, parseInt(e.target.value, 10) || 0))}
        />
      </div>

      {/* Step-specific fields */}
      {renderStepFields(step, updateOptions)}
    </div>
  );
}

function renderStepFields(step: Step, updateOptions: (updates: Record<string, unknown>) => void) {
  const opts = step.options as Record<string, unknown>;

  switch (step.type) {
    case "moveTo":
      return (
        <>
          <TextField
            label="Selector"
            value={(opts.selector as string) ?? ""}
            onChange={(v) => updateOptions({ selector: v })}
          />
          <SelectField
            label="Easing"
            value={(opts.easing as string) ?? "linear"}
            options={EASING_OPTIONS}
            onChange={(v) => updateOptions({ easing: v })}
          />
        </>
      );

    case "moveToCoords":
      return (
        <>
          <NumberField
            label="X"
            value={opts.x as number}
            onChange={(v) => updateOptions({ x: v })}
          />
          <NumberField
            label="Y"
            value={opts.y as number}
            onChange={(v) => updateOptions({ y: v })}
          />
          <SelectField
            label="Easing"
            value={(opts.easing as string) ?? "linear"}
            options={EASING_OPTIONS}
            onChange={(v) => updateOptions({ easing: v })}
          />
        </>
      );

    case "click":
      return (
        <>
          <TextField
            label="Selector"
            value={(opts.selector as string) ?? ""}
            onChange={(v) => updateOptions({ selector: v })}
          />
          <SelectField
            label="Button"
            value={(opts.button as string) ?? "left"}
            options={["left", "right", "middle"]}
            onChange={(v) => updateOptions({ button: v })}
          />
          <CheckboxField
            label="Double click"
            checked={!!opts.double}
            onChange={(v) => updateOptions({ double: v })}
          />
        </>
      );

    case "clickCoords":
      return (
        <>
          <NumberField
            label="X"
            value={opts.x as number}
            onChange={(v) => updateOptions({ x: v })}
          />
          <NumberField
            label="Y"
            value={opts.y as number}
            onChange={(v) => updateOptions({ y: v })}
          />
          <SelectField
            label="Button"
            value={(opts.button as string) ?? "left"}
            options={["left", "right", "middle"]}
            onChange={(v) => updateOptions({ button: v })}
          />
          <CheckboxField
            label="Double click"
            checked={!!opts.double}
            onChange={(v) => updateOptions({ double: v })}
          />
        </>
      );

    case "type":
      return (
        <>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Text</label>
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
              value={(opts.text as string) ?? ""}
              onChange={(e) => updateOptions({ text: e.target.value })}
            />
          </div>
          <NumberField
            label="Delay (ms per char)"
            value={(opts.delay as number) ?? 0}
            onChange={(v) => updateOptions({ delay: v })}
          />
          <TextField
            label="Selector"
            value={(opts.selector as string) ?? ""}
            onChange={(v) => updateOptions({ selector: v })}
          />
        </>
      );

    case "scroll":
      return (
        <>
          <NumberField
            label="X"
            value={opts.x as number}
            onChange={(v) => updateOptions({ x: v })}
          />
          <NumberField
            label="Y"
            value={opts.y as number}
            onChange={(v) => updateOptions({ y: v })}
          />
          <CheckboxField
            label="Smooth"
            checked={!!opts.smooth}
            onChange={(v) => updateOptions({ smooth: v })}
          />
        </>
      );

    case "wait":
      return (
        <NumberField
          label="Wait (ms)"
          value={opts.ms as number}
          onChange={(v) => updateOptions({ ms: v })}
        />
      );

    case "zoom":
      return (
        <>
          <NumberField
            label="Level"
            value={opts.level as number}
            onChange={(v) => updateOptions({ level: v })}
            min={0.5}
            max={4}
            step={0.1}
          />
          <CheckboxField
            label="Follow"
            checked={!!opts.follow}
            onChange={(v) => updateOptions({ follow: v })}
          />
          <SelectField
            label="Easing"
            value={(opts.easing as string) ?? "linear"}
            options={EASING_OPTIONS}
            onChange={(v) => updateOptions({ easing: v })}
          />
        </>
      );

    case "pan":
      return (
        <>
          <NumberField
            label="X"
            value={opts.x as number}
            onChange={(v) => updateOptions({ x: v })}
          />
          <NumberField
            label="Y"
            value={opts.y as number}
            onChange={(v) => updateOptions({ y: v })}
          />
          <SelectField
            label="Easing"
            value={(opts.easing as string) ?? "linear"}
            options={EASING_OPTIONS}
            onChange={(v) => updateOptions({ easing: v })}
          />
        </>
      );

    case "highlight":
      return (
        <>
          <TextField
            label="Selector"
            value={(opts.selector as string) ?? ""}
            onChange={(v) => updateOptions({ selector: v })}
          />
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Color</label>
            <input
              type="color"
              style={{ ...inputStyle, padding: 2, height: 32 }}
              value={(opts.color as string) ?? "#ffff00"}
              onChange={(e) => updateOptions({ color: e.target.value })}
            />
          </div>
          <NumberField
            label="Duration (ms)"
            value={(opts.duration as number) ?? 500}
            onChange={(v) => updateOptions({ duration: v })}
          />
        </>
      );

    default:
      return null;
  }
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div style={fieldGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        type="number"
        style={inputStyle}
        value={value ?? 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={fieldGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        style={inputStyle}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={fieldGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <select style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ ...fieldGroupStyle, display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: "#3b82f6" }}
      />
      <label style={{ ...labelStyle, marginBottom: 0 }}>{label}</label>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  width: 280,
  background: "#161616",
  borderLeft: "1px solid #2a2a2a",
  padding: 16,
  overflowY: "auto",
  flexShrink: 0,
};
