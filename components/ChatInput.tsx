import { FontAwesome } from '@expo/vector-icons';
import { useUnstableNativeVariable } from 'nativewind';
import React from 'react';
import { View } from 'react-native';
import { Button } from './nativewindui/Button';
import { TextInput } from './TextInput';

interface ChatInputProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onSend: () => void;
  isModelLoaded: boolean;
  isGenerating: boolean;
}

export function ChatInput({
  inputText,
  onInputChange,
  onSend,
  isModelLoaded,
  isGenerating,
}: ChatInputProps) {
  const primaryForeground = `rgb(${useUnstableNativeVariable('--primary-foreground')})`;
  const mutedForeground = `rgb(${useUnstableNativeVariable('--muted-foreground')})`;

  const isSendDisabled = isGenerating || !isModelLoaded || !inputText.trim();

  const sendButton = (
    <Button
      onPress={onSend}
      disabled={isSendDisabled}
      variant="ghost"
      size="sm"
      className="mr-1"
    >
      <FontAwesome name="hand-o-up" size={24} color={isSendDisabled ? mutedForeground : primaryForeground} />
    </Button>
  );

  return (
    <View className="flex-col gap-2 p-2 border-t border-border">
      <TextInput
        placeholder="Type your message..."
        value={inputText}
        onChangeText={onInputChange}
        onClear={() => onInputChange('')}
        editable={isModelLoaded}
        returnKeyType="send"
        onSubmitEditing={onSend}
        multiline
        variant="default"
        size="md"
        containerClassName="flex-1 mb-0"
        autoFocus={true}
        rightIcon={inputText.trim() ? sendButton : null}
      />
    </View>
  );
}
