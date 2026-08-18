/**
 * Generates synthetic sample image files directly in memory via Canvas 
 * to allow users to test instant compression without uploading their own files.
 */
export async function createSampleImageFiles(): Promise<File[]> {
  const createCanvasImage = (width: number, height: number, label: string, color1: string, color2: string, filename: string): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      // Draw rich vibrant gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Decorative shapes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(width * 0.3, height * 0.3, width * 0.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(width * 0.75, height * 0.7, width * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Text label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.round(width * 0.06)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, width / 2, height / 2 - 20);

      ctx.font = `${Math.round(width * 0.035)}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(`${width} × ${height} px • High Resolution Sample`, width / 2, height / 2 + 30);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], filename, { type: 'image/png' });
          resolve(file);
        }
      }, 'image/png');
    });
  };

  const file1 = await createCanvasImage(
    2560, 1440,
    'Mountain Sunset Panorama',
    '#ff7e5f', '#feb47b',
    'sample_landscape_2k.png'
  );

  const file2 = await createCanvasImage(
    1080, 1080,
    'Modern Product Showcase',
    '#6a11cb', '#2575fc',
    'sample_product_square.png'
  );

  return [file1, file2];
}
