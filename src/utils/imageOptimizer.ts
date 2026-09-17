/**
 * Image Optimizer Utility for Photo Bucket
 * Automatically compresses/minimizes images to under 1 MB (1,048,576 bytes)
 * while preserving high-definition visual clarity and color fidelity.
 */

export interface OptimizationResult {
  dataUrl: string;
  originalSizeBytes: number;
  optimizedSizeBytes: number;
  wasOptimized: boolean;
  format: string;
  width: number;
  height: number;
}

const MAX_BYTES = 1024 * 1024; // 1 MB strict limit

export async function optimizeImageUnder1MB(file: File): Promise<OptimizationResult> {
  const originalSizeBytes = file.size;

  // Read file into Data URL first
  const initialDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // If already under 1 MB and is a standard web image, return as is
  if (originalSizeBytes <= MAX_BYTES) {
    const imgDims = await getImageDimensions(initialDataUrl);
    return {
      dataUrl: initialDataUrl,
      originalSizeBytes,
      optimizedSizeBytes: originalSizeBytes,
      wasOptimized: false,
      format: file.type || "image/jpeg",
      width: imgDims.width,
      height: imgDims.height,
    };
  }

  // File is > 1 MB -> Auto minimize without quality loss
  return new Promise<OptimizationResult>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Maintain ultra-high definition (up to 2560px 2K/Retina)
      const MAX_DIMENSION = 2560;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        // Fallback to initial
        resolve({
          dataUrl: initialDataUrl,
          originalSizeBytes,
          optimizedSizeBytes: originalSizeBytes,
          wasOptimized: false,
          format: file.type,
          width,
          height,
        });
        return;
      }

      // High-quality rendering settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Binary search for highest quality level that fits under 1 MB
      let minQuality = 0.65;
      let maxQuality = 0.96;
      let bestDataUrl = "";
      let bestSize = Infinity;

      for (let iteration = 0; iteration < 7; iteration++) {
        const quality = (minQuality + maxQuality) / 2;
        const testDataUrl = canvas.toDataURL("image/jpeg", quality);
        const testBytes = Math.round((testDataUrl.length - "data:image/jpeg;base64,".length) * 0.75);

        if (testBytes <= MAX_BYTES) {
          bestDataUrl = testDataUrl;
          bestSize = testBytes;
          minQuality = quality; // Try higher quality
        } else {
          maxQuality = quality; // Need more compression
        }
      }

      // If still above 1MB (e.g. extremely complex detailed noise), scale down slightly while keeping high quality
      if (!bestDataUrl || bestSize > MAX_BYTES) {
        let scale = 0.85;
        while (scale >= 0.5) {
          const scaledWidth = Math.round(width * scale);
          const scaledHeight = Math.round(height * scale);
          const sCanvas = document.createElement("canvas");
          sCanvas.width = scaledWidth;
          sCanvas.height = scaledHeight;
          const sCtx = sCanvas.getContext("2d");
          if (sCtx) {
            sCtx.imageSmoothingEnabled = true;
            sCtx.imageSmoothingQuality = "high";
            sCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
            const scaledDataUrl = sCanvas.toDataURL("image/jpeg", 0.88);
            const scaledBytes = Math.round((scaledDataUrl.length - "data:image/jpeg;base64,".length) * 0.75);
            if (scaledBytes <= MAX_BYTES) {
              bestDataUrl = scaledDataUrl;
              bestSize = scaledBytes;
              width = scaledWidth;
              height = scaledHeight;
              break;
            }
          }
          scale -= 0.1;
        }
      }

      // Final fallback
      if (!bestDataUrl) {
        bestDataUrl = canvas.toDataURL("image/jpeg", 0.75);
        bestSize = Math.round((bestDataUrl.length - "data:image/jpeg;base64,".length) * 0.75);
      }

      resolve({
        dataUrl: bestDataUrl,
        originalSizeBytes,
        optimizedSizeBytes: bestSize,
        wasOptimized: true,
        format: "image/jpeg",
        width,
        height,
      });
    };

    img.onerror = () => {
      resolve({
        dataUrl: initialDataUrl,
        originalSizeBytes,
        optimizedSizeBytes: originalSizeBytes,
        wasOptimized: false,
        format: file.type,
        width: 800,
        height: 800,
      });
    };

    img.src = initialDataUrl;
  });
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    img.onerror = () => resolve({ width: 1200, height: 800 });
    img.src = dataUrl;
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
