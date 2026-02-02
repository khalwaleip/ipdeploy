
import { supabase } from './supabaseClient';

export const sendEmailBrief = async (
  email: string, 
  name: string, 
  caseId: string, 
  brief: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('send-brief', {
      body: { 
        email, 
        name, 
        caseId, 
        brief 
      }
    });

    if (error) {
      console.error("Edge Function Error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Email Service Failure:", err);
    return false;
  }
};
