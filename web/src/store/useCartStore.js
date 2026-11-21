import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex(
          (i) => i.medicineId === item.medicineId
        );

        if (existingIndex > -1) {
          const updated = [...currentItems];
          updated[existingIndex].quantity += item.quantity || 1;
          set({ items: updated });
        } else {
          set({ items: [...currentItems, { ...item, quantity: item.quantity || 1 }] });
        }
      },

      updateQuantity: (medicineId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(medicineId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.medicineId === medicineId ? { ...i, quantity } : i
          )
        });
      },

      removeItem: (medicineId) => {
        set({
          items: get().items.filter((i) => i.medicineId !== medicineId)
        });
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.reduce((total, item) => total + (item.quantity || 1), 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + (item.price || 0) * (item.quantity || 1),
          0
        );
      },

      hasPrescriptionRequiredItems: () => {
        return get().items.some((item) => item.prescriptionRequired === true);
      }
    }),
    {
      name: 'meditrace_cart'
    }
  )
);

export default useCartStore;
