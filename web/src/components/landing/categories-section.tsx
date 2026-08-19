import { Building2, Home } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "@/config";

const categories = [
  {
    icon: Building2,
    title: "Kost",
    description: "Kost bulanan & harian",
    href: "/properties?type=kost",
  },
  {
    icon: Home,
    title: "Kontrakan",
    description: "Rumah & petak",
    href: "/properties?type=kontrakan",
  },
];

export function CategoriesSection() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          Jelajahi Berdasarkan <span className="text-primary">Kategori</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Pilih tipe hunian yang sesuai dengan kebutuhanmu.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link href={category.href} key={category.title}>
              <Card className="group h-full cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex flex-col items-center gap-4 p-8 text-center">
                  <div className="rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <category.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold">{category.title}</h3>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
