import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/api/client';
import { Button } from '@/components/common/Button';
import { Dialog, DialogOverlay, DialogTitle } from '@headlessui/react';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
});

// Types
interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category: number;
  category_name: string;
  buy_price: number;
  sell_price: number;
  stock: number;
  min_stock_alert: number;
  unit: string;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
}

// Validation schema
const productSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Nama produk wajib diisi'),
  sku: z.string().min(1, 'SKU wajib diisi'),
  barcode: z.string().optional(),
  description: z.string().optional(),
  category: z.number({ required_error: 'Kategori wajib dipilih' }),
  buy_price: z.coerce.number().nonnegative('Harga beli tidak boleh negatif'),
  sell_price: z.coerce.number().nonnegative('Harga jual tidak boleh negatif'),
  stock: z.coerce.number().int().nonnegative('Stok tidak boleh negatif'),
  min_stock_alert: z.coerce.number().int().nonnegative('Alert stok tidak boleh negatif'),
  unit: z.enum(['pcs', 'liter', 'kg', 'box']),
  is_active: z.boolean(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      description: '',
      category: 0,
      buy_price: 0,
      sell_price: 0,
      stock: 0,
      min_stock_alert: 0,
      unit: 'pcs',
      is_active: true,
    },
  });

  // Fetch products & categories
  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products/products/');
      setProducts(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/products/categories/');
      setCategories(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditingProduct(null);
    reset({
      name: '',
      sku: '',
      barcode: '',
      description: '',
      category: categories[0]?.id || 0,
      buy_price: 0,
      sell_price: 0,
      stock: 0,
      min_stock_alert: 0,
      unit: 'pcs',
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    reset({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode ?? '',
      description: product.description ?? '',
      category: product.category,
      buy_price: product.buy_price,
      sell_price: product.sell_price,
      stock: product.stock,
      min_stock_alert: product.min_stock_alert,
      unit: product.unit as any,
      is_active: product.is_active,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: ProductForm) => {
    setLoading(true);
    try {
      if (editingProduct) {
        await api.patch(`/api/products/products/${editingProduct.id}/`, data);
      } else {
        await api.post('/api/products/products/', data);
      }
      await fetchProducts();
      setModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
  };

  const performDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await api.delete(`/api/products/products/${deleteId}/`);
      await fetchProducts();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === '' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Produk</h1>
        <Button onClick={openCreate}>Tambah Produk</Button>
      </div>
      <div className="flex space-x-4 mb-4">
        <input
          type="text"
          placeholder="Cari produk…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1"
        />
        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value ? Number(e.target.value) : '')
          }
          className="input w-48"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Nama</th>
              <th className="p-2 text-left">SKU</th>
              <th className="p-2 text-left">Kategori</th>
              <th className="p-2 text-right">Harga Jual</th>
              <th className="p-2 text-right">Stok</th>
              <th className="p-2 text-center">Status</th>
              <th className="p-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.sku}</td>
                <td className="p-2">{p.category_name}</td>
                <td className="p-2 text-right">
                  {currencyFormatter.format(p.sell_price)}
                </td>
                <td className="p-2 text-right">
                  <span
                    className={
                      p.stock <= p.min_stock_alert ? 'text-red-600 font-medium' : ''
                    }
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="p-2 text-center">
                  {p.is_active ? (
                    <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs">
                      Aktif
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-xs">
                      Nonaktif
                    </span>
                  )}
                </td>
                <td className="p-2 text-center space-x-2">
                  <Button size="sm" onClick={() => openEdit(p)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => confirmDelete(p.id)}
                  >
                    Hapus
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Create/Edit */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <DialogOverlay className="fixed inset-0 bg-black opacity-30" />
          <div className="bg-white rounded max-w-2xl w-full p-6 relative z-20">
            <DialogTitle className="text-lg font-bold mb-4">
              {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
            </DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Nama</label>
                  <input
                    className="input w-full"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-red-600 text-sm">{errors.name.message?.toString()}</p>}
                </div>
                <div>
                  <label className="block mb-1">SKU</label>
                  <input className="input w-full" {...register('sku')} />
                  {errors.sku && <p className="text-red-600 text-sm">{errors.sku.message?.toString()}</p>}
                </div>
                <div>
                  <label className="block mb-1">Barcode</label>
                  <input className="input w-full" {...register('barcode')} />
                </div>
                <div>
                  <label className="block mb-1">Kategori</label>
                  <select className="input w-full" {...register('category')}>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-600 text-sm">{errors.category.message?.toString()}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block mb-1">Deskripsi</label>
                  <textarea className="input w-full" rows={3} {...register('description')} />
                </div>
                <div>
                  <label className="block mb-1">Harga Beli</label>
                  <input type="number" className="input w-full" {...register('buy_price')} />
                  {errors.buy_price && <p className="text-red-600 text-sm">{errors.buy_price.message?.toString()}</p>}
                </div>
                <div>
                  <label className="block mb-1">Harga Jual</label>
                  <input type="number" className="input w-full" {...register('sell_price')} />
                  {errors.sell_price && <p className="text-red-600 text-sm">{errors.sell_price.message?.toString()}</p>}
                </div>
                <div>
                  <label className="block mb-1">Stok</label>
                  <input type="number" className="input w-full" {...register('stock')} />
                  {errors.stock && <p className="text-red-600 text-sm">{errors.stock.message?.toString()}</p>}
                </div>
                <div>
                  <label className="block mb-1">Alert Stok Minimum</label>
                  <input type="number" className="input w-full" {...register('min_stock_alert')} />
                  {errors.min_stock_alert && <p className="text-red-600 text-sm">{errors.min_stock_alert.message?.toString()}</p>}
                </div>
                <div>
                  <label className="block mb-1">Satuan</label>
                  <select className="input w-full" {...register('unit')}>
                    <option value="pcs">pcs</option>
                    <option value="liter">liter</option>
                    <option value="kg">kg</option>
                    <option value="box">box</option>
                  </select>
                  {errors.unit && <p className="text-red-600 text-sm">{errors.unit.message?.toString()}</p>}
                </div>
                <div className="flex items-center mt-2">
                  <input type="checkbox" className="mr-2" {...register('is_active')} />
                  <label>Aktif</label>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} className="fixed inset-0 z-20 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <DialogOverlay className="fixed inset-0 bg-black opacity-30" />
          <div className="bg-white rounded max-w-sm w-full p-6 relative z-30">
            <DialogTitle className="text-lg font-bold mb-4">Konfirmasi Hapus</DialogTitle>
            <p>Apakah Anda yakin ingin menghapus produk ini?</p>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setDeleteId(null)}>
                Batal
              </Button>
              <Button variant="danger" onClick={performDelete} disabled={loading}>
                {loading ? 'Menghapus...' : 'Hapus'}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
