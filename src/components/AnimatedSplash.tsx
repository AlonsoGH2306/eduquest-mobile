import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Lumi } from './Lumi';
import { BRAND, FONTS } from '../theme';
import { useIntroSound } from '../hooks/useIntroSound';

const LUMI_SIZE = 132;

interface AnimatedSplashProps {
  ready: boolean;
  onFinish: () => void;
}

export function AnimatedSplash({ ready, onFinish }: AnimatedSplashProps) {
  const book = useRef(new Animated.Value(0)).current;
  const pages = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const marker = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;
  const [introDone, setIntroDone] = useState(false);
  const playIntroSound = useIntroSound();

  useEffect(() => {
    let mounted = true;
    const showFinalFrame = () => {
      [book, pages, word, marker, tagline].forEach((value) => value.setValue(1));
      playIntroSound();
      setIntroDone(true);
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotion) => {
        if (!mounted) return;
        if (reduceMotion) {
          showFinalFrame();
          return;
        }
        Animated.timing(book, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start(() => {
          if (!mounted) return;
          playIntroSound();
          Animated.sequence([
            Animated.spring(pages, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
            Animated.parallel([
              Animated.timing(word, {
                toValue: 1,
                duration: 420,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(marker, {
                toValue: 1,
                duration: 520,
                delay: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(tagline, { toValue: 1, duration: 320, useNativeDriver: true }),
            Animated.delay(450),
          ]).start(() => {
            if (mounted) setIntroDone(true);
          });
        });
      })
      .catch(() => {
        if (mounted) showFinalFrame();
      });

    return () => {
      mounted = false;
    };
  }, [book, pages, word, marker, tagline, playIntroSound]);

  useEffect(() => {
    if (!introDone || !ready) return;
    Animated.timing(exit, {
      toValue: 0,
      duration: 340,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => onFinish());
  }, [introDone, ready, exit, onFinish]);

  const bookScale = book.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const glowScale = pages.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const splashScale = exit.interpolate({ inputRange: [0, 1], outputRange: [1.08, 1] });
  const wordShift = word.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const taglineShift = tagline.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  return (
    <Animated.View
      pointerEvents={introDone && ready ? 'none' : 'auto'}
      style={[styles.container, { opacity: exit }]}
      accessibilityLabel="Abriendo EduQuest"
    >
      <StatusBar style="light" />
      <View pointerEvents="none" style={styles.planet} />
      <View pointerEvents="none" style={styles.planetLow} />
      <Animated.View style={[styles.content, { transform: [{ scale: splashScale }] }]}>
        <Animated.View style={[styles.lumi, { opacity: book, transform: [{ scale: bookScale }] }]}>
          <Animated.View style={[styles.halo, { opacity: pages, transform: [{ scale: glowScale }] }]} />
          <Lumi mood="happy" size={LUMI_SIZE} animated={false} />
        </Animated.View>

        <Animated.View style={[styles.wordWrap, { opacity: word, transform: [{ translateY: wordShift }] }]}>
          <Animated.View style={[styles.marker, { transform: [{ skewX: '-12deg' }, { scaleX: marker }] }]} />
          <Animated.Text style={styles.word}>EDUQUEST</Animated.Text>
        </Animated.View>

        <Animated.Text style={[styles.tagline, { opacity: tagline, transform: [{ translateY: taglineShift }] }]}>
          Estudiar juntos ilumina
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#141634',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    overflow: 'hidden',
  },
  planet: {
    position: 'absolute',
    top: -140,
    left: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: BRAND.cielo,
  },
  planetLow: {
    position: 'absolute',
    bottom: -160,
    right: -120,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: BRAND.cieloProfundo,
  },
  content: {
    alignItems: 'center',
  },
  lumi: {
    width: LUMI_SIZE,
    height: LUMI_SIZE,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: LUMI_SIZE * 1.5,
    height: LUMI_SIZE * 1.5,
    borderRadius: LUMI_SIZE,
    backgroundColor: 'rgba(255, 210, 94, 0.14)',
  },
  wordWrap: {
    alignSelf: 'center',
  },
  marker: {
    position: 'absolute',
    left: -10,
    right: -12,
    bottom: 4,
    height: 14,
    borderRadius: 4,
    backgroundColor: BRAND.lumi,
    opacity: 0.9,
    transformOrigin: 'left',
  },
  word: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 38,
    lineHeight: 48,
    letterSpacing: -1,
    color: '#FFFFFF',
  },
  tagline: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: '#d6d9f2',
    marginTop: 10,
  },
});
