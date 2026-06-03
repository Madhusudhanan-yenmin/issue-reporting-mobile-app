import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../theme';
import { Comment } from '../store/slices/commentSlice';

interface CommentItemProps {
  comment: Comment;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <Text style={styles.authorName}>{comment.author?.name || 'Anonymous'}</Text>
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
  },
  authorName: {
    color: Colors.textPrimary,
    fontSize: Typography.size.sm + 1,
    fontWeight: Typography.weight.bold,
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
});
