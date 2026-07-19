export const bookingStatusOptions = [
  { value: "pending", label: "Pendiente", hint: "Esperando confirmación" },
  { value: "pending_payment", label: "Pago pendiente", hint: "Esperando el pago" },
  { value: "confirmed", label: "Confirmado", hint: "Turno confirmado" },
  { value: "completed", label: "Completado", hint: "El servicio ya se realizó" },
  { value: "cancelled", label: "Cancelado", hint: "El turno fue cancelado" },
  { value: "no_show", label: "No asistió", hint: "El cliente no se presentó" },
] as const;
