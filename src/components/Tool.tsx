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
import {
  MINIMAL_VIEWPORTS,
  type ViewportMap,
} from "storybook/internal/viewport";
import { STORY_RENDERED } from "storybook/internal/core-events";

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

  const viewports =
    useParameter<{ options?: ViewportMap }>("viewport", {}).options ??
    MINIMAL_VIEWPORTS;

  const layout = useParameter<"centered" | "fullscreen" | undefined>("layout");
  const isCentered = layout === "centered";
  const isDisabled = storyGlobals[KEY]?.width || isCentered;
  const isActive = globals[KEY]?.width && !isCentered;

  const [isOpen, setIsOpen] = useState(false);
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined);
  const [width, setWidth] = useState<number | undefined>(
    storyGlobals[KEY]?.width ?? globals[KEY]?.width ?? maxWidth,
  );

  const emit = useChannel(
    {
      [EVENTS.MAX_WIDTH_CHANGED]: (value: number) => {
        setMaxWidth(value);

        if (!isActive) setWidth(value);
      },
      [STORY_RENDERED]: () => {
        setWidth(storyGlobals[KEY]?.width ?? globals[KEY]?.width ?? maxWidth);
      },
    },
    [globals, storyGlobals],
  );

  const setAndSyncWidth = (value: number | undefined) => {
    setWidth(value);
    syncToGlobal(value);
  };

  // Globals updates url which is throttled to 100 per 10 secs
  // so must be conservative and only update when necessary
  const syncToGlobal = (value: number | undefined) => {
    updateGlobals({
      [KEY]: {
        width: maxWidth === value ? undefined : value,
      },
    });
  };

  const onViewportPresetChange = (viewportWidth: number) => {
    if (maxWidth && viewportWidth > maxWidth) viewportWidth = maxWidth;

    setAndSyncWidth(viewportWidth);
  };

  useEffect(() => {
    emit(EVENTS.STORYBOOK_COLOR_NEGATIVE, theme.color.negative);
  }, [theme]);

  useEffect(() => {
    emit(EVENTS.WIDTH_CHANGE, width);
  }, [width]);

  useEffect(() => {
    if (width !== undefined) return;
    setWidth(storyGlobals[KEY]?.width ?? globals[KEY]?.width ?? maxWidth);
  }, [maxWidth]);

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
            maxValue={maxWidth}
            minValue={10}
            label="Width"
            name="width"
            unit="px"
            onChange={(value) =>
              setWidth(!Array.isArray(value) ? value : (value[0] ?? -1))
            }
            onChangeEnd={(value) =>
              syncToGlobal(!Array.isArray(value) ? value : (value[0] ?? -1))
            }
            onReset={() => setAndSyncWidth(maxWidth)}
          />

          {Object.keys(viewports).map((viewport) => (
            <Button
              key={viewport}
              style={{ width: "100%" }}
              variant="ghost"
              onClick={() =>
                onViewportPresetChange(
                  Number(viewports[viewport]!.styles.width.replace("px", "")),
                )
              }
            >
              {viewports[viewport]?.name ?? ""}
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
