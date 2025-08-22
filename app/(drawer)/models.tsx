import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { LLMServiceFactory } from '@/services/llm/LLMServiceFactory';
import useAppStore from '@/store/appStore';
import { ModelState } from '@/store/types';
import ExpoLlmMediapipe from 'expo-llm-mediapipe';
import { useEffect } from 'react';
import { Button, SectionList, StyleSheet, View } from 'react-native';

interface ModelItemProps {
  item: ModelState;
  isActive: boolean;
  onSetActive: (name: string) => void;
  onDownload: (name: string) => void;
  onDelete: (name: string) => void;
  progress: number;
}

const ModelItem: React.FC<ModelItemProps> = ({ item, isActive, onSetActive, onDownload, onDelete, progress }) => {
  const colors = useTheme();

  return (
    <View style={[styles.modelCard, { backgroundColor: colors.card }]}>
      <View style={styles.modelInfo}>
        <ThemedText style={styles.modelName}>{item.model.name}</ThemedText>
        <ThemedText style={[styles.modelStatus, { color: colors.mutedForeground }]}>{item.status.replace('_', ' ')}</ThemedText>
      </View>
      <View style={styles.modelActions}>
        {item.status === 'downloaded' && !isActive && (
          <>
            <Button title="Set Active" color={colors.accent} onPress={() => onSetActive(item.model.name)} />
            <Button title="Delete" color={colors.destructive} onPress={() => onDelete(item.model.name)} />
          </>
        )}
        {item.status === 'downloaded' && isActive && (
          <>
            <ThemedText style={[styles.activeText, { color: colors.accent }]}>Active</ThemedText>
            <Button title="Delete" color={colors.destructive} onPress={() => onDelete(item.model.name)} />
          </>
        )}
        {item.status === 'not_downloaded' && (
          <Button title="Download" color={colors.accent} onPress={() => onDownload(item.model.name)} />
        )}
        {item.status === 'downloading' && (
          <ThemedText>Downloading... {progress.toFixed(2)}%</ThemedText>
        )}
      </View>
    </View>
  );
};

export default function ModelManagementScreen() {
  console.log('ModelManagementScreen: Initialized');
  const {
    models,
    activeModel,
    progress,
    initializeModels,
    setActiveModel,
    setModelStatus,
    setProgress,
    setError,
  } = useAppStore();

  useEffect(() => {
    console.log('ModelManagementScreen: Initializing models');
    initializeModels();
  }, [initializeModels]);

  const handleSetActive = (name: string) => {
    console.log(`ModelManagementScreen: Setting active model to ${name}`);
    setActiveModel(name);
  };

  const handleDownload = async (modelName: string) => {
    console.log(`ModelManagementScreen: Starting download for ${modelName}`);
    const [llmService, serviceError] = LLMServiceFactory.getService(modelName);

    if (serviceError) {
      console.log(`ModelManagementScreen: Service error: ${serviceError.message}`);
      setError(serviceError.message);
      return;
    }

    setModelStatus(modelName, 'downloading');
    const [_, error] = await llmService.downloadModel(modelName, (p) => {
      console.log(`ModelManagementScreen: Download progress for ${modelName}: ${p * 100}`);
      setProgress(p * 100);
    });

    if (error) {
      console.log(`ModelManagementScreen: Download error for ${modelName}: ${error.message}`);
      setError(error.message);
      setModelStatus(modelName, 'not_downloaded');
    } else {
      console.log(`ModelManagementScreen: Download successful for ${modelName}`);
      setModelStatus(modelName, 'downloaded');
    }
  };

  const handleDelete = async (modelName: string) => {
    console.log(`ModelManagementScreen: Deleting model ${modelName}`);
    const sanitizedModelName = modelName.replace(/\//g, '-');
    try {
      await ExpoLlmMediapipe.deleteDownloadedModel(sanitizedModelName);
      setModelStatus(modelName, 'not_downloaded');
      console.log(`ModelManagementScreen: Deleted model ${modelName}`);
    } catch (e: any) {
      console.log(`ModelManagementScreen: Error deleting model ${modelName}: ${e.message}`);
      setError(e.message);
    }
  };

  const sections = [
    {
      title: 'Downloaded Models',
      data: Object.values(models).filter((m) => m.status === 'downloaded'),
    },
    {
      title: 'Available for Download',
      data: Object.values(models).filter((m) => m.status !== 'downloaded'),
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.model.name}
        renderItem={({ item }) => (
          <ModelItem
            item={item}
            isActive={activeModel === item.model.name}
            onSetActive={handleSetActive}
            onDownload={handleDownload}
            onDelete={handleDelete}
            progress={progress}
          />
        )}
        renderSectionHeader={({ section: { title, data } }) => {
          if (data.length === 0) {
            return null;
          }
          return <ThemedText style={styles.header}>{title}</ThemedText>;
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  modelCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modelStatus: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  modelActions: {
    marginLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeText: {
    fontWeight: 'bold',
  },
});