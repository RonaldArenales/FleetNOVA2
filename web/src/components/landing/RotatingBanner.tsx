import { useEffect, useState } from 'react';

const PHRASES = [
  'Monitorea tu flota de carga pesada en tiempo real, desde cualquier lugar.',
  'GPS y diagnóstico OBD-II en un solo panel: sin llamadas de más para preguntar dónde está el camión.',
  'Cada vehículo, cada alerta, cada mantenimiento — a un clic de distancia.',
  'Del taller a la carretera: control total de tu operación de transporte.',
];

export function RotatingBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % PHRASES.length), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-indigo-600 py-2.5">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1.5 px-4 lg:px-8">
        <p key={index} className="animate-fade-in text-center text-sm font-medium text-white sm:text-base">
          {PHRASES[index]}
        </p>
        <div className="flex gap-1.5">
          {PHRASES.map((phrase, i) => (
            <button
              key={phrase}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Mostrar frase ${i + 1}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
