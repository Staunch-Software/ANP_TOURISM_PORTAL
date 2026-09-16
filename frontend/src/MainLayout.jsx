import React from 'react';
import { Outlet } from 'react-router-dom';
import { Nav } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { CartButton } from '../components/layout/CartButton';

/** Public site chrome: navbar, page outlet, footer, floating cart. */
export default function MainLayout() {
  return (
    <>
      <Nav />
      <main><Outlet /></main>
      <Footer />
      <CartButton />
    </>);

}