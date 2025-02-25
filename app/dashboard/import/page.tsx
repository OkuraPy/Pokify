"use client"

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Link, Image as ImageIcon, Languages, Wand2 } from 'lucide-react';

interface ImportedProduct {
  title: string;
  description: string;
  price: number;
  images: string[];
}

const demoProduct: ImportedProduct = {
  title: "Modern Minimalist Desk Lamp",
  description: "Elegant desk lamp with adjustable arm and touch-sensitive controls. Perfect for home office or bedside table.",
  price: 29.99,
  images: Array(4).fill("https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"),
};

export default function ImportPage() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<ImportedProduct | null>(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [translateEnabled, setTranslateEnabled] = useState(false);

  const handleImport = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProduct(demoProduct);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Import Product</CardTitle>
          <CardDescription>Import products from AliExpress to your store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Paste AliExpress product URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleImport} disabled={isLoading || !url}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Product'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {product && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
                <CardDescription>Edit product information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" defaultValue={product.title} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    defaultValue={product.description}
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    defaultValue={product.price}
                    step="0.01"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center space-x-2">
                    <Wand2 className="h-4 w-4 text-primary" />
                    <Label htmlFor="ai-optimization">AI Optimization</Label>
                  </div>
                  <Switch
                    id="ai-optimization"
                    checked={aiEnabled}
                    onCheckedChange={setAiEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Languages className="h-4 w-4 text-primary" />
                    <Label htmlFor="translation">Auto-Translation</Label>
                  </div>
                  <Switch
                    id="translation"
                    checked={translateEnabled}
                    onCheckedChange={setTranslateEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Suggestions</CardTitle>
                <CardDescription>AI-powered content improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg border">
                    <p className="text-sm">
                      💡 Consider adding "USB-C charging port" and "3 color temperatures" to highlight modern features
                    </p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg border">
                    <p className="text-sm">
                      💡 Mention "energy-efficient LED" to appeal to eco-conscious buyers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>Drag to reorder images</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {product.images.map((image, index) => (
                    <motion.div
                      key={index}
                      className="aspect-square rounded-lg border bg-card relative overflow-hidden group"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <img
                        src={image}
                        alt={`Product image ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="icon">
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Product card preview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-card overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={product.images[0]}
                      alt="Product preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-1">{product.title}</h3>
                    <p className="text-2xl font-bold">${product.price}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}