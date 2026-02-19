import { createClient } from '@supabase/supabase-js';
import { Ctes } from '../../shared/Ctes';

export const supabase = createClient(
  Ctes.supabase.url, 
  Ctes.supabase.anonKey
);