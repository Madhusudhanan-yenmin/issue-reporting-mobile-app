import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme';
import { Comment } from '../store/slices/commentSlice';

interface CommentItemProps {
  comment: Comment;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return Colors.error;
      case 'OFFICER':
        return Colors.warning;
      default:
        return Colors.primary;
    }
  };

  const authorName = comment.author?.name || 'Anonymous';
  const isNameLong = authorName.length > 20;

  return (
    <View style={styles.container}>
      {showTooltip && (
        <View style={styles.tooltipContainer}>
          <Text style={styles.tooltipText}>{authorName}</Text>
          <View style={styles.tooltipArrow} />
        </View>
      )}
      <View style={styles.header}>
        <View style={styles.authorRow}>
          {isNameLong ? (
            <TouchableOpacity
              onPress={() => setShowTooltip(!showTooltip)}
              style={styles.authorNameWrapper}
              activeOpacity={0.7}
            >
              <Text style={styles.authorName} numberOfLines={1} ellipsizeMode="tail">
                {authorName}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.authorName}>
              {authorName}
            </Text>
          )}
          <View
            style={[
              styles.badge,
              { backgroundColor: getRoleBadgeColor(comment.author?.role) + '20' },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: getRoleBadgeColor(comment.author?.role) },
              ]}
            >
              {comment.author?.role || 'USER'}
            </Text>
          </View>
        </View>
        <Text style={styles.timeText}>{formatTime(comment.createdAt)}</Text>
      </View>
      <Text style={styles.commentText}>{comment.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  authorName: {
    color: Colors.textPrimary,
    fontSize: Typography.size.sm + 1,
    fontWeight: Typography.weight.bold,
    flexShrink: 1,
  },
  authorNameWrapper: {
    flexShrink: 1,
    marginRight: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    borderRadius: Radii.sm,
  },
  badgeText: {
    fontSize: Typography.size.xs - 1,
    fontWeight: Typography.weight.bold,
  },
  timeText: {
    color: Colors.textMuted,
    fontSize: Typography.size.xs,
  },
  commentText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.base,
    lineHeight: Typography.lineHeight.normal * Typography.size.base,
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: '100%',
    left: Spacing.md,
    backgroundColor: 'rgba(35, 39, 58, 0.95)',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm + 2,
    zIndex: 10,
    marginBottom: 6,
    maxWidth: 250,
    ...Shadows.md,
  },
  tooltipText: {
    color: Colors.textPrimary,
    fontSize: Typography.size.xs + 1,
    fontWeight: Typography.weight.bold,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -5,
    left: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    borderRightWidth: 6,
    borderRightColor: 'transparent',
    borderTopWidth: 6,
    borderTopColor: 'rgba(35, 39, 58, 0.95)',
  },
});
