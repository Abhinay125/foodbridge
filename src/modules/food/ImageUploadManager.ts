import { supabaseClient } from '@/modules/database';
import { UPLOAD_LIMITS, UploadedImage } from './types';

export class ImageUploadManager {
  private static instance: ImageUploadManager;
  private readonly BUCKET = 'food-images';

  private constructor() {}

  public static getInstance(): ImageUploadManager {
    if (!ImageUploadManager.instance) {
      ImageUploadManager.instance = new ImageUploadManager();
    }
    return ImageUploadManager.instance;
  }

  async upload(file: File, donorId: string, listingId: string, _onProgress?: (pct: number) => void): Promise<UploadedImage> {
    const allowedTypes = UPLOAD_LIMITS.ALLOWED_TYPES as readonly string[];
    if (!allowedTypes.includes(file.type)) throw new Error('Invalid file type');
    if (file.size > UPLOAD_LIMITS.MAX_SIZE) throw new Error('File too large');

    const uuid = crypto.randomUUID();
    const ext = file.name.split('.').pop();
    const path = `${donorId}/${listingId}/${uuid}.${ext}`;

    const { data, error } = await supabaseClient.client.storage
      .from(this.BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data: { publicUrl } } = supabaseClient.client.storage
      .from(this.BUCKET)
      .getPublicUrl(data.path);

    return { url: publicUrl, path: data.path };
  }

  async deleteImages(paths: string[]): Promise<void> {
    const { error } = await supabaseClient.client.storage.from(this.BUCKET).remove(paths);
    if (error) throw error;
  }
}