const QR_PREFIX = 'eduquest://groups/';
const CODE_PATTERN = /^[A-Z0-9]{4,8}$/;

export type GroupReference = { kind: 'code'; code: string; token?: string } | { kind: 'id'; id: number };

export const buildGroupQrValue = (code: string, token?: string) =>
  `${QR_PREFIX}${code}${token ? `?token=${encodeURIComponent(token)}` : ''}`;

export const normalizeGroupCode = (value: string) => value.replace(/[\s#-]/g, '').toUpperCase();

export const parseGroupQrValue = (value: string): GroupReference | null => {
  const trimmed = value.trim();
  const withoutPrefix = trimmed.toLowerCase().startsWith(QR_PREFIX) ? trimmed.slice(QR_PREFIX.length) : trimmed;
  const [raw, query = ''] = withoutPrefix.split('?');
  const tokenMatch = query.match(/(?:^|&)token=([^&]+)/);
  const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : undefined;
  if (/^\d+$/.test(raw) && raw.length < 6) {
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? { kind: 'id', id } : null;
  }
  const code = normalizeGroupCode(raw);
  return CODE_PATTERN.test(code) ? { kind: 'code', code, token } : null;
};
