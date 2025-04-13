"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";

type Position = "top" | "bottom" | "custom";

interface ReviewsConfigFormProps {
  defaultConfig?: {
    custom_selector?: string;
    review_position?: string;
    position_type?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  onSave: (config: any) => Promise<void>;
}

const PRESET_COLORS = [
  { primary: "#7e3af2", secondary: "#c4b5fd", name: "Roxo" },
  { primary: "#2563eb", secondary: "#93c5fd", name: "Azul" },
  { primary: "#16a34a", secondary: "#86efac", name: "Verde" },
  { primary: "#dc2626", secondary: "#fca5a5", name: "Vermelho" },
  { primary: "#ea580c", secondary: "#fdba74", name: "Laranja" },
  { primary: "#4b5563", secondary: "#d1d5db", name: "Cinza" },
];

export default function ReviewsConfigForm({ defaultConfig = {}, onSave }: ReviewsConfigFormProps) {
  const [positionType, setPositionType] = useState<Position>(defaultConfig.position_type as Position || (defaultConfig.review_position === 'custom' ? 'custom' : 'bottom'));
  const [cssSelector, setCssSelector] = useState(defaultConfig.custom_selector || "");
  const [customCSS, setCustomCSS] = useState(defaultConfig.custom_css || "");
  const [displayFormat, setDisplayFormat] = useState(defaultConfig.display_format || "padrão");
  const [systemStatus, setSystemStatus] = useState(defaultConfig.status || "");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      
      alert("As configurações de reviews foram salvas com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Ocorreu um erro ao salvar as configurações de reviews.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePositionChange = (value: Position) => {
    setPositionType(value);
    if (value === "custom") {
      setShowPositionDialog(true);
    }
  };
  
  const applyColorScheme = (primary: string, secondary: string) => {
    setPrimaryColor(primary);
    setSecondaryColor(secondary);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="position-type" className="block mb-2 font-medium">
          Posição dos Reviews:
        </Label>
        <select
          id="position-type"
          value={positionType}
          onChange={(e) => setPositionType(e.target.value as Position)}
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCssSelector(e.target.value)}
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomCSS(e.target.value)}
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
  );
}
