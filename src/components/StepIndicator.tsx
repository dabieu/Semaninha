import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { id: 1, title: 'Conectar', description: 'Login musical' },
  { id: 2, title: 'Configurar', description: 'Tamanho e período' },
  { id: 3, title: 'Gerar', description: 'Criando colagem' },
  { id: 4, title: 'Compartilhar', description: 'Sua colagem' }
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4 md:space-x-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  currentStep > step.id
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : currentStep === step.id
                    ? 'bg-slate-700 text-white border-emerald-500'
                    : 'bg-transparent text-slate-400 border-slate-600'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <div className="text-white text-sm font-medium">{step.title}</div>
                <div className="text-white/70 text-xs hidden md:block">{step.description}</div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="w-8 md:w-16 h-0.5 bg-slate-600 mx-4 hidden sm:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}