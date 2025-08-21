import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import useAppStore from '@/store/appStore';
import { Link } from 'expo-router';
import { useEffect } from 'react';
import { Button, StyleSheet, View } from 'react-native';

export default function ModelManagementScreen() {
    const tint = useThemeColor({}, 'tint');
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

    const downloadedModels = Object.values(models).filter(
        (m) => m.status === 'downloaded'
    );
    const availableModels = Object.values(models).filter(
        (m) => m.status !== 'downloaded'
    );

    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.header}>Downloaded Models</ThemedText>
            {downloadedModels.length > 0 ? (
                downloadedModels.map(({ model, backend }) => (
                    <View key={model.name} style={styles.downloadItem}>
                        <View>
                            <ThemedText style={styles.modelItem}>
                                {model.name} {activeModel === model.name ? '(Active)' : ''}
                            </ThemedText>
                            <ThemedText style={styles.backendText}>{backend}</ThemedText>
                        </View>
                        {activeModel !== model.name && (
                            <Button
                                title="Set Active"
                                color={tint}
                                onPress={() => handleSetActive(model.name)}
                            />
                        )}
                    </View>
                ))
            ) : (
                <ThemedText>No models downloaded yet.</ThemedText>
            )}

            <ThemedText style={styles.header}>Available for Download</ThemedText>
            {availableModels.map(({ model, status, backend }) => (
                <View key={model.name} style={styles.downloadItem}>
                    <View>
                        <ThemedText>{model.name}</ThemedText>
                        <ThemedText style={styles.backendText}>{backend}</ThemedText>
                    </View>
                    {status === 'not_downloaded' && model.type === 'online' && (
                        <Link
                            href={{
                                pathname: '/modal/downloader',
                                params: { modelName: model.name },
                            }}
                            asChild
                        >
                            <Button title="Download" color={tint} />
                        </Link>
                    )}
                    {status === 'downloading' && (
                        <ThemedText>Downloading... {progress.toFixed(2)}%</ThemedText>
                    )}
                </View>
            ))}
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
    modelItem: {
        fontSize: 16,
    },
    backendText: {
        fontSize: 12,
        color: '#888',
    },
    downloadItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
});
