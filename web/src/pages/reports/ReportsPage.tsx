import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BarChart, Bar, Legend } from 'recharts';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { formatCurrency } from '@/utils/currency';
import { apiClient } from '@/api/client';
import { Calendar } from 'lucide-react';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

type SalesReportItem = {
  date: string; // ISO string or formatted date
  total_sales: number;
  transaction_count: number;
};

type ProductReportItem = {
  product__name: string;
  product__sku: string;
  total_sold: number;
  revenue: number;
};

const periodOptions: Period[] = ['daily', 'weekly', 'monthly', 'yearly'];

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<Period>('daily');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [salesData, setSalesData] = useState<SalesReportItem[]>([]);
  const [productData, setProductData] = useState<ProductReportItem[]>([]);
  const [summary, setSummary] = useState({ total_sales: 0, total_transactions: 0, average_transaction: 0 });

  // Fetch sales report
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const params = new URLSearchParams({
          period,
          date_from: dateFrom,
          date_to: dateTo,
        });
        const { data } = await apiClient.get(`/api/reports/sales-report/?${params.toString()}`);
        setSalesData(data.results || data);
        // calculate summary
        const totalSales = data.results.reduce((sum: number, r: any) => sum + r.total_sales, 0);
        const totalTx = data.results.reduce((sum: number, r: any) => sum + r.transaction_count, 0);
        setSummary({
          total_sales: totalSales,
          total_transactions: totalTx,
          average_transaction: totalTx ? totalSales / totalTx : 0,
        });
      } catch (e) {
        console.error('Failed to fetch sales report', e);
      }
    };
    fetchSales();
  }, [period, dateFrom, dateTo]);

  // Fetch product report
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await apiClient.get('/api/reports/product-report/');
        setProductData(data.results || data);
      } catch (e) {
        console.error('Failed to fetch product report', e);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Period selector */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList>
          {periodOptions.map((p) => (
            <TabsTrigger key={p} value={p} className="capitalize">
              {p}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Date range pickers */}
      <div className="flex space-x-4 items-center">
        <label className="flex items-center space-x-2">
          <Calendar size={16} />
          <span>From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex items-center space-x-2">
          <Calendar size={16} />
          <span>To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatCurrency(summary.total_sales, 'IDR')}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Transactions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{summary.total_transactions}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Transaction</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatCurrency(summary.average_transaction, 'IDR')}</CardContent>
        </Card>
      </div>

      {/* Sales line chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value), 'IDR')} />
              <Line type="monotone" dataKey="total_sales" stroke="#3b82f6" name="Sales" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Transaction count bar chart */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions Count</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="transaction_count" fill="#10b981" name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Product report table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Total Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productData.map((p) => (
                <TableRow key={p.product__sku}>
                  <TableCell>{p.product__name}</TableCell>
                  <TableCell>{p.product__sku}</TableCell>
                  <TableCell className="text-right">{p.total_sold}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.revenue, 'IDR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
