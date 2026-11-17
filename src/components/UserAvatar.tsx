import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { API_ORIGIN } from '../services/api';
import { colorForName, initialsFor } from './GroupRow';
import { FONTS } from '../theme';

interface UserAvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}

export const resolveAvatarUri = (avatarUrl?: string | null) => {
  if (!avatarUrl) return null;
  return avatarUrl.startsWith('http') ? avatarUrl : `${API_ORIGIN}${avatarUrl}`;
};

export function UserAvatar({ username, avatarUrl, size = 44 }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const uri = resolveAvatarUri(avatarUrl);
  const radius = size * 0.32;

  useEffect(() => setFailed(false), [uri]);

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        onError={() => setFailed(true)}
        style={{ width: size, height: size, borderRadius: radius }}
        accessibilityLabel={`Foto de ${username}`}
      />
    );
  }

  return (
    <View
      style={[styles.fallback, { width: size, height: size, borderRadius: radius, backgroundColor: colorForName(username) }]}
      accessibilityLabel={`Iniciales de ${username}`}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initialsFor(username)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontFamily: FONTS.displayHeavy,
  },
});
