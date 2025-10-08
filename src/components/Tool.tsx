import React, { memo, useEffect, useState } from "react";
import {
  useChannel,
  useGlobals,
  useParameter,
  type API,
} from "storybook/manager-api";
import { Button, IconButton, WithTooltip } from "storybook/internal/components";
import { EVENTS, KEY, TOOL_ID } from "../constants";
import { TransferIcon } from "@storybook/icons";
import { Slider } from "./Slider";
import { styled, useTheme } from "storybook/internal/theming";
import { MINIMAL_VIEWPORTS } from "storybook/internal/viewport";

const Tooltip = styled.div`
  padding: 8px;
  width: 150px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Tool = memo(function Tool({ api }: { api: API }) {
  const theme = useTheme();
  const [globals, updateGlobals, storyGlobals] = useGlobals();
  const layout = useParameter<"centered" | "fullscreen" | undefined>("layout");

  const [isOpen, setIsOpen] = useState(false);
  const [maxWidth, setMaxWidth] = useState(-1);
  const [width, setWidth] = useState(-1);

  const isCentered = layout === "centered";
  const isDisabled = storyGlobals[KEY]?.width || isCentered;
  const isActive = globals[KEY]?.width && !isCentered;

  const emit = useChannel({
    [EVENTS.MAX_WIDTH_CHANGED]: setMaxWidth,
  });

  const updateWidth = (value: number) => {
    setWidth(value);
    emit(EVENTS.WIDTH_CHANGE, value);
  };

  // Globals is throttled, only update at end of a change for url sync
  const syncToGlobal = (value: number | undefined) => {
    updateGlobals({
      [KEY]: {
        width: maxWidth === value ? undefined : value,
      },
    });
  };

  const onViewportPresetChange = (viewport: string) => {
    const v = MINIMAL_VIEWPORTS[viewport];
    if (!v) return;

    let newWidth = Number(v.styles.width.slice(0, -2) ?? maxWidth);
    if (newWidth > maxWidth) newWidth = maxWidth;

    updateWidth(newWidth);
    syncToGlobal(newWidth);
  };

  const onReset = () => {
    updateWidth(maxWidth);
    syncToGlobal(maxWidth);
  };

  useEffect(() => {
    emit(EVENTS.STORYBOOK_THEME, theme);
  }, [theme]);

  useEffect(() => {
    if (maxWidth !== -1 && width === -1) {
      updateWidth(storyGlobals[KEY]?.width ?? globals[KEY]?.width ?? maxWidth);
    } else if (!isActive) {
      updateWidth(maxWidth);
    }
  }, [maxWidth, isActive]);

  return (
    <WithTooltip
      placement="bottom"
      trigger="click"
      closeOnOutsideClick
      visible={isOpen}
      tooltip={
        <Tooltip>
          <Slider
            value={width}
            minValue={10}
            maxValue={maxWidth}
            label="Width"
            name="width"
            unit="px"
            onChange={(value) =>
              updateWidth(typeof value === "number" ? value : (value[0] ?? 0))
            }
            onChangeEnd={(value) =>
              syncToGlobal(typeof value === "number" ? value : (value[0] ?? 0))
            }
            onReset={onReset}
          />

          {Object.keys(MINIMAL_VIEWPORTS).map((viewport) => (
            <Button
              key={viewport}
              style={{ width: "100%" }}
              variant="ghost"
              onClick={() => onViewportPresetChange(viewport)}
            >
              {MINIMAL_VIEWPORTS[viewport]?.name ?? ""}
            </Button>
          ))}
        </Tooltip>
      }
      onVisibleChange={setIsOpen}
    >
      <IconButton
        key={TOOL_ID}
        active={isActive}
        disabled={isDisabled}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <TransferIcon />
      </IconButton>
    </WithTooltip>
  );
});
