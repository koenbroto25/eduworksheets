import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: subjects, error: subjectsError } = await supabase
      .rpc('get_enum_values', { enum_name: 'subject' });
    if (subjectsError) throw subjectsError;

    const { data: grades, error: gradesError } = await supabase
      .rpc('get_enum_values', { enum_name: 'grade' });
    if (gradesError) throw gradesError;

    const { data: assessmentTypes, error: assessmentTypesError } = await supabase
      .rpc('get_enum_values', { enum_name: 'assessment_type' });
    if (assessmentTypesError) throw assessmentTypesError;

    const { data: curriculumTypes, error: curriculumTypesError } = await supabase
      .rpc('get_enum_values', { enum_name: 'curriculum_type' });
    if (curriculumTypesError) throw curriculumTypesError;

    const { data: semesters, error: semestersError } = await supabase
      .rpc('get_enum_values', { enum_name: 'semester' });
    if (semestersError) throw semestersError;

    const { data: difficultyLevels, error: difficultyLevelsError } = await supabase
        .rpc('get_enum_values', { enum_name: 'difficulty_level' });
    if (difficultyLevelsError) throw difficultyLevelsError;

    const options = {
      subjects,
      grades,
      assessmentTypes,
      curriculumTypes,
      semesters,
      difficultyLevels,
    };

    return new Response(JSON.stringify(options), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
