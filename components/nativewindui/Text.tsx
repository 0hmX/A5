// components/nativewindui/Text.tsx
import { VariantProps, cva } from 'class-variance-authority';
import { cssInterop } from 'nativewind';
import * as React from 'react';
import { UITextView } from 'react-native-uitextview';

import { cn } from '@/lib/cn';

cssInterop(UITextView, { className: 'style' });

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      display: 'text-display',
      heading: 'text-heading',
      subheading: 'text-subheading',
      'body-lg': 'text-body-lg',
      body: 'text-body',
      caption: 'text-caption',
      label: 'text-label',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
});

const TextClassContext = React.createContext<string | undefined>(undefined);

type TextProps = React.ComponentPropsWithoutRef<typeof UITextView> & VariantProps<typeof textVariants>;


function Text({ className, variant, ...props }: TextProps) {
  const textClassName = React.useContext(TextClassContext);
  
  return (
    <UITextView
      className={cn(textVariants({ variant }), textClassName, className)}
      {...props}
    />
  );
}

export { Text, TextClassContext, textVariants };
