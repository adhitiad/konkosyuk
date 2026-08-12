'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Upload, AlertTriangle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { apiClient } from '@/lib/axios';
import { apiGet } from '@/lib/api.client';

interface RegionOption {
  id: string;
  name: string;
}

export default function ProfileSettingsPage() {
  const { data: session, isPending, error } = useSession();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<RegionOption[]>([]);
  const [cities, setCities] = useState<RegionOption[]>([]);
  const [districts, setDistricts] = useState<RegionOption[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  useEffect(() => {
    if (error) {
      setFormError('Gagal memuat sesi. Silakan login kembali.');
      return;
    }

    if (!isPending && !session) {
      router.push('/login');
    }
    if (session?.user) {
      const user = session.user as any;
      setName(user.name || '');
      setPhone(user.phone || '');
      setProvince(user.province || '');
      setCity(user.city || '');
      setDistrict(user.district || '');
      setImagePreview(user.image || null);
    }
  }, [session, isPending, error, router]);

  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const data = await apiGet<RegionOption[]>('/api/proxy/wilayah/provinces.json');
        setProvinces(data);
      } catch (err) {
        console.error('Gagal fetch provinsi', err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (!province) {
      setCities([]);
      setCity('');
      setDistricts([]);
      setDistrict('');
      return;
    }
    const selectedProvince = provinces.find((p) => p.name === province);
    if (!selectedProvince) return;

    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const data = await apiGet<RegionOption[]>(`/api/proxy/wilayah/regencies/${selectedProvince.id}.json`);
        setCities(data);
      } catch (err) {
        console.error('Gagal fetch kota', err);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [province, provinces]);

  useEffect(() => {
    if (!city) {
      setDistricts([]);
      setDistrict('');
      return;
    }
    const selectedCity = cities.find((c) => c.name === city);
    if (!selectedCity) return;

    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const data = await apiGet<RegionOption[]>(`/api/proxy/wilayah/districts/${selectedCity.id}.json`);
        setDistricts(data);
      } catch (err) {
        console.error('Gagal fetch kecamatan', err);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [city, cities]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError(null);
    setLoading(true);

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      
      setImageFile(compressedFile);
      setImagePreview(URL.createObjectURL(compressedFile));
      console.log(`Ukuran asli: ${(file.size / 1024 / 1024).toFixed(2)} MB -> Terkompresi: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (err) {
      setFormError('Gagal mengompres gambar.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      let imageUrl = session?.user.image || null;
      
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        
        const { data: uploadData } = await apiClient.post('/api/user/upload-avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (uploadData.error) throw new Error(uploadData.error || 'Gagal upload');
        imageUrl = uploadData.url;
      }

      const res = await apiClient.patch('/api/user/profile', { 
        name, 
        phone, 
        image: imageUrl,
        province,
        city,
        district,
      })

      if (res.status >= 400) throw new Error('Gagal update profil');

      router.refresh();
      alert('Profil berhasil diperbarui!');
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (isPending) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!session) return null;

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan Profil</h1>
        <p className="text-muted-foreground">Kelola informasi pribadi Anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foto Profil</CardTitle>
          <CardDescription>Otomatis dikompresi menjadi maksimal 500KB</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24 border-2 border-primary/20">
            <AvatarImage src={imagePreview || undefined} alt={name} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex items-center gap-2">
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={loading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('avatar')?.click()}
              disabled={loading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {imagePreview ? 'Ganti Foto' : 'Upload Foto'}
            </Button>
            {imageFile && (
              <span className="text-xs text-muted-foreground">
                ({(imageFile.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
              {(session.user as any).role === 'owner' && (
                <p className="text-xs text-amber-600 font-medium">
                  ⚠️ Nama HARUS sama dengan KTP/Buku Tabungan untuk pencairan dana
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={session.user.email || ''} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0812xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Provinsi</Label>
              <Select
                value={province}
                onValueChange={(value) => {
                  setProvince(value ?? '');
                  setCity('');
                  setDistrict('');
                }}
                disabled={loadingProvinces || loading}
              >
                <SelectTrigger id="province">
                  <SelectValue placeholder={loadingProvinces ? 'Memuat provinsi...' : 'Pilih Provinsi'} />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((prov) => (
                    <SelectItem key={prov.id} value={prov.name}>{prov.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Kota/Kabupaten</Label>
              <Select
                value={city}
                onValueChange={(value) => {
                  setCity(value ?? '');
                  setDistrict('');
                }}
                disabled={!province || loadingCities || loading}
              >
                <SelectTrigger id="city">
                  <SelectValue placeholder={loadingCities ? 'Memuat kota...' : (!province ? 'Pilih provinsi dahulu' : 'Pilih Kota/Kabupaten')} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">Kecamatan</Label>
              <Select
                value={district}
                onValueChange={(value) => setDistrict(value ?? '')}
                disabled={!city || loadingDistricts || loading}
              >
                <SelectTrigger id="district">
                  <SelectValue placeholder={loadingDistricts ? 'Memuat kecamatan...' : (!city ? 'Pilih kota dahulu' : 'Pilih Kecamatan')} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
