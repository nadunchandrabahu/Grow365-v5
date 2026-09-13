import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity, Alert } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionDetails, type SubscriptionDetails } from '@/hooks/useSubscriptionDetails';
import { canManageSubscription, manageableStorePlatform, openSubscriptionManagement } from '@/lib/subscription-management';
import { authErrorMessage } from '@/lib/auth-errors';
import { Link } from 'expo-router';

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function SubscriptionStatus({ details, onManage }: { details: SubscriptionDetails, onManage: () => void }) {
  const colors = useColors();
  const isGranted = details.status === 'granted';
  const manageablePlatform = details.active && !isGranted
    ? manageableStorePlatform(details.platform, details.granted_reason)
    : null;
  const manageable = Boolean(manageablePlatform);

  const getStatusText = () => {
    const dateStr = details.period_end ? formatDate(details.period_end) : null;

    switch (details.status) {
      case 'granted':
        return details.granted_reason
          ? `You have permanent or special access (${details.granted_reason}).`
          : 'You have permanent or special access.';

      case 'cancelled':
        if (details.active) {
          return dateStr
            ? `Your subscription is cancelled and will not renew. Your access continues through ${dateStr}.`
            : 'Your subscription is cancelled and will not renew, but remains active.';
        }
        return dateStr ? `Your subscription ended on ${dateStr}.` : 'Your subscription is cancelled.';

      case 'trial':
        return dateStr ? `Your trial is active until ${dateStr}.` : 'Your trial is active.';

      case 'past_due':
        if (details.active) {
          return dateStr
            ? `Your payment is past due, but you are in a grace period until ${dateStr}. Please update your payment method.`
            : 'Your payment is past due, but your access remains active. Please update your payment method.';
        }
        return 'Your subscription is past due. Please update your payment method to restore access.';

      case 'expired':
        return dateStr ? `Your subscription expired on ${dateStr}.` : 'Your subscription has expired.';

      case 'active':
      default:
        if (!details.active) {
          return 'You do not have an active subscription.';
        }
        if (details.will_renew === false) {
          return dateStr
            ? `Your subscription will not renew, but you have access until ${dateStr}.`
            : 'Your subscription will not renew, but your access remains active.';
        }
        return dateStr
          ? `Your subscription is active and will renew on ${dateStr}.`
          : 'Your subscription is active.';
    }
  };

  return (
    <Card style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <Feather name={details.active ? "check-circle" : "info"} size={24} color={details.active ? colors.success : colors.mutedForeground} />
        <Typography variant="h3" style={{ marginLeft: 12 }}>
          {details.active ? 'Subscription Active' : 'Subscription Inactive'}
        </Typography>
      </View>
      <Typography variant="body" style={styles.statusText}>
        {getStatusText()}
      </Typography>

      {details.active && manageable && (
        <Button
          title="Manage Subscription"
          variant="outline"
          onPress={onManage}
          style={styles.manageButton}
        />
      )}
      {details.active && !isGranted && !manageable && (
        <Typography variant="caption" color="muted" style={styles.manageHint}>
          {Platform.OS === 'web'
            ? 'Open Grow365 on iOS or Android to manage your billing.'
            : 'Active subscription details are unavailable for store management.'}
        </Typography>
      )}
    </Card>
  );
}

