import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchIssues } from '../../store/slices/issueSlice';
import { IssueCard } from '../../components/IssueCard';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { FilterModal } from '../../components/FilterModal';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { OfficerTabParamList, RootStackParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<OfficerTabParamList, 'OfficerDashboard'>,
  StackScreenProps<RootStackParamList>
>;

const CATEGORIES = ['ALL', 'ROAD', 'WATER', 'ELECTRICITY', 'GARBAGE', 'DRAINAGE', 'OTHER'];
const STATUSES = ['ALL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];

export const OfficerDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { issues, loading } = useAppSelector((state) => state.issue);
  const { user } = useAppSelector((state) => state.auth);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Debounce search input to avoid triggering APIs on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

  const loadData = useCallback(
    (isRefresh = false) => {
      const filters: any = {
        page: 1,
        limit: 50,
      };
      if (search) filters.search = search;
      if (selectedCategory !== 'ALL') filters.category = selectedCategory;
      if (selectedStatus !== 'ALL') filters.status = selectedStatus;

      if (isRefresh) setRefreshing(true);
      dispatch(fetchIssues(filters)).finally(() => {
        if (isRefresh) setRefreshing(false);
        setIsFirstLoad(false);
      });
    },
    [dispatch, search, selectedCategory, selectedStatus]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    loadData(true);
  };

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = issues.filter((i: any) => cat === 'ALL' || i.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  const statusCounts = STATUSES.reduce((acc, status) => {
    acc[status] = issues.filter((i: any) => status === 'ALL' || i.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Welcome Officer,</Text>
          <Text style={styles.userName}>{user?.name || 'Officer'}</Text>
        </View>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>ASSIGNED WORK</Text>
        </View>
      </View>

      {/* Search Input & Filter Button */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search assigned tickets..."
          placeholderTextColor={Colors.placeholder}
          value={searchInput}
          onChangeText={setSearchInput}
        />
        <TouchableOpacity
          style={[
            styles.filterButton,
            (selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && styles.filterButtonActive
          ]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterButtonText,
              (selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && styles.filterButtonTextActive
            ]}
          >
            {(selectedCategory !== 'ALL' || selectedStatus !== 'ALL') ? '✓ Filter' : '🔍 Filter'}
          </Text>
        </TouchableOpacity>
      </View>

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        selectedCategory={selectedCategory}
        selectedStatus={selectedStatus}
        onApply={(category, status) => {
          setSelectedCategory(category);
          setSelectedStatus(status);
          setFilterModalVisible(false);
        }}
        onClear={() => {
          setSelectedCategory('ALL');
          setSelectedStatus('ALL');
          setFilterModalVisible(false);
        }}
        totalCount={issues.length}
        categories={CATEGORIES}
        statuses={STATUSES}
        categoryCounts={categoryCounts}
        statusCounts={statusCounts}
      />

      {/* Issues List */}
      {loading && isFirstLoad && !refreshing ? (
        <LoadingIndicator message="Loading your assignments..." />
      ) : (
        <FlatList
          data={issues}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <IssueCard
              issue={item}
              onPress={() => navigation.navigate('IssueDetails', { issueId: item._id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Tasks Assigned"
              description="You have no pending assignments or complaints in this category."
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  welcomeText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.base,
  },
  userName: {
    color: Colors.textPrimary,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  badgeContainer: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  badgeText: {
    color: Colors.warning,
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.xs,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    height: 44,
    fontSize: Typography.size.base,
  },
  filterButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  filterButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  filterButtonText: {
    color: Colors.textPrimary,
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.sm,
  },
  filterButtonTextActive: {
    color: Colors.primaryLight,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
});
