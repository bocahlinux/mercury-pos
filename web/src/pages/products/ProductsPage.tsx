import React, { useEffect, useState, Fragment } from 'react';
import api from '@/api/client';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';

const unitOptions = [
  { value: 'pcs', label: 'pcs' },
  { value: 'liter', label: 'liter' },
  { value: 'kg', label: 'kg' },
  { value: 'box', label: 'box' },
];

const schema = z.object({
  name: z.string().min(1, 'Required'),
  sku: z.string().min(1, 'Required'),
  barcode: z.string().optional(),
  description: z.string().optional(),
  category: z.string().min(1, 'Required'),
  buy_price: z.number().nonnegative(),
  sell_price: z.number().nonnegative(),
  stock: z.number().nonnegative(),
  min_stock_alert: z.number().nonnegative(),
  unit: z.enum(['pcs', 'liter', 'kg', 'box']),
  is_active: z.boolean(),
});

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      description: '',
      category: '',
      buy_price: 0,
      sell_price: 0,
      stock: 0,
      min_stock_alert: 0,
      unit: 'pcs',
      is_active: true,
    },
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/products/', {
        params: { search, category: categoryFilter },
      });
      setProducts(res.data?.results || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/products/categories/');
      setCategories(res.data?.results || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, categoryFilter]);
  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      if (selectedProduct) {
        await api.patch(`/products/products/${selectedProduct.id}/`, data);
      } else {
        await api.post('/products/products/', data);
      }
      setIsModalOpen(false);
      setSelectedProduct(null);
      loadProducts();
    } catch (e) {
      console.error(e);
    }
  };

  const openEdit = (product: any) => {
    setSelectedProduct(product);
    form.reset(product);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setSelectedProduct(null);
    form.reset();
    setIsModalOpen(true);
  };

  const confirmDelete = (product: any) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      await api.delete(`/products/products/${selectedProduct.id}/`);
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      loadProducts();
    } catch (e) {
      console.error(e);
    }
  };

  const formatIDR = (value: number) => {
    return 'Rp ' + value.toLocaleString('id-ID');
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Products</h1>
        <button
          onClick={openCreate}
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Product
        </button>
      </div>
      <div className="mb-4 flex space-x-4">
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-64"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-4 text-center">Loading...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center">No products found.</td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className={p.stock <= p.min_stock_alert ? 'text-red-600' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">{p.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{p.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{p.category_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatIDR(p.sell_price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{p.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={
                        p.is_active
                          ? 'bg-green-100 text-green-800 px-2 py-0.5 rounded-md'
                          : 'bg-red-100 text-red-800 px-2 py-0.5 rounded-md'
                      }
                    >
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => openEdit(p)} className="text-indigo-600 hover:text-indigo-900">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => confirmDelete(p)} className="text-red-600 hover:text-red-900">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={() => setIsModalOpen(false)}>
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black opacity-30" />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  {selectedProduct ? 'Edit Product' : 'Add Product'}
                </Dialog.Title>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <Controller
                        name="name"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <input
                            {...field}
                            type="text"
                            className="mt-1 block w-full border rounded px-3 py-2"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SKU</label>
                      <Controller
                        name="sku"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <input
                            {...field}
                            type="text"
                            className="mt-1 block w-full border rounded px-3 py-2"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Barcode</label>
                      <Controller
                        name="barcode"
                        control={form.control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            className="mt-1 block w-full border rounded px-3 py-2"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <Controller
                        name="category"
                        control={form.control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="mt-1 block w-full border rounded px-3 py-2"
                          >
                            <option value="">Select category</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit</label>
                      <Controller
                        name="unit"
                        control={form.control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="mt-1 block w-full border rounded px-3 py-2"
                          >
                            {unitOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Buy Price</label>
                      <Controller
                        name="buy_price"
                        control={form.control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            step="0.01"
                            className="mt-1 block w-full border rounded px-3 py-2"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sell Price</label>
                      <Controller
                        name="sell_price"
                        control={form.control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            step="0.01"
                            className="mt-1 block w-full border rounded px-3 py-2"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stock</label>
                      <Controller
                        name="stock"
                        control={form.control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            className="mt-1 block w-full border rounded px-3 py-2"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Min Stock Alert</label>
                      <Controller
                        name="min_stock_alert"
                        control={form.control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            className="mt-1 block w-full border rounded px-3 py-2"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <Controller
                        name="description"
                        control={form.control}
                        render={({ field }) => (
                          <textarea
                            {...field}
                            className="mt-1 block w-full border rounded px-3 py-2"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="inline-flex items-center">
                        <Controller
                          name="is_active"
                          control={form.control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          )}
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
                    >Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700">
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation */}
      <Transition appear show={isDeleteDialogOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsDeleteDialogOpen(false)}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black opacity-30" />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 mt-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  Delete Product
                </Dialog.Title>
                <Dialog.Description className="mt-4">
                  <p>Are you sure you want to delete this product?</p>
                </Dialog.Description>
                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
                  >Cancel</button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700"
                  >Delete</button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default ProductsPage;
