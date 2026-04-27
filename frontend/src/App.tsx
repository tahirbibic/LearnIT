/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StartMenu } from './StartMenu';
import { Classroom } from './Classroom';
import { GreenboardMenu } from './GreenboardMenu';
import { TeachingMode } from './TeachingMode';
import { ExamMode } from './ExamMode';
import { Leaderboard } from './Leaderboard';
import { IqLevel } from './IqLevel';
import { Analytics } from './Analytics';

import { Store } from './Store';
import { STUDENTS } from './students';
import { StudentClassroom } from './StudentClassroom';
import { LearningMode } from './LearningMode';

type Scene = 'start' | 'classroom' | 'greenboard-menu' | 'store' | 'leaderboard' | 'teaching' | 'exam' | 'analytics' | 'student-classroom' | 'learning';

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
  const [scene, setScene] = useState<Scene>('start');
  const [userRole, setUserRole] = useState<'professor' | 'student' | null>(null);
  const [lessonText, setLessonText] = useState('');
  const [lastConfusion, setLastConfusion] = useState(50);
  const [iqPoints, setIqPoints] = useState(130);
  const [unlockedStudents, setUnlockedStudents] = useState<string[]>(['marko']);
  const [activeStudentId, setActiveStudentId] = useState<string>('marko');
  const [lastTranscript, setLastTranscript] = useState<Message[]>([]);
  const [studentLevel, setStudentLevel] = useState(1);
  const [learningLevel, setLearningLevel] = useState<'basic' | 'medium' | 'advanced'>('medium');
  const [history, setHistory] = useState<SessionRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('feynman_stats');
    if (saved) {
      const parsed = JSON.parse(saved);
      setIqPoints(parsed.iqPoints ?? 130);
      setStudentLevel(parsed.studentLevel ?? 1);
      setUnlockedStudents(parsed.unlockedStudents ?? ['marko']);
      setActiveStudentId(parsed.activeStudentId ?? 'marko');
      setHistory(parsed.history ?? []);
    }
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

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center relative">
      <div className="w-full max-w-6xl aspect-video bg-gray-900 overflow-hidden relative shadow-2xl rounded-sm">
        {scene === 'start' && (
          <StartMenu 
            onEnterProfessor={() => {
              setUserRole('professor');
              setScene('classroom');
            }}
            onEnterStudent={() => {
              setUserRole('student');
              setScene('student-classroom');
            }}
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
            onFinish={(earned, passed) => {
              setIqPoints(prev => prev + earned);
              if (passed && earned > 20) {
                setStudentLevel(prev => prev + 1);
              }
              setScene('classroom');
            }}
          />
        )}

        {scene === 'leaderboard' && (
          <Leaderboard 
            onBack={() => setScene('start')}
            iqPoints={iqPoints}
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

        {/* Global floating IQ Points Display - hidden in classroom */}
        {scene !== 'classroom' && (
           <div className="absolute bottom-[4%] right-[2%] z-50">
             <IqLevel iqPoints={iqPoints} />
           </div>
        )}

      </div>
    </div>
  );
}

