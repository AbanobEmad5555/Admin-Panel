import { useMemo, useState } from "react";
import type { PosOrderItemInput } from "@/modules/pos/types";

export type PosProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
  variantId?: number;
  stock?: number;
};

export type CartItem = PosOrderItemInput;

const upsertCartItem = (items: CartItem[], product: PosProduct): CartItem[] => {
  const index = items.findIndex((item) => item.productId === product.id);
  if (index === -1) {
    return [
      ...items,
      {
        productId: product.id,
        name: product.name,
        variantId: product.variantId,
        qty: 1,
        unitPrice: product.price,
        discount: 0,
        tax: 0,
      },
    ];
  }

  return items.map((item, itemIndex) =>
    itemIndex === index ? { ...item, qty: item.qty + 1 } : item
  );
};

export const usePosStore = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerMobileNumber, setCustomerMobileNumber] = useState("");
  const [note, setNote] = useState("");
  const [loyaltyProgramCode, setLoyaltyProgramCode] = useState("");
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0),
    [items]
  );
  const itemsDiscount = useMemo(
    () => items.reduce((sum, item) => sum + (item.discount ?? 0), 0),
    [items]
  );
  const discount = Math.max(0, itemsDiscount + globalDiscount);
  const tax = Math.max(0, (subtotal - discount) * 0.14);
  const total = Math.max(0, subtotal - discount + tax);

  return {
    items,
    customerName,
    customerMobileNumber,
    note,
    loyaltyProgramCode,
    globalDiscount,
    activeCategory,
    subtotal,
    discount,
    tax,
    total,
    addProduct: (product: PosProduct) => setItems((prev) => upsertCartItem(prev, product)),
    setQty: (productId: string, qty: number) =>
      setItems((prev) =>
        prev
          .map((item) => (item.productId === productId ? { ...item, qty } : item))
          .filter((item) => item.qty > 0)
      ),
    removeItem: (productId: string) =>
      setItems((prev) => prev.filter((item) => item.productId !== productId)),
    clearCart: () => {
      setItems([]);
      setCustomerName("");
      setCustomerMobileNumber("");
      setNote("");
      setLoyaltyProgramCode("");
      setGlobalDiscount(0);
    },
    setCustomerName,
    setCustomerMobileNumber,
    setNote,
    setLoyaltyProgramCode,
    setGlobalDiscount,
    setActiveCategory,
  };
};
