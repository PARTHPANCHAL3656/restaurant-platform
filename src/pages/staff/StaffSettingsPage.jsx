import React from 'react';
import { Link } from 'react-router-dom';

const GROUPS = [
  {
    key: 'legal',
    title: 'Business & Legal',
    description: 'Legal name, GSTIN, FSSAI, SAC code — printed on every tax invoice.',
    path: '/staff/settings/legal',
    ownerOnly: true,
    live: true
  },
  {
    key: 'contact',
    title: 'Contact & Location',
    description: 'Phone, WhatsApp, email, and the Google Maps link guests see.',
    path: '/staff/settings/contact',
    ownerOnly: true,
    live: true
  },
  {
    key: 'billing',
    title: 'Tax, Fees & Billing Rules',
    description: 'GST rate, service charge, and packaging fee logic used on every bill.',
    path: '/staff/settings/billing',
    ownerOnly: true,
    live: false
  },
  {
    key: 'operations',
    title: 'Operations',
    description: 'Opening hours and takeout rules.',
    path: '/staff/settings/operations',
    ownerOnly: false,
    live: true
  },
  {
    key: 'links',
    title: 'Integrations & Links',
    description: 'Zomato, Swiggy, and social links shown on the website.',
    path: '/staff/settings/links',
    ownerOnly: false,
    live: true
  },
  {
    key: 'staff',
    title: 'Staff Accounts',
    description: 'Who can log in, and what role they have.',
    path: '/staff/settings/staff',
    ownerOnly: true,
    live: false
  }
];

export default function StaffSettingsPage() {
  const staffRole = sessionStorage.getItem('staffRole');
  const isOwner = staffRole === 'OWNER';

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <h2 className="font-serif text-xl text-ink-navy font-semibold">Settings</h2>
      <p className="text-xs text-subtle-text mt-1 mb-6">
        Changes here apply across the site immediately — no code changes or redeploys needed.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {GROUPS.filter((group) => isOwner || !group.ownerOnly).map((group) => {
          const clickable = group.live;

          const card = (
            <div
              className={`bg-white border border-muted-border p-6 h-full transition-colors ${
                clickable ? 'hover:border-saffron-gold cursor-pointer' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-lg text-ink-navy">{group.title}</h3>
                {!group.live && (
                  <span className="font-label-caps text-[10px] text-subtle-text uppercase tracking-widest border border-muted-border px-2 py-0.5">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="text-xs text-subtle-text">{group.description}</p>
            </div>
          );

          return clickable ? (
            <Link key={group.key} to={group.path}>{card}</Link>
          ) : (
            <div key={group.key}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}