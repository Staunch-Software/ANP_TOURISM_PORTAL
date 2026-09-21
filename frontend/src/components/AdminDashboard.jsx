import React, { useState, useEffect } from 'react';
import API from '../api/client';
import {
  ShieldCheck, TrendingUp, Users, DollarSign, Download,
  Ship, CloudRain, CheckCircle2, FileSpreadsheet, RefreshCw, Sliders,
  UserPlus, ShieldAlert, MapPin, KeyRound, Trash2, Plus, ClipboardCheck,
  GraduationCap, Eye, X, LayoutDashboard, ClipboardList, ScanLine, Anchor, UserCog,
  BarChart3, Bell, BellRing
} from 'lucide-react';
import { DashboardSidebar } from './DashboardSidebar';
import { StaffGateScanner } from './StaffGateScanner';

// Each admin function lives on its own screen instead of one long
// scrolling page — an admin working on, say, slot capacity shouldn't
// have to scroll past gate provisioning and group-booking rosters to
// get there, and shouldn't be shown all of it just because they logged
// in as ADMIN. Grouped to match the single unified sidebar shell shared
// with the Ferry Operator/Activity Vendor dashboards.
const ADMIN_SECTION_GROUPS = [
  {
    label: 'Overview',
    items: [
      { key: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
      { key: 'ANALYTICS', label: 'Analytics & Trends', icon: BarChart3 },
      { key: 'ALERTS', label: 'Alerts & Fraud Watch', icon: BellRing },
    ],
  },
  {
    label: 'Operations',
    items: [
      { key: 'ROSTER', label: 'Ferry Roster', icon: Anchor },
      { key: 'MANIFEST', label: 'Harbor Manifest', icon: FileSpreadsheet },
      { key: 'REPORTS', label: 'Validated Tickets', icon: ClipboardList },
      { key: 'CAPACITY', label: 'Crowd & Capacity', icon: Sliders },
      { key: 'GATE_SCANNER', label: 'Gate Scanner', icon: ScanLine },
      { key: 'GATES', label: 'Gate / LPU Sites', icon: MapPin },
    ],
  },
  {
    label: 'Management',
    items: [
      { key: 'USERS', label: 'User Management', icon: Users },
      { key: 'APPROVALS', label: 'Service Providers', icon: UserPlus },
      { key: 'GROUPS', label: 'Group Bookings', icon: GraduationCap },
    ],
  },
];

export function AdminDashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState('OVERVIEW');
  const [revenueData, setRevenueData] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [manifestData, setManifestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Daily Validated-Tickets Report (RFP p.29, section 7.2.1.9 item 9) --
  // fleet-wide, sourced from every LPU's real-time check-in pushes.
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportRows, setReportRows] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportDownloading, setReportDownloading] = useState(false);

  // Slot Management State (RFP Page 30)
  const [attractions, setAttractions] = useState([]);
  const [selectedAttractionId, setSelectedAttractionId] = useState('');
  const [attractionSlots, setAttractionSlots] = useState([]);
  const [expandingSlotId, setExpandingSlotId] = useState(null);

  // User Management & RBAC State (RFP Clause 7.2.1-III, Page 30)
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);

  // Direct User Creation (Path B) & Operator Application Approvals (Path A)
  // — RFP Clauses 7.2.1-1, 7.2.1-7, 7.2.1-III/IV
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('OPERATOR');
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserMessage, setCreateUserMessage] = useState(null);

  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [decidingApplicationId, setDecidingApplicationId] = useState(null);

  // Group Booking Approval Queue (RFP Page 26)
  const [groupBookings, setGroupBookings] = useState([]);
  const [groupBookingsLoading, setGroupBookingsLoading] = useState(false);
  const [decidingGroupId, setDecidingGroupId] = useState(null);
  const [rosterPreview, setRosterPreview] = useState(null); // the group booking whose roster is being viewed

  // Ferry Roster System (RFP Page 21, Section 6 Item 2) — the daily vessel
  // duty roster and its voyage lifecycle, distinct from the tourist-facing
  // ferry search (which only ever sees SCHEDULED sailings).
  const [ferryRosterDate, setFerryRosterDate] = useState(new Date().toISOString().split('T')[0]);
  const [ferryRoster, setFerryRoster] = useState([]);
  const [ferryRosterLoading, setFerryRosterLoading] = useState(false);
  const [vessels, setVessels] = useState([]);
  const [transitioningScheduleId, setTransitioningScheduleId] = useState(null);
  const [isAssignFormOpen, setIsAssignFormOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    vessel_id: '', source_port: 'PORT_BLAIR', destination_port: 'HAVELOCK',
    departure_date: new Date().toISOString().split('T')[0], departure_time: '08:00', captain_name: '',
  });
  const [assigningRoster, setAssigningRoster] = useState(false);
  const [rosterMessage, setRosterMessage] = useState(null);

  // Analytics & Trend Dashboard (RFP p.24; scored 10 marks in Technical
  // Evaluation Criteria) — real GROUP BY aggregates, not fabricated data.
  const [analyticsDays, setAnalyticsDays] = useState(14);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Fraud & Compliance Alerts (RFP Group Bookings Clause V) — surfaces the
  // AdminAlert rows the backend already writes (e.g. repeat-booking fraud
  // flags) that previously had no UI anywhere to view or resolve them.
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [includeResolvedAlerts, setIncludeResolvedAlerts] = useState(false);
  const [resolvingAlertId, setResolvingAlertId] = useState(null);

  const fetchGroupBookings = async () => {
    setGroupBookingsLoading(true);
    try {
      const res = await API.get('/admin/group-bookings?request_status=PENDING_APPROVAL');
      setGroupBookings(res.data);
    } catch (err) {
      console.error("Failed to load group booking requests", err);
    } finally {
      setGroupBookingsLoading(false);
    }
  };

  const handleApproveGroupBooking = async (requestId) => {
    setDecidingGroupId(requestId);
    try {
      const res = await API.post(`/admin/group-bookings/${requestId}/approve`, { reason: 'Roster and documents verified by Directorate' });
      alert(`Approved. Order ${res.data.order_ref} created — awaiting payment from the organizer.`);
      fetchGroupBookings();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve group booking');
    } finally {
      setDecidingGroupId(null);
    }
  };

  const handleRejectGroupBooking = async (requestId) => {
    const reason = window.prompt('Reason for rejection (shown to the organizer):', 'Roster details could not be verified');
    if (reason === null) return;
    setDecidingGroupId(requestId);
    try {
      await API.post(`/admin/group-bookings/${requestId}/reject`, { reason });
      fetchGroupBookings();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reject group booking');
    } finally {
      setDecidingGroupId(null);
    }
  };

  // Gate / LPU Site Provisioning -- select a site first, everything below
  // (services it serves, staff who can log into that LPU) is scoped to it.
  const [gates, setGates] = useState([]);
  const [gatesLoading, setGatesLoading] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState('');

  const [newGateSiteId, setNewGateSiteId] = useState('');
  const [newGateName, setNewGateName] = useState('');
  const [creatingGate, setCreatingGate] = useState(false);
  const [gateMessage, setGateMessage] = useState(null);

  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceAttractionId, setNewServiceAttractionId] = useState('');
  const [assigningService, setAssigningService] = useState(false);

  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffFullName, setNewStaffFullName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('GATEKEEPER');
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);

  useEffect(() => {
    fetchMISData();
    fetchSchedules();
    fetchAttractionsList();
    fetchUsers();
    fetchApplications();
    fetchGates();
    fetchValidatedTicketsReport(reportDate);
    fetchGroupBookings();
    fetchVessels();
  }, []);

  useEffect(() => {
    fetchFerryRoster(ferryRosterDate);
  }, [ferryRosterDate]);

  useEffect(() => {
    fetchAnalytics(analyticsDays);
  }, [analyticsDays]);

  useEffect(() => {
    fetchAlerts(includeResolvedAlerts);
  }, [includeResolvedAlerts]);

  const fetchAnalytics = async (days) => {
    setAnalyticsLoading(true);
    try {
      const res = await API.get(`/admin/analytics?days=${days}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchAlerts = async (includeResolved) => {
    setAlertsLoading(true);
    try {
      const res = await API.get(`/admin/alerts?include_resolved=${includeResolved}`);
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to load alerts', err);
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  };

  const handleResolveAlert = async (alertId) => {
    setResolvingAlertId(alertId);
    try {
      await API.post(`/admin/alerts/${alertId}/resolve`);
      fetchAlerts(includeResolvedAlerts);
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not resolve alert');
    } finally {
      setResolvingAlertId(null);
    }
  };

  const fetchVessels = async () => {
    try {
      const res = await API.get('/admin/vessels');
      setVessels(res.data);
      if (res.data.length > 0) {
        setAssignForm((f) => ({ ...f, vessel_id: f.vessel_id || res.data[0].vessel_id }));
      }
    } catch (err) {
      console.error('Failed to load vessels', err);
    }
  };

  const fetchFerryRoster = async (rosterDate) => {
    setFerryRosterLoading(true);
    try {
      const res = await API.get(`/admin/ferry-roster?roster_date=${rosterDate}`);
      setFerryRoster(res.data);
    } catch (err) {
      console.error('Failed to load ferry roster', err);
      setFerryRoster([]);
    } finally {
      setFerryRosterLoading(false);
    }
  };

  const handleRosterTransition = async (scheduleId, nextStatus) => {
    setTransitioningScheduleId(scheduleId);
    setRosterMessage(null);
    try {
      await API.patch(`/admin/ferry-roster/${scheduleId}/status`, { status: nextStatus });
      fetchFerryRoster(ferryRosterDate);
    } catch (err) {
      setRosterMessage({ type: 'error', text: err.response?.data?.detail || 'Could not update voyage status' });
    } finally {
      setTransitioningScheduleId(null);
    }
  };

  const handleAssignRoster = async (e) => {
    e.preventDefault();
    setAssigningRoster(true);
    setRosterMessage(null);
    try {
      await API.post('/admin/ferry-roster/assign', assignForm);
      setRosterMessage({ type: 'success', text: 'Sailing added to the daily roster.' });
      setIsAssignFormOpen(false);
      fetchFerryRoster(ferryRosterDate);
    } catch (err) {
      setRosterMessage({ type: 'error', text: err.response?.data?.detail || 'Could not assign sailing' });
    } finally {
      setAssigningRoster(false);
    }
  };

  // Each roster status's single next action — mirrors the backend's
  // ROSTER_STATUS_FLOW so the UI never offers a transition the API would
  // reject anyway.
  const ROSTER_NEXT_ACTION = {
    SCHEDULED: { next: 'BOARDING', label: 'Open Boarding' },
    BOARDING: { next: 'CAST_OFF', label: 'Cast Off (Sailed)' },
    CAST_OFF: { next: 'BERTHED', label: 'Mark Berthed' },
  };

  useEffect(() => {
    if (selectedSiteId) fetchStaffForGate(selectedSiteId);
    else setStaffList([]);
  }, [selectedSiteId]);

  const fetchGates = async () => {
    setGatesLoading(true);
    try {
      const res = await API.get('/admin/gates');
      setGates(res.data);
      if (!selectedSiteId && res.data.length > 0) setSelectedSiteId(res.data[0].site_id);
    } catch (err) {
      console.error('Failed to load gates', err);
    } finally {
      setGatesLoading(false);
    }
  };

  const fetchStaffForGate = async (siteId) => {
    setStaffLoading(true);
    try {
      const res = await API.get(`/admin/gates/${siteId}/staff`);
      setStaffList(res.data);
    } catch (err) {
      console.error('Failed to load staff', err);
    } finally {
      setStaffLoading(false);
    }
  };

  const handleCreateGate = async (e) => {
    e.preventDefault();
    setCreatingGate(true);
    setGateMessage(null);
    try {
      const res = await API.post('/admin/gates', { site_id: newGateSiteId.trim(), name: newGateName.trim() });
      setGateMessage({ type: 'SUCCESS', text: `Gate '${res.data.site_id}' provisioned. Put SITE_ID=${res.data.site_id} in that LPU device's .env before starting it.` });
      setNewGateSiteId('');
      setNewGateName('');
      await fetchGates();
      setSelectedSiteId(res.data.site_id);
    } catch (err) {
      setGateMessage({ type: 'ERROR', text: err.response?.data?.detail || 'Failed to create gate' });
    } finally {
      setCreatingGate(false);
    }
  };

  const handleAssignService = async (e) => {
    e.preventDefault();
    if (!selectedSiteId) return;
    setAssigningService(true);
    try {
      const res = await API.post(`/admin/gates/${selectedSiteId}/services`, {
        title: newServiceTitle.trim(),
        attraction_id: newServiceAttractionId || null,
      });
      setGates((prev) => prev.map((g) => (g.site_id === selectedSiteId ? res.data : g)));
      setNewServiceTitle('');
      setNewServiceAttractionId('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign service');
    } finally {
      setAssigningService(false);
    }
  };

  const handleUnassignService = async (serviceId) => {
    try {
      const res = await API.delete(`/admin/gates/${selectedSiteId}/services/${serviceId}`);
      setGates((prev) => prev.map((g) => (g.site_id === selectedSiteId ? res.data : g)));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove service');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!selectedSiteId) return;
    setCreatingStaff(true);
    try {
      await API.post(`/admin/gates/${selectedSiteId}/staff`, {
        username: newStaffUsername.trim(),
        password: newStaffPassword,
        full_name: newStaffFullName.trim(),
        role: newStaffRole,
      });
      setNewStaffUsername('');
      setNewStaffPassword('');
      setNewStaffFullName('');
      setNewStaffRole('GATEKEEPER');
      fetchStaffForGate(selectedSiteId);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create staff account');
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleDeleteStaff = async (staffId, username) => {
    if (!window.confirm(`Remove '${username}'? They'll be deleted from the LPU on its next sync.`)) return;
    try {
      await API.delete(`/admin/gates/${selectedSiteId}/staff/${staffId}`);
      fetchStaffForGate(selectedSiteId);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove staff account');
    }
  };

  const selectedGate = gates.find((g) => g.site_id === selectedSiteId) || null;

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    try {
      const res = await API.get('/admin/operator-applications?application_status=PENDING');
      setApplications(res.data);
    } catch (err) {
      console.error("Failed to load operator applications", err);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleDirectCreateUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    setCreateUserMessage(null);
    try {
      const res = await API.post('/admin/users/create', {
        phone_number: newPhone,
        full_name: newName,
        email: newEmail || null,
        role: newRole,
      });
      setCreateUserMessage({ type: 'SUCCESS', text: `${res.data.full_name} (${res.data.phone_number}) provisioned as ${res.data.role}.` });
      setNewPhone('');
      setNewName('');
      setNewEmail('');
      setNewRole('OPERATOR');
      fetchUsers();
    } catch (err) {
      setCreateUserMessage({ type: 'ERROR', text: err.response?.data?.detail || 'Failed to create user' });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleApproveApplication = async (applicationId) => {
    setDecidingApplicationId(applicationId);
    try {
      await API.post(`/admin/operator-applications/${applicationId}/approve`, { reason: 'Documents verified by Directorate' });
      fetchApplications();
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve application');
    } finally {
      setDecidingApplicationId(null);
    }
  };

  const handleRejectApplication = async (applicationId) => {
    const reason = window.prompt('Reason for rejection (shown to the applicant):', 'Documents could not be verified');
    if (reason === null) return;
    setDecidingApplicationId(applicationId);
    try {
      await API.post(`/admin/operator-applications/${applicationId}/reject`, { reason });
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reject application');
    } finally {
      setDecidingApplicationId(null);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setSavingUserId(userId);
    try {
      const res = await API.patch(`/admin/users/${userId}`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? res.data : u)));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update role");
    } finally {
      setSavingUserId(null);
    }
  };

  const handleToggleActive = async (userId, nextActive) => {
    setSavingUserId(userId);
    try {
      const res = await API.patch(`/admin/users/${userId}`, { is_active: nextActive });
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? res.data : u)));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update account status");
    } finally {
      setSavingUserId(null);
    }
  };

  const fetchMISData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/revenue-mis');
      setRevenueData(res.data);
    } catch (err) {
      console.error("Failed to fetch revenue MIS", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await API.get(`/ferry/schedules?source_port=PORT_BLAIR&destination_port=HAVELOCK&travel_date=${today}`);
      setSchedules(res.data);
      if (res.data.length > 0) {
        setSelectedScheduleId(res.data[0].schedule_id);
        fetchManifest(res.data[0].schedule_id);
      }
    } catch (err) {
      console.error("Failed to load schedules", err);
    }
  };

  const fetchAttractionsList = async () => {
    try {
      const res = await API.get('/attractions');
      setAttractions(res.data);
      if (res.data.length > 0) {
        setSelectedAttractionId(res.data[0].id);
        fetchSlots(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load attractions", err);
    }
  };

  const fetchSlots = async (attractionId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await API.get(`/attractions/${attractionId}/slots?target_date=${today}`);
      setAttractionSlots(res.data);
    } catch (err) {
      console.error("Failed to load slots", err);
    }
  };

  const handleIncreaseQuota = async (slot, increment) => {
    const newTotal = slot.total_capacity + increment;
    setExpandingSlotId(slot.slot_id);
    try {
      await API.patch(`/admin/slots/${slot.slot_id}/capacity`, {
        new_capacity: newTotal,
        reason: `Peak Rush Expansion (+${increment})`,
      });
      fetchSlots(selectedAttractionId);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update slot capacity");
    } finally {
      setExpandingSlotId(null);
    }
  };

  const fetchManifest = async (scheduleId) => {
    if (!scheduleId) return;
    setManifestLoading(true);
    try {
      const res = await API.get(`/admin/manifest/${scheduleId}`);
      setManifestData(res.data);
    } catch (err) {
      setManifestData(null);
    } finally {
      setManifestLoading(false);
    }
  };

  const handleScheduleChange = (e) => {
    const id = e.target.value;
    setSelectedScheduleId(id);
    fetchManifest(id);
  };

  // Authenticated CSV Download (fixes the missing Authorization header error
  // from window.open, which performs a plain browser navigation with no
  // custom headers and gets rejected by the admin-only endpoint).
  const handleDownloadCSV = async () => {
    if (!selectedScheduleId) return;
    setDownloadingCsv(true);
    try {
      const response = await API.get(`/admin/manifest/${selectedScheduleId}/export-csv`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const vesselName = manifestData?.vessel_name?.replace(/\s+/g, '_') || 'Vessel';
      link.setAttribute('download', `PMB_Manifest_${vesselName}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV download error", err);
      alert("Failed to export PMB CSV. Check if you are logged in as Admin.");
    } finally {
      setDownloadingCsv(false);
    }
  };

  const fetchValidatedTicketsReport = async (date) => {
    setReportLoading(true);
    try {
      const res = await API.get(`/admin/reports/validated-tickets?date=${date}`);
      setReportRows(res.data);
    } catch (err) {
      console.error("Failed to load validated-tickets report", err);
      setReportRows([]);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadValidatedTicketsCSV = async () => {
    setReportDownloading(true);
    try {
      const response = await API.get(`/admin/reports/validated-tickets.csv?date=${reportDate}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ANIIDCO_validated_tickets_${reportDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Validated-tickets CSV download error", err);
      alert("Failed to export the validated-tickets report.");
    } finally {
      setReportDownloading(false);
    }
  };

  const handleEmergencyHalt = async () => {
    if (!selectedScheduleId) return;
    if (!window.confirm("CONFIRM EMERGENCY WEATHER HALT: This will cancel the selected ferry departure and trigger 100% automated refunds under Force Majeure.")) return;

    try {
      const res = await API.post('/admin/emergency-throttle', {
        schedule_id: selectedScheduleId,
        action: 'CANCEL_WEATHER',
        reason: 'IMD Squally Monsoon Warning (Force 6 Gale)'
      });

      setActionMessage({
        type: 'SUCCESS',
        text: res.data.message || 'Sailing suspended. Automated refunds initiated.'
      });
      fetchSchedules();
    } catch (err) {
      alert("Failed to issue emergency throttle");
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-lg font-black text-navy-800">Restricted Access</h3>
        <p className="text-xs text-slate-500 mt-1">
          This dashboard requires Administrator or Directorate of Tourism privileges.
        </p>
      </div>
    );
  }

  return (
    <>
    <div className="w-full">
      <DashboardSidebar
        portalLabel="Admin MIS"
        portalIcon={ShieldCheck}
        groups={ADMIN_SECTION_GROUPS}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        user={user}
        onLogout={onLogout}
      />

      <div className="md:ml-64 min-w-0 p-4 md:p-6 space-y-8 max-w-7xl">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> ANIIDCO Directorate &amp; Regulatory Authority
          </div>
          <h2 className="font-serif text-2xl font-black text-navy-800">Government MIS &amp; Harbor Oversight</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time financial reconciliation, Port Management Board (PMB) passenger manifests, and crowd slot controls.
          </p>
        </div>

        <button
          onClick={fetchMISData}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-navy-800 flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Metrics
        </button>
      </div>

      {activeSection === 'OVERVIEW' && (
      <>
      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Treasury Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-black text-navy-800 font-mono">
            ₹{revenueData ? revenueData.total_revenue_inr.toLocaleString('en-IN') : '0.00'}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">Reconciled via Bank Gateway</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Confirmed Passes</span>
            <div className="p-2 bg-cyan-50 text-cyan-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-black text-navy-800 font-mono">
            {revenueData ? revenueData.total_tickets_issued : 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Turnstile-ready Ed25519 tokens</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Heritage &amp; Monuments</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-black text-navy-800 font-mono">
            ₹{revenueData ? revenueData.monument_revenue_inr.toLocaleString('en-IN') : '0.00'}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Cellular Jail &amp; Museums</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Ferry Operations</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-black text-navy-800 font-mono">
            ₹{revenueData ? revenueData.ferry_revenue_inr.toLocaleString('en-IN') : '0.00'}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Inter-island catamarans</p>
        </div>
      </div>
      </>
      )}

      {activeSection === 'ANALYTICS' && (
      <>
      {/* Analytics & Trend Dashboard — RFP p.24: "integrate Analytics
          modules and dashboards for trend analysis... decision-making
          support for authorities." Every figure is a real GROUP BY over
          confirmed orders for the selected range, not a static snapshot. */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">
              Decision Support
            </span>
            <h3 className="font-serif text-lg font-black text-navy-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-600" /> Revenue Trends &amp; Analytics
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live aggregates from confirmed bookings — no simulated figures.
            </p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setAnalyticsDays(d)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                  analyticsDays === d ? 'bg-navy-800 text-white' : 'text-slate-500 hover:text-navy-800'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>

        {analyticsLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading analytics...</div>
        ) : !analytics || analytics.daily_trend.every((d) => d.orders_count === 0) ? (
          <div className="text-center py-14 flex flex-col items-center gap-2">
            <BarChart3 className="w-9 h-9 text-slate-300" />
            <p className="text-xs text-slate-400">No confirmed bookings in this date range yet.</p>
          </div>
        ) : (
          <>
            {/* Daily Revenue Trend — hand-rolled bar chart, no charting
                dependency needed for a straightforward trend line. */}
            <div>
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                Daily Revenue Trend ({analytics.range_start} to {analytics.range_end})
              </h4>
              <div className="flex items-end gap-1.5 h-40 border-b border-slate-200 pb-1">
                {(() => {
                  const maxRev = Math.max(...analytics.daily_trend.map((d) => d.revenue_inr), 1);
                  return analytics.daily_trend.map((d) => (
                    <div key={d.trend_date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-navy-800 bg-white border border-slate-200 rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                        ₹{d.revenue_inr.toLocaleString('en-IN')} ({d.orders_count})
                      </div>
                      <div
                        className={`w-full rounded-t transition-all ${d.revenue_inr > 0 ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-100'}`}
                        style={{ height: `${Math.max((d.revenue_inr / maxRev) * 100, 2)}%` }}
                      ></div>
                    </div>
                  ));
                })()}
              </div>
              <div className="flex gap-1.5 mt-1.5">
                {analytics.daily_trend.map((d) => (
                  <div key={d.trend_date} className="flex-1 text-center text-[9px] font-mono text-slate-400 truncate">
                    {d.trend_date.slice(5)}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Revenue by Category</h4>
                <div className="space-y-3">
                  {(() => {
                    const maxCat = Math.max(...analytics.category_breakdown.map((c) => c.revenue_inr), 1);
                    return analytics.category_breakdown.map((c) => (
                      <div key={c.item_type}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold text-navy-800">{c.item_type === 'ATTRACTION' ? 'Attractions' : 'Ferry'}</span>
                          <span className="font-mono text-slate-500">₹{c.revenue_inr.toLocaleString('en-IN')} · {c.bookings_count} bookings</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${c.item_type === 'ATTRACTION' ? 'bg-teal-600' : 'bg-cyan-600'}`}
                            style={{ width: `${(c.revenue_inr / maxCat) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Top Attractions/Routes */}
              <div>
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Top Performing Listings</h4>
                <div className="space-y-2">
                  {analytics.top_attractions.map((t, idx) => (
                    <div key={t.title} className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-navy-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                        <span className="text-xs font-bold text-navy-800 truncate">{t.title}</span>
                      </div>
                      <span className="text-xs font-mono text-cyan-700 font-bold shrink-0">₹{t.revenue_inr.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      </>
      )}

      {activeSection === 'ALERTS' && (
      <>
      {/* Fraud & Compliance Alerts — RFP Group Bookings Clause V. The
          backend already writes these (e.g. repeat-booking fraud flags
          from payments.py); this is simply the first UI to ever surface
          them for an admin to see and resolve. */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700">
              Fraud &amp; Compliance
            </span>
            <h3 className="font-serif text-lg font-black text-navy-800 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-amber-600" /> System Alerts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated flags — e.g. the same Govt ID booking one attraction repeatedly within a short window.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={includeResolvedAlerts}
              onChange={(e) => setIncludeResolvedAlerts(e.target.checked)}
              className="rounded"
            />
            Show resolved
          </label>
        </div>

        {alertsLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-14 flex flex-col items-center gap-2">
            <Bell className="w-9 h-9 text-slate-300" />
            <p className="text-xs text-slate-400">
              {includeResolvedAlerts ? 'No alerts have ever been raised.' : 'No unresolved alerts right now.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.map((a) => (
              <div
                key={a.alert_id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  a.is_resolved ? 'bg-slate-50 border-slate-200' : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.is_resolved ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {a.alert_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{new Date(a.created_at).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-xs text-navy-800">{a.message}</p>
                </div>
                {!a.is_resolved && (
                  <button
                    onClick={() => handleResolveAlert(a.alert_id)}
                    disabled={resolvingAlertId === a.alert_id}
                    className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white font-bold text-xs rounded-lg disabled:opacity-50 shrink-0"
                  >
                    {resolvingAlertId === a.alert_id ? 'Resolving...' : 'Mark Resolved'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}

      {activeSection === 'ROSTER' && (
      <>
      {/* Ferry Roster System — RFP Page 21, Section 6 Item 2: "Roaster
          system of Ferry Management System (Boat services)". The daily
          vessel duty roster and its voyage lifecycle, distinct from the
          tourist-facing route search. */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">
              Maritime Duty Roster
            </span>
            <h3 className="font-serif text-lg font-black text-navy-800 flex items-center gap-2">
              <Anchor className="w-5 h-5 text-cyan-600" /> Ferry Fleet Roster &amp; Voyage Lifecycle
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign vessels to daily sailings, and step each voyage through Boarding → Cast Off → Berthed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={ferryRosterDate}
              onChange={(e) => setFerryRosterDate(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-navy-800"
            />
            <button
              type="button"
              onClick={() => setIsAssignFormOpen((v) => !v)}
              className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white font-bold text-xs rounded-lg flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" /> Assign Sailing
            </button>
          </div>
        </div>

        {rosterMessage && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            rosterMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {rosterMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
            {rosterMessage.text}
          </div>
        )}

        {isAssignFormOpen && (
          <form onSubmit={handleAssignRoster} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Vessel</label>
              <select
                value={assignForm.vessel_id}
                onChange={(e) => setAssignForm((f) => ({ ...f, vessel_id: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                required
              >
                {vessels.map((v) => (
                  <option key={v.vessel_id} value={v.vessel_id}>{v.name} ({v.operator_name})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Captain / Master</label>
              <input
                type="text"
                placeholder="e.g. Capt. Rajesh Kumar"
                value={assignForm.captain_name}
                onChange={(e) => setAssignForm((f) => ({ ...f, captain_name: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">From</label>
                <select
                  value={assignForm.source_port}
                  onChange={(e) => setAssignForm((f) => ({ ...f, source_port: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                >
                  <option value="PORT_BLAIR">Port Blair</option>
                  <option value="HAVELOCK">Havelock</option>
                  <option value="NEIL">Neil</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">To</label>
                <select
                  value={assignForm.destination_port}
                  onChange={(e) => setAssignForm((f) => ({ ...f, destination_port: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                >
                  <option value="PORT_BLAIR">Port Blair</option>
                  <option value="HAVELOCK">Havelock</option>
                  <option value="NEIL">Neil</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Departure Date</label>
              <input
                type="date"
                value={assignForm.departure_date}
                onChange={(e) => setAssignForm((f) => ({ ...f, departure_date: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Departure Time</label>
              <input
                type="time"
                value={assignForm.departure_time}
                onChange={(e) => setAssignForm((f) => ({ ...f, departure_time: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800 font-mono"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={assigningRoster || !assignForm.vessel_id}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg disabled:opacity-50"
              >
                {assigningRoster ? 'Assigning...' : 'Add to Roster'}
              </button>
            </div>
          </form>
        )}

        {ferryRosterLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading fleet roster...</div>
        ) : ferryRoster.length === 0 ? (
          <div className="text-center py-14 flex flex-col items-center gap-2">
            <Anchor className="w-9 h-9 text-slate-300" />
            <p className="text-xs text-slate-400">No sailings on the roster for {ferryRosterDate}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Vessel</th>
                  <th className="p-3">Captain / Master</th>
                  <th className="p-3">Route</th>
                  <th className="p-3">Departure</th>
                  <th className="p-3">Seats</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ferryRoster.map((r) => {
                  const nextAction = ROSTER_NEXT_ACTION[r.status];
                  const statusColor = {
                    SCHEDULED: 'bg-slate-100 text-slate-600',
                    BOARDING: 'bg-amber-50 text-amber-700 border border-amber-200',
                    CAST_OFF: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
                    BERTHED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                    CANCELLED_WEATHER: 'bg-red-50 text-red-700 border border-red-200',
                  }[r.status] || 'bg-slate-100 text-slate-600';
                  return (
                    <tr key={r.schedule_id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-navy-800">{r.vessel_name}</td>
                      <td className="p-3 text-slate-600">{r.captain_name || '—'}</td>
                      <td className="p-3 font-mono text-slate-500">{r.source_port.replace('_', ' ')} → {r.destination_port.replace('_', ' ')}</td>
                      <td className="p-3 font-mono text-slate-500">{r.departure_time}</td>
                      <td className="p-3 font-mono text-slate-500">{r.booked_seats}/{r.total_seats}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColor}`}>{r.status}</span>
                      </td>
                      <td className="p-3">
                        {nextAction ? (
                          <button
                            onClick={() => handleRosterTransition(r.schedule_id, nextAction.next)}
                            disabled={transitioningScheduleId === r.schedule_id}
                            className="px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-white font-bold text-[11px] rounded-lg disabled:opacity-50 whitespace-nowrap"
                          >
                            {transitioningScheduleId === r.schedule_id ? 'Updating...' : nextAction.label}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">Voyage complete</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {activeSection === 'MANIFEST' && (
      <>
      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* 3. Harbor Passenger Manifest Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">
              Port Management Board (PMB) Clearance
            </span>
            <h3 className="font-serif text-lg font-black text-navy-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-600" /> Maritime Passenger Manifest
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official passenger roster required by Harbor Marine Police prior to vessel cast-off.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Voyage Dropdown */}
            <select
              value={selectedScheduleId}
              onChange={handleScheduleChange}
              className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-navy-800 focus:border-cyan-500 focus:outline-none"
            >
              {schedules.map((s) => (
                <option key={s.schedule_id} value={s.schedule_id}>
                  {s.vessel_name} ({s.departure_time} - {s.source_port} → {s.destination_port})
                </option>
              ))}
            </select>

            {/* Authenticated Download CSV Button */}
            <button
              type="button"
              disabled={downloadingCsv}
              onClick={handleDownloadCSV}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center gap-2 shadow-md transition-all"
            >
              <Download className="w-4 h-4" /> {downloadingCsv ? 'Generating...' : 'Download PMB CSV'}
            </button>

            {/* Emergency Weather Halt Button */}
            <button
              type="button"
              onClick={handleEmergencyHalt}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-lg flex items-center gap-2 transition-colors"
              title="Cancel voyage due to IMD Cyclone Warning"
            >
              <CloudRain className="w-4 h-4" /> Emergency Weather Halt
            </button>
          </div>
        </div>

        {/* Manifest Table */}
        {manifestLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading passenger manifest...</div>
        ) : !manifestData || manifestData.manifest.length === 0 ? (
          <div className="text-center py-14 flex flex-col items-center gap-2">
            <FileSpreadsheet className="w-9 h-9 text-slate-300" />
            <p className="text-xs text-slate-400 max-w-xs">
              No passengers booked on this voyage yet. New ferry bookings will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">S.No</th>
                  <th className="p-3">Seat</th>
                  <th className="p-3">Cabin</th>
                  <th className="p-3">Passenger Name</th>
                  <th className="p-3">Age/Sex</th>
                  <th className="p-3">Govt ID</th>
                  <th className="p-3">Ticket Ref</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {manifestData.manifest.map((p) => (
                  <tr key={p.ticket_ref} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-400">{p.serial_no}</td>
                    <td className="p-3 font-mono font-bold text-cyan-700">{p.seat_number}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        {p.cabin_class}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-navy-800">{p.passenger_name}</td>
                    <td className="p-3 text-slate-500">{p.age} / {p.gender}</td>
                    <td className="p-3 font-mono text-slate-500">{p.id_type}: {p.id_masked_number}</td>
                    <td className="p-3 font-mono text-cyan-700">{p.ticket_ref}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.check_in_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {activeSection === 'REPORTS' && (
      <>
      {/* 3b. Daily Validated-Tickets Report (RFP p.29, section 7.2.1.9
          item 9: "submit a report on a timely basis concerning the
          validated tickets... to inform ANIIDCO"). Fleet-wide, sourced
          from every LPU's real-time check-in pushes -- not a separate
          batch job, just a view over data that's already flowing in. */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">
              RFP Clause 7.2.1.9 Compliance
            </span>
            <h3 className="font-serif text-lg font-black text-navy-800 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-cyan-600" /> Daily Validated-Tickets Report
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Every gate-scan validated across every LPU site on the selected day, with booking reference and site of entry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={reportDate}
              onChange={(e) => {
                setReportDate(e.target.value);
                fetchValidatedTicketsReport(e.target.value);
              }}
              className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-navy-800 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="button"
              disabled={reportDownloading}
              onClick={handleDownloadValidatedTicketsCSV}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> {reportDownloading ? 'Generating...' : 'Download CSV'}
            </button>
          </div>
        </div>

        {reportLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading validated tickets...</div>
        ) : !reportRows || reportRows.length === 0 ? (
          <div className="text-center py-14 flex flex-col items-center gap-2">
            <ClipboardList className="w-9 h-9 text-slate-300" />
            <p className="text-xs text-slate-400">No tickets were validated at any gate on {reportDate}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Checked In At</th>
                  <th className="p-3">Booking Ref</th>
                  <th className="p-3">Attraction / Route</th>
                  <th className="p-3">Passenger</th>
                  <th className="p-3">Site</th>
                  <th className="p-3">Issued By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reportRows.map((r) => (
                  <tr key={r.ticket_ref} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-500">
                      {r.checked_in_at ? new Date(r.checked_in_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="p-3 font-mono font-bold text-cyan-700">{r.booking_ref || r.ticket_ref}</td>
                    <td className="p-3 text-navy-800">{r.title}</td>
                    <td className="p-3 font-bold text-navy-800">{r.passenger_name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 font-mono">
                        {r.site_id || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{r.issued_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {activeSection === 'CAPACITY' && (
      <>
      {/* 4. Live Slot Quota Expansion & Carrying Capacity (RFP Page 30) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">
              Crowd &amp; Carrying Capacity Management
            </span>
            <h3 className="font-serif text-base font-black text-navy-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-600" /> Active Slot Quota &amp; Expansion Controls
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dynamically expand seat allocation when slots are sold out during peak tourist rush.
            </p>
          </div>

          <select
            value={selectedAttractionId}
            onChange={(e) => {
              setSelectedAttractionId(e.target.value);
              fetchSlots(e.target.value);
            }}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-navy-800 focus:border-cyan-500 focus:outline-none"
          >
            {attractions.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {attractionSlots.map((slot) => {
            const isSoldOut = slot.available_seats === 0;
            const isExpanding = expandingSlotId === slot.slot_id;

            return (
              <div
                key={slot.slot_id}
                className={`p-4 rounded-2xl border transition-all ${
                  isSoldOut ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-sm font-mono font-black text-navy-800 block">
                      {slot.start_time} - {slot.end_time}
                    </span>
                    <span className={`text-xs font-bold ${isSoldOut ? 'text-red-600' : 'text-emerald-700'}`}>
                      {slot.available_seats} / {slot.total_capacity} Seats Available
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    isSoldOut
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {isSoldOut ? 'SOLD OUT' : 'OPEN'}
                  </span>
                </div>

                {/* Dynamic Expansion Actions */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">Expand Quota:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={isExpanding}
                      onClick={() => handleIncreaseQuota(slot, 10)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-cyan-700 transition-colors disabled:opacity-50"
                    >
                      +10 Seats
                    </button>
                    <button
                      type="button"
                      disabled={isExpanding}
                      onClick={() => handleIncreaseQuota(slot, 25)}
                      className="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-600 rounded-lg text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
                    >
                      +25 Seats
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}

      {activeSection === 'USERS' && (
      <>
      {/* 5. User Management & Role Control (RFP Clause 7.2.1-III, Page 30) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">
              Role-Based Access Control (RBAC)
            </span>
            <h3 className="font-serif text-base font-black text-navy-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-600" /> System Users &amp; Stakeholder Permissions
            </h3>
            <p className="text-xs text-slate-500">
              Manage permissions for Visitors, Ferry Operators, and Regulatory Staff.
            </p>
          </div>

          <button
            onClick={fetchUsers}
            disabled={usersLoading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-navy-800 flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {usersLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading registered users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Mobile Number</th>
                  <th className="p-3">Full Legal Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Registered</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => {
                  const isSelf = u.user_id === user?.user_id;
                  const isSaving = savingUserId === u.user_id;
                  return (
                    <tr key={u.user_id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-navy-800">{u.phone_number}</td>
                      <td className="p-3 font-bold text-navy-800">{u.full_name}</td>
                      <td className="p-3 text-slate-500">{u.email || '—'}</td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {new Date(u.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          disabled={isSelf || isSaving}
                          onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-navy-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="TOURIST">TOURIST</option>
                          <option value="OPERATOR">OPERATOR</option>
                          <option value="VENDOR">VENDOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td className="p-3">
                        {u.is_active ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">● Active</span>
                        ) : (
                          <span className="text-red-600 font-bold flex items-center gap-1 text-[11px]">● Suspended</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {isSelf ? (
                          <span className="text-slate-400 text-[11px]">Protected (You)</span>
                        ) : (
                          <button
                            disabled={isSaving}
                            onClick={() => handleToggleActive(u.user_id, !u.is_active)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border disabled:opacity-50 ${
                              u.is_active
                                ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {u.is_active ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {activeSection === 'APPROVALS' && (
      <>
      {/* 6. Stakeholder Governance & Service Provider Onboarding
          (RFP Clauses 7.2.1-1, 7.2.1-7, 7.2.1-III/IV, Pages 24, 28, 30-31) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">
            RFP Clause 7.2.1-III Compliance
          </span>
          <h3 className="font-serif text-lg font-black text-navy-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-600" /> Stakeholder Governance &amp; Operator Approvals
          </h3>
          <p className="text-xs text-slate-500">
            Review service provider compliance documents and provision administrative or operational staff directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Path B: Direct Create User */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-navy-800 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-cyan-600" /> Direct User Creation &amp; Role Assignment
            </h4>

            {createUserMessage && (
              <div className={`p-2.5 rounded-lg text-[11px] font-medium ${
                createUserMessage.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {createUserMessage.text}
              </div>
            )}

            <form onSubmit={handleDirectCreateUser} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Mobile Number</label>
                <input
                  type="tel"
                  maxLength="10"
                  placeholder="9876543210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Full Legal Name / Agency Name</label>
                <input
                  type="text"
                  placeholder="e.g. Makruzz Operations Head"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Assigned Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  >
                    <option value="OPERATOR">Ferry Operator</option>
                    <option value="ADMIN">Directorate Admin</option>
                    <option value="VENDOR">Vendor / Counter Staff</option>
                    <option value="TOURIST">Standard Tourist</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Email ID</label>
                  <input
                    type="email"
                    placeholder="ops@makruzz.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={creatingUser}
                className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-xs shadow-md disabled:opacity-50"
              >
                {creatingUser ? 'Provisioning...' : 'Provision User & Assign Role'}
              </button>
            </form>
          </div>

          {/* Path A: Pending Service Provider Applications */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-navy-800 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> Pending Service Provider Approvals
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {applications.length} Pending
              </span>
            </div>

            {applicationsLoading ? (
              <p className="text-xs text-slate-400 text-center py-6">Loading applications...</p>
            ) : applications.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No pending applications right now.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {applications.map((app) => {
                  const isDeciding = decidingApplicationId === app.user_id;
                  return (
                    <div key={app.user_id} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-xs text-navy-800 block">{app.business_name}</strong>
                          <span className="text-[11px] text-slate-500 font-mono">GSTIN: {app.gstin}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          PENDING KYC
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                        <span>License: <strong className="text-navy-800">{app.trade_license_number}</strong></span>
                        <span>Category: <strong className="text-navy-800">{app.service_category?.replace('_', ' ')}</strong></span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Applicant: <strong className="text-navy-800">{app.full_name}</strong> · {app.phone_number} · {app.email}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          disabled={isDeciding}
                          onClick={() => handleApproveApplication(app.user_id)}
                          className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                          {isDeciding ? 'Working...' : 'Approve & Onboard'}
                        </button>
                        <button
                          disabled={isDeciding}
                          onClick={() => handleRejectApplication(app.user_id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      </>
      )}

      {activeSection === 'GATES' && (
      <>
      {/* 7. Gate / LPU Site Provisioning -- select a site first; the
          services it serves and the staff who can log into that LPU are
          both scoped to whichever site is picked below. */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">
              Local Processing Unit (LPU) Fleet
            </span>
            <h3 className="font-serif text-lg font-black text-navy-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-600" /> Gate / Site Provisioning
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Every physical gate/counter device syncs only what's provisioned here for its site_id -- nothing syncs to an unprovisioned site.
            </p>
          </div>
          <button
            onClick={fetchGates}
            disabled={gatesLoading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-navy-800 flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${gatesLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {gateMessage && (
          <div className={`p-2.5 rounded-lg text-[11px] font-medium ${
            gateMessage.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {gateMessage.text}
          </div>
        )}

        {/* Create a new gate */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <h4 className="text-sm font-bold text-navy-800 flex items-center gap-1.5 mb-3">
            <Plus className="w-4 h-4 text-cyan-600" /> Provision a New Site
          </h4>
          <form onSubmit={handleCreateGate} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">site_id (must match that device's .env exactly)</label>
              <input
                type="text"
                placeholder="HAVELOCK_GATE1"
                value={newGateSiteId}
                onChange={(e) => setNewGateSiteId(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800 font-mono"
                required
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Display Name</label>
              <input
                type="text"
                placeholder="Havelock Radhanagar Gate 1"
                value={newGateName}
                onChange={(e) => setNewGateName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                required
              />
            </div>
            <button
              type="submit"
              disabled={creatingGate}
              className="py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-xs shadow-md disabled:opacity-50"
            >
              {creatingGate ? 'Provisioning...' : 'Create Gate'}
            </button>
          </form>
        </div>

        {/* Select a site -- everything below is scoped to this */}
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">Select Site</label>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="w-full sm:w-96 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-navy-800 font-mono focus:border-cyan-500 focus:outline-none"
          >
            {gates.length === 0 && <option value="">No gates provisioned yet</option>}
            {gates.map((g) => (
              <option key={g.site_id} value={g.site_id}>{g.site_id} -- {g.name} ({g.services.length} service{g.services.length === 1 ? '' : 's'})</option>
            ))}
          </select>
        </div>

        {selectedGate && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Services this site serves */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-navy-800">Attractions/Routes served by {selectedGate.site_id}</h4>

              {selectedGate.services.length === 0 ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  No services assigned -- this LPU's ticket sync will return nothing until at least one is added.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {selectedGate.services.map((s) => (
                    <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs">
                      <span className="text-navy-800 font-medium">{s.title}</span>
                      <button onClick={() => handleUnassignService(s.id)} className="text-red-600 hover:text-red-700" title="Remove">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAssignService} className="flex gap-2 pt-2 border-t border-slate-200">
                <select
                  value={newServiceAttractionId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setNewServiceAttractionId(id);
                    const a = attractions.find((x) => x.id === id);
                    if (a) setNewServiceTitle(a.title);
                  }}
                  className="flex-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] text-navy-800"
                >
                  <option value="">Pick an attraction (or type a ferry route below)</option>
                  {attractions.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Exact title to serve"
                  value={newServiceTitle}
                  onChange={(e) => setNewServiceTitle(e.target.value)}
                  className="flex-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] text-navy-800"
                  required
                />
                <button
                  type="submit"
                  disabled={assigningService}
                  className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-[11px] disabled:opacity-50"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Staff (COUNTER/GATEKEEPER) accounts for this site */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-navy-800 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-cyan-600" /> Gate/Counter Staff Logins for {selectedGate.site_id}
              </h4>

              {staffLoading ? (
                <p className="text-xs text-slate-400 text-center py-4">Loading staff...</p>
              ) : staffList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">No staff accounts yet for this site.</p>
              ) : (
                <div className="space-y-1.5">
                  {staffList.map((s) => (
                    <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs">
                      <div>
                        <span className="text-navy-800 font-bold font-mono">{s.username}</span>
                        <span className="text-slate-400 ml-2">{s.full_name}</span>
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">{s.role}</span>
                      </div>
                      <button onClick={() => handleDeleteStaff(s.id, s.username)} className="text-red-600 hover:text-red-700" title="Remove">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="space-y-2 pt-2 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="username"
                    value={newStaffUsername}
                    onChange={(e) => setNewStaffUsername(e.target.value)}
                    className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] text-navy-800 font-mono"
                    required
                  />
                  <input
                    type="password"
                    placeholder="password"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] text-navy-800"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Full name"
                    value={newStaffFullName}
                    onChange={(e) => setNewStaffFullName(e.target.value)}
                    className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] text-navy-800"
                    required
                  />
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] text-navy-800"
                  >
                    <option value="GATEKEEPER">Gatekeeper</option>
                    <option value="COUNTER">Counter</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={creatingStaff}
                  className="w-full py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-[11px] disabled:opacity-50"
                >
                  {creatingStaff ? 'Creating...' : 'Create Staff Login'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {activeSection === 'GROUPS' && (
      <>
      {/* Group / Institutional Booking Approval Queue (RFP Page 26) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">
              RFP Page 26 · Group Bookings
            </span>
            <h3 className="font-serif text-lg font-black text-navy-800 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-cyan-600" /> Group Booking Approval Queue
            </h3>
            <p className="text-xs text-slate-500">
              Schools, colleges, corporates and tour operators submitting a roster-based group application.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              {groupBookings.length} Pending
            </span>
            <button
              onClick={fetchGroupBookings}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {groupBookingsLoading ? (
          <p className="text-xs text-slate-400 text-center py-6">Loading group booking requests...</p>
        ) : groupBookings.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No pending group booking requests right now.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Request Ref</th>
                  <th className="p-2.5">Organization</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Attraction / Slot</th>
                  <th className="p-2.5">Headcount</th>
                  <th className="p-2.5">Contact</th>
                  <th className="p-2.5">Roster</th>
                  <th className="p-2.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupBookings.map((gb) => {
                  const isDeciding = decidingGroupId === gb.id;
                  return (
                    <tr key={gb.id} className="hover:bg-slate-50 align-top">
                      <td className="p-2.5 font-mono text-cyan-700 font-bold">{gb.request_ref}</td>
                      <td className="p-2.5">
                        <strong className="text-navy-800 block">{gb.organization_name}</strong>
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          {gb.organization_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600">
                        {gb.attraction_title}
                        <div className="text-[10px] text-slate-400 font-mono">{gb.slot_date} · {gb.start_time}-{gb.end_time}</div>
                      </td>
                      <td className="p-2.5 font-mono">
                        {gb.total_headcount} total
                        <div className="text-[10px] text-slate-400">{gb.indian_travelers_count} IN / {gb.foreign_travelers_count} FN</div>
                      </td>
                      <td className="p-2.5 text-slate-600">
                        {gb.contact_person}
                        <div className="text-[10px] text-slate-400">{gb.contact_phone}</div>
                      </td>
                      <td className="p-2.5">
                        <button
                          onClick={() => setRosterPreview(gb)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-navy-800 rounded-lg text-[11px] font-bold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                      <td className="p-2.5">
                        <div className="flex flex-col gap-1.5 min-w-[110px]">
                          <button
                            disabled={isDeciding}
                            onClick={() => handleApproveGroupBooking(gb.id)}
                            className="py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold disabled:opacity-50"
                          >
                            {isDeciding ? 'Working...' : 'Approve'}
                          </button>
                          <button
                            disabled={isDeciding}
                            onClick={() => handleRejectGroupBooking(gb.id)}
                            className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-medium disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {activeSection === 'GATE_SCANNER' && (
        <StaffGateScanner user={user} />
      )}

        </div>
      </div>

      {/* Roster Preview Modal — a global overlay, not tied to any one section */}
      {rosterPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setRosterPreview(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-navy-800 p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest">{rosterPreview.request_ref}</span>
            <h3 className="font-serif text-lg font-black text-navy-800 mb-1">{rosterPreview.organization_name} — Passenger Roster</h3>
            <p className="text-xs text-slate-500 mb-4">
              {rosterPreview.attraction_title} · {rosterPreview.slot_date} ({rosterPreview.start_time}-{rosterPreview.end_time})
            </p>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Age/Gender</th>
                  <th className="p-2">Nationality</th>
                  <th className="p-2">Govt ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rosterPreview.roster.map((m, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-2 font-bold text-navy-800">{m.full_name}</td>
                    <td className="p-2 text-slate-600">{m.age} / {m.gender}</td>
                    <td className="p-2 text-slate-600">{m.nationality}</td>
                    <td className="p-2 font-mono text-slate-500">{m.id_type}: {m.id_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
