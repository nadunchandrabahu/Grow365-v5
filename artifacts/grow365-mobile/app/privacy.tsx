import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Typography } from '@/components/Typography';
import { useColors } from '@/hooks/useColors';

export default function PrivacyScreen() {
  const colors = useColors();
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      accessibilityLabel="Privacy policy"
    >
      <Typography variant="h1" accessibilityRole="header">Privacy policy</Typography>
      <Typography variant="body" color="destructive" style={styles.paragraph} accessibilityRole="alert">
        Draft policy — this content still needs owner and legal approval before release.
      </Typography>
      <Typography variant="body" style={styles.paragraph}>Grow365 is a devotional reading and journaling app. We collect the account details you provide, including your email address and display name, so we can authenticate you and show your profile. Your journal entries and bookmarks are private to your account.</Typography>
      <Typography variant="h3" accessibilityRole="header">What we store</Typography>
      <Typography variant="body" style={styles.paragraph}>We store reading progress, journey settings, notification preferences, group memberships, and optional profile and group images. Group notes, questions, and replies are visible to the members of their group. If you delete your account, account-owned content is removed and discussion authors are shown as “Former member”.</Typography>
      <Typography variant="h3" accessibilityRole="header">Notifications and links</Typography>
      <Typography variant="body" style={styles.paragraph}>If you enable reminders, the app requests notification permission and schedules a reminder on your device. We do not sell personal information. Links to subscription services or external devotional content may be governed by their own privacy policies.</Typography>
      <Typography variant="h3" accessibilityRole="header">Your choices</Typography>
      <Typography variant="body" style={styles.paragraph}>You can update your profile, notification preferences, and account email in Settings. You may request deletion at any time from Settings. Questions about privacy can be sent through the support channel associated with your Grow365 account.</Typography>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, content: { padding: 24, gap: 14, paddingBottom: 50 }, paragraph: { lineHeight: 23 } });