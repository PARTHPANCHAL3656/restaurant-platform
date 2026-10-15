import React from 'react';
import { useStaff } from '../context/StaffContext';

// A small grey note that ends with a tap-to-call link to the restaurant.
// Used for "to cancel, please call us" lines on the guest pages.
export default function CallRestaurantNote({ children, className = '' }) {
  const { restaurantInfo } = useStaff();
  // The manager's line if one is set in Settings → Contact, else the main number.
  const phone = restaurantInfo.managerPhone || restaurantInfo.primaryPhone;
  return (
    <p className={`text-[11px] text-subtle-text leading-relaxed ${className}`}>
      {children}{' '}
      <a
        href={`tel:${phone}`}
        className="text-saffron-gold font-semibold hover:underline whitespace-nowrap"
      >
        {phone}
      </a>
    </p>
  );
}