import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  AppState,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Typography } from '@/components/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useDevotional } from '@/hooks/useDevotional';
import {
  JOURNAL_SECTIONS,
  type JournalDraftFields,
  type JournalSection,
  useDeleteJournalEntry,
  useJournalEntry,
  useSaveJournalEntry,
} from '@/hooks/useJournal';
import {
  loadJournalDraft,
  newDraftKey,
  removeJournalDraft,
  saveJournalDraft,
} from '@/lib/journal-drafts';

type SaveStatus = 'quiet' | 'saving' | 'saved' | 'local';

function singleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function todayDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function emptyDraft(devotionalId: string | null): JournalDraftFields {
  return {
    title: '',
    content: '',
    bibleRef: '',
    section: null,
    entryDate: todayDate(),
    devotionalId,
  };
}

function hasMeaningfulContent(draft: JournalDraftFields): boolean {
  return Boolean(
    draft.title.trim() ||
      draft.content.trim() ||
      draft.bibleRef.trim() ||
      draft.section ||
      draft.devotionalId,
  );
}

export default function JournalEditorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    id?: string | string[];
    devotionalId?: string | string[];
  }>();
  const routeId = singleParam(params.id);
  const linkedDevotionalId = singleParam(params.devotionalId) ?? null;
  const initialEntryId = routeId && routeId !== 'new' ? routeId : undefined;

  const [entryId, setEntryId] = useState<string | undefined>(initialEntryId);
  const [draft, setDraft] = useState<JournalDraftFields>(() =>
    emptyDraft(linkedDevotionalId),
  );
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('quiet');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [revision, setRevision] = useState<number>(0);

  const entryQuery = useJournalEntry(user?.id, entryId);
  const devotionalQuery = useDevotional(
    user?.id,
    draft.devotionalId ?? undefined,
  );
  const saveEntry = useSaveJournalEntry();
  const deleteEntry = useDeleteJournalEntry();

  const draftRef = useRef<JournalDraftFields>(draft);
  const entryIdRef = useRef<string | undefined>(entryId);
  const revisionRef = useRef<number>(revision);
  const savedRevisionRef = useRef<number>(0);
  const hydrationKeyRef = useRef<string | null>(null);
  const saveInFlightRef = useRef<boolean>(false);
  const saveNowRef = useRef<() => Promise<void>>(async () => {});
  const deletedRef = useRef<boolean>(false);
  const storageKeyRef = useRef<string>(
    initialEntryId ?? newDraftKey(linkedDevotionalId),
  );
  const localWriteChainRef = useRef<Promise<void>>(Promise.resolve());

  const queueLocalTask = useCallback(
    (task: () => Promise<void>): Promise<void> => {
      const next = localWriteChainRef.current
        .catch(() => {})
        .then(task)
        .catch(() => {});
      localWriteChainRef.current = next;
      return localWriteChainRef.current;
    },
    [],
  );

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    entryIdRef.current = entryId;
  }, [entryId]);

  useEffect(() => {
    revisionRef.current = revision;
  }, [revision]);

  useEffect(() => {
    if (!user) return;
    if (entryId && entryQuery.isLoading) return;

    const hydrationKey = `${user.id}:${entryId ?? newDraftKey(linkedDevotionalId)}`;
    if (hydrationKeyRef.current === hydrationKey) return;
    hydrationKeyRef.current = hydrationKey;
    let active = true;

    const hydrate = async (): Promise<void> => {
      const storageKey = entryId ?? newDraftKey(linkedDevotionalId);
      const local = await loadJournalDraft(user.id, storageKey);
      if (!active) return;

      const remote = entryQuery.data;
      const remoteDraft: JournalDraftFields | null = remote
        ? {
            title: remote.title ?? '',
            content: remote.content,
            bibleRef: remote.bible_ref ?? '',
            section: JOURNAL_SECTIONS.includes(
              remote.section as JournalSection,
            )
              ? (remote.section as JournalSection)
              : null,
            entryDate: remote.entry_date,
            devotionalId: remote.devotional_id,
          }
        : null;

      const shouldUseLocal =
        Boolean(local) &&
        (!remote ||
          new Date(local!.savedAt).getTime() >
            new Date(remote.updated_at).getTime());

      const nextDraft = shouldUseLocal
        ? local!
        : remoteDraft ?? emptyDraft(linkedDevotionalId);
      setDraft({
        title: nextDraft.title,
        content: nextDraft.content,
        bibleRef: nextDraft.bibleRef,
        section: nextDraft.section,
        entryDate: nextDraft.entryDate,
        devotionalId: nextDraft.devotionalId,
      });
      setSaveStatus(shouldUseLocal ? 'local' : remote ? 'saved' : 'quiet');
      if (shouldUseLocal) {
        revisionRef.current = 1;
        savedRevisionRef.current = 0;
        setRevision(1);
      } else {
        revisionRef.current = 0;
        savedRevisionRef.current = 0;
        setRevision(0);
      }
      storageKeyRef.current = storageKey;
      setHydrated(true);
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, [
    entryId,
    entryQuery.data,
    entryQuery.isLoading,
    linkedDevotionalId,
    user,
  ]);

  const changeDraft = useCallback(
    (change: Partial<JournalDraftFields>): void => {
      setDraft((current) => {
        const next = { ...current, ...change };
        draftRef.current = next;
        return next;
      });
      const nextRevision = revisionRef.current + 1;
      revisionRef.current = nextRevision;
      setRevision(nextRevision);
      setSaveStatus('local');
      setSaveError(null);
    },
    [],
  );

  const saveNow = useCallback(async (): Promise<void> => {
    if (
      !user ||
      !hydrated ||
      deletedRef.current ||
      saveInFlightRef.current ||
      revisionRef.current <= savedRevisionRef.current
    ) {
      return;
    }

    const snapshot = draftRef.current;
    const snapshotRevision = revisionRef.current;
    const currentId = entryIdRef.current;
    const storageKey = storageKeyRef.current;

    if (!hasMeaningfulContent(snapshot)) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshot.entryDate)) {
      setSaveStatus('local');
      setSaveError('Use YYYY-MM-DD for the entry date.');
      return;
    }
    if (snapshot.devotionalId && devotionalQuery.isLoading) return;

    const validatedDevotionalId =
      snapshot.devotionalId &&
      devotionalQuery.data?.id === snapshot.devotionalId
        ? snapshot.devotionalId
        : null;

    saveInFlightRef.current = true;
    setSaveStatus('saving');
    setSaveError(null);
    let remoteSaveSucceeded = false;
    try {
      const saved = await saveEntry.mutateAsync({
        ...snapshot,
        devotionalId: validatedDevotionalId,
        id: currentId,
        userId: user.id,
      });
      remoteSaveSucceeded = true;

      savedRevisionRef.current = snapshotRevision;
      if (!currentId) {
        entryIdRef.current = saved.id;
        storageKeyRef.current = saved.id;
        setEntryId(saved.id);
        await queueLocalTask(async () => {
          if (deletedRef.current) return;
          if (revisionRef.current > snapshotRevision) {
            await saveJournalDraft(user.id, saved.id, {
              ...draftRef.current,
              savedAt: new Date().toISOString(),
            });
          }
          await removeJournalDraft(user.id, storageKey);
        });
        router.replace(`/journal/${saved.id}`);
      }

      if (revisionRef.current === snapshotRevision) {
        await queueLocalTask(async () => {
          if (!deletedRef.current) {
            await removeJournalDraft(user.id, saved.id);
          }
        });
        setSaveStatus('saved');
      } else {
        setSaveStatus('local');
      }
    } catch {
      setSaveStatus('local');
      setSaveError('Your latest changes are saved on this device.');
    } finally {
      saveInFlightRef.current = false;
      if (
        remoteSaveSucceeded &&
        !deletedRef.current &&
        revisionRef.current > savedRevisionRef.current
      ) {
        setTimeout(() => void saveNowRef.current(), 0);
      }
    }
  }, [
    devotionalQuery.data?.id,
    devotionalQuery.isLoading,
    hydrated,
    queueLocalTask,
    router,
    saveEntry,
    user,
  ]);

  useEffect(() => {
    saveNowRef.current = saveNow;
  }, [saveNow]);

  useEffect(() => {
    if (!hydrated || revision === 0 || !user) return;
    const storageKey = storageKeyRef.current;
    const snapshot = draft;
    const snapshotRevision = revision;
    const localTimer = setTimeout(() => {
      if (deletedRef.current || storageKeyRef.current !== storageKey) return;
      void queueLocalTask(() =>
        saveJournalDraft(user.id, storageKey, {
          ...snapshot,
          savedAt: new Date().toISOString(),
        }),
      );
    }, 120);
    const remoteTimer = setTimeout(() => void saveNow(), 900);

    return () => {
      clearTimeout(localTimer);
      clearTimeout(remoteTimer);
      if (
        !deletedRef.current &&
        storageKeyRef.current === storageKey &&
        snapshotRevision > savedRevisionRef.current
      ) {
        void queueLocalTask(() => {
          if (deletedRef.current || storageKeyRef.current !== storageKey) {
            return Promise.resolve();
          }
          return saveJournalDraft(user.id, storageKey, {
            ...snapshot,
            savedAt: new Date().toISOString(),
          });
        });
      }
    };
  }, [
    draft,
    hydrated,
    queueLocalTask,
    revision,
    saveNow,
    user,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (!user || !hydrated || deletedRef.current) return;
      if (state === 'inactive' || state === 'background') {
        const storageKey = storageKeyRef.current;
        const snapshot = draftRef.current;
        void queueLocalTask(() => {
          if (deletedRef.current) return Promise.resolve();
          return saveJournalDraft(user.id, storageKey, {
            ...snapshot,
            savedAt: new Date().toISOString(),
          });
        });
        void saveNowRef.current();
      } else if (state === 'active') {
        void saveNowRef.current();
      }
    });
    return () => subscription.remove();
  }, [hydrated, queueLocalTask, user]);

  const confirmDelete = (): void => {
    if (!user || !entryId) return;
    Alert.alert(
      'Delete this entry?',
      'This private entry will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletedRef.current = true;
            const storageKey = storageKeyRef.current;
            void deleteEntry
              .mutateAsync({ id: entryId, userId: user.id })
              .then(async () => {
                await queueLocalTask(async () => {
                  await removeJournalDraft(user.id, storageKey);
                  if (storageKey !== entryId) {
                    await removeJournalDraft(user.id, entryId);
                  }
                });
                router.back();
              })
              .catch(() => {
                deletedRef.current = false;
                setSaveError('This entry could not be deleted. Please try again.');
              });
          },
        },
      ],
    );
  };

  if (entryId && entryQuery.isLoading && !hydrated) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <LoadingState message="Opening your entry..." />
      </View>
    );
  }

  if (entryId && entryQuery.isError && !hydrated) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <ErrorState
          title="This entry could not be opened"
          description="If you edited it on this device, your local copy will be restored when available."
          onRetry={() => void entryQuery.refetch()}
        />
      </View>
    );
  }

  if (entryId && !entryQuery.data && hydrated && saveStatus !== 'local') {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="file-text"
          title="Entry not found"
          description="It may have been deleted or may not belong to this account."
        />
      </View>
    );
  }

  const statusText =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'saved'
        ? 'Saved'
        : saveStatus === 'local'
          ? 'Saved on this device'
          : 'Private entry';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 36 },
        ]}
        bottomOffset={24}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.statusRow}>
          <View style={styles.privateLabel}>
            <Feather name="lock" size={14} color={colors.mutedForeground} />
            <Typography variant="caption" color="muted">
              {statusText}
            </Typography>
          </View>
          {saveStatus === 'local' && hasMeaningfulContent(draft) && (
            <Pressable onPress={() => void saveNow()} hitSlop={10}>
              <Typography variant="caption" color="accent">
                Try now
              </Typography>
            </Pressable>
          )}
        </View>

        {saveError && (
          <Typography variant="caption" color="destructive" style={styles.error}>
            {saveError}
          </Typography>
        )}

        <TextInput
          value={draft.title}
          onChangeText={(title) => changeDraft({ title })}
          placeholder="A title, if you want one"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.titleInput, { color: colors.foreground }]}
          accessibilityLabel="Journal entry title"
          returnKeyType="next"
        />

        <View style={styles.metadataRow}>
          <View style={styles.metadataField}>
            <Typography variant="caption" color="muted">
              DATE
            </Typography>
            <TextInput
              value={draft.entryDate}
              onChangeText={(entryDate) => changeDraft({ entryDate })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.metadataInput,
                {
                  color: colors.foreground,
                  borderBottomColor: colors.border,
                },
              ]}
              accessibilityLabel="Entry date"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.metadataField}>
            <Typography variant="caption" color="muted">
              BIBLE REFERENCE
            </Typography>
            <TextInput
              value={draft.bibleRef}
              onChangeText={(bibleRef) => changeDraft({ bibleRef })}
              placeholder="e.g. John 15:5"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.metadataInput,
                {
                  color: colors.foreground,
                  borderBottomColor: colors.border,
                },
              ]}
              accessibilityLabel="Bible reference"
            />
          </View>
        </View>

        <Typography variant="caption" color="muted" style={styles.rhythmLabel}>
          DAILY RHYTHM
        </Typography>
        <View style={styles.rhythm}>
          {JOURNAL_SECTIONS.map((section) => {
            const selected = draft.section === section;
            return (
              <Pressable
                key={section}
                onPress={() =>
                  changeDraft({ section: selected ? null : section })
                }
                style={[
                  styles.rhythmChip,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Typography
                  variant="caption"
                  style={{ color: selected ? colors.primaryForeground : colors.foreground }}
                >
                  {section}
                </Typography>
              </Pressable>
            );
          })}
        </View>

        {draft.devotionalId && (
          <View
            style={[
              styles.devotionalContext,
              {
                backgroundColor: colors.muted,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="book-open" size={18} color={colors.accent} />
            <View style={styles.devotionalCopy}>
              <Typography variant="caption" color="muted">
                DEVOTIONAL
              </Typography>
              <Typography variant="body" numberOfLines={1}>
                {devotionalQuery.data?.title ??
                  (devotionalQuery.isError ? 'Reading unavailable' : 'Loading…')}
              </Typography>
            </View>
            <Pressable
              onPress={() => changeDraft({ devotionalId: null })}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Remove linked devotional"
            >
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        )}

        <View
          style={[
            styles.paper,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <TextInput
            value={draft.content}
            onChangeText={(content) => changeDraft({ content })}
            multiline
            placeholder="Write what you’re noticing, wondering, or praying…"
            placeholderTextColor={colors.mutedForeground}
            textAlignVertical="top"
            style={[styles.editor, { color: colors.foreground }]}
            accessibilityLabel="Journal entry"
          />
        </View>

        {entryId && (
          <Pressable
            onPress={confirmDelete}
            disabled={deleteEntry.isPending}
            style={[
              styles.deleteButton,
              {
                borderColor: colors.destructive,
                borderRadius: colors.radius,
                opacity: deleteEntry.isPending ? 0.6 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Delete journal entry"
          >
            <Feather name="trash-2" size={17} color={colors.destructive} />
            <Typography variant="caption" color="destructive">
              {deleteEntry.isPending ? 'Deleting…' : 'Delete Entry'}
            </Typography>
          </Pressable>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  state: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  statusRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  privateLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  error: {
    marginBottom: 8,
  },
  titleInput: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    lineHeight: 36,
    paddingVertical: 12,
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 16,
    marginBottom: 20,
  },
  metadataField: {
    flex: 1,
    gap: 4,
  },
  metadataInput: {
    borderBottomWidth: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    paddingVertical: 8,
  },
  rhythmLabel: {
    marginBottom: 8,
  },
  rhythm: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  rhythmChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  devotionalContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 18,
  },
  devotionalCopy: {
    flex: 1,
  },
  paper: {
    borderWidth: 1,
    minHeight: 380,
  },
  editor: {
    minHeight: 380,
    padding: 20,
    fontFamily: 'Lora_400Regular',
    fontSize: 19,
    lineHeight: 31,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    marginTop: 28,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});