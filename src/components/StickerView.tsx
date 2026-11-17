import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { findPackSticker, type StickerAnimation } from '../utils/stickers';
import { uploadedFileUrl } from '../utils/documentPreview';

interface StickerViewProps {
  value: string;
  size?: number;
  animated?: boolean;
}

const DURATION: Record<StickerAnimation, number> = {
  bounce: 1600,
  wiggle: 1600,
  pulse: 1600,
  spin: 2400,
  float: 2400,
  shake: 1200,
};

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => subscription.remove();
  }, []);
  return reduce;
}

function transformFor(animation: StickerAnimation, progress: Animated.Value, size: number) {
  switch (animation) {
    case 'bounce':
      return [
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.3, 0.55, 0.7, 1],
            outputRange: [0, -size * 0.1, 0, -size * 0.03, 0],
          }),
        },
        { scaleY: progress.interpolate({ inputRange: [0, 0.3, 0.55, 1], outputRange: [1, 1.05, 0.92, 1] }) },
      ];
    case 'wiggle':
      return [
        { rotate: progress.interpolate({ inputRange: [0, 0.25, 0.75, 1], outputRange: ['0deg', '-12deg', '12deg', '0deg'] }) },
      ];
    case 'pulse':
      return [{ scale: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.18, 1] }) }];
    case 'spin':
      return [{ rotate: progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: ['0deg', '360deg', '360deg'] }) }];
    case 'float':
      return [{ translateY: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -size * 0.07, 0] }) }];
    case 'shake':
      return [
        {
          translateX: progress.interpolate({
            inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 1],
            outputRange: [0, -size * 0.04, size * 0.04, -size * 0.04, size * 0.04, -size * 0.04, 0, 0],
          }),
        },
      ];
    default:
      return [];
  }
}

export function StickerView({ value, size = 120, animated = true }: StickerViewProps) {
  const pack = findPackSticker(value);
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const animation = pack?.animation;
  const playing = animated && !reduceMotion && animation !== undefined;

  useEffect(() => {
    if (!playing || !animation) {
      progress.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: DURATION[animation],
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [playing, animation, progress]);

  if (pack) {
    return (
      <View
        accessibilityRole="image"
        accessibilityLabel={`Sticker: ${pack.label}`}
        style={[styles.card, { width: size, height: size, backgroundColor: pack.colors[0], borderColor: pack.colors[1] }]}
      >
        <Animated.Text
          style={{
            fontSize: size * 0.4,
            lineHeight: size * 0.5,
            transform: playing ? transformFor(pack.animation, progress, size) : [],
          }}
        >
          {pack.emoji}
        </Animated.Text>
        <Text style={[styles.label, { fontSize: Math.max(10, size * 0.11) }]} numberOfLines={2}>
          {pack.label}
        </Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri: uploadedFileUrl(value) }}
      style={{ width: size, height: size, borderRadius: 16 }}
      resizeMode="contain"
      accessibilityLabel="Sticker"
    />
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 3,
    padding: 6,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
  },
});
