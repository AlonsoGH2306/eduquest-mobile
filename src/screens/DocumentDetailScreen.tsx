import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, Text, TextInput } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { GroupsStackParamList, LibraryStackParamList } from '../types';
import { deleteDocument } from '../services/documentService';
import * as adminService from '../services/adminService';
import { canSeeUsers, isAdmin } from '../utils/roles';
import type { DocumentItem, Review } from '../types';
import { Screen } from '../components/Screen';
import { TagList } from '../components/TagList';
import { RatingInput } from '../components/RatingInput';
import { ReviewItem } from '../components/ReviewItem';
import { StateView } from '../components/StateView';
import { ListSkeleton } from '../components/Skeleton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ReportDialog } from '../components/ReportDialog';
import { StudySetDialog } from '../components/StudySetDialog';
import { useReviews } from '../hooks/useReviews';
import { useOpenProfile } from '../hooks/useOpenProfile';
import { useAuth, useSavedDocuments, useToast } from '../hooks/useContexts';
import { downloadUrlFor, opensWithSystemViewer, previewUrlFor } from '../utils/documentPreview';
import { formatDate } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import { FONTS, spacing, useAppTheme } from '../theme';

interface Props {
  route: { params: { document: DocumentItem } };
}

const MAX_COMMENT = 500;

