import { useCallback, useEffect, useRef } from 'react';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { isIntroSoundEnabled } from '../utils/preferences';

const INTRO_SOUND = require('../../assets/sounds/intro.wav');

export function useIntroSound() {
  const playerRef = useRef<AudioPlayer | null>(null);
  const enabledRef = useRef<Promise<boolean>>(isIntroSoundEnabled());

  useEffect(() => {
    try {
      const player = createAudioPlayer(INTRO_SOUND);
      player.volume = 0.7;
      playerRef.current = player;
    } catch {
      playerRef.current = null;
    }
    return () => {
      const player = playerRef.current;
      playerRef.current = null;
      setTimeout(() => player?.remove(), 2000);
    };
  }, []);

  return useCallback(async () => {
    if (!(await enabledRef.current)) return;
    try {
      playerRef.current?.play();
    } catch {
      return;
    }
  }, []);
}