export default function SubscriptionScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const subscriptionQuery = useSubscriptionDetails(user?.id);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | null>('monthly');

  const details = subscriptionQuery.data;

  const manage = async () => {
    const manageablePlatform = details?.active && details.status !== 'granted'
      ? manageableStorePlatform(details.platform, details.granted_reason)
      : null;
    if (!details || !manageablePlatform || !canManageSubscription(details.platform, details.granted_reason)) return;
    setError(null);
    try {
      await openSubscriptionManagement(manageablePlatform);
    } catch (caught) {
      setError(authErrorMessage(caught));
    }
  };

  const handlePurchaseAttempt = () => {
    Alert.alert(
      "Coming Soon",
      "Store purchasing will be connected in a future update. No charges have been made.",
      [{ text: "OK" }]
    );
  };

  const handleRestoreAttempt = () => {
    Alert.alert(
      "Restore Purchases",
      "Store purchasing will be connected in a future update. Cannot restore at this time.",
      [{ text: "OK" }]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Feather name="book-open" size={42} color={colors.foreground} style={styles.icon} />
        <Typography variant="h1" align="center" style={styles.title}>Grow365 Plus</Typography>
        <Typography variant="body" color="muted" align="center" style={styles.subtitle}>
          Support our work and unlock the full devotional archive.
        </Typography>
      </View>

      {subscriptionQuery.isLoading ? (
        <Typography variant="caption" color="muted" align="center" style={styles.loadingText}>Loading status...</Typography>
      ) : subscriptionQuery.isError ? (
        <Typography variant="caption" color="destructive" align="center" style={styles.loadingText}>Unable to load subscription details.</Typography>
      ) : details && (details.active || details.status) ? (
        <SubscriptionStatus details={details} onManage={manage} />
      ) : null}

      <Card style={styles.featuresCard}>
        <Typography variant="h3" style={styles.featuresTitle}>What's included</Typography>
        <View style={styles.featureList}>
          {[
            'Browse the full 365-day devotional archive',
            'Filter published readings by series',
            'Ongoing support for the Grow365 team'
          ].map((feat, index) => (
            <View key={index} style={styles.featureItem}>
              <Feather name="check" size={20} color={colors.foreground} style={{ marginRight: 14 }} />
              <Typography variant="body" style={styles.featureText}>{feat}</Typography>
            </View>
          ))}
        </View>
        <View style={[styles.freeNote, { borderTopColor: colors.border }]}>
          <Typography variant="caption" color="muted" align="center">
            Today's devotional and your private journal will always be free.
          </Typography>
        </View>
      </Card>

      {(!details || !details.active) && (
        <View style={styles.plansContainer}>
          <Typography variant="h3" style={styles.plansTitle}>Choose a plan</Typography>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedPlan('monthly')}
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedPlan === 'monthly' }}
            accessibilityLabel="Monthly plan"
            accessibilityHint="Selects the $4.99 per month subscription plan with a 7-day free trial"
            style={[
              styles.planOption,
              {
                borderColor: selectedPlan === 'monthly' ? colors.foreground : colors.border,
                backgroundColor: selectedPlan === 'monthly' ? colors.card : 'transparent'
              }
            ]}
          >
            <View style={styles.planOptionHeader}>
              <View>
                <Typography variant="h3">Monthly</Typography>
                <Typography variant="caption" color="muted">7-day free trial</Typography>
              </View>
              <Typography variant="h3">$4.99<Typography variant="body" color="muted">/mo</Typography></Typography>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedPlan('annual')}
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedPlan === 'annual' }}
            accessibilityLabel="Annual plan"
            accessibilityHint="Selects the $49.99 per year subscription plan"
            style={[
              styles.planOption,
              {
                borderColor: selectedPlan === 'annual' ? colors.foreground : colors.border,
                backgroundColor: selectedPlan === 'annual' ? colors.card : 'transparent'
              }
            ]}
          >
            <View style={styles.planOptionHeader}>
              <View>
                <Typography variant="h3">Annual</Typography>
                <Typography variant="caption" color="muted">Save over 15%</Typography>
              </View>
              <Typography variant="h3">$49.99<Typography variant="body" color="muted">/yr</Typography></Typography>
            </View>
          </TouchableOpacity>

          <Button
            title={selectedPlan === 'monthly' ? 'Start 7-Day Free Trial' : 'Subscribe Annually'}
            onPress={handlePurchaseAttempt}
            style={styles.subscribeButton}
            size="large"
          />
        </View>
      )}

      {error ? <Typography variant="caption" color="destructive" style={styles.error} align="center">{error}</Typography> : null}

      <View style={styles.footerLinks}>
        <TouchableOpacity onPress={handleRestoreAttempt} style={styles.footerLink}>
          <Typography variant="caption" color="foreground">Restore Purchases</Typography>
        </TouchableOpacity>
        <View style={styles.legalLinks}>
          <Link href="/terms" style={styles.footerLink}>
            <Typography variant="caption" color="muted">Terms of Service</Typography>
          </Link>
          <Typography variant="caption" color="muted" style={styles.dot}>•</Typography>
          <Link href="/privacy" style={styles.footerLink}>
            <Typography variant="caption" color="muted">Privacy Policy</Typography>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 80 },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  icon: { marginBottom: 20 },
  title: { marginBottom: 12 },
  subtitle: { paddingHorizontal: 20, lineHeight: 24 },

  loadingText: { marginBottom: 30 },

  statusCard: { marginBottom: 30, padding: 24 },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statusText: { lineHeight: 24, marginBottom: 20 },
  manageButton: { marginTop: 8 },
  manageHint: { marginTop: 16 },

  featuresCard: { marginBottom: 40, padding: 24 },
  featuresTitle: { marginBottom: 24 },
  featureList: { gap: 16, marginBottom: 24 },
  featureItem: { flexDirection: 'row', alignItems: 'center', paddingRight: 20 },
  featureText: { flex: 1, lineHeight: 24 },
  freeNote: { borderTopWidth: 1, paddingTop: 20 },

  plansContainer: { marginBottom: 30 },
  plansTitle: { marginBottom: 16, marginLeft: 4 },
  planOption: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16
  },
  planOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  subscribeButton: { marginTop: 8 },

  error: { marginTop: 12, marginBottom: 20 },

  footerLinks: { alignItems: 'center', gap: 20, marginTop: 20 },
  footerLink: { padding: 8 },
  legalLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dot: { marginHorizontal: 8 },
});
