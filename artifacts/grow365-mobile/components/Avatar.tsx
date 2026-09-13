import React, { useEffect, useState } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Typography } from '@/components/Typography';
import { useColors } from '@/hooks/useColors';
import { supabase } from '@/lib/supabase';

type AvatarProps = {
  path?: string | null;
  name?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** Public profile images are deliberately rendered with a local fallback. */
export function Avatar({ path, name, size = 80, style }: AvatarProps) {
  const colors = useColors();
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const initial = name?.trim().charAt(0).toUpperCase() || 'G';

  useEffect(() => {
    setFailed(false);
    if (!path) {
      setUrl(null);
      return;
    }
    if (/^(https?:|file:|data:|blob:)/.test(path)) {
      setUrl(path);
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setUrl(data.publicUrl || null);
  }, [path]);

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.secondary },
        style,
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={name ? `Profile photo of ${name}` : 'Profile avatar'}
    >
      {url && !failed ? (
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessible={false}
        />
      ) : (
        <>
          <Typography variant={size >= 64 ? 'h1' : 'h3'} style={{ color: colors.secondaryForeground }} accessible={false}>
            {initial}
          </Typography>
          {!name && <Feather name="user" size={Math.max(14, size / 4)} color={colors.secondaryForeground} accessible={false} />}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});