import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { supabase } from '@/lib/supabase';

export default function JoinGroupScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | null>(null);

  const joinGroup = useMutation({
    mutationFn: async () => {
      if (!code.trim() || !secret) {
        throw new Error('Enter the invite code and group password.');
      }
      const { data, error: rpcError } = await supabase.rpc('join_group', {
        p_code: code.trim().toUpperCase(),
        p_secret: secret,
      });
      if (rpcError) throw rpcError;
      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.group_id) {
        if (result?.error_code === 'rate_limited') {
          throw new Error(
            'Too many join attempts. For your security, try again after the 15-minute limit has passed.',
          );
        }
        if (result?.error_code === 'invalid_code') {
          throw new Error('That invite code or password is not correct.');
        }
        throw new Error(result?.error_code ?? 'We could not join this group.');
      }
      return result.group_id as string;
    },
    onSuccess: (groupId) => {
      void queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      router.replace(`/groups/${groupId}`);
    },
    onError: (mutationError: Error) => {
      const message = mutationError.message.toLowerCase().includes('rate')
        ? 'Too many join attempts (5 attempts per 15 minutes). Try again later.'
        : mutationError.message;
      setError(message);
    },
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Typography variant="h1">Join a group</Typography>
      <Typography variant="body" color="muted" style={styles.subtitle}>
        Enter the invite code and password from your group organizer.
      </Typography>
      <Input
        label="Invite code"
        placeholder="A7X9-B2M4"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        autoCorrect={false}
        accessibilityLabel="Invite code"
        accessibilityHint="Enter the code from your group organizer"
      />
      <Input
        label="Group password"
        placeholder="Your organizer's password"
        value={secret}
        onChangeText={setSecret}
        secureTextEntry
        autoCapitalize="none"
        accessibilityLabel="Group password"
        accessibilityHint="Enter the password from your group organizer"
      />
      <Typography variant="caption" color="muted" style={styles.rateNote}>
        Join attempts are limited to 5 in 15 minutes.
      </Typography>
      {error && (
        <>
          <Typography variant="caption" color="destructive" style={styles.error}>
            {error}
          </Typography>
          <Button
            title="Try again"
            variant="outline"
            onPress={() => {
              setError(null);
              joinGroup.mutate();
            }}
            loading={joinGroup.isPending}
            style={styles.retryButton}
            accessibilityRole="button"
            accessibilityLabel="Try joining the group again"
            accessibilityHint="Retry with the invite code and password you entered"
            accessibilityState={{ busy: joinGroup.isPending }}
          />
        </>
      )}
      <View style={styles.spacer} />
      <Button
        title="Join group"
        onPress={() => {
          setError(null);
          joinGroup.mutate();
        }}
        loading={joinGroup.isPending}
        disabled={!code.trim() || !secret}
        accessibilityRole="button"
        accessibilityLabel="Join group"
        accessibilityHint="Use the invite code and password to join this group"
        accessibilityState={{ disabled: !code.trim() || !secret, busy: joinGroup.isPending }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 32, flexGrow: 1, paddingBottom: 60 },
  subtitle: { marginTop: 10, marginBottom: 30 },
  rateNote: { marginTop: -4, marginBottom: 12 },
  error: { marginBottom: 12 },
  retryButton: { marginBottom: 4, minHeight: 44 },
  spacer: { flex: 1, minHeight: 40 },
});