export function DocumentDetailScreen({ route }: Props) {
  const { document } = route.params;
  const theme = useAppTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isSaved, toggleSaved } = useSavedDocuments();
  const saved = isSaved(document.id);
  const [reporting, setReporting] = useState(false);
  const [studying, setStudying] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList & GroupsStackParamList>>();
  const currentRoute = useRoute();
  const openProfile = useOpenProfile();
  const canManage = document.authorUsername === user?.username || isAdmin(user?.roles);
  const canRemove = canManage || canSeeUsers(user?.roles);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [removing, setRemoving] = useState(false);

  const editDocument = () => {
    if (currentRoute.name === 'GroupDocumentDetail') {
      navigation.navigate('GroupUpload', { groupName: document.groupName ?? undefined, document });
    } else {
      navigation.navigate('UploadDocument', { document });
    }
  };

  const removeDocument = async () => {
    setRemoving(true);
    try {
      if (canManage) await deleteDocument(document.id);
      else await adminService.deleteDocument(document.id);
      showToast('Material eliminado', 'success');
      setConfirmingRemoval(false);
      navigation.goBack();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
      setRemoving(false);
    }
  };
  const {
    reviews,
    averageRating,
    totalElements,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    retry,
    addReview,
    editReview,
    removeReview,
  } = useReviews(document.id);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState<Review | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  const myReview = reviews.find((review) => review.authorUsername === user?.username);
  const showForm = !myReview || editing;

  const openFile = async () => {
    if (opensWithSystemViewer(document.fileUrl)) {
      try {
        await Linking.openURL(previewUrlFor(document.fileUrl));
        showToast('Abriendo el archivo con el visor de tu celular…', 'info');
      } catch {
        showToast('No pudimos abrir el archivo.', 'error');
      }
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(previewUrlFor(document.fileUrl), {
        toolbarColor: theme.colors.primary,
        controlsColor: theme.colors.onPrimary,
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch {
      try {
        await Linking.openURL(document.fileUrl);
      } catch {
        showToast('No pudimos abrir el enlace del material.', 'error');
      }
    }
  };

  const downloadUrl = downloadUrlFor(document.fileUrl);

  const downloadFile = async () => {
    if (!downloadUrl) return;
    try {
      await Linking.openURL(downloadUrl);
      showToast('Descargando el material…', 'info');
    } catch {
      showToast('No pudimos iniciar la descarga.', 'error');
    }
  };

  const onToggleSave = async () => {
    try {
      const nowSaved = await toggleSaved(document.id);
      showToast(nowSaved ? 'Guardado en tus favoritos' : 'Quitado de tus favoritos', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const startEditing = (review: Review) => {
    setEditing(review);
    setRating(review.rating);
    setComment(review.comment ?? '');
    setFormError(null);
  };

  const cancelEditing = () => {
    setEditing(null);
    setRating(0);
    setComment('');
    setFormError(null);
  };

  const submitReview = async () => {
    if (rating < 1) {
      setFormError('Elige de 1 a 5 estrellas.');
      return;
    }
    if (comment.length > MAX_COMMENT) {
      setFormError(`Máximo ${MAX_COMMENT} caracteres.`);
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await editReview(editing.id, rating, comment.trim());
        showToast('Reseña actualizada', 'success');
      } else {
        await addReview(rating, comment.trim());
        showToast('Reseña publicada', 'success');
      }
      cancelEditing();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await removeReview(toDelete.id);
      showToast('Reseña eliminada', 'success');
      if (editing?.id === toDelete.id) cancelEditing();
      setToDelete(null);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen>
      <Text variant="headlineSmall" style={{ color: theme.colors.ink }}>
        {document.title}
      </Text>
      <Text variant="bodyMedium" style={[styles.meta, { color: theme.colors.muted }]}>
        Compartido por{' '}
        {document.authorId ? (
          <Text
            style={{ color: theme.colors.primary, fontWeight: '600' }}
            onPress={() => openProfile(document.authorId as number)}
            accessibilityRole="link"
          >
            @{document.authorUsername}
          </Text>
        ) : (
          `@${document.authorUsername}`
        )}{' '}
        el {formatDate(document.uploadedAt)}
        {document.groupName ? ` en el grupo ${document.groupName}` : ' en la biblioteca pública'}
      </Text>
      {document.course || document.university ? (
        <View style={styles.chips}>
          {document.course ? (
            <Chip compact icon="school-outline">
              {document.course}
            </Chip>
          ) : null}
          {document.university ? (
            <Chip compact icon="domain">
              {document.university}
            </Chip>
          ) : null}
        </View>
      ) : null}
      <TagList tags={document.tags ?? []} max={8} />

      {document.description ? (
        <Text variant="bodyLarge" style={[styles.description, { color: theme.colors.onSurface }]}>
          {document.description}
        </Text>
      ) : null}

      <View style={styles.mainActions}>
        <Button
          mode="contained"
          icon="eye-outline"
          onPress={openFile}
          style={[styles.open, styles.flexButton]}
          contentStyle={styles.openContent}
        >
          Ver material
        </Button>
        {downloadUrl ? (
          <Button
            mode="contained-tonal"
            icon="download"
            onPress={downloadFile}
            style={[styles.open, styles.flexButton]}
            contentStyle={styles.openContent}
          >
            Descargar
          </Button>
        ) : null}
      </View>
      <Button mode="contained-tonal" icon="creation" onPress={() => setStudying(true)} style={styles.study}>
        Estudiar con IA: quiz o flashcards
      </Button>
      <View style={styles.secondaryActions}>
        <Button mode="outlined" icon={saved ? 'bookmark' : 'bookmark-outline'} onPress={onToggleSave} style={styles.secondary}>
          {saved ? 'Guardado' : 'Guardar'}
        </Button>
        {canManage ? (
          <Button mode="text" icon="pencil-outline" onPress={editDocument}>
            Editar
          </Button>
        ) : null}
        {canRemove ? (
          <Button mode="text" icon="delete-outline" textColor={theme.colors.error} onPress={() => setConfirmingRemoval(true)}>
            Eliminar
          </Button>
        ) : null}
        {document.authorUsername !== user?.username ? (
          <Button mode="text" icon="flag-outline" textColor={theme.colors.error} onPress={() => setReporting(true)}>
            Reportar
          </Button>
        ) : null}
      </View>

      <Divider style={styles.divider} />

      <View style={styles.reviewsHeader}>
        <Text variant="titleLarge" style={{ color: theme.colors.ink }}>
          Reseñas
        </Text>
        {averageRating !== null ? (
          <View style={styles.average}>
            <Text style={[styles.averageValue, { color: theme.colors.ink }]}>{averageRating.toFixed(1)}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
              de 5, {totalElements} {totalElements === 1 ? 'opinión' : 'opiniones'}
            </Text>
          </View>
        ) : null}
      </View>

      {showForm ? (
        <View style={[styles.form, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text variant="titleSmall" style={{ color: theme.colors.ink }}>
            {editing ? 'Edita tu reseña' : '¿Te sirvió este material?'}
          </Text>
          <RatingInput value={rating} onChange={setRating} />
          <TextInput
            mode="outlined"
            placeholder="Cuéntales a otros qué encontrarán aquí (opcional)"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            maxLength={MAX_COMMENT}
            style={styles.comment}
          />
          <Text variant="bodySmall" style={[styles.counter, { color: theme.colors.muted }]}>
            {comment.length}/{MAX_COMMENT}
          </Text>
          {formError ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
              {formError}
            </Text>
          ) : null}
          <View style={styles.formActions}>
            {editing ? (
              <Button onPress={cancelEditing} disabled={saving}>
                Cancelar
              </Button>
            ) : null}
            <Button mode="contained" onPress={submitReview} loading={saving} disabled={saving}>
              {editing ? 'Guardar cambios' : 'Publicar reseña'}
            </Button>
          </View>
        </View>
      ) : null}

      {isLoading ? (
        <ListSkeleton count={2} avatar="circle" label="Cargando reseñas" />
      ) : error && reviews.length === 0 ? (
        <StateView kind="error" compact message={error} actionLabel="Reintentar" onAction={retry} />
      ) : reviews.length === 0 ? (
        <Text variant="bodyMedium" style={[styles.noReviews, { color: theme.colors.muted }]}>
          Aún nadie ha opinado. Tu reseña ayuda a que otros encuentren buen material.
        </Text>
      ) : (
        reviews.map((review) => (
          <ReviewItem
            key={review.id}
            review={review}
            isOwner={review.authorUsername === user?.username}
            onEdit={startEditing}
            onDelete={setToDelete}
          />
        ))
      )}

      {hasMore ? (
        <Button onPress={loadMore} loading={isLoadingMore} disabled={isLoadingMore} style={styles.more}>
          Ver más reseñas
        </Button>
      ) : null}

      <ConfirmDialog
        visible={Boolean(toDelete)}
        title="¿Eliminar tu reseña?"
        message="Se borrará tu calificación y tu comentario. No podrás recuperarla."
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
      <ConfirmDialog
        visible={confirmingRemoval}
        title="¿Eliminar este material?"
        message="Se borrará para todos junto con sus reseñas. No podrás recuperarlo."
        confirmLabel="Eliminar"
        destructive
        loading={removing}
        onConfirm={removeDocument}
        onCancel={() => setConfirmingRemoval(false)}
      />
      <StudySetDialog documentId={document.id} visible={studying} onDismiss={() => setStudying(false)} />
      <ReportDialog
        target={reporting ? { type: 'DOCUMENT', id: document.id, label: document.title } : null}
        onDismiss={() => setReporting(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  study: {
    marginTop: spacing.sm,
  },
  mainActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  secondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: spacing.sm,
  },
  secondary: {
    borderRadius: 14,
  },
  meta: {
    marginTop: spacing.xs,
  },
  description: {
    marginTop: spacing.md,
    lineHeight: 24,
  },
  open: {
    marginTop: spacing.lg,
    borderRadius: 14,
  },
  openContent: {
    paddingVertical: 6,
  },
  divider: {
    marginVertical: spacing.lg,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  average: {
    alignItems: 'flex-end',
  },
  averageValue: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 28,
    lineHeight: 32,
  },
  form: {
    padding: spacing.md,
    borderRadius: 18,
    marginBottom: spacing.md,
  },
  comment: {
    marginTop: spacing.xs,
  },
  counter: {
    textAlign: 'right',
    marginTop: 4,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  noReviews: {
    paddingVertical: spacing.md,
  },
  more: {
    marginTop: spacing.sm,
  },
});
