import React, { useEffect, useState, useCallback } from "react";
import api from "@/api/client";
import { format } from "date-fns";
import { FiDownload, FiInfo, FiCheck, FiX, FiSearch } from "react-icons/fi";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const statusOptions = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

interface Invoice {
  id: number;
  invoice_number: string;
  status: string;
  issued_date: string;
  due_date: string | null;
  total: number;
  customer_name: string;
  pdf_file: string | null;
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
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.invoice_number = searchQuery;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.get("/invoices/invoices/", { params });
      const data = res.data;
      setInvoices(Array.isArray(data) ? data : data.results ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const fetchDetail = async (inv: Invoice) => {
    setSelectedInvoice(inv);
    setDetailLoading(true);
    try {
      const res = await api.get(`/invoices/invoices/${inv.id}/`);
      setDetailData(res.data);
    } catch (e) {
      console.error(e);
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const generatePDF = async (id: number) => {
    try {
      const res = await api.post(`/invoices/invoices/${id}/generate_pdf/`);
      const url = res.data.pdf_url;
      if (url) {
        window.open(url, "_blank");
      } else {
        alert("PDF generated. Refresh to see the link.");
        fetchInvoices();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF");
    }
  };

  const markPaid = async (id: number) => {
    if (!confirm("Mark this invoice as paid?")) return;
    try {
      await api.post(`/invoices/invoices/${id}/mark_paid/`);
      fetchInvoices();
      if (selectedInvoice?.id === id) {
        setSelectedInvoice({ ...selectedInvoice, status: "paid" });
      }
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to mark as paid");
    }
  };

  const cancelInvoice = async (id: number) => {
    if (!confirm("Cancel this invoice?")) return;
    try {
      await api.post(`/invoices/invoices/${id}/cancel/`);
      fetchInvoices();
      if (selectedInvoice?.id === id) {
        setSelectedInvoice({ ...selectedInvoice, status: "cancelled" });
      }
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to cancel invoice");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Invoices</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-1">
          <FiSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
          placeholder="From"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
          placeholder="To"
        />
        <button
          onClick={fetchInvoices}
          className="bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600"
        >
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-4">No invoices found.</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                  <td className="px-4 py-3">{inv.customer_name || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[inv.status] || "bg-gray-100"}`}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {format(new Date(inv.issued_date), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {inv.due_date ? format(new Date(inv.due_date), "dd MMM yyyy") : "-"}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(inv.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => fetchDetail(inv)} className="text-blue-600 hover:text-blue-800" title="View Details">
                        <FiInfo size={16} />
                      </button>
                      <button onClick={() => generatePDF(inv.id)} className="text-indigo-600 hover:text-indigo-800" title="Generate PDF">
                        <FiDownload size={16} />
                      </button>
                      {inv.status === "pending" && (
                        <>
                          <button onClick={() => markPaid(inv.id)} className="text-green-600 hover:text-green-800" title="Mark Paid">
                            <FiCheck size={16} />
                          </button>
                          <button onClick={() => cancelInvoice(inv.id)} className="text-red-600 hover:text-red-800" title="Cancel">
                            <FiX size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => { setSelectedInvoice(null); setDetailData(null); }}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-11/12 md:w-2/3 lg:w-1/2 p-6 relative max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setSelectedInvoice(null); setDetailData(null); }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">Invoice {selectedInvoice.invoice_number}</h2>

            {detailLoading ? (
              <p className="text-gray-500">Loading details...</p>
            ) : detailData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Status:</strong>{" "}
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[detailData.status] || "bg-gray-100"}`}>
                      {detailData.status}
                    </span>
                  </div>
                  <div><strong>Total:</strong> {formatCurrency(detailData.total)}</div>
                  <div><strong>Issued:</strong> {format(new Date(detailData.issued_date), "dd MMM yyyy")}</div>
                  <div><strong>Due:</strong> {detailData.due_date ? format(new Date(detailData.due_date), "dd MMM yyyy") : "-"}</div>
                  <div><strong>Customer:</strong> {detailData.customer_name || "-"}</div>
                </div>

                {detailData.notes && (
                  <div>
                    <strong>Notes:</strong>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{detailData.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => generatePDF(selectedInvoice.id)}
                    className="bg-indigo-500 text-white px-4 py-2 rounded text-sm hover:bg-indigo-600"
                  >
                    Generate PDF
                  </button>
                  {selectedInvoice.status === "pending" && (
                    <>
                      <button
                        onClick={() => markPaid(selectedInvoice.id)}
                        className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600"
                      >
                        Mark Paid
                      </button>
                      <button
                        onClick={() => cancelInvoice(selectedInvoice.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p><strong>Status:</strong> {selectedInvoice.status}</p>
                <p><strong>Issued:</strong> {format(new Date(selectedInvoice.issued_date), "dd MMM yyyy")}</p>
                <p><strong>Total:</strong> {formatCurrency(selectedInvoice.total)}</p>
                <p className="text-gray-500 text-sm">Failed to load full details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
