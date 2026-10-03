import React from 'react';
import {
  ArrowUpRight, ArrowDownLeft, CheckCircle2, ChevronDown, Wallet, ShieldCheck, Zap, PlusCircle, Undo2, History,
} from 'lucide-react';

// Labels and direction come straight from the ledger's txn_type.
export const TXN_LABEL = {
  TOPUP: 'Wallet Top-up',
  DEBIT_PURCHASE: 'Booking Payment',
  CREDIT_REFUND: 'Refund Credit',
  ADMIN_CREDIT: 'Admin Credit',
  ADMIN_DEBIT: 'Admin Debit',
};
export const TXN_IS_CREDIT = { TOPUP: true, CREDIT_REFUND: true, DEBIT_PURCHASE: false, ADMIN_CREDIT: true, ADMIN_DEBIT: false };
const TXN_BADGE = {
  TOPUP: 'Top-up',
  DEBIT_PURCHASE: 'Booking',
  CREDIT_REFUND: 'Refund',
  ADMIN_CREDIT: 'Adjustment',
  ADMIN_DEBIT: 'Adjustment',
};

export const TXN_FILTERS = [
  ['ALL', 'All Transactions'],
  ['TOPUP', 'Top-ups'],
  ['DEBIT_PURCHASE', 'Booking Payments'],
  ['CREDIT_REFUND', 'Refunds'],
];

const inr = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDateTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: iso, time: '' };
  return {
    date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
  };
};

/* ------------------------------------------------------------------ */
// Every ledger row is an immutable, already-applied entry, so it is Completed by definition.
export function TransactionStatus() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold whitespace-nowrap">
      <CheckCircle2 className="w-3.5 h-3.5" /> Completed
    </span>
  );
}

export function TransactionTypeBadge({ txn }) {
  const credit = TXN_IS_CREDIT[txn.txn_type] !== false;
  const Icon = credit ? ArrowDownLeft : ArrowUpRight;
  return (
    <div className="flex items-center gap-2.5">
      <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${credit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
        <Icon className="w-4 h-4" />
      </span>
      <div>
        <p className={`text-sm font-bold leading-tight ${credit ? 'text-emerald-700' : 'text-red-600'}`}>{credit ? 'Credit' : 'Debit'}</p>
        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600">
          {TXN_BADGE[txn.txn_type] || txn.txn_type}
        </span>
      </div>
    </div>
  );
}

const GRID = 'md:grid md:grid-cols-[125px_115px_minmax(0,1fr)_115px_115px_120px] md:gap-4 md:items-center';

export function TransactionRow({ txn }) {
  const credit = TXN_IS_CREDIT[txn.txn_type] !== false;
  const { date, time } = fmtDateTime(txn.created_at);
  const amount = `${credit ? '+' : '-'}${inr(txn.amount)}`;
  const title = TXN_LABEL[txn.txn_type] || txn.txn_type;

  return (
    <div className={`px-4 py-4 border-b border-slate-100 last:border-b-0 hover:bg-cyan-50/40 transition-colors ${GRID}`}>
      {/* Date & time */}
      <div className="hidden md:block">
        <p className="text-sm font-semibold text-navy-800">{date}</p>
        <p className="text-xs text-slate-500">{time}</p>
      </div>

      {/* Mobile card header */}
      <div className="md:hidden flex items-center justify-between gap-3 mb-2">
        <TransactionStatus />
        <p className="text-xs text-slate-500">{date} · {time}</p>
      </div>

      <div className="hidden md:block"><TransactionTypeBadge txn={txn} /></div>

      <div className="min-w-0">
        <p className="text-sm font-bold text-navy-800">{title}</p>
        {txn.description && <p className="text-xs text-slate-500 break-words">{txn.description}</p>}
        {txn.razorpay_payment_id && (
          <p className="mt-0.5 text-[10px] font-mono text-slate-400 break-all">REF: {txn.razorpay_payment_id}</p>
        )}
      </div>

      <div className="mt-2 md:mt-0 flex items-end justify-between md:block">
        <div className="md:text-right">
          <p className="md:hidden text-[10px] uppercase tracking-wide text-slate-400">Amount</p>
          <p className={`text-base font-black font-mono ${credit ? 'text-emerald-600' : 'text-red-600'}`}>{amount}</p>
        </div>
        <div className="md:hidden text-right">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Balance</p>
          <p className="text-sm font-semibold font-mono text-navy-800">{inr(txn.balance_after)}</p>
        </div>
      </div>

      <p className="hidden md:block text-right text-sm font-semibold font-mono text-navy-800">{inr(txn.balance_after)}</p>
      <div className="hidden md:flex justify-end"><TransactionStatus /></div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
export function TransactionHistory({ loading, transactions, filter, setFilter, visibleCount, onShowMore, totalCount }) {
  const shown = transactions.slice(0, visibleCount);
  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center"><Wallet className="w-5 h-5" /></span>
          <div>
            <h3 className="font-bold text-navy-800 leading-tight">Transaction History</h3>
            <p className="text-xs text-slate-500">Your recent wallet transactions</p>
          </div>
        </div>
        <label className="relative">
          <span className="sr-only">Filter transactions</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-navy-800 focus:border-cyan-500 focus:outline-none"
          >
            {TXN_FILTERS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </label>
      </div>

      {loading && totalCount === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading...</div>
      ) : totalCount === 0 ? (
        <div className="text-center py-12 border-t border-slate-100">
          <History className="w-9 h-9 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-navy-800">No transactions yet</p>
          <p className="text-xs text-slate-500 mt-0.5">Your wallet transactions will appear here.</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-10 border-t border-slate-100 text-sm text-slate-500">No transactions of this type.</div>
      ) : (
        <div className="border-t border-slate-100">
          <div className={`hidden md:grid md:grid-cols-[125px_115px_minmax(0,1fr)_115px_115px_120px] md:gap-4 px-4 py-2.5 bg-cyan-50/70 text-[11px] font-bold uppercase tracking-wide text-slate-500`}>
            <span>Date &amp; Time</span>
            <span>Type</span>
            <span>Description</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Balance</span>
            <span className="text-right">Status</span>
          </div>
          {shown.map((t, i) => <TransactionRow key={`${t.created_at}-${i}`} txn={t} />)}
          {transactions.length > visibleCount && (
            <div className="p-4 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={onShowMore}
                className="px-5 py-2 rounded-xl bg-white border border-cyan-300 hover:bg-cyan-50 text-cyan-800 text-sm font-bold"
              >
                Show more ({transactions.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function WalletInfoBar() {
  const items = [
    { icon: ShieldCheck, title: 'Secure Payments', sub: 'Your transactions are safe and secure' },
    { icon: Zap, title: 'Quick Checkout', sub: 'Faster booking across attractions & ferries' },
    { icon: PlusCircle, title: 'Easy Top-up', sub: 'Add funds anytime, anywhere' },
    { icon: Undo2, title: 'Refunds & Cancellations', sub: 'Refunds will be credited to your wallet' },
  ];
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(({ icon: Icon, title, sub }) => (
        <div key={title} className="flex items-center gap-3">
          <Icon className="w-7 h-7 text-cyan-700 shrink-0" />
          <div>
            <p className="text-sm font-bold text-navy-800 leading-tight">{title}</p>
            <p className="text-xs text-slate-500">{sub}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
