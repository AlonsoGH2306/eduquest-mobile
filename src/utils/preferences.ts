import * as SecureStore from 'expo-secure-store';

const INTRO_SOUND_KEY = 'eduquest_intro_sound';

export const isIntroSoundEnabled = async (): Promise<boolean> => {
  try {
    return (await SecureStore.getItemAsync(INTRO_SOUND_KEY)) !== 'off';
  } catch {
    return true;
  }
};

export const setIntroSoundEnabled = (enabled: boolean) =>
  SecureStore.setItemAsync(INTRO_SOUND_KEY, enabled ? 'on' : 'off');
