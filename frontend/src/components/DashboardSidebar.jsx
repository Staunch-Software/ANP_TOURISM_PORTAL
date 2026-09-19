import React from 'react';
import { LogOut } from 'lucide-react';
import { ROLE_BADGE } from './Navbar';

const ROLE_LABEL = {
  ADMIN: 'Administrator',
  OPERATOR: 'Ferry Operator',
  VENDOR: 'Activity Vendor',
};

// One shared sidebar shell for every staff dashboard (Admin, Ferry Operator,
// Activity Vendor) — a single navy nav instead of stacking a portal-switcher
// on top of each dashboard's own section nav. `groups` is
// [{ label: 'OVERVIEW', items: [{ key, label, icon }] }, ...]; the caller
// owns activeSection/onSelectSection so this stays a dumb presentation
// component, not another place role logic could drift out of sync.
export function DashboardSidebar({ portalLabel, portalIcon: PortalIcon, groups, activeSection, onSelectSection, user, onLogout }) {
  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-navy-900 border-r border-navy-700 fixed left-0 top-[112px] h-[calc(100vh-112px)] z-30">
      <div className="px-4 py-4 border-b border-navy-700 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-600/40 flex items-center justify-center shrink-0">
          <PortalIcon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-black text-white leading-tight truncate">{portalLabel}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">Staff Portal</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onSelectSection(item.key)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${
                      isActive
                        ? 'bg-amber-700 text-white shadow-md'
                        : 'text-slate-300 hover:text-amber-300 hover:bg-navy-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" /> {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-navy-700">
        <div className="flex items-center justify-between gap-2 bg-navy-800 border border-navy-700 px-3 py-2.5 rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-cyan-600/20 text-cyan-300 border border-cyan-600/40 flex items-center justify-center font-bold text-xs shrink-0">
              {ROLE_BADGE[user?.role] || 'ST'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white leading-tight truncate">{user?.phone_number}</div>
              <div className="text-[10px] text-slate-400 font-medium truncate">{ROLE_LABEL[user?.role] || 'Staff'}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-navy-700 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
