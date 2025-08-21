import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import useAppStore from '@/store/appStore';
import { ModelState } from '@/store/types';
import { Link } from 'expo-router';
import { useEffect } from 'react';
import { Button, SectionList, StyleSheet, View } from 'react-native';

interface ModelItemProps {
  item: ModelState;
  isActive: boolean;
  onSetActive: (name: string) => void;
  progress: number;
}

const ModelItem: React.FC<ModelItemProps> = ({ item, isActive, onSetActive, progress }) => {
  const tint = useThemeColor({}, 'tint');
  return (
    <View style={styles.modelCard}>
      <View style={styles.modelInfo}>
        <ThemedText style={styles.modelName}>{item.model.name}</ThemedText>
        <ThemedText style={styles.modelStatus}>{item.status.replace('_', ' ')}</ThemedText>
      </View>
      <View style={styles.modelActions}>
        {item.status === 'downloaded' && !isActive && (
          <Button title="Set Active" color={tint} onPress={() => onSetActive(item.model.name)} />
        )}
        {item.status === 'downloaded' && isActive && (
          <ThemedText style={styles.activeText}>Active</ThemedText>
        )}
        {item.status === 'not_downloaded' && (
          <Link href={{ pathname: '/modal/downloader', params: { modelName: item.model.name } }} asChild>
            <Button title="Download" color={tint} />
          </Link>
        )}
        {item.status === 'downloading' && (
          <ThemedText>Downloading... {progress.toFixed(2)}%</ThemedText>
        )}
      </View>
    </View>
  );
};

export default function ModelManagementScreen() {
  const {
    models,
    activeModel,
    progress,
    initializeModels,
    setActiveModel,
  } = useAppStore();

  useEffect(() => {
    initializeModels();
  }, [initializeModels]);

  const handleSetActive = (name: string) => {
    setActiveModel(name);
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
    backgroundColor: '#222',
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
    color: '#888',
    textTransform: 'capitalize',
  },
  modelActions: {
    marginLeft: 16,
  },
  activeText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
