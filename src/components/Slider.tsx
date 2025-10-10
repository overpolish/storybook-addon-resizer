import React, { memo, useRef } from "react";
import {
  useSlider,
  useSliderThumb,
  type AriaSliderProps,
  type AriaSliderThumbProps,
} from "@react-aria/slider";
import { useSliderState } from "react-stately";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import { IconButton } from "storybook/internal/components";
import { UndoIcon } from "@storybook/icons";
import { styled, useTheme } from "storybook/internal/theming";

const StyledSlider = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;

const SliderTrack = styled.div`
  height: 16px;
  width: calc(100% - 16px);
`;

const Track = styled.div<{ color?: string }>`
  position: absolute;
  border-radius: 2px;
  height: 4px;
  width: 100%;
  background: ${({ color, theme }) => color ?? theme.color.dark};
  top: 50%;
  transform: translateY(-50%);
  box-shadow: rgba(0, 0, 0, 0.33) 0px 0px 1px inset;
`;

const LabelOutputGroup = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
`;

const LabelGroup = styled.label`
  display: flex;
  align-items: flex-end;
  gap: 8px;
`;

const ResetButton = styled(IconButton)`
  height: 14px;
  width: 14px;
  padding: 0;
`;

const StyledThumb = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.lightest};
  border: 1px solid ${({ theme }) => theme.color.border};
  top: 50%;
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
`;

type SliderProps = AriaSliderProps & {
  name: string;
  unit?: string;
  onReset?: () => void;
};

export const Slider = memo(function Slider({
  name,
  unit,
  onReset,
  ...props
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const state = useSliderState({
    ...props,
    numberFormatter: Intl.NumberFormat(),
  });
  const { groupProps, trackProps, labelProps, outputProps } = useSlider(
    props,
    state,
    trackRef,
  );

  const theme = useTheme();

  return (
    <StyledSlider {...groupProps}>
      {props.label && (
        <LabelOutputGroup>
          <LabelGroup>
            <label {...labelProps}>{props.label}</label>

            {onReset && (
              <ResetButton onClick={onReset}>
                <UndoIcon size={12} />
              </ResetButton>
            )}
          </LabelGroup>

          <output {...outputProps}>
            {state.getThumbValueLabel(0)}
            {unit}
          </output>
        </LabelOutputGroup>
      )}

      <SliderTrack {...trackProps} ref={trackRef}>
        <Track />
        <Track
          color={theme.color.secondary}
          style={{
            width: state.getThumbPercent(0) * 100 + "%",
          }}
        />
        <Thumb index={0} state={state} trackRef={trackRef} name={name} />
      </SliderTrack>
    </StyledSlider>
  );
});

type ThumbProps = AriaSliderThumbProps & {
  state: ReturnType<typeof useSliderState>;
  trackRef: React.RefObject<HTMLDivElement>;
};

const Thumb = memo(function Thumb(props: ThumbProps) {
  const { state, trackRef, index, name } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const { thumbProps, inputProps } = useSliderThumb(
    { index, trackRef, inputRef, name },
    state,
  );

  return (
    <StyledThumb {...thumbProps}>
      <VisuallyHidden>
        <input ref={inputRef} {...inputProps} />
      </VisuallyHidden>
    </StyledThumb>
  );
});
