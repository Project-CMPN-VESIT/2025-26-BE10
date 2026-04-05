import { supabase } from './supabaseClient';
import { decode } from 'base64-arraybuffer'; // Mandatory for React Native

/**
 * HELPER: Persists the AI result image to your private storage.
 * This prevents broken links once Hugging Face temp URLs expire.
 */
const uploadResultToSupabase = async (userId: string, hfImageUrl: string): Promise<string> => {
    try {
        // 1. Fetch image from temporary Hugging Face link
        const response = await fetch(hfImageUrl);
        const blob = await response.blob();
        
        // 2. Convert to Base64 (Stable for React Native binary handling)
        const base64: string = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const res = reader.result as string;
                resolve(res.split(',')[1]); // Remove data:image/jpeg;base64 prefix
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        // 3. Define permanent path in the private 'oral-photos' bucket
        const fileName = `${userId}/results/${Date.now()}_analyzed.jpg`;

        // 4. Upload to Supabase
        const { data, error } = await supabase.storage
            .from('oral-photos') // Ensure this matches your dashboard exactly
            .upload(fileName, decode(base64), { 
                contentType: 'image/jpeg',
                upsert: true
            });

        if (error) throw error;

        // 5. Return the raw path (ReportScreen will create the Signed URL)
        return `oral-photos/${fileName}`; 

    } catch (error) {
        console.error("Error persisting AI image:", error);
        return hfImageUrl; // Fallback to temp URL if storage fails
    }
};

/**
 * Saves the final scan record to the PostgreSQL database.
 */
export const saveScanRecord = async (
    userId: string, 
    tempImageUrl: string, 
    diagnosis: any, 
    scanType: string
) => {
    // STEP 1: Persist the AI result image to your private bucket
    const permanentPath = await uploadResultToSupabase(userId, tempImageUrl);

    // STEP 2: Insert data into your 'scans' (or 'sessions') table
    const { data, error } = await supabase
        .from('scans')
        .insert([
            {
                user_id: userId,
                image_url: permanentPath, 
                diagnosis_result: typeof diagnosis === 'string' ? diagnosis : JSON.stringify(diagnosis),
                scan_type: scanType,
                created_at: new Date().toISOString(),
            },
        ])
        .select(); // Required to return the new row data

    if (error) {
        console.error("Supabase Database Insert Error:", error.message);
        throw error;
    }
    return data;
};