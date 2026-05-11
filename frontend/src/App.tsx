import React, { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { StartMenu } from './pages/StartMenu';
import { Classroom } from './pages/Classroom';
import { GreenboardMenu } from './pages/GreenboardMenu';
import { TeachingMode } from './pages/TeachingMode';
import { ExamMode } from './pages/ExamMode';
import { Leaderboard } from './pages/Leaderboard';
import { IqLevel } from './components/IqLevel';
import { Analytics } from './pages/Analytics';
import { Store } from './pages/Store';
import { STUDENTS } from './data/students';
import { StudentClassroom } from './pages/StudentClassroom';
import { LearningMode } from './pages/LearningMode';
import { supabase } from './lib/supabase';

type Scene = 'login' | 'start' | 'classroom' | 'greenboard-menu' | 'store' | 'leaderboard' | 'teaching' | 'exam' | 'analytics' | 'student-classroom' | 'learning';

export interface Message {
  sender: 'teacher' | 'student';
  text: string;
}

export interface SessionRecord {
  id: string;
  date: string;
  topic: string;
  confusion: number;
  report: string;
  grade: number;
}

export default function App() {
  const [scene, setScene] = useState<Scene>('login');
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState<'professor' | 'student' | null>(null);
  const [lessonText, setLessonText] = useState('');
  const [lastConfusion, setLastConfusion] = useState(50);
  const [iqPoints, setIqPoints] = useState(60);
  const [unlockedStudents, setUnlockedStudents] = useState<string[]>(['marko']);
  const [activeStudentId, setActiveStudentId] = useState<string>('marko');
  const [lastTranscript, setLastTranscript] = useState<Message[]>([]);
  const [studentLevel, setStudentLevel] = useState(1);
  const [learningLevel, setLearningLevel] = useState<'basic' | 'medium' | 'advanced'>('medium');
  const [history, setHistory] = useState<SessionRecord[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setScene('login');
    });

    const saved = localStorage.getItem('feynman_stats');
    if (saved) {
      const parsed = JSON.parse(saved);
      setIqPoints(parsed.iqPoints ?? 60);
      setStudentLevel(parsed.studentLevel ?? 1);
      setUnlockedStudents(parsed.unlockedStudents ?? ['marko']);
      setActiveStudentId(parsed.activeStudentId ?? 'marko');
      setHistory(parsed.history ?? []);
    }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('feynman_stats', JSON.stringify({
      iqPoints,
      studentLevel,
      history,
      unlockedStudents,
      activeStudentId
    }));
  }, [iqPoints, studentLevel, history, unlockedStudents, activeStudentId]);

  const handleLoginSuccess = (name: string) => {
    setUsername(name);
    setScene('start');
  };

  const handleExamFinish = (earned: number, passed: boolean) => {
    const newIq = iqPoints + earned;
    setIqPoints(newIq);
    if (passed && earned > 20) setStudentLevel(prev => prev + 1);

    if (username) {
      supabase
        .from('leaderboard')
        .upsert({ username, score: newIq, updated_at: new Date().toISOString() }, { onConflict: 'username' })
        .catch(() => {});
    }

    setScene('classroom');
  };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center relative">
      <div className="w-full max-w-6xl aspect-video bg-gray-900 overflow-hidden relative shadow-2xl rounded-sm">
        {scene === 'login' && (
          <Login onLoginSuccess={handleLoginSuccess} />
        )}

        {scene === 'start' && (
          <StartMenu
            onEnterProfessor={() => { setUserRole('professor'); setScene('classroom'); }}
            onEnterStudent={() => { setUserRole('student'); setScene('student-classroom'); }}
            onStore={() => setScene('store')}
            onLeaderboard={() => setScene('leaderboard')}
          />
        )}

        {scene === 'classroom' && (
          <Classroom
            onBack={() => setScene('start')}
            onGoToGreenboard={() => setScene('greenboard-menu')}
            onHandOutExam={() => setScene('exam')}
            lessonText={lessonText}
            setLessonText={setLessonText}
            iqPoints={iqPoints}
            studentLevel={studentLevel}
            history={history}
            activeStudent={STUDENTS.find(s => s.id === activeStudentId) || STUDENTS[0]}
          />
        )}

        {scene === 'greenboard-menu' && (
          <GreenboardMenu
            onBack={() => setScene('classroom')}
            onTeach={() => setScene('teaching')}
            onTest={() => setScene('exam')}
          />
        )}

        {scene === 'teaching' && (
          <TeachingMode
            lessonText={lessonText}
            activeStudent={STUDENTS.find(s => s.id === activeStudentId) || STUDENTS[0]}
            onEndTeaching={(finalConfusion, transcript) => {
              setLastConfusion(finalConfusion);
              setLastTranscript(transcript);
              setScene('analytics');
            }}
          />
        )}

        {scene === 'student-classroom' && (
          <StudentClassroom
            onBack={() => setScene('start')}
            onStartLearning={() => setScene('learning')}
            lessonText={lessonText}
            setLessonText={setLessonText}
            learningLevel={learningLevel}
            setLearningLevel={setLearningLevel}
          />
        )}

        {scene === 'learning' && (
          <LearningMode
            lessonText={lessonText}
            onEndLearning={() => setScene('student-classroom')}
            learningLevel={learningLevel}
          />
        )}

        {scene === 'analytics' && (
          <Analytics
            transcript={lastTranscript}
            confusion={lastConfusion}
            onBack={() => setScene('classroom')}
            lessonText={lessonText}
            onSave={(record) => setHistory(prev => [record, ...prev])}
          />
        )}

        {scene === 'exam' && (
          <ExamMode
            lessonText={lessonText}
            transcript={lastTranscript}
            confusionScore={lastConfusion}
            studentLevel={studentLevel}
            onFinish={handleExamFinish}
          />
        )}

        {scene === 'leaderboard' && (
          <Leaderboard
            onBack={() => setScene('start')}
            iqPoints={iqPoints}
            username={username}
          />
        )}

        {scene === 'store' && (
          <Store
            onBack={() => setScene('start')}
            iqPoints={iqPoints}
            setIqPoints={setIqPoints}
            unlockedStudents={unlockedStudents}
            setUnlockedStudents={setUnlockedStudents}
            activeStudentId={activeStudentId}
            setActiveStudentId={setActiveStudentId}
          />
        )}

        {scene !== 'classroom' && scene !== 'login' && (
          <div className="absolute bottom-[4%] right-[2%] z-50">
            <IqLevel iqPoints={iqPoints} />
          </div>
        )}
      </div>
    </div>
  );
}
