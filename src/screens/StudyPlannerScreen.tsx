import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, IconButton, SegmentedButtons, Text } from 'react-native-paper';
import type { CourseInput, Difficulty } from '../types';
import { Screen } from '../components/Screen';
import { ScreenTitle } from '../components/ScreenTitle';
import { FormField } from '../components/FormField';
import { PlanContent } from '../components/PlanContent';
import { PlanProgress } from '../components/PlanProgress';
import { StateView } from '../components/StateView';
import { ListSkeleton } from '../components/Skeleton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useStudyPlans } from '../hooks/useStudyPlans';
import { useToast } from '../hooks/useContexts';
import { formatDate } from '../utils/format';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { spacing, useAppTheme } from '../theme';

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'Baja', label: 'Baja' },
  { value: 'Media', label: 'Media' },
  { value: 'Alta', label: 'Alta' },
];

const MAX_COURSES = 8;
const newCourse = (): CourseInput => ({ name: '', difficulty: 'Media' });

const difficultyText = (difficulty: string) =>
  difficulty === 'Mixta' ? 'Ciclo completo' : `Dificultad ${difficulty.toLowerCase()}`;

const GENERATING_STEPS = [
  'Analizando la dificultad de tus cursos…',
  'Repartiendo los temas por semana…',
  'Agregando técnicas de estudio…',
];

