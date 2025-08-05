import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { 
  Upload, 
  MessageCircleQuestion, 
  Brain, 
  TrendingUp, 
  FileText, 
  Clock,
  Target,
  Award
} from 'lucide-react';

const Dashboard = () => {
  const { profile } = useAuthStore();

  const features = [
    {
      title: 'Upload Notes',
      description: 'Upload PDFs or handwritten notes to build your knowledge base',
      icon: Upload,
      href: '/upload',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Ask Questions',
      description: 'Get AI-powered answers based on your uploaded materials',
      icon: MessageCircleQuestion,
      href: '/ask',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Take Quizzes',
      description: 'Test your knowledge with adaptive quizzes',
      icon: Brain,
      href: '/quiz',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'View Progress',
      description: 'Track your learning progress and mastery levels',
      icon: TrendingUp,
      href: '/progress',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const stats = [
    {
      label: 'Notes Uploaded',
      value: '0',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      label: 'Questions Asked',
      value: '0',
      icon: MessageCircleQuestion,
      color: 'text-green-600'
    },
    {
      label: 'Quizzes Taken',
      value: '0',
      icon: Brain,
      color: 'text-purple-600'
    },
    {
      label: 'Study Time',
      value: '0h',
      icon: Clock,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">
            Welcome back, {profile?.name}! 👋
          </h1>
          <p className="text-xl text-muted-foreground">
            Ready to continue your learning journey?
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center">
                  <div className={`mx-auto w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full" variant="outline">
                    <Link to={feature.href}>
                      Get Started
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Jump right into your learning activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First Notes
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/ask">
                  <MessageCircleQuestion className="w-4 h-4 mr-2" />
                  Ask a Question
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/quiz">
                  <Brain className="w-4 h-4 mr-2" />
                  Take a Quiz
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Achievement Section */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Your Learning Journey
            </CardTitle>
            <CardDescription>
              Start uploading notes and asking questions to unlock achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              🎯 Upload your first set of notes to begin your personalized learning experience!
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;