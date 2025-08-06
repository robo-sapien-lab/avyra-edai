import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    console.log(`Dashboard request for user ${user.id} with role ${profile.role}`);

    if (profile.role === 'student') {
      return await getStudentDashboard(supabaseClient, user.id);
    } else if (profile.role === 'teacher') {
      return await getTeacherDashboard(supabaseClient, user.id, profile);
    } else {
      throw new Error('Invalid user role');
    }

  } catch (error) {
    console.error('Error in dashboard function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getStudentDashboard(supabaseClient: any, userId: string) {
  // Get recent questions
  const { data: recentQuestions, error: questionsError } = await supabaseClient
    .from('questions')
    .select('id, question_text, answer_text, subject, topic, subtopic, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (questionsError) {
    throw questionsError;
  }

  // Get quiz scores
  const { data: quizzes, error: quizzesError } = await supabaseClient
    .from('quizzes')
    .select('id, title, score, total_questions, subject, topic, subtopic, completed_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (quizzesError) {
    throw quizzesError;
  }

  // Get progress data (weak topics)
  const { data: progress, error: progressError } = await supabaseClient
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .order('mastery_score', { ascending: true });

  if (progressError) {
    throw progressError;
  }

  // Get upload statistics
  const { data: uploads, error: uploadsError } = await supabaseClient
    .from('uploads')
    .select('id, file_name, subject, topic, subtopic, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (uploadsError) {
    throw uploadsError;
  }

  // Calculate overall statistics
  const totalQuestions = recentQuestions?.length || 0;
  const completedQuizzes = quizzes?.filter(q => q.completed_at)?.length || 0;
  const averageScore = completedQuizzes > 0 
    ? Math.round(quizzes
        .filter(q => q.completed_at && q.score !== null)
        .reduce((sum, q) => sum + q.score, 0) / completedQuizzes)
    : 0;

  // Identify weakest topics (lowest mastery scores)
  const weakTopics = progress
    ?.filter(p => p.mastery_score < 70)
    ?.slice(0, 5)
    ?.map(p => ({
      topic: p.topic,
      subject: p.subject,
      subtopic: p.subtopic,
      mastery_score: p.mastery_score,
      questions_attempted: p.questions_attempted
    })) || [];

  // Recent activity summary
  const recentActivity = [
    ...recentQuestions?.slice(0, 5)?.map(q => ({
      type: 'question',
      title: `Asked: ${q.question_text.substring(0, 50)}...`,
      subject: q.subject,
      topic: q.topic,
      created_at: q.created_at
    })) || [],
    ...quizzes?.slice(0, 5)?.map(q => ({
      type: 'quiz',
      title: `Quiz: ${q.title} (${q.score}%)`,
      subject: q.subject,
      topic: q.topic,
      created_at: q.created_at
    })) || []
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);

  return new Response(JSON.stringify({
    role: 'student',
    stats: {
      total_questions: totalQuestions,
      completed_quizzes: completedQuizzes,
      average_score: averageScore,
      total_uploads: uploads?.length || 0
    },
    recent_questions: recentQuestions?.slice(0, 5) || [],
    quiz_scores: quizzes?.filter(q => q.completed_at)?.slice(0, 5) || [],
    weak_topics: weakTopics,
    recent_uploads: uploads || [],
    recent_activity: recentActivity,
    progress_data: progress || []
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getTeacherDashboard(supabaseClient: any, userId: string, profile: any) {
  // For teachers, we'll show aggregated data from students in their school/grade
  // This is a simplified implementation - in production you'd have proper class management

  // Get all students (simplified - in real app you'd filter by class/school)
  const { data: students, error: studentsError } = await supabaseClient
    .from('profiles')
    .select('id, name, grade, school, created_at')
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(20);

  if (studentsError) {
    throw studentsError;
  }

  // Get aggregated progress data
  const { data: allProgress, error: progressError } = await supabaseClient
    .from('progress')
    .select('user_id, topic, subject, mastery_score, questions_attempted')
    .order('mastery_score', { ascending: true })
    .limit(100);

  if (progressError) {
    throw progressError;
  }

  // Get recent quiz data
  const { data: recentQuizzes, error: quizzesError } = await supabaseClient
    .from('quizzes')
    .select('user_id, title, score, subject, topic, completed_at, created_at')
    .not('completed_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (quizzesError) {
    throw quizzesError;
  }

  // Aggregate data by subject/topic
  const subjectProgress: { [key: string]: { total_students: number, avg_mastery: number, total_attempts: number } } = {};
  const topicProgress: { [key: string]: { total_students: number, avg_mastery: number, total_attempts: number } } = {};

  allProgress?.forEach(p => {
    if (p.subject) {
      if (!subjectProgress[p.subject]) {
        subjectProgress[p.subject] = { total_students: 0, avg_mastery: 0, total_attempts: 0 };
      }
      subjectProgress[p.subject].total_students += 1;
      subjectProgress[p.subject].avg_mastery += p.mastery_score;
      subjectProgress[p.subject].total_attempts += p.questions_attempted || 0;
    }

    if (p.topic) {
      if (!topicProgress[p.topic]) {
        topicProgress[p.topic] = { total_students: 0, avg_mastery: 0, total_attempts: 0 };
      }
      topicProgress[p.topic].total_students += 1;
      topicProgress[p.topic].avg_mastery += p.mastery_score;
      topicProgress[p.topic].total_attempts += p.questions_attempted || 0;
    }
  });

  // Calculate averages
  Object.keys(subjectProgress).forEach(subject => {
    const data = subjectProgress[subject];
    data.avg_mastery = Math.round(data.avg_mastery / data.total_students);
  });

  Object.keys(topicProgress).forEach(topic => {
    const data = topicProgress[topic];
    data.avg_mastery = Math.round(data.avg_mastery / data.total_students);
  });

  // Find students with lowest mastery scores
  const studentMastery: { [key: string]: { name: string, avg_mastery: number, total_attempts: number } } = {};
  
  allProgress?.forEach(p => {
    const student = students?.find(s => s.id === p.user_id);
    if (student) {
      if (!studentMastery[p.user_id]) {
        studentMastery[p.user_id] = { 
          name: student.name, 
          avg_mastery: 0, 
          total_attempts: 0 
        };
      }
      studentMastery[p.user_id].avg_mastery += p.mastery_score;
      studentMastery[p.user_id].total_attempts += p.questions_attempted || 0;
    }
  });

  // Calculate student averages and sort
  const studentList = Object.keys(studentMastery).map(userId => {
    const userProgress = allProgress?.filter(p => p.user_id === userId) || [];
    const avgMastery = userProgress.length > 0 
      ? Math.round(userProgress.reduce((sum, p) => sum + p.mastery_score, 0) / userProgress.length)
      : 0;
    
    return {
      user_id: userId,
      name: studentMastery[userId].name,
      avg_mastery: avgMastery,
      total_attempts: studentMastery[userId].total_attempts
    };
  }).sort((a, b) => a.avg_mastery - b.avg_mastery);

  return new Response(JSON.stringify({
    role: 'teacher',
    stats: {
      total_students: students?.length || 0,
      avg_class_score: recentQuizzes?.length > 0 
        ? Math.round(recentQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / recentQuizzes.length)
        : 0,
      total_quizzes_completed: recentQuizzes?.length || 0,
      active_subjects: Object.keys(subjectProgress).length
    },
    subject_progress: Object.keys(subjectProgress).map(subject => ({
      subject,
      ...subjectProgress[subject]
    })).sort((a, b) => a.avg_mastery - b.avg_mastery),
    topic_progress: Object.keys(topicProgress).map(topic => ({
      topic,
      ...topicProgress[topic]
    })).sort((a, b) => a.avg_mastery - b.avg_mastery).slice(0, 10),
    students_needing_help: studentList.slice(0, 10),
    recent_class_activity: recentQuizzes?.slice(0, 10)?.map(q => {
      const student = students?.find(s => s.id === q.user_id);
      return {
        student_name: student?.name || 'Unknown',
        quiz_title: q.title,
        score: q.score,
        subject: q.subject,
        topic: q.topic,
        completed_at: q.completed_at
      };
    }) || []
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}