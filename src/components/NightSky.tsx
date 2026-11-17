import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BRAND } from '../theme';

interface NightSkyProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  planet?: boolean;
}

const STARS = [
  { top: '12%', left: '8%', size: 3 },
  { top: '22%', left: '46%', size: 2 },
  { top: '9%', left: '70%', size: 2 },
  { top: '40%', left: '88%', size: 3 },
  { top: '64%', left: '58%', size: 2 },
  { top: '78%', left: '14%', size: 2 },
  { top: '52%', left: '32%', size: 1.5 },
] as const;

export function NightSky({ children, style, planet = true }: NightSkyProps) {
  return (
    <View style={[styles.sky, style]}>
      <View pointerEvents="none" style={styles.bigCircle} />
      <View pointerEvents="none" style={styles.lowCircle} />
      {STARS.map((star) => (
        <View
          key={`${star.top}-${star.left}`}
          pointerEvents="none"
          style={[styles.star, { top: star.top, left: star.left, width: star.size, height: star.size }]}
        />
      ))}
      {planet ? (
        <View pointerEvents="none" style={styles.planetWrap}>
          <View style={styles.planet} />
          <View style={styles.ring} />
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sky: {
    backgroundColor: BRAND.cielo,
    borderRadius: 28,
    overflow: 'hidden',
  },
  bigCircle: {
    position: 'absolute',
    top: -110,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: BRAND.planeta,
  },
  lowCircle: {
    position: 'absolute',
    bottom: -120,
    right: 40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: BRAND.cieloProfundo,
  },
  star: {
    position: 'absolute',
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  planetWrap: {
    position: 'absolute',
    top: 22,
    right: 118,
    width: 64,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planet: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BRAND.chicle,
    borderRightWidth: 6,
    borderBottomWidth: 4,
    borderColor: '#d84b93',
  },
  ring: {
    position: 'absolute',
    width: 60,
    height: 12,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: BRAND.lumi,
    transform: [{ rotate: '-18deg' }],
  },
});
