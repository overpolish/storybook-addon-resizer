import {
  useChannel,
  useEffect,
  useParameter,
} from "storybook/internal/preview-api";
import { css } from "storybook/internal/theming";
import type {
  Renderer,
  StoryContext,
  PartialStoryFn as StoryFunction,
} from "storybook/internal/types";
import { EVENTS } from "./constants";

const RESIZER_STYLE_ID = "resizer-visualizer";
const RESIZER_WIDTH_VAR = "--resizer-width";
const RESIZER_COLOR_VAR = "--resizer-color";
const RESIZER_OVERFLOW_VISUAL_VISIBILITY_VAR = "--overflow-visual-visibility";

// No way to use px value, from width var, in content
const RESIZER_WIDTH_ATTR = "data-resizer-width";

const addOverflowVisualStyles = () => {
  const existingStyle = global.document.getElementById(RESIZER_STYLE_ID);
  if (existingStyle) return;

  const style = global.document.createElement("style");
  style.setAttribute("id", RESIZER_STYLE_ID);

  const translucentColor = `rgb(from var(${RESIZER_COLOR_VAR}) r g b / 0.05)`;
  style.innerHTML = css({
    body: {
      width: `var(${RESIZER_WIDTH_VAR}, 100%)`,
    },
    "body::before": {
      content: `attr(${RESIZER_WIDTH_ATTR}) 'px'`,
      position: "fixed",
      top: 0,
      left: `var(${RESIZER_WIDTH_VAR}, 100%)`,
      width: "100%",
      height: "100%",

      background: `repeating-linear-gradient(
        -45deg,
        ${translucentColor},
        ${translucentColor} 10px,
        transparent 10px,
        transparent 20px
      )`,
      boxShadow: `inset 2px 0px 0px 0px var(${RESIZER_COLOR_VAR})`,

      pointerEvents: "none",
      zIndex: -1,
      visibility:
        `var(${RESIZER_OVERFLOW_VISUAL_VISIBILITY_VAR}, hidden)` as any,

      fontFamily: "sans-serif",
      fontSize: "12px",
      fontWeight: "bold",
      color: `var(${RESIZER_COLOR_VAR})`,
      padding: "4px 8px",
    },
  }).styles;

  global.document.head.appendChild(style);
};

const removeOverflowVisualStyles = () => {
  const existingStyle = global.document.getElementById(RESIZER_STYLE_ID);
  if (existingStyle && existingStyle.parentElement) {
    existingStyle.parentElement.removeChild(existingStyle);
  }
};

export const storyResizeDecorator = (
  StoryFn: StoryFunction<Renderer>,
  context: StoryContext<Renderer>,
) => {
  const layout = useParameter<"centered" | "fullscreen" | undefined>("layout");
  const isCentered = layout === "centered";
  const isInDocs = context.viewMode === "docs";

  const sendMaxWidth = () => {
    emit(EVENTS.MAX_WIDTH_CHANGED, document.documentElement.clientWidth);
  };

  const emit = useChannel({
    [EVENTS.STORYBOOK_COLOR_NEGATIVE]: (color) => {
      document.body.style.setProperty(RESIZER_COLOR_VAR, color);
    },
    [EVENTS.WIDTH_CHANGE]: (width: number) => {
      console.log(width);
      document.body.style.setProperty(
        RESIZER_WIDTH_VAR,
        width ? `${width}px` : "",
      );
      document.body.setAttribute(RESIZER_WIDTH_ATTR, width.toString());
      document.body.style.setProperty(
        RESIZER_OVERFLOW_VISUAL_VISIBILITY_VAR,
        width === document.documentElement.clientWidth ? "hidden" : "visible",
      );
    },
  });

  useEffect(() => {
    if (isCentered || isInDocs) return;

    addOverflowVisualStyles();

    return () => {
      // Avoids layout shift when switching stories, but does cause
      // a flash of overlay visualizer
      removeOverflowVisualStyles();
    };
  }, []);

  useEffect(() => {
    sendMaxWidth();

    window.addEventListener("resize", sendMaxWidth);
    return () => window.removeEventListener("resize", sendMaxWidth);
  }, [sendMaxWidth]);

  return StoryFn();
};
