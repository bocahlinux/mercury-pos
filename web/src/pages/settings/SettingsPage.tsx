import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { getSettings, updateSettings } from '@/api/client';
import { Settings } from '@/types/settings';

const SettingsPage: React.FC = () => {
  const { register, handleSubmit, control, setValue, reset } = useForm<Settings>();
  const [loading, setLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [currentId, setCurrentId] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getSettings();
        if (data) {
          setCurrentId(data.id);
          reset({
            name: data.name,
            address: data.address,
            phone: data.phone,
            email: data.email,
            tax_percent: data.tax_percent,
            currency: data.currency,
            receipt_header: data.receipt_header,
            receipt_footer: data.receipt_footer,
          });
          if (data.logo) setLogoPreview(data.logo);
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [reset]);

  const onSubmit = async (data: Settings) => {
    if (currentId === null) return;
    try {
      const payload: Partial<Settings> = { ...data };
      if (typeof payload.logo !== 'string') delete payload.logo;
      await updateSettings(currentId, payload);
      toast.success('Pengaturan berhasil disimpan');
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat menyimpan');
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      setValue('logo', result, { shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Pengaturan</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informasi Toko */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-medium mb-3">Informasi Toko</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Nama Toko</label>
              <input
                type="text"
                {...register('name', { required: true })}
                className="mt-1 block w-full rounded border-gray-300 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Alamat</label>
              <textarea
                {...register('address')}
                className="mt-1 block w-full rounded border-gray-300 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Telepon</label>
              <input
                type="tel"
                {...register('phone')}
                className="mt-1 block w-full rounded border-gray-300 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                {...register('email')}
                className="mt-1 block w-full rounded border-gray-300 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Logo</label>
              <input type="file" accept="image/*" onChange={handleLogoChange} className="mt-1 block" />
              {logoPreview && (
                <img src={logoPreview} alt="Logo" className="mt-2 h-24 w-auto" />
              )}
            </div>
          </div>
        </div>

        {/* Pajak & Mata Uang */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-medium mb-3">Pajak & Mata Uang</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Tax Percent</label>
              <input
                type="number"
                step="0.01"
                {...register('tax_percent', { valueAsNumber: true })}
                className="mt-1 block w-full rounded border-gray-300 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Currency</label>
              <input
                type="text"
                {...register('currency')}
                className="mt-1 block w-full rounded border-gray-300 p-2"
              />
            </div>
          </div>
        </div>

        {/* Struk */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-medium mb-3">Struk</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium">Receipt Header</label>
              <textarea
                {...register('receipt_header')}
                className="mt-1 block w-full rounded border-gray-300 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Receipt Footer</label>
              <textarea
                {...register('receipt_footer')}
                className="mt-1 block w-full rounded border-gray-300 p-2"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Simpan
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;
