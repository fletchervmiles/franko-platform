"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type FeedbackModalContextType = {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  modalType: 'feedback' | 'support';
  setModalType: (type: 'feedback' | 'support') => void;
};

const FeedbackModalContext = createContext<FeedbackModalContextType | undefined>(undefined);

export const FeedbackModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<'feedback' | 'support'>('feedback');

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <FeedbackModalContext.Provider
      value={{
        isOpen,
        openModal,
        closeModal,
        modalType,
        setModalType,
      }}
    >
      {children}
    </FeedbackModalContext.Provider>
  );
};

export const useFeedbackModal = () => {
  const context = useContext(FeedbackModalContext);
  if (context === undefined) {
    throw new Error('useFeedbackModal must be used within a FeedbackModalProvider');
  }
  return context;
}; 