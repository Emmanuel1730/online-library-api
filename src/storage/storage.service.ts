import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    this.bucket = this.config.get<string>('SUPABASE_BUCKET')!;
  }

  async getStorageStats() {
    const { data: files, error } = await this.supabase.storage
      .from(this.bucket)
      .list('', { limit: 1000, offset: 0 });

    if (error) throw new Error(`Supabase storage error: ${error.message}`);

    const LIMIT_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

    const typeBytes: Record<string, number> = {
      PDFs: 0, Videos: 0, Images: 0, Audio: 0, Other: 0,
    };

    let usedBytes = 0;

    for (const file of files ?? []) {
      const size: number = (file.metadata as any)?.size ?? 0;
      usedBytes += size;

      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (['pdf', 'doc', 'docx'].includes(ext))                       typeBytes['PDFs']   += size;
      else if (['mp4', 'avi', 'mov', 'mkv'].includes(ext))            typeBytes['Videos'] += size;
      else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext))   typeBytes['Images'] += size;
      else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext))            typeBytes['Audio']  += size;
      else                                                             typeBytes['Other']  += size;
    }

    const breakdown = Object.entries(typeBytes)
      .filter(([, bytes]) => bytes > 0)
      .map(([label, bytes]) => ({ label, bytes }));

    return {
      usedBytes,
      totalBytes: LIMIT_BYTES,
      fileCount: files?.length ?? 0,
      breakdown,
    };
  }
}