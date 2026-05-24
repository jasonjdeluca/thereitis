import { supabase } from "./supabase";
import { generateCard } from "./card";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

function generateCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function createSession(displayName, companyId) {
  const code = generateCode();
  const card = generateCard();

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

  return { session, player, card };
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

  const age = Date.now() - new Date(session.created_at).getTime();
  if (age > SIX_HOURS_MS || session.status === "ended") {
    return { error: "This session has expired — start a new one" };
  }

  const card = generateCard();

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

  await supabase
    .from("sessions")
    .update({ player_count: (session.player_count || 0) + 1 })
    .eq("id", session.id);

  sessionStorage.setItem("thereitis_session_id", session.id);
  sessionStorage.setItem("thereitis_player_id", player.id);

  return { session, player, card };
}
