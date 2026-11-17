import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, IconButton, Text, TextInput } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ForumAnswer, ForumThread, HomeStackParamList } from '../types';
import {
  acceptAnswer,
  answerQuestion,
  deleteAnswer,
  deleteQuestion,
  getThread,
  voteAnswer,
} from '../services/forumService';
import { Screen } from '../components/Screen';
import { StateView } from '../components/StateView';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../hooks/useContexts';
import { useRealtimeEvents } from '../hooks/useRealtime';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { timeAgo } from '../utils/relativeTime';
import { spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'ForumThread'>;
type Pending = { kind: 'question' } | { kind: 'answer'; answer: ForumAnswer } | null;

export function ForumThreadScreen({ route, navigation }: Props) {
  const { questionId } = route.params;
  const theme = useAppTheme();
  const { showToast } = useToast();
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [toDelete, setToDelete] = useState<Pending>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    (signal?: AbortSignal) => {
      setError(null);
      getThread(questionId, signal)
        .then(setThread)
        .catch((err) => {
          if (!isCanceled(err)) setError(getErrorMessage(err));
        });
    },
    [questionId]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useRealtimeEvents((event) => {
    if (event.type === 'forum' && event.questionId === questionId) load();
  });

  if (error) {
    return (
      <Screen>
        <StateView kind="error" title="No pudimos abrir la pregunta" message={error} actionLabel="Reintentar" onAction={() => load()} />
      </Screen>
    );
  }
  if (!thread) {
    return (
      <Screen>
        <StateView kind="loading" message="Cargando pregunta" />
      </Screen>
    );
  }

  const { question, answers, canAccept } = thread;

  const send = async () => {
    if (reply.trim().length < 2) return;
    setSending(true);
    try {
      const answer = await answerQuestion(questionId, reply.trim());
      setThread({ ...thread, answers: [...answers, answer] });
      setReply('');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSending(false);
    }
  };

  const vote = async (answer: ForumAnswer, value: number) => {
    try {
      const updated = await voteAnswer(answer.id, answer.myVote === value ? 0 : value);
      setThread({ ...thread, answers: answers.map((item) => (item.id === updated.id ? updated : item)) });
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const accept = async (answer: ForumAnswer) => {
    try {
      setThread(await acceptAnswer(questionId, answer.id));
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      if (toDelete.kind === 'question') {
        await deleteQuestion(questionId);
        showToast('Pregunta eliminada', 'success');
        navigation.goBack();
        return;
      }
      await deleteAnswer(toDelete.answer.id);
      setThread({ ...thread, answers: answers.filter((item) => item.id !== toDelete.answer.id) });
      setToDelete(null);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.titleRow}>
        <Text variant="titleLarge" style={[styles.flex, { color: theme.colors.ink }]}>
          {question.title}
        </Text>
        {question.canDelete ? (
          <IconButton icon="delete-outline" onPress={() => setToDelete({ kind: 'question' })} accessibilityLabel="Eliminar pregunta" />
        ) : null}
      </View>
      <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
        {question.course ? `${question.course} · ` : ''}@{question.author.username} · {timeAgo(question.createdAt)}
      </Text>
      <Text variant="bodyMedium" style={[styles.text, { color: theme.colors.ink }]}>
        {question.body}
      </Text>

      <Text variant="titleMedium" style={[styles.section, { color: theme.colors.ink }]}>
        {answers.length === 0 ? 'Aún no hay respuestas' : `${answers.length} respuestas`}
      </Text>

      {answers.map((answer) => (
        <View
          key={answer.id}
          style={[
            styles.answer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: answer.accepted ? theme.colors.primary : theme.colors.outlineVariant,
            },
          ]}
        >
          {answer.accepted ? (
            <Chip compact icon="check-decagram" style={styles.acceptedChip}>
              Mejor respuesta
            </Chip>
          ) : null}
          <Text variant="bodyMedium" style={{ color: theme.colors.ink }}>
            {answer.body}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.muted, marginTop: spacing.xs }}>
            @{answer.author.username}
            {answer.author.advisor ? ' · Asesor' : ''} · {timeAgo(answer.createdAt)}
          </Text>
          <View style={styles.actions}>
            <IconButton
              icon={answer.myVote === 1 ? 'thumb-up' : 'thumb-up-outline'}
              size={18}
              disabled={answer.mine}
              onPress={() => vote(answer, 1)}
              accessibilityLabel="Útil"
            />
            <Text variant="labelLarge" style={{ color: theme.colors.ink }}>
              {answer.score}
            </Text>
            <IconButton
              icon={answer.myVote === -1 ? 'thumb-down' : 'thumb-down-outline'}
              size={18}
              disabled={answer.mine}
              onPress={() => vote(answer, -1)}
              accessibilityLabel="No útil"
            />
            <View style={styles.flex} />
            {canAccept ? (
              <Button compact onPress={() => accept(answer)}>
                {answer.accepted ? 'Quitar' : 'Mejor respuesta'}
              </Button>
            ) : null}
            {answer.canDelete ? (
              <IconButton
                icon="delete-outline"
                size={18}
                onPress={() => setToDelete({ kind: 'answer', answer })}
                accessibilityLabel="Eliminar respuesta"
              />
            ) : null}
          </View>
        </View>
      ))}

      <TextInput
        mode="outlined"
        label="Tu respuesta"
        value={reply}
        onChangeText={setReply}
        multiline
        maxLength={5000}
        style={styles.reply}
      />
      <Button mode="contained" icon="send" onPress={send} loading={sending} disabled={sending || reply.trim().length < 2}>
        Responder
      </Button>

      <ConfirmDialog
        visible={toDelete !== null}
        title={toDelete?.kind === 'question' ? 'Eliminar pregunta' : 'Eliminar respuesta'}
        message={
          toDelete?.kind === 'question'
            ? 'Se borrarán la pregunta y todas sus respuestas.'
            : 'La respuesta se borrará para todos.'
        }
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  text: {
    marginTop: spacing.md,
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  answer: {
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  acceptedChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginLeft: -spacing.sm,
  },
  reply: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});
