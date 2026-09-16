import React from 'react';

export const Field = ({ label, children, error, hint }) =>
<div className="field"><label className="lbl">{label}</label>{children}
    {hint && !error && <div className="xs mut mt8">{hint}</div>}{error && <div className="err-t">{error}</div>}</div>;