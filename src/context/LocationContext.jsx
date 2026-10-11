// src/context/LocationContext.jsx
// SMARTIFY - Delivery Location & Address Management Context
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  // Pincode state for quick browsing
  const [pincodeData, setPincodeData] = useState(() => {
    try {
      const saved = localStorage.getItem('smartify_pincode');
      return saved ? JSON.parse(saved) : {
        pincode: '110001',
        city: 'New Delhi',
        state: 'Delhi',
        serviceable: true
      };
    } catch {
      return {
        pincode: '110001',
        city: 'New Delhi',
        state: 'Delhi',
        serviceable: true
      };
    }
  });

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(() => {
    try {
      const saved = localStorage.getItem('smartify_selected_address');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Sync pincode to local storage
  useEffect(() => {
    localStorage.setItem('smartify_pincode', JSON.stringify(pincodeData));
  }, [pincodeData]);

  // Sync selected address to local storage
  useEffect(() => {
    if (selectedAddress) {
      localStorage.setItem('smartify_selected_address', JSON.stringify(selectedAddress));
    } else {
      localStorage.removeItem('smartify_selected_address');
    }
  }, [selectedAddress]);

  // Load addresses from backend
  const loadAddresses = useCallback(async () => {
    const token = localStorage.getItem('smartify_token') || localStorage.getItem('gharva_token');
    if (!token) {
      setSavedAddresses([]);
      return;
    }
    setLoadingAddresses(true);
    try {
      const list = await api.getAddresses();
      if (Array.isArray(list)) {
        setSavedAddresses(list);
        // If no address is selected or previous selection is deleted, pick default or first
        setSelectedAddress((current) => {
          if (current && list.some((a) => a.id === current.id)) {
            // Update to freshest copy from server
            return list.find((a) => a.id === current.id);
          }
          const def = list.find((a) => a.is_default);
          return def || (list.length > 0 ? list[0] : null);
        });
      }
    } catch (err) {
      console.warn('Could not fetch addresses:', err.message);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const selectAddress = (addr) => {
    setSelectedAddress(addr);
    if (addr && addr.pincode) {
      setPincodeData({
        pincode: addr.pincode,
        city: addr.city || 'Metro Area',
        state: addr.state || 'India',
        serviceable: true
      });
    }
  };

  const addAddress = async (addrPayload) => {
    try {
      const newAddr = await api.addAddress(addrPayload);
      await loadAddresses();
      selectAddress(newAddr);
      return { success: true, data: newAddr };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to save address.' };
    }
  };

  const updateAddress = async (id, addrPayload) => {
    try {
      const updated = await api.updateAddress(id, addrPayload);
      await loadAddresses();
      if (selectedAddress && selectedAddress.id === id) {
        selectAddress(updated);
      }
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to update address.' };
    }
  };

  const deleteAddress = async (id) => {
    try {
      await api.deleteAddress(id);
      await loadAddresses();
      if (selectedAddress && selectedAddress.id === id) {
        setSelectedAddress(null);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to delete address.' };
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      const updated = await api.setDefaultAddress(id);
      await loadAddresses();
      selectAddress(updated);
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to set default address.' };
    }
  };

  const verifyAndSetPincode = async (pin) => {
    try {
      const result = await api.checkPincode(pin);
      if (result.serviceable) {
        setPincodeData(result);
        return { success: true, data: result };
      }
      return { success: false, message: result.message || 'Pincode not serviceable.' };
    } catch (err) {
      return { success: false, message: err.message || 'Could not verify pincode.' };
    }
  };

  return (
    <LocationContext.Provider
      value={{
        pincodeData,
        savedAddresses,
        selectedAddress,
        loadingAddresses,
        isAddressModalOpen,
        openAddressModal: () => setIsAddressModalOpen(true),
        closeAddressModal: () => setIsAddressModalOpen(false),
        loadAddresses,
        selectAddress,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
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
