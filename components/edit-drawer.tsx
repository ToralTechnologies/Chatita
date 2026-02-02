'use client';

import { X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import MealForm from './meal-form';

interface EditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
  initialData?: any;
}

export default function EditDrawer({
  isOpen,
  onClose,
  onSubmit,
  loading,
  initialData,
}: EditDrawerProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold">{t.addMeal.editDetails || 'Edit Details'}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6">
          <MealForm
            onSubmit={onSubmit}
            loading={loading}
            initialData={initialData}
          />
        </div>
      </div>
    </>
  );
}
