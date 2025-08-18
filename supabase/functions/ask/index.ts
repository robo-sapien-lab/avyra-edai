// supabase/functions/ask/index.ts
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// -------------------- CORS --------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// -------------------- Config --------------------
const GEMINI_MODEL_NAME = Deno.env.get("GEMINI_MODEL_NAME") ?? "gemini-2.5-flash-lite";
const EMBEDDING_MODEL = "text-embedding-004";
const GCP_PROJECT_ID = Deno.env.get("GCP_PROJECT_ID")!;
const GCP_LOCATION = Deno.env.get("GCP_LOCATION") ?? "global";

// Load service account JSON from env vars (set in Vercel one by one)
const serviceAccount = {
  client_email: Deno.env.get("CLIENT_EMAIL"),
  private_key: (Deno.env.get("PRIVATE_KEY") ?? "").replace(/\\n/g, "\n"),
  token_uri: Deno.env.get("TOKEN_URI") ?? "https://oauth2.googleapis.com/token",
};

// -------------------- Auth: get access token --------------------
async function getAccessToken(): Promise<string> {
  const jwtHeader = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const jwtClaimSet = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: serviceAccount.token_uri,
    exp: now + 3600,
    iat: now,
  };

  const enc = (obj: any) => btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unsignedJwt = `${enc(jwtHeader)}.${enc(jwtClaimSet)}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsignedJwt));
  const jwt = `${unsignedJwt}.${arrayBufferToBase64Url(signature)}`;

  // exchange JWT for access token
  const res = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Auth error: ${JSON.stringify(data)}`);
  return data.access_token;
}

// PEM parser helpers
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// -------------------- Embedding --------------------
async function embedText(text: string, taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" = "RETRIEVAL_QUERY"): Promise<number[]> {
  const token = await getAccessToken();
  const url = `https://${GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${GCP_LOCATION}/publishers/google/models/${EMBEDDING_MODEL}:predict`;
  const body = {
    instances: [{ content: text, task_type: taskType }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Embedding API error: ${JSON.stringify(data)}`);
  return data.predictions[0].embeddings.values;
}

// -------------------- Gemini --------------------
async function generateGeminiAnswer(opts: { question: string; context: string }): Promise<string> {
  const token = await getAccessToken();
  const url = `https://${GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${GCP_LOCATION}/publishers/google/models/${GEMINI_MODEL_NAME}:generateContent`;

  const { question, context } = opts;
  const systemInstruction = "You are an expert K–12 tutor. Use the provided notes to answer step-by-step.";

  const body = {
    contents: [
      { role: "user", parts: [{ text: systemInstruction + "\n\nNotes:\n" + context + "\n\nQuestion:\n" + question }] },
    ],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Gemini API error: ${JSON.stringify(data)}`);
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
  return text.trim();
}

// -------------------- Main Function --------------------
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "No authorization header" }, 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { question } = await req.json();
    if (!question || !question.trim()) return json({ error: "No question provided" }, 400);

    // embed
    const queryEmbedding = await embedText(question);

    // fetch stored embeddings
    const { data: allEmbeds } = await supabase.from("embeddings").select("*").eq("user_id", user.id);
    const compatible = (allEmbeds ?? []).filter((row: any) =>
      Array.isArray(row.embedding_data) && row.embedding_data.length === queryEmbedding.length
    );

    if (!compatible.length) {
      return json({ error: "No compatible embeddings found. Re-ingest notes." }, 400);
    }

    const scored = compatible.map((chunk: any) => ({
      ...chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding_data),
    }));
    const topK = scored.sort((a: any, b: any) => b.similarity - a.similarity).slice(0, 5);

    const context = topK.map((c: any) =>
      `Subject: ${c.subject} | Topic: ${c.topic} | Subtopic: ${c.subtopic}\n${c.content}`
    ).join("\n\n");

    const answer = await generateGeminiAnswer({ question, context });

    const primary = topK[0] ?? {};
    const { error: dbError } = await supabase.from("questions").insert({
      user_id: user.id,
      question_text: question,
      answer_text: answer,
      subject: primary.subject,
      topic: primary.topic,
      subtopic: primary.subtopic,
      source_chunks: topK.map((c: any) => ({
        content: c.content,
        upload_id: c.upload_id,
        subject: c.subject,
        topic: c.topic,
        subtopic: c.subtopic,
      })),
    });

    if (dbError) throw dbError;

    return json({
      answer,
      subject: primary.subject,
      topic: primary.topic,
      subtopic: primary.subtopic,
      sources: topK.map((c: any) => ({
        content: (c.content ?? "").slice(0, 200) + "...",
        upload_id: c.upload_id,
      })),
    });

  } catch (err: any) {
    console.error(err);
    return json({ error: err.message }, 500);
  }
});

// -------------------- Utils --------------------
function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
