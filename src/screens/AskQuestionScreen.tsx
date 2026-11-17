import { useState } from 'react';
import { Button } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../types';
import { askQuestion } from '../services/forumService';
import { Screen } from '../components/Screen';
import { FormField } from '../components/FormField';
import { useToast } from '../hooks/useContexts';
import { getErrorMessage } from '../utils/errors';

type Props = NativeStackScreenProps<HomeStackParamList, 'AskQuestion'>;

export function AskQuestionScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [body, setBody] = useState('');
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);

  const titleError = touched && title.trim().length < 8 ? 'Usa al menos 8 caracteres' : undefined;
  const bodyError = touched && body.trim().length < 15 ? 'Usa al menos 15 caracteres' : undefined;

  const submit = async () => {
    setTouched(true);
    if (title.trim().length < 8 || body.trim().length < 15) return;
    setSending(true);
    try {
      const question = await askQuestion(title.trim(), body.trim(), course.trim());
      showToast('Pregunta publicada', 'success');
      navigation.replace('ForumThread', { questionId: question.id });
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <FormField label="Título" value={title} onChangeText={setTitle} maxLength={150} error={titleError} />
      <FormField label="Curso (opcional)" value={course} onChangeText={setCourse} maxLength={100} />
      <FormField
        label="Detalle"
        value={body}
        onChangeText={setBody}
        multiline
        numberOfLines={6}
        maxLength={5000}
        error={bodyError}
        hint="Explica qué intentaste y en qué parte te trabaste."
      />
      <Button mode="contained" icon="send" onPress={submit} loading={sending} disabled={sending}>
        Publicar pregunta
      </Button>
    </Screen>
  );
}
