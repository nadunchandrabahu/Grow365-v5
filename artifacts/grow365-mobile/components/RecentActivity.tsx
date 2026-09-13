import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import type { RecentActivityItem } from '@/hooks/useHomeData';
import { Feather } from '@expo/vector-icons';
import { EmptyState } from '@/components/State';
import { Card } from '@/components/Card';

interface Props {
  activities: RecentActivityItem[];
}

export function RecentActivity({ activities }: Props) {
  const colors = useColors();
  const router = useRouter();

  if (activities.length === 0) {
    return (
      <View style={styles.container}>
        <Typography variant="h3" style={styles.sectionTitle}>Group Activity</Typography>
        <Card style={styles.emptyCard}>
          <EmptyState
            icon="users"
            title="Quiet in the groups"
            description="When members of your groups post notes or questions, they will appear here."
          />
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Typography variant="h3" style={styles.sectionTitle}>Group Activity</Typography>
      
      {activities.map((item, index) => {
        const isLast = index === activities.length - 1;
        
        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => router.push(`/groups/${item.groupId}`)}
            accessibilityRole="link"
            accessibilityLabel={`${item.authorName} in ${item.groupName}: ${item.title} — ${item.preview}`}
            accessibilityHint="Opens this group activity"
            style={[
              styles.activityItem,
              { 
                borderBottomWidth: isLast ? 0 : 1, 
                borderBottomColor: colors.border 
              }
            ]}
          >
            <View style={[styles.iconWrapper, { backgroundColor: colors.secondary, borderRadius: 24 }]}>
              <Feather 
                name={item.type === 'note' ? 'file-text' : 'help-circle'} 
                size={18} 
                color={colors.mutedForeground} 
                accessible={false}
              />
            </View>
            <View style={styles.activityContent}>
              <View style={styles.header}>
                <Typography variant="caption" style={styles.author}>{item.authorName}</Typography>
                <Typography variant="reference" color="muted" style={styles.groupName}>{item.groupName}</Typography>
              </View>
              <Typography variant="body">
                {item.title} — {item.preview}
              </Typography>
            </View>
          </TouchableOpacity>
        );
      })}
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
  emptyCard: {
    padding: 24,
  },
  activityItem: {
    flexDirection: 'row',
    minHeight: 44,
    paddingVertical: 16,
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  author: {
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 1,
  },
  groupName: {
    flexShrink: 1,
  },
});
