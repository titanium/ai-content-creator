import React, { useState, useEffect } from 'react';
import { 
  Search, Users, DollarSign, FileText, TrendingUp, 
  ChevronLeft, ChevronRight, ArrowUpDown, Eye, Calendar,
  CheckCircle, XCircle, Clock, AlertCircle
} from 'lucide-react';

const API_URL = 'https://ai-content-creator-backend-production.up.railway.app/api';

export default function AdminDashboard({ token, onLogout }) {
  const [currentView, setCurrentView] = useState('users'); // 'users' or 'user-detail'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Users list state
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  
  // User detail state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userContent, setUserContent] = useState([]);
  
  // Admin stats state
  const [adminStats, setAdminStats] = useState(null);

  useEffect(() => {
    fetchAdminStats();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, statusFilter, sortBy, sortOrder, currentPage]);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Access denied. Admin privileges required.');
          return;
        }
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setAdminStats(data);
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 50,
        sortBy,
        sortOrder
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`${API_URL}/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Access denied. Admin privileges required.');
          return;
        }
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch user details');
      
      const data = await response.json();
      setSelectedUser(data.user);
      setCurrentView('user-detail');
      
      // Fetch user's content
      fetchUserContent(userId);
    } catch (err) {
      setError('Failed to fetch user details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserContent = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/content?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch user content');
      
      const data = await response.json();
      setUserContent(data.content);
    } catch (err) {
      console.error('Fetch user content error:', err);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (subscription) => {
    if (subscription.status === 'active') {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
          <CheckCircle size={12} />
          Active
        </span>
      );
    }
    if (subscription.isTrialActive) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
          <Clock size={12} />
          Trial
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-medium">
        <XCircle size={12} />
        Expired
      </span>
    );
  };

  const getContentTypeDisplay = (type) => {
    const typeMap = {
      'blog': 'Blog Post',
      'x_threads': 'X/Threads',
      'linkedin': 'LinkedIn'
    };
    return typeMap[type] || type;
  };

  // Access denied view
  if (error === 'Access denied. Admin privileges required.') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have admin privileges to access this page.</p>
          <button
            onClick={onLogout}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to App
          </button>
        </div>
      </div>
    );
  }

  // User Detail View
  if (currentView === 'user-detail' && selectedUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button
              onClick={() => setCurrentView('users')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ChevronLeft size={20} />
              Back to Users
            </button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h1>
                <p className="text-gray-600">{selectedUser.email}</p>
              </div>
              {getStatusBadge(selectedUser.subscription)}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* User Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Account Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Account Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">User ID</p>
                  <p className="text-sm font-mono text-gray-900">{selectedUser.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Subscription</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedUser.subscription.status}
                  </p>
                </div>
                {selectedUser.subscription.isTrialActive && (
                  <div>
                    <p className="text-xs text-gray-500">Trial Days Left</p>
                    <p className="text-sm text-gray-900">
                      {selectedUser.subscription.trialDaysRemaining} days
                    </p>
                  </div>
                )}
                {selectedUser.subscription.stripeCustomerId && (
                  <div>
                    <p className="text-xs text-gray-500">Stripe Customer</p>
                    <p className="text-xs font-mono text-gray-900 truncate">
                      {selectedUser.subscription.stripeCustomerId}
                    </p>
                  </div>
                )}
                {selectedUser.subscription.stripeCurrentPeriodEnd && (
                  <div>
                    <p className="text-xs text-gray-500">Next Billing</p>
                    <p className="text-sm text-gray-900">
                      {formatDate(selectedUser.subscription.stripeCurrentPeriodEnd)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Content Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Content Stats</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Total Content</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedUser.contentStats.total}
                  </p>
                </div>
                {selectedUser.contentStats.byType.map(stat => (
                  <div key={stat.type}>
                    <p className="text-xs text-gray-500">{getContentTypeDisplay(stat.type)}</p>
                    <p className="text-sm text-gray-900">
                      {stat.count} ({stat.totalWords.toLocaleString()} words)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Content</h3>
            {userContent.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No content yet</p>
            ) : (
              <div className="space-y-3">
                {userContent.map(content => (
                  <div key={content.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                            {getContentTypeDisplay(content.contentType)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(content.createdAt)}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                          {content.topic}
                        </h4>
                      </div>
                      <span className="text-xs text-gray-500 ml-4">
                        {content.wordCount} words
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Users List View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={onLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {adminStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{adminStats.totalUsers}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    +{adminStats.usersLast30Days} this month
                  </p>
                </div>
                <Users className="text-indigo-600" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Subs</p>
                  <p className="text-3xl font-bold text-green-600">{adminStats.activeSubscriptions}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {adminStats.trialUsers} on trial
                  </p>
                </div>
                <CheckCircle className="text-green-600" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">MRR</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${adminStats.monthlyRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Monthly revenue
                  </p>
                </div>
                <DollarSign className="text-green-600" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Content</p>
                  <p className="text-3xl font-bold text-gray-900">{adminStats.totalContent}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    +{adminStats.contentLast30Days} this month
                  </p>
                </div>
                <FileText className="text-indigo-600" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="canceled">Canceled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('email')}
                          className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase tracking-wider hover:text-gray-900"
                        >
                          Email
                          <ArrowUpDown size={14} />
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('firstName')}
                          className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase tracking-wider hover:text-gray-900"
                        >
                          Name
                          <ArrowUpDown size={14} />
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Content
                      </th>
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('createdAt')}
                          className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase tracking-wider hover:text-gray-900"
                        >
                          Joined
                          <ArrowUpDown size={14} />
                        </button>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{user.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => fetchUserDetails(user.id)}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            {user.firstName} {user.lastName}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(user.subscription)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{user.contentCount}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">{formatDate(user.createdAt)}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => fetchUserDetails(user.id)}
                            className="text-indigo-600 hover:text-indigo-800"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} users
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="px-4 py-1 text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                      disabled={currentPage === pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
