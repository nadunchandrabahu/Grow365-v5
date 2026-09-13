import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Typography } from '@/components/Typography';
import { useColors } from '@/hooks/useColors';

export default function TermsScreen() {
  const colors = useColors();
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      accessibilityLabel="Terms of use"
    >
      <Typography variant="h1" accessibilityRole="header">Terms of use</Typography>
      <Typography variant="body" color="destructive" style={styles.paragraph} accessibilityRole="alert">
        Draft terms — this content still needs owner and legal approval before release.
      </Typography>
      <Typography variant="body" style={styles.paragraph}>Grow365 provides devotional reading, private journaling, bookmarks, and small-group discussion for personal, non-commercial use. You are responsible for keeping your account credentials secure and for activity performed through your account.</Typography>
      <Typography variant="h3" accessibilityRole="header">Community spaces</Typography>
      <Typography variant="body" style={styles.paragraph}>Please treat group members with care. Do not post unlawful, threatening, hateful, harassing, or confidential material, and do not use a group to solicit or impersonate others. Group owners and Grow365 may remove content or membership that violates these expectations.</Typography>
      <Typography variant="h3" accessibilityRole="header">Subscriptions and content</Typography>
      <Typography variant="body" style={styles.paragraph}>Subscription access and billing are handled by the applicable store or payment provider. Grow365 content is provided for reflection and is not medical, legal, or professional advice. We may update, suspend, or retire features while working to keep the service useful.</Typography>
      <Typography variant="h3" accessibilityRole="header">Account deletion</Typography>
      <Typography variant="body" style={styles.paragraph}>You can permanently delete your account from Settings after transferring ownership of groups you own. Deletion removes your journal, bookmarks, progress, membership, avatar, and subscription record; discussion authors remain visible as “Former member”.</Typography>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, content: { padding: 24, gap: 14, paddingBottom: 50 }, paragraph: { lineHeight: 23 } });