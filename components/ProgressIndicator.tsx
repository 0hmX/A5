import { cn } from '@/lib/cn';
import { VariantProps, cva } from 'class-variance-authority';
import { cssInterop } from 'nativewind';
import * as React from 'react';
import {
  Animated,
  ActivityIndicator as RNActivityIndicator,
  View,
  ViewProps,
} from 'react-native';

import { Text } from '@/components/nativewindui/Text';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

cssInterop(View, { className: 'style' });
cssInterop(RNActivityIndicator, { className: 'style' });

const progressVariants = cva('', {
  variants: {
    variant: {
      linear: 'overflow-hidden rounded-full',
      circular: 'items-center justify-center',
      spinner: 'items-center justify-center',
      dots: 'flex-row items-center justify-center',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
      xl: '',
    },
  },
  compoundVariants: [
    {
      variant: 'linear',
      size: 'sm',
      className: 'h-1',
    },
    {
      variant: 'linear',
      size: 'md',
      className: 'h-2',
    },
    {
      variant: 'linear',
      size: 'lg',
      className: 'h-3',
    },
    {
      variant: 'linear',
      size: 'xl',
      className: 'h-4',
    },
    {
      variant: ['circular', 'spinner'],
      size: 'sm',
      className: 'w-4 h-4',
    },
    {
      variant: ['circular', 'spinner'],
      size: 'md',
      className: 'w-8 h-8',
    },
    {
      variant: ['circular', 'spinner'],
      size: 'lg',
      className: 'w-12 h-12',
    },
    {
      variant: ['circular', 'spinner'],
      size: 'xl',
      className: 'w-16 h-16',
    },
  ],
  defaultVariants: {
    variant: 'linear',
    size: 'md',
  },
});

interface ProgressIndicatorProps extends ViewProps, VariantProps<typeof progressVariants> {
  progress?: number;
  indeterminate?: boolean;
  showPercentage?: boolean;
  animationDuration?: number;
}

const ProgressIndicator = React.forwardRef<View, ProgressIndicatorProps>(
  (
    {
      className,
      variant = 'linear',
      size = 'md',
      progress = 0,
      indeterminate = false,
      showPercentage = false,
      animationDuration = 1000,
      style,
      ...props
    },
    ref
  ) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;
    const indeterminateAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      if (indeterminate) {
        Animated.loop(
          Animated.timing(indeterminateAnim, {
            toValue: 1,
            duration: animationDuration,
            useNativeDriver: true,
          })
        ).start();
      } else {
        Animated.timing(animatedValue, {
          toValue: progress / 100,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    }, [progress, indeterminate, animationDuration, animatedValue, indeterminateAnim]);

    if (variant === 'spinner') {
      return (
        <View
          ref={ref}
          className={cn(progressVariants({ variant, size }), className)}
          style={style}
          {...props}
        >
          <RNActivityIndicator
            size={size === 'sm' ? 'small' : 'large'}
            className="text-primary"
          />
        </View>
      );
    }

    if (variant === 'dots') {
      return (
        <View
          ref={ref}
          className={cn(progressVariants({ variant, size }), 'gap-1', className)}
          style={style}
          {...props}
        >
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              className={cn(
                'rounded-full bg-primary',
                size === 'sm' && 'w-1.5 h-1.5',
                size === 'md' && 'w-2 h-2',
                size === 'lg' && 'w-3 h-3',
                size === 'xl' && 'w-4 h-4'
              )}
              style={{
                opacity: indeterminateAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: 'clamp',
                }),
                transform: [
                  {
                    scale: indeterminateAnim.interpolate({
                      inputRange: [
                        index * 0.15,
                        index * 0.15 + 0.3,
                        index * 0.15 + 0.6,
                        1,
                      ],
                      outputRange: [0.8, 1.2, 0.8, 0.8],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              }}
            />
          ))}
        </View>
      );
    }

    if (variant === 'circular') {
      const strokeWidth = size === 'sm' ? 2 : size === 'md' ? 3 : size === 'lg' ? 4 : 5;
      const radius = size === 'sm' ? 6 : size === 'md' ? 14 : size === 'lg' ? 22 : 30;
      const circumference = 2 * Math.PI * radius;

      return (
        <View
          ref={ref}
          className={cn(progressVariants({ variant, size }), className)}
          style={style}
          {...props}
        >
          <Svg
            width={radius * 2 + strokeWidth * 2}
            height={radius * 2 + strokeWidth * 2}
            className="absolute text-border"
          >
            <Circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
            />
          </Svg>
          <Svg
            width={radius * 2 + strokeWidth * 2}
            height={radius * 2 + strokeWidth * 2}
            className="absolute text-primary"
          >
            <AnimatedCircle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [circumference, 0],
              })}
              strokeLinecap="round"
              transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
            />
          </Svg>
          {showPercentage && (
            <Text
              className="absolute text-caption text-foreground"
            >
              {Math.round(progress)}%
            </Text>
          )}
        </View>
      );
    }

    return (
      <View
        ref={ref}
        className={cn(progressVariants({ variant, size }), 'bg-border', className)}
        style={style}
        {...props}
      >
        {indeterminate ? (
          <Animated.View
            className="h-full rounded-full w-1/3 bg-primary"
            style={{
              transform: [
                {
                  translateX: indeterminateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['-100%', '300%'],
                  }),
                },
              ],
            }}
          />
        ) : (
          <Animated.View
            className="h-full rounded-full bg-primary"
            style={{
              width: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        )}
      </View>
    );
  }
);

ProgressIndicator.displayName = 'ProgressIndicator';

export { ProgressIndicator, progressVariants };
