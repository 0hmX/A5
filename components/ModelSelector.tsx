import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { Text } from '@/components/nativewindui/Text';
import useChatStore from '@/store/chatStore';
import useModelStore from '@/store/modelStore';

export function ModelSelector() {
  const sheetRef = useSheetRef();
  const { activeModel, setActiveModel } = useChatStore();
  const { models } = useModelStore();
  const snapPoints = useMemo(() => ['25%', '50%'], []);

  const downloadedModels = Object.values(models).filter(
    (m) => m.status === 'downloaded'
  );

  if (downloadedModels.length === 0) {
    return (
      <View className="p-4 border-t border-border bg-background items-center">
        <Text variant="body" className="text-muted-foreground mb-2">
          No models downloaded.
        </Text>
        <Button variant="secondary" onPress={() => router.push('/(drawer)/models')}>
          Go to Models
        </Button>
      </View>
    );
  }

  const handleSelectModel = (name: string) => {
    setActiveModel(name);
    sheetRef.current?.dismiss();
  };

  return (
    <>
      <View className="p-4 border-t border-border bg-background">
        <Pressable
          onPress={() => sheetRef.current?.present()}
          className="bg-input rounded-lg p-3"
        >
          <Text className="text-foreground">
            {activeModel ? `${activeModel}` : 'Select a model'}
          </Text>
        </Pressable>
      </View>

      <Sheet ref={sheetRef} snapPoints={snapPoints}>
        <View className="p-4">
            <Text variant="heading" className="text-center mb-4">Select a Model</Text>
            {downloadedModels.map(({ model }) => (
              <Pressable
                key={model.name}
                onPress={() => handleSelectModel(model.name)}
                className={`p-4 rounded-lg mb-2 ${
                  activeModel === model.name ? 'bg-primary' : 'bg-card'
                }`}
              >
                <Text
                  className={
                    activeModel === model.name
                      ? 'text-primary-foreground'
                      : 'text-foreground'
                  }
                >
                  {model.name}
                </Text>
              </Pressable>
            ))}
        </View>
      </Sheet>
    </>
  );
}