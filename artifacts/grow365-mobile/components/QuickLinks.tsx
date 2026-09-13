import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Feather } from '@expo/vector-icons';
import type { Href } from 'expo-router';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

interface QuickLink {
  id: string;
  title: string;
  icon: FeatherName;
  route: Href;
}

export function QuickLinks() {
  const colors = useColors();
  const router = useRouter();

  const links: QuickLink[] = [
    { id: 'journal', title: 'Journal', icon: 'edit-3', route: '/(tabs)/journal' },
    { id: 'bookmarks', title: 'Bookmarks', icon: 'bookmark', route: '/(tabs)/bookmarks' },
    { id: 'groups', title: 'Groups', icon: 'users', route: '/(tabs)/study' },
    { id: 'archive', title: 'Archive', icon: 'archive', route: '/devotional/past' },
  ];

  return (
    <View style={styles.container}>
      <Typography variant="h3" style={styles.sectionTitle}>Library</Typography>
      <View style={styles.grid}>
        {links.map((link) => (
          <TouchableOpacity
            key={link.id}
            activeOpacity={0.7}
            onPress={() => router.push(link.route)}
            accessibilityRole="link"
            accessibilityLabel={link.title}
            accessibilityHint={`Opens ${link.title}`}
            style={[styles.linkBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
          >
            <Feather name={link.icon} size={24} color={colors.foreground} style={styles.icon} accessible={false} />
            <Typography variant="body" style={styles.linkTitle}>{link.title}</Typography>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  linkBox: {
    flex: 1,
    flexBasis: '45%',
    minWidth: 44,
    minHeight: 44,
    borderWidth: 1,
    padding: 20,
    alignItems: 'flex-start',
  },
  icon: {
    marginBottom: 16,
  },
  linkTitle: {
    fontFamily: 'Inter_500Medium',
    flexShrink: 1,
  },
});
