import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Copy, CheckCircle, Loader2, Sparkles, CreditCard, History, Trash2, Eye, Calendar, FileText, Settings, CreditCard as CreditCardIcon, Calendar as CalendarIcon, ChevronDown, LogOut } from 'lucide-react';
import AdminDashboard from './AdminDashboard';

const API_URL = 'https://ai-content-creator-backend-production.up.railway.app/api';

export default function ContentCreatorApp() {
  const [currentView, setCurrentView] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [copied, setCopied] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const dropdownRef = useRef(null);
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: ''
  });
  
  const [contentType, setContentType] = useState('');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState('');

  // Content History State
  const [contentHistory, setContentHistory] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historyStats, setHistoryStats] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      
      // Check if user is admin
      checkAdminStatus(savedToken).then(isAdminUser => {
        setIsAdmin(isAdminUser);
        if (isAdminUser) {
          setCurrentView('admin');
        } else {
          setCurrentView('dashboard');
        }
      });
      
      fetchSubscriptionStatus(savedToken);
    }

    // Check for successful Stripe checkout
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setError('');
      setTimeout(() => {
        if (savedToken) {
          fetchSubscriptionStatus(savedToken);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }, 2000);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch content history when filter changes
  useEffect(() => {
    if (currentView === 'history' && token) {
      fetchContentHistory();
    }
  }, [historyFilter, currentView]);

  const fetchSubscriptionStatus = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setSubscriptionStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
    }
  };

  const checkAdminStatus = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const fetchContentHistory = async () => {
    setIsLoading(true);
    try {
      const url = historyFilter === 'all' 
        ? `${API_URL}/content/history`
        : `${API_URL}/content/history?contentType=${historyFilter}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setContentHistory(data.content || []);
      } else {
        setError(data.error || 'Failed to fetch content history');
      }
    } catch (err) {
      setError('Failed to fetch content history');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContentStats = async () => {
    try {
      const response = await fetch(`${API_URL}/content/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setHistoryStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const viewContentDetail = async (contentId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/content/${contentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setSelectedContent(data.content);
        setCurrentView('content-detail');
      } else {
        setError(data.error || 'Failed to load content');
      }
    } catch (err) {
      setError('Failed to load content');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteContent = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/content/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refresh the list
        fetchContentHistory();
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete content');
      }
    } catch (err) {
      setError('Failed to delete content');
      console.error(err);
    }
  };

  const handleCreateCheckout = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/subscription/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create checkout session');
        setIsLoading(false);
        return;
      }

      window.location.href = data.url;

    } catch (err) {
      setError('Failed to connect to payment service');
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/subscription/create-portal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to open billing portal');
        setIsLoading(false);
        return;
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;

    } catch (err) {
      setError('Failed to connect to billing service');
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setError('');
    
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (signupData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!signupData.email || !signupData.firstName || !signupData.lastName) {
      setError('All fields are required');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupData.email,
          password: signupData.password,
          firstName: signupData.firstName,
          lastName: signupData.lastName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setCurrentView('dashboard');
      fetchSubscriptionStatus(data.token);
      
    } catch (err) {
      setError('Failed to connect to server. Make sure backend is running.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    
    if (!loginData.email || !loginData.password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setCurrentView('dashboard');
      fetchSubscriptionStatus(data.token);
      
    } catch (err) {
      setError('Failed to connect to server. Make sure backend is running.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!topic || !contentType) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/content/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contentType,
          topic,
          keywords
        })
      });
      
      const data = await response.json();

      if (!response.ok) {
        if (data.needsSubscription) {
          setError('Your trial has expired. Please subscribe to continue.');
          setCurrentView('upgrade');
        } else {
          setError(data.error || 'Failed to generate content');
        }
        setIsLoading(false);
        return;
      }
      
      setGeneratedContent(data.content.generatedContent);
      setCurrentView('result');
    } catch (err) {
      setError('Failed to generate content. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text || generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setSubscriptionStatus(null);
    setCurrentView('login');
  };

  const getTrialDays = () => {
    if (subscriptionStatus) {
      return subscriptionStatus.trialDaysRemaining || 0;
    }
    if (!user?.subscription) return 0;
    const trialEnd = new Date(user.subscription.trialEndDate);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const isTrialActive = () => {
    if (subscriptionStatus) {
      return subscriptionStatus.isTrialActive && getTrialDays() > 0;
    }
    return user?.subscription?.isTrialActive && getTrialDays() > 0;
  };

  const hasActiveAccess = () => {
    if (subscriptionStatus) {
      return subscriptionStatus.hasActiveSubscription || isTrialActive();
    }
    return user?.subscription?.status === 'active' || isTrialActive();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getContentTypeDisplay = (type) => {
    const typeMap = {
      'blog': 'Blog Post',
      'x_threads': 'X/Threads',
      'linkedin': 'LinkedIn'
    };
    return typeMap[type] || type;
  };

  // Navigation Component
  const Navigation = () => (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-600">Content Creator AI</h1>
        <div className="flex items-center gap-4">
          {currentView !== 'login' && currentView !== 'signup' && (
            <>
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`text-sm font-medium ${
                  currentView === 'dashboard' ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Create
              </button>
            </>
          )}
          {isTrialActive() && (
            <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
              <span className="text-sm text-yellow-800 font-medium">
                Trial: {getTrialDays()} days left
              </span>
              <button
                onClick={() => setCurrentView('upgrade')}
                className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
              >
                Upgrade
              </button>
            </div>
          )}
          {subscriptionStatus?.hasActiveSubscription && (
            <span className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm text-green-800 font-medium">Pro</span>
            </span>
          )}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-indigo-600 transition"
              >
                <span>{user?.firstName} {user?.lastName}</span>
                <ChevronDown 
                  size={16} 
                  className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      setCurrentView('history');
                      fetchContentHistory();
                      fetchContentStats();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <History size={16} />
                    History
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('settings');
                      fetchSubscriptionStatus(token);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );

  // Admin Dashboard View
  if (currentView === 'admin') {
    return <AdminDashboard token={token} onLogout={handleLogout} />;
  }

  // Content History View
  if (currentView === 'history') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Content History</h2>
            <p className="text-gray-600">View and manage all your generated content</p>
          </div>

          {/* Stats Cards */}
          {historyStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Content</p>
                    <p className="text-2xl font-bold text-gray-900">{historyStats.totalContent}</p>
                  </div>
                  <FileText className="text-indigo-600" size={32} />
                </div>
              </div>
              {historyStats.byType.map(stat => (
                <div key={stat.type} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <p className="text-sm text-gray-600">{getContentTypeDisplay(stat.type)}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.totalWords.toLocaleString()} words</p>
                </div>
              ))}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            {['all', 'blog', 'x_threads', 'linkedin'].map(filter => (
              <button
                key={filter}
                onClick={() => setHistoryFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  historyFilter === filter
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {filter === 'all' ? 'All' : getContentTypeDisplay(filter)}
              </button>
            ))}
          </div>

          {/* Content List */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
          ) : contentHistory.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <History className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No content yet</h3>
              <p className="text-gray-600 mb-4">Start creating content to see it here</p>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
              >
                Create Content
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {contentHistory.map(content => (
                <div key={content.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:border-indigo-200 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                          {getContentTypeDisplay(content.contentType)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar size={14} />
                          {formatDate(content.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{content.topic}</h3>
                      {content.keywords && (
                        <p className="text-sm text-gray-600 mb-2">
                          Keywords: {content.keywords}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {content.wordCount?.toLocaleString()} words
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => viewContentDetail(content.id)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="View content"
                      >
                        <Eye size={20} />
                      </button>
                      <button
                        onClick={() => deleteContent(content.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete content"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Settings/Subscription Management View
  if (currentView === 'settings') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Settings</h2>
            <p className="text-gray-600">Manage your account and subscription</p>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <p className="text-gray-900 font-medium">{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="text-gray-900 font-medium">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
              {subscriptionStatus?.hasActiveSubscription && (
                <span className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm text-green-800 font-medium">Active</span>
                </span>
              )}
              {isTrialActive() && (
                <span className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                  <CalendarIcon size={16} className="text-yellow-600" />
                  <span className="text-sm text-yellow-800 font-medium">Trial</span>
                </span>
              )}
              {!subscriptionStatus?.hasActiveSubscription && !isTrialActive() && (
                <span className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                  <AlertCircle size={16} className="text-red-600" />
                  <span className="text-sm text-red-800 font-medium">Expired</span>
                </span>
              )}
            </div>

            <div className="space-y-4">
              {/* Trial Info */}
              {isTrialActive() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">Free Trial Active</p>
                      <p className="text-sm text-gray-700">
                        You have <strong>{getTrialDays()} days</strong> remaining in your trial.
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        Trial ends: {subscriptionStatus?.trialEndDate ? formatDate(subscriptionStatus.trialEndDate) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentView('upgrade')}
                    className="mt-4 w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 font-medium"
                  >
                    Upgrade to Pro
                  </button>
                </div>
              )}

              {/* Active Subscription Info */}
              {subscriptionStatus?.hasActiveSubscription && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CreditCardIcon className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">Pro Subscription</p>
                      <p className="text-sm text-gray-700 mb-2">
                        You have unlimited access to all features.
                      </p>
                      {subscriptionStatus?.daysUntilRenewal !== null && (
                        <p className="text-xs text-gray-600">
                          Next billing date: {subscriptionStatus?.stripeCurrentPeriodEnd ? formatDate(subscriptionStatus.stripeCurrentPeriodEnd) : 'N/A'}
                          {' '}({subscriptionStatus.daysUntilRenewal} days)
                        </p>
                      )}
                    </div>
                  </div>
                  {subscriptionStatus?.canManageBilling && (
                    <button
                      onClick={handleManageBilling}
                      disabled={isLoading}
                      className="mt-4 w-full bg-white border-2 border-green-600 text-green-700 py-2 rounded-lg hover:bg-green-50 font-medium flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Loading...
                        </>
                      ) : (
                        <>
                          <CreditCardIcon size={18} />
                          Manage Billing
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Expired Subscription */}
              {!subscriptionStatus?.hasActiveSubscription && !isTrialActive() && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">Subscription Expired</p>
                      <p className="text-sm text-gray-700 mb-2">
                        Your trial has ended. Subscribe to continue creating content.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentView('upgrade')}
                    className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-medium"
                  >
                    Subscribe Now
                  </button>
                </div>
              )}

              {/* Billing Portal Info */}
              {subscriptionStatus?.canManageBilling && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Manage your subscription in the Stripe Customer Portal:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Update payment method</li>
                    <li>• View billing history and invoices</li>
                    <li>• Cancel subscription</li>
                    <li>• Update billing information</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Usage Stats */}
          {historyStats && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Content</p>
                  <p className="text-2xl font-bold text-gray-900">{historyStats.totalContent}</p>
                </div>
                {historyStats.byType.map(stat => (
                  <div key={stat.type}>
                    <p className="text-sm text-gray-600">{getContentTypeDisplay(stat.type)}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Content Detail View
  if (currentView === 'content-detail' && selectedContent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-4 py-12">
          <button
            onClick={() => setCurrentView('history')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            ← Back to History
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                    {getContentTypeDisplay(selectedContent.contentType)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(selectedContent.createdAt)}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedContent.topic}</h2>
                {selectedContent.keywords && (
                  <p className="text-sm text-gray-600 mb-2">
                    Keywords: {selectedContent.keywords}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {selectedContent.wordCount?.toLocaleString()} words
                </p>
              </div>
              <button
                onClick={() => handleCopy(selectedContent.generatedContent)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                {copied ? (
                  <>
                    <CheckCircle size={18} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy
                  </>
                )}
              </button>
            </div>
            
            <div className="prose max-w-none bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {selectedContent.generatedContent}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setContentType(getContentTypeDisplay(selectedContent.contentType));
                setTopic(selectedContent.topic);
                setKeywords(selectedContent.keywords || '');
                setCurrentView('dashboard');
              }}
              className="flex-1 bg-indigo-50 text-indigo-700 py-3 rounded-lg font-semibold hover:bg-indigo-100 transition border border-indigo-200"
            >
              Create Similar Content
            </button>
            <button
              onClick={() => deleteContent(selectedContent.id)}
              className="px-6 bg-red-50 text-red-700 py-3 rounded-lg font-semibold hover:bg-red-100 transition border border-red-200"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Upgrade/Subscription View
  if (currentView === 'upgrade') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-indigo-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upgrade to Pro</h1>
            <p className="text-gray-600">Your trial has ended. Continue creating amazing content!</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border-2 border-indigo-200">
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-indigo-600">$29</div>
              <div className="text-gray-600">per month</div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Unlimited AI-generated content</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">All content types (Blog, X, LinkedIn)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">SEO-optimized content</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Content history & analytics</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Priority support</span>
              </div>
            </div>

            <button
              onClick={handleCreateCheckout}
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Loading...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Subscribe Now
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={() => setCurrentView('dashboard')}
            className="w-full text-gray-600 hover:text-gray-900 text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Creator AI</h1>
          <p className="text-gray-600 mb-6">AI-Optimized Content for Every Platform</p>
          
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setCurrentView('login')}
              className="flex-1 py-2 border-b-2 border-indigo-600 text-indigo-600 font-semibold"
            >
              Login
            </button>
            <button
              onClick={() => setCurrentView('signup')}
              className="flex-1 py-2 border-b-2 border-gray-200 text-gray-500"
            >
              Sign Up
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Get Started Free</h1>
          <p className="text-gray-600 mb-6">15-day trial, no credit card required</p>
          
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setCurrentView('login')}
              className="flex-1 py-2 border-b-2 border-gray-200 text-gray-500"
            >
              Login
            </button>
            <button
              onClick={() => setCurrentView('signup')}
              className="flex-1 py-2 border-b-2 border-indigo-600 text-indigo-600 font-semibold"
            >
              Sign Up
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={signupData.firstName}
                  onChange={(e) => setSignupData({...signupData, firstName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={signupData.lastName}
                  onChange={(e) => setSignupData({...signupData, lastName: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={signupData.email}
                onChange={(e) => setSignupData({...signupData, email: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={signupData.password}
                onChange={(e) => setSignupData({...signupData, password: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={signupData.confirmPassword}
                onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            <button
              onClick={handleSignup}
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400"
            >
              {isLoading ? 'Creating Account...' : 'Start Free Trial'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="max-w-3xl mx-auto px-4 py-12">
          {!hasActiveAccess() && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">Trial Expired</h3>
                  <p className="text-red-800 mb-3">Your free trial has ended. Subscribe to continue creating content.</p>
                  <button
                    onClick={() => setCurrentView('upgrade')}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold"
                  >
                    View Plans
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">What would you like to create today?</h2>
            <p className="text-gray-600 mb-8">Choose your content type and let AI do the heavy lifting</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Content Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Blog Post', 'X/Threads Post', 'LinkedIn Post'].map(type => (
                    <button
                      key={type}
                      onClick={() => setContentType(type)}
                      className={`py-4 px-4 rounded-lg border-2 font-medium transition ${
                        contentType === type
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What do you want to write about? *
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Describe your topic in a few sentences. Be specific about your main message or goal..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords (optional)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="keyword1, keyword2, keyword3"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">Separate keywords with commas</p>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
              
              <button
                onClick={handleGenerateContent}
                disabled={isLoading || !contentType || !hasActiveAccess()}
                className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Generating...
                  </>
                ) : (
                  `Write ${contentType || 'Content'}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'result') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Your {contentType}</h2>
                <p className="text-gray-600">AI-optimized and ready to publish</p>
              </div>
              <button
                onClick={() => handleCopy()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                {copied ? (
                  <>
                    <CheckCircle size={18} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy
                  </>
                )}
              </button>
            </div>
            
            <div className="prose max-w-none bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {generatedContent}
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-50 rounded-2xl p-6 border-2 border-indigo-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What's next?</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setGeneratedContent('');
                  setTopic('');
                  setKeywords('');
                  setContentType('');
                  setCurrentView('dashboard');
                }}
                className="w-full bg-white text-indigo-700 py-3 rounded-lg font-semibold hover:bg-indigo-100 transition border border-indigo-200"
              >
                Create Another Post
              </button>
              
              {contentType === 'Blog Post' && (
                <button
                  onClick={() => {
                    setContentType('X/Threads Post');
                    setTopic(`Create a X/Threads post promoting this blog post: ${topic}`);
                    setCurrentView('dashboard');
                  }}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  Create X/Threads Post for This Blog
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}