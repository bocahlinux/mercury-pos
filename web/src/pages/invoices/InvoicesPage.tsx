import React, { useEffect, useState } from "react";
import api from "@/api/client";
import { format } from "date-fns";
import { FiDownload, FiInfo } from "react-icons/fi";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-200",
  paid: "bg-green-200",
  overdue: "bg-red-200",
  cancelled: "bg-gray-200",
};

interface Invoice {
  id: number;
  invoice_number: string;
  status: string;
  issued_date: string;
  total: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(value);

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [dateFrom, setDateFrom] = useState("" as string);
  const [dateTo, setDateTo] = useState("" as string);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.get<Invoice[]>("/invoices/", {
        params,
      });
      setInvoices(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const generatePDF = async (id: number) => {
    try {
      const res = await api.post(
        `/invoices/${id}/generate_pdf/`
      );
      const url = res.data.pdf_url;
      window.open(url, "_blank");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Invoices</h1>
      <div className="flex space-x-2 mb-4">
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <button
          onClick={fetchInvoices}
          className="bg-blue-500 text-white px-4 py-1 rounded"
        >
          Filter
        </button>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invoice
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Issued
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={5} className="text-center py-4">
                Loading...
              </td>
            </tr>
          ) : invoices.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-4">
                No invoices found.
              </td>
            </tr>
          ) : (
            invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{inv.invoice_number}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[inv.status] || "-gray-200"}`}
                  >
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {format(new Date(inv.issued_date), "dd MMM yyyy")}
                </td>
                <td className="px-6 py-4">{formatCurrency(inv.total)}</td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => generatePDF(inv.id)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Generate PDF"
                  >
                    <FiDownload />
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="text-green-600 hover:text-green-900"
                    title="View Details"
                  >
                    <FiInfo />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selectedInvoice && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setSelectedInvoice(null)}
        >
          <div className="bg-white rounded-lg p-6 w-96" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
            <p><strong>Number:</strong> {selectedInvoice.invoice_number}</p>
            <p><strong>Status:</strong> {selectedInvoice.status}</p>
            <p><strong>Issued:</strong> {format(new Date(selectedInvoice.issued_date), "dd MMM yyyy")}</p>
            <p><strong>Total:</strong> {formatCurrency(selectedInvoice.total)}</p>
            <button
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => setSelectedInvoice(null)}
            >Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
