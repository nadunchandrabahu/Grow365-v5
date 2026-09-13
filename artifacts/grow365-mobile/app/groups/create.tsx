import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { supabase } from '@/lib/supabase';

export default function CreateGroupScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [secret, setSecret] = useState('');
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createGroup = useMutation({
    mutationFn: async () => {
      const trimmedName = name.trim();
      const trimmedCode = joinCode.trim().toUpperCase();
      if (!trimmedName || !trimmedCode || !secret) {
        throw new Error('Enter a group name, invite code, and password.');
      }
      // The RPC hashes the secret and inserts the owner atomically. Never insert
      // groups directly and never read the stored join_secret.
      const { data, error: rpcError } = await supabase.rpc('create_group', {
        p_name: trimmedName,
        p_description: description.trim(),
        p_join_code: trimmedCode,
        p_secret: secret,
      });
      if (rpcError) throw rpcError;
      if (!data) throw new Error('The group was created without an id.');
      return data;
    },
    onSuccess: (groupId) => {
      void queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      router.replace(`/groups/${groupId}`);
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) setCoverUri(result.assets[0]?.uri ?? null);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Typography variant="h1">Create a group</Typography>
      <Typography variant="body" color="muted" style={styles.subtitle}>
        Start a private Bible study and invite people with your code and password.
      </Typography>

      <Pressable onPress={() => void pickCover()} style={styles.coverPicker}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.cover} />
        ) : (
          <Typography variant="body" color="muted">
            Add a cover image (optional)
          </Typography>
        )}
      </Pressable>
      <Typography variant="caption" color="muted" style={styles.coverNote}>
        This preview stays on this device. No cover is written to the database unless
        an authorized storage bucket is configured.
      </Typography>

      <Input
        label="Group name"
        placeholder="Morning Fellowship"
        value={name}
        onChangeText={setName}
      />
      <Input
        label="Description"
        placeholder="What is this group about?"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={styles.multiline}
      />
      <Input
        label="Invite code"
        placeholder="A7X9-B2M4"
        value={joinCode}
        onChangeText={setJoinCode}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <Input
        label="Group password"
        placeholder="Share this privately with members"
        value={secret}
        onChangeText={setSecret}
        secureTextEntry
        autoCapitalize="none"
      />
      {error && (
        <Typography variant="caption" color="destructive" style={styles.error}>
          {error}
        </Typography>
      )}
      <Button
        title="Create group"
        onPress={() => {
          setError(null);
          createGroup.mutate();
        }}
        loading={createGroup.isPending}
        disabled={!name.trim() || !joinCode.trim() || !secret}
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 32, paddingBottom: 60 },
  subtitle: { marginTop: 10, marginBottom: 24 },
  coverPicker: {
    height: 150,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#AAB7AF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  cover: { width: '100%', height: '100%' },
  coverNote: { marginBottom: 24 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  error: { marginBottom: 14 },
  button: { marginTop: 12 },
});