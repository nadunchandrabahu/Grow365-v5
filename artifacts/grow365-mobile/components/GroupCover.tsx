import React, { useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Typography } from '@/components/Typography';
import { useColors } from '@/hooks/useColors';
import { useGroupCoverUrl } from '@/hooks/useGroupCoverUrl';

type GroupCoverProps = {
  path: string | null | undefined;
  userId: string | undefined;
  style?: StyleProp<ViewStyle>;
};

export function GroupCover({ path, userId, style }: GroupCoverProps) {
  const colors = useColors();
  const coverQuery = useGroupCoverUrl(path, userId);
  const [hasRetried, setHasRetried] = useState(false);
  const [failed, setFailed] = useState(false);
  const [unavailableUrl, setUnavailableUrl] = useState<string | null>(null);
  useEffect(() => {
    setHasRetried(false);
    setFailed(false);
    setUnavailableUrl(null);
  }, [path, userId]);
  const coverUrl = !failed && coverQuery.data && coverQuery.data !== unavailableUrl
    ? coverQuery.data
    : null;
  const handleImageError = () => {
    if (!coverUrl) return;
    if (hasRetried) {
      setFailed(true);
      setUnavailableUrl(coverUrl);
      return;
    }
    setHasRetried(true);
    setUnavailableUrl(coverUrl);
    void coverQuery.refetch();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.secondary }, style]}>
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={styles.image}
          resizeMode="cover"
          onError={handleImageError}
        />
      ) : (
        <View style={styles.fallback}>
          <Feather name="users" size={24} color={colors.mutedForeground} />
          <Typography variant="caption" color="muted">
            Group cover
          </Typography>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 108,
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    minHeight: 108,
  },
  fallback: {
    flex: 1,
    minHeight: 108,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});