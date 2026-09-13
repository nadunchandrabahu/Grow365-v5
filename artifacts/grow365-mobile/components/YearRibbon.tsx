import React, { useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';

interface YearRibbonProps {
  currentDay: number;
  completedDays: Set<number>;
  dayToDevoId: Map<number, string>;
}

export function YearRibbon({ currentDay, completedDays, dayToDevoId }: YearRibbonProps) {
  const colors = useColors();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();

  const MARK_WIDTH = 4;
  const MARK_MARGIN = 6;
  const ITEM_SIZE = MARK_WIDTH + MARK_MARGIN;

  useEffect(() => {
    if (scrollViewRef.current && currentDay > 0) {
      const targetOffset = (currentDay - 1) * ITEM_SIZE - width / 2 + ITEM_SIZE / 2 + 24;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: Math.max(0, targetOffset), animated: true });
      }, 300);
    }
  }, [currentDay, width]);

  const days = Array.from({ length: 365 }, (_, i) => i + 1);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Typography variant="reference" color="muted">YOUR YEAR</Typography>
      </View>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="normal"
        >
          {days.map((day) => {
            const isToday = day === currentDay;
            const isCompleted = completedDays.has(day);
            const isFuture = day > currentDay;
            const hasDevo = dayToDevoId.has(day);
            
            let backgroundColor = 'transparent';
            let borderColor = colors.border;
            let borderWidth = 1;
            if (isToday) backgroundColor = colors.accent;
            else if (isCompleted) backgroundColor = colors.success;
            else if (isFuture) backgroundColor = colors.border;
            if (isToday || isCompleted || isFuture) {
              borderColor = backgroundColor;
              borderWidth = 0;
            }
            
            let height = 24;
            if (isToday) height = 36;
            else if (isFuture) height = 16;
            
            let opacity = 1;
            if (isFuture) opacity = 0.4;
            else if (!isCompleted && !isToday) opacity = 0.55;

            const mark = (
              <View
                style={[
                  styles.mark,
                  {
                    backgroundColor,
                    height,
                    opacity,
                    borderColor,
                    borderWidth,
                    width: MARK_WIDTH,
                    marginRight: MARK_MARGIN,
                    borderRadius: MARK_WIDTH / 2,
                  }
                ]}
              />
            );

            if (hasDevo && !isFuture) {
              return (
                <Pressable
                  key={day}
                  onPress={() => {
                    const devoId = dayToDevoId.get(day);
                    if (devoId) {
                      router.push(`/devotional/${devoId}`);
                    }
                  }}
                  style={styles.touchArea}
                  hitSlop={{ top: 12, bottom: 12, left: 2, right: 2 }}
                  accessibilityRole="link"
                  accessibilityLabel={`Journey day ${day}`}
                  accessibilityHint="Opens this day’s devotional"
                >
                  {mark}
                </Pressable>
              );
            }

            return <View key={day} style={styles.touchArea}>{mark}</View>;
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  container: {
    height: 48,
    justifyContent: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  touchArea: {
    height: 48,
    justifyContent: 'center',
  },
  mark: {
    // dynamically styled
  }
});
