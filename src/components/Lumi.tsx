import { useEffect, useId, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { BRAND, FONTS } from '../theme';

export type LumiMood = 'happy' | 'sleepy' | 'off' | 'focus' | 'cheer';

interface LumiProps {
  mood?: LumiMood;
  size?: number;
  label?: string;
  animated?: boolean;
}

const BODY = '#2c2f66';
const INK = BRAND.noche;

function Eyes({ mood }: { mood: LumiMood }) {
  if (mood === 'sleepy' || mood === 'off') {
    return (
      <G stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none">
        <Path d="M70 94 q10 7 20 0" />
        <Path d="M110 94 q10 7 20 0" />
      </G>
    );
  }
  if (mood === 'cheer') {
    return (
      <G stroke="#ffffff" strokeWidth={5} strokeLinecap="round" fill="none">
        <Path d="M70 96 q10 -12 20 0" />
        <Path d="M110 96 q10 -12 20 0" />
      </G>
    );
  }
  const pupil = mood === 'focus' ? 0 : 3;
  return (
    <G>
      <Ellipse cx={80} cy={92} rx={12} ry={15} fill="#ffffff" />
      <Ellipse cx={120} cy={92} rx={12} ry={15} fill="#ffffff" />
      <Circle cx={80 + pupil} cy={96} r={7} fill={INK} />
      <Circle cx={120 + pupil} cy={96} r={7} fill={INK} />
      <Circle cx={83 + pupil} cy={92} r={2.5} fill="#ffffff" />
      <Circle cx={123 + pupil} cy={92} r={2.5} fill="#ffffff" />
    </G>
  );
}

function Mouth({ mood }: { mood: LumiMood }) {
  if (mood === 'off') return <Path d="M92 118 q8 -6 16 0" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />;
  if (mood === 'sleepy') return <Ellipse cx={100} cy={118} rx={5} ry={6} fill={INK} />;
  if (mood === 'cheer') return <Path d="M86 112 q14 18 28 0 z" fill={INK} />;
  if (mood === 'focus') return <Path d="M92 116 h16" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
  return <Path d="M90 114 q10 9 20 0" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />;
}

export function Lumi({ mood = 'happy', size = 120, label, animated = true }: LumiProps) {
  const gradientId = `lumi${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const lit = mood !== 'off';
  const tail = lit ? BRAND.lumi : '#6b6f99';
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated || !lit) return;
    let loop: Animated.CompositeAnimation | null = null;
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotion) => {
        if (!active || reduceMotion) return;
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(float, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(float, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ])
        );
        loop.start();
      })
      .catch(() => undefined);
    return () => {
      active = false;
      loop?.stop();
    };
  }, [animated, lit, float]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.05] });

  return (
    <Animated.View
      style={{ width: size, height: size, transform: [{ translateY }] }}
      accessible={Boolean(label)}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    >
      {lit ? (
        <View
          pointerEvents="none"
          style={[
            styles.glow,
            { width: size * 0.62, height: size * 0.62, borderRadius: size, left: size * 0.19, top: size * 0.52 },
          ]}
        />
      ) : null}
      <Svg viewBox="0 0 200 200" width={size} height={size}>
        <Defs>
          <RadialGradient id={gradientId} cx="35%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#5a5fc0" />
            <Stop offset="100%" stopColor={BODY} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={62} cy={88} rx={40} ry={24} fill="#bfe8ff" opacity={0.5} rotation={-28} origin="62, 88" />
        <Ellipse cx={138} cy={88} rx={40} ry={24} fill="#bfe8ff" opacity={0.5} rotation={28} origin="138, 88" />
        <Path d="M82 52 C 74 30, 62 22, 52 20" stroke={BODY} strokeWidth={5} fill="none" strokeLinecap="round" />
        <Path d="M118 52 C 126 30, 138 22, 148 20" stroke={BODY} strokeWidth={5} fill="none" strokeLinecap="round" />
        <Circle cx={52} cy={20} r={8} fill={tail} />
        <Circle cx={148} cy={20} r={8} fill={tail} />
        <Ellipse cx={100} cy={150} rx={40} ry={34} fill={tail} />
        {lit ? <Ellipse cx={100} cy={146} rx={26} ry={20} fill={BRAND.lumiSoft} /> : null}
        <Circle cx={100} cy={92} r={50} fill={`url(#${gradientId})`} />
        <Eyes mood={mood} />
        <Mouth mood={mood} />
        {lit ? (
          <G>
            <Circle cx={66} cy={112} r={6} fill={BRAND.chicle} opacity={0.55} />
            <Circle cx={134} cy={112} r={6} fill={BRAND.chicle} opacity={0.55} />
          </G>
        ) : null}
        {mood === 'sleepy' ? (
          <SvgText x={150} y={60} fill="#c8cbe6" fontSize={22} fontFamily={FONTS.bodyBold}>
            z
          </SvgText>
        ) : null}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 210, 94, 0.28)',
    shadowColor: BRAND.lumi,
    shadowOpacity: 0.8,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
});
