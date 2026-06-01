import React, { useEffect, useState } from 'react';
import api from '@/api/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, BarChart2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface SalesData {
  date: string;
  total_sales: number;
  total_transactions: number;
}

interface ProductData {
  product__name: string;
  total_sold: number;
  revenue: number;
}

const periodOptions = ['daily', 'weekly', 'monthly', 'yearly'] as const;

type Period = typeof periodOptions[number];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);

const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<Period>('daily');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [summary, setSummary] = useState({ total_sales: 0, total_transactions: 0, average_transaction: 0 });

  const fetchSalesReport = async () => {
    const params = new URLSearchParams({
      period,
      ...(dateFrom ? { date_from: format(dateFrom, 'yyyy-MM-dd') } : {}),
      ...(dateTo ? { date_to: format(dateTo, 'yyyy-MM-dd') } : {}),
    });
    try {
      const response = await api.get(`/reports/sales-report/?${params.toString()}`);
      // Backend returns { period, summary, data }
      const result = response.data;
      const data: SalesData[] = (result.data || []).map((row: any) => ({
        date: row.date || `${row.year}-${String(row.month).padStart(2, '0')}` || `${row.year}-W${row.week}` || `${row.year}`,
        total_sales: row.total_sales || 0,
        total_transactions: row.transaction_count || 0,
      }));
      setSalesData(data);
      if (result.summary) {
        setSummary({
          total_sales: result.summary.total_sales || 0,
          total_transactions: result.summary.total_transactions || 0,
          average_transaction: result.summary.average_transaction || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch sales report', err);
    }
  };

  const fetchProductReport = async () => {
    try {
      const response = await api.get('/reports/product-report/');
      // Backend returns { data: [...] }
      setProductData(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch product report', err);
    }
  };

  useEffect(() => {
    fetchSalesReport();
    fetchProductReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, dateFrom, dateTo]);

  return (
    <div className="p-6 space-y-8">
      {/* Period Tabs */}
      <div className="flex space-x-2">
        {periodOptions.map((opt) => (
          <button
            key={opt}
            className={`px-4 py-2 rounded-md transition-colors 
              ${period === opt ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-800'}
            `}
            onClick={() => setPeriod(opt)}
          >
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}
      </div>

      {/* Date Range Pickers */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <DatePicker
            selected={dateFrom}
            onChange={(date) => setDateFrom(date)}
            placeholderText="From"
            className="border rounded px-2 py-1"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <DatePicker
            selected={dateTo}
            onChange={(date) => setDateTo(date)}
            placeholderText="To"
            className="border rounded px-2 py-1"
            dateFormat="yyyy-MM-dd"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow flex items-center space-x-3">
          <TrendingUp className="w-6 h-6 text-green-600" />
          <div>
            <p className="text-sm text-gray-500">Total Sales</p>
            <p className="text-xl font-semibold">{formatCurrency(summary.total_sales)}</p>
          </div>
        </div>
        <div className="p-4 bg-white rounded shadow flex items-center space-x-3">
          <BarChart2 className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-sm text-gray-500">Transactions</p>
            <p className="text-xl font-semibold">{summary.total_transactions}</p>
          </div>
        </div>
        <div className="p-4 bg-white rounded shadow flex items-center space-x-3">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          <div>
            <p className="text-sm text-gray-500">Avg Transaction</p>
            <p className="text-xl font-semibold">{formatCurrency(summary.average_transaction)}</p>
          </div>
        </div>
      </div>

      {/* Sales Line Chart */}
      <div className="bg-white rounded shadow p-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={salesData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
            <Line type="monotone" dataKey="total_sales" stroke="#8884d8" name="Sales" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Product Report Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Sold
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productData.map((prod, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{prod.product__name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{prod.total_sold}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {formatCurrency(prod.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsPage;
