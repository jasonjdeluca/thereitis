import { supabase } from "./supabase";
import { generateCard } from "./card";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

async function fetchPhrases(companyId) {
  if (!companyId) return null;
  try {
    const { data, error } = await supabase
      .from("phrases")
      .select("phrase, tier, ceo_mode, special_square")
      .eq("company_id", companyId)
      .eq("is_active", true);
    if (error || !data || data.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

function generateCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function createSession(displayName, companyId) {
  const code = generateCode();
  const phrases = await fetchPhrases(companyId);
  if (!phrases) console.warn("[phrases] fetch failed or empty — using hardcoded fallback");
  const card = generateCard(phrases);

  const row = { session_code: code, status: "active", player_count: 1 };
  if (companyId) row.company_id = companyId;

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert(row)
    .select()
    .single();

  if (sessionError) throw sessionError;

  const { data: player, error: playerError } = await supabase
    .from("players")
    .insert({
      session_id: session.id,
      display_name: displayName,
      card_layout: card,
    })
    .select()
    .single();

  if (playerError) throw playerError;

  sessionStorage.setItem("thereitis_session_id", session.id);
  sessionStorage.setItem("thereitis_player_id", player.id);

  return { session, player, card, phrases };
}

export async function joinSession(code, displayName) {
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select()
    .eq("session_code", code.toUpperCase())
    .single();

  if (sessionError || !session) {
    return { error: "Session not found — check the code and try again" };
  }

  const age = Date.now() - new Date(session.started_at).getTime();
  if (age > SIX_HOURS_MS || session.status === "ended") {
    return { error: "This session has expired — start a new one" };
  }

  const phrases = await fetchPhrases(session.company_id);
  if (!phrases) console.warn("[phrases] fetch failed or empty — using hardcoded fallback");
  const card = generateCard(phrases);

  const { data: player, error: playerError } = await supabase
    .from("players")
    .insert({
      session_id: session.id,
      display_name: displayName,
      card_layout: card,
    })
    .select()
    .single();

  if (playerError) throw playerError;

  await supabase.rpc("increment_player_count", { session_id: session.id });

  sessionStorage.setItem("thereitis_session_id", session.id);
  sessionStorage.setItem("thereitis_player_id", player.id);

  return { session, player, card, phrases };
}
