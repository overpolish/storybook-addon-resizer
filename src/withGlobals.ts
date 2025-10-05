import type {
  Renderer,
  StoryContext,
  PartialStoryFn as StoryFunction,
} from "storybook/internal/types";

export const withGlobals = (
  StoryFn: StoryFunction<Renderer>,
  _context: StoryContext<Renderer>,
) => {
  return StoryFn();
};
