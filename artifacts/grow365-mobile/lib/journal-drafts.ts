import AsyncStorage from '@react-native-async-storage/async-storage';
import type { JournalDraftFields } from '@/hooks/useJournal';

export interface StoredJournalDraft extends JournalDraftFields {
  savedAt: string;
}

function draftKey(userId: string, entryKey: string): string {
  return `grow365.journal-draft.${userId}.${entryKey}`;
}

export function newDraftKey(devotionalId: string | null): string {
  return devotionalId ? `new-devotional-${devotionalId}` : 'new';
}

export async function loadJournalDraft(
  userId: string,
  entryKey: string,
): Promise<StoredJournalDraft | null> {
  const raw = await AsyncStorage.getItem(draftKey(userId, entryKey));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredJournalDraft;
  } catch {
    await AsyncStorage.removeItem(draftKey(userId, entryKey));
    return null;
  }
}

export async function saveJournalDraft(
  userId: string,
  entryKey: string,
  draft: StoredJournalDraft,
): Promise<void> {
  await AsyncStorage.setItem(
    draftKey(userId, entryKey),
    JSON.stringify(draft),
  );
}

export async function removeJournalDraft(
  userId: string,
  entryKey: string,
): Promise<void> {
  await AsyncStorage.removeItem(draftKey(userId, entryKey));
}

export async function moveJournalDraft(
  userId: string,
  fromEntryKey: string,
  toEntryKey: string,
): Promise<void> {
  const draft = await loadJournalDraft(userId, fromEntryKey);
  if (draft) await saveJournalDraft(userId, toEntryKey, draft);
  await removeJournalDraft(userId, fromEntryKey);
}