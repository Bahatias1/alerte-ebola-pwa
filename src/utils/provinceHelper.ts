export function normalizeProvince(input: string | null | undefined): string {
  if (!input) return '';
  let str = input.toLowerCase().trim();
  
  // Remove accents
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Remove province markers
  str = str
    .replace("province de ", "")
    .replace("province du ", "")
    .replace("province ", "")
    .replace("province", "")
    .replace("l'", "")
    .replace("le ", "")
    .replace("la ", "")
    .trim();
    
  // Replace spaces with hyphens
  str = str.replace(/\s+/g, "-");
  
  return str.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
}
