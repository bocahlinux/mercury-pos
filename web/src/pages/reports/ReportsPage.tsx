import React, { useEffect, useState, useCallback } from 'react';
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
import { Calendar, BarChart2, TrendingUp, Download, Users, Package, ShoppingBag } from 'lucide-react';
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
  product__sku: string;
  total_sold: number;
  revenue: number;
}

interface CustomerData {
  id: number;
  name: string;
  email: string;
  phone: string;
  total_spent: number;
  order_count: number;
}

const periodOptions = ['daily', 'weekly', 'monthly', 'yearly'] as const;
type Period = typeof periodOptions[number];
type Tab = 'sales' | 'products' | 'customers';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('sales');
  const [period, setPeriod] = useState<Period>('daily');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [summary, setSummary] = useState({ total_sales: 0, total_transactions: 0, average_transaction: 0 });

  const dateParams = useCallback(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', format(dateFrom, 'yyyy-MM-dd'));
    if (dateTo) params.set('date_to', format(dateTo, 'yyyy-MM-dd'));
    return params;
  }, [dateFrom, dateTo]);

  const fetchSalesReport = useCallback(async () => {
    const params = dateParams();
    params.set('period', period);
    try {
      const response = await api.get(`/reports/sales-report/?${params.toString()}`);
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
  }, [period, dateParams]);

  const fetchProductReport = useCallback(async () => {
    const params = dateParams();
    try {
      const response = await api.get(`/reports/product-report/?${params.toString()}`);
      setProductData(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch product report', err);
    }
  }, [dateParams]);

  const fetchCustomerReport = useCallback(async () => {
    const params = dateParams();
    try {
      const response = await api.get(`/reports/customer-report/?${params.toString()}`);
      setCustomerData(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch customer report', err);
    }
  }, [dateParams]);

  useEffect(() => {
    if (activeTab === 'sales') fetchSalesReport();
    else if (activeTab === 'products') fetchProductReport();
    else if (activeTab === 'customers') fetchCustomerReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, period, dateFrom, dateTo]);

  const downloadExport = (type: 'sales' | 'product' | 'customer') => {
    const params = dateParams();
    if (type === 'sales') params.set('period', period);
    const url = `/reports/${type}-report/export/?${params.toString()}`;
    // Use a link download via the api token
    const token = localStorage.getItem('access_token') || '';
    fetch(`${api.defaults.baseURL}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      })
      .then((blob) => {
        const link = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = link;
        a.download = `${type}-report-${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(link);
      })
      .catch((err) => {
        console.error('Export error:', err);
        alert('Failed to download export. Make sure openpyxl is installed on the backend.');
      });
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'sales', label: 'Sales', icon: <ShoppingBag className="w-4 h-4" /> },
    { key: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
    { key: 'customers', label: 'Customers', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Period + Date Range + Export */}
      <div className="flex flex-wrap items-center gap-4">
        {activeTab === 'sales' && (
          <div className="flex space-x-2">
            {periodOptions.map((opt) => (
              <button
                key={opt}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  period === opt ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
                onClick={() => setPeriod(opt)}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <DatePicker
              selected={dateFrom}
              onChange={(date) => setDateFrom(date)}
              placeholderText="From"
              className="border rounded px-2 py-1 text-sm w-32"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <DatePicker
              selected={dateTo}
              onChange={(date) => setDateTo(date)}
              placeholderText="To"
              className="border rounded px-2 py-1 text-sm w-32"
              dateFormat="yyyy-MM-dd"
            />
          </div>
        </div>

        <button
          onClick={() => downloadExport(activeTab === 'customers' ? 'customer' : activeTab === 'products' ? 'product' : 'sales')}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* ===== SALES TAB ===== */}
      {activeTab === 'sales' && (
        <>
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
        </>
      )}

      {/* ===== PRODUCTS TAB ===== */}
      {activeTab === 'products' && (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sold</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productData.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No data</td></tr>
              ) : productData.map((prod, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{prod.product__name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prod.product__sku || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{prod.total_sold}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{formatCurrency(prod.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== CUSTOMERS TAB ===== */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customerData.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No data</td></tr>
              ) : customerData.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{c.order_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{formatCurrency(c.total_spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
