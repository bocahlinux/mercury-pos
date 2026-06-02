import React, { useEffect, useState } from 'react';
import api from '@/api/client';
import { Card } from '@/components/ui/card';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShoppingCart, Receipt, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LineChart, Line, CartesianGrid } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

interface StatCardProps {
  icon: React.ReactElement;
  label: string;
  value: React.ReactNode;
  iconClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, iconClass }) => (
  <Card className="p-4 flex items-center shadow-sm">
    <div className={iconClass}>{icon}</div>
    <div className="ml-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  </Card>
);

interface DashboardData {
  today_sales: number;
  today_transactions: number;
  week_sales: number;
  month_sales: number;
  top_products: { product__name: string; revenue: number }[];
  recent_transactions: {
    id: string;
    created_at: string;
    total: number;
    customer_name?: string;
  }[];
  recent_invoices: {
    id: string;
    invoice_number: string;
    status: string;
    total: number;
    customer_name?: string;
    issued_date: string;
  }[];
  sales_trend: { date: string; total_sales: number }[];
  payment_breakdown: { payment_method: string; total: number; count: number }[];
  category_breakdown: { product__category__name: string; total_sold: number; revenue: number }[];
}

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/reports/dashboard/');
        setData(response.data as DashboardData);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<ShoppingCart size={24} />}
          label="Today Sales"
          value={formatter.format(data.today_sales)}
        />
        <StatCard
          icon={<Receipt size={24} />}
          label="Today Transactions"
          value={data.today_transactions}
        />
        <StatCard
          icon={<Calendar size={24} />}
          label="Week Sales"
          value={formatter.format(data.week_sales)}
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          label="Month Sales"
          value={formatter.format(data.month_sales)}
        />
      </div>

      {/* Sales trend line chart */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.sales_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatter.format(Number(value))} />
              <Tooltip formatter={(value) => formatter.format(Number(value))} />
              <Line type="monotone" dataKey="total_sales" stroke="#8884d8" name="Sales" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top products bar chart and Payment method pie chart */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Top products bar chart */}
        <Card className="p-4">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_products} layout="vertical">
                <XAxis type="number" domain={[0, 'auto']} tickFormatter={(value) => formatter.format(value)} />
                <YAxis dataKey="product__name" type="category" />
                <Tooltip formatter={(value) => formatter.format(Number(value))} />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment method pie chart */}
        <Card className="p-4">
          <CardHeader>
            <CardTitle>Payment Method Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.payment_breakdown}
                  dataKey="total"
                  nameKey="payment_method"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  labelLine={false}
                  label={({ name, value, percent }) => (
                    <div>
                      {name}: {formatter.format(Number(value))} ({Number(percent * 100).toFixed(1)}%)
                    </div>
                  )}
                >
                  {data.payment_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 50}, 70%, 50%)`} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown pie chart and Recent transactions table */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Category breakdown pie chart */}
        <Card className="p-4">
          <CardHeader>
            <CardTitle>Category Sales Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.category_breakdown}
                  dataKey="revenue"
                  nameKey="product__category__name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  labelLine={false}
                  label={({ name, value, percent }) => (
                    <div>
                      {name}: {formatter.format(Number(value))} ({Number(percent * 100).toFixed(1)}%)
                    </div>
                  )}
                >
                  {data.category_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 40 + 20}, 70%, 50%)`} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent transactions table */}
        <Card className="p-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm text-left text-gray-700">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_transactions.slice(0, 10).map((tx, idx) => (
                  <tr key={tx.id} className="border-t">
                    <td className="px-4 py-2">{idx + 1}</td>
                    <td className="px-4 py-2">{new Date(tx.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-2">{tx.customer_name || '-'}</td>
                    <td className="px-4 py-2 text-right">{formatter.format(tx.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Recent invoices table */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm text-left text-gray-700">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_invoices.slice(0, 5).map((inv, idx) => (
                <tr key={inv.id} className="border-t">
                  <td className="px-4 py-2">{idx + 1}</td>
                  <td className="px-4 py-2">{new Date(inv.issued_date).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-2">{inv.customer_name || '-'}</td>
                  <td className="px-4 py-2 text-right">{formatter.format(inv.total)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        inv.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : inv.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;