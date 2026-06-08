import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../theme';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCategory: string;
  selectedStatus: string;
  onApply: (category: string, status: string) => void;
  onClear: () => void;
  totalCount: number;
  categories: string[];
  statuses: string[];
  categoryCounts?: Record<string, number>;
  statusCounts?: Record<string, number>;
}

const CATEGORY_ICONS: Record<string, string> = {
  ALL: '📋',
  ROAD: '🛣️',
  WATER: '🚰',
  ELECTRICITY: '⚡',
  GARBAGE: '🗑️',
  DRAINAGE: '🕳️',
  OTHER: '❓',
};

const STATUS_ICONS: Record<string, string> = {
  ALL: '📋',
  OPEN: '🟢',
  ASSIGNED: '👤',
  IN_PROGRESS: '⚙️',
  RESOLVED: '✅',
  REOPENED: '⚠️',
  CLOSED: '🔒',
};

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  selectedCategory,
  selectedStatus,
  onApply,
  onClear,
  totalCount,
  categories,
  statuses,
  categoryCounts = {},
  statusCounts = {},
}) => {
  const [activeTab, setActiveTab] = useState<'category' | 'status'>('category');
  const [tempCategory, setTempCategory] = useState(selectedCategory);
  const [tempStatus, setTempStatus] = useState(selectedStatus);

  // Sync state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setTempCategory(selectedCategory);
      setTempStatus(selectedStatus);
    }
  }, [visible, selectedCategory, selectedStatus]);

  const handleApply = () => {
    onApply(tempCategory, tempStatus);
  };

  const handleClear = () => {
    setTempCategory('ALL');
    setTempStatus('ALL');
    // We can directly trigger onClear or let the user apply the cleared state
    onApply('ALL', 'ALL');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter Issues</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Split Body */}
          <View style={styles.body}>
            {/* Left Sidebar */}
            <View style={styles.sidebar}>
              <TouchableOpacity
                style={[
                  styles.sidebarTab,
                  activeTab === 'category' && styles.sidebarTabActive,
                ]}
                onPress={() => setActiveTab('category')}
                activeOpacity={0.8}
              >
                {activeTab === 'category' && <View style={styles.activeIndicator} />}
                <Text
                  style={[
                    styles.sidebarTabText,
                    activeTab === 'category' && styles.sidebarTabTextActive,
                  ]}
                >
                  Category
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sidebarTab,
                  activeTab === 'status' && styles.sidebarTabActive,
                ]}
                onPress={() => setActiveTab('status')}
                activeOpacity={0.8}
              >
                {activeTab === 'status' && <View style={styles.activeIndicator} />}
                <Text
                  style={[
                    styles.sidebarTabText,
                    activeTab === 'status' && styles.sidebarTabTextActive,
                  ]}
                >
                  Status
                </Text>
              </TouchableOpacity>
            </View>

            {/* Right Options List */}
            <ScrollView style={styles.optionsList} contentContainerStyle={styles.optionsListContent}>
              {activeTab === 'category' ? (
                categories.map((cat) => {
                  const isSelected = tempCategory === cat;
                  const count = categoryCounts[cat] ?? 0;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={styles.optionRow}
                      onPress={() => setTempCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionLeft}>
                        <Text style={styles.optionIcon}>{CATEGORY_ICONS[cat] || '❓'}</Text>
                        <Text style={styles.optionText}>{cat}</Text>
                      </View>
                      <View style={styles.optionRight}>
                        {count > 0 && <Text style={styles.countText}>{count}</Text>}
                        <View
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected,
                          ]}
                        >
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                statuses.map((status) => {
                  const isSelected = tempStatus === status;
                  const count = statusCounts[status] ?? 0;
                  return (
                    <TouchableOpacity
                      key={status}
                      style={styles.optionRow}
                      onPress={() => setTempStatus(status)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionLeft}>
                        <Text style={styles.optionIcon}>{STATUS_ICONS[status] || '❓'}</Text>
                        <Text style={styles.optionText}>{status.replace('_', ' ')}</Text>
                      </View>
                      <View style={styles.optionRight}>
                        {count > 0 && <Text style={styles.countText}>{count}</Text>}
                        <View
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected,
                          ]}
                        >
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <Text style={styles.clearBtnText}>Clear all</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApply}
              activeOpacity={0.7}
            >
              <Text style={styles.applyBtnText}>
                View {totalCount} issues
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.md,
    fontWeight: 'bold',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: '35%',
    backgroundColor: Colors.background,
    borderRightWidth: 1,
    borderRightColor: Colors.surfaceBorder,
  },
  sidebarTab: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder + '30',
  },
  sidebarTabActive: {
    backgroundColor: Colors.surface,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    backgroundColor: Colors.primary,
  },
  sidebarTabText: {
    color: Colors.textMuted,
    fontSize: Typography.size.base - 1,
    fontWeight: Typography.weight.bold,
  },
  sidebarTabTextActive: {
    color: Colors.primaryLight,
  },
  optionsList: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  optionsListContent: {
    paddingVertical: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder + '15',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 18,
    marginRight: Spacing.md,
  },
  optionText: {
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  countText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    borderRadius: Radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    alignItems: 'center',
    gap: Spacing.md,
  },
  clearBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    color: Colors.textPrimary,
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.base,
  },
  applyBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.base,
  },
});
