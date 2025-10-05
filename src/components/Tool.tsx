import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useChannel, type API } from "storybook/manager-api";
import { Button, IconButton, WithTooltip } from "storybook/internal/components";
import { TOOL_ID } from "../constants";
import { TransferIcon } from "@storybook/icons";
import { Slider } from "./Slider";
import { STORY_CHANGED } from "storybook/internal/core-events";
import { css, styled, useTheme } from "storybook/internal/theming";
import { MINIMAL_VIEWPORTS } from "storybook/internal/viewport";

const IFRAME_ID = "storybook-preview-iframe";
const ROOT_ID = "storybook-root";
const CENTERED_LAYOUT_CLASS = "sb-main-centered";

const PADDED_CLASS = "sb-main-padded"; // Applied to the `ROOT_ID` element when story is padded
const PADDING = 16;

const Tooltip = styled.div`
  padding: 8px;
  width: 150px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/** Generate and return an overflow visualizer element */
const generateOverflowVisual = (color: string): HTMLDivElement => {
  const overflowVisual = document.createElement("div");
  overflowVisual.style = css({
    position: "absolute",
    pointerEvents: "none",
    top: 0,
    height: "100%",
    zIndex: -1,
    background: `rgb(from ${color} r g b / 0.1)`,
    boxShadow: `inset 2px 0px 0px 0px ${color}`,
    opacity: 0,
    fontFamily: "sans-serif",
    fontSize: "12px",
    fontWeight: "bold",
    color,
  }).styles;

  return overflowVisual;
};

export const Tool = memo(function Tool({ api }: { api: API }) {
  const theme = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [width, setWidth] = useState(Number.MAX_SAFE_INTEGER);
  const [maxWidth, setMaxWidth] = useState(Number.MAX_SAFE_INTEGER);
  const [padding, setPadding] = useState(0);

  const overflowVisualRef = useRef<HTMLDivElement | null>(null);
  const maxWidthRef = useRef(maxWidth);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const updateWidthLimits = () => {
    if (iframeRef.current) {
      const padded =
        iframeRef.current.contentDocument?.body.classList.contains(
          PADDED_CLASS,
        );

      const iframeWidth =
        iframeRef.current.clientWidth - (padded ? PADDING * 2 : 0);

      setPadding(padded ? PADDING : 0);

      setWidth((prevWidth) =>
        iframeWidth < prevWidth || prevWidth === maxWidthRef.current
          ? iframeWidth
          : prevWidth,
      );

      setMaxWidth(iframeWidth);

      setIsDisabled(
        iframeRef.current.contentDocument?.body.classList.contains(
          CENTERED_LAYOUT_CLASS,
        ) ?? false,
      );
    }
  };

  useChannel(
    {
      [STORY_CHANGED]: () => {
        const iframe = document.getElementById(IFRAME_ID) as HTMLIFrameElement;
        iframeRef.current = iframe;

        updateWidthLimits();
      },
    },
    [width, maxWidth, padding, isDisabled],
  );

  useLayoutEffect(() => {
    window.addEventListener("resize", updateWidthLimits);

    if (iframeRef.current && iframeRef.current.contentDocument?.body) {
      iframeRef.current.contentDocument.body.style.position = "relative";

      overflowVisualRef.current = generateOverflowVisual(theme.color.negative);
      iframeRef.current.contentDocument.body.insertBefore(
        overflowVisualRef.current,
        iframeRef.current.contentDocument.body.firstChild,
      );
    }

    return () => {
      window.removeEventListener("resize", updateWidthLimits);

      if (overflowVisualRef.current && overflowVisualRef.current.parentNode) {
        overflowVisualRef.current.parentNode.removeChild(
          overflowVisualRef.current,
        );
        overflowVisualRef.current = null;
      }
    };
  }, [iframeRef.current]);

  useEffect(() => {
    maxWidthRef.current = maxWidth;
  }, [maxWidth]);

  useEffect(() => {
    const storybookRoot =
      iframeRef.current?.contentDocument?.getElementById(ROOT_ID);

    if (!storybookRoot || !overflowVisualRef.current) return;

    storybookRoot.style.width =
      width === maxWidth || isDisabled ? "unset" : `${width}px`;

    overflowVisualRef.current.style.opacity =
      isDisabled || width === maxWidth ? "0" : "1";
    overflowVisualRef.current.style.left = `${width + padding}px`;
    overflowVisualRef.current.style.width = `${maxWidth - width + padding}px`;

    overflowVisualRef.current.innerHTML = `<span style="padding: 4px;">${width}px</span>`;
  }, [width, maxWidth, padding, isDisabled]);

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
              setWidth(Array.isArray(value) ? (value[0] ?? maxWidth) : value)
            }
            onReset={() => setWidth(maxWidth)}
          />

          {Object.keys(MINIMAL_VIEWPORTS).map((key) => (
            <Button
              key={key}
              style={{ width: "100%" }}
              variant="ghost"
              onClick={() =>
                setWidth(
                  Number(
                    MINIMAL_VIEWPORTS[key]?.styles.width.slice(0, -2) ??
                      maxWidth,
                  ),
                )
              }
            >
              {MINIMAL_VIEWPORTS[key]?.name ?? ""}
            </Button>
          ))}
        </Tooltip>
      }
      onVisibleChange={setIsOpen}
    >
      <IconButton
        key={TOOL_ID}
        active={width !== maxWidth && !isDisabled}
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={iframeRef.current?.contentDocument?.body.classList.contains(
          CENTERED_LAYOUT_CLASS,
        )}
      >
        <TransferIcon />
      </IconButton>
    </WithTooltip>
  );
});
