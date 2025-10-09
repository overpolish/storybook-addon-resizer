import {
  useChannel,
  useEffect,
  useGlobals,
  useParameter,
  useState,
} from "storybook/internal/preview-api";
import type {
  Renderer,
  StoryContext,
  PartialStoryFn as StoryFunction,
} from "storybook/internal/types";
import { EVENTS, KEY } from "./constants";
import { css } from "storybook/internal/theming";

const RESIZER_STYLE_ID = "resizer-overflow-visual";
const RESIZER_CONTENT_VAR = "--resizer-content";
const RESIZER_LEFT_OFFSET_VAR = "--left-offset";
const RESIZER_OVERFLOW_VISUAL_VISIBILITY_VAR = "--overflow-visual-visibility";

const RESIZER_COLOR = "#FF4400"; // Storybook theme.color.negative

const addOverflowVisualStyles = () => {
  const existingStyle = global.document.getElementById(RESIZER_STYLE_ID);

  if (existingStyle) return;

  const style = global.document.createElement("style");
  style.setAttribute("id", RESIZER_STYLE_ID);

  const translucentColor = `rgb(from ${RESIZER_COLOR} r g b / 0.05)`;
  style.innerHTML = css({
    "body::before": {
      fontFamily: "sans-serif",
      fontSize: "12px",
      fontWeight: "bold",
      color: `${RESIZER_COLOR}`,
      padding: "4px 8px",

      content: `var(${RESIZER_CONTENT_VAR})`,
      position: "fixed",
      background: `repeating-linear-gradient(
        -45deg,
        ${translucentColor},
        ${translucentColor} 10px,
        transparent 10px,
        transparent 20px
      )`,
      width: "100%",
      height: "100%",
      top: 0,
      left: `var(${RESIZER_LEFT_OFFSET_VAR}, 100%)`,
      pointerEvents: "none",
      zIndex: -1,
      visibility:
        `var(${RESIZER_OVERFLOW_VISUAL_VISIBILITY_VAR}, hidden)` as any,
      boxShadow: `inset 2px 0px 0px 0px ${RESIZER_COLOR}`,
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

export const withGlobals = (
  StoryFn: StoryFunction<Renderer>,
  context: StoryContext<Renderer>,
) => {
  const [globals] = useGlobals();

  const layout = useParameter<"centered" | "fullscreen" | undefined>("layout");
  const isCentered = layout === "centered";
  const isInDocs = context.viewMode === "docs";

  const [width, setWidth] = useState(
    isCentered || !globals[KEY].width || isInDocs
      ? document.documentElement.clientWidth // Full width for centered stories
      : globals[KEY].width,
  );

  const [maxWidth, setMaxWidth] = useState(
    document.documentElement.clientWidth,
  );

  const emit = useChannel({
    [EVENTS.WIDTH_CHANGE]: (width: number) => {
      if (isCentered || isInDocs) return;
      setWidth(width);
    },
  });

  const emitMaxWidth = () => {
    const w = document.documentElement.clientWidth;

    setMaxWidth(w);
    emit(EVENTS.MAX_WIDTH_CHANGED, w);
  };

  useEffect(() => {
    addOverflowVisualStyles();

    return () => {
      removeOverflowVisualStyles();
    };
  }, []);

  useEffect(() => {
    emitMaxWidth();

    window.addEventListener("resize", emitMaxWidth);
    return () => {
      window.removeEventListener("resize", emitMaxWidth);
    };
  }, [emitMaxWidth]);

  useEffect(() => {
    document.body.style.width = width ? `${width}px` : "";

    document.body.style.setProperty(RESIZER_LEFT_OFFSET_VAR, `${width}px`);
    document.body.style.setProperty(
      RESIZER_OVERFLOW_VISUAL_VISIBILITY_VAR,
      width !== maxWidth ? "visible" : "hidden",
    );
    document.body.style.setProperty(RESIZER_CONTENT_VAR, `"${width}px"`);
  }, [width, maxWidth]);

  return StoryFn();
};
