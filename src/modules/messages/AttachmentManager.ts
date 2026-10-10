import { supabaseClient } from '@/modules/database';

export class AttachmentManager {
  private static instance: AttachmentManager;
  private readonly BUCKET = 'message-attachments';

  private constructor() {}

  public static getInstance(): AttachmentManager {
    if (!this.instance) this.instance = new AttachmentManager();
    return this.instance;
  }

  async upload(file: File, userId: string): Promise<string> {
    const path = `${userId}/${Date.now()}_${file.name}`;
    const { data, error } = await supabaseClient.client.storage
      .from(this.BUCKET)
      .upload(path, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabaseClient.client.storage
      .from(this.BUCKET)
      .getPublicUrl(data.path);

    return publicUrl;
  }

  renderPreview(url: string, type: 'image' | 'file'): string {
    if (type === 'image') {
      return `<div class="attachment-preview"><img src="${url}" class="rounded" /></div>`;
    }
    return `<div class="attachment-preview file">📎 Attachment</div>`;
  }
}