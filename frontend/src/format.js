

export const fmt = (n) => '₹' + n.toLocaleString('en-IN');
export const stCl = (s) => ({ Available: 'b-ok', Limited: 'b-warn', 'Fully Booked': 'b-bad', Confirmed: 'b-ok', Completed: 'b-info', Cancelled: 'b-bad', Approved: 'b-ok', Rejected: 'b-bad', 'Pending Approval': 'b-warn', 'Under Review': 'b-warn', Submitted: 'b-info', Verified: 'b-ok', 'Pending Verification': 'b-warn', 'Document Expired': 'b-bad' })[s] || 'b-grey';