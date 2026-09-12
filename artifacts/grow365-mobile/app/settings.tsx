import React from 'react';
import { View, StyleSheet, ScrollView, Switch } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';

export default function SettingsScreen() {
  const colors = useColors();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Typography variant="h3" style={styles.sectionTitle}>Preferences</Typography>
      
      <View style={[styles.settingRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <View style={styles.settingText}>
          <Typography variant="body">Daily Reminder</Typography>
          <Typography variant="caption" color="muted">Get a gentle nudge each morning.</Typography>
        </View>
        <Switch value={true} onValueChange={() => {}} trackColor={{ true: colors.primary }} />
      </View>
      
      <View style={[styles.settingRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <View style={styles.settingText}>
          <Typography variant="body">Dark Mode</Typography>
          <Typography variant="caption" color="muted">Matches device settings.</Typography>
        </View>
        <Switch value={false} onValueChange={() => {}} trackColor={{ true: colors.primary }} disabled />
      </View>
      
      <Typography variant="h3" style={[styles.sectionTitle, { marginTop: 32 }]}>Account</Typography>
      
      <View style={styles.settingRow}>
        <View style={styles.settingText}>
          <Typography variant="body" color="destructive">Delete Account</Typography>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  sectionTitle: { marginBottom: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  settingText: { flex: 1, paddingRight: 16 },
});