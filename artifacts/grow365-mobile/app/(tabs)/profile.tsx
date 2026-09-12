import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const menuItems = [
    { icon: 'settings', label: 'Settings', route: '/settings' },
    { icon: 'credit-card', label: 'Subscription', route: '/subscription' },
    { icon: 'log-out', label: 'Sign Out', route: '/' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: 120 }]}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
            <Typography variant="h1" style={{ color: colors.secondaryForeground }}>R</Typography>
          </View>
          <Typography variant="h2" style={styles.name}>Robert</Typography>
          <Typography variant="body" color="muted">robert@example.com</Typography>
        </View>

        <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={item.label}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
              ]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <Feather name={item.icon as any} size={20} color={colors.foreground} style={styles.menuIcon} />
              <Typography variant="body" style={{ flex: 1 }}>{item.label}</Typography>
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  name: { marginBottom: 4 },
  menu: { borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIcon: { marginRight: 16 },
});