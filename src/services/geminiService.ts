import { ToolType, Platform } from "../types";
import { 
  collection, 
  addDoc, 
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db, auth } from './firebase';

export const geminiService = {
  generateContent: async (tool: ToolType, params: any) => {
    const { niche, platform } = params;

    try {
      // Appelle la Netlify Function au lieu de l'API Gemini directement
      const res = await fetch('/.netlify/functions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tool, params })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erreur lors de la génération: ${res.status} ${res.statusText} - ${errorText}`);
      }

      const data = await res.json();

      // Save to Firestore if user is logged in
      if (auth.currentUser) {
        try {
          await addDoc(collection(db, 'generations'), {
            user_id: auth.currentUser.uid,
            tool,
            niche,
            platform,
            input_data: params,
            output_data: data,
            created_at: new Date().toISOString()
          });
        } catch (e) {
          console.error("Error saving generation:", e);
        }
      }

      return data;
    } catch (error) {
      console.error("Gemini Service Error:", error);
      throw error;
    }
  },

  getHistory: async (limitCount: number = 5) => {
    if (!auth.currentUser) return [];
    
    try {
      const q = query(
        collection(db, 'generations'),
        where('user_id', '==', auth.currentUser.uid),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error("Error fetching history:", e);
      return [];
    }
  }
};
