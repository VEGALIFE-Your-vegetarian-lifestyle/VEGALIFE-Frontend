import JSZip from 'jszip'
import type { VisualizationExportItem } from '@/types/visualization'

export async function exportVisualizationsAsZip(items: VisualizationExportItem[]): Promise<Blob> {
  const zip = new JSZip()
  items.forEach((item) => zip.file(item.filename, item.content))
  return zip.generateAsync({ type: 'blob' })
}
