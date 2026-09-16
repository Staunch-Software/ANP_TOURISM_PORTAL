import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scroll to the top of the document whenever the route changes. */
export function useScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {window.scrollTo({ top: 0 });}, [pathname]);
}