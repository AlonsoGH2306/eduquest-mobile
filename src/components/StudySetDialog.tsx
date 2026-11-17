import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Dialog, Portal, SegmentedButtons, Text } from 'react-native-paper';
import { getStudySet } from '../services/studySetService';
import type { StudySet, StudySetType } from '../types';
import { getErrorMessage } from '../utils/errors';
import { formatMath } from '../utils/mathText';
import { spacing, useAppTheme } from '../theme';

const CORRECT_TINT = 'rgba(16, 185, 129, 0.22)';

interface StudySetDialogProps {
  documentId: number;
  visible: boolean;
  onDismiss: () => void;
}

export function StudySetDialog({ documentId, visible, onDismiss }: StudySetDialogProps) {
  const theme = useAppTheme();
  const [type, setType] = useState<StudySetType>('QUIZ');
  const [sets, setSets] = useState<Partial<Record<StudySetType, StudySet>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const requested = useRef(new Set<StudySetType>());
  const current = sets[type];

  const load = useCallback(async (kind: StudySetType, refresh = false) => {
    requested.current.add(kind);
    setLoading(true);
    setError(null);
    try {
      const data = await getStudySet(documentId, kind, refresh);
      setSets((previous) => ({ ...previous, [kind]: data }));
      if (kind === 'QUIZ') setAnswers({});
      else {
        setCardIndex(0);
        setFlipped(false);
      }
    } catch (err) {
      requested.current.delete(kind);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (visible && !requested.current.has(type)) void load(type);
  }, [visible, type, load]);

  const score = current ? current.questions.filter((question, index) => answers[index] === question.answerIndex).length : 0;
  const finished = current ? Object.keys(answers).length === current.questions.length : false;
  const card = current?.cards[cardIndex];

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Estudiar con IA</Dialog.Title>
        <Dialog.Content>
          <SegmentedButtons
            value={type}
            onValueChange={(value) => setType(value as StudySetType)}
            buttons={[
              { value: 'QUIZ', label: 'Quiz', icon: 'help-circle-outline' },
              { value: 'FLASHCARDS', label: 'Flashcards', icon: 'cards-outline' },
            ]}
          />
        </Dialog.Content>
        <Dialog.ScrollArea style={styles.area}>
          <ScrollView contentContainerStyle={styles.body}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
                  Leyendo el material…
                </Text>
              </View>
            ) : error ? (
              <Text style={{ color: theme.colors.error }}>{error}</Text>
            ) : !current ? null : type === 'QUIZ' ? (
              <>
                {current.questions.map((question, index) => {
                  const chosen = answers[index];
                  return (
                    <View key={index} style={styles.question}>
                      <Text variant="titleSmall" style={{ color: theme.colors.ink }}>
                        {index + 1}. {formatMath(question.question)}
                      </Text>
                      {question.options.map((option, optionIndex) => {
                        const answered = chosen !== undefined;
                        const correct = optionIndex === question.answerIndex;
                        const background = !answered
                          ? theme.colors.surfaceVariant
                          : correct
                            ? CORRECT_TINT
                            : chosen === optionIndex
                              ? theme.colors.errorContainer
                              : theme.colors.surfaceVariant;
                        return (
                          <Pressable
                            key={optionIndex}
                            disabled={answered}
                            onPress={() => setAnswers((previous) => ({ ...previous, [index]: optionIndex }))}
                            accessibilityRole="button"
                            style={[styles.option, { backgroundColor: background }]}
                          >
                            <Text variant="bodyMedium" style={{ color: theme.colors.ink }}>
                              {formatMath(option)}
                            </Text>
                          </Pressable>
                        );
                      })}
                      {chosen !== undefined && question.explanation ? (
                        <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
                          {formatMath(question.explanation)}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
                {finished ? (
                  <Text variant="titleMedium" style={[styles.score, { color: theme.colors.primary }]}>
                    Acertaste {score} de {current.questions.length}
                  </Text>
                ) : null}
              </>
            ) : card ? (
              <>
                <Pressable
                  onPress={() => setFlipped((value) => !value)}
                  accessibilityRole="button"
                  accessibilityHint="Toca para voltear la tarjeta"
                  style={[styles.card, { backgroundColor: flipped ? theme.colors.primaryContainer : theme.colors.surfaceVariant }]}
                >
                  <Text variant="labelSmall" style={{ color: theme.colors.muted }}>
                    {flipped ? 'Respuesta' : 'Pregunta'} · {cardIndex + 1}/{current.cards.length}
                  </Text>
                  <Text variant="titleMedium" style={[styles.cardText, { color: theme.colors.ink }]}>
                    {formatMath(flipped ? card.back : card.front)}
                  </Text>
                </Pressable>
                <View style={styles.row}>
                  <Button
                    disabled={cardIndex === 0}
                    onPress={() => {
                      setCardIndex((index) => index - 1);
                      setFlipped(false);
                    }}
                  >
                    Anterior
                  </Button>
                  <Button
                    disabled={cardIndex >= current.cards.length - 1}
                    onPress={() => {
                      setCardIndex((index) => index + 1);
                      setFlipped(false);
                    }}
                  >
                    Siguiente
                  </Button>
                </View>
              </>
            ) : null}
            {current && !loading && !current.generatedByAi ? (
              <Text variant="labelSmall" style={{ color: theme.colors.muted }}>
                La IA no está disponible; se generó una versión básica.
              </Text>
            ) : null}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={() => load(type, true)} disabled={loading}>
            Generar otro
          </Button>
          <Button onPress={onDismiss}>Cerrar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '90%',
  },
  area: {
    maxHeight: 460,
  },
  body: {
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  center: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.lg,
  },
  question: {
    gap: 6,
  },
  option: {
    borderRadius: 10,
    padding: 10,
  },
  score: {
    textAlign: 'center',
  },
  card: {
    minHeight: 180,
    borderRadius: 16,
    padding: spacing.md,
    justifyContent: 'center',
    gap: 8,
  },
  cardText: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
