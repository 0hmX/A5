// components/TextInput.tsx
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';
import { VariantProps, cva } from 'class-variance-authority';
import { cssInterop } from 'nativewind';
import * as React from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from './nativewindui/Text';

cssInterop(RNTextInput, { className: 'style' });

const textInputVariants = cva(
  'w-full rounded-lg px-3 py-3 text-base',
  {
    variants: {
      variant: {
        default: 'border bg-card',
        filled: 'bg-muted border-transparent',
        outline: 'border-2 bg-transparent',
        ghost: 'border-transparent bg-transparent px-0 py-2',
      },
      size: {
        sm: 'h-8 text-sm px-2 py-1',
        md: 'h-10 px-3 py-2',
        lg: 'h-12 text-lg px-4 py-3',
        xl: 'h-14 text-xl px-4 py-3',
      },
      state: {
        default: '',
        focused: 'border-primary',
        error: 'border-destructive',
        disabled: 'opacity-50',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
    },
  }
);

const TextInputClassContext = React.createContext<string | undefined>(undefined);

interface TextInputProps extends RNTextInputProps, VariantProps<typeof textInputVariants> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  showClear?: boolean;
  containerClassName?: string;
}

const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  (
    {
      className,
      containerClassName,
      variant,
      size,
      label,
      error,
      helper,
      leftIcon,
      rightIcon,
      onClear,
      showClear = true,
      value,
      onFocus,
      onBlur,
      editable = true,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const textInputClassName = React.useContext(TextInputClassContext);
    const [isFocused, setIsFocused] = React.useState(false);

    const handleFocus = React.useCallback((e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    }, [onFocus]);

    const handleBlur = React.useCallback((e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    }, [onBlur]);

    const state = React.useMemo(() => {
      if (!editable) return 'disabled';
      if (error) return 'error';
      if (isFocused) return 'focused';
      return 'default';
    }, [editable, error, isFocused]);

    return (
      <View className={cn('mb-4', containerClassName)}>
        {label && (
          <Text
            variant="heading"
            className={cn('mb-1', error && 'text-destructive')}
          >
            {label}
          </Text>
        )}
        
        <View
          className={cn(
            'flex-row items-center',
            variant !== 'ghost' && 'rounded-lg',
            textInputVariants({ variant, size, state }),
            isFocused && variant === 'default' && 'border-primary',
            error && 'border-destructive'
          )}
          style={{
            borderColor: state === 'error' 
              ? theme.colors.notification 
              : state === 'focused' 
                ? theme.colors.primary 
                : theme.colors.border,
          }}
        >
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          
          <RNTextInput
            ref={ref}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={editable}
            placeholderTextColor={theme.colors.text + '40'}
            className={cn(
              'flex-1',
              textInputVariants({ variant, size, state }),
              'border-0 bg-transparent',
              textInputClassName,
              className
            )}
            style={{ color: theme.colors.text }}
            {...props}
          />
          
          {showClear && value && onClear && editable && (
            <TouchableOpacity onPress={onClear} className="ml-2 p-1">
              <Text variant="body">✕</Text>
            </TouchableOpacity>
          )}
          
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
        
        {error && (
          <Text
            variant="caption"
            className="mt-1 text-destructive"
          >
            {error}
          </Text>
        )}
        
        {helper && !error && (
          <Text
            variant="caption"
            className="mt-1"
          >
            {helper}
          </Text>
        )}
      </View>
    );
  }
);

TextInput.displayName = 'TextInput';

export { TextInput, TextInputClassContext, textInputVariants };
