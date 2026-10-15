import React from 'react';
import { useStaff } from '../context/StaffContext';

// A small grey note that ends with a tap-to-call link to the restaurant.
// Used for "to cancel, please call us" lines on the guest pages.
export default function CallRestaurantNote({ children, className = '' }) {
  const { restaurantInfo } = useStaff();
  return (
    <p className={`text-[11px] text-subtle-text leading-relaxed ${className}`}>
      {children}{' '}
      <a
        href={`tel:${restaurantInfo.primaryPhone}`}
        className="text-saffron-gold font-semibold hover:underline whitespace-nowrap"
      >
        {restaurantInfo.primaryPhone}
      </a>
    </p>
  );
}