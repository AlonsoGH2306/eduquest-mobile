import { Modal, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';

interface VideoPlayerModalProps {
  url: string | null;
  title?: string | null;
  onClose: () => void;
}

function Player({ url }: { url: string }) {
  const player = useVideoPlayer(url, (instance) => {
    instance.play();
  });

  return <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />;
}

export function VideoPlayerModal({ url, title, onClose }: VideoPlayerModalProps) {
  return (
    <Modal visible={url !== null} animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text variant="titleSmall" numberOfLines={1} style={styles.title}>
            {title ?? 'Video'}
          </Text>
          <IconButton icon="close" iconColor="#FFFFFF" onPress={onClose} accessibilityLabel="Cerrar video" />
        </View>
        {url ? <Player url={url} /> : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
  },
  video: {
    flex: 1,
  },
});
