import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, ProgressBar, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { CommonActions, useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DocumentItem } from '../types';
import * as documentService from '../services/documentService';
import { isUploadedFile } from '../utils/documentPreview';
import { Screen } from '../components/Screen';
import { FormField } from '../components/FormField';
import { TagList } from '../components/TagList';
import { useForm } from '../hooks/useForm';
import { useToast } from '../hooks/useContexts';
import { useUploadDocument } from '../hooks/useUploadDocument';
import { validateDocument } from '../utils/validation';
import { parseTags } from '../utils/format';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { spacing, useAppTheme } from '../theme';

interface UploadDocumentScreenProps {
  route: { params?: { groupId?: number; groupName?: string; document?: DocumentItem } };
}

type SourceMode = 'file' | 'link';

const MAX_FILE_MB = 10;
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const valuesFrom = (document?: DocumentItem) => ({
  title: document?.title ?? '',
  description: document?.description ?? '',
  fileUrl: document?.fileUrl ?? '',
  tags: document?.tags?.join(', ') ?? '',
  course: document?.course ?? '',
  university: document?.university ?? '',
});

const fileNameFromUrl = (url: string) => decodeURIComponent(url.split('?')[0].split('/').pop() ?? 'archivo');

export function UploadDocumentScreen({ route }: UploadDocumentScreenProps) {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const editingDocument = route.params?.document;
  const form = useForm(valuesFrom(editingDocument), validateDocument);
  const groupId = route.params?.groupId;
  const groupName = route.params?.groupName;
  const { upload } = useUploadDocument(groupId);
  const previewTags = parseTags(form.values.tags);
  const [mode, setMode] = useState<SourceMode>(
    editingDocument && !isUploadedFile(editingDocument.fileUrl) ? 'link' : 'file'
  );
  const [uploadingFile, setUploadingFile] = useState(false);
  const [progress, setProgress] = useState(0);
  const hasUploadedFile = isUploadedFile(form.values.fileUrl);

  const changeMode = (next: string) => {
    const nextMode = next as SourceMode;
    if (nextMode === mode) return;
    setMode(nextMode);
    const keepOriginal = editingDocument && (nextMode === 'file') === isUploadedFile(editingDocument.fileUrl);
    form.setField('fileUrl', keepOriginal ? editingDocument.fileUrl : '');
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ACCEPTED_TYPES, copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_FILE_MB * 1024 * 1024) {
      showToast(`El archivo no debe superar los ${MAX_FILE_MB} MB.`, 'error');
      return;
    }
    setUploadingFile(true);
    setProgress(0);
    try {
      const uploaded = await documentService.uploadFile(
        { uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/octet-stream' },
        setProgress
      );
      form.setField('fileUrl', uploaded.url);
      if (!form.values.title.trim()) form.setField('title', asset.name.replace(/\.[^.]+$/, ''));
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      fileUrl: values.fileUrl.trim(),
      tags: parseTags(values.tags),
      course: values.course.trim() || undefined,
      university: values.university.trim() || undefined,
    };
    try {
      if (editingDocument) {
        const updated = await documentService.updateDocument(editingDocument.id, payload);
        const state = navigation.getState();
        const previous = state?.routes[state.index - 1];
        if (previous) {
          navigation.dispatch({ ...CommonActions.setParams({ document: updated }), source: previous.key });
        }
        showToast('Material actualizado', 'success');
        navigation.goBack();
        return;
      }
      await upload(payload);
      showToast(
        groupId ? `Material compartido en ${groupName ?? 'el grupo'}` : 'Material publicado en la biblioteca',
        'success'
      );
      navigation.goBack();
    } catch (error) {
      form.applyServerErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
    }
  });

  return (
    <Screen>
      <Text variant="bodyMedium" style={[styles.intro, { color: theme.colors.muted }]}>
        {editingDocument
          ? 'Los cambios se verán para todos los que tienen acceso a este material.'
          : groupId
            ? `Solo los miembros de ${groupName ?? 'este grupo'} podrán verlo.`
            : 'Todo lo que publiques aquí será visible para toda la comunidad.'}
      </Text>

      <FormField
        label="Título"
        value={form.values.title}
        onChangeText={(text) => form.setField('title', text)}
        error={form.errors.title}
        placeholder="Ej. Resumen Cálculo II, integrales dobles"
        maxLength={150}
      />
      <FormField
        label="Descripción (opcional)"
        value={form.values.description}
        onChangeText={(text) => form.setField('description', text)}
        multiline
        numberOfLines={3}
        placeholder="Qué temas cubre y para qué evaluación sirve"
      />
      <SegmentedButtons
        value={mode}
        onValueChange={changeMode}
        buttons={[
          { value: 'file', label: 'Subir archivo', icon: 'file-upload-outline' },
          { value: 'link', label: 'Pegar enlace', icon: 'link-variant' },
        ]}
        style={styles.segment}
      />
      {mode === 'file' ? (
        <View style={styles.fileBlock}>
          {hasUploadedFile && !uploadingFile ? (
            <View style={[styles.fileChip, { backgroundColor: theme.colors.surfaceVariant }]}>
              <MaterialCommunityIcons name="paperclip" size={18} color={theme.colors.primary} />
              <Text variant="bodyMedium" numberOfLines={1} style={[styles.fileName, { color: theme.colors.ink }]}>
                {fileNameFromUrl(form.values.fileUrl)}
              </Text>
              <Button compact onPress={pickFile}>
                Cambiar
              </Button>
            </View>
          ) : (
            <Button
              mode="outlined"
              icon="file-upload-outline"
              onPress={pickFile}
              disabled={uploadingFile}
              contentStyle={styles.buttonContent}
              style={styles.button}
            >
              {uploadingFile ? `Subiendo… ${progress}%` : 'Elegir archivo'}
            </Button>
          )}
          {uploadingFile ? <ProgressBar progress={progress / 100} style={styles.progress} /> : null}
          <HelperText type={form.errors.fileUrl ? 'error' : 'info'} visible padding="none">
            {form.errors.fileUrl
              ? 'Sube un archivo para continuar.'
              : `PDF, Word, PowerPoint, Excel, texto o imagen · máximo ${MAX_FILE_MB} MB`}
          </HelperText>
        </View>
      ) : (
        <FormField
          label="Enlace del archivo"
          value={form.values.fileUrl}
          onChangeText={(text) => form.setField('fileUrl', text)}
          error={form.errors.fileUrl}
          hint="Google Drive, OneDrive, GitHub o un PDF público."
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          left={<TextInput.Icon icon="link-variant" />}
        />
      )}
      <FormField
        label="Curso (opcional)"
        value={form.values.course}
        onChangeText={(text) => form.setField('course', text)}
        error={form.errors.course}
        placeholder="Ej. Cálculo I"
        maxLength={100}
        left={<TextInput.Icon icon="school-outline" />}
      />
      <FormField
        label="Universidad o colegio (opcional)"
        value={form.values.university}
        onChangeText={(text) => form.setField('university', text)}
        error={form.errors.university}
        placeholder="Ej. UTEC"
        maxLength={100}
        left={<TextInput.Icon icon="domain" />}
      />
      <FormField
        label="Etiquetas (opcional)"
        value={form.values.tags}
        onChangeText={(text) => form.setField('tags', text)}
        hint="Sepáralas con comas: calculo, parcial, utec"
        autoCapitalize="none"
      />
      <TagList tags={previewTags} max={10} />

      {formError ? (
        <Text variant="bodyMedium" style={[styles.formError, { color: theme.colors.error }]}>
          {formError}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          mode="contained"
          icon={editingDocument ? 'content-save-outline' : 'upload'}
          onPress={onSubmit}
          loading={form.submitting}
          disabled={form.submitting || uploadingFile}
          contentStyle={styles.buttonContent}
          style={styles.button}
        >
          {form.submitting ? 'Guardando…' : editingDocument ? 'Guardar cambios' : 'Publicar material'}
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: spacing.md,
  },
  segment: {
    marginBottom: spacing.sm,
  },
  fileBlock: {
    marginBottom: 10,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingVertical: 4,
    borderRadius: 14,
  },
  fileName: {
    flex: 1,
  },
  progress: {
    marginTop: spacing.sm,
    borderRadius: 4,
  },
  formError: {
    marginTop: spacing.md,
  },
  actions: {
    marginTop: spacing.lg,
  },
  button: {
    borderRadius: 14,
  },
  buttonContent: {
    paddingVertical: 6,
  },
});
