import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as z from "zod";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  url: z.string().url({ message: "URL inválida" }),
  useScreenshot: z.boolean().default(true),
});

export const ImportUrlModal = ({
  isOpen,
  onClose,
  onImport,
  storeId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImport: (productData: any) => void;
  storeId: string;
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      useScreenshot: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      
      // Função para capturar screenshot da página
      const captureScreenshot = async (url: string): Promise<string> => {
        try {
          console.log("Iniciando captura de screenshot para:", url);
          const response = await axios.post('/api/screenshot', { url });
          console.log("Screenshot capturado com sucesso");
          return response.data.screenshot;
        } catch (error) {
          console.error("Erro ao capturar screenshot:", error);
          toast.error("Erro ao capturar screenshot. Prosseguindo sem imagem.");
          return "";
        }
      };
      
      // Determinar qual endpoint usar
      let endpoint = '/api/products/extract-openai';
      let requestData: any = { url: values.url };
      
      // Se o usuário optou por usar screenshot, capturar e incluir
      if (values.useScreenshot) {
        try {
          toast.loading("Capturando screenshot da página...");
          const screenshot = await captureScreenshot(values.url);
          
          if (screenshot) {
            endpoint = '/api/products/extract-vision';
            requestData.screenshot = screenshot;
            toast.dismiss();
            toast.loading("Analisando página com IA visual...");
          } else {
            toast.dismiss();
            toast.loading("Extraindo informações do produto...");
          }
        } catch (error) {
          console.error("Falha ao processar screenshot:", error);
          toast.dismiss();
          toast.loading("Extraindo informações do produto sem screenshot...");
        }
      } else {
        toast.loading("Extraindo informações do produto...");
      }
      
      // Fazer requisição para a API
      const response = await axios.post(endpoint, requestData);
      
      const productData = response.data;
      
      toast.dismiss();
      
      if (productData.error) {
        toast.error(`Erro na extração: ${productData.error}`);
        return;
      }
      
      // Estatísticas para debug
      console.log(`Produto extraído: ${productData.title}`);
      console.log(`Imagens principais: ${productData.mainImages?.length || 0}`);
      console.log(`Imagens de descrição: ${productData.descriptionImages?.length || 0}`);
      
      toast.success("Produto importado com sucesso!");
      
      onImport(productData);
      
      form.reset();
      onClose();
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Ocorreu um erro: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Importar produto por URL"
      description="Cole a URL do produto para importar automaticamente."
      isOpen={isOpen}
      onClose={onClose}
    >
      <div>
        <div className="space-y-4 py-2 pb-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do produto</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="https://www.exemplo.com/produto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="useScreenshot"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Usar análise visual (screenshot)
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Captura um screenshot da página para melhorar a identificação de imagens
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="pt-6 space-x-2 flex items-center justify-end w-full">
                <Button
                  disabled={loading}
                  variant="outline"
                  onClick={onClose}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button disabled={loading} type="submit">
                  Importar
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Modal>
  );
}; 