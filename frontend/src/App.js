import React, { useState, useEffect } from 'react';
import { AlertCircle, Copy, CheckCircle, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

export default function ContentCreatorApp() {
  const [currentView, setCurrentView] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: ''
  });
  
  const [contentType, setContentType] = useState('');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setCurrentView('dashboard');
    }
  }, []);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setCurrentView('login');
  };

  const getTrialDays = () => {
    if (!user?.subscription) return 0;
    const trialEnd = new Date(user.subscription.trialEndDate);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

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
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">Content Creator AI</h1>
            <div className="flex items-center gap-4">
              {user?.subscription?.isTrialActive && (
                <span className="text-sm text-gray-600">
                  Trial: {getTrialDays()} days left
                </span>
              )}
              <span className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
        
        <div className="max-w-3xl mx-auto px-4 py-12">
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
                disabled={isLoading || !contentType}
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
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">Content Creator AI</h1>
            <div className="flex items-center gap-4">
              {user?.subscription?.isTrialActive && (
                <span className="text-sm text-gray-600">
                  Trial: {getTrialDays()} days left
                </span>
              )}
              <span className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
        
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Your {contentType}</h2>
                <p className="text-gray-600">AI-optimized and ready to publish</p>
              </div>
              <button
                onClick={handleCopy}
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