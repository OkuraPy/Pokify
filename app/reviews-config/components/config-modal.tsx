"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: any) => Promise<void>;
  defaultConfig?: any;
}

export default function ConfigModal({ isOpen, onClose, onSave, defaultConfig = {} }: ConfigModalProps) {
  const [positionType, setPositionType] = useState<string>(defaultConfig.position_type || "");
  const [cssSelector, setCssSelector] = useState(defaultConfig.custom_selector || "");
  const [customCSS, setCustomCSS] = useState(defaultConfig.custom_css || "");
  const [displayFormat, setDisplayFormat] = useState(defaultConfig.display_format || "padrão");
  const [systemStatus, setSystemStatus] = useState(defaultConfig.status || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onSave({
        custom_selector: cssSelector,
        review_position: positionType,
        position_type: positionType,
        custom_css: customCSS,
        display_format: displayFormat,
        status: systemStatus
      });
      
      onClose();
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Ocorreu um erro ao salvar as configurações de reviews.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configuração de Reviews</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="position-type" className="block mb-2 font-medium">
              Posição dos Reviews:
            </Label>
            <select
              id="position-type"
              value={positionType}
              onChange={(e) => setPositionType(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Selecione uma opção</option>
              <option value="top">Topo da página</option>
              <option value="bottom">Final da página</option>
              <option value="custom">Posição personalizada</option>
            </select>
          </div>

          <div>
            <Label htmlFor="css-selector" className="block mb-2 font-medium">
              Seletor CSS Personalizado:
            </Label>
            <Input
              id="css-selector"
              placeholder="Ex: .meu-elemento-personalizado"
              value={cssSelector}
              onChange={(e) => setCssSelector(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="custom-css" className="block mb-2 font-medium">
              Personalização CSS:
            </Label>
            <Input
              id="custom-css"
              placeholder="Ex: .review-container { color: #f00; font-size: 16px; }"
              value={customCSS}
              onChange={(e) => setCustomCSS(e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">
              Estilo CSS personalizado para os reviews
            </p>
          </div>

          <div>
            <Label htmlFor="display-format" className="block mb-2 font-medium">
              Formato de Exibição:
            </Label>
            <select
              id="display-format"
              value={displayFormat}
              onChange={(e) => setDisplayFormat(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="padrão">Padrão</option>
              <option value="compacto">Compacto</option>
              <option value="expandido">Expandido</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Como os reviews serão exibidos na página
            </p>
          </div>

          <div>
            <Label htmlFor="system-status" className="block mb-2 font-medium">
              Status do Sistema:
            </Label>
            <select
              id="system-status"
              value={systemStatus}
              onChange={(e) => setSystemStatus(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Selecione o status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="teste">Modo de Teste</option>
            </select>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
