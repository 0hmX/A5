import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Pressable, PressableProps, PressableStateCallbackType } from 'react-native';

import { Text, TextClassContext } from '@/components/nativewindui/Text';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-md active:opacity-80',
  {
    variants: {
      variant: {
        primary: 'bg-primary',
        secondary: 'bg-secondary border border-border',
        destructive: 'bg-destructive',
        ghost: 'active:bg-muted',
      },
      size: {
        md: 'h-12 px-5 py-2',
        sm: 'h-10 rounded-md px-3',
        lg: 'h-14 rounded-md px-8',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

const buttonTextVariants = cva('text-center font-semibold text-body', {
  variants: {
    variant: {
      primary: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      ghost: 'text-foreground',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

type ButtonProps = PressableProps & VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<React.ComponentRef<typeof Pressable>, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    const renderChildren = (state: PressableStateCallbackType) => {
      if (typeof children === 'function') {
        return children(state);
      }
      if (typeof children === 'string') {
        return <Text>{children}</Text>;
      }
      return children;
    };

    return (
      <Pressable
        ref={ref}
        className={cn(props.disabled && 'opacity-50', buttonVariants({ variant, size, className }))}
        {...props}
      >
        {(state) => (
          <TextClassContext.Provider value={buttonTextVariants({ variant })}>
            {renderChildren(state)}
          </TextClassContext.Provider>
        )}
      </Pressable>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
