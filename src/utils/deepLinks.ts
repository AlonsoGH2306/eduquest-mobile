import Constants from 'expo-constants';

const APP_PREFIX = 'eduquest://';

const withSlash = (value: string) => (value.endsWith('/') ? value : `${value}/`);

const runtimePrefix = (): string | null => {
  const linkingUri = Constants.linkingUri;
  if (linkingUri) return linkingUri.startsWith(APP_PREFIX) ? null : withSlash(linkingUri);
  const hostUri = Constants.expoConfig?.hostUri;
  return __DEV__ && hostUri ? `exp://${hostUri}/--/` : null;
};

export const LINK_PREFIXES = Array.from(
  new Set([APP_PREFIX, runtimePrefix()].filter((prefix): prefix is string => Boolean(prefix)))
);

export const buildGroupInviteLink = (code: string, token?: string) =>
  `${runtimePrefix() ?? APP_PREFIX}groups/${code}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
