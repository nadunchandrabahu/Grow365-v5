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
import { GroupCover } from '@/components/GroupCover';
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
        accessibilityHint={saved ? 'Remove this item from your bookmarks' : 'Save this item to your bookmarks'}
        accessibilityState={{ disabled: disabled || bookmark.isLoading || toggle.isPending, selected: saved, busy: toggle.isPending }}
        style={styles.minimumPressable}
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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    id?: string | string[];
    coverWarning?: string | string[];
  }>();
  const groupId = one(params.id);
  const coverWarning = one(params.coverWarning);
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

  if (authLoading || groupQuery.isLoading) {
    return <View style={[styles.state, { backgroundColor: colors.background }]}><LoadingState message="Opening the group..." /></View>;
  }
  if (!groupId) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <ErrorState
          title="This group link is incomplete"
          description="Return to Study and open a group from your list, or ask the organizer for a new link."
          onRetry={() => router.replace('/(tabs)/study')}
        />
      </View>
    );
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
    <View key={reply.id} style={[styles.reply, { marginLeft: Math.min(depth, 3) * 14, borderLeftColor: colors.border }]}>
      <View style={styles.replyHeader}>
        <Typography variant="caption" color="muted">
          {reply.profiles?.display_name ?? 'Former member'}
        </Typography>
        <Pressable
          disabled={Boolean(pendingAction)}
          onPress={() => setReplyParent((current) => ({ ...current, [reply.question_id]: reply.id }))}
          accessibilityRole="button"
          accessibilityLabel={`Reply to ${reply.profiles?.display_name ?? 'this member'}`}
          accessibilityHint="Write a reply to this message"
          accessibilityState={{ disabled: Boolean(pendingAction) }}
          style={styles.minimumPressable}
        >
          <Typography variant="caption" color="accent">Reply</Typography>
        </Pressable>
      </View>
      {replyEditId === reply.id ? (
        <>
          <Input value={replyEditText} onChangeText={setReplyEditText} multiline style={styles.replyInput} accessibilityLabel="Reply text" accessibilityHint="Edit the reply text" />
          <View style={styles.inlineActions}>
            <Button title="Save" size="small" style={styles.control} disabled={Boolean(pendingAction)} onPress={() => void editReply(reply.id)} accessibilityRole="button" accessibilityLabel="Save reply" accessibilityHint="Save your edited reply" accessibilityState={{ disabled: Boolean(pendingAction), busy: pendingAction === 'Saving reply' }} />
            <Button title="Cancel" variant="ghost" size="small" style={styles.control} disabled={Boolean(pendingAction)} onPress={() => setReplyEditId(null)} accessibilityRole="button" accessibilityLabel="Cancel editing reply" accessibilityHint="Discard changes to this reply" accessibilityState={{ disabled: Boolean(pendingAction) }} />
          </View>
        </>
      ) : (
        <>
          <Typography variant="body">{reply.body}</Typography>
          <View style={styles.inlineActions}>
            <Button title="Edit" variant="ghost" size="small" style={styles.control} disabled={Boolean(pendingAction)} onPress={() => { setReplyEditId(reply.id); setReplyEditText(reply.body); }} accessibilityRole="button" accessibilityLabel="Edit reply" accessibilityHint="Edit your reply" accessibilityState={{ disabled: Boolean(pendingAction) }} />
            <Button title="Delete" variant="ghost" size="small" style={styles.control} disabled={Boolean(pendingAction)} onPress={() => deleteReply(reply.id)} accessibilityRole="button" accessibilityLabel="Delete reply" accessibilityHint="Open a confirmation before deleting this reply" accessibilityState={{ disabled: Boolean(pendingAction) }} />
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
      <View style={styles.pickerOptions}>
        <Pressable
          disabled={Boolean(pendingAction)}
          onPress={() => setSelected('')}
          style={[styles.pickerOption, { borderColor: selected === '' ? colors.accent : colors.border }]}
            accessibilityRole="radio"
            accessibilityLabel="Do not link a devotional"
            accessibilityHint="Leave this post without a linked devotional"
            accessibilityState={{ disabled: Boolean(pendingAction), selected: selected === '' }}
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
              { borderColor: selected === devotional.id ? colors.accent : colors.border },
            ]}
            accessibilityRole="radio"
            accessibilityLabel={`Link devotional, day ${devotional.day_of_year}, ${devotional.title}`}
            accessibilityHint="Link this devotional to your post"
            accessibilityState={{ disabled: Boolean(pendingAction), selected: selected === devotional.id }}
          >
            <Typography variant="caption">
              Day {devotional.day_of_year} · {devotional.title}
            </Typography>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const form = (kind: 'note' | 'question') => (
    <Card style={styles.formCard}>
      <Typography variant="h3">
        {kind === 'note' ? (noteId ? 'Edit note' : 'New note') : questionId ? 'Edit question' : 'New question'}
      </Typography>
      {kind === 'note' ? (
        <>
          <Input label="Title (optional)" value={noteTitle} onChangeText={setNoteTitle} accessibilityLabel="Note title" accessibilityHint="Optionally add a title to your reflection" />
          <Input label="Reflection" value={noteBody} onChangeText={setNoteBody} multiline style={styles.textarea} accessibilityLabel="Reflection" accessibilityHint="Write the reflection you want to share" />
          <Input label="Bible reference" value={noteRef} onChangeText={setNoteRef} placeholder="John 3:16" accessibilityLabel="Bible reference" accessibilityHint="Optionally add a Bible reference" />
          {devotionalPicker(noteDevotionalId, setNoteDevotionalId)}
          <View style={styles.choiceRow}>
            {(['group', 'private'] as const).map((visibility) => (
              <Pressable
                key={visibility}
                disabled={Boolean(pendingAction)}
                onPress={() => setNoteVisibility(visibility)}
                style={[styles.choice, { borderColor: noteVisibility === visibility ? colors.accent : colors.border }]}
                accessibilityRole="radio"
                accessibilityLabel={visibility === 'group' ? 'Share with group' : 'Private note'}
                accessibilityHint={visibility === 'group' ? 'Allow group members to read this note' : 'Keep this note visible only to you'}
                accessibilityState={{ disabled: Boolean(pendingAction), selected: noteVisibility === visibility }}
              >
                <Typography variant="caption">{visibility === 'group' ? 'Share with group' : 'Private note'}</Typography>
              </Pressable>
            ))}
          </View>
          <View style={styles.formActions}><Button title={noteId ? 'Save changes' : 'Post note'} size="small" style={styles.control} disabled={Boolean(pendingAction)} onPress={() => void saveNote()} accessibilityRole="button" accessibilityLabel={noteId ? 'Save note changes' : 'Post note'} accessibilityHint={noteId ? 'Save the changes to this note' : 'Share this note with the selected audience'} accessibilityState={{ disabled: Boolean(pendingAction), busy: pendingAction === (noteId ? 'Saving note' : 'Posting note') }} /><Button title="Cancel" variant="ghost" size="small" style={styles.control} disabled={Boolean(pendingAction)} onPress={clearNote} accessibilityRole="button" accessibilityLabel="Cancel note" accessibilityHint="Discard this note draft" accessibilityState={{ disabled: Boolean(pendingAction) }} /></View>
        </>
      ) : (
        <>
          <Input label="Question" value={questionTitle} onChangeText={setQuestionTitle} accessibilityLabel="Question title" accessibilityHint="Enter the question you want to ask" />
          <Input label="Details (optional)" value={questionBody} onChangeText={setQuestionBody} multiline style={styles.textarea} accessibilityLabel="Question details" accessibilityHint="Optionally add more context" />
          <Input label="Bible reference" value={questionRef} onChangeText={setQuestionRef} placeholder="Romans 8:28" accessibilityLabel="Bible reference" accessibilityHint="Optionally add a Bible reference" />
          {devotionalPicker(questionDevotionalId, setQuestionDevotionalId)}
          <View style={styles.formActions}><Button title={questionId ? 'Save changes' : 'Ask question'} size="small" style={styles.control} disabled={Boolean(pendingAction)} onPress={() => void saveQuestion()} accessibilityRole="button" accessibilityLabel={questionId ? 'Save question changes' : 'Ask question'} accessibilityHint={questionId ? 'Save the changes to this question' : 'Post this question to your group'} accessibilityState={{ disabled: Boolean(pendingAction), busy: pendingAction === (questionId ? 'Saving question' : 'Posting question') }} /><Button title="Cancel" variant="ghost" size="small" style={styles.control} disabled={Boolean(pendingAction)} onPress={clearQuestion} accessibilityRole="button" accessibilityLabel="Cancel question" accessibilityHint="Discard this question draft" accessibilityState={{ disabled: Boolean(pendingAction) }} /></View>
        </>
      )}
    </Card>
  );

  const noteCard = (note: (typeof notes)[number]) => (
    <Card key={note.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}><Typography variant="h3">{note.title ?? 'Shared note'}</Typography><Typography variant="caption" color="muted">{note.profiles?.display_name ?? 'Former member'} · {note.visibility === 'private' ? 'Private' : 'Group'}</Typography></View>
        <GroupBookmarkButton disabled={Boolean(pendingAction)} target={{ kind: 'note', targetId: note.id, label: note.title ?? 'Group note' }} />
      </View>
      {note.bible_ref && <Typography variant="reference" color="accent">{note.bible_ref}</Typography>}
      {note.devotional_id && devotionalById.get(note.devotional_id) && <Typography variant="caption" color="muted">Day {devotionalById.get(note.devotional_id)?.day_of_year} · {devotionalById.get(note.devotional_id)?.title}</Typography>}
      <Typography variant="body" style={styles.body}>{note.content}</Typography>
       <View style={styles.inlineActions}><Button title="Edit" variant="ghost" size="small" style={styles.control} disabled={Boolean(pendingAction)} onPress={() => { setNoteId(note.id); setNoteComposer(true); setNoteTitle(note.title ?? ''); setNoteBody(note.content); setNoteRef(note.bible_ref ?? ''); setNoteVisibility(note.visibility); setNoteDevotionalId(note.devotional_id ?? ''); }} accessibilityRole="button" accessibilityLabel="Edit note" accessibilityHint="Edit this note" accessibilityState={{ disabled: Boolean(pendingAction) }} /><Button title="Delete" variant="ghost" size="small" style={styles.control} disabled={Boolean(pendingAction)} onPress={() => deleteNote(note.id)} accessibilityRole="button" accessibilityLabel="Delete note" accessibilityHint="Open a confirmation before deleting this note" accessibilityState={{ disabled: Boolean(pendingAction) }} /></View>
    </Card>
  );

  const questionCard = (question: (typeof questions)[number]) => (
    <Card key={question.id} style={styles.card}>
      <View style={styles.cardHeader}><View style={styles.cardTitle}><Typography variant="h3">{question.title}</Typography><Typography variant="caption" color="muted">{question.profiles?.display_name ?? 'Former member'} · {question.is_resolved ? 'Resolved' : 'Open'}</Typography></View><GroupBookmarkButton disabled={Boolean(pendingAction)} target={{ kind: 'question', targetId: question.id, label: question.title }} /></View>
      {question.bible_ref && <Typography variant="reference" color="accent">{question.bible_ref}</Typography>}
      {question.devotional_id && devotionalById.get(question.devotional_id) && <Typography variant="caption" color="muted">Day {devotionalById.get(question.devotional_id)?.day_of_year} · {devotionalById.get(question.devotional_id)?.title}</Typography>}
      {question.body && <Typography variant="body" style={styles.body}>{question.body}</Typography>}
       <View style={styles.inlineActions}><Button title={question.is_resolved ? 'Mark open' : 'Resolve'} variant="ghost" size="small" style={styles.control} disabled={Boolean(pendingAction)} onPress={() => void write('Updating question', () => supabase.from('group_questions').update({ is_resolved: !question.is_resolved }).eq('id', question.id))} accessibilityRole="button" accessibilityLabel={question.is_resolved ? 'Mark question open' : 'Resolve question'} accessibilityHint={question.is_resolved ? 'Reopen this question for discussion' : 'Mark this question as resolved'} accessibilityState={{ disabled: Boolean(pendingAction), selected: question.is_resolved }} /><Button title="Edit" variant="ghost" size="small" style={styles.control} disabled={Boolean(pendingAction)} onPress={() => { setQuestionId(question.id); setQuestionComposer(true); setQuestionTitle(question.title); setQuestionBody(question.body ?? ''); setQuestionRef(question.bible_ref ?? ''); setQuestionDevotionalId(question.devotional_id ?? ''); }} accessibilityRole="button" accessibilityLabel="Edit question" accessibilityHint="Edit this question" accessibilityState={{ disabled: Boolean(pendingAction) }} /><Button title="Delete" variant="ghost" size="small" style={styles.control} disabled={Boolean(pendingAction)} onPress={() => deleteQuestion(question.id)} accessibilityRole="button" accessibilityLabel="Delete question" accessibilityHint="Open a confirmation before deleting this question" accessibilityState={{ disabled: Boolean(pendingAction) }} /></View>
      <Typography variant="caption" color="muted" style={styles.repliesTitle}>{question.reply_count} {question.reply_count === 1 ? 'reply' : 'replies'}</Typography>
      {topLevelReplies(question.id).map((reply) => renderReply(reply))}
       {replyParent[question.id] && <Typography variant="caption" color="accent" style={styles.replying}>Replying to a member · <Pressable onPress={() => setReplyParent((current) => ({ ...current, [question.id]: null }))} accessibilityRole="button" accessibilityLabel="Cancel reply target" accessibilityHint="Reply to the question instead" accessibilityState={{ disabled: false }} style={styles.minimumPressable}><Typography variant="caption" color="muted">cancel</Typography></Pressable></Typography>}
       <Input label="Reply" value={replyText[question.id] ?? ''} onChangeText={(value) => setReplyText((current) => ({ ...current, [question.id]: value }))} multiline style={styles.replyInput} accessibilityLabel="Reply text" accessibilityHint="Write a reply to this question" />
       <Button title="Post reply" size="small" style={styles.control} onPress={() => void addReply(question.id)} disabled={Boolean(pendingAction) || !replyText[question.id]?.trim()} accessibilityRole="button" accessibilityLabel="Post reply" accessibilityHint="Share this reply with the group" accessibilityState={{ disabled: Boolean(pendingAction) || !replyText[question.id]?.trim(), busy: pendingAction === 'Posting reply' }} />
    </Card>
  );

  const overview = (
    <>
       <Card style={styles.heroCard}>
         <GroupCover path={group.cover_path} userId={user?.id} style={styles.heroCover} />
         <Typography variant="reference" color="muted">YOUR GROUP</Typography>
         <Typography variant="h1" style={styles.title}>{group.name}</Typography>
         <Typography variant="body" color="muted">{memberCount} {memberCount === 1 ? 'member' : 'members'}</Typography>
         {group.description && <Typography variant="body" color="muted" style={styles.description}>{group.description}</Typography>}
       </Card>
      <Typography variant="h3" style={styles.sectionTitle}>Recent notes</Typography>
      {notes.slice(0, 2).map(noteCard)}
       {!notes.length && <View><Typography variant="body" color="muted">No shared notes yet. Add a reflection to start the conversation.</Typography><Button title="Share a note" size="small" onPress={() => { clearNote(); setTab('Notes'); setNoteComposer(true); }} style={styles.emptyAction} accessibilityRole="button" accessibilityLabel="Share a note" accessibilityHint="Open the note form to share a reflection with your group" /></View>}
      <Typography variant="h3" style={styles.sectionTitle}>Open questions</Typography>
      {questions.filter((question) => !question.is_resolved).slice(0, 2).map(questionCard)}
       {!questions.some((question) => !question.is_resolved) && <View><Typography variant="body" color="muted">No open questions yet. Ask something about your reading.</Typography><Button title="Ask a question" size="small" onPress={() => { clearQuestion(); setTab('Questions'); setQuestionComposer(true); }} style={styles.emptyAction} accessibilityRole="button" accessibilityLabel="Ask a question" accessibilityHint="Open the question form for your group" /></View>}
    </>
  );

  const tabContent = tab === 'Overview' ? overview : tab === 'Devotionals' ? (
     linkedDevotionals.length ? linkedDevotionals.map((devotional) => <Pressable key={devotional.id} onPress={() => router.push(`/devotional/${devotional.id}`)} accessibilityRole="button" accessibilityLabel={`Open devotional, day ${devotional.day_of_year}, ${devotional.title}`} accessibilityHint="Read this linked devotional" accessibilityState={{ disabled: false }} style={styles.minimumPressable}><Card style={styles.card}><Typography variant="caption" color="muted">DAY {devotional.day_of_year}</Typography><Typography variant="h3">{devotional.title}</Typography><Typography variant="caption" color="accent">Open devotional →</Typography></Card></Pressable>) : <EmptyState icon="book-open" title="No linked devotionals" description="Link a devotional when you post a note or question." actionLabel="Link in a note" onAction={() => { clearNote(); setTab('Notes'); setNoteComposer(true); }} />
   ) : tab === 'Notes' ? <>{!noteComposer && <Button title="New note" disabled={Boolean(pendingAction)} onPress={() => { clearNote(); setNoteComposer(true); setTab('Notes'); }} style={styles.newButton} accessibilityRole="button" accessibilityLabel="New note" accessibilityHint="Open a form to share a reflection" accessibilityState={{ disabled: Boolean(pendingAction) }} />}{noteComposer && form('note')}{notes.length ? notes.map(noteCard) : !noteComposer && <EmptyState icon="edit-3" title="No notes yet" description="Share a reflection with your group." actionLabel="Share a note" onAction={() => { clearNote(); setNoteComposer(true); }} />}</> : tab === 'Questions' ? <>{!questionComposer && <Button title="Ask a question" disabled={Boolean(pendingAction)} onPress={() => { clearQuestion(); setQuestionComposer(true); setTab('Questions'); }} style={styles.newButton} accessibilityRole="button" accessibilityLabel="Ask a question" accessibilityHint="Open a form to ask your group" accessibilityState={{ disabled: Boolean(pendingAction) }} />}{questionComposer && form('question')}{questions.length ? questions.map(questionCard) : !questionComposer && <EmptyState icon="help-circle" title="No questions yet" description="Ask your group about today's reading." actionLabel="Ask a question" onAction={() => { clearQuestion(); setQuestionComposer(true); }} />}</> : members.length ? members.map((member) => {
    const isOwner = member.user_id === group.owner_id;
    return (
      <Card key={member.user_id} style={styles.member}>
          <View style={[styles.avatar, { backgroundColor: colors.muted }]}><Typography variant="h3">{(member.profiles?.display_name ?? 'Former member').slice(0, 1).toUpperCase()}</Typography></View>
        <View style={styles.memberDetails}>
          <Typography variant="body">{member.profiles?.display_name ?? 'Former member'}</Typography>
          <Typography variant="caption" color="muted">{member.role}</Typography>
          {isOwner ? <Typography variant="caption" color="muted">Owner role cannot be changed</Typography> : (
            <View style={styles.memberActions}>
               <Button title="Make admin" variant="ghost" size="small" style={styles.control} disabled={Boolean(pendingAction)} onPress={() => changeMemberRole(member.user_id, 'admin')} accessibilityRole="button" accessibilityLabel={`Make ${member.profiles?.display_name ?? 'member'} an admin`} accessibilityHint="Give this member admin permissions" accessibilityState={{ disabled: Boolean(pendingAction), selected: member.role === 'admin' }} />
               <Button title="Make member" variant="ghost" size="small" style={styles.control} disabled={Boolean(pendingAction)} onPress={() => changeMemberRole(member.user_id, 'member')} accessibilityRole="button" accessibilityLabel={`Make ${member.profiles?.display_name ?? 'member'} a member`} accessibilityHint="Remove admin permissions from this member" accessibilityState={{ disabled: Boolean(pendingAction), selected: member.role === 'member' }} />
               <Button title="Remove" variant="ghost" size="small" style={styles.control} disabled={Boolean(pendingAction)} onPress={() => removeMember(member.user_id)} accessibilityRole="button" accessibilityLabel={`Remove ${member.profiles?.display_name ?? 'member'}`} accessibilityHint="Open a confirmation before removing this member" accessibilityState={{ disabled: Boolean(pendingAction) }} />
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.tabs, { borderBottomColor: colors.border }]}>
          {(['Overview', 'Devotionals', 'Notes', 'Questions', 'Members'] as Tab[]).map((item) => <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, { borderBottomColor: tab === item ? colors.accent : 'transparent' }]} accessibilityRole="tab" accessibilityLabel={`${item} tab`} accessibilityHint={`Show ${item.toLowerCase()} for this group`} accessibilityState={{ selected: tab === item }}><Typography variant="caption" color={tab === item ? 'foreground' : 'muted'}>{item}</Typography></Pressable>)}
        </ScrollView>
        {pendingAction && (
          <Typography variant="caption" color="muted" style={styles.pending}>
            {pendingAction}…
          </Typography>
        )}
         {coverWarning && <Card style={[styles.warningCard, { borderColor: colors.accent }]}><Typography variant="caption" color="muted">{coverWarning}</Typography></Card>}
         {actionError && <Card style={[styles.errorCard, { borderColor: colors.destructive }]}><Typography variant="caption" color="destructive">{actionError}</Typography><Button title="Refresh group" variant="outline" size="small" style={styles.control} onPress={() => { setActionError(null); void refresh(); }} accessibilityRole="button" accessibilityLabel="Refresh group" accessibilityHint="Retry loading the latest group data" /></Card>}
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
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
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
                style={styles.control}
                disabled={Boolean(pendingAction)}
                onPress={() => setConfirmDelete(null)}
                accessibilityRole="button"
                accessibilityLabel="Cancel deletion"
                accessibilityHint="Keep this item"
                accessibilityState={{ disabled: Boolean(pendingAction) }}
              />
              <Button
                title={pendingAction ? 'Deleting…' : 'Delete'}
                size="small"
                style={styles.control}
                disabled={Boolean(pendingAction)}
                onPress={() => void confirmDeletion()}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${confirmDelete?.kind ?? 'item'}`}
                accessibilityHint="Permanently delete this item"
                accessibilityState={{ disabled: Boolean(pendingAction), busy: Boolean(pendingAction) }}
              />
            </View>
          </Card>
          </ScrollView>
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
  tabs: { gap: 18, borderBottomWidth: 1, marginBottom: 20 },
  tab: { minHeight: 44, paddingTop: 10, paddingBottom: 12, borderBottomWidth: 2, justifyContent: 'center' },
  pending: { marginBottom: 10 },
  heroCard: { padding: 20 },
  heroCover: { minHeight: 150, marginBottom: 18 },
  title: { marginTop: 6, marginBottom: 8 },
  description: { marginTop: 12 },
  sectionTitle: { marginTop: 26, marginBottom: 12 },
  card: { padding: 18, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  cardTitle: { flex: 1, gap: 3 },
  body: { marginTop: 10 },
  inlineActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  control: { minHeight: 44 },
  formCard: { padding: 18, marginBottom: 16 },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  choice: { minHeight: 44, padding: 10, borderWidth: 1, borderRadius: 8, justifyContent: 'center' },
  newButton: { minHeight: 44, marginBottom: 16 },
  emptyAction: { minHeight: 44, alignSelf: 'flex-start', marginTop: 12 },
  errorCard: { padding: 12, borderWidth: 1, marginBottom: 16 },
  warningCard: { padding: 12, borderWidth: 1, marginBottom: 16 },
  repliesTitle: { marginTop: 12, marginBottom: 5 },
  reply: { borderLeftWidth: 2, paddingLeft: 10, marginTop: 9 },
  replyHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginBottom: 3 },
  replying: { marginBottom: -8 },
  replyInput: { marginTop: 10, marginBottom: 8 },
  member: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  memberDetails: { flex: 1 },
  memberActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginTop: 4 },
  picker: { marginBottom: 16 },
  pickerOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 8, paddingBottom: 2 },
  pickerOption: { minHeight: 44, flexGrow: 1, flexShrink: 1, flexBasis: 140, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderRadius: 8, justifyContent: 'center' },
  minimumPressable: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  modalScroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 },
  confirmCard: { padding: 22 },
  confirmCopy: { marginTop: 8, marginBottom: 18 },
});