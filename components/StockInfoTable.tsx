'use client';

import Card from './Card';

interface StockInfoItem {
  itemId: string;
  itemName: string;
  initialStock: number;
  finalStock: number;
}

interface StockInfoTableProps {
  stockInfo: {
    items: StockInfoItem[];
  };
}

export default function StockInfoTable({ stockInfo }: StockInfoTableProps) {
  if (!stockInfo || !stockInfo.items || stockInfo.items.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">معلومات المخزون</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الصنف
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الرصيد الافتتاحي
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الرصيد الختامي
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stockInfo.items.map((item) => {
              // Format numbers: remove trailing zeros if whole number, otherwise show decimals
              const formatStock = (value: number) => {
                return value % 1 === 0 ? value.toString() : value.toFixed(2).replace(/\.?0+$/, '');
              };
              return (
                <tr key={item.itemId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.itemName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatStock(item.initialStock)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatStock(item.finalStock)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

