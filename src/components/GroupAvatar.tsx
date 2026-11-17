import { ReactNode, useState } from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { assetUrl, groupColor, groupInitials, GroupLike } from '../utils/groupAppearance';
import { BRAND, FONTS } from '../theme';

interface GroupAvatarProps {
  group: GroupLike;
  size?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function GroupAvatar({ group, size = 48, radius, style }: GroupAvatarProps) {
  const [failed, setFailed] = useState(false);
  const shape = { width: size, height: size, borderRadius: radius ?? Math.round(size / 3) };

  if (group.iconUrl && !failed) {
    return (
      <Image
        source={{ uri: assetUrl(group.iconUrl) }}
        onError={() => setFailed(true)}
        style={[shape, styles.image, style as object]}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <View
      style={[shape, styles.fallback, { backgroundColor: groupColor(group) }, style]}
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[styles.initials, { fontSize: Math.max(11, Math.round(size * 0.26)) }]}>
        {groupInitials(group.name)}
      </Text>
    </View>
  );
}

interface GroupBannerProps {
  group: GroupLike;
  height?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function GroupBanner({ group, height = 120, style, children }: GroupBannerProps) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={[styles.banner, { height, backgroundColor: groupColor(group) }, style]}>
      {group.bannerUrl && !failed ? (
        <Image
          source={{ uri: assetUrl(group.bannerUrl) }}
          onError={() => setFailed(true)}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={styles.bubble} />
          <View style={styles.shade} />
          <View style={[styles.dot, styles.dotBig]} />
          <View style={[styles.dot, styles.dotSmall]} />
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#2a2e4b',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: FONTS.displayHeavy,
    color: BRAND.noche,
  },
  banner: {
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  shade: {
    position: 'absolute',
    bottom: -60,
    left: '25%',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dot: {
    position: 'absolute',
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  dotBig: {
    top: 20,
    right: '33%',
    width: 10,
    height: 10,
  },
  dotSmall: {
    top: 46,
    right: '20%',
    width: 6,
    height: 6,
  },
});