export function StudyPlannerScreen() {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const { plans, loading, refreshing, error, generating, generate, toggleStep, deletePlan, refresh, retry } =
    useStudyPlans();
  const [courses, setCourses] = useState<CourseInput[]>([newCourse()]);
  const [touched, setTouched] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const selected = plans.find((plan) => plan.id === selectedId) ?? plans[0] ?? null;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const removeSelected = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await deletePlan(selected.id);
      showToast('Plan eliminado', 'success');
      setSelectedId(null);
      setConfirmingDelete(false);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!generating) {
      setStepIndex(0);
      return;
    }
    const timer = setInterval(() => setStepIndex((index) => (index + 1) % GENERATING_STEPS.length), 2200);
    return () => clearInterval(timer);
  }, [generating]);

  const errorFor = (course: CourseInput) => {
    const name = course.name.trim();
    if (!name) return 'Escribe el nombre del curso.';
    if (name.length > 100) return 'Máximo 100 caracteres.';
    return null;
  };
  const hasErrors = courses.some((course) => errorFor(course) !== null);

  const updateCourse = (index: number, changes: Partial<CourseInput>) =>
    setCourses((current) => current.map((course, i) => (i === index ? { ...course, ...changes } : course)));

  const onGenerate = async () => {
    setTouched(true);
    if (hasErrors || generating) return;
    try {
      const plan = await generate(courses.map((course) => ({ ...course, name: course.name.trim() })));
      setSelectedId(plan.id);
      setCourses([newCourse()]);
      setTouched(false);
      showToast('Tu plan de estudio está listo', 'success');
    } catch (err) {
      const fields = getFieldErrors(err);
      showToast(Object.values(fields)[0] ?? getErrorMessage(err), 'error');
    }
  };

  const onToggleStep = (index: number) => {
    if (!selected) return;
    toggleStep(selected, index).catch((err) => showToast(getErrorMessage(err), 'error'));
  };

  return (
    <Screen safeTop refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ScreenTitle
        title="Plan de estudio"
        subtitle="Agrega uno o todos los cursos de tu ciclo y qué tan difíciles los sientes. Armamos una ruta semana a semana."
      />

      <View style={[styles.form, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
        {courses.map((course, index) => (
          <View
            key={index}
            style={[styles.course, index > 0 && { borderTopColor: theme.colors.outlineVariant, borderTopWidth: StyleSheet.hairlineWidth }]}
          >
            <View style={styles.courseHeader}>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {courses.length > 1 ? `Curso ${index + 1}` : 'Curso o tema'}
              </Text>
              {courses.length > 1 && (
                <IconButton
                  icon="close"
                  size={18}
                  accessibilityLabel={`Quitar curso ${index + 1}`}
                  onPress={() => setCourses((current) => current.filter((_, i) => i !== index))}
                  disabled={generating}
                />
              )}
            </View>
            <FormField
              label="Nombre del curso"
              value={course.name}
              onChangeText={(text) => updateCourse(index, { name: text })}
              error={touched ? (errorFor(course) ?? undefined) : undefined}
              placeholder="Ej. Cálculo de una variable"
              maxLength={100}
              editable={!generating}
            />
            <SegmentedButtons
              value={course.difficulty}
              onValueChange={(value) => updateCourse(index, { difficulty: value as Difficulty })}
              buttons={DIFFICULTIES.map((option) => ({ ...option, disabled: generating }))}
            />
          </View>
        ))}
        {courses.length < MAX_COURSES && (
          <Button
            mode="text"
            icon="plus"
            onPress={() => setCourses((current) => [...current, newCourse()])}
            disabled={generating}
            style={styles.addCourse}
          >
            Agregar otro curso del ciclo
          </Button>
        )}
        <Button
          mode="contained"
          icon="creation"
          onPress={onGenerate}
          loading={generating}
          disabled={generating}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {generating
            ? GENERATING_STEPS[stepIndex]
            : courses.length > 1
              ? `Generar plan para ${courses.length} cursos`
              : 'Generar plan'}
        </Button>
      </View>

      {loading ? (
        <ListSkeleton count={3} avatar="none" label="Cargando tus planes" />
      ) : error ? (
        <StateView kind="error" compact title="No pudimos cargar tus planes" message={error} actionLabel="Reintentar" onAction={retry} />
      ) : plans.length === 0 ? (
        <StateView
          kind="empty"
          compact
          icon="map-marker-path"
          title="Aún no tienes planes"
          message="Genera el primero con el curso que más te preocupa este ciclo."
        />
      ) : (
        <>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.ink }]}>
            Tus planes
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.history}>
            {plans.map((plan) => {
              const active = selected?.id === plan.id;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => setSelectedId(plan.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.planChip,
                    {
                      backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                      borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <Text
                    variant="titleSmall"
                    numberOfLines={1}
                    style={{ color: active ? theme.colors.onPrimary : theme.colors.ink }}
                  >
                    {plan.courseName}
                  </Text>
                  <Text variant="bodySmall" style={{ color: active ? theme.colors.onPrimary : theme.colors.muted }}>
                    {plan.difficulty === 'Mixta' ? 'Ciclo' : plan.difficulty}, {formatDate(plan.createdAt)}
                  </Text>
                  <PlanProgress completed={plan.completedSteps.length} total={plan.totalSteps} compact inverted={active} />
                </Pressable>
              );
            })}
          </ScrollView>

          {selected ? (
            <View style={[styles.plan, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
              <Text variant="headlineSmall" style={{ color: theme.colors.ink }}>
                {selected.courseName}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.muted, marginTop: 2 }}>
                {difficultyText(selected.difficulty)}, generado el {formatDate(selected.createdAt)}
              </Text>
              <PlanProgress completed={selected.completedSteps.length} total={selected.totalSteps} />
              {selected.totalSteps > 0 && (
                <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.muted }]}>
                  Toca cada actividad cuando la termines. Tu avance se guarda solo.
                </Text>
              )}
              <PlanContent
                content={selected.generatedContent}
                completedSteps={selected.completedSteps}
                onToggleStep={onToggleStep}
              />
              <Button
                mode="text"
                icon="delete-outline"
                textColor={theme.colors.error}
                onPress={() => setConfirmingDelete(true)}
                style={styles.deleteButton}
              >
                Eliminar este plan
              </Button>
            </View>
          ) : null}
        </>
      )}
      <ConfirmDialog
        visible={confirmingDelete}
        title="¿Eliminar el plan?"
        message={`Se borrará el plan de «${selected?.courseName ?? ''}» y su avance. No se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onConfirm={removeSelected}
        onCancel={() => setConfirmingDelete(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  form: {
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  course: {
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  addCourse: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  hint: {
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.md,
    borderRadius: 14,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  history: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  planChip: {
    width: 170,
    padding: spacing.sm + 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  plan: {
    marginTop: spacing.md,
    padding: spacing.md + 4,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
