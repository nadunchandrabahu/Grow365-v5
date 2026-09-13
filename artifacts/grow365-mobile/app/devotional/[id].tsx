import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { Typography } from '@/components/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import {
  useDevotional,
  useReadingProgress,
  useSaveReadingProgress,
} from '@/hooks/useDevotional';
import { useBookmark, useToggleBookmark } from '@/hooks/useBookmarks';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';

function getSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatReference(
  book: string | null,
  chapter: number | null,
  verses: string | null,
): string | null {
  if (!book) return null;
  if (!chapter) return book;
  return `${book} ${chapter}${verses ? `:${verses}` : ''}`;
}

const INJECTED_JS = `
  (function() {
    var meta = document.querySelector('meta[name="viewport"]') || document.createElement('meta');
    if (!meta.parentNode) {
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

    function hideAdobeBranding() {
      document.querySelectorAll('a[href*="adobe.com/express"]').forEach(function(link) {
        var candidate = link.closest('[class*="brand"], [id*="brand"], [class*="Banner"], [class*="banner"]');
        if (candidate && /adobe express/i.test(candidate.textContent || '')) {
          candidate.style.setProperty('display', 'none', 'important');
        }
      });
      document.querySelectorAll('.cc-ViewerBanner, .cc-AppBanner').forEach(function(element) {
        element.style.setProperty('display', 'none', 'important');
      });
    }
    hideAdobeBranding();
    new MutationObserver(hideAdobeBranding).observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    var lastScrollPct = 0;
    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          var h = document.documentElement;
          var b = document.body;
          var st = 'scrollTop';
          var sh = 'scrollHeight';
          var scrollable = (h[sh] || b[sh]) - h.clientHeight;
          if (scrollable <= 0) return;
          
          var pct = Math.round(((h[st] || b[st]) / scrollable) * 100);
          if (!isNaN(pct) && Math.abs(pct - lastScrollPct) >= 5) {
            lastScrollPct = pct;
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scroll', pct: pct }));
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  })();
  true;
`;

const injectRestoreScroll = (pct: number) => `
  (function() {
    var userInteracted = false;
    function stopRestore() { userInteracted = true; }
    window.addEventListener('touchstart', stopRestore, { passive: true, once: true });
    window.addEventListener('wheel', stopRestore, { passive: true, once: true });
    function restore() {
      if (userInteracted) return;
      var h = document.documentElement;
      var b = document.body;
      var scrollable = Math.max(h.scrollHeight, b.scrollHeight) - window.innerHeight;
      if (scrollable > 0) {
        window.scrollTo(0, scrollable * (${pct} / 100));
      }
    }
    [150, 500, 1100, 2200].forEach(function(delay) {
      window.setTimeout(restore, delay);
    });
  })();
  true;
`;

function formatDevotionalDate(
  publishDate: string | null,
  startDate: string | undefined,
  dayOfYear: number,
  timeZone: string | undefined,
): string {
  const sourceDate = publishDate
    ? new Date(`${publishDate}T12:00:00Z`)
    : startDate
      ? new Date(`${startDate}T12:00:00Z`)
      : null;

  if (!sourceDate || Number.isNaN(sourceDate.getTime())) return `Day ${dayOfYear}`;
  if (!publishDate) sourceDate.setUTCDate(sourceDate.getUTCDate() + dayOfYear - 1);

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: timeZone || 'UTC',
    }).format(sourceDate);
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(sourceDate);
  }
}

function staysInAdobeView(url: string, originalUrl: string): boolean {
  try {
    const targetHost = new URL(url).hostname.toLowerCase();
    const originalHost = new URL(originalUrl).hostname.toLowerCase();
    return (
      targetHost === originalHost ||
      targetHost === 'adobe.com' ||
      targetHost.endsWith('.adobe.com') ||
      targetHost === 'adobe.io' ||
      targetHost.endsWith('.adobe.io')
    );
  } catch {
    return false;
  }
}

