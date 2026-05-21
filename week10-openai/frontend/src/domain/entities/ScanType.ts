export type ScanMode = 'UPLOAD_FILES' | 'DIRECT_CODE' | 'URL'

export const ALLOWED_EXTENSIONS = ['.js', '.ts', '.py', '.go', '.rs']

export function isValidExtension(filename: string): boolean {
  return ALLOWED_EXTENSIONS.some(ext => filename.endsWith(ext))
}
