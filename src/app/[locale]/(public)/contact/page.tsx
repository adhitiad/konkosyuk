"use client";

import { StaticPageLayout } from "@/components/static-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <StaticPageLayout title="Hubungi Kami">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h2>Informasi Kontak</h2>
          <p className="text-muted-foreground">
            Tim support kami siap membantu Anda. Hubungi kami melalui channel di
            bawah ini.
          </p>
          {/* <div className="mt-4 space-y-3">
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:support@konkosyuk.com" className="text-primary hover:underline">
                support@konkosyuk.com
              </a>
            </p>
            <p>
              <strong>WhatsApp:</strong>{' '}
              <a href="https://wa.me/6281234567890" className="text-primary hover:underline">
                +62 812-3456-7890
              </a>
            </p>
            <p>
              <strong>Alamat Kantor:</strong>
              <br />
              Jl. Sudirman No. 123, Jakarta Selatan, Indonesia
            </p>
          </div> */}
        </div>

        <div>
          <h2>Kirim Pesan</h2>
          {submitted ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              Pesan Anda telah diterima. Tim kami akan merespons dalam 1x24 jam.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama</Label>
                <Input id="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subjek</Label>
                <Input id="subject" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Pesan</Label>
                <Textarea id="message" rows={5} required />
              </div>
              <Button type="submit">Kirim Pesan</Button>
            </form>
          )}
        </div>
      </div>
    </StaticPageLayout>
  );
}
