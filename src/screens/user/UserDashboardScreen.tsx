import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchIssues } from '../../store/slices/issueSlice';
import { IssueCard } from '../../components/IssueCard';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Typography, Spacing } from '../../theme';
import { FilterModal } from '../../components/FilterModal';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { UserTabParamList, RootStackParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<UserTabParamList, 'UserDashboard'>,
  StackScreenProps<RootStackParamList>
>;

const CATEGORIES = ['ALL', 'ROAD', 'WATER', 'ELECTRICITY', 'GARBAGE', 'DRAINAGE', 'OTHER'];
const STATUSES = ['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'CLOSED'];

export const UserDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { issues, loading, total } = useAppSelector((state) => state.issue);
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
          <Text style={styles.welcomeText}>Hello,</Text>
          <Text style={styles.userName}>{user?.name || 'Citizen'}</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateIssue')}
        >
          <Text style={styles.createButtonText}>+ File Issue</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input & Filter Button */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Ticket ID, Title, Description..."
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
        totalCount={total || issues.length}
        categories={CATEGORIES}
        statuses={STATUSES}
        categoryCounts={categoryCounts}
        statusCounts={statusCounts}
      />

      {/* Issues List */}
      {loading && isFirstLoad && !refreshing ? (
        <LoadingIndicator message="Loading your filed issues..." />
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
              title="No Issues Found"
              description="You haven't reported any issues matching the filters."
              actionTitle="File New Issue"
              onActionPress={() => navigation.navigate('CreateIssue')}
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
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.sm + 1,
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
