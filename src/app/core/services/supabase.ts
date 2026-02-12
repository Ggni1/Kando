import { createClient } from '@supabase/supabase-js';
import { Ctes } from '../../shared/Ctes';

// Es como un singleton. Se crea una sola instancia y se exporta para poder usarlo.
export const supabase = createClient(
  Ctes.supabase.url, 
  Ctes.supabase.anonKey
);