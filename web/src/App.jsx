import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/Toast';
import { AssignModal } from './components/AssignModal';
import { ImageComparisonModal } from './components/ImageComparisonModal';
import { BanModal } from './components/BanModal';

import { LoginPage } from './pages/LoginPage';
import { DashboardOverview } from './pages/DashboardOverview';
import { GrievanceHub } from './pages/GrievanceHub';
import { StaffManagement } from './pages/StaffManagement';
import { BlacklistManagement } from './pages/BlacklistManagement';
import { PublicFeedPreview } from './pages/PublicFeedPreview';

import client from './api/client';

function MainPortal() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Navigation State
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [grievanceFilter, setGrievanceFilter] = useState('ALL');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Data States
  const [stats, setStats] = useState(null);
  const [allIssuesList, setAllIssuesList] = useState([]);
  const [unassignedList, setUnassignedList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [blacklist, setBlacklist] = useState([]);

  // Modal States
  const [assignModalIssue, setAssignModalIssue] = useState(null);
  const [reviewModalIssue, setReviewModalIssue] = useState(null);
  const [banModalIssue, setBanModalIssue] = useState(null);

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper to switch tab with optional sub-filter
  const handleSelectTab = (tabId, filter = 'ALL') => {
    setCurrentTab(tabId);
    setMobileSidebarOpen(false); // auto-close drawer on navigation
    if (tabId === 'grievances') {
      setGrievanceFilter(filter);
    }
  };

  // Fetch all live dashboard data
  const fetchData = async () => {
    if (!isAuthenticated) return;
    try {
      const [
        statsRes,
        allRes,
        staffRes,
        blacklistRes
      ] = await Promise.all([
        client.get('/api/admin/stats'),
        client.get('/api/admin/issues/all'),
        client.get('/api/admin/staff'),
        client.get('/api/admin/blacklist')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (allRes.data.success) {
        setAllIssuesList(allRes.data.issues);
        setUnassignedList(allRes.data.issues.filter(i => i.status === 'UNASSIGNED'));
      }
      if (staffRes.data.success) setStaffList(staffRes.data.staff);
      if (blacklistRes.data.success) setBlacklist(blacklistRes.data.bans);

    } catch (err) {
      console.error('Data sync error:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 8000); // 8s auto-refresh
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Direct Assign to Self (Admin)
  const handleAssignSelf = async (issueId) => {
    try {
      const res = await client.post(`/api/admin/issues/${issueId}/assign`, {
        assign_type: 'ADMIN'
      });
      if (res.data.success) {
        showToast('Grievance assigned to your personal admin queue.', 'success');
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign', 'error');
    }
  };

  // Review Action: Approve (POST) or Reject (ARCHIVE)
  const handleReviewAction = async (issueId, action) => {
    try {
      const res = await client.post(`/api/admin/issues/${issueId}/review`, { action });
      if (res.data.success) {
        showToast(
          action === 'POST' ? 'Grievance verified & resolution alert dispatched to student!' : 'Grievance archived.',
          action === 'POST' ? 'success' : 'info'
        );
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Review action failed', 'error');
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: '#94a3b8' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-pulse-glow" style={{ fontSize: '1.8rem', fontWeight: 900, color: '#4f46e5', marginBottom: '8px' }}>
            CARE
          </div>
          <div style={{ fontSize: '0.85rem' }}>Campus Autonomous Reporting & Escalation System...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Top Navigation */}
      <Navbar 
        urgentCount={stats?.urgent_high_priority || 0}
        mobileSidebarOpen={mobileSidebarOpen}
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Main App Workspace */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Sidebar 
          currentTab={currentTab} 
          setTab={handleSelectTab} 
          stats={stats}
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', minWidth: 0 }}>
          {currentTab === 'dashboard' && (
            <DashboardOverview
              stats={stats}
              unassignedList={unassignedList}
              onSelectTab={handleSelectTab}
              onOpenAssign={setAssignModalIssue}
              onOpenReview={setReviewModalIssue}
            />
          )}

          {currentTab === 'grievances' && (
            <GrievanceHub
              issues={allIssuesList}
              initialFilter={grievanceFilter}
              onOpenAssign={setAssignModalIssue}
              onAssignSelf={handleAssignSelf}
              onOpenReviewModal={setReviewModalIssue}
              onQuickReview={handleReviewAction}
              onOpenBan={setBanModalIssue}
              onRefresh={fetchData}
              showToast={showToast}
            />
          )}

          {currentTab === 'staff' && (
            <StaffManagement
              staffList={staffList}
              onOpenAssign={setAssignModalIssue}
              onOpenReviewModal={setReviewModalIssue}
              onQuickReview={handleReviewAction}
              onRefresh={fetchData}
            />
          )}

          {currentTab === 'security' && (
            <BlacklistManagement
              blacklist={blacklist}
              onRefresh={fetchData}
              showToast={showToast}
            />
          )}

          {currentTab === 'public_feed' && (
            <PublicFeedPreview />
          )}
        </main>
      </div>

      {/* Modals */}
      {assignModalIssue && (
        <AssignModal
          issue={assignModalIssue}
          onClose={() => setAssignModalIssue(null)}
          onAssigned={() => {
            showToast('Grievance successfully assigned to staff!', 'success');
            fetchData();
          }}
        />
      )}

      {reviewModalIssue && (
        <ImageComparisonModal
          issue={reviewModalIssue}
          onClose={() => setReviewModalIssue(null)}
          onReview={handleReviewAction}
        />
      )}

      {banModalIssue && (
        <BanModal
          issue={banModalIssue}
          onClose={() => setBanModalIssue(null)}
          onBanned={(hash) => {
            showToast('Student hash has been added to blacklist.', 'error');
            fetchData();
          }}
        />
      )}

      {/* Global Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainPortal />
    </AuthProvider>
  );
}
