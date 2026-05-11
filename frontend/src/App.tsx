import React, { useState, useEffect, useRef } from 'react';
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
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'professor' | 'student' | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

    const saved = localStorage.getItem('learnit_stats');
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
    localStorage.setItem('learnit_stats', JSON.stringify({
      iqPoints, studentLevel, history, unlockedStudents, activeStudentId
    }));

    if (userId && username) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        supabase.from('user_stats').upsert({
          user_id: userId,
          username,
          iq_points: iqPoints,
          student_level: studentLevel,
          unlocked_students: unlockedStudents,
          active_student_id: activeStudentId,
          history,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' }).catch(() => {});
      }, 1000);
    }
  }, [iqPoints, studentLevel, history, unlockedStudents, activeStudentId]);

  const handleLoginSuccess = async (name: string, uid: string) => {
    setUsername(name);
    setUserId(uid);

    const { data } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', uid)
      .single();

    if (data) {
      setIqPoints(data.iq_points);
      setStudentLevel(data.student_level);
      setUnlockedStudents(data.unlocked_students ?? ['marko']);
      setActiveStudentId(data.active_student_id ?? 'marko');
      setHistory(data.history ?? []);
    }

    setScene('start');
  };

  const handleExamFinish = (earned: number, passed: boolean) => {
    const newIq = iqPoints + earned;
    setIqPoints(newIq);
    if (passed && earned > 20) setStudentLevel(prev => prev + 1);

    if (username) {
      fetch('/api/leaderboard/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, score: newIq }),
      }).catch(() => {});
    }

    setScene('classroom');
  };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center relative">
      <div className="bg-gray-900 overflow-hidden relative shadow-2xl rounded-sm"
        style={{ width: 'min(100vw, calc(100vh * 16 / 9))', height: 'min(100vh, calc(100vw * 9 / 16))' }}
      >
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

        {(scene === 'start' || scene === 'store') && (
          <div className="absolute bottom-[4%] right-[2%] z-50">
            <IqLevel iqPoints={iqPoints} />
          </div>
        )}
      </div>
    </div>
  );
}
