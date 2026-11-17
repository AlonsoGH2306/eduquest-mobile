import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Lumi } from './Lumi';
import { FONTS } from '../theme';

interface BrandMarkProps {
  size?: number;
  color?: string;
}

export function BrandMark({ size = 22, color = '#FFFFFF' }: BrandMarkProps) {
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="EduQuest">
      <Lumi size={size * 1.7} animated={false} />
      <Text style={[styles.word, { fontSize: size, lineHeight: size * 1.3, color }]}>EDUQUEST</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  word: {
    fontFamily: FONTS.displayHeavy,
    letterSpacing: -0.5,
  },
});
