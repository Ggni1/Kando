import { createClient } from '@supabase/supabase-js';
import { Ctes } from '../../.env/Ctes';

export const supabase = createClient(
  Ctes.supabase.url, 
  Ctes.supabase.anonKey
);