'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Select from '@/components/Select';
import Input from '@/components/Input';
import { formatCurrency } from '@/lib/utils';

export default function NewSalesInvoicePage() {
  const { user } = useUser();
  const router = useRouter();
  const [inventories, setInventories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Determine section based on user role
  const getUserSection = () => {
    if (user?.role === 'SALES_GROCERY' || user?.role === 'AGENT_GROCERY') return 'GROCERY';
    if (user?.role === 'SALES_BAKERY' || user?.role === 'AGENT_BAKERY') return 'BAKERY';
    return 'GROCERY'; // Default
  };

  const isAgentUser = user?.role === 'AGENT_GROCERY' || user?.role === 'AGENT_BAKERY';

  const [formData, setFormData] = useState({
    inventoryId: '',
    section: getUserSection(),
    customerId: '',
    pricingTier: (isAgentUser ? 'AGENT_RETAIL' : 'RETAIL') as 'RETAIL' | 'WHOLESALE' | 'AGENT' | 'AGENT_WHOLESALE' | 'AGENT_RETAIL', // Default pricing tier when no customer
    discount: 0,
    notes: '',
  });

  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [currentItem, setCurrentItem] = useState({
    itemId: '',
    quantity: 1,
    giftQty: 0, // Deprecated: kept for backward compatibility
    giftItemId: '', // New: The item being given as gift
    giftQuantity: 0, // New: Quantity of the gift item
    priceTier: '', // For bakery wholesale: 'WHOLESALE', 'OFFER_1', or 'OFFER_2'
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, section: getUserSection() }));
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (formData.section) {
      loadItems(formData.section);
      loadCustomers(formData.section);
    }
  }, [formData.section]);

  // Reload items with offers when customer changes (especially for bakery wholesale)
  useEffect(() => {
    if (formData.section === 'BAKERY' && customers.length > 0) {
      const customer = formData.customerId ? customers.find((c) => c.id === formData.customerId) : null;
      // Reload items to ensure offers are available, especially for wholesale customers
      if (customer && customer.type === 'WHOLESALE' && customer.division === 'BAKERY') {
        loadItems('BAKERY');
      } else if (!formData.customerId) {
        // Also reload when customer is cleared
        loadItems('BAKERY');
      }
    }
  }, [formData.customerId, customers.length]);

  const loadData = async () => {
    try {
      const inventoriesData = await api.getInventories();
      setInventories(inventoriesData);
      if (inventoriesData.length > 0) {
        setFormData((prev) => ({ ...prev, inventoryId: inventoriesData[0].id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (section: string) => {
    try {
      const data = await api.getItems(section);
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const loadCustomers = async (section: string) => {
    try {
      const data = await api.getCustomers({ division: section });
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  // Separate customers by type
  const retailCustomers = customers.filter((c) => c.type === 'RETAIL');
  const wholesaleCustomers = customers.filter((c) => c.type === 'WHOLESALE');
  const agentCustomers = customers.filter((c) => c.type === 'AGENT');

  const addItem = () => {
    if (!currentItem.itemId || currentItem.quantity <= 0) {
      alert('يرجى اختيار الصنف والكمية');
      return;
    }

    const item = items.find((i) => i.id === currentItem.itemId);
    if (!item) return;

    const giftItem = currentItem.giftItemId ? items.find((i) => i.id === currentItem.giftItemId) : null;
    setInvoiceItems([...invoiceItems, { ...currentItem, item, giftItem }]);
    setCurrentItem({ itemId: '', quantity: 1, giftQty: 0, giftItemId: '', giftQuantity: 0, priceTier: '' });
  };

  const removeItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Helper function to get available price tiers for bakery items
  const getAvailablePriceTiers = (item: any) => {
    if (!item.prices) return [];
    const tiers: any[] = [];
    const pricesForInventory = item.prices.filter((p: any) => 
      p.inventoryId === formData.inventoryId || p.inventoryId === null
    );
    
    // Check for WHOLESALE, OFFER_1, and OFFER_2
    const hasWholesale = pricesForInventory.some((p: any) => p.tier === 'WHOLESALE');
    const hasOffer1 = pricesForInventory.some((p: any) => p.tier === 'OFFER_1');
    const hasOffer2 = pricesForInventory.some((p: any) => p.tier === 'OFFER_2');
    
    if (hasWholesale) tiers.push({ value: 'WHOLESALE', label: 'سعر الجملة' });
    if (hasOffer1) tiers.push({ value: 'OFFER_1', label: 'العرض الأول' });
    if (hasOffer2) tiers.push({ value: 'OFFER_2', label: 'العرض الثاني' });
    
    return tiers;
  };

  const calculateTotal = () => {
    // Determine pricing tier: 
    // - For agents: use selected pricingTier (they can override customer type)
    // - For regular sales: use customer type if customer selected, otherwise use selected pricing tier
    const customer = formData.customerId ? customers.find((c) => c.id === formData.customerId) : null;
    const pricingTier = isAgentUser ? formData.pricingTier : (customer ? customer.type : formData.pricingTier);

    const subtotal = invoiceItems.reduce((sum, lineItem) => {
      let price = 0;

      // Determine which price tier to use for this item
      let tierToUse = pricingTier;
      if (lineItem.priceTier) {
        // Override with explicitly selected price tier (for bakery wholesale offers)
        tierToUse = lineItem.priceTier;
      }

      // Find the price for the selected tier
      const prices = lineItem.item.prices
        .filter((p: any) => p.tier === tierToUse)
        .filter((p: any) => {
          // Include inventory-specific price OR global price (inventoryId is null)
          return p.inventoryId === formData.inventoryId || p.inventoryId === null;
        })
        .sort((a: any, b: any) => {
          // Prefer inventory-specific over global (null comes last)
          if (a.inventoryId && !b.inventoryId) return -1;
          if (!a.inventoryId && b.inventoryId) return 1;
          // Then by validFrom (most recent first)
          return new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime();
        });
      
      if (prices.length === 0) return sum;
      price = parseFloat(prices[0].price);

      return sum + price * lineItem.quantity;
    }, 0);

    return subtotal - formData.discount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (invoiceItems.length === 0) {
      alert('يرجى إضافة أصناف للفاتورة');
      return;
    }

    setSubmitting(true);
    try {
      const submitData: any = {
        inventoryId: formData.inventoryId,
        section: formData.section,
        discount: formData.discount,
        items: invoiceItems.map((i) => ({
          itemId: i.itemId,
          quantity: i.quantity,
          giftQty: i.giftQty || 0, // Keep for backward compatibility
          giftItemId: i.giftItemId || undefined,
          giftQuantity: i.giftQuantity || undefined,
          priceTier: i.priceTier || undefined, // Include selected price tier if any (for bakery wholesale offers)
        })),
      };
      
      // Only include customerId if it's provided (not empty string)
      if (formData.customerId && formData.customerId.trim() !== '') {
        submitData.customerId = formData.customerId;
      } else {
        // When no customer, include pricingTier to determine pricing
        submitData.pricingTier = formData.pricingTier;
      }
      
      // Include notes if provided
      if (formData.notes && formData.notes.trim() !== '') {
        submitData.notes = formData.notes;
      }
      
      await api.createSalesInvoice(submitData);
      alert('تم إنشاء الفاتورة بنجاح');
      router.push('/dashboard/sales');
    } catch (error: any) {
      alert(error.message || 'فشل إنشاء الفاتورة');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">فاتورة مبيعات جديدة</h1>

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="المخزن"
              value={formData.inventoryId}
              onChange={(e) => setFormData({ ...formData, inventoryId: e.target.value })}
              options={inventories.map((inv) => ({ value: inv.id, label: inv.name }))}
              required
            />

            {/* Hide section selector for sales and agent users - they can only access their assigned section */}
            {user?.role !== 'SALES_GROCERY' && user?.role !== 'SALES_BAKERY' && user?.role !== 'AGENT_GROCERY' && user?.role !== 'AGENT_BAKERY' ? (
              <Select
                label="القسم"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                options={[
                  { value: 'GROCERY', label: 'بقالة' },
                  { value: 'BAKERY', label: 'أفران' },
                ]}
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                  {formData.section === 'GROCERY' ? 'بقالة' : 'أفران'}
                </div>
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">العميل (اختياري)</label>
              <div className={`grid gap-4 ${isAgentUser ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {isAgentUser && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">وكيل</label>
                    <Select
                      value={formData.customerId && agentCustomers.some(c => c.id === formData.customerId) ? formData.customerId : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ 
                          ...formData, 
                          customerId: value || '',
                        });
                      }}
                      options={[
                        { value: '', label: 'بدون عميل' },
                        ...agentCustomers.map((c) => ({ value: c.id, label: c.name })),
                      ]}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">بالتجزئة</label>
                  <Select
                    value={formData.customerId && retailCustomers.some(c => c.id === formData.customerId) ? formData.customerId : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // For agents, don't auto-set pricing tier - let them choose
                      if (isAgentUser) {
                        setFormData({ 
                          ...formData, 
                          customerId: value || '',
                        });
                      } else {
                        setFormData({ 
                          ...formData, 
                          customerId: value || '',
                          pricingTier: value ? 'RETAIL' : formData.pricingTier,
                        });
                      }
                    }}
                    options={[
                      { value: '', label: 'بدون عميل' },
                      ...retailCustomers.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">بالجملة</label>
                  <Select
                    value={formData.customerId && wholesaleCustomers.some(c => c.id === formData.customerId) ? formData.customerId : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // For agents, don't auto-set pricing tier - let them choose
                      if (isAgentUser) {
                        setFormData({ 
                          ...formData, 
                          customerId: value || '',
                        });
                      } else {
                        setFormData({ 
                          ...formData, 
                          customerId: value || '',
                          pricingTier: value ? 'WHOLESALE' : formData.pricingTier,
                        });
                      }
                    }}
                    options={[
                      { value: '', label: 'بدون عميل' },
                      ...wholesaleCustomers.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                  />
                </div>
              </div>
              {/* Show pricing tier selector for agents, or when no customer is selected */}
              {(isAgentUser || !formData.customerId) && (
                <div className="mt-2">
                  <label className="block text-xs text-gray-500 mb-1">نوع السعر</label>
                  <Select
                    value={formData.pricingTier}
                    onChange={(e) => setFormData({ ...formData, pricingTier: e.target.value as 'RETAIL' | 'WHOLESALE' | 'AGENT' | 'AGENT_WHOLESALE' | 'AGENT_RETAIL' })}
                    options={
                      isAgentUser
                        ? [
                            { value: 'AGENT_RETAIL', label: 'وكيل قطاعي' },
                            { value: 'AGENT_WHOLESALE', label: 'وكيل جملة' },
                          ]
                        : [
                            { value: 'WHOLESALE', label: 'جملة' },
                            { value: 'RETAIL', label: 'قطاعي' },
                          ]
                    }
                  />
                </div>
              )}
            </div>

            {/* Payment method removed from creation form; chosen later by accountant/manager */}
          </div>

          <Input
            label="الخصم"
            type="number"
            step="0.01"
            value={formData.discount}
            onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
          />

          <Input
            label="ملاحظات"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <hr className="my-6" />

          <h3 className="text-lg font-semibold mb-4">الأصناف</h3>

          <div className="grid grid-cols-1 gap-4 mb-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الصنف</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={currentItem.itemId}
                  onChange={(e) => setCurrentItem({ ...currentItem, itemId: e.target.value })}
                >
                  <option value="">اختر الصنف</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {currentItem.itemId && (() => {
                  const customer = formData.customerId ? customers.find((c) => c.id === formData.customerId) : null;
                  const isBakeryWholesale = formData.section === 'BAKERY' && 
                                           customer && 
                                           customer.type === 'WHOLESALE' && 
                                           customer.division === 'BAKERY';
                  const selectedItem = items.find((i) => i.id === currentItem.itemId);
                  
                  if (isBakeryWholesale && selectedItem) {
                    const availableTiers = getAvailablePriceTiers(selectedItem);
                    if (availableTiers.length > 0) {
                      return (
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">اختر السعر:</label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={currentItem.priceTier || 'WHOLESALE'}
                            onChange={(e) => setCurrentItem({ ...currentItem, priceTier: e.target.value })}
                          >
                            {availableTiers.map((tier) => (
                              <option key={tier.value} value={tier.value}>
                                {tier.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>

              <Input
                label="الكمية"
                type="number"
                step="0.01"
                value={currentItem.quantity}
                onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseFloat(e.target.value) || 0 })}
              />

              <Input
                label="الهدية (قديم)"
                type="number"
                step="0.01"
                value={currentItem.giftQty}
                onChange={(e) => setCurrentItem({ ...currentItem, giftQty: parseFloat(e.target.value) || 0 })}
                placeholder="نفس الصنف"
              />

              <div className="flex items-end">
                <Button type="button" onClick={addItem} className="w-full">
                  إضافة
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t pt-4">
              <Select
                label="هدية (صنف منفصل)"
                value={currentItem.giftItemId}
                onChange={(e) => setCurrentItem({ ...currentItem, giftItemId: e.target.value, giftQty: 0 })}
                options={[
                  { value: '', label: 'لا يوجد هدية' },
                  ...items.map((item) => ({ value: item.id, label: item.name })),
                ]}
              />

              <Input
                label="كمية الهدية"
                type="number"
                step="0.01"
                value={currentItem.giftQuantity}
                onChange={(e) => setCurrentItem({ ...currentItem, giftQuantity: parseFloat(e.target.value) || 0 })}
                disabled={!currentItem.giftItemId}
              />

              <div className="flex items-center text-sm text-gray-500">
                {currentItem.giftItemId && (
                  <span>سيتم إضافة {currentItem.giftQuantity} من {items.find((i) => i.id === currentItem.giftItemId)?.name} كهدية</span>
                )}
              </div>
            </div>
          </div>

          {invoiceItems.length > 0 && (
            <div className="mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الصنف</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الكمية</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">السعر</th>
                    {(() => {
                      const customer = formData.customerId ? customers.find((c) => c.id === formData.customerId) : null;
                      const isBakeryWholesale = formData.section === 'BAKERY' && 
                                               customer && 
                                               customer.type === 'WHOLESALE' && 
                                               customer.division === 'BAKERY';
                      return isBakeryWholesale ? (
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">اختيار السعر</th>
                      ) : null;
                    })()}
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الهدية</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item, index) => {
                    const customer = formData.customerId ? customers.find((c) => c.id === formData.customerId) : null;
                    const pricingTier = isAgentUser ? formData.pricingTier : (customer ? customer.type : formData.pricingTier);
                    const isBakeryWholesale = formData.section === 'BAKERY' && 
                                             customer && 
                                             customer.type === 'WHOLESALE' && 
                                             customer.division === 'BAKERY';
                    
                    // Calculate price for display
                    let displayPrice = 0;
                    let isOfferPrice = false;
                    
                    // Determine which price tier to use for this item
                    let tierToUse = pricingTier;
                    if (item.priceTier) {
                      // Override with explicitly selected price tier (for bakery wholesale offers)
                      tierToUse = item.priceTier;
                      if (tierToUse === 'OFFER_1' || tierToUse === 'OFFER_2') {
                        isOfferPrice = true;
                      }
                    }
                    
                    // Find the price for the selected tier
                    const prices = item.item.prices
                      .filter((p: any) => p.tier === tierToUse)
                      .filter((p: any) => p.inventoryId === formData.inventoryId || p.inventoryId === null)
                      .sort((a: any, b: any) => {
                        if (a.inventoryId && !b.inventoryId) return -1;
                        if (!a.inventoryId && b.inventoryId) return 1;
                        return new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime();
                      });
                    if (prices.length > 0) {
                      displayPrice = parseFloat(prices[0].price);
                    }

                    return (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm">
                          {item.item.name}
                          {item.giftItem && (
                            <div className="text-xs text-green-600 mt-1">
                              هدية: {item.giftQuantity} × {item.giftItem.name}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm">
                          {displayPrice > 0 ? (
                            <div>
                              <span className={isOfferPrice ? 'text-pink-600 font-semibold' : ''}>
                                {formatCurrency(displayPrice)}
                              </span>
                              {isOfferPrice && (
                                <span className="text-xs text-pink-500 block">
                                  {item.priceTier === 'OFFER_1' ? 'العرض الأول' : item.priceTier === 'OFFER_2' ? 'العرض الثاني' : 'سعر العرض'}
                                </span>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        {isBakeryWholesale && (() => {
                          const availableTiers = getAvailablePriceTiers(item.item);
                          if (availableTiers.length > 0) {
                            return (
                              <td className="px-4 py-2 text-sm">
                                <select
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  value={item.priceTier || 'WHOLESALE'}
                                  onChange={(e) => {
                                    const updatedItems = [...invoiceItems];
                                    updatedItems[index] = { ...item, priceTier: e.target.value };
                                    setInvoiceItems(updatedItems);
                                  }}
                                >
                                  {availableTiers.map((tier) => (
                                    <option key={tier.value} value={tier.value}>
                                      {tier.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            );
                          }
                          return null;
                        })()}
                        <td className="px-4 py-2 text-sm">
                          {item.giftQty > 0 ? `${item.giftQty} (قديم)` : item.giftItem ? `${item.giftQuantity} × ${item.giftItem.name}` : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            حذف
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-4 text-left text-lg font-semibold">
                المجموع: {formatCurrency(calculateTotal())}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={submitting}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

