import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FlatList, Linking, RefreshControl, Share, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Dialog, IconButton, Menu, Portal, SegmentedButtons, Text } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DocumentItem, GroupMember, GroupsStackParamList, StudySession } from '../types';
import { DocumentRow } from '../components/DocumentRow';
import { SessionCard } from '../components/SessionCard';
import { MemberRow } from '../components/MemberRow';
import { StateView } from '../components/StateView';
import { ListSkeleton } from '../components/Skeleton';
import { JoinPasswordDialog } from '../components/JoinPasswordDialog';
import { SessionReviewDialog } from '../components/SessionReviewDialog';
import { RecordingDialog } from '../components/RecordingDialog';
import { ReportDialog, type ReportTarget } from '../components/ReportDialog';
import { GroupPasswordDialog } from '../components/GroupPasswordDialog';
import { EditGroupDialog } from '../components/EditGroupDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import * as groupService from '../services/groupService';
import { isAdmin } from '../utils/roles';
import { useGroupOwnerTools } from '../hooks/useGroupOwnerTools';
import { useGroupLive } from '../hooks/useGroupLive';
import { StudyRoomCard } from '../components/StudyRoomCard';
import { GroupAvatar, GroupBanner } from '../components/GroupAvatar';
import { ActionTile } from '../components/ActionTile';
import { screenPadding } from '../components/Screen';
import { useGroupDetail } from '../hooks/useGroupDetail';
import { useGroupJoin } from '../hooks/useGroupJoin';
import { useSessionActions } from '../hooks/useSessionActions';
import { useAuth, useMyGroups, useToast } from '../hooks/useContexts';
import { buildGroupQrValue } from '../utils/groupQr';
import { buildGroupInviteLink } from '../utils/deepLinks';
import { cancelSessionReminder } from '../utils/sessionReminders';
import { getErrorMessage } from '../utils/errors';
import { orderSessions } from '../utils/sessionOrder';
import { FONTS, spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupDetail'>;
type Tab = 'documents' | 'sessions' | 'members';

export function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId, group: initialGroup } = route.params;
  const theme = useAppTheme();
  const { showToast } = useToast();
  const { user } = useAuth();
  const {
    group,
    groupError,
    documents,
    sessions,
    sessionsLoading,
    sessionsError,
    members,
    membersLoading,
    membersError,
    isMember,
    markJoined,
    reload,
    toggleAttendance,
    checkIn,
    reviewSession,
    updateRecording,
    updateGroup,
    removeMember,
    setModerator,
    setMuted,
  } = useGroupDetail(groupId, initialGroup);
  const { groups: myGroups, markSeen, refresh: refreshMyGroups } = useMyGroups();
  const unreadMessages = myGroups.find((mine) => mine.id === groupId)?.unreadMessages ?? 0;
  const handleJoined = useCallback(
    (joined: Parameters<typeof markJoined>[0]) => {
      markJoined(joined);
      refreshMyGroups();
    },
    [markJoined, refreshMyGroups]
  );
  const { start: startJoin, joiningId, dialog } = useGroupJoin(handleJoined);
  const canMarkSeen = isMember && Boolean(group?.member);

  useEffect(() => {
    if (canMarkSeen) markSeen(groupId).catch(() => undefined);
  }, [canMarkSeen, groupId, markSeen]);
  const joining = joiningId === groupId;
  const [tab, setTab] = useState<Tab>('documents');
  const [qrVisible, setQrVisible] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<StudySession | null>(null);
  const { removeSession, deleting } = useSessionActions(groupId);
  const [attendanceBusyId, setAttendanceBusyId] = useState<number | null>(null);
  const [sessionToReview, setSessionToReview] = useState<StudySession | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [recordingSession, setRecordingSession] = useState<StudySession | null>(null);
  const [savingRecording, setSavingRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      reload();
      if (canMarkSeen) markSeen(groupId).catch(() => undefined);
    }, [reload, canMarkSeen, groupId, markSeen])
  );

  const groupName = group?.name ?? `Grupo ${groupId}`;

  const isPrivate = group?.visibility === 'PRIVATE';
  const code = group?.code ?? '';
  const isOwner = Boolean(group && user && group.creatorUsername === user.username);
  const canManageGroup = Boolean(group?.canManage) || isOwner;
  const [onlineIds, setOnlineIds] = useState<Set<number> | null>(null);
  const live = useGroupLive(groupId, isMember);
  const inVoice = live.voice.some((participant) => participant.id === user?.id);

  useEffect(() => {
    if (!isMember || tab !== 'members') return;
    const controller = new AbortController();
    groupService.getOnlineMembers(groupId, controller.signal)
      .then((ids) => setOnlineIds(new Set(ids)))
      .catch(() => undefined);
    return () => controller.abort();
  }, [groupId, isMember, tab]);

  const openVoiceRoom = async () => {
    if (inVoice) {
      await live.leaveVoice();
      return;
    }
    const url = await live.joinVoice();
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const toggleMuted = async () => {
    const muted = !group?.muted;
    try {
      await setMuted(muted);
      showToast(muted ? 'Grupo silenciado' : 'Volverás a recibir avisos del grupo', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const toggleModerator = async (member: GroupMember) => {
    const promote = member.groupRole !== 'MODERATOR';
    try {
      await setModerator(member.id, promote);
      showToast(promote ? `@${member.username} ahora es moderador` : `@${member.username} ya no es moderador`, 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [groupAction, setGroupAction] = useState<'delete' | 'leave' | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const canDelete = isOwner || isAdmin(user?.roles);
  const canLeave = isMember && Boolean(group?.member) && !isOwner;

  useLayoutEffect(() => {
    if (!canDelete && !canLeave && !isMember) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }
    navigation.setOptions({
      headerRight: () => (
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton icon="dots-vertical" onPress={() => setMenuVisible(true)} accessibilityLabel="Opciones del grupo" />
          }
        >
          {canManageGroup && group ? (
            <Menu.Item
              leadingIcon="palette-outline"
              title="Personalizar grupo"
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('GroupAppearance', { group });
              }}
            />
          ) : null}
          {isOwner ? (
            <Menu.Item
              leadingIcon="pencil-outline"
              title="Editar grupo"
              onPress={() => {
                setMenuVisible(false);
                setEditVisible(true);
              }}
            />
          ) : null}
          {isMember ? (
            <Menu.Item
              leadingIcon={group?.muted ? 'bell-outline' : 'bell-off-outline'}
              title={group?.muted ? 'Activar avisos' : 'Silenciar grupo'}
              onPress={() => {
                setMenuVisible(false);
                void toggleMuted();
              }}
            />
          ) : null}
          {canLeave ? (
            <Menu.Item
              leadingIcon="logout"
              title="Salir del grupo"
              onPress={() => {
                setMenuVisible(false);
                setGroupAction('leave');
              }}
            />
          ) : null}
          {canDelete ? (
            <Menu.Item
              leadingIcon="delete-outline"
              title="Eliminar grupo"
              titleStyle={{ color: theme.colors.error }}
              onPress={() => {
                setMenuVisible(false);
                setGroupAction('delete');
              }}
            />
          ) : null}
        </Menu>
      ),
    });
  }, [navigation, menuVisible, isOwner, canManageGroup, group, canDelete, canLeave, isMember, theme.colors.error]);

  const confirmGroupAction = async () => {
    if (!groupAction) return;
    setActionBusy(true);
    try {
      if (groupAction === 'delete') {
        await groupService.deleteGroup(groupId);
        showToast('Grupo eliminado', 'success');
      } else {
        await groupService.leaveGroup(groupId);
        showToast('Saliste del grupo', 'success');
      }
      setGroupAction(null);
      refreshMyGroups();
      navigation.popToTop();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
      setGroupAction(null);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setActionBusy(true);
    try {
      await removeMember(memberToRemove.id);
      showToast(`@${memberToRemove.username} ya no es parte del grupo`, 'success');
      setMemberToRemove(null);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setActionBusy(false);
    }
  };
  const ownerTools = useGroupOwnerTools(groupId, isOwner && qrVisible);
  const inviteToken = ownerTools.invite?.token;

  const handleJoin = () => {
    startJoin(
      group ?? {
        id: groupId,
        name: groupName,
        description: null,
        creatorUsername: '',
        code: '',
        visibility: 'PUBLIC',
        member: false,
        memberCount: 0,
      }
    );
  };

  const shareInvite = async () => {
    const access = isPrivate
      ? inviteToken
        ? ' Con este enlace entras sin contraseña (vence en 7 días).'
        : ' Es privado: pídeme la contraseña para entrar.'
      : '';
    const link = code ? `\n${buildGroupInviteLink(code, inviteToken)}` : '';
    try {
      await Share.share({
        message: `Únete a "${groupName}" en EduQuest: abre el enlace o busca el código ${code} en Grupos.${access}${link}`,
      });
    } catch {
      showToast('No se pudo abrir el menú para compartir.', 'error');
    }
  };

  const editSession = useCallback(
    (session: StudySession) => navigation.navigate('ScheduleSession', { groupId, groupName, session }),
    [navigation, groupId, groupName]
  );

  const onToggleAttendance = useCallback(
    async (session: StudySession) => {
      setAttendanceBusyId(session.id);
      try {
        const reminded = await toggleAttendance(session);
        showToast(
          session.attending
            ? 'Cancelaste tu asistencia'
            : reminded
              ? '¡Listo! Te avisaremos 30 minutos antes'
              : '¡Te esperamos! Entra con «Unirme ahora» para no perder puntos',
          'success'
        );
      } catch (error) {
        showToast(getErrorMessage(error), 'error');
      } finally {
        setAttendanceBusyId(null);
      }
    },
    [toggleAttendance, showToast]
  );

  const onCheckIn = useCallback(
    async (session: StudySession) => {
      setAttendanceBusyId(session.id);
      try {
        await checkIn(session);
        showToast('¡Asistencia registrada! Ganaste 3 puntos', 'success');
      } catch (error) {
        showToast(getErrorMessage(error), 'error');
      } finally {
        setAttendanceBusyId(null);
      }
    },
    [checkIn, showToast]
  );

  const submitReview = async (session: StudySession, rating: number, comment: string) => {
    setSavingReview(true);
    try {
      await reviewSession(session, { rating, comment });
      showToast('¡Gracias por calificar la asesoría!', 'success');
      setSessionToReview(null);
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setSavingReview(false);
    }
  };

  const saveRecording = async (session: StudySession, recordingUrl: string) => {
    setSavingRecording(true);
    setRecordingError(null);
    try {
      await updateRecording(session, recordingUrl);
      showToast(recordingUrl ? 'Grabación adjuntada' : 'Grabación quitada', 'success');
      setRecordingSession(null);
    } catch (error) {
      setRecordingError(getErrorMessage(error));
    } finally {
      setSavingRecording(false);
    }
  };

  const openRecordingDialog = useCallback((session: StudySession) => {
    setRecordingError(null);
    setRecordingSession(session);
  }, []);

  const showReviews = useCallback(
    (session: StudySession) => navigation.navigate('SessionReviews', { groupId, session }),
    [navigation, groupId]
  );

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    try {
      await removeSession(sessionToDelete.id);
      cancelSessionReminder(sessionToDelete.id).catch(() => undefined);
      showToast('Sesión eliminada', 'success');
      setSessionToDelete(null);
      reload();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    }
  };

  const openDocument = useCallback(
    (document: DocumentItem) => navigation.navigate('GroupDocumentDetail', { document }),
    [navigation]
  );

  const header = (
    <View>
      <GroupBanner group={group ?? { name: groupName }} height={112} style={styles.banner} />
      <View style={styles.hero}>
        <GroupAvatar
          group={group ?? { name: groupName }}
          size={76}
          radius={26}
          style={[styles.heroAvatar, { borderColor: theme.colors.background }]}
        />
        <View style={styles.heroText}>
          <Text style={[styles.groupName, { color: theme.colors.ink }]}>{groupName}</Text>
          {group?.creatorUsername ? (
            <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
              Creado por @{group.creatorUsername}
            </Text>
          ) : null}
          {group?.code ? (
            <View style={styles.meta}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isPrivate ? theme.colors.primaryContainer : theme.colors.mintSoft },
                ]}
              >
                <MaterialCommunityIcons
                  name={isPrivate ? 'lock-outline' : 'earth'}
                  size={13}
                  color={isPrivate ? theme.colors.onPrimaryContainer : theme.colors.mintInk}
                />
                <Text
                  variant="labelMedium"
                  style={{ color: isPrivate ? theme.colors.onPrimaryContainer : theme.colors.mintInk }}
                >
                  {isPrivate ? 'Privado' : 'Público'}
                </Text>
              </View>
              <Text variant="labelMedium" style={{ color: theme.colors.muted }}>
                Código #{group.code}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      {group?.description ? (
        <Text variant="bodyLarge" style={[styles.description, { color: theme.colors.onSurface }]}>
          {group.description}
        </Text>
      ) : null}
      {groupError && !group ? (
        <Text variant="bodyMedium" style={{ color: theme.colors.error, marginTop: spacing.sm }}>
          {groupError}
        </Text>
      ) : null}

      {isMember ? (
        <>
          <Button
            mode="contained"
            icon="chat-outline"
            onPress={() => navigation.navigate('GroupChat', { groupId, groupName, canManage: canManageGroup })}
            style={styles.chatButton}
            contentStyle={styles.chatButtonContent}
          >
            {unreadMessages > 0
              ? `Abrir el chat · ${unreadMessages > 99 ? '99+' : unreadMessages} nuevos`
              : 'Abrir el chat del grupo'}
          </Button>
          <View style={styles.actions}>
            <ActionTile
              icon="upload-outline"
              label="Subir material"
              onPress={() => navigation.navigate('GroupUpload', { groupId, groupName })}
            />
            <ActionTile
              icon="calendar-plus"
              label="Agendar sesión"
              onPress={() => navigation.navigate('ScheduleSession', { groupId, groupName })}
            />
            <ActionTile
              icon={inVoice ? 'phone-hangup' : 'headphones'}
              label={inVoice ? 'Salir de voz' : 'Sala de voz'}
              onPress={openVoiceRoom}
              active={inVoice}
              loading={live.busy}
              badge={live.voice.length}
            />
            <ActionTile icon="qrcode" label="Invitar" onPress={() => setQrVisible(true)} />
          </View>
          {live.voice.length > 0 ? (
            <View style={styles.voiceRow} accessibilityLabel={`En la sala de voz: ${live.voice.map((p) => p.username).join(', ')}`}>
              <MaterialCommunityIcons name="volume-high" size={16} color={theme.colors.success} />
              <Text variant="bodySmall" numberOfLines={2} style={[styles.flex, { color: theme.colors.muted }]}>
                En voz: {live.voice.map((participant) => `@${participant.username}`).join(', ')}
              </Text>
            </View>
          ) : null}
          <StudyRoomCard
            room={live.studyRoom}
            myId={user?.id}
            canStop={canManageGroup || live.studyRoom?.startedById === user?.id}
            busy={live.busy}
            onStart={live.startStudy}
            onAction={live.studyAction}
          />
          <SegmentedButtons
            value={tab}
            onValueChange={(value) => setTab(value as Tab)}
            buttons={[
              { value: 'documents', label: `Material (${documents.totalElements})`, labelStyle: styles.segmentLabel },
              { value: 'sessions', label: `Sesiones (${sessions.length})`, labelStyle: styles.segmentLabel },
              { value: 'members', label: `Miembros (${members.length})`, labelStyle: styles.segmentLabel },
            ]}
            style={styles.segment}
          />
        </>
      ) : null}
    </View>
  );

  if (!isMember) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
        <View style={screenPadding}>
          {header}
          <StateView
            kind="empty"
            icon="lock-outline"
            title="Contenido solo para miembros"
            message={
              isPrivate
                ? 'Es un grupo privado. Necesitas la contraseña que te compartió su creador.'
                : 'Únete para ver el material del grupo y los enlaces de las sesiones.'
            }
            actionLabel={joining ? 'Uniéndote…' : 'Unirme al grupo'}
            onAction={joining ? undefined : handleJoin}
          />
        </View>
        <JoinPasswordDialog {...dialog} />
      </View>
    );
  }

  const documentsEmpty = documents.isLoading ? (
    <ListSkeleton count={3} label="Cargando material" />
  ) : documents.error ? (
    <StateView kind="error" compact message={documents.error} actionLabel="Reintentar" onAction={documents.retry} />
  ) : (
    <StateView
      kind="empty"
      compact
      title="Aún no hay material"
      message="Comparte el primer apunte solo con este grupo."
      actionLabel="Subir material"
      onAction={() => navigation.navigate('GroupUpload', { groupId, groupName })}
    />
  );

  const sessionsEmpty = sessionsLoading ? (
    <ListSkeleton count={2} avatar="date" label="Cargando sesiones" />
  ) : sessionsError ? (
    <StateView kind="error" compact message={sessionsError} actionLabel="Reintentar" onAction={reload} />
  ) : (
    <StateView
      kind="empty"
      compact
      icon="calendar-blank-outline"
      title="Sin sesiones agendadas"
      message="Programa una asesoría con enlace de Meet, Zoom o Discord."
      actionLabel="Agendar sesión"
      onAction={() => navigation.navigate('ScheduleSession', { groupId, groupName })}
    />
  );

  const membersEmpty = membersLoading ? (
    <ListSkeleton count={3} avatar="circle" label="Cargando integrantes" />
  ) : membersError ? (
    <StateView kind="error" compact message={membersError} actionLabel="Reintentar" onAction={reload} />
  ) : (
    <StateView kind="empty" compact icon="account-group-outline" title="Este grupo aún no tiene integrantes" />
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      {tab === 'members' ? (
        <FlatList
          data={membersLoading ? [] : members}
          keyExtractor={(item) => `member-${item.id}`}
          renderItem={({ item }) => (
            <MemberRow
              member={item}
              isCurrentUser={item.id === user?.id}
              onMessage={(member) => navigation.navigate('DirectChat', { userId: member.id, username: member.username })}
              online={onlineIds ? onlineIds.has(item.id) : undefined}
              onRemove={canManageGroup && (isOwner || item.groupRole === 'MEMBER') ? setMemberToRemove : undefined}
              onToggleModerator={isOwner ? toggleModerator : undefined}
              onReport={(member) => setReportTarget({ type: 'USER', id: member.id, label: member.username })}
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={membersEmpty}
          refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}
          contentContainerStyle={screenPadding}
        />
      ) : tab === 'documents' ? (
        <FlatList
          data={documents.isLoading ? [] : documents.items}
          keyExtractor={(item) => `doc-${item.id}`}
          renderItem={({ item }) => <DocumentRow document={item} onPress={openDocument} />}
          ListHeaderComponent={header}
          ListEmptyComponent={documentsEmpty}
          ListFooterComponent={documents.isLoadingMore ? <ActivityIndicator style={styles.footer} /> : undefined}
          onEndReached={documents.loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={documents.isRefreshing} onRefresh={reload} />}
          contentContainerStyle={screenPadding}
        />
      ) : (
        <FlatList
          data={sessionsLoading ? [] : orderSessions(sessions)}
          keyExtractor={(item) => `session-${item.id}`}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              busy={attendanceBusyId === item.id}
              onOpenLinkError={() => showToast('No pudimos abrir el enlace.', 'error')}
              onEdit={editSession}
              onDelete={setSessionToDelete}
              onToggleAttendance={onToggleAttendance}
              onCheckIn={onCheckIn}
              onReview={setSessionToReview}
              onShowReviews={showReviews}
              onEditRecording={openRecordingDialog}
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={sessionsEmpty}
          refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}
          contentContainerStyle={screenPadding}
        />
      )}

      <SessionReviewDialog
        session={sessionToReview}
        saving={savingReview}
        onSubmit={submitReview}
        onDismiss={() => setSessionToReview(null)}
      />
      <RecordingDialog
        session={recordingSession}
        saving={savingRecording}
        serverError={recordingError}
        onSave={saveRecording}
        onDismiss={() => setRecordingSession(null)}
      />
      <ReportDialog target={reportTarget} onDismiss={() => setReportTarget(null)} />
      <EditGroupDialog
        group={editVisible ? group : null}
        onDismiss={() => setEditVisible(false)}
        onSave={async (payload) => {
          await updateGroup(payload);
          showToast('Grupo actualizado', 'success');
          setEditVisible(false);
        }}
      />

      <ConfirmDialog
        visible={groupAction !== null}
        title={groupAction === 'delete' ? '¿Eliminar el grupo?' : '¿Salir del grupo?'}
        message={
          groupAction === 'delete'
            ? `Se borrarán «${groupName}», su material, sus sesiones y el chat para todos. No se puede deshacer.`
            : `Dejarás de ver el material, las sesiones y el chat de «${groupName}».${
                isPrivate ? ' Para volver necesitarás la contraseña o una invitación.' : ''
              }`
        }
        confirmLabel={groupAction === 'delete' ? 'Eliminar' : 'Salir'}
        destructive
        loading={actionBusy}
        onConfirm={confirmGroupAction}
        onCancel={() => setGroupAction(null)}
      />

      <ConfirmDialog
        visible={memberToRemove !== null}
        title="¿Quitar del grupo?"
        message={`@${memberToRemove?.username ?? ''} dejará de tener acceso. Podrá volver a unirse con el código o una invitación.`}
        confirmLabel="Quitar"
        destructive
        loading={actionBusy}
        onConfirm={confirmRemoveMember}
        onCancel={() => setMemberToRemove(null)}
      />

      <GroupPasswordDialog
        visible={passwordDialog}
        onDismiss={() => setPasswordDialog(false)}
        onSave={async (password) => {
          await ownerTools.changePassword(password);
          showToast('Contraseña del grupo actualizada', 'success');
          setPasswordDialog(false);
        }}
      />

      <Portal>
        <Dialog visible={sessionToDelete !== null} onDismiss={deleting ? undefined : () => setSessionToDelete(null)}>
          <Dialog.Icon icon="calendar-remove-outline" />
          <Dialog.Title style={styles.centered}>¿Eliminar la sesión?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              «{sessionToDelete?.title}» desaparecerá para todos los miembros del grupo. No se puede deshacer.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSessionToDelete(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
              onPress={confirmDelete}
              loading={deleting}
              disabled={deleting}
            >
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={qrVisible} onDismiss={() => setQrVisible(false)}>
          <Dialog.Title>Invita a tu grupo</Dialog.Title>
          <Dialog.Content style={styles.qrContent}>
            <View style={styles.qrBox}>
              <QRCode
                value={buildGroupQrValue(code || String(groupId), inviteToken)}
                size={200}
                color="#1E2A5A"
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text variant="bodyMedium" style={[styles.qrHint, { color: theme.colors.onSurfaceVariant }]}>
              Tus compañeros lo escanean desde Grupos o buscan este código:
            </Text>
            <Text style={[styles.qrCode, { color: theme.colors.ink }]}>{code || groupId}</Text>
            {isPrivate ? (
              <Text variant="bodySmall" style={[styles.qrHint, { color: theme.colors.muted }]}>
                {isOwner && inviteToken
                  ? 'Este QR y el enlace dejan entrar sin contraseña durante 7 días.'
                  : 'Como el grupo es privado, también les pedirá la contraseña.'}
              </Text>
            ) : null}
            {isOwner ? (
              <View style={styles.ownerActions}>
                {ownerTools.error ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                    {ownerTools.error}
                  </Text>
                ) : null}
                <Button
                  compact
                  icon="refresh"
                  onPress={async () => {
                    if (await ownerTools.regenerate()) {
                      showToast('Enlace nuevo creado. El anterior ya no funciona.', 'success');
                    }
                  }}
                  loading={ownerTools.loading}
                  disabled={ownerTools.loading}
                >
                  Crear enlace nuevo
                </Button>
                {isPrivate ? (
                  <Button compact icon="key-variant" onPress={() => setPasswordDialog(true)}>
                    Cambiar contraseña
                  </Button>
                ) : null}
              </View>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button icon="share-variant" onPress={shareInvite} disabled={isOwner && ownerTools.loading}>
              Compartir
            </Button>
            <Button onPress={() => setQrVisible(false)}>Listo</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  banner: {
    borderRadius: 24,
  },
  hero: {
    paddingHorizontal: spacing.sm,
  },
  heroAvatar: {
    marginTop: -40,
    borderWidth: 4,
  },
  groupName: {
    fontFamily: FONTS.display,
    fontSize: 22,
    lineHeight: 28,
    marginTop: spacing.sm,
  },
  heroText: {
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  description: {
    marginTop: spacing.md,
    lineHeight: 24,
  },
  chatButton: {
    marginTop: spacing.lg,
  },
  chatButtonContent: {
    paddingVertical: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  segmentLabel: {
    fontSize: 12,
    marginHorizontal: 0,
  },
  segment: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  footer: {
    marginVertical: spacing.lg,
  },
  centered: {
    textAlign: 'center',
  },
  qrContent: {
    alignItems: 'center',
  },
  ownerActions: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  qrBox: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  qrHint: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
  qrCode: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 28,
    letterSpacing: 4,
    marginTop: spacing.xs,
  },
});
