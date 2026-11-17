import type { NavigationHelpers } from '@react-navigation/native';
import type { TabParamList } from '../types';

type TabNavigation = Pick<NavigationHelpers<TabParamList>, 'navigate'>;

export function openNotificationLink(navigation: TabNavigation, link: string | null) {
  if (!link) return;
  const [path, query = ''] = link.split('?');
  const params = new URLSearchParams(query);

  const group = path.match(/^\/groups\/(\d+)$/);
  const channel = Number(params.get('channel'));
  const message = Number(params.get('message'));
  if (group && params.get('tab') === 'chat' && channel > 0) {
    navigation.navigate('Groups', {
      screen: 'GroupChat',
      params: { groupId: Number(group[1]), channelId: channel, messageId: message > 0 ? message : undefined },
    });
    return;
  }
  if (group) {
    navigation.navigate('Groups', { screen: 'GroupDetail', params: { groupId: Number(group[1]) } });
    return;
  }

  const room = path.match(/^\/messages\/rooms\/(\d+)$/);
  if (room) {
    navigation.navigate('Home', { screen: 'RoomChat', params: { roomId: Number(room[1]) } });
    return;
  }

  const conversation = path.match(/^\/messages\/(\d+)$/);
  if (conversation) {
    navigation.navigate('Home', { screen: 'DirectChat', params: { userId: Number(conversation[1]) } });
    return;
  }

  const forum = path.match(/^\/forum\/(\d+)$/);
  if (forum) {
    navigation.navigate('Home', { screen: 'ForumThread', params: { questionId: Number(forum[1]) } });
    return;
  }

  const profile = path.match(/^\/users\/(\d+)$/);
  if (profile) {
    navigation.navigate('Home', { screen: 'UserProfile', params: { userId: Number(profile[1]) } });
    return;
  }

  if (path === '/achievements') {
    navigation.navigate('Profile', { screen: 'Achievements' });
  }
}
