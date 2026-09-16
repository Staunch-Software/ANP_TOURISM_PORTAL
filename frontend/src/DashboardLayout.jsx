import React from 'react';
import { Outlet } from 'react-router-dom';

/** Dashboards render their own Shell (sidebar + topbar), so no site chrome here. */
export default function DashboardLayout() {
  return <main><Outlet /></main>;
