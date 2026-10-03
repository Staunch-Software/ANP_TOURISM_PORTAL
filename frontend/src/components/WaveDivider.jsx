import React from 'react';

/* Curved ocean-wave edge for the bottom of a hero banner. Pure SVG so it stays
   sharp and responsive; the parent hero must be `relative overflow-hidden`.
   `fill` should match the page background the hero flows into. */
export function WaveDivider({ fill = '#EEF9FC', depthFill = '#CDEBF6' }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1440 100"
      preserveAspectRatio="none"
      className="absolute left-0 bottom-[-1px] w-full h-[40px] sm:h-[58px] lg:h-[78px] pointer-events-none z-[1]"
    >
      {/* soft back wave for depth */}
      <path
        d="M0,38 C220,6 470,72 730,56 C990,40 1210,2 1440,34 L1440,100 L0,100 Z"
        fill={depthFill}
        fillOpacity="0.65"
      />
      {/* front wave: high on the left, dips mid-page, lifts, then eases down on the right */}
      <path
        d="M0,54 C200,22 430,88 710,72 C980,56 1210,20 1440,62 L1440,100 L0,100 Z"
        fill={fill}
      />
    </svg>
  );
}
