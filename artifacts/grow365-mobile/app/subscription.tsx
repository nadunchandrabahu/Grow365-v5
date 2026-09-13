import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionDetails } from '@/hooks/useSubscriptionDetails';
import { canManageSubscription, manageableStorePlatform, openSubscriptionManagement } from '@/lib/subscription-management';
import { authErrorMessage } from '@/lib/auth-errors';

export default function SubscriptionScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const subscriptionQuery = useSubscriptionDetails(user?.id);
  const [error, setError] = useState<string | null>(null);
  const details = subscriptionQuery.data;
  const manageablePlatform = details?.active ? manageableStorePlatform(details.platform, details.granted_reason) : null;
  const manageable = Boolean(manageablePlatform);

  const manage = async () => {
    if (!details || !manageablePlatform || !canManageSubscription(details.platform, details.granted_reason)) return;
    setError(null);
    try {
      await openSubscriptionManagement(manageablePlatform);
    } catch (caught) {
      setError(authErrorMessage(caught));
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Feather name="heart" size={48} color={colors.accent} style={styles.icon} />
        <Typography variant="h2" align="center" style={styles.title}>Support Grow365</Typography>
        <Typography variant="body" color="muted" align="center" style={styles.subtitle}>
          Your subscription helps us continue creating daily devotionals and maintaining this quiet space.
        </Typography>
      </View>
      <Card style={[styles.planCard, { borderColor: colors.accent, borderWidth: 1 }]}>
        <View style={styles.planHeader}><Typography variant="h3">Annual Supporter</Typography><Feather name="archive" size={24} color={colors.accent} /></View>
        <View style={styles.featureList}>
          {['Browse the full 365-day devotional archive', 'Filter published readings by series', 'Support the author team'].map((feat) => <View key={feat} style={styles.featureItem}><Feather name="check" size={20} color={colors.success} style={{ marginRight: 12 }} /><Typography variant="body">{feat}</Typography></View>)}
        </View>
        <View style={[styles.freeNote, { borderTopColor: colors.border }]}><Typography variant="body" color="muted" align="center">Today’s devotional and your complete private journal are always free.</Typography></View>
        {subscriptionQuery.isLoading ? <Typography variant="caption" color="muted" align="center">Checking subscription status…</Typography> : subscriptionQuery.isError ? <Typography variant="caption" color="destructive" align="center">Subscription status is unavailable.</Typography> : details?.active ? (
          <>
            <Typography variant="body" align="center" style={styles.status}>{manageable ? 'Active subscription billed through your app store.' : details.granted_reason ? 'Active entitlement granted by Grow365. There is no store management link.' : Platform.OS === 'web' ? 'Active store subscription. Open Grow365 on iOS or Android to manage billing.' : 'Active subscription details are unavailable for store management.'}</Typography>
            {manageable ? <Button title="Manage subscription" variant="outline" onPress={() => void manage()} /> : <Typography variant="caption" color="muted" align="center">There is no store management link for this entitlement.</Typography>}
          </>
        ) : <Typography variant="caption" color="muted" align="center">No active subscription. Subscription setup is handled through the supported store.</Typography>}
        {error ? <Typography variant="caption" color="destructive" style={styles.error}>{error}</Typography> : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 40 },
  icon: { marginBottom: 24 },
  title: { marginBottom: 16 },
  subtitle: { paddingHorizontal: 16 },
  planCard: { padding: 24, borderRadius: 16 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  featureList: { marginBottom: 32, gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center' },
  freeNote: { borderTopWidth: 1, paddingTop: 20, marginBottom: 18 },
  status: { marginBottom: 14 },
  error: { marginTop: 12 },
});