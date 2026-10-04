import React, { useState, useEffect, useCallback } from 'react';
import { Shipment, EmailLog, AuthUser, AuthSession, TabKey } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TrackingView } from './components/TrackingView';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAuthGate } from './components/AdminAuthGate';
import { RateCalculator } from './components/RateCalculator';
import { GlobalServices } from './components/GlobalServices';
import { AirWaybillModal } from './components/AirWaybillModal';
import { CustomerMailboxModal } from './components/CustomerMailboxModal';
import { ContactPage } from './components/ContactPage';
import { LegalPages } from './components/LegalPages';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { fetchCurrentSession, logoutUser } from './utils/authService';
import { apiGet, apiPost, apiDelete, ApiError, errorMessage } from './utils/api';

const EMPTY_SESSION: AuthSession = { user: null, isAuthenticated: false, loginTime: null, expiresAt: null };
const STAFF_REFRESH_MS = 30_000;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('track');
  const [trackedTrackingNumber, setTrackedTrackingNumber] = useState<string>('');

  // Authentication: the server owns the session (httpOnly cookie); we just ask who we are.
  const [session, setSession] = useState<AuthSession>(EMPTY_SESSION);
  const [authChecked, setAuthChecked] = useState(false);

  // Staff-only data, loaded from the API once signed in
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

  // Modals state
  const [selectedWaybillShipment, setSelectedWaybillShipment] = useState<Shipment | null>(null);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);

  useEffect(() => {
    fetchCurrentSession().then((s) => {
      setSession(s);
      setAuthChecked(true);
    });
  }, []);

  const loadStaffData = useCallback(async () => {
    try {
      const [s, m] = await Promise.all([
        apiGet<{ shipments: Shipment[] }>('/shipments?limit=500'),
        apiGet<{ emails: EmailLog[] }>('/emails?limit=100'),
      ]);
      setShipments(s.shipments);
      setEmailLogs(m.emails);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setSession(EMPTY_SESSION); // session expired
      else if (!(e instanceof ApiError && e.code === 'MUST_CHANGE_PASSWORD')) console.error('Failed to load staff data', errorMessage(e));
    }
  }, []);

  const refreshEmails = useCallback(async () => {
    try {
      const m = await apiGet<{ emails: EmailLog[] }>('/emails?limit=100');
      setEmailLogs(m.emails);
    } catch {
      /* non-fatal */
    }
  }, []);

  const mustChangePassword = Boolean(session.user?.mustChangePassword);

  useEffect(() => {
    if (!session.isAuthenticated || mustChangePassword) {
      setShipments([]);
      setEmailLogs([]);
      return;
    }
    loadStaffData();
    const timer = setInterval(loadStaffData, STAFF_REFRESH_MS);
    return () => clearInterval(timer);
  }, [session.isAuthenticated, mustChangePassword, loadStaffData]);

  // Hash route management for URL separation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase().replace('#/', '').replace('#', '');
      const params = new URLSearchParams(window.location.search);

      if (hash === 'admin' || hash === 'staff' || params.get('portal') === 'admin') {
        setActiveTab('admin');
      } else if (hash === 'calculator' || hash === 'quote') {
        setActiveTab('calculator');
      } else if (hash === 'services') {
        setActiveTab('services');
      } else if (hash === 'contact' || hash === 'support') {
        setActiveTab('contact');
      } else if (hash === 'terms' || hash === 'privacy' || hash === 'security') {
        setActiveTab(hash);
      } else if (hash.startsWith('track/')) {
        const trackingNum = decodeURIComponent(hash.replace('track/', '')).toUpperCase();
        setTrackedTrackingNumber(trackingNum);
        setActiveTab('track');
      } else {
        setActiveTab('track');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when tab changes
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    window.location.hash = '#' + (tab === 'track' ? 'track' : tab);
    window.scrollTo({ top: 0 });
  };

  const handleToggleAdmin = () => {
    handleTabChange(activeTab === 'admin' ? 'track' : 'admin');
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setSession({
      user,
      isAuthenticated: true,
      loginTime: new Date().toISOString(),
      expiresAt: null,
    });
  };

  const handleLogout = async () => {
    await logoutUser();
    setSession(EMPTY_SESSION);
  };

  // Actions: the dashboard performs the API call, these keep local state in sync
  const handleAddShipment = (newShipment: Shipment) => {
    setShipments((prev) => [newShipment, ...prev]);
    setTrackedTrackingNumber(newShipment.trackingNumber);
    refreshEmails();
  };

  const handleUpdateShipment = (updatedShipment: Shipment) => {
    setShipments((prev) => prev.map((s) => (s.id === updatedShipment.id ? updatedShipment : s)));
    refreshEmails();
  };

  const handleDeleteShipment = (id: string) => {
    setShipments((prev) => prev.filter((s) => s.id !== id));
  };

  const handleTrackShipment = (trackingNumber: string) => {
    setTrackedTrackingNumber(trackingNumber);
    handleTabChange('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribeEmail = async (trackingNumber: string, email: string) => {
    await apiPost(`/track/${encodeURIComponent(trackingNumber)}/subscribe`, { email });
  };

  const handleClearEmailLogs = async () => {
    if (session.user?.role !== 'admin') {
      alert('Only administrators can clear the email log.');
      return;
    }
    if (!confirm('Permanently delete all logged emails?')) return;
    try {
      await apiDelete('/emails');
      setEmailLogs([]);
    } catch (e) {
      alert(errorMessage(e));
    }
  };

  const isAdminMode = activeTab === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        emailCount={emailLogs.length}
        onOpenMailbox={() => setIsMailboxOpen(true)}
        onToggleAdmin={handleToggleAdmin}
        isAdminMode={isAdminMode}
        session={session}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Active Portal Breadcrumb */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold text-slate-500">
            {isAdminMode ? (
              <span className="flex items-center gap-1.5 text-blue-800">
                <span className="w-2 h-2 rounded-full bg-blue-700"></span>
                {session.isAuthenticated && session.user ? (
                  <>
                    <span>Authorized Terminal:</span>
                    <strong className="text-slate-900">{session.user.name}</strong>
                    <span className="text-slate-400 font-mono">({session.user.badgeNumber})</span>
                  </>
                ) : (
                  <span>Personnel Access Gateway &bull; Restrictive Operational Clearance</span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Public Consignment Tracking Portal
              </span>
            )}
          </div>
        </div>

        {activeTab === 'track' && (
          <TrackingView
            initialTrackingNumber={trackedTrackingNumber}
            onViewWaybill={(shp) => setSelectedWaybillShipment(shp)}
            onSubscribeEmail={handleSubscribeEmail}
          />
        )}

        {activeTab === 'admin' && (
          !authChecked ? (
            <div className="p-10 text-center text-sm text-slate-500" role="status">Checking session&hellip;</div>
          ) : session.isAuthenticated && session.user ? (
            <AdminDashboard
              shipments={shipments}
              emailLogs={emailLogs}
              currentUser={session.user}
              onLogout={handleLogout}
              onAddShipment={handleAddShipment}
              onUpdateShipment={handleUpdateShipment}
              onDeleteShipment={handleDeleteShipment}
              onViewWaybill={(shp) => setSelectedWaybillShipment(shp)}
              onTrackShipment={handleTrackShipment}
              onOpenMailbox={() => setIsMailboxOpen(true)}
            />
          ) : (
            <AdminAuthGate
              onAuthenticated={handleLoginSuccess}
              onCancel={() => handleTabChange('track')}
            />
          )
        )}

        {activeTab === 'calculator' && <RateCalculator />}

        {activeTab === 'services' && <GlobalServices />}

        {activeTab === 'contact' && <ContactPage />}

        {(activeTab === 'terms' || activeTab === 'privacy' || activeTab === 'security') && <LegalPages page={activeTab} />}
      </main>

      {/* Modals */}
      {selectedWaybillShipment && (
        <AirWaybillModal
          shipment={selectedWaybillShipment}
          onClose={() => setSelectedWaybillShipment(null)}
        />
      )}

      {isMailboxOpen && (
        <CustomerMailboxModal
          emailLogs={emailLogs}
          onClose={() => setIsMailboxOpen(false)}
          onClearLogs={handleClearEmailLogs}
        />
      )}

      {session.isAuthenticated && mustChangePassword && (
        <ChangePasswordModal
          forced
          onDone={() => setSession((prev) => (prev.user ? { ...prev, user: { ...prev.user, mustChangePassword: false } } : prev))}
        />
      )}

      {/* Footer */}
      <Footer onNavigate={handleTabChange} onToggleAdmin={handleToggleAdmin} isAdminMode={isAdminMode} />
    </div>
  );
}
