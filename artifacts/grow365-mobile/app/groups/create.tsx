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

function safeCoverExtension(asset: ImagePicker.ImagePickerAsset): string {
  const fileExtension = asset.fileName
    ?.split('.')
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (fileExtension && ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(fileExtension)) {
    return fileExtension === 'jpeg' ? 'jpg' : fileExtension;
  }
  if (asset.mimeType === 'image/png') return 'png';
  if (asset.mimeType === 'image/webp') return 'webp';
  if (asset.mimeType === 'image/heic') return 'heic';
  return 'jpg';
}

function coverContentType(asset: ImagePicker.ImagePickerAsset, extension: string): string {
  if (asset.mimeType?.startsWith('image/')) return asset.mimeType;
  return extension === 'jpg' ? 'image/jpeg' : `image/${extension}`;
}

export default function CreateGroupScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [secret, setSecret] = useState('');
  const [coverAsset, setCoverAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
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
      let coverWarning: string | null = null;
      if (coverAsset) {
        let uploadedCoverPath: string | null = null;
        try {
          const extension = safeCoverExtension(coverAsset);
          const coverPath = `${data}/cover.${extension}`;
          const imageResponse = await fetch(coverAsset.uri);
          if (!imageResponse.ok) throw new Error('Could not read the selected image.');
          const imageData = await imageResponse.arrayBuffer();
          const { error: uploadError } = await supabase.storage
            .from('group-covers')
            .upload(coverPath, imageData, {
              contentType: coverContentType(coverAsset, extension),
              upsert: true,
            });
          if (uploadError) throw uploadError;
          uploadedCoverPath = coverPath;
          const { data: updatedGroup, error: updateError } = await supabase
            .from('groups')
            .update({ cover_path: coverPath })
            .eq('id', data)
            .select('id, cover_path')
            .single();
          if (
            updateError ||
            !updatedGroup ||
            updatedGroup.cover_path !== coverPath
          ) {
            throw updateError ?? new Error('The group cover path was not saved.');
          }
        } catch {
          if (uploadedCoverPath) {
            await supabase.storage
              .from('group-covers')
              .remove([uploadedCoverPath])
              .catch(() => undefined);
          }
          // The group is intentionally retained when its optional cover fails.
          coverWarning = 'Your group was created, but its cover could not be saved. You can continue without a cover for now.';
        }
      }
      return { groupId: data, coverWarning };
    },
    onSuccess: ({ groupId, coverWarning }) => {
      void queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      router.replace({
        pathname: '/groups/[id]',
        params: { id: groupId, ...(coverWarning ? { coverWarning } : {}) },
      });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const pickCover = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled) setCoverAsset(result.assets[0] ?? null);
    } catch {
      setError('The image picker could not open. Check your photo permissions and try again.');
    }
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

      <Pressable
        onPress={() => void pickCover()}
        style={[styles.coverPicker, { borderColor: colors.border }]}
        accessibilityRole="button"
        accessibilityLabel={coverAsset ? 'Change group cover image' : 'Add group cover image'}
        accessibilityHint="Choose an optional private cover image from your photo library"
        accessibilityState={{ selected: Boolean(coverAsset) }}
      >
        {coverAsset ? (
          <Image source={{ uri: coverAsset.uri }} style={styles.cover} />
        ) : (
          <Typography variant="body" color="muted">
            Add a cover image (optional)
          </Typography>
        )}
      </Pressable>
      <Typography variant="caption" color="muted" style={styles.coverNote}>
        Your cover is uploaded privately after the group is created. Only group members
        can view it.
      </Typography>

      <Input
        label="Group name"
        placeholder="Morning Fellowship"
        value={name}
        onChangeText={setName}
        accessibilityLabel="Group name"
        accessibilityHint="Enter the name members will see"
      />
      <Input
        label="Description"
        placeholder="What is this group about?"
        value={description}
        onChangeText={setDescription}
        multiline
        style={styles.multiline}
        accessibilityLabel="Group description"
        accessibilityHint="Optionally describe this group's purpose"
      />
      <Input
        label="Invite code"
        placeholder="A7X9-B2M4"
        value={joinCode}
        onChangeText={setJoinCode}
        autoCapitalize="characters"
        autoCorrect={false}
        accessibilityLabel="Invite code"
        accessibilityHint="Enter the code members will use to find this group"
      />
      <Input
        label="Group password"
        placeholder="Share this privately with members"
        value={secret}
        onChangeText={setSecret}
        secureTextEntry
        autoCapitalize="none"
        accessibilityLabel="Group password"
        accessibilityHint="Enter the password you will share privately with members"
      />
      {error && (
        <>
          <Typography variant="caption" color="destructive" style={styles.error}>
            {error} Check the details above and try again.
          </Typography>
          <Button
            title="Try again"
            variant="outline"
            onPress={() => {
              setError(null);
              createGroup.mutate();
            }}
            loading={createGroup.isPending}
            style={styles.retryButton}
            accessibilityRole="button"
            accessibilityLabel="Try creating the group again"
            accessibilityHint="Retry group creation with the details you entered"
            accessibilityState={{ busy: createGroup.isPending }}
          />
        </>
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
        accessibilityRole="button"
        accessibilityLabel="Create group"
        accessibilityHint="Create the private group with the details you entered"
        accessibilityState={{ disabled: !name.trim() || !joinCode.trim() || !secret, busy: createGroup.isPending }}
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
    minHeight: 44,
    borderWidth: 1,
    borderStyle: 'dashed',
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
  retryButton: { marginBottom: 4, minHeight: 44 },
  button: { marginTop: 12 },
});