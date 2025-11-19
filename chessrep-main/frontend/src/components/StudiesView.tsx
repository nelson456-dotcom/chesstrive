import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, FileText, Plus, Trash2, Edit3 } from 'lucide-react';

interface Chapter {
  id: number;
  name: string;
  pgn: string;
  headers: Record<string, string>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Study {
  id: number;
  name: string;
  active: boolean;
  chapters: Chapter[];
  currentChapterId?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudiesView: React.FC = () => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);

  // Load studies from localStorage
  useEffect(() => {
    try {
      const savedStudies = localStorage.getItem('chess-studies');
      if (savedStudies) {
        const parsed = JSON.parse(savedStudies);
        // Convert date strings back to Date objects
        const studiesWithDates = parsed.map((study: any) => ({
          ...study,
          createdAt: new Date(study.createdAt),
          updatedAt: new Date(study.updatedAt),
          chapters: study.chapters.map((chapter: any) => ({
            ...chapter,
            createdAt: new Date(chapter.createdAt),
            updatedAt: new Date(chapter.updatedAt)
          }))
        }));
        setStudies(studiesWithDates);
      }
    } catch (error) {
      console.error('Error loading studies from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStudyStats = () => {
    const totalStudies = studies.length;
    const totalChapters = studies.reduce((sum, study) => sum + study.chapters.length, 0);
    const lastUpdated = studies.reduce((latest, study) => 
      study.updatedAt > latest ? study.updatedAt : latest, 
      new Date(0)
    );

    return { totalStudies, totalChapters, lastUpdated };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading studies...</div>
      </div>
    );
  }

  const stats = getStudyStats();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <BookOpen className="w-8 h-8 mr-3 text-blue-600" />
          My Chess Studies
        </h1>
        <p className="text-gray-600">Manage your chess studies and chapters</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Studies</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudies}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Chapters</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalChapters}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-sm font-bold text-gray-900">
                {stats.lastUpdated.getTime() > 0 ? formatDate(stats.lastUpdated) : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Studies List */}
      <div className="space-y-6">
        {studies.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No studies yet</h3>
            <p className="text-gray-500 mb-6">Create your first chess study to get started</p>
            <button
              onClick={() => window.location.href = '/enhanced-chess-study'}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Study
            </button>
          </div>
        ) : (
          studies.map((study) => (
            <div key={study.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {study.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {study.chapters.length} chapter{study.chapters.length !== 1 ? 's' : ''}
                    </p>
                    
                    {/* Chapters List */}
                    <div className="space-y-2">
                      {study.chapters.map((chapter) => (
                        <div key={chapter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-gray-400 mr-3" />
                            <span className="text-sm font-medium text-gray-900">
                              {chapter.name}
                            </span>
                            {chapter.pgn && (
                              <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                {chapter.pgn.split(' ').length} moves
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Updated {formatDate(chapter.updatedAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="ml-6 flex space-x-2">
                    <button
                      onClick={() => window.location.href = `/enhanced-chess-study?study=${study.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Open Study
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement study editing
                        console.log('Edit study:', study.id);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    Created {formatDate(study.createdAt)}
                    <span className="mx-2">•</span>
                    Last updated {formatDate(study.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudiesView;