export default function DevotionalReaderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const devotionalId = getSingleParam(params.id);
  
  const webViewRef = useRef<WebView>(null);
  const [webViewError, setWebViewError] = useState(false);
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);

  const devotionalQuery = useDevotional(user?.id, devotionalId);
  const progressQuery = useReadingProgress(user?.id, devotionalId);
  const saveProgress = useSaveReadingProgress(user?.id, devotionalId);
  const profileQuery = useProfile(user?.id);
  
  const bookmarkQuery = useBookmark(user?.id, devotionalId);
  const toggleBookmarkMutation = useToggleBookmark(user?.id, devotionalId);

  const isBookmarked = Boolean(bookmarkQuery.data);
  const isCompleted = Boolean(progressQuery.data?.completed_at);
  const scrollPctRef = useRef(progressQuery.data?.scroll_pct ?? 0);
  const initialScrollRestored = useRef(false);

  useEffect(() => {
    if (!initialScrollRestored.current && progressQuery.data?.scroll_pct) {
      scrollPctRef.current = progressQuery.data.scroll_pct;
    }
  }, [progressQuery.data?.scroll_pct]);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data: unknown = JSON.parse(event.nativeEvent.data);
        if (
          typeof data === 'object' &&
          data !== null &&
          'type' in data &&
          'pct' in data &&
          data.type === 'scroll' &&
          typeof data.pct === 'number'
        ) {
          if (progressQuery.data?.completed_at || saveProgress.isPending) return;
          
          const boundedPct = Math.min(99, Math.max(0, data.pct));
          if (Math.abs(boundedPct - scrollPctRef.current) >= 5) {
            scrollPctRef.current = boundedPct;
            saveProgress.mutate({ scrollPct: boundedPct });
          }
        }
      } catch {}
    },
    [progressQuery.data?.completed_at, saveProgress]
  );

  if (
    devotionalQuery.isLoading ||
    progressQuery.isLoading ||
    (devotionalQuery.isFetching &&
      Boolean(devotionalQuery.data && !devotionalQuery.data.is_free))
  ) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <LoadingState message="Opening your reading..." />
      </View>
    );
  }

  if (devotionalQuery.isError || progressQuery.isError) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <ErrorState
          title="This reading could not be opened"
          description="It may not be available to your account, or your connection may be offline."
          onRetry={() => {
            void devotionalQuery.refetch();
            void progressQuery.refetch();
          }}
        />
      </View>
    );
  }

  const devotional = devotionalQuery.data;
  if (!devotional) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="book-open"
          title="Reading unavailable"
          description="This devotional is not currently available to your account."
        />
      </View>
    );
  }

  let coverUrl: string | null = null;
  const activeCoverPath = devotional.cover_path || devotional.devotional_series?.cover_path;
  if (activeCoverPath) {
    coverUrl = supabase.storage.from('devotional-assets').getPublicUrl(activeCoverPath).data.publicUrl;
  }

  const reference = formatReference(
    devotional.primary_book,
    devotional.primary_chapter,
    devotional.primary_verses,
  );

  const displayDate = formatDevotionalDate(
    devotional.publish_date,
    profileQuery.data?.start_date,
    devotional.day_of_year,
    profileQuery.data?.timezone,
  );

  const handleShare = async (): Promise<void> => {
    try {
      await Share.share({
        title: devotional.title,
        url: devotional.express_url,
        message:
          Platform.OS === 'android'
            ? `Read "${devotional.title}" on Grow365:\n${devotional.express_url}`
            : undefined,
      });
    } catch {}
  };

  const toggleBookmark = () => {
    if (toggleBookmarkMutation.isPending) return;
    toggleBookmarkMutation.mutate(isBookmarked);
  };

  const toggleComplete = () => {
    if (saveProgress.isPending) return;
    if (!isCompleted) {
      saveProgress.mutate({ scrollPct: 100, completedAt: new Date().toISOString() });
    }
  };

  const renderOfflineState = () => (
    <View style={styles.offlineContainer}>
      {coverUrl && failedCoverUrl !== coverUrl ? (
        <Image 
          source={{ uri: coverUrl }} 
          style={styles.offlineImage} 
          cachePolicy="disk" 
          contentFit="cover"
          onError={() => setFailedCoverUrl(coverUrl)}
        />
      ) : (
        <View style={[styles.offlineImage, { backgroundColor: colors.muted }]} />
      )}
      <View style={styles.offlineContent}>
        <Typography variant="h2" style={styles.offlineTitle}>{devotional.title}</Typography>
        {reference && (
          <Typography variant="reference" color="accent" style={styles.offlineRef}>
            {reference.toUpperCase()}
          </Typography>
        )}
        <Typography variant="body" color="muted" align="center" style={{ marginTop: 24 }}>
          Today’s devotional needs a connection. It’ll be here when you’re back online.
        </Typography>
        <Button 
          title="Try Again" 
          onPress={() => setWebViewError(false)} 
          style={{ marginTop: 32 }} 
          variant="outline" 
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Native Bar */}
      <View style={[
        styles.topBar, 
        { 
          paddingTop: Math.max(insets.top, 16), 
          backgroundColor: colors.background, 
          borderBottomColor: colors.border 
        }
      ]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.foreground} />
        </Pressable>
        <View style={styles.topBarTitle}>
          <Typography variant="caption" color="muted">
            {displayDate.toUpperCase()}
          </Typography>
          <Typography variant="reference" color="foreground" numberOfLines={1}>
            {`DAY ${devotional.day_of_year} · ${
              devotional.devotional_series?.name ?? 'GROW365'
            }`.toUpperCase()}
          </Typography>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {webViewError ? (
          renderOfflineState()
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: devotional.express_url }}
            style={styles.webview}
            injectedJavaScript={INJECTED_JS}
            onMessage={onMessage}
            onLoadEnd={() => {
              if (!initialScrollRestored.current && scrollPctRef.current > 0) {
                webViewRef.current?.injectJavaScript(injectRestoreScroll(scrollPctRef.current));
                initialScrollRestored.current = true;
              }
            }}
            onError={() => setWebViewError(true)}
            onHttpError={(syntheticEvent) => {
              const { statusCode, url } = syntheticEvent.nativeEvent;
              if (
                statusCode >= 400 &&
                statusCode < 600 &&
                url === devotional.express_url
              ) {
                setWebViewError(true);
              }
            }}
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url;
              if (
                url === 'about:blank' ||
                url.startsWith('data:') ||
                url.startsWith('blob:')
              ) {
                return true;
              }
              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                void Linking.openURL(url).catch(() => {});
                return false;
              }
              if (staysInAdobeView(url, devotional.express_url)) {
                return true;
              }
              void WebBrowser.openBrowserAsync(url).catch(() => {});
              return false;
            }}
            androidLayerType="hardware"
            domStorageEnabled={true}
            javaScriptEnabled={true}
            nestedScrollEnabled={true}
            overScrollMode="never"
            cacheEnabled={true}
            cacheMode="LOAD_CACHE_ELSE_NETWORK"
            bounces={false}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
                <LoadingState message="" />
              </View>
            )}
          />
        )}
      </View>

      {/* Bottom Native Bar */}
      <View style={[
        styles.bottomBar, 
        { 
          paddingBottom: Math.max(insets.bottom, 16), 
          backgroundColor: colors.background, 
          borderTopColor: colors.border 
        }
      ]}>
        <Pressable
          onPress={toggleBookmark}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark devotional'}
        >
          <Ionicons 
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'} 
            size={24} 
            color={isBookmarked ? colors.accent : colors.foreground} 
          />
          <Typography variant="caption" style={styles.actionLabel}>Bookmark</Typography>
        </Pressable>
        
        <Pressable 
          onPress={() => router.push(`/journal/new?devotionalId=${devotional.id}`)}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel="Journal this devotional"
        >
          <Ionicons name="create-outline" size={24} color={colors.foreground} />
          <Typography variant="caption" style={styles.actionLabel}>Journal</Typography>
        </Pressable>
        
        <Pressable 
          onPress={() => router.push(`/(tabs)/study?devotionalId=${devotional.id}`)}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel="Discuss in a group"
        >
          <Ionicons name="chatbubbles-outline" size={24} color={colors.foreground} />
          <Typography variant="caption" style={styles.actionLabel}>Discuss</Typography>
        </Pressable>
        
        <Pressable
          onPress={() => void handleShare()}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel="Share devotional"
        >
          <Ionicons name="share-outline" size={24} color={colors.foreground} />
          <Typography variant="caption" style={styles.actionLabel}>Share</Typography>
        </Pressable>
        
        <Pressable
          onPress={toggleComplete}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel={isCompleted ? 'Devotional complete' : 'Mark devotional complete'}
          disabled={isCompleted || saveProgress.isPending}
        >
          <Ionicons 
            name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'} 
            size={24} 
            color={isCompleted ? colors.success : colors.foreground} 
          />
          <Typography variant="caption" style={styles.actionLabel}>
            {isCompleted ? 'Done' : 'Complete'}
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  state: { flex: 1 },
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
    width: 44,
    alignItems: 'center',
  },
  topBarTitle: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  content: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  actionLabel: {
    fontSize: 10,
    lineHeight: 12,
  },
  offlineContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  offlineImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    marginBottom: 32,
  },
  offlineContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  offlineTitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  offlineRef: {
    textAlign: 'center',
  },
});
