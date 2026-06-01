import React, { useEffect, useState } from 'react';
import api from '@/api/client';
import { Card } from '@/components/ui/card';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShoppingCart, Receipt, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
  top_products: { name: string; revenue: number }[];
  recent_transactions: {
    id: string;
    date: string;
    amount: number;
    customer: string;
  }[];
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

      {/* Top products bar chart */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.top_products} layout="vertical">
              <XAxis type="number" domain={[0, 'auto']} tickFormatter={(value) => formatter.format(value)} />
              <YAxis dataKey="name" type="category" />
              <Tooltip formatter={(value) => formatter.format(Number(value))} />
              <Bar dataKey="revenue" fill="#3b82f6" />
            </BarChart>
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
                  <td className="px-4 py-2">{new Date(tx.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-2">{tx.customer}</td>
                  <td className="px-4 py-2 text-right">{formatter.format(tx.amount)}</td>
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
