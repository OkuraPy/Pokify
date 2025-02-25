'use client';

import { useState, useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Image as ImageIcon,
  Heading,
  Upload,
  Link as LinkIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!editor) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const insertImage = () => {
    // Se estamos na aba de upload e temos um preview, usamos ele
    if (activeTab === 'upload' && previewUrl) {
      editor.chain().focus().setImage({ src: previewUrl }).run();
    } 
    // Se estamos na aba de URL e temos uma URL, usamos ela
    else if (activeTab === 'url' && imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }

    // Limpa os estados
    setImageUrl('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageDialogOpen(false);
  };

  const cancelImageInsert = () => {
    // Limpa os estados
    setImageUrl('');
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setImageDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1 p-2 mb-2 border border-border/60 rounded-t-md bg-secondary/5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-secondary/20' : ''}
          type="button"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-secondary/20' : ''}
          type="button"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-secondary/20' : ''}
          type="button"
        >
          <Heading className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-secondary/20' : ''}
          type="button"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-secondary/20' : ''}
          type="button"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setImageDialogOpen(true)}
          type="button"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Imagem</DialogTitle>
            <DialogDescription>
              Adicione uma imagem ao conteúdo da descrição
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                URL
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="py-4">
              <div className="space-y-4">
                <Label htmlFor="image-upload">Selecione uma imagem do seu computador</Label>
                <div 
                  className="border-2 border-dashed border-border/60 rounded-lg p-6 cursor-pointer hover:bg-secondary/5 transition-colors flex flex-col items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    id="image-upload" 
                    className="sr-only" 
                    accept="image/*" 
                    onChange={handleFileChange}
                  />
                  {previewUrl ? (
                    <div className="space-y-2 w-full">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-48 mx-auto object-contain rounded-md" 
                      />
                      <p className="text-xs text-center text-muted-foreground">
                        {selectedFile?.name} ({Math.round(selectedFile?.size || 0) / 1024} KB)
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Clique para selecionar ou arraste uma imagem aqui
                      </p>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="url" className="py-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">URL da Imagem</Label>
                <Input 
                  id="image-url" 
                  type="url" 
                  placeholder="https://exemplo.com/imagem.jpg" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Cole o endereço da imagem que deseja inserir
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={cancelImageInsert}>
              Cancelar
            </Button>
            <Button onClick={insertImage} disabled={(activeTab === 'upload' && !previewUrl) || (activeTab === 'url' && !imageUrl)}>
              Inserir Imagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border border-border/60 rounded-md overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="p-3 min-h-[200px] prose prose-sm max-w-none focus:outline-none"
      />
    </div>
  );
} 