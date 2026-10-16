// Formatea valores en kilometros con separadores de miles/decimales en
// espanol, recortando a 3 decimales: las lecturas GPS/OBD acumulan mas
// precision de punto flotante de la que tiene sentido mostrarle al usuario
// (ej. 55033.75242104691 -> "55.033,752").
export function formatKm(value: number): string {
  return value.toLocaleString('es', { maximumFractionDigits: 3 });
}
