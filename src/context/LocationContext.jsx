// src/context/LocationContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [pincodeData, setPincodeData] = useState(() => {
    try {
      const saved = localStorage.getItem('smartify_pincode') || localStorage.getItem('gharva_pincode');
      return saved ? JSON.parse(saved) : {
        pincode: '110001',
        city: 'New Delhi',
        state: 'Delhi',
        is_serviceable: true,
        estimated_days: '1-2 days'
      };
    } catch {
      return {
        pincode: '110001',
        city: 'New Delhi',
        state: 'Delhi',
        is_serviceable: true,
        estimated_days: '1-2 days'
      };
    }
  });

  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('smartify_pincode', JSON.stringify(pincodeData));
  }, [pincodeData]);

  const verifyAndSetPincode = async (pin) => {
    try {
      const result = await api.checkPincode(pin);
      if (result.is_serviceable) {
        setPincodeData(result);
        setIsPincodeModalOpen(false);
        return { success: true, data: result };
      } else {
        return { success: false, message: result.message || 'Currently unavailable for this location' };
      }
    } catch (err) {
      return { success: false, message: 'Could not verify pincode. Please try again.' };
    }
  };

  return (
    <LocationContext.Provider
      value={{
        pincodeData,
        isPincodeModalOpen,
        openPincodeModal: () => setIsPincodeModalOpen(true),
        closePincodeModal: () => setIsPincodeModalOpen(false),
        verifyAndSetPincode
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within a LocationProvider');
  return context;
}
