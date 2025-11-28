import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { quiz_id, participant_id, question_id, selected_option } = await req.json();

    const { data: existingAnswer } = await supabase
      .from("answers")
      .select("*")
      .eq("participant_id", participant_id)
      .eq("question_id", question_id)
      .maybeSingle();

    if (existingAnswer) {
      return new Response(
        JSON.stringify({ error: "Answer already submitted" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("correct_option")
      .eq("id", question_id)
      .single();

    if (questionError) {
      throw questionError;
    }

    const isCorrect = selected_option === question.correct_option;
    let pointsEarned = 0;
    let answerRank = null;

    if (isCorrect) {
      const { count } = await supabase
        .from("answers")
        .select("*", { count: "exact", head: true })
        .eq("question_id", question_id)
        .eq("is_correct", true);

      const currentRank = (count ?? 0) + 1;
      answerRank = currentRank;

      pointsEarned = 5;

      if (currentRank === 1) pointsEarned += 5;
      else if (currentRank === 2) pointsEarned += 4;
      else if (currentRank === 3) pointsEarned += 3;
      else if (currentRank === 4) pointsEarned += 2;
      else if (currentRank === 5) pointsEarned += 1;
    }

    const { error: answerError } = await supabase
      .from("answers")
      .insert({
        quiz_id,
        participant_id,
        question_id,
        selected_option,
        is_correct: isCorrect,
        answer_rank: answerRank,
        points_earned: pointsEarned,
      });

    if (answerError) {
      throw answerError;
    }

    if (isCorrect && pointsEarned > 0) {
      const { error: updateError } = await supabase.rpc("increment_score", {
        p_participant_id: participant_id,
        p_points: pointsEarned,
      });

      if (updateError) {
        const { data: participant } = await supabase
          .from("participants")
          .select("total_score")
          .eq("id", participant_id)
          .single();

        const newScore = (participant?.total_score ?? 0) + pointsEarned;

        await supabase
          .from("participants")
          .update({ total_score: newScore })
          .eq("id", participant_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        answer_rank: answerRank,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
