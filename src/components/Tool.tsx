import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useChannel, type API } from "storybook/manager-api";
import { IconButton, WithTooltip } from "storybook/internal/components";
import { TOOL_ID } from "../constants";
import { TransferIcon } from "@storybook/icons";
import { Slider } from "./Slider";
import { STORY_RENDERED } from "storybook/internal/core-events";
import { css, styled } from "storybook/internal/theming";

const IFRAME_ID = "storybook-preview-iframe";
const ROOT_ID = "storybook-root";
const PADDED_CLASS = "sb-main-padded";

const PADDING = 32;

const Tooltip = styled.div`
  padding: 8px;
  width: 150px;
`;

export const Tool = memo(function MyAddonSelector({ api }: { api: API }) {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(Number.MAX_SAFE_INTEGER);
  const [maxWidth, setMaxWidth] = useState(Number.MAX_SAFE_INTEGER);

  const maxWidthRef = useRef(maxWidth);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const updateWidthLimits = () => {
    if (iframeRef.current) {
      const hasPadding =
        iframeRef.current.contentDocument?.body.classList.contains(
          PADDED_CLASS,
        );

      const iframeWidth =
        iframeRef.current.clientWidth - (hasPadding ? PADDING : 0);

      setWidth((prevWidth) =>
        iframeWidth < prevWidth || prevWidth === maxWidthRef.current
          ? iframeWidth
          : prevWidth,
      );

      setMaxWidth(iframeWidth);
    }
  };

  useChannel(
    {
      [STORY_RENDERED]: () => {
        const iframe = document.getElementById(IFRAME_ID) as HTMLIFrameElement;
        iframeRef.current = iframe;

        updateWidthLimits();
      },
    },
    [width, maxWidth],
  );

  useLayoutEffect(() => {
    window.addEventListener("resize", updateWidthLimits);

    return () => {
      window.removeEventListener("resize", updateWidthLimits);
    };
  }, []);

  useEffect(() => {
    maxWidthRef.current = maxWidth;
  }, [maxWidth]);

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentDocument) {
      const storybookRoot =
        iframeRef.current.contentDocument.getElementById(ROOT_ID);

      if (storybookRoot) {
        storybookRoot.style.width = `${width}px`;
      }
    }
  }, [width]);

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
            label="Width"
            name="width"
            unit="px"
            onChange={(value) =>
              setWidth(Array.isArray(value) ? (value[0] ?? maxWidth) : value)
            }
            onReset={() => setWidth(maxWidth)}
          />
        </Tooltip>
      }
      onVisibleChange={setIsOpen}
    >
      <IconButton
        key={TOOL_ID}
        active={width !== maxWidth}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <TransferIcon />
      </IconButton>
    </WithTooltip>
  );
});
