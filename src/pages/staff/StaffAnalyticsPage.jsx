import React from 'react';
import AnalyticsOverview from '../../components/staff/AnalyticsOverview';

export default function StaffAnalyticsPage() {
  return (
    <div className="px-4 md:px-6 lg:px-12 py-6 md:py-8 space-y-8 max-w-container-max mx-auto">
      <section className="border-b border-muted-border pb-6">
        <p className="font-label-caps text-[10px] text-saffron-gold tracking-[0.25em] uppercase font-bold mb-1">Insights</p>
        <h1 className="font-serif text-display-lg-mobile md:text-headline-md text-ink-navy">Analytics</h1>
      </section>

      <AnalyticsOverview />
    </div>
  );
}