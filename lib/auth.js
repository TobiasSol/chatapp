// lib/auth.js
import { supabase } from './supabase';

export const checkAdminStatus = async (email) => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .single();
    
  return !!data;
};