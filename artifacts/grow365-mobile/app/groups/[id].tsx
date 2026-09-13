import React, { useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import {
  type BookmarkTarget,
  useEntityBookmark,
  useToggleEntityBookmark,
} from '@/hooks/useBookmarks';
import { useColors } from '@/hooks/useColors';
import { useGroupContent } from '@/hooks/useGroupContent';
import { supabase } from '@/lib/supabase';

type Tab = 'Overview' | 'Devotionals' | 'Notes' | 'Questions' | 'Members';

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function GroupBookmarkButton({
  target,
  disabled = false,
}: {
  target: BookmarkTarget;
  disabled?: boolean;
}) {
  const colors = useColors();
  const { user } = useAuth();
  const bookmark = useEntityBookmark(user?.id, target);
  const toggle = useToggleEntityBookmark(user?.id, target);
  const saved = Boolean(bookmark.data);
  return (
    <View>
      <Pressable
        onPress={() => {
          if (!toggle.isPending) toggle.mutate(saved);
        }}
        disabled={disabled || bookmark.isLoading || toggle.isPending}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={saved ? 'Remove bookmark' : 'Save bookmark'}
      >
        <Feather
          name="bookmark"
          size={20}
          color={saved ? colors.accent : colors.mutedForeground}
        />
      </Pressable>
      {toggle.isError && (
        <Typography variant="caption" color="destructive">
          {toggle.error instanceof Error ? toggle.error.message : 'Bookmark failed'}
        </Typography>
      )}
    </View>
  );
}

export default function GroupScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const groupId = one(params.id);
  const groupQuery = useGroupContent(user?.id, groupId);
  const [tab, setTab] = useState<Tab>('Overview');
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const writingRef = useRef(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    kind: 'note' | 'question' | 'reply' | 'member';
    id: string;
  } | null>(null);
  const [noteComposer, setNoteComposer] = useState(false);
  const [questionComposer, setQuestionComposer] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteRef, setNoteRef] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<'private' | 'group'>('group');
  const [noteDevotionalId, setNoteDevotionalId] = useState('');
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionBody, setQuestionBody] = useState('');
  const [questionRef, setQuestionRef] = useState('');
  const [questionDevotionalId, setQuestionDevotionalId] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyParent, setReplyParent] = useState<Record<string, string | null>>({});
  const [replyEditId, setReplyEditId] = useState<string | null>(null);
  const [replyEditText, setReplyEditText] = useState('');

  const clearNote = () => {
    setNoteId(null);
    setNoteComposer(false);
    setNoteTitle('');
    setNoteBody('');
    setNoteRef('');
    setNoteVisibility('group');
    setNoteDevotionalId('');
  };
  const clearQuestion = () => {
    setQuestionId(null);
    setQuestionComposer(false);
    setQuestionTitle('');
    setQuestionBody('');
    setQuestionRef('');
    setQuestionDevotionalId('');
  };
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['group-content', user?.id, groupId] });
  const write = async (
    label: string,
    operation: () => PromiseLike<{ error: { message: string } | null }>,
  ) => {
    if (writingRef.current || pendingAction) return false;
    writingRef.current = true;
    setPendingAction(label);
    setActionError(null);
    try {
      const result = await operation();
      if (result.error) {
        setActionError(result.error.message);
        return false;
      }
      await refresh();
      return true;
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'The action could not be completed.',
      );
      return false;
    } finally {
      writingRef.current = false;
      setPendingAction(null);
    }
  };

  const saveNote = async () => {
    if (!groupId || !noteBody.trim()) {
      setActionError('Write something in your note first.');
      return;
    }
    const ok = noteId
      ? await write('Saving note', () =>
          supabase
            .from('group_notes')
            .update({
              title: noteTitle.trim() || null,
              content: noteBody.trim(),
              bible_ref: noteRef.trim() || null,
              visibility: noteVisibility,
              devotional_id: noteDevotionalId.trim() || null,
            })
            .eq('id', noteId),
        )
      : await write('Posting note', () =>
          supabase.from('group_notes').insert({
            group_id: groupId,
            author_id: user?.id ?? null,
            title: noteTitle.trim() || null,
            content: noteBody.trim(),
            bible_ref: noteRef.trim() || null,
            visibility: noteVisibility,
            devotional_id: noteDevotionalId.trim() || null,
          }),
        );
    if (ok) clearNote();
  };

  const saveQuestion = async () => {
    if (!groupId || !questionTitle.trim()) {
      setActionError('Add a title to your question first.');
      return;
    }
    const ok = questionId
      ? await write('Saving question', () =>
          supabase
            .from('group_questions')
            .update({
              title: questionTitle.trim(),
              body: questionBody.trim() || null,
              bible_ref: questionRef.trim() || null,
              devotional_id: questionDevotionalId.trim() || null,
            })
            .eq('id', questionId),
        )
      : await write('Posting question', () =>
          supabase.from('group_questions').insert({
            group_id: groupId,
            author_id: user?.id ?? null,
            title: questionTitle.trim(),
            body: questionBody.trim() || null,
            bible_ref: questionRef.trim() || null,
            devotional_id: questionDevotionalId.trim() || null,
          }),
        );
    if (ok) clearQuestion();
  };

  const deleteNote = (id: string) => setConfirmDelete({ kind: 'note', id });
  const deleteQuestion = (id: string) =>
    setConfirmDelete({ kind: 'question', id });
  const addReply = async (questionIdToReply: string) => {
    const body = replyText[questionIdToReply]?.trim();
    if (!body) return;
    const ok = await write('Posting reply', () =>
      supabase.from('question_replies').insert({
        question_id: questionIdToReply,
        parent_id: replyParent[questionIdToReply] ?? null,
        author_id: user?.id ?? null,
        body,
      }),
    );
    if (ok) {
      setReplyText((current) => ({ ...current, [questionIdToReply]: '' }));
      setReplyParent((current) => ({ ...current, [questionIdToReply]: null }));
    }
  };
  const editReply = async (id: string) => {
    if (!replyEditText.trim()) return;
    const ok = await write('Saving reply', () =>
      supabase
        .from('question_replies')
        .update({ body: replyEditText.trim() })
        .eq('id', id),
    );
    if (ok) {
      setReplyEditId(null);
      setReplyEditText('');
    }
  };
  const deleteReply = (id: string) => setConfirmDelete({ kind: 'reply', id });
  const changeMemberRole = (memberId: string, role: 'admin' | 'member') => {
    if (!groupId) return;
    void write('Updating member role', () =>
      supabase
        .from('group_members')
        .update({ role })
        .eq('group_id', groupId)
        .eq('user_id', memberId),
    );
  };
  const removeMember = (memberId: string) =>
    setConfirmDelete({ kind: 'member', id: memberId });
  const confirmDeletion = async () => {
    if (!confirmDelete || writingRef.current || pendingAction) return;
    const deletion = confirmDelete;
    setConfirmDelete(null);
    if (deletion.kind === 'note') {
      await write('Deleting note', () =>
        supabase.from('group_notes').delete().eq('id', deletion.id),
      );
    } else if (deletion.kind === 'question') {
      await write('Deleting question', () =>
        supabase.from('group_questions').delete().eq('id', deletion.id),
      );
    } else if (deletion.kind === 'reply') {
      await write('Deleting reply', () =>
        supabase.from('question_replies').delete().eq('id', deletion.id),
      );
    } else if (groupId) {
      await write('Removing member', () =>
        supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', deletion.id),
      );
    }
  };

  if (groupQuery.isLoading) {
    return <View style={[styles.state, { backgroundColor: colors.background }]}><LoadingState message="Opening the group..." /></View>;
  }
  if (groupQuery.isError) {
    return <View style={[styles.state, { backgroundColor: colors.background }]}><ErrorState title="This group could not be opened" description="Check your connection or group membership and try again." onRetry={() => void groupQuery.refetch()} /></View>;
  }
  if (!groupQuery.data) {
    return <View style={[styles.state, { backgroundColor: colors.background }]}><EmptyState icon="users" title="Group not available" description="This group may no longer exist, or you may not be a member." /></View>;
  }

  const {
    group,
    memberCount,
    members,
    notes,
    questions,
    replies,
    linkedDevotionals,
    devotionalOptions,
  } =
    groupQuery.data;
  const devotionalById = new Map(
    devotionalOptions.map((devotional) => [devotional.id, devotional]),
  );
  const topLevelReplies = (questionIdToShow: string) =>
    replies.filter((reply) => reply.question_id === questionIdToShow && !reply.parent_id);
  const childrenOf = (parentId: string) =>
    replies.filter((reply) => reply.parent_id === parentId);
  const renderReply = (reply: (typeof replies)[number], depth = 0): React.ReactNode => (
    <View key={reply.id} style={[styles.reply, { marginLeft: Math.min(depth, 3) * 14 }]}>
      <View style={styles.replyHeader}>
        <Typography variant="caption" color="muted">
          {reply.profiles?.display_name ?? 'Group member'}
        </Typography>
        <Pressable disabled={Boolean(pendingAction)} onPress={() => setReplyParent((current) => ({ ...current, [reply.question_id]: reply.id }))}>
          <Typography variant="caption" color="accent">Reply</Typography>
        </Pressable>
      </View>
      {replyEditId === reply.id ? (
        <>
          <Input value={replyEditText} onChangeText={setReplyEditText} multiline style={styles.replyInput} />
          <View style={styles.inlineActions}>
            <Button title="Save" size="small" disabled={Boolean(pendingAction)} onPress={() => void editReply(reply.id)} />
            <Button title="Cancel" variant="ghost" size="small" disabled={Boolean(pendingAction)} onPress={() => setReplyEditId(null)} />
          </View>
        </>
      ) : (
        <>
          <Typography variant="body">{reply.body}</Typography>
          <View style={styles.inlineActions}>
            <Button title="Edit" variant="ghost" size="small" disabled={Boolean(pendingAction)} onPress={() => { setReplyEditId(reply.id); setReplyEditText(reply.body); }} />
            <Button title="Delete" variant="ghost" size="small" disabled={Boolean(pendingAction)} onPress={() => deleteReply(reply.id)} />
          </View>
        </>
      )}
      {childrenOf(reply.id).map((child) => renderReply(child, depth + 1))}
    </View>
  );

  const devotionalPicker = (
    selected: string,
    setSelected: (value: string) => void,
  ) => (
    <View style={styles.picker}>
      <Typography variant="caption" color="muted">LINK A DEVOTIONAL (OPTIONAL)</Typography>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pickerOptions}
      >
        <Pressable
          disabled={Boolean(pendingAction)}
          onPress={() => setSelected('')}
          style={[styles.pickerOption, !selected && { borderColor: colors.accent }]}
        >
          <Typography variant="caption">None</Typography>
        </Pressable>
        {devotionalOptions.map((devotional) => (
          <Pressable
            key={devotional.id}
            disabled={Boolean(pendingAction)}
            onPress={() => setSelected(devotional.id)}
            style={[
              styles.pickerOption,
              selected === devotional.id && { borderColor: colors.accent },
            ]}
          >
            <Typography variant="caption" numberOfLines={1}>
              Day {devotional.day_of_year} · {devotional.title}
            </Typography>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const form = (kind: 'note' | 'question') => (
    <Card style={styles.formCard}>
      <Typography variant="h3">
        {kind === 'note' ? (noteId ? 'Edit note' : 'New note') : questionId ? 'Edit question' : 'New question'}
      </Typography>
      {kind === 'note' ? (
        <>
          <Input label="Title (optional)" value={noteTitle} onChangeText={setNoteTitle} />
          <Input label="Reflection" value={noteBody} onChangeText={setNoteBody} multiline style={styles.textarea} />
          <Input label="Bible reference" value={noteRef} onChangeText={setNoteRef} placeholder="John 3:16" />
          {devotionalPicker(noteDevotionalId, setNoteDevotionalId)}
          <View style={styles.choiceRow}>
            {(['group', 'private'] as const).map((visibility) => (
              <Pressable key={visibility} disabled={Boolean(pendingAction)} onPress={() => setNoteVisibility(visibility)} style={[styles.choice, { borderColor: noteVisibility === visibility ? colors.accent : colors.border }]}>
                <Typography variant="caption">{visibility === 'group' ? 'Share with group' : 'Private note'}</Typography>
              </Pressable>
            ))}
          </View>
          <View style={styles.formActions}><Button title={noteId ? 'Save changes' : 'Post note'} size="small" disabled={Boolean(pendingAction)} onPress={() => void saveNote()} /><Button title="Cancel" variant="ghost" size="small" disabled={Boolean(pendingAction)} onPress={clearNote} /></View>
        </>
      ) : (
        <>
          <Input label="Question" value={questionTitle} onChangeText={setQuestionTitle} />
          <Input label="Details (optional)" value={questionBody} onChangeText={setQuestionBody} multiline style={styles.textarea} />
          <Input label="Bible reference" value={questionRef} onChangeText={setQuestionRef} placeholder="Romans 8:28" />
          {devotionalPicker(questionDevotionalId, setQuestionDevotionalId)}
          <View style={styles.formActions}><Button title={questionId ? 'Save changes' : 'Ask question'} size="small" disabled={Boolean(pendingAction)} onPress={() => void saveQuestion()} /><Button title="Cancel" variant="ghost" size="small" disabled={Boolean(pendingAction)} onPress={clearQuestion} /></View>
        </>
      )}
    </Card>
  );

  const noteCard = (note: (typeof notes)[number]) => (
    <Card key={note.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}><Typography variant="h3">{note.title ?? 'Shared note'}</Typography><Typography variant="caption" color="muted">{note.profiles?.display_name ?? 'Group member'} · {note.visibility === 'private' ? 'Private' : 'Group'}</Typography></View>
        <GroupBookmarkButton disabled={Boolean(pendingAction)} target={{ kind: 'note', targetId: note.id, label: note.title ?? 'Group note' }} />
      </View>
      {note.bible_ref && <Typography variant="reference" color="accent">{note.bible_ref}</Typography>}
      {note.devotional_id && devotionalById.get(note.devotional_id) && <Typography variant="caption" color="muted">Day {devotionalById.get(note.devotional_id)?.day_of_year} · {devotionalById.get(note.devotional_id)?.title}</Typography>}
      <Typography variant="body" style={styles.body}>{note.content}</Typography>
      <View style={styles.inlineActions}><Button title="Edit" variant="ghost" size="small" disabled={Boolean(pendingAction)} onPress={() => { setNoteId(note.id); setNoteComposer(true); setNoteTitle(note.title ?? ''); setNoteBody(note.content); setNoteRef(note.bible_ref ?? ''); setNoteVisibility(note.visibility); setNoteDevotionalId(note.devotional_id ?? ''); }} /><Button title="Delete" variant="ghost" size="small" disabled={Boolean(pendingAction)} onPress={() => deleteNote(note.id)} /></View>
    </Card>
  );

  const questionCard = (question: (typeof questions)[number]) => (
    <Card key={question.id} style={styles.card}>
      <View style={styles.cardHeader}><View style={styles.cardTitle}><Typography variant="h3">{question.title}</Typography><Typography variant="caption" color="muted">{question.profiles?.display_name ?? 'Group member'} · {question.is_resolved ? 'Resolved' : 'Open'}</Typography></View><GroupBookmarkButton disabled={Boolean(pendingAction)} target={{ kind: 'question', targetId: question.id, label: question.title }} /></View>
      {question.bible_ref && <Typography variant="reference" color="accent">{question.bible_ref}</Typography>}
      {question.devotional_id && devotionalById.get(question.devotional_id) && <Typography variant="caption" color="muted">Day {devotionalById.get(question.devotional_id)?.day_of_year} · {devotionalById.get(question.devotional_id)?.title}</Typography>}
      {question.body && <Typography variant="body" style={styles.body}>{question.body}</Typography>}
      <View style={styles.inlineActions}><Button title={question.is_resolved ? 'Mark open' : 'Resolve'} variant="ghost" size="small" disabled={Boolean(pendingAction)} onPress={() => void write('Updating question', () => supabase.from('group_questions').update({ is_resolved: !question.is_resolved }).eq('id', question.id))} /><Button title="Edit" variant="ghost" size="small" disabled={Boolean(pendingAction)} onPress={() => { setQuestionId(question.id); setQuestionComposer(true); setQuestionTitle(question.title); setQuestionBody(question.body ?? ''); setQuestionRef(question.bible_ref ?? ''); setQuestionDevotionalId(question.devotional_id ?? ''); }} /><Button title="Delete" variant="ghost" size="small" disabled={Boolean(pendingAction)} onPress={() => deleteQuestion(question.id)} /></View>
      <Typography variant="caption" color="muted" style={styles.repliesTitle}>{question.reply_count} {question.reply_count === 1 ? 'reply' : 'replies'}</Typography>
      {topLevelReplies(question.id).map((reply) => renderReply(reply))}
      {replyParent[question.id] && <Typography variant="caption" color="accent" style={styles.replying}>Replying to a member · <Pressable onPress={() => setReplyParent((current) => ({ ...current, [question.id]: null }))}><Typography variant="caption" color="muted">cancel</Typography></Pressable></Typography>}
      <Input label="Reply" value={replyText[question.id] ?? ''} onChangeText={(value) => setReplyText((current) => ({ ...current, [question.id]: value }))} multiline style={styles.replyInput} />
      <Button title="Post reply" size="small" onPress={() => void addReply(question.id)} disabled={Boolean(pendingAction) || !replyText[question.id]?.trim()} />
    </Card>
  );

  const overview = (
    <>
      <Card style={styles.heroCard}><Typography variant="reference" color="muted">YOUR GROUP</Typography><Typography variant="h1" style={styles.title}>{group.name}</Typography><Typography variant="body" color="muted">{memberCount} {memberCount === 1 ? 'member' : 'members'}</Typography>{group.description && <Typography variant="body" color="muted" style={styles.description}>{group.description}</Typography>}</Card>
      <Typography variant="h3" style={styles.sectionTitle}>Recent notes</Typography>
      {notes.slice(0, 2).map(noteCard)}
      {!notes.length && <Typography variant="body" color="muted">No shared notes yet.</Typography>}
      <Typography variant="h3" style={styles.sectionTitle}>Open questions</Typography>
      {questions.filter((question) => !question.is_resolved).slice(0, 2).map(questionCard)}
      {!questions.some((question) => !question.is_resolved) && <Typography variant="body" color="muted">No open questions yet.</Typography>}
    </>
  );

  const tabContent = tab === 'Overview' ? overview : tab === 'Devotionals' ? (
    linkedDevotionals.length ? linkedDevotionals.map((devotional) => <Pressable key={devotional.id} onPress={() => router.push(`/devotional/${devotional.id}`)}><Card style={styles.card}><Typography variant="caption" color="muted">DAY {devotional.day_of_year}</Typography><Typography variant="h3">{devotional.title}</Typography><Typography variant="caption" color="accent">Open devotional →</Typography></Card></Pressable>) : <EmptyState icon="book-open" title="No linked devotionals" description="Link a devotional when you post a note or question." />
  ) : tab === 'Notes' ? <>{!noteComposer && <Button title="New note" disabled={Boolean(pendingAction)} onPress={() => { clearNote(); setNoteComposer(true); setTab('Notes'); }} style={styles.newButton} />}{noteComposer && form('note')}{notes.length ? notes.map(noteCard) : !noteComposer && <EmptyState icon="edit-3" title="No notes yet" description="Share a reflection with your group." />}</> : tab === 'Questions' ? <>{!questionComposer && <Button title="Ask a question" disabled={Boolean(pendingAction)} onPress={() => { clearQuestion(); setQuestionComposer(true); setTab('Questions'); }} style={styles.newButton} />}{questionComposer && form('question')}{questions.length ? questions.map(questionCard) : !questionComposer && <EmptyState icon="help-circle" title="No questions yet" description="Ask your group about today's reading." />}</> : members.length ? members.map((member) => {
    const isOwner = member.user_id === group.owner_id;
    return (
      <Card key={member.user_id} style={styles.member}>
        <View style={styles.avatar}><Typography variant="h3">{(member.profiles?.display_name ?? '?').slice(0, 1).toUpperCase()}</Typography></View>
        <View style={styles.memberDetails}>
          <Typography variant="body">{member.profiles?.display_name ?? 'Group member'}</Typography>
          <Typography variant="caption" color="muted">{member.role}</Typography>
          {isOwner ? <Typography variant="caption" color="muted">Owner role cannot be changed</Typography> : (
            <View style={styles.memberActions}>
              <Button title="Make admin" variant="ghost" size="small" disabled={Boolean(pendingAction)} onPress={() => changeMemberRole(member.user_id, 'admin')} />
              <Button title="Make member" variant="ghost" size="small" disabled={Boolean(pendingAction)} onPress={() => changeMemberRole(member.user_id, 'member')} />
              <Button title="Remove" variant="ghost" size="small" disabled={Boolean(pendingAction)} onPress={() => removeMember(member.user_id)} />
            </View>
          )}
        </View>
      </Card>
    );
  }) : <EmptyState icon="users" title="No members found" description="Members will appear here." />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {tab !== 'Overview' && <Typography variant="h1" style={styles.pageTitle}>{tab}</Typography>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {(['Overview', 'Devotionals', 'Notes', 'Questions', 'Members'] as Tab[]).map((item) => <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, { borderBottomColor: tab === item ? colors.accent : 'transparent' }]}><Typography variant="caption" color={tab === item ? 'foreground' : 'muted'}>{item}</Typography></Pressable>)}
        </ScrollView>
        {pendingAction && (
          <Typography variant="caption" color="muted" style={styles.pending}>
            {pendingAction}…
          </Typography>
        )}
        {actionError && <Card style={styles.errorCard}><Typography variant="caption" color="destructive">{actionError}</Typography></Card>}
        {tabContent}
      </ScrollView>
      <Modal
        visible={Boolean(confirmDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!pendingAction) setConfirmDelete(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <Card style={styles.confirmCard}>
            <Typography variant="h3">Delete this {confirmDelete?.kind}?</Typography>
            <Typography variant="body" color="muted" style={styles.confirmCopy}>
              This cannot be undone. The database policy will decide whether this
              action is allowed.
            </Typography>
            <View style={styles.formActions}>
              <Button
                title="Cancel"
                variant="ghost"
                size="small"
                disabled={Boolean(pendingAction)}
                onPress={() => setConfirmDelete(null)}
              />
              <Button
                title={pendingAction ? 'Deleting…' : 'Delete'}
                size="small"
                disabled={Boolean(pendingAction)}
                onPress={() => void confirmDeletion()}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  state: { flex: 1 },
  content: { padding: 24, paddingBottom: 80 },
  pageTitle: { marginBottom: 12 },
  tabs: { gap: 18, borderBottomWidth: 1, borderBottomColor: '#E2E8E4', marginBottom: 20 },
  tab: { paddingBottom: 12, borderBottomWidth: 2 },
  pending: { marginBottom: 10 },
  heroCard: { padding: 20 },
  title: { marginTop: 6, marginBottom: 8 },
  description: { marginTop: 12 },
  sectionTitle: { marginTop: 26, marginBottom: 12 },
  card: { padding: 18, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  cardTitle: { flex: 1, gap: 3 },
  body: { marginTop: 10 },
  inlineActions: { flexDirection: 'row', gap: 4, marginTop: 8 },
  formCard: { padding: 18, marginBottom: 16 },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  choiceRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  choice: { padding: 10, borderWidth: 1, borderRadius: 8 },
  newButton: { marginBottom: 16 },
  errorCard: { padding: 12, borderColor: '#B25050', marginBottom: 16 },
  repliesTitle: { marginTop: 12, marginBottom: 5 },
  reply: { borderLeftWidth: 2, borderLeftColor: '#E2E8E4', paddingLeft: 10, marginTop: 9 },
  replyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  replying: { marginBottom: -8 },
  replyInput: { marginTop: 10, marginBottom: 8 },
  member: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8EBE9' },
  memberDetails: { flex: 1 },
  memberActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginTop: 4 },
  picker: { marginBottom: 16 },
  pickerOptions: { gap: 8, paddingTop: 8, paddingBottom: 2 },
  pickerOption: { maxWidth: 240, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#E2E8E4', borderRadius: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  confirmCard: { padding: 22 },
  confirmCopy: { marginTop: 8, marginBottom: 18 },
});