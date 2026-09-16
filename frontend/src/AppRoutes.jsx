import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';

import { Home } from '../pages/Home';
import { Explore } from '../pages/Explore';
import { Experiences } from '../pages/Experiences';
import { Detail } from '../pages/AttractionDetails';
import { Plan } from '../pages/PlanTrip';
import { Ferry } from '../pages/Ferry';
import { Group } from '../pages/GroupBooking';
import { Cart } from '../pages/Cart';
import { Booking } from '../pages/Booking';
import { Payment } from '../pages/Payment';
import { Confirm } from '../pages/Confirmation';
import { Help } from '../pages/Help';
import { About } from '../pages/About';

import { RoleSelect } from '../pages/auth/RoleSelect';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';

import { TouristDash } from '../pages/dashboards/TouristDashboard';
import { ProviderDash } from '../pages/dashboards/ProviderDashboard';
import { AgencyDash } from '../pages/dashboards/AgencyDashboard';
import { AdminDash } from '../pages/dashboards/AdminDashboard';

import { useApp } from '../context/AppContext';
import { ATTR } from '../services/data';

/** /detail and /booking receive their attraction through context; fall back on deep links. */
const DetailRoute = () => {const { param } = useApp();return <Detail a={param || ATTR[0]} />;};
const BookingRoute = () => {const { param } = useApp();return <Booking a={param || ATTR[0]} />;};

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/experiences" element={<Experiences />} />
        <Route path="/detail" element={<DetailRoute />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/ferry" element={<Ferry />} />
        <Route path="/group" element={<Group />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/booking" element={<BookingRoute />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/confirm" element={<Confirm />} />
        <Route path="/help" element={<Help />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<RoleSelect />} />
        <Route path="/login-tourist" element={<Login role="tourist" />} />
        <Route path="/login-provider" element={<Login role="provider" />} />
        <Route path="/login-agency" element={<Login role="agency" />} />
        <Route path="/login-admin" element={<Login role="admin" />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<DashboardLayout />}>
        <Route path="/tourist-dash" element={<TouristDash />} />
        <Route path="/provider-dash" element={<ProviderDash />} />
        <Route path="/agency-dash" element={<AgencyDash />} />
        <Route path="/admin-dash" element={<AdminDash />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>);

}