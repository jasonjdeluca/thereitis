import { supabase } from "./supabase";
import { generateCard } from "./card";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
export const PHRASE_ERROR_MESSAGES = {
  connection: "Connection error — unable to load phrases",
  empty: "No phrases configured for this company",
};

async function fetchPhrases(companyId) {
  if (!companyId) return { status: "empty", phrases: [] };
  try {
    const { data, error } = await supabase
      .from("phrases")
      .select("phrase, tier, ceo_mode, special_square")
      .eq("company_id", companyId)
      .eq("is_active", true);
    if (error) return { status: "error", phrases: [] };
    if (!data || data.length === 0) return { status: "empty", phrases: [] };
    return { status: "ok", phrases: data };
  } catch {
    return { status: "error", phrases: [] };
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
  const phraseResult = await fetchPhrases(companyId);
  if (phraseResult.status === "error") {
    throw new Error(PHRASE_ERROR_MESSAGES.connection);
  }
  if (phraseResult.status === "empty") {
    throw new Error(PHRASE_ERROR_MESSAGES.empty);
  }
  const phrases = phraseResult.phrases;
  const card = generateCard(phrases);

  let session;
  for (let attempt = 0; attempt < 2; attempt++) {
    const row = { session_code: generateCode(), status: "active", player_count: 1 };
    if (companyId) row.company_id = companyId;

    const { data, error } = await supabase
      .from("sessions")
      .insert(row)
      .select()
      .single();

    if (!error) {
      session = data;
      break;
    }
    if (error.code !== "23505" || attempt === 1) throw error;
  }

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

  const phraseResult = await fetchPhrases(session.company_id);
  if (phraseResult.status === "error") {
    return { error: PHRASE_ERROR_MESSAGES.connection };
  }
  if (phraseResult.status === "empty") {
    return { error: PHRASE_ERROR_MESSAGES.empty };
  }
  const phrases = phraseResult.phrases;
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
