export function formatChurchLocationAddress(location: {
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  cep?: string | null;
}) {
  const addressLine = [location.street, location.number, location.complement]
    .filter(Boolean)
    .join(", ");
  const cityLine = [location.neighborhood, location.city, location.state]
    .filter(Boolean)
    .join(" - ");

  return [
    addressLine,
    cityLine,
    location.cep ? `CEP: ${location.cep}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}
