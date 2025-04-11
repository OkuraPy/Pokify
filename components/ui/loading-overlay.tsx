import React from "react";

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-4 shadow-lg">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 rounded-full border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent animate-spin" />
          <span className="mt-2 text-sm font-medium">Carregando...</span>
        </div>
      </div>
    </div>
  );
} 