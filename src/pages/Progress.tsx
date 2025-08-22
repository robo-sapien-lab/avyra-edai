import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BookOpen, Target, Clock, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

interface ProgressData {
  progress: {
    totalQuestions: number;
    totalQuizzes: number;
    averageScore: number;
    totalUploads: number;
    weakTopics: Array<{
      subject: string;
      topic: string;
      subtopic?: string;
      mastery_score: number;
    }>;
    recentActivity: Array<{
      type: 'question' | 'quiz';
      title: string;
      score?: number;
      timestamp: string;
    }>;
    progressBySubject: Array<{
      subject: string;
      topics: Array<{
        topic: string;
        mastery_score: number;
        questions_attempted: number;
      }>;
    }>;
  };
  leaderboard: Array<{
    rank: number;
    studentId: string;
    studentName: string;
    score: number;
    totalQuestions: number;
    averageScore: number;
  }>;
}

const Progress = () => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      loadProgressData();
    }
  }, [user]);

  const loadProgressData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/progress/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProgressData(data);
    } catch (error) {
      console.error('Error loading progress data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load progress data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getMasteryColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getMasteryLabel = (score: number) => {
    if (score >= 80) return 'Mastered';
    if (score >= 60) return 'Learning';
    return 'Needs Work';
  };

  if (loading || !progressData) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const { progress, leaderboard } = progressData;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold">Learning Progress</h1>
            <p className="text-muted-foreground mt-2">
              Track your learning journey and identify areas for improvement
            </p>
          </div>

          {/* Overview Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{progress.totalUploads}</p>
                    <p className="text-sm text-muted-foreground">Materials Uploaded</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Target className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{progress.totalQuestions}</p>
                    <p className="text-sm text-muted-foreground">Questions Asked</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{progress.totalQuizzes}</p>
                    <p className="text-sm text-muted-foreground">Quizzes Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{Math.round(progress.averageScore)}%</p>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Progress by Subject */}
            <Card>
              <CardHeader>
                <CardTitle>Progress by Subject</CardTitle>
                <CardDescription>
                  Your mastery level across different subjects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {progress.progressBySubject.length > 0 ? (
                  progress.progressBySubject.map((subject, index) => (
                    <div key={index} className="space-y-3">
                      <h3 className="font-semibold">{subject.subject}</h3>
                      <div className="space-y-2">
                        {subject.topics.map((topic, topicIndex) => (
                          <div key={topicIndex} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">{topic.topic}</span>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="secondary" 
                                  className={getMasteryColor(topic.mastery_score)}
                                >
                                  {getMasteryLabel(topic.mastery_score)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {topic.mastery_score}%
                                </span>
                              </div>
                            </div>
                            <ProgressBar value={topic.mastery_score} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {topic.questions_attempted} questions attempted
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Start taking quizzes to see your progress here
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card>
              <CardHeader>
                <CardTitle>Areas for Improvement</CardTitle>
                <CardDescription>
                  Topics that might need more attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {progress.weakTopics.length > 0 ? (
                  <div className="space-y-3">
                    {progress.weakTopics.slice(0, 5).map((topic, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{topic.topic}</p>
                          <p className="text-sm text-muted-foreground">
                            {topic.subject} {topic.subtopic && `• ${topic.subtopic}`}
                          </p>
                        </div>
                        <Badge variant="outline" className={getMasteryColor(topic.mastery_score)}>
                          {topic.mastery_score}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Great job! No weak areas identified yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest learning activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {progress.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {progress.recentActivity.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {activity.type === 'quiz' ? (
                          <Award className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Target className="w-5 h-5 text-green-600" />
                        )}
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {activity.score !== undefined && (
                        <Badge variant="secondary">
                          {activity.score}%
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Start learning to see your activity here
                </p>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Leaderboard
              </CardTitle>
              <CardDescription>
                Top performers in your learning community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {student.rank}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.totalQuestions} questions • {Math.round(student.averageScore)}% avg
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-lg font-bold">
                        {student.score}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No leaderboard data available yet
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Progress;